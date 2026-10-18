import { sitePath, type Site } from '@/lib/sites'
import { DotBox, Logo } from './brand/Logo'
import { SiteSwitchLink } from './SiteSwitchLink'

/**
 * The other site's box (DOT. on INCH”, INCH” on DOT.), upright in the bottom-left corner on every
 * page, with a line above it saying where it goes. White + difference blend like the header, so
 * it inverts against whatever is behind it.
 */
export function SiteSwitch({ site }: { site: Site }) {
  const toInch = site === 'dot'
  const note = toInch ? 'For the women’s board, visit INCH”' : 'For the men’s board, visit DOT.'
  return (
    <SiteSwitchLink href={sitePath(toInch ? 'inch' : 'dot')} toInch={toInch} label={note} className="site-switch-tab flex flex-col items-start gap-[0.5em] text-paper mix-blend-difference">
      <span aria-hidden className="label whitespace-nowrap !leading-none">{note}</span>
      <span className="site-switch block origin-bottom-left text-[length:var(--tab)]">
        {toInch ? (
          <span className="flex items-center bg-paper pb-[0.16em] pl-[0.18em] pr-[0.16em] pt-[0.16em] text-ink">
            <Logo division="women" className="text-[1em] [&_svg]:!h-[0.74em]" />
          </span>
        ) : (
          <DotBox />
        )}
      </span>
    </SiteSwitchLink>
  )
}
