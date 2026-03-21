<!--
  - SPDX-FileCopyrightText: 2026 Jakub Suchy <suchy@dwiggy.net>
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->
<template>
	<NcContent appName="cage" class="cage-app">
		<!-- Loading Dialog -->
		<LoadingDialog
			v-if="showProgress"
			:message="progressMessage"
			:details="progressDetails" />

		<!-- Passphrase Dialog (LOCKED state - initial unlock) -->
		<PassphraseDialog
			v-if="state === 'LOCKED' && !isLockScreen"
			:title="fileName"
			:error="error"
			:isLoading="isDecrypting"
			:submitLabel="t('cage', 'Decrypt')"
			@submit="handleUnlock"
			@cancel="handleClose" />

		<!-- Passphrase Dialog (LOCKED state - lock screen)  -->
		<PassphraseDialog
			v-if="state === 'LOCKED' && isLockScreen"
			:title="t('cage', 'cage — Locked')"
			:message="lockReason === 'auto' ? t('cage', 'Session locked due to inactivity. Please enter the passphrase to unlock.') : t('cage', 'Session locked. Please enter the passphrase to unlock.')"
			:error="error"
			:isLoading="isDecrypting"
			:submitLabel="t('cage', 'Unlock')"
			@submit="handleUnlock"
			@cancel="handleClose" />

		<!-- New File Dialog -->
		<CreatePassphraseDialog
			v-if="state === 'NEW_FILE'"
			:wordCount="settings.mnemonic_words"
			:minPassphraseBits="settings.min_passphrase_bits"
			@create="handleCreateNewFile"
			@cancel="handleClose" />

		<!-- Change Passphrase Dialog -->
		<CreatePassphraseDialog
			v-if="showChangePassphraseDialog"
			mode="change"
			:wordCount="settings.mnemonic_words"
			:minPassphraseBits="settings.min_passphrase_bits"
			@create="handleChangePassphrase"
			@cancel="showChangePassphraseDialog = false" />

		<!-- Main Content Area (UNLOCKED/EDITING states) -->
		<NcAppContent v-if="state === 'UNLOCKED' || state === 'EDITING'" class="cage-main-content">
			<!-- Header -->
			<div class="cage-header">
				<div class="cage-file-info">
					<img :src="appIconUrl" alt="age file" class="cage-file-icon">
					<h1 class="cage-file-name">
						{{ fileName }}
					</h1>
				</div>
				<div class="cage-header-actions">
					<NcChip v-if="isReadOnly" type="secondary" noClose>
						{{ t('cage', 'Read-only') }}
					</NcChip>
					<NcActions :forceName="true" :inline="2">
						<NcActionButton
							v-if="state === 'UNLOCKED' && !isReadOnly"
							type="primary"
							@click="enterEditMode">
							<template #icon>
								<Pencil :size="20" />
							</template>
							{{ t('cage', 'Edit') }}
						</NcActionButton>
						<NcActionButton
							v-if="state === 'EDITING'"
							type="primary"
							@click="saveAndView">
							<template #icon>
								<ContentSave :size="20" />
							</template>
							{{ t('cage', 'Save') }}
						</NcActionButton>
						<NcActionButton @click="handleClose">
							<template #icon>
								<Close :size="20" />
							</template>
							{{ t('cage', 'Close') }}
						</NcActionButton>
						<NcActionButton
							v-if="(state === 'UNLOCKED' || state === 'EDITING') && !isReadOnly"
							@click="showChangePassphrase">
							<template #icon>
								<Key :size="20" />
							</template>
							{{ t('cage', 'Change Passphrase') }}
						</NcActionButton>
						<NcActionButton @click="lockManually">
							<template #icon>
								<Lock :size="20" />
							</template>
							{{ t('cage', 'Lock') }}
						</NcActionButton>
					</NcActions>
				</div>
			</div>

			<!-- Editor/Viewer -->
			<div class="cage-content-area">
				<textarea
					v-model="decryptedContent"
					:readonly="state === 'UNLOCKED'"
					class="cage-plaintext-editor" />
			</div>

			<!-- Status Bar -->
			<div class="cage-status-bar">
				<span v-if="saveStatus">{{ saveStatus }}</span>
				<span v-if="settings.auto_lock_minutes > 0">
					{{ t('cage', 'Auto-lock: {minutes} min', { minutes: settings.auto_lock_minutes }) }}
				</span>
			</div>
		</NcAppContent>
	</NcContent>
</template>

