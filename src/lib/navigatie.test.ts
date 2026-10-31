import { describe, expect, it } from 'vitest';
import boekenJson from '../../data/boeken.json';
import type { BoekInfo } from './types';
import { buren } from './navigatie';

const boeken = boekenJson as BoekInfo[];

describe('buren', () => {
  it('gaat binnen een boek en over de boekgrens', () => {
    const johannes = buren('joh', 3, boeken);
    expect(johannes.vorige).toMatchObject({ hoofdstuk: 2, boek: { id: 'joh' } });
    expect(johannes.volgende).toMatchObject({ hoofdstuk: 4, boek: { id: 'joh' } });

    const begin = buren('joh', 1, boeken);
    expect(begin.vorige).toMatchObject({ hoofdstuk: 24, boek: { id: 'luc' } });

    const genesis = buren('gen', 1, boeken);
    expect(genesis.vorige).toBeNull();

    const openbaring = buren('openb', 22, boeken);
    expect(openbaring.volgende).toBeNull();

    const maleachi = buren('mal', 4, boeken);
    expect(maleachi.volgende).toMatchObject({ hoofdstuk: 1, boek: { id: 'mat' } });
  });
});
