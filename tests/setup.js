/**
 * SPDX-FileCopyrightText: 2026 Jakub Suchy <suchy@dwiggy.net>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { vi } from 'vitest'

// Mock @nextcloud/dialogs to avoid CSS import issues
vi.mock('@nextcloud/dialogs', () => ({
	showError: vi.fn(),
	showWarning: vi.fn(),
	showSuccess: vi.fn(),
	showInfo: vi.fn(),
	spawnDialog: vi.fn(),
}))

// Mock @nextcloud/l10n
vi.mock('@nextcloud/l10n', () => ({
	translate: vi.fn((app, text) => text),
	translatePlural: vi.fn((app, singular, plural, count) => count === 1 ? singular : plural),
	getLanguage: vi.fn(() => 'en'),
	getLocale: vi.fn(() => 'en'),
}))

// Mock Nextcloud globals
global.OC = {
	filePath: vi.fn((app, type, file) => `/apps/${app}/${type}/${file}`),
	generateUrl: vi.fn((url) => url),
	imagePath: vi.fn((app, file) => `/apps/${app}/img/${file}`),
	PERMISSION_READ: 1,
	PERMISSION_UPDATE: 2,
	PERMISSION_CREATE: 4,
	PERMISSION_DELETE: 8,
	PERMISSION_SHARE: 16,
	PERMISSION_ALL: 31,
}

global.OCA = {
	Files: {
		fileActions: {
			registerAction: vi.fn(),
			setDefault: vi.fn(),
		},
	},
}

// Mock window.crypto if not available in test environment
if (!global.crypto) {
	global.crypto = {
		getRandomValues: (arr) => {
			for (let i = 0; i < arr.length; i++) {
				arr[i] = Math.floor(Math.random() * 256)
			}
			return arr
		},
		subtle: {},
	}
}

// Mock navigator.clipboard
if (!global.navigator.clipboard) {
	global.navigator.clipboard = {
		writeText: vi.fn(() => Promise.resolve()),
		readText: vi.fn(() => Promise.resolve('')),
	}
}
