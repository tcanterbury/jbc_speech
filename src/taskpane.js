import { categories, codepoints, displaySymbol, searchSymbols, symbols } from './symbols.js';
import { createPaneToggle, insertIntoWord } from './word-actions.js';
import { recordings } from './audio-map.js';
import { activateSymbol, createAudioPlayer } from './audio-player.js';
import { renderChart } from './chart-view.js';

const preview = new URLSearchParams(location.search).get('preview') === '1';
const library = document.getElementById('library');
const status = document.getElementById('status');
const search = document.getElementById('search');
const category = document.getElementById('category');
const previewText = document.getElementById('preview-text');
const voice = document.getElementById('voice');
const stopAudio = document.getElementById('stop-audio');
const controlsState = document.getElementById('controls-state');
const header = document.querySelector('header');
// Keep category headings below the sticky header in either accordion state.
function updateHeaderHeight() {
  document.documentElement.style.setProperty('--header-offset', `${header.getBoundingClientRect().height + 12}px`);
}
new ResizeObserver(updateHeaderHeight).observe(header);
const speakers = { JE: 'John Esling', JH: 'Jill House' };
try { const saved = localStorage.getItem('jbc-speech-voice'); if (speakers[saved]) voice.value = saved; } catch {}
// List (default) or Chart layout; both share the same symbol buttons.
const views = { list: 'List', chart: 'Chart' };
const viewInputs = [...document.querySelectorAll('input[name="view"]')];
let view = 'list';
try { const saved = localStorage.getItem('jbc-speech-view'); if (views[saved]) view = saved; } catch {}
const urlView = new URLSearchParams(location.search).get('view'); // e.g. ?preview=1&view=chart
if (views[urlView]) view = urlView;
for (const input of viewInputs) input.checked = input.value === view;
const bySymbol = new Map(symbols.map(item => [item.symbol, item]));
const player = createAudioPlayer(() => new Audio(), (state, label) => {
  stopAudio.disabled = state !== 'playing';
  if (state === 'playing') message(`Playing: ${label}`);
  if (state === 'ended') message(`Finished: ${label}`);
  if (state === 'missing') message(`No recording from ${speakers[voice.value]} for ${label}.`);
  if (state === 'error') message(`Could not play ${label}. Try again or choose the other voice.`, true);
});
let ready = false;
let inserting = false;
let pane;
let runtimeReady;
function message(text, error = false) { status.textContent = text; status.classList.toggle('error', error); }

