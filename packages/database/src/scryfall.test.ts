import { statValue } from './scryfall';

// Here's a look at every unusual power and toughness value in mtg at time of writing (March 2025).
// powerValue and toughnessValue here are the result of calling parseFloat on the provided string.
//
// CREATE COLLATION numeric (provider = icu, locale = 'en-u-kn-true');
//
// SELECT pair AS values
// FROM (
//   SELECT pair FROM (
//     SELECT DISTINCT format('%s => %s', power, ROUND("powerValue", 1)) AS pair
//     FROM "Card"
//     WHERE power !~ '^\d+$'

//     UNION

//     SELECT DISTINCT format('%s => %s', toughness, ROUND("toughnessValue", 1)) AS pair
//     FROM "Card"
//     WHERE toughness !~ '^\d+$'
//   ) AS combined
//   ORDER BY pair COLLATE "numeric"
// ) AS ordered;
//
//  -0 => 0.0
//  -1 => -1.0
//  ? =>
//  .5 => 0.5
//  * =>
//  *+1 =>
//  *² =>
//  +0 => 0.0
//  +1 => 1.0
//  +2 => 2.0
//  +3 => 3.0
//  +4 => 4.0
//  ∞ =>
//  1.5 => 1.5
//  1+* => 1.0
//  2.5 => 2.5
//  2+* => 2.0
//  3.5 => 3.5
//  7-* => 7.0
//
// This is mostly as Scryfall treats them, but we will set '∞' to a very high number
// and other unrecognized values to 0 to match Scryfall.
//
// See:
// https://scryfall.com/search?q=power%3E1000
// https://scryfall.com/search?q=power%3D0+%28shellephant+OR+tarmogoyf%29
// https://scryfall.com/search?q=toughness%3D1+t%3Alhurgoyf

describe('statValue', () => {
  it('should return null when no value is provided', () => {
    expect(statValue(undefined)).toBeNull();
  });

  it ('should handle simple integers', () => {
    expect(statValue('0')).toBe(0);
    expect(statValue('1')).toBe(1);
    expect(statValue('2')).toBe(2);
    expect(statValue('9')).toBe(9);
    expect(statValue('10')).toBe(10);
    expect(statValue('15')).toBe(15);
    expect(statValue('20')).toBe(20);
    expect(statValue('99')).toBe(99);
  });

  it('should handle plus/minus prefixes', () => {
    expect(statValue('-0')).toBe(-0); // Jest thinks 0 and -0 are not the same.
    expect(statValue('-1')).toBe(-1);
    expect(statValue('+0')).toBe(0);
    expect(statValue('+1')).toBe(1);
    expect(statValue('+2')).toBe(2);
    expect(statValue('+3')).toBe(3);
    expect(statValue('+4')).toBe(4);
  });

  it('should handle decimal values', () => {
    expect(statValue('.5')).toBe(0.5);
    expect(statValue('1.5')).toBe(1.5);
    expect(statValue('2.5')).toBe(2.5);
    expect(statValue('3.5')).toBe(3.5);
  });

  it('should "ignore" stars', () => {
    expect(statValue('*')).toBe(0);
    expect(statValue('*+1')).toBe(1);
    expect(statValue('1+*')).toBe(1);
    expect(statValue('2+*')).toBe(2);
    expect(statValue('7-*')).toBe(7);
    expect(statValue('*²')).toBe(0);
  });

  it('should handle special characters', () => {
    expect(statValue('?')).toBe(0);
  });

  it('should handle infinity symbol', () => {
    expect(statValue('∞')).toBe(Number.MAX_VALUE);
  });

  it('should return the number part of unknown values, or zero when it has no idea', () => {
    // Unlike all the other tests these are not (currently) valid mtg power/toughness values.
    // If there's a number in there somewhere we will use it, otherwise default to 0 as with '*' and '?'.
    expect(statValue('')).toBe(0); // Funnily enough there are no cards with empty string for power or toughness currently.
    expect(statValue('abc')).toBe(0);
    expect(statValue('5abc')).toBe(5);
    expect(statValue('abc5')).toBe(5);
  });
});