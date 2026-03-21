<?php
/**
 * SPDX-FileCopyrightText: 2026 Jakub Suchy <suchy@dwiggy.net>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

declare(strict_types=1);

namespace OCA\Cage\Controller;

use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\JSONResponse;
use OCP\IRequest;
use OCP\IConfig;
use OCP\IL10N;

class SettingsController extends Controller {
    public function __construct(
        string $appName,
        IRequest $request,
        private IConfig $config,
        private IL10N $l,
    ) {
        parent::__construct($appName, $request);
    }

    /**
     * @NoAdminRequired
     */
    public function getSettings(): JSONResponse {
        $settings = [
            'auto_lock_minutes' => (int) $this->config->getAppValue('cage', 'auto_lock_minutes', '5'),
            'mnemonic_words' => (int) $this->config->getAppValue('cage', 'mnemonic_words', '6'),
            'min_passphrase_bits' => (int) $this->config->getAppValue('cage', 'min_passphrase_bits', '50'),
        ];

        return new JSONResponse($settings);
    }

    /**
     * @AdminRequired
     */
    public function updateSettings(
        int|null  $auto_lock_minutes = null,
        int|null  $mnemonic_words = null,
        int|null  $min_passphrase_bits = null
    ): JSONResponse {
        if ($auto_lock_minutes !== null) {
            if (!in_array($auto_lock_minutes, [0, 1, 5, 15, 30])) {
                return new JSONResponse(['error' => $this->l->t('Invalid auto_lock_minutes value')], 400);
            }
            $this->config->setAppValue('cage', 'auto_lock_minutes', (string) $auto_lock_minutes);
        }

        if ($mnemonic_words !== null) {
            if (!in_array($mnemonic_words, [6, 7, 8])) {
                return new JSONResponse(['error' => $this->l->t('Invalid mnemonic_words value')], 400);
            }
            $this->config->setAppValue('cage', 'mnemonic_words', (string) $mnemonic_words);
        }

        if ($min_passphrase_bits !== null) {
            if (!in_array($min_passphrase_bits, [0, 30, 50, 70])) {
                return new JSONResponse(['error' => $this->l->t('Invalid min_passphrase_bits value')], 400);
            }
            $this->config->setAppValue('cage', 'min_passphrase_bits', (string) $min_passphrase_bits);
        }

        return new JSONResponse(['success' => true]);
    }
}
