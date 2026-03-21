<?php
/**
 * SPDX-FileCopyrightText: 2026 Jakub Suchy <suchy@dwiggy.net>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

return [
    'routes' => [
        // Main viewer/editor page
        ['name' => 'page#index', 'url' => '/', 'verb' => 'GET'],
        ['name' => 'page#viewer', 'url' => '/viewer', 'verb' => 'GET'],

        // Settings API
        ['name' => 'settings#getSettings', 'url' => '/api/v1/settings', 'verb' => 'GET'],
        ['name' => 'settings#updateSettings', 'url' => '/api/v1/settings', 'verb' => 'PUT'],
    ]
];
