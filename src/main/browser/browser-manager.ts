import { webContents } from 'electron'
import { BrowserCertificateTrustController } from './certificate-trust/browser-certificate-trust-controller'
// oxlint-disable-next-line import/no-cycle -- browser subsystem singleton hub (browserManager); breaking it needs DI and test-mock updates, left for a human
import { BrowserManagerFinal } from './guest-lifecycle/manager/browser-manager-final'

export class BrowserManager extends BrowserManagerFinal {}

export const browserManager = new BrowserManager()
export const browserCertificateTrustController = new BrowserCertificateTrustController({
  resolveManagedGuestContext: (webContentsId) =>
    browserManager.getManagedBrowserGuestContext(webContentsId),
  resolveWebContentsIdForPage: (browserPageId) =>
    browserManager.getGuestWebContentsId(browserPageId),
  resolveWebContents: (webContentsId) => webContents.fromId(webContentsId) ?? null,
  onFailureChanged: (webContentsId, failure, navigationUrl) =>
    browserManager.notifyCertificateFailureChanged(webContentsId, failure, navigationUrl)
})
browserManager.setCertificateTrustController(browserCertificateTrustController)
