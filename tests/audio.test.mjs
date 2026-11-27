import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { recordings } from '../src/audio-map.js';
import { activateSymbol, createAudioPlayer } from '../src/audio-player.js';
import { symbols } from '../src/symbols.js';

test('every advertised clip exists and matches its downloaded source checksum', async () => {
  const provenance = JSON.parse(await readFile(new URL('../src/assets/audio/provenance.json', import.meta.url)));
  const files = new Map(provenance.files.map(file => [file.relative, file]));
  const inventory = new Set(symbols.map(item => item.symbol));
  let count = 0;
  for (const [symbol, voices] of Object.entries(recordings)) {
    assert.ok(inventory.has(symbol));
    for (const [voice, paths] of Object.entries(voices)) {
      assert.ok(['JE', 'JH'].includes(voice));
      for (const path of paths) {
        const file = files.get(path);
        assert.ok(file);
        const bytes = await readFile(new URL('../src/' + path, import.meta.url));
        assert.equal(bytes.length, file.bytes);
        assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256);
        count++;
      }
    }
  }
  assert.equal(count, provenance.files.length);
  assert.ok(recordings['ə'].JE.length && recordings['ə'].JH.length);
  assert.equal(recordings['['], undefined);
});
test('Shift-click never inserts, including symbols without audio; normal click inserts', () => {
  const calls = [];
  const insert = item => calls.push('insert:' + item.symbol);
  const preview = item => calls.push('preview:' + item.symbol);
  activateSymbol({ shiftKey: true }, { symbol: 'ə' }, insert, preview);
  activateSymbol({ shiftKey: true }, { symbol: '[' }, insert, preview);
  activateSymbol({ shiftKey: false }, { symbol: 'ə' }, insert, preview);
  assert.deepEqual(calls, ['preview:ə', 'preview:[', 'insert:ə']);
});
function harness(play = async () => {}) {
  const clips = [], states = [];
  const player = createAudioPlayer(() => {
    const audio = { play, pause() { this.paused = true; }, removeAttribute() {}, load() {} };
    clips.push(audio); return audio;
  }, (state, label) => states.push([state, label]));
  return { player, clips, states };
}
test('examples play sequentially and stop clears pending handlers', async () => {
  const { player, clips, states } = harness();
  await player.play(['one.mp3', 'two.mp3'], 'sample');
  assert.equal(clips[0].src, 'one.mp3');
  clips[0].onended();
  assert.equal(clips[1].src, 'two.mp3');
  clips[1].onended();
  assert.equal(states.at(-1)[0], 'ended');
  await player.play(['three.mp3'], 'new sample');
  player.stop();
  assert.equal(clips[2].paused, true);
  assert.equal(clips[2].onended, null);
});
test('missing audio and playback failure are reported', async () => {
  const { player, clips, states } = harness(async () => { throw new Error('decode failed'); });
  await player.play([], 'missing');
  assert.equal(clips.length, 0);
  assert.equal(states.at(-1)[0], 'missing');
  await player.play(['bad.mp3'], 'bad');
  assert.equal(states.at(-1)[0], 'error');
});
test('a superseded play rejection cannot stop the new sound', async () => {
  let rejectFirst;
  let attempts = 0;
  const { player, clips, states } = harness(() => ++attempts === 1 ? new Promise((_, reject) => { rejectFirst = reject; }) : Promise.resolve());
  const old = player.play(['old.mp3'], 'old');
  await player.play(['new.mp3'], 'new');
  rejectFirst(new Error('aborted'));
  await old;
  assert.equal(clips[0].paused, true);
  assert.notEqual(clips[1].paused, true);
  assert.equal(states.at(-1)[1], 'new');
});
