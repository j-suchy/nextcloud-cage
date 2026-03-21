<?php
/**
 * SPDX-FileCopyrightText: 2026 Jakub Suchy <suchy@dwiggy.net>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

declare(strict_types=1);

namespace OCA\Cage\AppInfo;

use OCP\AppFramework\App;
use OCP\AppFramework\Bootstrap\IBootContext;
use OCP\AppFramework\Bootstrap\IBootstrap;
use OCP\AppFramework\Bootstrap\IRegistrationContext;
use OCA\Files\Event\LoadAdditionalScriptsEvent;
use OCA\Cage\Listeners\LoadScriptsListener;

class Application extends App implements IBootstrap {
    public const APP_ID = 'cage';

    public function __construct(array $urlParams = []) {
        parent::__construct(self::APP_ID, $urlParams);
    }

    public function register(IRegistrationContext $context): void {
        // Register event listener for loading scripts in Files app (files-integration)
        $context->registerEventListener(
            LoadAdditionalScriptsEvent::class,
            LoadScriptsListener::class
        );
    }

    public function boot(IBootContext $context): void {}
}
