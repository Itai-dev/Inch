'use client'

/** Country, from the full list of countries (names in English). */
import { useId } from 'react'

// Every country, in English: one fixed list, so the page and the browser always agree.
const NAMES: string[] = [
  "Afghanistan", "Åland Islands", "Albania", "Algeria", "American Samoa", "Andorra", "Angola", "Anguilla",
  "Antarctica", "Antigua & Barbuda", "Argentina", "Armenia", "Aruba", "Australia", "Austria", "Azerbaijan",
  "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bermuda",
  "Bhutan", "Bolivia", "Bosnia & Herzegovina", "Botswana", "Bouvet Island", "Brazil",
  "British Indian Ocean Territory", "British Virgin Islands", "Brunei", "Bulgaria", "Burkina Faso",
  "Burundi", "Cambodia", "Cameroon", "Canada", "Cape Verde", "Caribbean Netherlands", "Cayman Islands",
  "Central African Republic", "Chad", "Chile", "China", "Christmas Island", "Cocos (Keeling) Islands",
  "Colombia", "Comoros", "Congo - Brazzaville", "Congo - Kinshasa", "Cook Islands", "Costa Rica",
  "Côte d’Ivoire", "Croatia", "Cuba", "Curaçao", "Cyprus", "Czechia", "Denmark", "Djibouti", "Dominica",
  "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia",
  "Eswatini", "Ethiopia", "Falkland Islands", "Faroe Islands", "Fiji", "Finland", "France", "French Guiana",
  "French Polynesia", "French Southern Territories", "Gabon", "Gambia", "Georgia", "Germany", "Ghana",
  "Gibraltar", "Greece", "Greenland", "Grenada", "Guadeloupe", "Guam", "Guatemala", "Guernsey", "Guinea",
  "Guinea-Bissau", "Guyana", "Haiti", "Heard & McDonald Islands", "Honduras", "Hong Kong SAR China",
  "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Isle of Man", "Israel", "Italy",
  "Jamaica", "Japan", "Jersey", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kosovo", "Kuwait",
  "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania",
  "Luxembourg", "Macao SAR China", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta",
  "Marshall Islands", "Martinique", "Mauritania", "Mauritius", "Mayotte", "Mexico", "Micronesia", "Moldova",
  "Monaco", "Mongolia", "Montenegro", "Montserrat", "Morocco", "Mozambique", "Myanmar (Burma)", "Namibia",
  "Nauru", "Nepal", "Netherlands", "New Caledonia", "New Zealand", "Nicaragua", "Niger", "Nigeria", "Niue",
  "Norfolk Island", "North Korea", "North Macedonia", "Northern Mariana Islands", "Norway", "Oman",
  "Pakistan", "Palau", "Palestinian Territories", "Panama", "Papua New Guinea", "Paraguay", "Peru",
  "Philippines", "Pitcairn Islands", "Poland", "Portugal", "Puerto Rico", "Qatar", "Réunion", "Romania",
  "Russia", "Rwanda", "Samoa", "San Marino", "São Tomé & Príncipe", "Saudi Arabia", "Senegal", "Serbia",
  "Seychelles", "Sierra Leone", "Singapore", "Sint Maarten", "Slovakia", "Slovenia", "Solomon Islands",
  "Somalia", "South Africa", "South Georgia & South Sandwich Islands", "South Korea", "South Sudan", "Spain",
  "Sri Lanka", "St. Barthélemy", "St. Helena", "St. Kitts & Nevis", "St. Lucia", "St. Martin",
  "St. Pierre & Miquelon", "St. Vincent & Grenadines", "Sudan", "Suriname", "Svalbard & Jan Mayen", "Sweden",
  "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tokelau",
  "Tonga", "Trinidad & Tobago", "Tunisia", "Türkiye", "Turkmenistan", "Turks & Caicos Islands", "Tuvalu",
  "U.S. Outlying Islands", "U.S. Virgin Islands", "Uganda", "Ukraine", "United Arab Emirates",
  "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela",
  "Vietnam", "Wallis & Futuna", "Western Sahara", "Yemen", "Zambia", "Zimbabwe",
]
const countries = () => NAMES

const narrow = { fontStretch: '80%' } as const

/** Country as the device's own picker (a wheel on a phone, a list on a computer), as the other choices are. */
export function CountrySelect({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void; inputClassName?: string }) {
  const id = useId()
  return (
    <div className="relative flex min-w-0 flex-col gap-2">
      <label htmlFor={`${id}-select`} className="text-[13px] uppercase tracking-[0.04em]" style={narrow}>
        {label}
      </label>
      <span className="relative block">
        <select
          id={`${id}-select`}
          data-country
          required
          autoComplete="country-name"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full cursor-pointer appearance-none truncate rounded-none border-b-2 bg-transparent pb-1.5 pr-6 text-[clamp(22px,2.1vw,30px)] font-semibold outline-none ${value ? 'border-fg' : 'border-line text-muted/40 focus-visible:border-fg'}`}
        >
          <option value="" disabled>
            Choose
          </option>
          {countries().map((name) => (
            <option key={name} value={name} className="text-fg">
              {name}
            </option>
          ))}
        </select>
        <svg viewBox="0 0 12 8" aria-hidden className="pointer-events-none absolute right-0 top-1/2 w-3 -translate-y-[60%]">
          <path d="M1 1.5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      </span>
    </div>
  )
}