<script>
import { translate as t } from '@nextcloud/l10n'
import { getLoggerBuilder } from '@nextcloud/logger'
import { getAppRootUrl } from '@nextcloud/router'
import { NcActionButton, NcActions, NcAppContent, NcChip, NcContent } from '@nextcloud/vue'
import Close from 'vue-material-design-icons/Close.vue'
import ContentSave from 'vue-material-design-icons/ContentSave.vue'
import Key from 'vue-material-design-icons/Key.vue'
import Lock from 'vue-material-design-icons/Lock.vue'
import Pencil from 'vue-material-design-icons/Pencil.vue'
import CreatePassphraseDialog from './CreatePassphraseDialog.vue'
import LoadingDialog from './LoadingDialog.vue'
import PassphraseDialog from './PassphraseDialog.vue'
import { clearPassphrase, decrypt, encrypt, getPassphrase, setPassphrase } from '../services/crypto.js'
import { fetchFile, getFileInfo, getFilePathFromContext, saveFile } from '../services/fileApi.js'
import { startLockTimer, stopLockTimer } from '../utils/lock.js'

const logger = getLoggerBuilder()
	.setApp('mail')
	.detectUser()
	.build()

const STATE = {
	CLOSED: 'CLOSED',
	NEW_FILE: 'NEW_FILE',
	LOCKED: 'LOCKED',
	UNLOCKED: 'UNLOCKED',
	EDITING: 'EDITING',
}

