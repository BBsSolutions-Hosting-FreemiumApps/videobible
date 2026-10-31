import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import boekenJson from '../../data/boeken.json';
import structuurJson from '../../data/versstructuur.json';
import type { BoekInfo } from './types';
import { bouwAliasIndex, parseVerwijzing } from './verwijzing-parser';

const boeken = boekenJson as BoekInfo[];
const verzen = (structuurJson as { boeken: Record<string, number[]> }).boeken;

function parse(invoer: string) {
  return parseVerwijzing(invoer, boeken, verzen);
}

describe('verwijzing-parser', () => {
  it('heeft unieke aliassen', () => {
    expect(() => bouwAliasIndex(boeken)).not.toThrow();
    expect(bouwAliasIndex(boeken).size).toBeGreaterThan(66);
  });

  it('herkent de voorbeelden uit de spec', () => {
    expect(parse('Joh 3:16')).toEqual({ boek: 'joh', hoofdstuk: 3, van: 16, tot: 16 });
    expect(parse('Johannes 3:16-18')).toEqual({ boek: 'joh', hoofdstuk: 3, van: 16, tot: 18 });
    expect(parse('Johannes 3:16–18')).toEqual({ boek: 'joh', hoofdstuk: 3, van: 16, tot: 18 });
    expect(parse('  joh.  3 : 16  ')).toEqual({ boek: 'joh', hoofdstuk: 3, van: 16, tot: 16 });
  });

  it('herkent boeken met een nummer en een bereik', () => {
    expect(parse('1 Korinthe 13:4-7')).toEqual({ boek: '1kor', hoofdstuk: 13, van: 4, tot: 7 });
    expect(parse('1 Korintiërs 13:1')).toMatchObject({ boek: '1kor', hoofdstuk: 13, van: 1 });
    expect(parse('Psalmen 23')).toEqual({ boek: 'ps', hoofdstuk: 23, van: null, tot: null });
    expect(parse('Ps 119:176')).toEqual({ boek: 'ps', hoofdstuk: 119, van: 176, tot: 176 });
    expect(parse('1 Johannes 1:1')?.boek).toBe('1joh');
    expect(parse('Johannes 1:1')?.boek).toBe('joh');
  });

  it('wijst ongeldige verwijzingen af', () => {
    expect(parse('')).toBeNull();
    expect(parse('geen boek 1:1')).toBeNull();
    expect(parse('Joh 22')).toBeNull();
    expect(parse('Joh 3:0')).toBeNull();
    expect(parse('Joh 3:99')).toBeNull();
    expect(parse('Joh 3:18-16')).toBeNull();
    expect(parse('Judas 2')).toBeNull();
  });

  it('herkent elk boek op naam', () => {
    for (const boek of boeken) {
      const gevonden = parse(`${boek.naam} 1:1`);
      expect(gevonden?.boek, boek.naam).toBe(boek.id);
      expect(parse(`${boek.naam} ${boek.hoofdstukken + 1}`)).toBeNull();
    }
  });
});

describe('brontekst Johannes 3', () => {
  it('bewaart het vers uit het bronbestand', () => {
    const joh = JSON.parse(readFileSync('data/bijbel/nbg1951/joh.json', 'utf8'));
    const vers = joh.hoofdstukken[2].verzen[15].tekst;
    expect(vers).toBe(
      'Want alzo lief heeft God de wereld gehad, dat Hij zijn eniggeboren Zoon gegeven heeft, opdat een ieder, die in Hem gelooft, niet verloren ga, maar eeuwig leven hebbe.',
    );
  });
});
