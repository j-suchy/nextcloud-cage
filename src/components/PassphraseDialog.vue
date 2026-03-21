<!--
  - SPDX-FileCopyrightText: 2026 Jakub Suchy <suchy@dwiggy.net>
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->
<template>
	<NcDialog
		:name="title"
		:noClose="false"
		size="normal"
		@close="$emit('cancel')">
		<p v-if="message" class="cage-dialog-message">
			{{ message }}
		</p>

		<div class="cage-passphrase-input-group">
			<NcPasswordField
				ref="passphraseInput"
				v-model="passphrase"
				:label="t('cage', 'Enter passphrase:')"
				:placeholder="t('cage', 'Type your passphrase…')"
				:showTrailingButton="true"
				@keyup.enter="submit" />
		</div>

		<NcNoteCard v-if="error" type="error">
			{{ error }}
		</NcNoteCard>

		<template #actions>
			<NcButton
				type="primary"
				:disabled="!passphrase || isLoading"
				@click="submit">
				<template #icon>
					<LockOpen v-if="!isLoading" :size="20" />
					<Loading v-else :size="20" />
				</template>
				{{ isLoading ? t('cage', 'Decrypting…') : submitLabel }}
			</NcButton>
			<NcButton
				:disabled="isLoading"
				@click="$emit('cancel')">
				{{ t('cage', 'Cancel') }}
			</NcButton>
		</template>
	</NcDialog>
</template>

<script>
import { translate as t } from '@nextcloud/l10n'
import { NcButton, NcDialog, NcNoteCard, NcPasswordField } from '@nextcloud/vue'
import Loading from 'vue-material-design-icons/Loading.vue'
import LockOpen from 'vue-material-design-icons/LockOpen.vue'

export default {
	name: 'PassphraseDialog',

	components: {
		NcDialog,
		NcButton,
		NcNoteCard,
		NcPasswordField,
		LockOpen,
		Loading,
	},

	props: {
		title: {
			type: String,
			default: 'cage',
		},

		message: {
			type: String,
			default: '',
		},

		submitLabel: {
			type: String,
			default: 'Decrypt',
		},

		error: {
			type: String,
			default: '',
		},

		isLoading: {
			type: Boolean,
			default: false,
		},
	},

	emits: ['submit', 'cancel'],

	data() {
		return {
			passphrase: '',
		}
	},

	mounted() {
		this.$nextTick(() => {
			this.$refs.passphraseInput?.$el?.querySelector('input')?.focus()
		})
	},

	methods: {
		t,

		submit() {
			if (this.passphrase && !this.isLoading) {
				this.$emit('submit', this.passphrase)
			}
		},
	},
}
</script>

<style scoped>
.cage-dialog-message {
	text-align: center;
	color: var(--color-text-maxcontrast);
	margin-bottom: 20px;
}

.cage-passphrase-input-group {
	margin: 20px 0;
}
</style>