export default {
	name: 'CageApp',
	components: {
		NcActionButton,
		NcActions,
		NcAppContent,
		NcChip,
		NcContent,
		Pencil,
		ContentSave,
		Key,
		Lock,
		Close,
		PassphraseDialog,
		CreatePassphraseDialog,
		LoadingDialog,
	},

	data() {
		return {
			state: STATE.CLOSED,
			filePath: '',
			fileName: 'cage',
			encryptedData: null,
			decryptedContent: '',
			error: '',
			isLockScreen: false,
			lockReason: null, // 'auto' for auto-lock, 'manual' for manual lock
			saveStatus: '',
			isDecrypting: false,
			showProgress: false,
			progressMessage: '',
			progressDetails: '',
			isReadOnly: false,
			showChangePassphraseDialog: false,
			settings: {
				auto_lock_minutes: 5,
				mnemonic_words: 6,
				min_passphrase_bits: 50,
			},

			appIconUrl: window.OC.filePath('cage', 'img', 'app-icon.svg'),
		}
	},

	async mounted() {
		// Calculate Nextcloud header height dynamically
		this.adjustForHeader()

		// Load settings from template data
		this.loadSettings()

		// Add beforeunload handler to warn about unsaved changes
		window.addEventListener('beforeunload', this.handleBeforeUnload)

		// Get file path from context
		this.filePath = getFilePathFromContext()

		if (this.filePath) {
			this.fileName = this.filePath.split('/').pop()

			try {
				// Check file permissions
				const fileInfo = await getFileInfo(this.filePath)
				this.isReadOnly = fileInfo.isReadOnly

				// Fetch the file
				this.encryptedData = await fetchFile(this.filePath)

				// Check if file is empty (new uninitialized file)
				if (this.encryptedData.byteLength <= 1) {
					// Empty file - show new file dialog for passphrase creation (only if writable)
					if (!this.isReadOnly) {
						this.encryptedData = null
					} else {
						this.error = t('cage', 'Cannot initialize empty readonly file')
					}
					this.state = STATE.NEW_FILE
				} else {
					// Non-empty file - show unlock dialog (state is LOCKED)
					this.state = STATE.LOCKED
				}
			} catch (err) {
				this.error = t('cage', 'Failed to load file: {error}', { error: err.message })
				this.state = STATE.LOCKED
			}
		}
	},

	beforeUnmount() {
		// Remove beforeunload handler
		window.removeEventListener('beforeunload', this.handleBeforeUnload)

		// Stop lock timer and clear passphrase
		stopLockTimer()
		clearPassphrase()
	},

	methods: {
		t,

		/**
		 * Handle beforeunload event to warn about unsaved changes
		 *
		 * @param {Event} event - The beforeunload event
		 */
		handleBeforeUnload(event) {
			if (this.state === STATE.EDITING) {
				// Modern browsers require returnValue to be set
				event.preventDefault()
				event.returnValue = ''
				return ''
			}
		},

		/**
		 * Adjust app positioning to account for Nextcloud header
		 */
		adjustForHeader() {
			// Try to find Nextcloud's header element
			const header = document.querySelector('#header')
				|| document.querySelector('header')
				|| document.querySelector('.header')

			if (header) {
				const headerHeight = header.offsetHeight
				const appEl = document.getElementById('cage-app')
				if (appEl) {
					appEl.style.setProperty('--header-height', `${headerHeight}px`)
				}
			}
		},

		/**
		 * Load settings from the template data attribute
		 */
		loadSettings() {
			const appEl = document.getElementById('cage-app')
			const settingsJson = appEl?.dataset.settings

			if (settingsJson) {
				try {
					this.settings = JSON.parse(settingsJson)
				} catch (err) {
					logger.error('Failed to parse settings JSON, using defaults', { error: err })
				}
			}
		},

		/**
		 * Handle passphrase submission for unlocking
		 *
		 * @param {string} passphrase - The passphrase to use for decryption
		 */
		async handleUnlock(passphrase) {
			this.error = ''
			this.isDecrypting = true

			// Show progress dialog
			this.showProgress = true
			this.progressMessage = t('cage', 'Decrypting file…')
			this.progressDetails = t('cage', 'Please wait while the file is being decrypted')

			// Wait for Vue to render the progress dialog and browser to paint
			await this.$nextTick()
			await new Promise((resolve) => setTimeout(resolve, 50))

			try {
				// Decrypt the file (runs in Web Worker)
				const plaintext = await decrypt(this.encryptedData, passphrase)

				// Success! Cache the passphrase and show content
				setPassphrase(passphrase)
				this.decryptedContent = plaintext
				this.state = STATE.UNLOCKED
				this.isLockScreen = false
				this.lockReason = null
				this.isDecrypting = false
				this.showProgress = false

				// Start auto-lock timer
				if (this.settings.auto_lock_minutes > 0) {
					this.startAutoLock()
				}
			} catch (err) {
				this.isDecrypting = false
				this.showProgress = false
				// Handle decryption errors
				if (err.message === 'NOT_RECIPIENT') {
					this.error = t('cage', 'Incorrect passphrase or this file is not passphrase-encrypted.')
				} else if (err.message === 'CORRUPTED_FILE') {
					this.error = t('cage', 'File could not be decrypted. It may be corrupted or not a valid age file.')
				} else {
					this.error = t('cage', 'Decryption failed: {error}', { error: err.message })
				}
			}
		},

		/**
		 * Enter edit mode
		 */
		enterEditMode() {
			this.state = STATE.EDITING
		},

		/**
		 * Save and return to view mode
		 */
		async saveAndView() {
			try {
				this.saveStatus = t('cage', 'Saving…')

				// Show progress dialog
				this.showProgress = true
				this.progressMessage = t('cage', 'Encrypting and saving…')
				this.progressDetails = t('cage', 'Please wait while the file is being encrypted and saved')

				// Wait for Vue to render the progress dialog and browser to paint
				await this.$nextTick()
				await new Promise((resolve) => setTimeout(resolve, 50))

				// Re-encrypt with the cached passphrase (runs in Web Worker)
				const ciphertext = await encrypt(this.decryptedContent, getPassphrase())

				// Save to Nextcloud
				await saveFile(this.filePath, ciphertext)

				this.showProgress = false
				this.saveStatus = t('cage', 'Saved!')
				setTimeout(() => {
					this.saveStatus = ''
				}, 3000)

				// Update local state
				this.encryptedData = ciphertext
				this.state = STATE.UNLOCKED
			} catch (err) {
				this.showProgress = false
				this.error = t('cage', 'Save failed: {error}', { error: err.message })
				this.saveStatus = t('cage', 'Save failed!')
				// Keep in EDITING mode so user doesn't lose their work
			}
		},

		/**
		 * Manually lock the session
		 */
		lockManually() {
			// Warn if there are unsaved changes in edit mode
			if (this.state === STATE.EDITING) {
				window.OC.dialogs.confirm(
					t('cage', 'You have unsaved changes. Locking will discard them. Are you sure?'),
					t('cage', 'Unsaved Changes'),
					(confirmed) => {
						if (confirmed) {
							this.handleLock('manual')
						}
					},
					true, // modal
				)
				return
			}

			this.handleLock('manual')
		},

		/**
		 * Handle lock action (auto or manual)
		 *
		 * @param {string} reason - The reason for locking ('auto' or 'manual')
		 */
		handleLock(reason = 'manual') {
			// Clear decrypted content
			this.decryptedContent = ''

			// Clear passphrase from memory
			clearPassphrase()

			// Set state to locked with lock screen
			this.state = STATE.LOCKED
			this.isLockScreen = true
			this.lockReason = reason
			this.error = ''

			// Stop lock timer
			stopLockTimer()
		},

		/**
		 * Start auto-lock timer
		 */
		startAutoLock() {
			startLockTimer(this.settings.auto_lock_minutes, () => {
				this.handleLock('auto')
			})
		},

		/**
		 * Handle close/cancel action
		 */
		handleClose() {
			// Warn if there are unsaved changes in edit mode
			if (this.state === STATE.EDITING) {
				window.OC.dialogs.confirm(
					t('cage', 'You have unsaved changes. Are you sure you want to close without saving?'),
					t('cage', 'Unsaved Changes'),
					(confirmed) => {
						if (confirmed) {
							this.performClose()
						}
					},
					true, // modal
				)
				return
			}

			this.performClose()
		},

		/**
		 * Perform the actual close operation
		 */
		performClose() {
			// Clear decrypted content
			this.decryptedContent = ''

			// Clear everything
			stopLockTimer()
			clearPassphrase()

			// Navigate back to the folder containing the file
			const directory = this.filePath.substring(0, this.filePath.lastIndexOf('/'))
			const params = new URLSearchParams({ dir: directory || '/' })
			const url = getAppRootUrl('files') + '?' + params.toString()

			window.location.href = url
		},

		/**
		 * Show change passphrase dialog
		 */
		showChangePassphrase() {
			this.showChangePassphraseDialog = true
		},

		/**
		 * Handle passphrase change
		 *
		 * @param {string} newPassphrase - The new passphrase
		 */
		async handleChangePassphrase(newPassphrase) {
			try {
				this.showProgress = true
				this.progressMessage = t('cage', 'Changing passphrase…')
				this.progressDetails = t('cage', 'Re-encrypting file with new passphrase')

				await this.$nextTick()
				await new Promise((resolve) => setTimeout(resolve, 50))

				// Re-encrypt content with new passphrase
				const ciphertext = await encrypt(this.decryptedContent, newPassphrase)

				// Save to Nextcloud
				await saveFile(this.filePath, ciphertext)

				// Update cached passphrase and state
				setPassphrase(newPassphrase)
				this.encryptedData = ciphertext

				this.showProgress = false
				this.showChangePassphraseDialog = false

				this.saveStatus = t('cage', 'Passphrase changed successfully!')
				setTimeout(() => {
					this.saveStatus = ''
				}, 3000)
			} catch (err) {
				this.showProgress = false
				this.showChangePassphraseDialog = false
				logger.error('Failed to change passphrase', { error: err })
				this.saveStatus = t('cage', 'Failed to change passphrase: {error}', { error: err.message })
			}
		},

		/**
		 * Handle new file initialization (encrypt empty file with passphrase)
		 *
		 * @param {string} passphrase - The passphrase to use for encryption
		 */
		async handleCreateNewFile(passphrase) {
			try {
				// Show progress dialog
				this.showProgress = true
				this.progressMessage = t('cage', 'Creating encrypted file…')
				this.progressDetails = t('cage', 'Please wait while the file is being initialized')

				// Wait for Vue to render the progress dialog and browser to paint
				await this.$nextTick()
				await new Promise((resolve) => setTimeout(resolve, 50))

				// Create initial empty content and encrypt it (runs in Web Worker)
				const initialContent = ''
				const ciphertext = await encrypt(initialContent, passphrase)

				// Save encrypted content to the file
				await saveFile(this.filePath, ciphertext)

				// Set up state for editing
				this.encryptedData = ciphertext
				setPassphrase(passphrase)
				this.decryptedContent = initialContent
				this.state = STATE.EDITING
				this.showProgress = false

				// Start auto-lock
				this.startAutoLock()
			} catch (err) {
				this.showProgress = false
				this.error = `Failed to initialize file: ${err.message}`
			}
		},
	},
}
</script>

