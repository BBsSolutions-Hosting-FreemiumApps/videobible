# Videobijbel

Statische Nederlandstalige bijbelwebsite. Na een merge naar `main` hoort de site op
[https://videobijbel.bbss.to/](https://videobijbel.bbss.to/).
Het basispad is `/`. GitHub Pages blijft **Deploy from a branch: main / root**.

## Wat werkt

- Home, leesoverzicht en alle 1189 hoofdstukken van de 66 boeken.
- Echte NBG 1951-tekst, versankers (`#v16`), vorig/volgend hoofdstuk ook over boekgrenzen.
- Leesinstellingen op dit apparaat: tekstgrootte, licht/donker, versnummers.
- Verder lezen onthoudt het laatst geopende hoofdstuk.
- Verwijzingen zoals `Joh 3:16` en `Johannes 3:16-18` openen het vers.
- Zoeken op woorden in de NBG-tekst, met filter op boek of testament.
- Video's uit de bevestigde playlist, achter een klik-om-te-laden-scherm op youtube-nocookie. Zonder toestemming geen verzoek naar YouTube.
- Altijd toestaan, intrekbaar op Privacy.
- Notities in IndexedDB, met export, import en alles wissen.
- Leesplannen, uitlegpagina's, blog, over en privacy volgens de webteksten.
- Uitgeschakeld contactformulier, zonder verzending.

## Wat nog placeholder is

- Geen video is aan een bijbelgedeelte gekoppeld (`koppeling nog te doen`).
- Geen studiebijbeluitleg ingeladen.
- Geen blogartikelen.
- De drie leesplannen hebben het label **Binnenkort**, zonder dagindeling en zonder startknop.
- Het contactformulier heeft het label **Binnenkort beschikbaar** en verstuurt niets.

## Bron van de tekst

De verzen komen uit het USFM-zipbestand van eBible, opgehaald op 31 oktober 2026:

- <https://ebible.org/Scriptures/nldnbg_usfm.zip>
- <https://ebible.org/Bible/details.php?id=nldnbg>

66 boeken, 1189 hoofdstukken, 31167 verzen. De tekst is niet overgetypt. Tussentitels uit de USFM zijn niet opgenomen. Negen verzen stonden in de bron als `a`/`b` en zijn samengevoegd; de lijst staat in `data/bron-tekst.json`.

Op de site staan twee rechtenregels naast elkaar, zodat Ben ze kan controleren:

- Auteursrecht © 2026 Elohim YHWH Bijbel, met link naar <https://elohim-yhwh-bijbel.nl/>
- `copyright © 2024 Jantinus Daling. Released under the GNU Free Documentation License.` met link naar <https://www.gnu.org/licenses/fdl-1.3.en.html> en naar <https://gitlab.com/jtdaling/nbg-vertaling-1951>

Beide staan in de footer en bij Bronnen op Over. De letterlijke bronregel staat in `data/bron-tekst.json` onder `vermelding`.

Opnieuw importeren: `node scripts/importeer-bijbel.mjs <usfm-map-of-zip>`.
Voorbeeldverzen, alleen als er nog geen echte tekst is: `node scripts/genereer-voorbeeldtekst.mjs`.

## Playlist

`yt-dlp --flat-playlist` op <https://www.youtube.com/playlist?list=PLNnDTBez4hlY> gaf drie video's:

| id | titel | kanaal |
| --- | --- | --- |
| rh9yjReuWH0 | The Gospel of Mark \| Full Movie | Jesus.net |
| 5tJbgPQxxzI | The Story of the Twelve Apostles \| Full Movie \| Joseph Steven \| Dennis Dotson \| Sam Gantous | Vision Video |
| yf9jWonGL74 | The Gospel According to Matthew \| Full Movie \| Bruce Marchiano \| Richard Kiley \| Gerrit Schoonhoven | Christian Movies |

Volledige beschrijvingen kwamen niet mee: de eerste video is in deze omgeving landelijk geblokkeerd, de andere twee vroegen een botcontrole. Geen titel noemt een hoofdstuk of vers, dus `verwijzing` is `null` en de opmerking is `koppeling nog te doen`. Thema's Marcus en Matteüs zijn uit de titel afgeleid. Er zijn geen video-id's verzonnen.

## Pagina's na een merge

GitHub Pages staat op **Deploy from a branch: main / root**. Die instelling blijft zo. Een merge naar `main` publiceert de HTML, CSS en lettertypen die al in de root staan, samen met `.nojekyll` (nodig voor de map `_astro`).

Het bestand `CNAME` in de root bevat `videobijbel.bbss.to`. Dezelfde regel staat in `public/`, zodat een volgende bouw hem meeneemt. Deze wijziging zet geen DNS-records. Het domein werkt pas als `videobijbel.bbss.to` al naar GitHub Pages wijst.

Lokaal, na een wijziging:

```bash
npm install
npm test
npm run bouw
```

`npm run bouw` maakt `dist/` en kopieert die site naar de root. Commit die bestanden mee. De workflow `.github/workflows/deploy.yml` start alleen met de hand (`workflow_dispatch`), draait de tests en de bouw, en publiceert niets.

## Volgende bouwstap

1. Zoekindex per boek tijdens de bouw, zodat zoeken het hele bestand niet eerst hoeft op te halen.
2. Uitleg uit de Elohim YHWH Studiebijbel 2026, met bron per passage, en notities verder uitbouwen.
3. Dagindelingen van de drie leesplannen, daarna pas een startknop en lokale voortgang.
4. Blogartikelen, onderwerpen en RSS.
5. Videokoppelingen zodra titel of beschrijving een passage noemt.
6. Lighthouse op desktop en mobiel (toegankelijkheid en SEO, streven ≥ 95) en de laatste contrastcontrole.
