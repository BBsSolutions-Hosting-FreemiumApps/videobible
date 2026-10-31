/** SEO-titels en meta descriptions uit webteksten-v1, sectie 10. */
export const seo = {
  home: {
    titel: 'Videobijbel — De Bijbel, dicht bij de tekst',
    beschrijving:
      "Lees de Bijbel in de NBG-vertaling 1951. Ontdek passende video's, uitleg, leesplannen en ruimte voor eigen notities.",
  },
  lezen: {
    titel: 'Bijbel lezen — NBG 1951 — Videobijbel',
    beschrijving:
      "Lees de NBG-vertaling 1951 online. Kies een boek en hoofdstuk en ontdek video's, uitleg en notities bij de tekst.",
  },
  videos: {
    titel: "Bijbelvideo's bij de tekst — Videobijbel",
    beschrijving:
      "Bekijk video's bij bijbelgedeelten. Filter op boek of thema en ga vanuit een video direct naar de bijbehorende tekst.",
  },
  zoeken: {
    titel: 'Zoeken in de Bijbel — Videobijbel',
    beschrijving:
      'Zoek woorden, zinnen en verwijzingen in de NBG-vertaling 1951. Vind snel het bijbehorende boek, hoofdstuk en vers.',
  },
  uitleg: {
    titel: 'Bijbeluitleg en achtergrond — Videobijbel',
    beschrijving:
      'Lees achtergrond en toelichting bij bijbelgedeelten, gebaseerd op de Elohim YHWH Studiebijbel 2026.',
  },
  notities: {
    titel: 'Mijn bijbelnotities — Videobijbel',
    beschrijving:
      'Bewaar eigen notities bij bijbelverzen in de browser. Exporteer aantekeningen en lees verder zonder account.',
  },
  leesplannen: {
    titel: 'Bijbelleesplannen — Videobijbel',
    beschrijving:
      'Kies een bijbelleesplan en lees in rustige stappen. Houd de voortgang lokaal bij, zonder account.',
  },
  blog: {
    titel: 'Theologie-updates — Videobijbel',
    beschrijving:
      'Lees artikelen over bijbelteksten, vertalingen en bijbelonderzoek. Met aandacht voor bronnen, vragen en verschillende inzichten.',
  },
  over: {
    titel: 'Over Videobijbel — Videobijbel',
    beschrijving:
      'Ontdek het doel van Videobijbel, de gebruikte bronnen en de verbinding met de Elohim YHWH Bijbel.',
  },
  privacy: {
    titel: 'Privacy en lokale opslag — Videobijbel',
    beschrijving:
      "Lees hoe Videobijbel omgaat met YouTube-video's, lokale leesinstellingen, notities, leesvoortgang en berichten via het contactformulier.",
  },
} as const;

export function titelLezen(boek: string, hoofdstuk: number): string {
  return `${boek} ${hoofdstuk} lezen — Videobijbel`;
}
