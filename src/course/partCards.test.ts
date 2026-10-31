import { describe, expect, it } from 'vitest';
import { WEEKS } from '.';
import { cardsForPart, partCardIds, unassigned } from './partCards';

describe('flashcards per lesson part', () => {
  it('lists only existing cards and covers every card of each week', () => {
    for (const w of WEEKS) {
      w.parts.forEach((_, pi) => expect(cardsForPart(w.num, pi).length, `week ${w.num} part ${pi + 1}`).toBe(partCardIds(w.num, pi).length));
      expect(unassigned(w.num).map((c) => c.id), `week ${w.num}`).toEqual([]);
    }
  });
});
