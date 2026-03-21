<!--
  - SPDX-FileCopyrightText: 2026 Jakub Suchy <suchy@dwiggy.net>
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->
<template>
	<NcDialog
		:name="t('cage', 'New age encrypted file')"
		size="small">
		<NcTextField
			v-model="filename"
			:label="t('cage', 'File name')"
			:placeholder="t('cage', 'filename.age')" />

		<template #actions>
			<NcButton :disabled="creating" @click="handleCancel">
				{{ t('cage', 'Cancel') }}
			</NcButton>
			<NcButton
				type="primary"
				:disabled="!filename || creating"
				@click="handleCreate">
				{{ creating ? t('cage', 'Creating…') : t('cage', 'Create') }}
			</NcButton>
		</template>
	</NcDialog>
</template>

<script>
import { showError } from '@nextcloud/dialogs'
import { translate as t } from '@nextcloud/l10n'
import { getAppRootUrl } from '@nextcloud/router'
import { NcButton, NcDialog, NcTextField } from '@nextcloud/vue'
import { createFile } from '../services/fileApi.js'

export default {
	name: 'CreateFileDialog',

	components: {
		NcDialog,
		NcButton,
		NcTextField,
	},

	props: {
		path: {
			type: String,
			required: true,
		},
	},

	emits: ['close'],

	data() {
		return {
			filename: '',
			creating: false,
		}
	},

	methods: {
		t,

		async handleCreate() {
			if (!this.filename || this.creating) {
				return
			}

			this.creating = true

			try {
				// Ensure .age extension
				const finalFilename = this.filename.endsWith('.age') ? this.filename : `${this.filename}.age`

				// Normalize path to avoid double slashes when path is '/'
				const normalizedPath = this.path === '/' ? '' : this.path
				const filePath = `${normalizedPath}/${finalFilename}`

				// Create the file using fileApi
				await createFile(filePath)

				// Navigate to cage viewer to initialize the file
				const params = new URLSearchParams({ file: filePath })
				const url = getAppRootUrl('cage') + '/viewer?' + params.toString()

				window.location.href = url
			} catch (error) {
				showError(error.message)
				this.creating = false
			}
		},

		handleCancel() {
			if (!this.creating) {
				this.$emit('close')
			}
		},
	},
}
</script>
