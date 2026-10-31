export interface BoekInfo {
  id: string;
  naam: string;
  kort: string;
  testament: 'OT' | 'NT';
  afkortingen: string[];
  hoofdstukken: number;
}

export interface Vers {
  nr: number;
  tekst: string;
}

export interface Hoofdstuk {
  nr: number;
  verzen: Vers[];
}

export interface Bijbelboek {
  boek: string;
  naam: string;
  testament: 'OT' | 'NT';
  voorbeeld: boolean;
  bron: string | null;
  hoofdstukken: Hoofdstuk[];
}

export interface Verwijzing {
  boek: string;
  hoofdstuk: number;
  van: number | null;
  tot: number | null;
}

export interface VideoVerwijzing {
  boek: string;
  hoofdstuk: number;
  van: number;
  tot: number;
}

export interface Video {
  id: string;
  youtubeId: string;
  titel: string;
  kanaal: string;
  verwijzing: VideoVerwijzing | null;
  themas: string[];
  gecontroleerdOp: string | null;
  opmerking: string;
  playlist: string;
  positie: number;
}

export interface Leesplan {
  id: string;
  naam: string;
  dagen: number;
  lezingen: string[];
}
