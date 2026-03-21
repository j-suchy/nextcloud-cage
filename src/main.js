/**
 * SPDX-FileCopyrightText: 2026 Jakub Suchy <suchy@dwiggy.net>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { createApp } from 'vue'
import CageApp from './components/CageApp.vue'

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
	// Find the mount point
	const mountPoint = document.getElementById('cage-app')

	if (mountPoint) {
		// Create and mount the Vue app
		const app = createApp(CageApp)
		app.mount(mountPoint)
	}
})
