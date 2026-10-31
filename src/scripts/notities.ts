import boekenJson from '../../data/boeken.json';
import type { BoekInfo } from '../lib/types';
import { pad } from '../lib/paden';

const boeken = boekenJson as BoekInfo[];
const DB = 'videobijbel';
const STORE = 'notities';

interface Notitie {
  id: string;
  verwijzing: { boek: string; hoofdstuk: number; vers: number };
  tekst: string;
  aangemaakt: string;
  gewijzigd: string;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const aanvraag = indexedDB.open(DB, 1);
    aanvraag.onupgradeneeded = () => aanvraag.result.createObjectStore(STORE, { keyPath: 'id' });
    aanvraag.onsuccess = () => resolve(aanvraag.result);
    aanvraag.onerror = () => reject(aanvraag.error);
  });
}

async function alles(): Promise<Notitie[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const aanvraag = db.transaction(STORE).objectStore(STORE).getAll();
    aanvraag.onsuccess = () => resolve((aanvraag.result as Notitie[]).sort((a, b) => b.gewijzigd.localeCompare(a.gewijzigd)));
    aanvraag.onerror = () => reject(aanvraag.error);
  });
}

async function bewaar(notitie: Notitie) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const aanvraag = db.transaction(STORE, 'readwrite').objectStore(STORE).put(notitie);
    aanvraag.onsuccess = () => resolve();
    aanvraag.onerror = () => reject(aanvraag.error);
  });
}

function naamVan(id: string) {
  return boeken.find((boek) => boek.id === id)?.naam ?? id;
}

function teken(lijst: Notitie[]) {
  const leeg = document.querySelector<HTMLElement>('[data-notities-leeg]');
  const plek = document.querySelector<HTMLElement>('[data-notities-lijst]');
  if (leeg) leeg.hidden = lijst.length !== 0;
  if (!plek) return;
  plek.replaceChildren();
  for (const notitie of lijst) {
    const artikel = document.createElement('article');
    artikel.className = 'resultaat';
    const kop = document.createElement('a');
    kop.href = `${pad('lezen', notitie.verwijzing.boek, notitie.verwijzing.hoofdstuk)}#v${notitie.verwijzing.vers}`;
    kop.textContent = `${naamVan(notitie.verwijzing.boek)} ${notitie.verwijzing.hoofdstuk}:${notitie.verwijzing.vers}`;
    const tekst = document.createElement('p');
    tekst.textContent = notitie.tekst;
    const bewerken = document.createElement('button');
    bewerken.type = 'button';
    bewerken.className = 'tekstknop';
    bewerken.textContent = 'Bewerken';
    bewerken.addEventListener('click', () => {
      const veld = document.querySelector<HTMLTextAreaElement>('#notitie-tekst');
      const idVeld = document.querySelector<HTMLInputElement>('#notitie-id');
      if (veld) veld.value = notitie.tekst;
      if (idVeld) idVeld.value = notitie.id;
      veld?.focus();
    });
    const verwijderen = document.createElement('button');
    verwijderen.type = 'button';
    verwijderen.className = 'tekstknop';
    verwijderen.textContent = 'Verwijderen';
    verwijderen.addEventListener('click', async () => {
      const db = await openDb();
      await new Promise<void>((resolve, reject) => {
        const aanvraag = db.transaction(STORE, 'readwrite').objectStore(STORE).delete(notitie.id);
        aanvraag.onsuccess = () => resolve();
        aanvraag.onerror = () => reject(aanvraag.error);
      });
      teken(await alles());
    });
    artikel.append(kop, tekst, bewerken, verwijderen);
    plek.append(artikel);
  }
}

async function start() {
  const params = new URLSearchParams(location.search);
  const boek = params.get('boek') || '';
  const hoofdstuk = params.get('hoofdstuk') || '';
  const vers = params.get('vers') || '';
  const doel = document.querySelector('[data-notitie-doel]');
  if (doel && boek && hoofdstuk && vers) {
    doel.textContent = `${naamVan(boek)} ${hoofdstuk}:${vers}`;
  }
  document.querySelector('#notitie-boek')?.setAttribute('value', boek);
  document.querySelector('#notitie-hoofdstuk')?.setAttribute('value', hoofdstuk);
  document.querySelector('#notitie-vers')?.setAttribute('value', vers);

  document.querySelector('#notitie-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const data = new FormData(form);
    const tekst = String(data.get('tekst') || '').trim();
    const boekId = String(data.get('boek') || boek);
    const hfst = Number(data.get('hoofdstuk') || hoofdstuk);
    const versNr = Number(data.get('vers') || vers);
    if (!tekst || !boekId || !hfst || !versNr) return;
    const nu = new Date().toISOString();
    const id = String(data.get('id') || crypto.randomUUID());
    const bestaand = (await alles()).find((item) => item.id === id);
    await bewaar({
      id,
      verwijzing: { boek: boekId, hoofdstuk: hfst, vers: versNr },
      tekst,
      aangemaakt: bestaand?.aangemaakt || nu,
      gewijzigd: nu,
    });
    const bevestiging = document.querySelector<HTMLElement>('[data-notitie-bewaard]');
    if (bevestiging) bevestiging.hidden = false;
    form.reset();
    teken(await alles());
  });

  document.querySelector('[data-exporteer]')?.addEventListener('click', async () => {
    const blob = new Blob([JSON.stringify(await alles(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'videobijbel-notities.json';
    link.click();
    URL.revokeObjectURL(url);
  });

  document.querySelector<HTMLInputElement>('[data-importeer]')?.addEventListener('change', async (event) => {
    const bestand = (event.target as HTMLInputElement).files?.[0];
    if (!bestand) return;
    const inhoud = JSON.parse(await bestand.text()) as Notitie[];
    if (!Array.isArray(inhoud)) return;
    for (const notitie of inhoud) {
      if (notitie?.id && notitie.tekst && notitie.verwijzing?.boek) await bewaar(notitie);
    }
    teken(await alles());
  });

  document.querySelector('[data-wissen]')?.addEventListener('click', async () => {
    if (!confirm('Alle notities op dit apparaat wissen? Dit kan niet ongedaan worden gemaakt.')) return;
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const aanvraag = db.transaction(STORE, 'readwrite').objectStore(STORE).clear();
      aanvraag.onsuccess = () => resolve();
      aanvraag.onerror = () => reject(aanvraag.error);
    });
    teken(await alles());
  });

  teken(await alles());
}

void start();
