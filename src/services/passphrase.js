/**
 * SPDX-FileCopyrightText: 2026 Jakub Suchy <suchy@dwiggy.net>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { translate as t } from '@nextcloud/l10n'
import { WORDLIST } from '../utils/wordlist.js'

/**
 * Generate a random mnemonic passphrase using the EFF diceware word list
 * Uses crypto.getRandomValues() for cryptographically secure randomness
 *
 * EFF large diceware list: 7776 words
 * 6 words = log2(7776^6) ≈ 77 bits entropy
 * 7 words = log2(7776^7) ≈ 90 bits entropy
 * 8 words = log2(7776^8) ≈ 103 bits entropy
 *
 * @param {number} wordCount - Number of words to generate (default: 6)
 * @return {string} The generated passphrase with words separated by hyphens
 */
export function generatePassphrase(wordCount = 6) {
	const array = new Uint32Array(wordCount)
	crypto.getRandomValues(array)

	const words = Array.from(array).map((n) => WORDLIST[n % WORDLIST.length])

	return words.join('-')
}

/**
 * Estimate the entropy (in bits) of a passphrase
 * This is a simple character-set based estimation
 *
 * @param {string} passphrase - The passphrase to analyze
 * @return {number} Estimated entropy in bits
 */
export function estimateEntropy(passphrase) {
	const length = passphrase.length

	if (length === 0) {
		return 0
	}

	let charsetSize = 0

	// Check for different character types
	if (/[a-z]/.test(passphrase)) {
		charsetSize += 26
	}
	if (/[A-Z]/.test(passphrase)) {
		charsetSize += 26
	}
	if (/[0-9]/.test(passphrase)) {
		charsetSize += 10
	}
	if (/[^a-zA-Z0-9]/.test(passphrase)) {
		charsetSize += 32
	}

	if (charsetSize === 0) {
		return 0
	}

	return Math.floor(length * Math.log2(charsetSize))
}

/**
 * Get a strength rating for a passphrase based on entropy
 *
 * @param {number} entropy - The entropy in bits
 * @return {object} Strength rating with level, color, and label
 */
export function getStrengthRating(entropy) {
	if (entropy < 30) {
		return {
			level: 'weak',
			color: 'red',
			label: t('cage', 'Weak'),
			percentage: Math.min((entropy / 30) * 100, 100),
		}
	} else if (entropy < 50) {
		return {
			level: 'moderate',
			color: 'orange',
			label: t('cage', 'Moderate'),
			percentage: Math.min(((entropy - 30) / 20) * 100, 100),
		}
	} else {
		return {
			level: 'strong',
			color: 'green',
			label: t('cage', 'Strong'),
			percentage: 100,
		}
	}
}

/**
 * Validate passphrase against minimum strength requirement
 *
 * @param {string} passphrase - The passphrase to validate
 * @param {number} minBits - Minimum required entropy in bits
 * @return {object} Validation result with isValid and entropy
 */
export function validatePassphrase(passphrase, minBits) {
	const entropy = estimateEntropy(passphrase)
	return {
		isValid: entropy >= minBits,
		entropy,
		required: minBits,
	}
}

/**
 * Calculate entropy for a diceware passphrase
 * (more accurate than character-based estimation)
 *
 * @param {number} wordCount - Number of words in the passphrase
 * @param {number} wordListSize - Size of the word list (default: 7776)
 * @return {number} Entropy in bits
 */
export function calculateDicewareEntropy(wordCount, wordListSize = 7776) {
	return Math.floor(wordCount * Math.log2(wordListSize))
}
