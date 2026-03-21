<?php
/**
 * SPDX-FileCopyrightText: 2026 Jakub Suchy <suchy@dwiggy.net>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

script('cage', 'cage-main');
style('cage', 'cage-main');
?>

<div id="cage-app" data-settings="<?php p($_['settings']); ?>">
    <!-- Vue app will mount here -->
</div>
