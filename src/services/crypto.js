/**
 * SPDX-FileCopyrightText: 2026 Jakub Suchy <suchy@dwiggy.net>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { showError } from '@nextcloud/dialogs'
import { translate as t } from '@nextcloud/l10n'
import CryptoWorker from './crypto.worker.js?worker'

// Module-scoped variable - never persisted
let cachedPassphrase = null

// Web Worker instance
let worker = null
let messageId = 0
const pendingOperations = new Map()

/**
 * Initialize the Web Worker
 */
function initWorker() {
	if (!worker) {
		worker = new CryptoWorker()

		worker.addEventListener('message', (event) => {
			const { id, type, result, error } = event.data
			const pending = pendingOperations.get(id)

			if (pending) {
				pendingOperations.delete(id)
				if (type === 'success') {
					pending.resolve(result)
				} else {
					pending.reject(new Error(error))
				}
			}
		})

		worker.addEventListener('error', (event) => {
			showError(t('cage', 'Encryption worker error: {error}', { error: event.message || t('cage', 'Unknown error') }))
			// Reject all pending operations
			for (const [id, pending] of pendingOperations.entries()) {
				pending.reject(new Error(t('cage', 'Worker error: {error}', { error: event.message || t('cage', 'Unknown worker error') })))
				pendingOperations.delete(id)
			}
		})

		worker.addEventListener('messageerror', () => {
			showError(t('cage', 'Encryption worker failed to deserialize message'))
			// Reject all pending operations
			for (const [id, pending] of pendingOperations.entries()) {
				pending.reject(new Error(t('cage', 'Worker message error: Failed to deserialize message')))
				pendingOperations.delete(id)
			}
		})
	}
	return worker
}

/**
 * Send a message to the worker and return a promise
 *
 * @param {string} type The type of operation ('encrypt' or 'decrypt')
 * @param {object} data The data to send to the worker
 * @return {Promise<string>} The decrypted plaintext
 */
function sendToWorker(type, data) {
	const id = messageId++
	const currentWorker = initWorker()

	return new Promise((resolve, reject) => {
		// Add timeout to detect stuck operations
		const timeout = setTimeout(() => {
			if (pendingOperations.has(id)) {
				pendingOperations.delete(id)
				reject(new Error(t('cage', 'Worker operation timeout')))
			}
		}, 30000) // 30 second timeout

		pendingOperations.set(id, {
			resolve: (result) => {
				clearTimeout(timeout)
				resolve(result)
			},
			reject: (error) => {
				clearTimeout(timeout)
				reject(error)
			},
		})

		currentWorker.postMessage({ id, type, data })
	})
}

/**
 * Set the passphrase in memory
 *
 * @param {string} passphrase - The passphrase to cache
 */
export function setPassphrase(passphrase) {
	cachedPassphrase = passphrase
}

/**
 * Get the cached passphrase
 *
 * @return {string|null} The cached passphrase or null
 */
export function getPassphrase() {
	return cachedPassphrase
}

/**
 * Clear the passphrase from memory
 */
export function clearPassphrase() {
	cachedPassphrase = null
}

/**
 * Encrypt plaintext with a passphrase using Age encryption
 *
 * @param {string} plaintext - The text to encrypt
 * @param {string} passphrase - The passphrase to use for encryption
 * @return {Promise<Uint8Array>} The encrypted ciphertext as binary
 */
export async function encrypt(plaintext, passphrase) {
	const resultArray = await sendToWorker('encrypt', { plaintext, passphrase })
	return new Uint8Array(resultArray)
}

/**
 * Decrypt ciphertext with a passphrase using Age encryption
 *
 * @param {Uint8Array|ArrayBuffer|string} ciphertext - The encrypted data
 * @param {string} passphrase - The passphrase to use for decryption
 * @return {Promise<string>} The decrypted plaintext
 * @throws {Error} If decryption fails (wrong passphrase, corrupted file, etc.)
 */
export async function decrypt(ciphertext, passphrase) {
	// Convert ArrayBuffer to Uint8Array if needed
	let data = ciphertext

	if (ciphertext instanceof ArrayBuffer) {
		data = new Uint8Array(ciphertext)
	}

	// Convert Uint8Array to regular array for worker transfer
	const dataArray = Array.from(data)

	const result = await sendToWorker('decrypt', { ciphertext: dataArray, passphrase })
	return result
}

/**
 * Encrypt plaintext using the cached passphrase
 *
 * @param {string} plaintext - The text to encrypt
 * @return {Promise<Uint8Array>} The encrypted ciphertext
 * @throws {Error} If no passphrase is cached
 */
export async function encryptWithCached(plaintext) {
	if (!cachedPassphrase) {
		throw new Error(t('cage', 'No passphrase cached'))
	}
	return encrypt(plaintext, cachedPassphrase)
}

/**
 * Decrypt ciphertext using the cached passphrase
 *
 * @param {Uint8Array|ArrayBuffer} ciphertext - The encrypted data
 * @return {Promise<string>} The decrypted plaintext
 * @throws {Error} If no passphrase is cached or decryption fails
 */
export async function decryptWithCached(ciphertext) {
	if (!cachedPassphrase) {
		throw new Error(t('cage', 'No passphrase cached'))
	}
	return decrypt(ciphertext, cachedPassphrase)
}

// Clear passphrase on page unload
window.addEventListener('beforeunload', () => {
	clearPassphrase()
})
