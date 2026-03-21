import { createAppConfig } from '@nextcloud/vite-config'
import { join, resolve } from 'path'

export default createAppConfig(
  {
    main: resolve(join('src', 'main.js')),
    'files-integration': resolve(join('src', 'files-integration.js')),
    'admin-settings': resolve(join('src', 'admin-settings.js')),
  },
  {
    extractLicenseInformation: true,
    thirdPartyLicense: false,
  },
)
