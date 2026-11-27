import test from 'node:test';
import assert from 'node:assert/strict';
import { symbols } from '../src/symbols.js';
import { chartSymbols, manners, placedCells, placeGroups, places, vowels } from '../src/chart-layout.js';

test('chart view offers exactly the library inventory, each symbol once', () => {
  const onChart = chartSymbols();
  assert.equal(new Set(onChart).size, onChart.length, 'a symbol appears twice on the chart');
  const inventory = new Set(symbols.map(item => item.symbol));
  for (const symbol of onChart) assert.ok(inventory.has(symbol), `chart symbol not in library: ${symbol}`);
  const charted = new Set(onChart);
  for (const symbol of inventory) assert.ok(charted.has(symbol), `library symbol missing from chart: ${symbol}`);
});

test('every pulmonic row covers all places, and merged cells never straddle a narrow-pane slice', () => {
  const sliceOf = place => placeGroups.findIndex(group => place >= group.from && place <= group.to);
  for (const manner of manners) {
    assert.equal(manner.cells.reduce((sum, cell) => sum + cell.span, 0), places.length, manner.name);
    for (const cell of placedCells(manner)) {
      assert.equal(sliceOf(cell.place), sliceOf(cell.place + cell.span - 1), `${manner.name} at ${places[cell.place].name}`);
    }
  }
  const covered = placeGroups.flatMap(group => Array.from({ length: group.to - group.from + 1 }, (_, i) => group.from + i));
  assert.deepEqual(covered, places.map((_, i) => i));
});

test('pulmonic cells match the 2020 chart for a few landmark positions', () => {
  const at = (mannerName, placeName) => {
    const place = places.findIndex(p => p.name === placeName);
    return placedCells(manners.find(m => m.name === mannerName)).find(cell => place >= cell.place && place < cell.place + cell.span);
  };
  assert.deepEqual([at('Plosive', 'Alveolar').voiceless, at('Plosive', 'Alveolar').voiced], ['t', 'd']);
  assert.equal(at('Plosive', 'Dental').place, at('Plosive', 'Postalveolar').place, 'dental–postalveolar plosives share one cell');
  assert.deepEqual([at('Fricative', 'Dental').voiceless, at('Fricative', 'Postalveolar').voiced], ['θ', 'ʒ']);
  assert.equal(at('Plosive', 'Glottal').voiced, '#');
  assert.equal(at('Nasal', 'Pharyngeal').impossible, true);
  assert.equal(at('Trill', 'Velar').impossible, true);
  assert.equal(at('Lateral fricative', 'Bilabial').impossible, true);
});

test('vowel positions stay inside the trapezoid', () => {
  for (const vowel of vowels) {
    assert.ok(vowel.y >= 0 && vowel.y <= 1);
    assert.ok(vowel.x >= 0 && vowel.x <= 1);
    assert.ok(vowel.x >= 0.43 * vowel.y - 1e-9, `${vowel.left ?? vowel.center ?? vowel.right} is in front of the front edge`);
  }
});
