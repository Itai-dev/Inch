/**
 * A booking enquiry as an email, ready to send: the models named in the subject, and the
 * brief laid out in the body, so the client only fills in the gaps and we can quote at once.
 */
export function enquiryMailto(email: string, { brand, models = [], link }: { brand: string; models?: string[]; link?: string }) {
  const who = models.length ? ` — ${models.join(', ')}` : ''
  const subject = `Booking enquiry${who} · ${brand}`
  const body = [
    'Client / brand:',
    'Project (campaign, editorial, show, e-com…):',
    'Shoot dates:',
    'Location:',
    'Usage (media, territory, period):',
    'Budget:',
    '',
    ...(models.length ? [`Models: ${models.join(', ')}`] : []),
    ...(link ? [link] : []),
  ].join('\n')
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
