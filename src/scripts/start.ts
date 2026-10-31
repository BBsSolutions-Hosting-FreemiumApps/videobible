import boekenJson from '../../data/boeken.json';
import structuurJson from '../../data/versstructuur.json';
import type { BoekInfo } from '../lib/types';
import { pad, padVanVerwijzing } from '../lib/paden';
import { parseVerwijzing } from '../lib/verwijzing-parser';

const boeken = boekenJson as BoekInfo[];
const verzen = (structuurJson as { boeken: Record<string, number[]> }).boeken;
const STAPPEN = ['klein', 'normaal', 'groot', 'extra'] as const;
const INST = 'vb-instellingen';
const POS = 'vb-laatste-positie';
const YT = 'vb-yt-toestemming';
const EMBED = 'https://www.youtube-nocookie.com/embed/';

type Instellingen = { lettergrootte: string; thema: 'licht' | 'donker'; versnummers: boolean };

function leesInst(): Instellingen {
  try {
    const ruw = localStorage.getItem(INST);
    if (ruw) return { lettergrootte: 'normaal', thema: 'licht', versnummers: true, ...JSON.parse(ruw) };
  } catch { /* lokale opslag kan geblokkeerd zijn */ }
  return { lettergrootte: 'normaal', thema: 'licht', versnummers: true };
}

function schrijfInst(inst: Instellingen) {
  localStorage.setItem(INST, JSON.stringify(inst));
  document.documentElement.setAttribute('data-thema', inst.thema);
  document.documentElement.setAttribute('data-lettergrootte', inst.lettergrootte);
  if (inst.versnummers) document.documentElement.removeAttribute('data-versnummers');
  else document.documentElement.setAttribute('data-versnummers', 'uit');
  document.querySelectorAll<HTMLAnchorElement>('.versnummer').forEach((link) => {
    link.tabIndex = inst.versnummers ? 0 : -1;
  });
  const meta = document.getElementById('thema-kleur');
  meta?.setAttribute('content', inst.thema === 'donker' ? '#141B2D' : '#1F2A44');
}

function vulHoofdstukken(select: HTMLSelectElement, aantal: number, gekozen: number) {
  select.replaceChildren();
  for (let nr = 1; nr <= aantal; nr += 1) {
    const optie = document.createElement('option');
    optie.value = String(nr);
    optie.textContent = String(nr);
    if (nr === gekozen) optie.selected = true;
    select.append(optie);
  }
}

function gaNaarBoek(boekId: string, hoofdstuk: number) {
  const boek = boeken.find((item) => item.id === boekId);
  if (!boek) return;
  const nr = Math.min(Math.max(1, hoofdstuk), boek.hoofdstukken);
  location.href = pad('lezen', boekId, nr);
}

function laadVideo(facade: HTMLElement) {
  if (facade.dataset.geladen === 'ja') return;
  const id = facade.dataset.youtubeId;
  if (!id) return;
  const iframe = document.createElement('iframe');
  iframe.src = `${EMBED}${encodeURIComponent(id)}?rel=0`;
  iframe.title = facade.dataset.titel || 'Video';
  iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  iframe.allowFullscreen = true;
  iframe.referrerPolicy = 'strict-origin-when-cross-origin';
  const plek = facade.querySelector<HTMLElement>('[data-speler]');
  if (!plek) return;
  plek.hidden = false;
  plek.replaceChildren(iframe);
  facade.dataset.geladen = 'ja';
  facade.querySelectorAll<HTMLElement>('[data-laden], [data-altijd], .video-boog').forEach((el) => {
    el.hidden = true;
  });
}

