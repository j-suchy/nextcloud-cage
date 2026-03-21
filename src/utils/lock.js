/**
 * SPDX-FileCopyrightText: 2026 Jakub Suchy <suchy@dwiggy.net>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { clearPassphrase } from '../services/crypto.js'

let lockTimer = null
let timeoutMinutes = 5
let onLockCallback = null
let eventListenersAttached = false

/**
 * Reset the lock timer
 */
function resetTimer() {
	if (timeoutMinutes === 0) {
		// Never lock
		return
	}

	clearTimeout(lockTimer)

	lockTimer = setTimeout(() => {
		triggerLock()
	}, timeoutMinutes * 60 * 1000)
}

/**
 * Trigger the lock action
 */
function triggerLock() {
	// Clear passphrase from memory
	clearPassphrase()

	// Call the lock callback
	if (onLockCallback) {
		onLockCallback()
	}
}

/**
 * Start the auto-lock timer
 *
 * @param {number} minutes - Timeout in minutes (0 = never lock)
 * @param {() => void} callback - Function to call when locking
 */
export function startLockTimer(minutes, callback) {
	timeoutMinutes = minutes
	onLockCallback = callback

	// If timeout is 0, don't set up the timer
	if (timeoutMinutes === 0) {
		return
	}

	// Attach event listeners if not already attached
	if (!eventListenersAttached) {
		['keydown', 'mousemove', 'click', 'touchstart', 'scroll'].forEach((event) => {
			document.addEventListener(event, resetTimer, { passive: true })
		})
		eventListenersAttached = true
	}

	// Start the initial timer
	resetTimer()
}

/**
 * Stop the auto-lock timer and remove event listeners
 */
export function stopLockTimer() {
	clearTimeout(lockTimer)
	lockTimer = null

	if (eventListenersAttached) {
		['keydown', 'mousemove', 'click', 'touchstart', 'scroll'].forEach((event) => {
			document.removeEventListener(event, resetTimer)
		})
		eventListenersAttached = false
	}
}

/**
 * Manually trigger a lock (for "Lock" button)
 */
export function manualLock() {
	triggerLock()
	stopLockTimer()
}

/**
 * Update the lock timeout
 *
 * @param {number} minutes - New timeout in minutes
 */
export function updateLockTimeout(minutes) {
	timeoutMinutes = minutes

	if (timeoutMinutes === 0) {
		// Disable auto-lock
		clearTimeout(lockTimer)
	} else {
		// Reset with new timeout
		resetTimer()
	}
}
