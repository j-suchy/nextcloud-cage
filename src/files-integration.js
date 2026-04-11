/**
 * SPDX-FileCopyrightText: 2026 Jakub Suchy <suchy@dwiggy.net>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { DefaultType, FileAction, registerFileAction } from '@nextcloud/files'
import { translate as t } from '@nextcloud/l10n'
import { generateUrl } from '@nextcloud/router'
import appIconSvg from '../img/app-icon.svg?raw'

// Register file action for .age files
registerFileAction(new FileAction({
	id: 'cage-view',
	displayName: () => t('cage', 'Open in cage'),
	iconSvgInline: () => appIconSvg,
	default: DefaultType.DEFAULT,
	enabled: (nodes) => {
		// Enable for .age files only
		if (nodes.length !== 1) {
			return false
		}
		// Check if the file has .age extension (case-insensitive)
		const isAgeFile = nodes[0].type === 'file' && nodes[0].basename.toLowerCase().endsWith('.age')
		return isAgeFile
	},
	async exec(node) {
		const filePath = node.path
		const params = new URLSearchParams({ file: filePath })
		const url = generateUrl('/apps/cage/viewer?' + params.toString())

		window.location.href = url

		return null
	},
	order: -10, // Higher priority
}))

import { addNewFileMenuEntry } from '@nextcloud/files'
import { createApp } from 'vue'
import CreateFileDialog from './components/CreateFileDialog.vue'

addNewFileMenuEntry({
	id: 'new-age-file',
	displayName: t('cage', 'Encrypted file'),
	iconSvgInline: appIconSvg,
	order: 10,
	handler(context) {
		// Create mount point for dialog
		const mountPoint = document.createElement('div')
		document.body.appendChild(mountPoint)

		// Create Vue app with dialog
		const app = createApp(CreateFileDialog, {
			path: context.path,
			onClose: () => {
				app.unmount()
				mountPoint.remove()
			},
		})

		app.mount(mountPoint)

		return null
	},
})
