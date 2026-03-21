/**
 * SPDX-FileCopyrightText: 2026 Jakub Suchy <suchy@dwiggy.net>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
	generatePassphrase,
	estimateEntropy,
	getStrengthRating,
	validatePassphrase,
	calculateDicewareEntropy,
} from '@/services/passphrase.js'

describe('passphrase.js', () => {
	describe('generatePassphrase', () => {
		it('should generate passphrase with default 6 words', () => {
			const passphrase = generatePassphrase()
			const words = passphrase.split('-')
			expect(words).toHaveLength(6)
			expect(passphrase).toMatch(/^[a-z]+-[a-z]+-[a-z]+-[a-z]+-[a-z]+-[a-z]+$/)
		})

		it('should generate passphrase with custom word count', () => {
			const passphrase = generatePassphrase(8)
			expect(passphrase.split('-')).toHaveLength(8)
		})

		it('should generate passphrase with 7 words', () => {
			const passphrase = generatePassphrase(7)
			expect(passphrase.split('-')).toHaveLength(7)
		})

		it('should only use words from wordlist', async () => {
			const { WORDLIST } = await import('@/utils/wordlist.js')
			const passphrase = generatePassphrase(6)
			const words = passphrase.split('-')

			words.forEach((word) => {
				expect(WORDLIST).toContain(word)
			})
		})

		it('should generate different passphrases on each call', () => {
			const pass1 = generatePassphrase()
			const pass2 = generatePassphrase()
			// Extremely unlikely to be the same with 7776^6 combinations
			expect(pass1).not.toBe(pass2)
		})

		it('should use crypto.getRandomValues for randomness', () => {
			const spy = vi.spyOn(crypto, 'getRandomValues')
			generatePassphrase()
			expect(spy).toHaveBeenCalled()
			spy.mockRestore()
		})

		it('should handle edge case of 1 word', () => {
			const passphrase = generatePassphrase(1)
			expect(passphrase.split('-')).toHaveLength(1)
		})
	})

	describe('estimateEntropy', () => {
		it('should return 0 for empty passphrase', () => {
			expect(estimateEntropy('')).toBe(0)
		})

		it('should estimate entropy for lowercase only', () => {
			const entropy = estimateEntropy('abcdefgh')
			expect(entropy).toBeGreaterThan(0)
			// 8 chars * log2(26) ≈ 37.6 bits
			expect(entropy).toBeCloseTo(37, 0)
		})

		it('should estimate higher entropy for mixed case', () => {
			const lowerEntropy = estimateEntropy('password')
			const mixedEntropy = estimateEntropy('PasSwoRd')
			expect(mixedEntropy).toBeGreaterThan(lowerEntropy)
		})

		it('should estimate higher entropy with numbers', () => {
			const noNumsEntropy = estimateEntropy('password')
			const withNumsEntropy = estimateEntropy('passw0rd')
			expect(withNumsEntropy).toBeGreaterThan(noNumsEntropy)
		})

		it('should estimate higher entropy with special chars', () => {
			const noSpecialEntropy = estimateEntropy('password')
			const withSpecialEntropy = estimateEntropy('passw@rd!')
			expect(withSpecialEntropy).toBeGreaterThan(noSpecialEntropy)
		})

		it('should handle all character types combined', () => {
			const entropy = estimateEntropy('P@ssw0rd!')
			// charset: 26 + 26 + 10 + 32 = 94
			// 9 * log2(94) ≈ 59 bits
			expect(entropy).toBeGreaterThan(55)
		})

		it('should handle very long passphrases', () => {
			const longPass = 'a'.repeat(100)
			const entropy = estimateEntropy(longPass)
			expect(entropy).toBeGreaterThan(400) // 100 * log2(26)
		})

		it('should handle unicode characters as special chars', () => {
			const entropy = estimateEntropy('pässwörd')
			expect(entropy).toBeGreaterThan(estimateEntropy('password'))
		})
	})

	describe('getStrengthRating', () => {
		it('should rate < 30 bits as weak/red', () => {
			const rating = getStrengthRating(20)
			expect(rating.level).toBe('weak')
			expect(rating.color).toBe('red')
			expect(rating.label).toBe('Weak')
			expect(rating.percentage).toBeLessThan(100)
		})

		it('should rate exactly 30 bits as moderate', () => {
			const rating = getStrengthRating(30)
			expect(rating.level).toBe('moderate')
			expect(rating.color).toBe('orange')
		})

		it('should rate 30-50 bits as moderate/orange', () => {
			const rating = getStrengthRating(40)
			expect(rating.level).toBe('moderate')
			expect(rating.color).toBe('orange')
			expect(rating.label).toBe('Moderate')
			expect(rating.percentage).toBeLessThan(100)
		})

		it('should rate exactly 50 bits as strong', () => {
			const rating = getStrengthRating(50)
			expect(rating.level).toBe('strong')
			expect(rating.color).toBe('green')
			expect(rating.percentage).toBe(100)
		})

		it('should rate >= 50 bits as strong/green', () => {
			const rating = getStrengthRating(77)
			expect(rating.level).toBe('strong')
			expect(rating.color).toBe('green')
			expect(rating.label).toBe('Strong')
			expect(rating.percentage).toBe(100)
		})

		it('should handle 0 bits', () => {
			const rating = getStrengthRating(0)
			expect(rating.level).toBe('weak')
			expect(rating.percentage).toBe(0)
		})

		it('should calculate percentage correctly in weak range', () => {
			const rating = getStrengthRating(15)
			expect(rating.percentage).toBeCloseTo(50, 0) // 15/30 * 100
		})

		it('should calculate percentage correctly in moderate range', () => {
			const rating = getStrengthRating(40)
			// (40 - 30) / 20 * 100 = 50
			expect(rating.percentage).toBeCloseTo(50, 0)
		})
	})

	describe('validatePassphrase', () => {
		it('should validate against minimum bits requirement', () => {
			const result = validatePassphrase('shortpass', 50)
			expect(result.isValid).toBe(false)
			expect(result.entropy).toBeLessThan(50)
			expect(result.required).toBe(50)
		})

		it('should pass validation for strong passphrase', () => {
			const result = validatePassphrase('V3ry$tr0ng!Pa$$phra5e', 50)
			expect(result.isValid).toBe(true)
			expect(result.entropy).toBeGreaterThanOrEqual(50)
		})

		it('should reject empty passphrase', () => {
			const result = validatePassphrase('', 30)
			expect(result.isValid).toBe(false)
			expect(result.entropy).toBe(0)
		})

		it('should validate at exact threshold', () => {
			// Create a passphrase that's exactly at threshold
			const result = validatePassphrase('Ab1!', 30)
			// charset: 26+26+10+32 = 94, 4 * log2(94) ≈ 26 bits
			expect(result.isValid).toBe(false)
		})

		it('should include all relevant data in result', () => {
			const result = validatePassphrase('test', 50)
			expect(result).toHaveProperty('isValid')
			expect(result).toHaveProperty('entropy')
			expect(result).toHaveProperty('required')
		})
	})

	describe('calculateDicewareEntropy', () => {
		it('should calculate ~77 bits for 6 words', () => {
			const entropy = calculateDicewareEntropy(6)
			// log2(7776^6) = 6 * log2(7776) ≈ 77.5
			expect(entropy).toBeCloseTo(77, 0)
		})

		it('should calculate ~90 bits for 7 words', () => {
			const entropy = calculateDicewareEntropy(7)
			// log2(7776^7) = 7 * log2(7776) ≈ 90.4
			expect(entropy).toBeCloseTo(90, 0)
		})

		it('should calculate ~103 bits for 8 words', () => {
			const entropy = calculateDicewareEntropy(8)
			// log2(7776^8) = 8 * log2(7776) ≈ 103.4
			expect(entropy).toBeCloseTo(103, 0)
		})

		it('should handle custom wordlist size', () => {
			const entropy = calculateDicewareEntropy(6, 10000)
			expect(entropy).toBeGreaterThan(calculateDicewareEntropy(6, 7776))
		})

		it('should return 0 for 0 words', () => {
			const entropy = calculateDicewareEntropy(0)
			expect(entropy).toBe(0)
		})

		it('should return integer values', () => {
			const entropy = calculateDicewareEntropy(6)
			expect(entropy).toBe(Math.floor(entropy))
		})
	})
})