for (const [index, name] of categories.entries()) {
  const option = document.createElement('option');
  option.value = `category-${index}`;
  option.textContent = name;
  category.append(option);
}
function symbolButton(item) {
  const button = document.createElement('button');
  button.className = 'symbol';
  button.type = 'button';
  button.textContent = displaySymbol(item);
  button.dataset.long = [...item.symbol].length > 1;
  const hasAudio = Boolean(recordings[item.symbol]?.[voice.value]?.length);
  button.dataset.audio = hasAudio;
  const audioHint = hasAudio ? `Shift-click to hear ${speakers[voice.value]}` : `No ${speakers[voice.value]} recording`;
  button.title = `${item.name} · ${codepoints(item.symbol)} · ${audioHint}`;
  button.setAttribute('aria-label', `Insert ${item.name}: ${displaySymbol(item)}. ${audioHint}.`);
  button.addEventListener('click', event => activateSymbol(event, item, insert, playSymbol));
  button.addEventListener('keydown', event => {
    if (event.shiftKey && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      if (!event.repeat) void playSymbol(item);
    }
  });
  button.addEventListener('keyup', event => {
    if (event.shiftKey && event.key === ' ') event.preventDefault();
  });
  return button;
}
function render() {
  const query = search.value.trim();
  controlsState.textContent = query ? 'Filter active' : '';
  const matches = searchSymbols(search.value);
  library.replaceChildren();
  library.dataset.view = view;
  document.getElementById('empty').hidden = matches.length !== 0;
  if (view === 'chart') {
    renderChart(library, {
      button: symbol => symbolButton(bySymbol.get(symbol)),
      sectionId: name => `category-${categories.indexOf(name)}`,
      matches: query ? new Set(matches.map(item => item.symbol)) : null
    });
    return;
  }
  for (const [index, name] of categories.entries()) {
    const entries = matches.filter(item => item.category === name);
    if (!entries.length) continue;
    const section = document.createElement('section');
    section.className = 'symbol-section';
    section.id = `category-${index}`;
    const heading = document.createElement('h2');
    heading.textContent = name;
    const count = document.createElement('span');
    count.textContent = entries.length;
    heading.append(count);
    const grid = document.createElement('div');
    grid.className = 'grid';
    for (const item of entries) grid.append(symbolButton(item));
    section.append(heading, grid);
    library.append(section);
  }
}
function playSymbol(item) {
  return player.play(recordings[item.symbol]?.[voice.value] ?? [], `${displaySymbol(item)} — ${item.name} (${speakers[voice.value]})`);
}
function stopPlayback() { player.stop(); stopAudio.disabled = true; }
stopAudio.addEventListener('click', () => { stopPlayback(); message('Audio stopped.'); });
voice.addEventListener('change', () => {
  stopPlayback();
  try { localStorage.setItem('jbc-speech-voice', voice.value); } catch {}
  render();
  message(`Voice: ${speakers[voice.value]}. Shift-click a marked symbol to listen.`);
});
document.addEventListener('visibilitychange', () => { if (document.hidden) stopPlayback(); });
async function insert(item) {
  stopPlayback();
  if (inserting) return;
  if (!ready && !preview) { message('Open this add-in in Word to insert symbols.', true); return; }
  inserting = true;
  try {
    if (preview) {
      previewText.setRangeText(item.symbol, previewText.selectionStart, previewText.selectionEnd, 'end');
    } else {
      await insertIntoWord(window.Word, item.symbol);
    }
    message(`${preview ? 'Preview' : 'Inserted'}: ${displaySymbol(item)} — ${item.name}`);
  } catch (error) {
    console.error('Symbol insertion failed', error);
    message('Could not insert. Place the cursor in an editable document and try again.', true);
  } finally { inserting = false; }
}
for (const input of viewInputs) input.addEventListener('change', () => {
  if (!input.checked) return;
  view = input.value;
  try { localStorage.setItem('jbc-speech-view', view); } catch {}
  category.value = '';
  render();
  window.scrollTo({ top: 0 });
  message(`${views[view]} view.`);
});
search.addEventListener('input', () => { category.value = ''; render(); });
category.addEventListener('change', () => {
  const target = category.value;
  if (search.value) { search.value = ''; render(); }
  updateHeaderHeight();
  if (target) document.getElementById(target)?.scrollIntoView({ block: 'start' });
  else window.scrollTo({ top: 0 });
});
document.getElementById('hide').addEventListener('click', async () => {
  stopPlayback();
  if (!ready) return;
  try { await Office.addin.hide(); pane.visibilityChanged('Hidden'); }
  catch { message('Use the task pane close button to hide the library.', true); }
});
render();

async function toggleIpaPane(event) {
  try {
    await runtimeReady;
    if (!pane) throw new Error('Shared runtime is unavailable.');
    await pane.toggle();
  } catch (error) {
    console.error('Pane toggle failed', error);
    message('Unable to toggle the library. Reopen the add-in or update Word.', true);
  } finally { event.completed(); }
}
window.toggleIpaPane = toggleIpaPane;
if (preview) {
  document.getElementById('preview-area').hidden = false;
  document.getElementById('hide').hidden = true;
  message('Browser preview — symbols insert into the practice box.');
} else if (window.Office) {
  Office.actions.associate('toggleIpaPane', toggleIpaPane);
  runtimeReady = Office.onReady().then(async info => {
    if (info.host !== Office.HostType.Word) {
      message('Open in Word, or use npm run preview for a browser demo.'); return;
    }
    if (!Office.context.requirements.isSetSupported('SharedRuntime', '1.1')) {
      message('This add-in needs a Word version supporting SharedRuntime 1.1.', true); return;
    }
    pane = createPaneToggle(Office.addin, document.visibilityState === 'visible');
    await Office.addin.onVisibilityModeChanged(args => {
      pane.visibilityChanged(args.visibilityMode);
      if (args.visibilityMode !== 'Taskpane') stopPlayback();
    });
    ready = true;
    message('Ready · Choose a symbol to insert into Word.');
  });
  runtimeReady.catch(error => {
    console.error(error);
    message('Could not connect to Word. Close and reopen the add-in.', true);
  });
} else { message('Word connection unavailable. Check your internet connection, then reopen the add-in.', true); }
