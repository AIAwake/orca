// oxlint-disable-next-line import/no-cycle -- browser subsystem singleton hub (browserManager); breaking it needs DI and test-mock updates, left for a human
import { browserSessionRegistry } from '../../sessions/browser-session-registry'
import { requestBrowserExtensionInstallPrompt } from './browser-extension-install-prompt'
import { getBrowserExtensionInstallStore } from '../installation/browser-extension-install-store'
import { readBrowserExtensionIconDataUrl } from '../installation/browser-extension-manifest'
import type { BrowserExtensionPermissionSet } from './browser-extension-permission-grants'
// oxlint-disable-next-line import/no-cycle -- browser subsystem singleton hub (browserManager); breaking it needs DI and test-mock updates, left for a human
import { getBrowserExtensionMainWindow } from '../tabs-and-windows/browser-extension-window-model'

/**
 * permissions.request asks through Orca's extension dialog (the one store installs use), listing
 * only the access not yet granted. Without Orca's window there is no one to ask, so it declines.
 */
export async function askToGrantBrowserExtensionPermissions(
  browserProfileId: string,
  extension: Electron.Extension,
  add: BrowserExtensionPermissionSet,
  signal?: AbortSignal
): Promise<boolean> {
  const window = getBrowserExtensionMainWindow()
  if (!window || window.isDestroyed()) {
    return false
  }
  const installed = getBrowserExtensionInstallStore().get(extension.id)
  return requestBrowserExtensionInstallPrompt(
    window.webContents,
    {
      kind: 'permissions',
      name: installed?.name ?? extension.name,
      iconDataUrl: installed
        ? await readBrowserExtensionIconDataUrl(installed.path, installed.iconPath)
        : null,
      permissions: add.permissions,
      hostPermissions: add.origins,
      profileLabel: browserSessionRegistry.getProfile(browserProfileId)?.label ?? null
    },
    undefined,
    signal
  )
}
