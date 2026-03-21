<?php
/**
 * SPDX-FileCopyrightText: 2026 Jakub Suchy <suchy@dwiggy.net>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

declare(strict_types=1);

namespace OCA\Cage\Controller;

use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\AppFramework\Http\ContentSecurityPolicy;
use OCP\IRequest;
use OCP\IConfig;
use OCP\Util;

class PageController extends Controller {
    public function __construct(
        string $appName,
        IRequest $request,
        private ?string $userId,
        private IConfig $config,
    ) {
        parent::__construct($appName, $request);
    }

    /**
     * @NoAdminRequired
     * @NoCSRFRequired
     */
    public function index(): TemplateResponse {
        return $this->viewer();
    }

    /**
     * @NoAdminRequired
     * @NoCSRFRequired
     */
    public function viewer(): TemplateResponse {
        // Load JavaScript and CSS
        Util::addScript('cage', 'cage-main');
        Util::addStyle('cage', 'cage-main');

        // Get site-wide settings (admin-configured)
        $settings = [
            'auto_lock_minutes' => (int) $this->config->getAppValue(
                'cage',
                'auto_lock_minutes',
                '5'
            ),
            'mnemonic_words' => (int) $this->config->getAppValue(
                'cage',
                'mnemonic_words',
                '6'
            ),
            'min_passphrase_bits' => (int) $this->config->getAppValue(
                'cage',
                'min_passphrase_bits',
                '50'
            ),
        ];

        // Pass settings to frontend
        $response = new TemplateResponse('cage', 'main', [
            'settings' => json_encode($settings, JSON_HEX_TAG | JSON_HEX_AMP)
        ]);

        // Configure Content Security Policy to allow web workers
        $csp = new ContentSecurityPolicy();
        $csp->addAllowedWorkerSrcDomain("'self'");
        $response->setContentSecurityPolicy($csp);

        return $response;
    }
}
