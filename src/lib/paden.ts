/** Basispad van de site, met afsluitende slash. */
export function basis(): string {
  const waarde = import.meta.env.BASE_URL || '/';
  return waarde.endsWith('/') ? waarde : `${waarde}/`;
}

/** Absoluut sitepad, met afsluitende slash. */
export function pad(...delen: Array<string | number>): string {
  const stuk = delen
    .map((deel) => String(deel).replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
    .join('/');
  return `${basis()}${stuk}${stuk ? '/' : ''}`;
}

export function padVanVerwijzing(
  verwijzing: { boek: string; hoofdstuk: number; van?: number | null },
): string {
  const doel = pad('lezen', verwijzing.boek, verwijzing.hoofdstuk);
  return verwijzing.van ? `${doel}#v${verwijzing.van}` : doel;
}
