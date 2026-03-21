/**
 * SPDX-FileCopyrightText: 2026 Jakub Suchy <suchy@dwiggy.net>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { defaultRootPath, getClient, getDefaultPropfind } from '@nextcloud/files/dav'
import { translate as t } from '@nextcloud/l10n'

/**
 * Get the full WebDAV path for a file
 *
 * @param {string} filePath - The file path relative to user's root
 * @return {string} Full WebDAV path
 */
function getDavPath(filePath) {
	// defaultRootPath already includes the user and handles normalization
	const normalizedPath = filePath.startsWith('/') ? filePath : '/' + filePath
	return defaultRootPath + normalizedPath
}

/**
 * Fetch a file from Nextcloud
 *
 * @param {string} filePath - The file path relative to user's root (e.g., "/Documents/secret.age")
 * @return {Promise<ArrayBuffer>} The file contents as ArrayBuffer
 */
export async function fetchFile(filePath) {
	try {
		const client = getClient()
		const path = getDavPath(filePath)

		// getFileContents with explicit binary format for age encryption
		const contents = await client.getFileContents(path, { format: 'binary' })

		// Convert to ArrayBuffer if needed
		if (contents instanceof ArrayBuffer) {
			return contents
		} else if (contents instanceof Uint8Array) {
			return contents.buffer
		} else if (ArrayBuffer.isView(contents)) {
			return contents.buffer
		} else {
			// Fallback: assume it's array-like and convert to ArrayBuffer
			return new Uint8Array(contents).buffer
		}
	} catch (error) {
		throw new Error(t('cage', 'Failed to fetch file: {error}', { error: error.message }), { cause: error })
	}
}

/**
 * Save a file to Nextcloud
 *
 * @param {string} filePath - The file path relative to user's root
 * @param {ArrayBuffer|Uint8Array} content - The file contents to save
 * @return {Promise<void>}
 */
export async function saveFile(filePath, content) {
	try {
		const client = getClient()
		const path = getDavPath(filePath)

		// Convert to ArrayBuffer for binary data
		let binaryContent
		if (content instanceof Uint8Array) {
			binaryContent = content.buffer
		} else if (content instanceof ArrayBuffer) {
			binaryContent = content
		} else {
			// Assume it's already a suitable binary format
			binaryContent = content
		}

		// putFileContents with binary format
		await client.putFileContents(path, binaryContent, {
			overwrite: true,
		})
	} catch (error) {
		throw new Error(t('cage', 'Failed to save file: {error}', { error: error.message }), { cause: error })
	}
}

/**
 * Get file information including permissions
 *
 * @param {string} filePath - The file path relative to user's root
 * @return {Promise<object>} File metadata with permissions
 */
export async function getFileInfo(filePath) {
	try {
		const client = getClient()
		const path = getDavPath(filePath)

		// stat() with default PROPFIND for Nextcloud
		const result = await client.stat(path, {
			details: true,
			data: getDefaultPropfind(),
		})

		// Extract permissions from the response
		const permissions = result.data?.props?.permissions || ''

		// Check if file is writable (W permission)
		const isWritable = permissions.includes('W')

		return {
			exists: true,
			path: filePath,
			permissions,
			isReadOnly: !isWritable,
		}
	} catch (error) {
		throw new Error(t('cage', 'Failed to get file info: {error}', { error: error.message }), { cause: error })
	}
}

/**
 * Create a new empty file
 *
 * @param {string} filePath - The file path relative to user's root
 * @return {Promise<void>}
 * @throws {Error} If file already exists or creation fails
 */
export async function createFile(filePath) {
	try {
		const client = getClient()
		const path = getDavPath(filePath)

		// Check if file already exists
		if (await client.exists(path)) {
			throw new Error(t('cage', 'File already exists'))
		}

		// Create completely empty file - will be encrypted on first open
		await client.putFileContents(path, '', {
			contentLength: false,
			overwrite: false,
		})
	} catch (error) {
		throw new Error(t('cage', 'Failed to create file {file}: {error}', { file: filePath, error: error.message }), { cause: error })
	}
}

/**
 * Parse file path from URL parameters
 *
 * @return {string|null} The file path or null
 */
export function getFilePathFromContext() {
	// Try to get from URL parameters
	const params = new URLSearchParams(window.location.search)
	const filePath = params.get('path') || params.get('file')

	if (filePath) {
		return filePath
	}

	return null
}
