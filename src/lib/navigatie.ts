import type { BoekInfo } from './types';

export interface BurenDoel {
  boek: BoekInfo;
  hoofdstuk: number;
}

export function buren(
  boekId: string,
  hoofdstuk: number,
  boeken: BoekInfo[],
): { vorige: BurenDoel | null; volgende: BurenDoel | null } {
  const index = boeken.findIndex((boek) => boek.id === boekId);
  const boek = boeken[index];
  if (!boek || index < 0) return { vorige: null, volgende: null };

  let vorige: BurenDoel | null = null;
  let volgende: BurenDoel | null = null;

  if (hoofdstuk > 1) vorige = { boek, hoofdstuk: hoofdstuk - 1 };
  else if (index > 0) {
    const eerder = boeken[index - 1];
    vorige = { boek: eerder, hoofdstuk: eerder.hoofdstukken };
  }

  if (hoofdstuk < boek.hoofdstukken) volgende = { boek, hoofdstuk: hoofdstuk + 1 };
  else if (index < boeken.length - 1) {
    volgende = { boek: boeken[index + 1], hoofdstuk: 1 };
  }

  return { vorige, volgende };
}
