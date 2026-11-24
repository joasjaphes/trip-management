import { CompanyProfile } from '../../models/company-profile.model';

type AddressFields = Partial<Pick<CompanyProfile, 'plot' | 'street' | 'region' | 'country' | 'postalAddress'>>;

const clean = (value: unknown): string => (value == null ? '' : String(value).trim());

/** Strips a leading "P.O. Box" / "PO BOX" so it can be re-added in a consistent format. */
export function stripPostalPrefix(value: string | null | undefined): string {
  return clean(value).replace(/^P\.?\s*O?\.?\s*BOX\.?\s*/i, '').trim();
}

/**
 * Upper-cased company address lines for printed documents, built from the company profile:
 *   PLOT NO. <plot> / <street> / P. O. BOX <postal> <region, or country if no region>
 * Lines whose profile fields are empty are omitted.
 */
export function companyAddressLines(profile: AddressFields | null | undefined): string[] {
  const plot = clean(profile?.plot).replace(/^plot\s*(no\.?|number)?\s*[:.]?\s*/i, '');
  const street = clean(profile?.street);
  const postal = stripPostalPrefix(profile?.postalAddress);
  const locality = clean(profile?.region) || clean(profile?.country);

  const postalLine = postal
    ? `P. O. BOX ${postal}${locality && !postal.toLowerCase().includes(locality.toLowerCase()) ? ' ' + locality : ''}`
    : locality;

  return [plot ? `PLOT NO. ${plot}` : '', street, postalLine]
    .filter((line) => !!line)
    .map((line) => line.toUpperCase());
}
