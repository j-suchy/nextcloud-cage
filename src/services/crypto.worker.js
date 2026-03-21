/**
 * SPDX-FileCopyrightText: 2026 Jakub Suchy <suchy@dwiggy.net>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import * as age from 'age-encryption'

/**
 * Web Worker for handling encryption/decryption operations
 * This runs in a separate thread to avoid blocking the UI
 */

self.addEventListener('message', async (event) => {
	const { id, type, data } = event.data

	try {
		let result

		switch (type) {
			case 'encrypt':
				result = await performEncrypt(data.plaintext, data.passphrase)
				self.postMessage({ id, type: 'success', result })
				break

			case 'decrypt':
				result = await performDecrypt(data.ciphertext, data.passphrase)
				self.postMessage({ id, type: 'success', result })
				break

			default:
				throw new Error(`Unknown operation type: ${type}`)
		}
	} catch (error) {
		self.postMessage({
			id,
			type: 'error',
			error: error.message || error.toString(),
		})
	}
})

/**
 * Encrypt plaintext with a passphrase
 *
 * @param {string} plaintext The text to encrypt
 * @param {string} passphrase The passphrase to use for encryption
 * @return {Array} The encrypted data as an array (for transfer)
 */
async function performEncrypt(plaintext, passphrase) {
	const encrypter = new age.Encrypter()
	encrypter.setPassphrase(passphrase)
	const ciphertext = await encrypter.encrypt(plaintext)
	// Convert Uint8Array to regular array for transfer
	return Array.from(ciphertext)
}

/**
 * Decrypt ciphertext with a passphrase
 *
 * @param {Array} ciphertext The encrypted data as an array
 * @param {string} passphrase The passphrase to use for decryption
 * @return {string} The decrypted plaintext
 * @throws {Error} Throws 'NOT_RECIPIENT' if the passphrase is incorrect, or 'CORRUPTED_FILE' for other decryption errors
 */
async function performDecrypt(ciphertext, passphrase) {
	// Convert array back to Uint8Array
	const data = new Uint8Array(ciphertext)

	try {
		const decrypter = new age.Decrypter()
		decrypter.addPassphrase(passphrase)

		const bytes = await decrypter.decrypt(data)
		const text = new TextDecoder().decode(bytes)

		return text
	} catch (error) {
		// Re-throw with more specific error information
		if (error.message && error.message.includes('recipient')) {
			throw new Error('NOT_RECIPIENT', { cause: error })
		} else {
			throw new Error('CORRUPTED_FILE', { cause: error })
		}
	}
}
