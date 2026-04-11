<!--
  - SPDX-FileCopyrightText: 2026 Jakub Suchy <suchy@dwiggy.net>
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->
<template>
	<NcDialog
		:name="dialogTitle"
		:noClose="false"
		size="normal"
		@close="$emit('cancel')">
		<div v-if="!useCustomPassphrase" class="cage-generated-passphrase-section">
			<NcFormBoxCopyButton
				v-if="hasClipboardAPI"
				:value="generatedPassphrase"
				:label="t('cage', 'Your generated passphrase')"
				class="cage-passphrase-copybox" />
			<NcTextField
				v-else
				v-model="generatedPassphrase"
				:label="t('cage', 'Your generated passphrase')"
				readonly
				class="cage-passphrase-copybox" />
			<div class="cage-passphrase-info">
				{{ t('cage', '{wordCount} words • ~{entropy} bits entropy', { wordCount, entropy }) }}
			</div>

			<div class="cage-passphrase-actions">
				<NcButton @click="regenerate">
					<template #icon>
						<Refresh :size="20" />
					</template>
					{{ t('cage', 'Regenerate') }}
				</NcButton>
				<NcButton @click="useCustomPassphrase = true">
					{{ t('cage', 'Use custom passphrase') }}
				</NcButton>
			</div>

			<NcCheckboxRadioSwitch
				ref="confirmCheckbox"
				v-model="confirmed"
				type="checkbox">
				{{ checkboxText }}
			</NcCheckboxRadioSwitch>
		</div>

		<div v-else class="cage-custom-passphrase-section">
			<p>{{ t('cage', 'Enter your own passphrase:') }}</p>
			<NcPasswordField
				ref="customInput"
				v-model="customPassphrase"
				:placeholder="t('cage', 'Type a strong passphrase…')"
				:showTrailingButton="true" />

			<div v-if="customPassphrase" class="cage-strength-indicator">
				<div class="cage-strength-bar">
					<div
						class="cage-strength-fill"
						:style="{
							width: strength.percentage + '%',
							background: strengthColor,
						}" />
				</div>
				<div class="cage-strength-label" :style="{ color: strengthColor }">
					{{ t('cage', '{label} ({bits} bits)', { label: strength.label, bits: customEntropy }) }}
				</div>
			</div>

			<NcNoteCard v-if="customPassphrase && customEntropy < minPassphraseBits" type="warning">
				{{ t('cage', 'Passphrase is too weak. Minimum {minBits} bits required.', { minBits: minPassphraseBits }) }}
			</NcNoteCard>

			<NcButton @click="useCustomPassphrase = false">
				<template #icon>
					<ArrowLeft :size="20" />
				</template>
				{{ t('cage', 'Back to generated passphrase') }}
			</NcButton>
		</div>

		<template #actions>
			<NcButton
				type="primary"
				:disabled="!canCreate"
				@click="create">
				{{ actionButtonText }}
			</NcButton>
			<NcButton @click="$emit('cancel')">
				{{ t('cage', 'Cancel') }}
			</NcButton>
		</template>
	</NcDialog>
</template>

<script>
import { translate as t } from '@nextcloud/l10n'
import { NcButton, NcCheckboxRadioSwitch, NcDialog, NcFormBoxCopyButton, NcNoteCard, NcPasswordField, NcTextField } from '@nextcloud/vue'
import ArrowLeft from 'vue-material-design-icons/ArrowLeft.vue'
import Refresh from 'vue-material-design-icons/Refresh.vue'
import {
	calculateDicewareEntropy,
	estimateEntropy,
	generatePassphrase,
	getStrengthRating,
} from '../services/passphrase.js'

export default {
	name: 'CreatePassphraseDialog',

	components: {
		NcDialog,
		NcButton,
		NcFormBoxCopyButton,
		NcTextField,
		NcNoteCard,
		NcPasswordField,
		NcCheckboxRadioSwitch,
		Refresh,
		ArrowLeft,
	},

	props: {
		wordCount: {
			type: Number,
			default: 6,
		},

		minPassphraseBits: {
			type: Number,
			default: 50,
		},

		mode: {
			type: String,
			default: 'create',
			validator: (value) => ['create', 'change'].includes(value),
		},
	},

	emits: ['create', 'cancel', 'notify'],

	data() {
		return {
			generatedPassphrase: '',
			customPassphrase: '',
			useCustomPassphrase: false,
			confirmed: false,
		}
	},

	computed: {
		hasClipboardAPI() {
			// Check Clipboard API (not Nextcloud's fallback object)
			const hasAPI = navigator.clipboard && navigator.clipboard[Symbol.toStringTag] === 'Clipboard'
			return hasAPI
		},

		dialogTitle() {
			return this.mode === 'change'
				? t('cage', 'cage — Change Passphrase')
				: t('cage', 'cage — New encrypted file')
		},

		actionButtonText() {
			return this.mode === 'change'
				? t('cage', 'Change Passphrase')
				: t('cage', 'Create Passphrase')
		},

		checkboxText() {
			return this.mode === 'change'
				? t('cage', 'I have saved the new passphrase securely')
				: t('cage', 'I have saved this passphrase securely')
		},

		entropy() {
			return calculateDicewareEntropy(this.wordCount)
		},

		customEntropy() {
			return estimateEntropy(this.customPassphrase)
		},

		strength() {
			return getStrengthRating(this.customEntropy)
		},

		strengthColor() {
			const colors = {
				red: '#d00',
				orange: '#f80',
				green: '#0a0',
			}
			return colors[this.strength.color] || '#999'
		},

		canCreate() {
			if (this.useCustomPassphrase) {
				return this.customPassphrase && this.customEntropy >= this.minPassphraseBits
			}
			return this.confirmed
		},

		finalPassphrase() {
			return this.useCustomPassphrase ? this.customPassphrase : this.generatedPassphrase
		},
	},

	watch: {
		useCustomPassphrase(newVal) {
			if (newVal) {
				this.$nextTick(() => {
					this.$refs.customInput?.$el?.querySelector('input')?.focus()
				})
			}
		},
	},

	mounted() {
		this.regenerate()

		// Focus the confirmation checkbox after rendering
		this.$nextTick(() => {
			const checkbox = this.$refs.confirmCheckbox?.$el?.querySelector('input[type="checkbox"]')
			checkbox?.focus()
		})
	},

	methods: {
		t,

		regenerate() {
			this.generatedPassphrase = generatePassphrase(this.wordCount)
			this.confirmed = false
		},

		create() {
			if (this.canCreate) {
				this.$emit('create', this.finalPassphrase)
			}
		},
	},
}
</script>

<style scoped>
.cage-generated-passphrase-section p,
.cage-custom-passphrase-section p {
	text-align: center;
	margin-bottom: 10px;
	font-weight: 500;
}

.cage-passphrase-info {
	text-align: center;
	color: var(--color-text-maxcontrast);
	font-size: 14px;
	margin-bottom: 20px;
}

.cage-passphrase-actions {
	display: flex;
	gap: 10px;
	justify-content: center;
	margin-bottom: 20px;
	flex-wrap: wrap;
}

.cage-custom-passphrase-section :deep(.input-field) {
	margin-bottom: 10px;
}

.cage-strength-indicator {
	margin: 15px 0;
}

.cage-strength-bar {
	height: 8px;
	background: var(--color-background-dark);
	border-radius: var(--border-radius);
	overflow: hidden;
	margin-bottom: 5px;
}

.cage-strength-fill {
	height: 100%;
	transition: width 0.3s, background 0.3s;
}

.cage-strength-label {
	font-size: 14px;
	text-align: center;
	font-weight: 500;
}
</style>
