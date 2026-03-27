/**
 * SPDX-FileCopyrightText: 2026 Jakub Suchy <suchy@dwiggy.net>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { showError } from '@nextcloud/dialogs'
import { translate as t } from '@nextcloud/l10n'
import { generateUrl } from '@nextcloud/router'

document.addEventListener('DOMContentLoaded', () => {
	const autoLockSelect = document.getElementById('auto_lock_minutes')
	const mnemonicWordsSelect = document.getElementById('mnemonic_words')
	const minPassphraseBitsSelect = document.getElementById('min_passphrase_bits')

	if (!autoLockSelect || !mnemonicWordsSelect || !minPassphraseBitsSelect) {
		return
	}

	const saveSetting = (settingName, value) => {
		// Get request token from Nextcloud global
		const requestToken = window.OC?.requestToken || ''

		// Send only the changed setting to backend API
		const payload = {}
		payload[settingName] = parseInt(value, 10)

		fetch(generateUrl('/apps/cage/api/v1/settings'), {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				requesttoken: requestToken,
			},
			credentials: 'same-origin',
			body: JSON.stringify(payload),
		})
			.then((response) => {
				if (!response.ok) {
					throw new Error(`HTTP ${response.status}: ${response.statusText}`)
				}
				return response.json()
			})
			.then((data) => {
				if (!data.success) {
					showError(t('cage', 'Error saving cage setting: {error}', { error: data.error || t('cage', 'Unknown error') }))
				}
			})
			.catch((error) => {
				showError(t('cage', 'Error saving cage settings: {error}', { error: error.message || error }))
			})
	}

	// Auto-save on change - save only the changed setting
	autoLockSelect.addEventListener('change', (e) => saveSetting('auto_lock_minutes', e.target.value))
	mnemonicWordsSelect.addEventListener('change', (e) => saveSetting('mnemonic_words', e.target.value))
	minPassphraseBitsSelect.addEventListener('change', (e) => saveSetting('min_passphrase_bits', e.target.value))
})