<style scoped>
.cage-app {
	--header-height: 50px; /* Default fallback */
	position: fixed;
	top: var(--header-height);
	left: 0;
	width: 100%;
	height: calc(100% - var(--header-height));
	display: flex;
	flex-direction: column;
	background: var(--color-main-background);
	z-index: 2000; /* Below Nextcloud header but above content */
}

.cage-main-content {
	display: flex;
	flex-direction: column;
	height: 100%;
	width: 100%;
}

.cage-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 15px 20px;
	background: var(--color-main-background);
	color: var(--color-main-text);
	border-bottom: 1px solid var(--color-border);
}

.cage-file-info {
	display: flex;
	align-items: center;
	gap: 10px;
}

.cage-file-icon {
	width: 24px;
	height: 24px;
}

.cage-file-name {
	margin: 0;
	font-size: 18px;
	font-weight: 500;
}

.cage-header-actions {
	display: flex;
	align-items: center;
	gap: 10px;
}

.cage-content-area {
	flex: 1;
	overflow: hidden;
	display: flex;
	flex-direction: column;
}

.cage-plaintext-editor {
	width: 100%;
	height: 100%;
	padding: 20px;
	border: none;
	font-family: monospace;
	font-size: 14px;
	resize: none;
	background: var(--color-main-background);
	color: var(--color-main-text);
}

.cage-plaintext-editor:focus {
	outline: none;
}

.cage-status-bar {
	display: flex;
	justify-content: space-between;
	padding: 8px 20px;
	background: var(--color-background-dark);
	border-top: 1px solid var(--color-border);
	font-size: 12px;
	color: var(--color-text-maxcontrast);
}
</style>
