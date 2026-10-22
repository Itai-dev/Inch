/**
 * The email the scouts get for each application: the filled-in form, laid out like the comp card
 * (name large, the details in rows), and the four photos as thumbnails that open full size.
 * With the Studio's copies (when it saved them) the thumbnails link to the full pictures there;
 * otherwise the full pictures are also attached, and the thumbnails are embedded in the email.
 */

export type ApplicationPhoto = {
  /** Portrait, Medium, Full body, Profile. */
  label: string
  filename: string
  /** Base64 of the photo (as sent). */
  content: string
  /** The Studio's copy, when it saved one. */
  url?: string
}

type Row = [label: string, value: string | number | undefined | null]

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function applicationEmail({
  board,
  name,
  rows,
  experience,
  flags,
  photos,
  savedInStudio,
}: {
  board: string
  name: string
  rows: Row[]
  experience?: string
  flags: string[]
  photos: ApplicationPhoto[]
  savedInStudio: boolean
}) {
  const filled = rows.filter(([, v]) => v !== undefined && v !== null && v !== '')

  const text = [
    `${board} — new application`,
    name,
    '',
    ...filled.map(([k, v]) => `${k}: ${v}`),
    ...(experience ? ['', 'Experience:', experience] : []),
    ...(flags.length ? ['', ...flags] : []),
    '',
    savedInStudio ? 'Photos: in the Studio → Applications, and below.' : 'Photos: attached.',
  ].join('\n')

  // Each photo: a thumbnail that opens the full picture (the Studio's, or the attachment's own image).
  const thumb = (p: ApplicationPhoto, i: number) => {
    const src = p.url ? `${p.url}?w=520&h=693&fit=crop&auto=format` : `cid:photo-${i}`
    const img = `<img src="${esc(src)}" width="248" alt="${esc(p.label)}" style="display:block;width:100%;max-width:248px;height:auto;border:0;background:#e6e3dc">`
    const link = p.url ? `<a href="${esc(p.url)}" target="_blank" style="text-decoration:none">${img}</a>` : img
    return `<td style="padding:4px;vertical-align:top;width:50%">${link}<div style="font:600 10px/1.4 Helvetica,Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#6b6965;padding-top:6px">${esc(p.label)}${p.url ? ' · open full size ↗' : ''}</div></td>`
  }
  const pairs = [photos.slice(0, 2), photos.slice(2, 4)].filter((r) => r.length)

  const html = `<!doctype html><html><body style="margin:0;background:#f4f3ef">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f3ef"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#efede8;border:1px solid #d3d0c9">
  <tr><td style="padding:28px 32px 8px;font:600 11px/1.4 Helvetica,Arial,sans-serif;letter-spacing:.22em;text-transform:uppercase;color:#6b6965">${esc(board)} — Application</td></tr>
  <tr><td style="padding:0 32px 18px;font:800 40px/1 Helvetica,Arial,sans-serif;letter-spacing:-.02em;text-transform:uppercase;color:#0a0a0a">${esc(name)}</td></tr>
  ${flags.map((f) => `<tr><td style="padding:0 32px 12px"><span style="display:inline-block;font:700 11px/1 Helvetica,Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#0a0a0a;border:1px solid #0a0a0a;padding:6px 8px">${esc(f)}</span></td></tr>`).join('')}
  <tr><td style="padding:0 32px 8px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${filled
        .map(
          ([k, v]) =>
            `<tr><td style="padding:9px 0;border-top:1px solid #dedbd4;font:400 12px/1.4 Helvetica,Arial,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#6b6965;width:38%">${esc(k)}</td><td style="padding:9px 0;border-top:1px solid #dedbd4;font:700 15px/1.4 Helvetica,Arial,sans-serif;color:#0a0a0a">${esc(String(v))}</td></tr>`,
        )
        .join('')}
    </table>
  </td></tr>
  ${experience ? `<tr><td style="padding:12px 32px 8px;font:400 12px/1.4 Helvetica,Arial,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#6b6965">Experience</td></tr><tr><td style="padding:0 32px 16px;font:400 15px/1.5 Helvetica,Arial,sans-serif;color:#0a0a0a;white-space:pre-line">${esc(experience)}</td></tr>` : ''}
  <tr><td style="padding:16px 28px 8px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${pairs.map((r, k) => `<tr>${r.map((p, j) => thumb(p, k * 2 + j)).join('')}</tr>`).join('')}</table>
  </td></tr>
  <tr><td style="padding:8px 32px 28px;font:400 12px/1.5 Helvetica,Arial,sans-serif;color:#6b6965">${
    savedInStudio ? 'Tap a photo to open it full size. The application is also in the Studio → Applications.' : 'The full-size photos are attached to this email: tap one to open it.'
  } Reply to this email to answer the applicant.</td></tr>
</table>
</td></tr></table>
</body></html>`

  // Embedded thumbnails (when there are no Studio links) plus the full pictures as attachments.
  const attachments = [
    ...(savedInStudio ? [] : photos.map((p, i) => ({ filename: `thumb-${p.filename}`, content: p.content, content_id: `photo-${i}` }))),
    ...photos.map((p) => ({ filename: p.filename, content: p.content })),
  ]
  return { text, html, attachments }
}
