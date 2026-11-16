/**
 * Google Drive in the Studio: the agency's own Google Cloud project (its keys in Vercel, see
 * docs/google-drive.md). Google's sign-in gives a short-lived token for the files picked
 * (scope drive.file: only what is chosen in the picker, nothing else in the Drive), the
 * picker shows the Drive, and each picked photo is downloaded in the browser and handed to
 * the Studio, which uploads it like any other.
 */

export const driveConfig = {
  clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '',
  appId: process.env.NEXT_PUBLIC_GOOGLE_APP_ID || '',
}
/** Shown only once the agency's keys are set. */
export const driveEnabled = Boolean(driveConfig.clientId && driveConfig.apiKey && driveConfig.appId)

const SCOPE = 'https://www.googleapis.com/auth/drive.file'

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    google?: any
    gapi?: any
  }
}

const scripts = new Map<string, Promise<void>>()
function loadScript(src: string) {
  let p = scripts.get(src)
  if (!p) {
    p = new Promise<void>((resolve, reject) => {
      const s = document.createElement('script')
      s.src = src
      s.async = true
      s.onload = () => resolve()
      s.onerror = () => reject(new Error(`Could not load ${src}`))
      document.head.appendChild(s)
    })
    scripts.set(src, p)
  }
  return p
}

let token: { value: string; until: number } | null = null

/** A token for the picked files (asks the person to sign in with Google the first time, and when it runs out). */
async function getToken(): Promise<string> {
  if (token && Date.now() < token.until) return token.value
  await loadScript('https://accounts.google.com/gsi/client')
  return new Promise((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: driveConfig.clientId,
      scope: SCOPE,
      callback: (res: any) => {
        if (res.error) return reject(new Error(res.error_description || res.error))
        token = { value: res.access_token, until: Date.now() + (Number(res.expires_in) - 60) * 1000 }
        resolve(res.access_token)
      },
      error_callback: (err: any) => reject(new Error(err?.message || err?.type || 'Google sign-in was closed')),
    })
    client.requestAccessToken({ prompt: token ? '' : 'select_account' })
  })
}

async function loadPicker() {
  await loadScript('https://apis.google.com/js/api.js')
  await new Promise<void>((resolve) => window.gapi.load('picker', () => resolve()))
}

export type DriveFile = { id: string; name: string; mimeType: string }

/** Opens Google's picker on the Drive (photos, folders to browse, shared drives too). Resolves with the picked files, or [] if closed. */
export async function pickFromDrive({ multiple }: { multiple: boolean }): Promise<{ files: DriveFile[]; token: string }> {
  const [accessToken] = await Promise.all([getToken(), loadPicker()])
  const g = window.google
  return new Promise((resolve) => {
    const view = new g.picker.DocsView(g.picker.ViewId.DOCS_IMAGES).setIncludeFolders(true).setSelectFolderEnabled(false).setMode(g.picker.DocsViewMode.GRID)
    const shared = new g.picker.DocsView(g.picker.ViewId.DOCS_IMAGES).setIncludeFolders(true).setSelectFolderEnabled(false).setEnableDrives(true)
    let builder = new g.picker.PickerBuilder()
      .addView(view)
      .addView(shared)
      .setOAuthToken(accessToken)
      .setDeveloperKey(driveConfig.apiKey)
      .setAppId(driveConfig.appId)
      .setOrigin(window.location.protocol + '//' + window.location.host)
      .setTitle(multiple ? 'Choose photos (several at once: ⌘ / Ctrl)' : 'Choose a photo')
      .setCallback((data: any) => {
        if (data.action === g.picker.Action.PICKED) {
          resolve({ token: accessToken, files: data.docs.map((d: any) => ({ id: d.id, name: d.name, mimeType: d.mimeType })) })
        } else if (data.action === g.picker.Action.CANCEL) resolve({ token: accessToken, files: [] })
      })
    if (multiple) builder = builder.enableFeature(g.picker.Feature.MULTISELECT_ENABLED)
    builder = builder.enableFeature(g.picker.Feature.SUPPORT_DRIVES)
    const picker = builder.build()
    picker.setVisible(true)
    // Above the Studio's own dialogs.
    document.querySelectorAll<HTMLElement>('.picker-dialog, .picker-dialog-bg').forEach((el) => (el.style.zIndex = '200000'))
  })
}

/** Downloads a picked file as a File the Studio can upload. */
export async function downloadFromDrive(file: DriveFile, accessToken: string): Promise<File> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.id)}?alt=media&supportsAllDrives=true`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error(`Drive refused ${file.name} (${res.status})`)
  const blob = await res.blob()
  return new File([blob], file.name, { type: file.mimeType || blob.type })
}
