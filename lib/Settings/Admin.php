<?php
/**
 * SPDX-FileCopyrightText: 2026 Jakub Suchy <suchy@dwiggy.net>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

declare(strict_types=1);

namespace OCA\Cage\Settings;

use OCP\AppFramework\Http\TemplateResponse;
use OCP\IConfig;
use OCP\Settings\ISettings;

class Admin implements ISettings {
    public function __construct(
        private IConfig $config,
    ) {
    }

    public function getForm(): TemplateResponse {
        $parameters = [
            'auto_lock_minutes' => $this->config->getAppValue('cage', 'auto_lock_minutes', '5'),
            'mnemonic_words' => $this->config->getAppValue('cage', 'mnemonic_words', '6'),
            'min_passphrase_bits' => $this->config->getAppValue('cage', 'min_passphrase_bits', '50'),
        ];

        return new TemplateResponse('cage', 'admin', $parameters);
    }

    public function getSection(): string {
        return 'cage';
    }

    public function getPriority(): int {
        return 50;
    }
}