function start() {
  const inst = leesInst();
  schrijfInst(inst);
  const dialoog = document.getElementById('leesinstellingen') as HTMLDialogElement | null;
  document.querySelectorAll<HTMLButtonElement>('[data-open-instellingen]').forEach((knop) => {
    knop.addEventListener('click', () => {
      if (!dialoog) return;
      dialoog.querySelectorAll<HTMLInputElement>('input[name="thema"]').forEach((input) => {
        input.checked = input.value === inst.thema;
      });
      const vak = dialoog.querySelector<HTMLInputElement>('#versnummers');
      if (vak) vak.checked = inst.versnummers;
      dialoog.showModal();
    });
  });
  document.getElementById('instellingen-sluiten')?.addEventListener('click', () => dialoog?.close());
  document.getElementById('tekst-kleiner')?.addEventListener('click', () => {
    const index = Math.max(0, STAPPEN.indexOf(inst.lettergrootte as typeof STAPPEN[number]) - 1);
    inst.lettergrootte = STAPPEN[index] ?? 'klein';
    schrijfInst(inst);
  });
  document.getElementById('tekst-groter')?.addEventListener('click', () => {
    const index = Math.min(STAPPEN.length - 1, Math.max(0, STAPPEN.indexOf(inst.lettergrootte as typeof STAPPEN[number])) + 1);
    inst.lettergrootte = STAPPEN[index] ?? 'extra';
    schrijfInst(inst);
  });
  dialoog?.querySelectorAll<HTMLInputElement>('input[name="thema"]').forEach((input) => {
    input.addEventListener('change', () => {
      if (input.checked) {
        inst.thema = input.value === 'donker' ? 'donker' : 'licht';
        schrijfInst(inst);
      }
    });
  });
  dialoog?.querySelector<HTMLInputElement>('#versnummers')?.addEventListener('change', (event) => {
    inst.versnummers = (event.target as HTMLInputElement).checked;
    schrijfInst(inst);
  });
  document.querySelector<HTMLButtonElement>('[data-thema-wissel]')?.addEventListener('click', () => {
    inst.thema = inst.thema === 'donker' ? 'licht' : 'donker';
    schrijfInst(inst);
  });

  const kop = document.querySelector<HTMLElement>('[data-kop]');
  const boekKies = document.querySelector<HTMLSelectElement>('[data-boek-kies]');
  const hfstKies = document.querySelector<HTMLSelectElement>('[data-hfst-kies]');
  boekKies?.addEventListener('change', () => {
    const optie = boekKies.selectedOptions[0];
    const max = Number(optie?.dataset.hoofdstukken || 1);
    const huidig = Number(kop?.dataset.hoofdstuk || 1);
    gaNaarBoek(boekKies.value, Math.min(huidig, max));
  });
  hfstKies?.addEventListener('change', () => gaNaarBoek(boekKies?.value || 'joh', Number(hfstKies.value)));

  const boekDialoog = document.getElementById('boekkiezer') as HTMLDialogElement | null;
  const mobielBoek = document.querySelector<HTMLSelectElement>('[data-boek-kies-mobiel]');
  const mobielHfst = document.querySelector<HTMLSelectElement>('[data-hfst-kies-mobiel]');
  document.querySelector('[data-open-boekkiezer]')?.addEventListener('click', () => boekDialoog?.showModal());
  mobielBoek?.addEventListener('change', () => {
    const max = Number(mobielBoek.selectedOptions[0]?.dataset.hoofdstukken || 1);
    if (mobielHfst) vulHoofdstukken(mobielHfst, max, 1);
  });
  document.querySelector('[data-open-hoofdstuk]')?.addEventListener('click', () => {
    gaNaarBoek(mobielBoek?.value || 'joh', Number(mobielHfst?.value || 1));
  });

  document.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      const veld = document.getElementById('kop-q') as HTMLInputElement | null;
      if (veld && getComputedStyle(veld).display !== 'none') veld.focus();
      else document.querySelector<HTMLButtonElement>('[data-open-instellingen]')?.focus();
    }
  });

  document.querySelectorAll<HTMLFormElement>('form[role="search"], form.held-zoek, form.zoek-balk').forEach((form) => {
    form.addEventListener('submit', (event) => {
      const veld = form.querySelector<HTMLInputElement>('input[name="q"]');
      const verwijzing = parseVerwijzing(veld?.value || '', boeken, verzen);
      if (!verwijzing) return;
      event.preventDefault();
      location.href = padVanVerwijzing(verwijzing);
    });
  });

  const padMatch = location.pathname.match(/\/lezen\/([^/]+)\/(\d+)\/?$/);
  if (padMatch) {
    const vers = location.hash.match(/^#v(\d+)$/);
    localStorage.setItem(POS, JSON.stringify({
      boek: padMatch[1],
      hoofdstuk: Number(padMatch[2]),
      vers: vers ? Number(vers[1]) : null,
    }));
  }

  const kaart = document.querySelector<HTMLElement>('[data-verder-lezen]');
  if (kaart && kop?.dataset.vast !== 'ja') {
    try {
      const ruw = localStorage.getItem(POS);
      if (ruw) {
        const positie = JSON.parse(ruw) as { boek: string; hoofdstuk: number; vers: number | null };
        const boek = boeken.find((item) => item.id === positie.boek);
        if (boek) {
          kaart.querySelector('[data-verder-leeg]')?.setAttribute('hidden', '');
          const gevuld = kaart.querySelector<HTMLElement>('[data-verder-gevuld]');
          if (gevuld) gevuld.hidden = false;
          const naam = kaart.querySelector('[data-verder-naam]');
          if (naam) naam.textContent = `${boek.naam} ${positie.hoofdstuk}`;
          const link = kaart.querySelector<HTMLAnchorElement>('[data-verder-link]');
          if (link) link.href = padVanVerwijzing(positie);
          const label = document.querySelector('[data-boek-label]');
          if (label && kop?.dataset.vast !== 'ja') label.textContent = `${boek.naam} ${positie.hoofdstuk}`;
        }
      }
    } catch { /* geen geldige leesgeschiedenis */ }
  }

  document.querySelectorAll<HTMLElement>('[data-video-facade]').forEach((facade) => {
    facade.addEventListener('click', (event) => {
      const knop = (event.target as HTMLElement).closest<HTMLElement>('[data-laden], [data-altijd]');
      if (!knop || !facade.contains(knop)) return;
      if (knop.hasAttribute('data-altijd')) {
        localStorage.setItem(YT, 'ja');
        document.querySelectorAll<HTMLElement>('[data-video-facade]').forEach(laadVideo);
      } else {
        laadVideo(facade);
      }
    });
  });
  if (localStorage.getItem(YT) === 'ja') {
    document.querySelectorAll<HTMLElement>('[data-video-facade]').forEach(laadVideo);
  }

  const privacyKnop = document.querySelector<HTMLButtonElement>('[data-yt-wijzig]');
  privacyKnop?.addEventListener('click', () => {
    if (localStorage.getItem(YT) === 'ja') localStorage.removeItem(YT);
    else localStorage.setItem(YT, 'ja');
    const bevestiging = document.querySelector<HTMLElement>('[data-yt-bevestiging]');
    if (bevestiging) bevestiging.hidden = false;
  });

  const filters = document.querySelector<HTMLElement>('[data-video-filters]');
  if (filters) {
    const boekFilter = filters.querySelector<HTMLSelectElement>('[data-filter-boek]');
    const themaFilter = filters.querySelector<HTMLSelectElement>('[data-filter-thema]');
    const wis = filters.querySelector('[data-wis-filters]');
    const leeg = document.querySelector<HTMLElement>('[data-geen-videos]');
    const pasToe = () => {
      const boek = boekFilter?.value || '';
      const thema = themaFilter?.value || '';
      let zichtbaar = 0;
      document.querySelectorAll<HTMLElement>('[data-video-facade]').forEach((kaart) => {
        const themas = (kaart.dataset.themas || '').split('|').filter(Boolean);
        const past = (!boek || kaart.dataset.boek === boek) && (!thema || themas.includes(thema));
        kaart.hidden = !past;
        if (past) zichtbaar += 1;
      });
      if (leeg) leeg.hidden = zichtbaar !== 0;
    };
    boekFilter?.addEventListener('change', pasToe);
    themaFilter?.addEventListener('change', pasToe);
    wis?.addEventListener('click', () => {
      if (boekFilter) boekFilter.value = '';
      if (themaFilter) themaFilter.value = '';
      pasToe();
    });
  }
}

start();
