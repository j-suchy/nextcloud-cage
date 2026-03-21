<!--
  - SPDX-FileCopyrightText: 2026 Jakub Suchy <suchy@dwiggy.net>
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->
<template>
	<NcDialog
		:name="message"
		:noClose="true"
		size="small">
		<div class="cage-loading-content">
			<NcLoadingIcon :size="60" class="cage-spinner" />
			<p v-if="details" class="cage-loading-details">
				{{ details }}
			</p>
		</div>
	</NcDialog>
</template>

<script>
import { NcDialog, NcLoadingIcon } from '@nextcloud/vue'

export default {
	name: 'LoadingDialog',

	components: {
		NcDialog,
		NcLoadingIcon,
	},

	props: {
		message: {
			type: String,
			required: true,
		},

		details: {
			type: String,
			default: '',
		},
	},
}
</script>

<style scoped>
.cage-loading-content {
  text-align: center;
  padding: 20px 0;
}

.cage-spinner {
  margin: 0 auto 20px;
}

.cage-loading-details {
  margin: 0;
  font-size: 14px;
  color: var(--color-text-maxcontrast);
}
</style>
