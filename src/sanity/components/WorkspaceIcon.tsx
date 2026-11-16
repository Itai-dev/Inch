import { DOT_ICON, INCH_ICON } from './workspace-icons'

const icon = (svg: string, name: string) =>
  function WorkspaceIcon() {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`} alt={name} style={{ display: 'block', width: '100%', height: '100%' }} />
  }

/** The Studio's workspace switcher: INCH”'s ” and DOT.'s box instead of a letter on purple. */
export const InchIcon = icon(INCH_ICON, 'INCH”')
export const DotIcon = icon(DOT_ICON, 'DOT.')
