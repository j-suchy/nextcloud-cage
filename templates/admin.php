<?php
/**
 * SPDX-FileCopyrightText: 2026 Jakub Suchy <suchy@dwiggy.net>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

script('cage', 'cage-admin-settings');
?>

<div id="cage-admin-settings" class="section">
    <h2><?php p($l->t('cage - Client-side age Encryption Settings')); ?></h2>

    <p class="settings-hint">
        <?php p($l->t('Configure default settings for all users. These settings control how encrypted .age files are handled.')); ?>
    </p>

    <div class="cage-settings-form">
        <div class="setting-row">
            <label for="auto_lock_minutes"><?php p($l->t('Auto-lock timeout')); ?></label>
            <select id="auto_lock_minutes" name="auto_lock_minutes">
                <option value="0" <?php if ($_['auto_lock_minutes'] === '0') p('selected'); ?>>
                    <?php p($l->t('Never')); ?>
                </option>
                <option value="1" <?php if ($_['auto_lock_minutes'] === '1') p('selected'); ?>>
                    <?php p($l->t('1 minute')); ?>
                </option>
                <option value="5" <?php if ($_['auto_lock_minutes'] === '5') p('selected'); ?>>
                    <?php p($l->t('5 minutes')); ?>
                </option>
                <option value="15" <?php if ($_['auto_lock_minutes'] === '15') p('selected'); ?>>
                    <?php p($l->t('15 minutes')); ?>
                </option>
                <option value="30" <?php if ($_['auto_lock_minutes'] === '30') p('selected'); ?>>
                    <?php p($l->t('30 minutes')); ?>
                </option>
            </select>
            <p class="setting-description">
                <?php p($l->t('Automatically lock the session after a period of inactivity. The passphrase is cleared from memory and decrypted content removed from the DOM.')); ?>
            </p>
        </div>

        <div class="setting-row">
            <label for="mnemonic_words"><?php p($l->t('Mnemonic word count')); ?></label>
            <select id="mnemonic_words" name="mnemonic_words">
                <option value="6" <?php if ($_['mnemonic_words'] === '6') p('selected'); ?>>
                    <?php p($l->t('6 words (~77 bits)')); ?>
                </option>
                <option value="7" <?php if ($_['mnemonic_words'] === '7') p('selected'); ?>>
                    <?php p($l->t('7 words (~90 bits)')); ?>
                </option>
                <option value="8" <?php if ($_['mnemonic_words'] === '8') p('selected'); ?>>
                    <?php p($l->t('8 words (~103 bits)')); ?>
                </option>
            </select>
            <p class="setting-description">
                <?php p($l->t('Number of words to generate for mnemonic passphrases when creating new encrypted files.')); ?>
            </p>
        </div>

        <div class="setting-row">
            <label for="min_passphrase_bits"><?php p($l->t('Minimum passphrase strength')); ?></label>
            <select id="min_passphrase_bits" name="min_passphrase_bits">
                <option value="0" <?php if ($_['min_passphrase_bits'] === '0') p('selected'); ?>>
                    <?php p($l->t('None (not recommended)')); ?>
                </option>
                <option value="30" <?php if ($_['min_passphrase_bits'] === '30') p('selected'); ?>>
                    <?php p($l->t('30 bits (weak)')); ?>
                </option>
                <option value="50" <?php if ($_['min_passphrase_bits'] === '50') p('selected'); ?>>
                    <?php p($l->t('50 bits (moderate)')); ?>
                </option>
                <option value="70" <?php if ($_['min_passphrase_bits'] === '70') p('selected'); ?>>
                    <?php p($l->t('70 bits (strong)')); ?>
                </option>
            </select>
            <p class="setting-description">
                <?php p($l->t('Minimum entropy required for user-provided passphrases. Estimated based on character set and length.')); ?>
            </p>
        </div>
    </div>
</div>
