import test from 'node:test';
import assert from 'node:assert/strict';
import { symbols, categories, searchSymbols, displaySymbol } from '../src/symbols.js';
import { createPaneToggle, insertIntoWord } from '../src/word-actions.js';

test('inventory contains all standard categories and valid unique entries', () => {
  assert.equal(categories.length, 8);
  assert.ok(symbols.length > 170);
  assert.equal(new Set(symbols.map(s => s.symbol)).size, symbols.length);
  for (const item of symbols) { assert.ok(item.symbol); assert.ok(item.name); assert.ok(!item.symbol.includes('◌')); }
  for (const symbol of ['ə', 'ⱱ', 'ɧ', 'ǂ', 'ˈ', 'ꜜ', '|', '\u0303', '\u0361']) assert.ok(symbols.some(s => s.symbol === symbol));
});
test('search supports multiple words, symbols, and Unicode', () => {
  assert.ok(searchSymbols('voiceless velar').some(s => s.symbol === 'k'));
  assert.equal(searchSymbols('U+0259')[0].symbol, 'ə');
  assert.equal(searchSymbols('schwa')[0].symbol, 'ə');
  assert.equal(searchSymbols('no-such-symbol').length, 0);
});
test('dotted circle is only a display aid', () => {
  const nasal = symbols.find(s => s.symbol === '\u0303');
  assert.equal(displaySymbol(nasal), '◌\u0303');
  assert.equal(nasal.symbol, '\u0303');
});
test('Word insertion replaces selection, then collapses cursor after the inserted symbol', async () => {
  const calls = [];
  const word = { run: async callback => callback({
    document: { getSelection: () => ({ insertText: (text, location) => {
      calls.push([text, location]);
      return { getRange: position => { calls.push(position); return { select: () => calls.push('select') }; } };
    } }) }, sync: async () => calls.push('sync')
  }) };
  await insertIntoWord(word, '\u0303');
  assert.deepEqual(calls, [['\u0303', 'Replace'], 'End', 'select', 'sync']);
});
test('toggle handles repeated clicks and the native close button', async () => {
  const calls = [];
  const pane = createPaneToggle({ showAsTaskpane: async () => calls.push('show'), hide: async () => calls.push('hide') });
  await Promise.all([pane.toggle(), pane.toggle(), pane.toggle()]);
  pane.visibilityChanged('Hidden');
  await pane.toggle();
  assert.deepEqual(calls, ['show', 'hide', 'show', 'show']);
});
test('failed toggle does not corrupt state or prevent retry', async () => {
  let attempts = 0;
  const pane = createPaneToggle({ showAsTaskpane: async () => { if (++attempts === 1) throw new Error('host error'); }, hide: async () => assert.fail('should remain hidden') });
  await assert.rejects(pane.toggle());
  await pane.toggle();
  assert.equal(attempts, 2);
});
