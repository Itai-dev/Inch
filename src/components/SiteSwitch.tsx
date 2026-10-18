import { sitePath, type Site } from '@/lib/sites'
import { DotBox, Logo } from './brand/Logo'
import { SiteSwitchLink } from './SiteSwitchLink'

/**
 * The other site's box (DOT. on INCH”, INCH” on DOT.), turned on its side in the right margin,
 * halfway down the screen, on every page. White + difference blend like the header, so it inverts
 * against whatever is behind it. Hovering it slides out a note saying where it goes; the note is
 * its own element in the page's colours, so the blend never muddies it.
 */
export function SiteSwitch({ site }: { site: Site }) {
  const toInch = site === 'dot'
  const note = toInch ? 'For the women’s board, visit INCH”' : 'For the men’s board, visit DOT.'
  return (
    <>
      <SiteSwitchLink href={sitePath(toInch ? 'inch' : 'dot')} toInch={toInch} label={note} className="site-switch-tab text-paper mix-blend-difference">
        <span className="site-switch block">
          {toInch ? (
            <span className="flex items-center bg-paper pb-[0.16em] pl-[0.18em] pr-[0.16em] pt-[0.16em] text-ink">
              <Logo division="women" className="text-[1em] [&_svg]:!h-[0.74em]" />
            </span>
          ) : (
            <DotBox />
          )}
        </span>
      </SiteSwitchLink>
      <span aria-hidden className="site-switch-note label whitespace-nowrap bg-fg px-[0.9em] py-[0.6em] !leading-none text-bg">
        {note}
      </span>
    </>
  )
}
