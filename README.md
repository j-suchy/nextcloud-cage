# cage — Client-side age Encryption for Nextcloud

**cage** (Client-side age Encryption) is a Nextcloud app that allows you to **securely view and edit `.age` encrypted text files directly in the browser**.

cage uses the standard [age](https://age-encryption.org/) encryption format, so encrypted files remain **portable** and can be decrypted outside Nextcloud using the age CLI.

All encryption and decryption happens locally in the browser. The Nextcloud server only stores encrypted data and **never sees plaintext**.

cage is designed for **text-based files** such as notes, passwords, and configuration files. Support for **Markdown editing** is planned. Binary files are intentionally not supported.

## Features

### Security
- Client-side encryption/decryption using the [age](https://age-encryption.org/) standard with the [age-encryption](https://www.npmjs.com/package/age-encryption) npm package
- Passphrase-based encryption with scrypt key derivation
- No plaintext ever sent to the server
- Passphrase stored only in JavaScript runtime memory and cleared on lock
- Files remain compatible with the age CLI and other age tools

### Usability
- Auto-generated mnemonic passphrases (EFF diceware)
- Custom passphrase support with strength estimation
- Auto-lock timer
- `.age` type integration in Nextcloud

### Roadmap
- Multi-recipient encryption (X25519 keys)
- Markdown editor with rich text formatting
- FIDO2/WebAuthn support

## Compatibility
- Nextcloud 31-32
- Modern browsers (Chrome, Firefox, Safari, Edge)

## Security Model

**cage** is designed with zero-trust principles:
1. **Client-side only**: All encryption/decryption happens in client browser using the [age-encryption](https://www.npmjs.com/package/age-encryption)
2. **No passphrase persistence**: Passphrase is stored in a JavaScript variable only, cleared on page unload and auto-lock
3. **DOM cleanup**: When the editor locks, decrypted content is removed from the DOM and in-memory state
4. **No telemetry**: editor runs with no server extensions

## Installation

### From Nextcloud App Store
- See [cage in Nextcloud App Store](https://apps.nextcloud.com/apps/cage)

### Manual Installation

1. Clone this repository into your Nextcloud `apps/` directory:
   ```bash
   cd /path/to/nextcloud/apps
   git clone https://github.com/j-suchy/nextcloud-cage.git cage
   ```

2. Install dependencies and build:
   ```bash
   cd cage
   npm install
   npm run build
   ```

3. Enable the app:
   ```bash
   sudo -u www-data php occ app:enable cage
   ```

4. Configure settings in **Settings → Administration → cage - Client-side age**

## Usage

### Opening an Encrypted File

1. Click any `.age` file in Nextcloud Files
2. Enter your passphrase
3. View/edit the decrypted content
4. Save to re-encrypt and write back

### Creating a New Encrypted File

1. Click **New → Encrypted file** in the Files app
2. Enter a filename (e.g., "passwords") - `.age` extension is added automatically
3. The file opens in cage and prompts for passphrase creation
4. Choose to either:
   - Generate a secure mnemonic passphrase (e.g. `carpet-bicycle-mountain-elephant-garden-violet`)
   - Create your own custom passphrase
5. Copy and save this passphrase securely (make sure you have your password secured)
6. Confirm and the file is encrypted
7. Start editing

### Editing and Saving Files

**Edit Mode:**
1. Click **Edit** button to enter edit mode
2. Modify the plaintext content in the editor
3. Click **Save** to re-encrypt and save changes
   - Content is encrypted with your cached passphrase (in memory)
   - Encrypted data is written back to the `.age` file
   - You remain in view mode after saving

**Unsaved Changes Protection:**
- If you try to **close** the editor with unsaved changes, you'll see a confirmation dialog
- If you try to **lock** with unsaved changes, you'll be warned that changes will be lost
- If you try to **close/refresh the browser** with unsaved changes, the browser will show a warning

**Change Passphrase:**
- Click **Change Passphrase** to re-encrypt the file with a new passphrase
- The file is automatically saved with the new encryption
- Your session continues with the new passphrase cached

### Notes
- cage will automatically try to initialize any empty `.age` file with encryption when you first open it.
- Saving always overwrites the encrypted file. Nextcloud file versioning may store previous encrypted versions.

### Auto-Lock

After a configurable period of inactivity (default: 5 minutes):
- Passphrase is cleared from memory
- Decrypted content is removed from the DOM
- Lock screen appears
- Re-enter passphrase to continue

## Admin Settings

Configure these in **Settings → Administration → Security → cage**:

| Setting | Options | Default | Description |
|---------|---------|---------|-------------|
| Auto-lock timeout | `1` / `5` / `15` / `30` / `0` (never) | `5` min | Automatically lock after inactivity |
| Mnemonic word count | `6` / `7` / `8` | `6` | Words in generated passphrases (6 words ≈ 77 bits) |
| Min passphrase strength | `0` / `30` / `50` / `70` bits | `50` | Minimum entropy for custom passphrases |

## Technical Details

- **Backend**: PHP (minimal — serves frontend, manages settings)
- **Frontend**: Vue
- **Encryption**: [age-encryption](https://www.npmjs.com/package/age-encryption) (typage)

### File Format

cage creates standard age-encrypted files compatible with the [age CLI](https://github.com/FiloSottile/age):

```bash
# Encrypt with age CLI
echo "secret" | age -p -o file.age

# Decrypt with age CLI
age -d file.age

# Open in cage (Nextcloud)
# Click file.age → enter same passphrase
```

## Security Considerations

Cage relies on [age-encryption](https://www.npmjs.com/package/age-encryption), no custom cryptography is implemented.

**Trust in Nextcloud frontend**: cage assumes the Nextcloud web interface has not been modified to include malicious JavaScript. If the Nextcloud instance is compromised or malicious apps inject scripts, decrypted data or passphrases could be exposed.

### Browser Security

Because cage performs decryption in the browser:

- Malicious browser extensions may access decrypted content
- Even though cage clears sensitive data on lock, browser memory management is not fully controllable.  In rare cases decrypted content may remain in memory until garbage collection occurs.
- Copying decrypted text to the clipboard may expose it to other applications or browser extensions.
- Compromised devices can capture passphrases
- Shared or public computers should not be used to decrypt sensitive files.

Always use a trusted browser environment.

### Best Practices
1. Use generated mnemonic passphrases
2. Never "encrypt existing files" — if plaintext was on the server, it's in backups/versions/search index
3. Only create new files through cage — start with encrypted files from the beginning
4. Save passphrases securely — use a password manager or write them down offline
5. Enable auto-lock — don't leave decrypted content in browser longer than needed

## Mobile Support

cage works only in a **web browser**. This is a limitation of Nextcloud mobile app, not cage itself.


## Contributing

Contributions are welcome! 

Please do not open public issues for security vulnerabilities.


### Development

Clone the repository:

```bash
git clone https://github.com/j-suchy/nextcloud-cage.git cage
cd cage
npm install
```

For development:
```bash
npm run dev
```

For production:
```bash
npm run build
```

## License

This project is licensed under the **AGPL-3.0-or-later** license. See [LICENSE](LICENSE) for details.

## Credits

- [age](https://age-encryption.org/) by Filippo Valsorda
- [Typage](https://github.com/FiloSottile/typage) (age-encryption npm package)
- [EFF Diceware word list](https://www.eff.org/dice)

## Disclaimer

This software is provided "as is" without warranty of any kind. Use at your own risk. Always back up your encrypted files and passphrases.

---

**cage** = Client-side Age Encryption