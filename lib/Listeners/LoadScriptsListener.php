<?php
/**
 * SPDX-FileCopyrightText: 2026 Jakub Suchy <suchy@dwiggy.net>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

declare(strict_types=1);

namespace OCA\Cage\Listeners;

use OCP\EventDispatcher\Event;
use OCP\EventDispatcher\IEventListener;
use OCA\Files\Event\LoadAdditionalScriptsEvent;
use OCP\Util;

/**
 * @template-implements IEventListener<LoadAdditionalScriptsEvent>
 */
class LoadScriptsListener implements IEventListener {
    public function handle(Event $event): void {
        if (!($event instanceof LoadAdditionalScriptsEvent)) {
            return;
        }

        // Load cage file handler integration script
        Util::addScript('cage', 'cage-files-integration');
        Util::addStyle('cage', 'cage-files-integration');
    }
}
