// Homepage interactions: live stats, the typing demo, playable symbol chips, and the voice waveform.
// Reuses the add-in's own inventory and recordings, which the site serves alongside this page.
import { symbols } from './symbols.js';
import { recordings } from './audio-map.js';

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const byChar = new Map(symbols.map(item => [item.symbol, item]));

// ---- Stats from the real data ----
document.getElementById('stat-symbols').textContent = symbols.length;
document.getElementById('stat-clips').textContent =
  Object.values(recordings).reduce((sum, voices) => sum + Object.values(voices).reduce((n, paths) => n + paths.length, 0), 0);

// ---- Waveform: bars shaped like a spoken phrase ----
const wave = document.getElementById('wave');
const bars = 84;
for (let i = 0; i < bars; i++) {
  const phrase = Math.abs(Math.sin(i / 7)) * 0.7 + Math.abs(Math.sin(i / 2.3)) * 0.3;   // syllable-like envelope
  const bar = document.createElement('i');
  bar.style.setProperty('--h', (0.12 + phrase * 0.88).toFixed(2));
  bar.style.setProperty('--t', `${(0.45 + Math.random() * 0.9).toFixed(2)}s`);
  bar.style.setProperty('--d', `${(-Math.random() * 2).toFixed(2)}s`);
  wave.append(bar);
}

// ---- Typing demo ----
const words = [
  ['speech', 'spiːtʃ'], ['teacher', 'ˈtiːtʃɚ'], ['phonetics', 'fəˈnɛtɪks'],
  ['language', 'ˈlæŋɡwɪdʒ'], ['thank you', 'ˈθæŋk juː'], ['measure', 'ˈmɛʒɚ']
];
const wordEl = document.getElementById('demo-word');
const ipaEl = document.getElementById('demo-ipa');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function typeLoop() {
  if (reducedMotion) { ipaEl.textContent = words[0][1]; return; }
  for (let w = 0; ; w = (w + 1) % words.length) {
    const [word, ipa] = words[w];
    wordEl.textContent = word;
    const chars = [...ipa];
    for (let i = 1; i <= chars.length; i++) { ipaEl.textContent = chars.slice(0, i).join(''); await sleep(150 + Math.random() * 90); }
    await sleep(1900);
    for (let i = chars.length - 1; i >= 0; i--) { ipaEl.textContent = chars.slice(0, i).join(''); await sleep(40); }
    await sleep(350);
  }
}
typeLoop();

// ---- Symbol chips: click to type, optionally hear the real recording ----
const chips = ['ə', 'ʃ', 'θ', 'ð', 'ŋ', 'ʒ', 'ɹ', 'æ', 'ʊ', 'ɪ', 'ɑ', 't͡ʃ', 'ː', 'ˈ'];
const chipBox = document.getElementById('demo-chips');
const mine = document.getElementById('demo-mine');
const soundButton = document.getElementById('demo-sound');
let soundOn = false;
let audio;
for (const symbol of chips) {
  const item = byChar.get(symbol);
  const clip = recordings[symbol]?.JE?.[0] ?? recordings[symbol]?.JH?.[0];
  const chip = document.createElement('button');
  chip.type = 'button';
  chip.className = 'chip';
  chip.textContent = symbol;
  chip.dataset.audio = Boolean(clip);
  chip.title = item ? `${item.name}${clip ? ' · has a recording' : ''}` : symbol;
  chip.setAttribute('aria-label', `Type ${item?.name ?? symbol}`);
  chip.addEventListener('click', () => {
    mine.querySelector('.placeholder')?.remove();
    mine.append(symbol);
    chip.classList.remove('pop'); void chip.offsetWidth; chip.classList.add('pop');
    if (soundOn && clip) { audio?.pause(); audio = new Audio(clip); audio.play().catch(() => {}); }
  });
  chipBox.append(chip);
}
soundButton.addEventListener('click', () => {
  soundOn = !soundOn;
  soundButton.setAttribute('aria-pressed', soundOn);
  soundButton.textContent = soundOn ? '🔊 Sound on' : '🔈 Sound off';
  if (!soundOn) audio?.pause();
});
document.getElementById('demo-clear').addEventListener('click', () => {
  mine.innerHTML = '<span class="placeholder">click symbols below…</span>';
});
