<?php
/**
 * SPDX-FileCopyrightText: 2026 Jakub Suchy <suchy@dwiggy.net>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

declare(strict_types=1);

namespace OCA\Cage\Settings;

use OCP\IL10N;
use OCP\IURLGenerator;
use OCP\Settings\IIconSection;

class AdminSection implements IIconSection {
    public function __construct(
        private IL10N $l,
        private IURLGenerator $urlGenerator,
    ) {
    }

    public function getID(): string {
        return 'cage';
    }

    public function getName(): string {
        return $this->l->t('cage - Client-side age');
    }

    public function getPriority(): int {
        return 75;
    }

    public function getIcon(): string {
        return $this->urlGenerator->imagePath('cage', 'app-icon.svg');
    }
}
