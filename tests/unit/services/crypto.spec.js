/**
 * SPDX-FileCopyrightText: 2026 Jakub Suchy <suchy@dwiggy.net>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
	setPassphrase,
	getPassphrase,
	clearPassphrase,
	encrypt,
	decrypt,
	encryptWithCached,
	decryptWithCached,
} from '@/services/crypto.js'

describe('crypto.js', () => {
	beforeEach(() => {
		clearPassphrase()
	})

	afterEach(() => {
		clearPassphrase()
	})

	describe('passphrase caching', () => {
		it('should cache passphrase in memory', () => {
			setPassphrase('test-passphrase')
			expect(getPassphrase()).toBe('test-passphrase')
		})

		it('should return null when no passphrase cached', () => {
			expect(getPassphrase()).toBeNull()
		})

		it('should clear cached passphrase', () => {
			setPassphrase('test-passphrase')
			clearPassphrase()
			expect(getPassphrase()).toBeNull()
		})

		it('should overwrite previous passphrase', () => {
			setPassphrase('old-passphrase')
			setPassphrase('new-passphrase')
			expect(getPassphrase()).toBe('new-passphrase')
		})

		it('should handle empty string passphrase', () => {
			setPassphrase('')
			expect(getPassphrase()).toBe('')
		})

		it('should handle very long passphrases', () => {
			const longPassphrase = 'a'.repeat(1000)
			setPassphrase(longPassphrase)
			expect(getPassphrase()).toBe(longPassphrase)
		})
	})

	describe('encrypt/decrypt', () => {
		it('should encrypt plaintext to Uint8Array', async () => {
			const plaintext = 'Hello, World!'
			const passphrase = 'test-passphrase'

			const ciphertext = await encrypt(plaintext, passphrase)

			expect(ciphertext).toBeInstanceOf(Uint8Array)
			expect(ciphertext.length).toBeGreaterThan(0)
		})

		it('should decrypt ciphertext back to plaintext', async () => {
			const plaintext = 'Secret message'
			const passphrase = 'test-passphrase'

			const ciphertext = await encrypt(plaintext, passphrase)
			const decrypted = await decrypt(ciphertext, passphrase)

			expect(decrypted).toBe(plaintext)
		})

		it('should fail decryption with wrong passphrase', async () => {
			const plaintext = 'Secret message'
			const ciphertext = await encrypt(plaintext, 'correct-password')

			await expect(
				decrypt(ciphertext, 'wrong-password'),
			).rejects.toThrow()
		})

		it('should handle empty plaintext', async () => {
			const ciphertext = await encrypt('', 'passphrase')
			const decrypted = await decrypt(ciphertext, 'passphrase')
			expect(decrypted).toBe('')
		})

		it('should handle unicode characters', async () => {
			const plaintext = 'Hello žš 🌍 üë'
			const passphrase = 'test-passphrase'

			const ciphertext = await encrypt(plaintext, passphrase)
			const decrypted = await decrypt(ciphertext, passphrase)

			expect(decrypted).toBe(plaintext)
		})

		it('should handle multiline text', async () => {
			const plaintext = 'Line 1\nLine 2\nLine 3'
			const passphrase = 'test-passphrase'

			const ciphertext = await encrypt(plaintext, passphrase)
			const decrypted = await decrypt(ciphertext, passphrase)

			expect(decrypted).toBe(plaintext)
		})

		it('should handle special characters', async () => {
			const plaintext = 'Special chars: !@#$%^&*(){}[]<>?/'
			const passphrase = 'test-passphrase'

			const ciphertext = await encrypt(plaintext, passphrase)
			const decrypted = await decrypt(ciphertext, passphrase)

			expect(decrypted).toBe(plaintext)
		})

		it('should handle very long text', { timeout: 10000 }, async () => {
			const plaintext = 'Lorem ipsum dolor sit amet. '.repeat(100)
			const passphrase = 'test-passphrase'

			const ciphertext = await encrypt(plaintext, passphrase)
			const decrypted = await decrypt(ciphertext, passphrase)

			expect(decrypted).toBe(plaintext)
		})

		it('should produce different ciphertext for same plaintext', async () => {
			const plaintext = 'Same message'
			const passphrase = 'test-passphrase'

			const ciphertext1 = await encrypt(plaintext, passphrase)
			const ciphertext2 = await encrypt(plaintext, passphrase)

			// Due to random salt/nonce, ciphertexts should differ
			expect(ciphertext1).not.toEqual(ciphertext2)
		})

		it('should decrypt ArrayBuffer input', async () => {
			const plaintext = 'Test message'
			const passphrase = 'test-passphrase'

			const ciphertext = await encrypt(plaintext, passphrase)
			const arrayBuffer = ciphertext.buffer

			const decrypted = await decrypt(arrayBuffer, passphrase)
			expect(decrypted).toBe(plaintext)
		})
	})

	describe('encryptWithCached/decryptWithCached', () => {
		it('should throw if no passphrase cached for encryption', async () => {
			await expect(
				encryptWithCached('test'),
			).rejects.toThrow('No passphrase cached')
		})

		it('should throw if no passphrase cached for decryption', async () => {
			const ciphertext = new Uint8Array([1, 2, 3])
			await expect(
				decryptWithCached(ciphertext),
			).rejects.toThrow('No passphrase cached')
		})

		it('should encrypt using cached passphrase', async () => {
			setPassphrase('my-passphrase')

			const ciphertext = await encryptWithCached('Hello')
			const decrypted = await decrypt(ciphertext, 'my-passphrase')

			expect(decrypted).toBe('Hello')
		})

		it('should decrypt using cached passphrase', async () => {
			const passphrase = 'my-passphrase'
			const ciphertext = await encrypt('Secret', passphrase)

			setPassphrase(passphrase)
			const decrypted = await decryptWithCached(ciphertext)

			expect(decrypted).toBe('Secret')
		})

		it('should use current cached passphrase', async () => {
			setPassphrase('first-passphrase')
			const ciphertext1 = await encryptWithCached('Message 1')

			setPassphrase('second-passphrase')
			const ciphertext2 = await encryptWithCached('Message 2')

			// Decrypt with matching passphrases
			expect(await decrypt(ciphertext1, 'first-passphrase')).toBe('Message 1')
			expect(await decrypt(ciphertext2, 'second-passphrase')).toBe('Message 2')
		})

		it('should work in complete workflow', async () => {
			// Encrypt with cached
			setPassphrase('workflow-passphrase')
			const encrypted = await encryptWithCached('Workflow test')

			// Simulate lock (clear passphrase)
			clearPassphrase()

			// Should fail without passphrase
			await expect(decryptWithCached(encrypted)).rejects.toThrow()

			// Re-enter passphrase
			setPassphrase('workflow-passphrase')

			// Should work again
			const decrypted = await decryptWithCached(encrypted)
			expect(decrypted).toBe('Workflow test')
		})
	})

	describe('passphrase cleanup on unload', () => {
		it('should clear passphrase on beforeunload event', () => {
			setPassphrase('test-passphrase')

			const event = new Event('beforeunload')
			window.dispatchEvent(event)

			expect(getPassphrase()).toBeNull()
		})

		it('should handle multiple unload events', () => {
			setPassphrase('test-passphrase')

			window.dispatchEvent(new Event('beforeunload'))
			window.dispatchEvent(new Event('beforeunload'))

			expect(getPassphrase()).toBeNull()
		})
	})

	describe('worker error handling', () => {
		it('should handle encryption errors gracefully', async () => {
			// Try to encrypt with invalid data types
			await expect(
				encrypt(null, 'passphrase'),
			).rejects.toThrow()
		})

		it('should handle decryption of invalid data', async () => {
			const invalidData = new Uint8Array([1, 2, 3, 4, 5])

			await expect(
				decrypt(invalidData, 'passphrase'),
			).rejects.toThrow()
		})

		it('should handle corrupted ciphertext', async () => {
			const plaintext = 'Test'
			const passphrase = 'test-passphrase'

			const ciphertext = await encrypt(plaintext, passphrase)

			// Corrupt the ciphertext
			ciphertext[0] = ciphertext[0] ^ 0xFF

			await expect(
				decrypt(ciphertext, passphrase),
			).rejects.toThrow()
		})
	})
})
