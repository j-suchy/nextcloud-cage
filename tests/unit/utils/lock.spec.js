/**
 * SPDX-FileCopyrightText: 2026 Jakub Suchy <suchy@dwiggy.net>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
	startLockTimer,
	stopLockTimer,
	updateLockTimeout,
	manualLock,
} from '@/utils/lock.js'
import { clearPassphrase, setPassphrase, getPassphrase } from '@/services/crypto.js'

describe('lock.js', () => {
	beforeEach(() => {
		vi.useFakeTimers()
		stopLockTimer()
		clearPassphrase()
	})

	afterEach(() => {
		stopLockTimer()
		clearPassphrase()
		vi.useRealTimers()
	})

	describe('startLockTimer', () => {
		it('should call callback after specified minutes', () => {
			const callback = vi.fn()

			startLockTimer(5, callback)
			vi.advanceTimersByTime(5 * 60 * 1000)

			expect(callback).toHaveBeenCalledOnce()
		})

		it('should call callback after 1 minute', () => {
			const callback = vi.fn()

			startLockTimer(1, callback)
			vi.advanceTimersByTime(60 * 1000)

			expect(callback).toHaveBeenCalledOnce()
		})

		it('should call callback after 15 minutes', () => {
			const callback = vi.fn()

			startLockTimer(15, callback)
			vi.advanceTimersByTime(15 * 60 * 1000)

			expect(callback).toHaveBeenCalledOnce()
		})

		it('should not lock if timeout is 0', () => {
			const callback = vi.fn()

			startLockTimer(0, callback)
			vi.advanceTimersByTime(60 * 60 * 1000) // 1 hour

			expect(callback).not.toHaveBeenCalled()
		})

		it('should clear passphrase when locking', () => {
			const callback = vi.fn()
			setPassphrase('test-passphrase')

			startLockTimer(5, callback)
			vi.advanceTimersByTime(5 * 60 * 1000)

			expect(getPassphrase()).toBeNull()
		})

		it('should reset timer on keydown', () => {
			const callback = vi.fn()

			startLockTimer(5, callback)
			vi.advanceTimersByTime(4 * 60 * 1000) // 4 minutes

			// Simulate user activity
			document.dispatchEvent(new KeyboardEvent('keydown'))
			vi.advanceTimersByTime(4 * 60 * 1000) // Another 4 minutes

			expect(callback).not.toHaveBeenCalled()

			vi.advanceTimersByTime(2 * 60 * 1000) // 2 more minutes = 5 total from reset
			expect(callback).toHaveBeenCalled()
		})

		it('should reset timer on mousemove', () => {
			const callback = vi.fn()

			startLockTimer(5, callback)
			vi.advanceTimersByTime(4 * 60 * 1000)

			document.dispatchEvent(new MouseEvent('mousemove'))
			vi.advanceTimersByTime(4 * 60 * 1000)

			expect(callback).not.toHaveBeenCalled()
		})

		it('should reset timer on click', () => {
			const callback = vi.fn()

			startLockTimer(5, callback)
			vi.advanceTimersByTime(4 * 60 * 1000)

			document.dispatchEvent(new MouseEvent('click'))
			vi.advanceTimersByTime(4 * 60 * 1000)

			expect(callback).not.toHaveBeenCalled()
		})

		it('should reset timer on touchstart', () => {
			const callback = vi.fn()

			startLockTimer(5, callback)
			vi.advanceTimersByTime(4 * 60 * 1000)

			document.dispatchEvent(new TouchEvent('touchstart'))
			vi.advanceTimersByTime(4 * 60 * 1000)

			expect(callback).not.toHaveBeenCalled()
		})

		it('should reset timer on scroll', () => {
			const callback = vi.fn()

			startLockTimer(5, callback)
			vi.advanceTimersByTime(4 * 60 * 1000)

			document.dispatchEvent(new Event('scroll'))
			vi.advanceTimersByTime(4 * 60 * 1000)

			expect(callback).not.toHaveBeenCalled()
		})

		it('should attach event listeners for activity detection', () => {
			const addEventSpy = vi.spyOn(document, 'addEventListener')

			startLockTimer(5, vi.fn())

			expect(addEventSpy).toHaveBeenCalledWith('keydown', expect.any(Function), expect.any(Object))
			expect(addEventSpy).toHaveBeenCalledWith('mousemove', expect.any(Function), expect.any(Object))
			expect(addEventSpy).toHaveBeenCalledWith('click', expect.any(Function), expect.any(Object))
			expect(addEventSpy).toHaveBeenCalledWith('touchstart', expect.any(Function), expect.any(Object))
			expect(addEventSpy).toHaveBeenCalledWith('scroll', expect.any(Function), expect.any(Object))

			addEventSpy.mockRestore()
		})

		it('should use passive event listeners', () => {
			const addEventSpy = vi.spyOn(document, 'addEventListener')

			startLockTimer(5, vi.fn())

			expect(addEventSpy).toHaveBeenCalledWith('keydown', expect.any(Function), { passive: true })

			addEventSpy.mockRestore()
		})

		it('should re-attach event listeners after stop and start', () => {
			const addEventSpy = vi.spyOn(document, 'addEventListener')
			addEventSpy.mockClear() // Clear any previous calls

			// First start - should attach 5 listeners
			startLockTimer(5, vi.fn())
			const firstCallCount = addEventSpy.mock.calls.length
			expect(firstCallCount).toBe(5) // keydown, mousemove, click, touchstart, scroll

			// Stop - removes listeners
			stopLockTimer()

			// Second start - should attach 5 listeners again
			startLockTimer(5, vi.fn())
			const secondCallCount = addEventSpy.mock.calls.length
			expect(secondCallCount).toBe(10) // 5 from first + 5 from second

			addEventSpy.mockRestore()
		})

		it('should handle rapid activity resets', () => {
			const callback = vi.fn()

			startLockTimer(5, callback)

			// Simulate rapid user activity
			for (let i = 0; i < 10; i++) {
				vi.advanceTimersByTime(30 * 1000) // 30 seconds
				document.dispatchEvent(new KeyboardEvent('keydown'))
			}

			expect(callback).not.toHaveBeenCalled()
		})
	})

	describe('stopLockTimer', () => {
		it('should stop the timer', () => {
			const callback = vi.fn()

			startLockTimer(5, callback)
			stopLockTimer()
			vi.advanceTimersByTime(10 * 60 * 1000)

			expect(callback).not.toHaveBeenCalled()
		})

		it('should remove event listeners', () => {
			const removeEventSpy = vi.spyOn(document, 'removeEventListener')

			startLockTimer(5, vi.fn())
			stopLockTimer()

			expect(removeEventSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
			expect(removeEventSpy).toHaveBeenCalledWith('mousemove', expect.any(Function))
			expect(removeEventSpy).toHaveBeenCalledWith('click', expect.any(Function))
			expect(removeEventSpy).toHaveBeenCalledWith('touchstart', expect.any(Function))
			expect(removeEventSpy).toHaveBeenCalledWith('scroll', expect.any(Function))

			removeEventSpy.mockRestore()
		})

		it('should handle being called without start', () => {
			expect(() => stopLockTimer()).not.toThrow()
		})

		it('should handle being called multiple times', () => {
			startLockTimer(5, vi.fn())
			stopLockTimer()
			stopLockTimer()
			stopLockTimer()

			expect(() => stopLockTimer()).not.toThrow()
		})

		it('should prevent activity from restarting timer', () => {
			const callback = vi.fn()

			startLockTimer(5, callback)
			stopLockTimer()

			document.dispatchEvent(new KeyboardEvent('keydown'))
			vi.advanceTimersByTime(10 * 60 * 1000)

			expect(callback).not.toHaveBeenCalled()
		})
	})

	describe('updateLockTimeout', () => {
		it('should update timeout and reset timer', () => {
			const callback = vi.fn()

			startLockTimer(5, callback)
			updateLockTimeout(10)

			vi.advanceTimersByTime(6 * 60 * 1000)
			expect(callback).not.toHaveBeenCalled()

			vi.advanceTimersByTime(5 * 60 * 1000)
			expect(callback).toHaveBeenCalled()
		})

		it('should disable lock when set to 0', () => {
			const callback = vi.fn()

			startLockTimer(5, callback)
			updateLockTimeout(0)

			vi.advanceTimersByTime(60 * 60 * 1000)
			expect(callback).not.toHaveBeenCalled()
		})

		it('should shorten timeout', () => {
			const callback = vi.fn()

			startLockTimer(10, callback)
			vi.advanceTimersByTime(2 * 60 * 1000)

			updateLockTimeout(3)

			vi.advanceTimersByTime(3 * 60 * 1000)
			expect(callback).toHaveBeenCalled()
		})

		it('should extend timeout', () => {
			const callback = vi.fn()

			startLockTimer(5, callback)
			vi.advanceTimersByTime(2 * 60 * 1000)

			updateLockTimeout(10)

			vi.advanceTimersByTime(6 * 60 * 1000)
			expect(callback).not.toHaveBeenCalled()

			vi.advanceTimersByTime(5 * 60 * 1000)
			expect(callback).toHaveBeenCalled()
		})

		it('should handle updating to same value', () => {
			const callback = vi.fn()

			startLockTimer(5, callback)
			updateLockTimeout(5)

			vi.advanceTimersByTime(5 * 60 * 1000)
			expect(callback).toHaveBeenCalled()
		})
	})

	describe('manualLock', () => {
		it('should trigger lock callback immediately', () => {
			const callback = vi.fn()

			startLockTimer(5, callback)
			manualLock()

			expect(callback).toHaveBeenCalledOnce()
		})

		it('should clear passphrase', () => {
			setPassphrase('test-passphrase')
			startLockTimer(5, vi.fn())

			manualLock()

			expect(getPassphrase()).toBeNull()
		})

		it('should work without starting timer', () => {
			const callback = vi.fn()
			setPassphrase('test-passphrase')

			// Don't start timer, but set up callback
			startLockTimer(5, callback)

			manualLock()

			expect(getPassphrase()).toBeNull()
			expect(callback).toHaveBeenCalled()
		})

		it('should not restart timer after manual lock', () => {
			const callback = vi.fn()

			startLockTimer(5, callback)
			manualLock()

			// Should have been called once
			expect(callback).toHaveBeenCalledTimes(1)

			// Should not be called again
			vi.advanceTimersByTime(10 * 60 * 1000)
			expect(callback).toHaveBeenCalledTimes(1)
		})
	})

	describe('integration scenarios', () => {
		it('should handle complete lock/unlock cycle', () => {
			const callback = vi.fn()

			// Start with passphrase
			setPassphrase('my-passphrase')
			startLockTimer(5, callback)

			// Wait until lock
			vi.advanceTimersByTime(5 * 60 * 1000)

			expect(callback).toHaveBeenCalled()
			expect(getPassphrase()).toBeNull()

			// Unlock again
			setPassphrase('my-passphrase')
			startLockTimer(5, callback)

			// Verify timer works again
			vi.advanceTimersByTime(4 * 60 * 1000)
			expect(callback).toHaveBeenCalledTimes(1)
		})

		it('should handle timeout changes during active session', () => {
			const callback = vi.fn()

			startLockTimer(10, callback)
			vi.advanceTimersByTime(3 * 60 * 1000)

			updateLockTimeout(5)
			vi.advanceTimersByTime(5 * 60 * 1000)

			expect(callback).toHaveBeenCalled()
		})

		it('should handle stop/start sequences', () => {
			const callback1 = vi.fn()
			const callback2 = vi.fn()

			startLockTimer(5, callback1)
			vi.advanceTimersByTime(2 * 60 * 1000)
			stopLockTimer()

			startLockTimer(5, callback2)
			vi.advanceTimersByTime(5 * 60 * 1000)

			expect(callback1).not.toHaveBeenCalled()
			expect(callback2).toHaveBeenCalled()
		})
	})
})
