import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

export default defineConfig({
	plugins: [vue()],
	test: {
		globals: true,
		environment: 'happy-dom',
		css: {
			include: [],
		},
		setupFiles: ['@vitest/web-worker', './tests/setup.js'],
		server: {
			deps: {
				inline: ['@nextcloud/vue'],
			},
		},
	},
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
		},
	},
})
