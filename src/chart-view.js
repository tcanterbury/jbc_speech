// Draws the Chart view from chart-layout.js. Symbol buttons come from the caller so both
// views share insertion, audio, tooltips and keyboard handling.
import {
  places, placeGroups, manners, placedCells, vowels, vowelHeights, frontX, centralX,
  nonPulmonic, otherSymbols, diacritics, suprasegmentals, tones, extras
} from './chart-layout.js';

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/**
 * @param {HTMLElement} container
 * @param {{ button: (symbol: string) => HTMLButtonElement,
 *           sectionId: (category: string) => string,
 *           matches: Set<string> | null }} options
 *   button: makes an insert/listen button for a library symbol.
 *   sectionId: maps a list category name to its section id, so "Jump to" works in both views.
 *   matches: symbols matching the current search (others are dimmed), or null when not searching.
 */
export function renderChart(container, { button, sectionId, matches }) {
  const make = symbol => {
    const node = button(symbol);
    node.classList.add('chart-symbol');
    if (matches && !matches.has(symbol)) node.classList.add('dim');
    return node;
  };
  const section = (category, title) => {
    const node = el('section', 'symbol-section chart-section');
    node.id = sectionId(category);
    node.append(el('h2', '', title));
    container.append(node);
    return node;
  };

  // Pulmonic consonants: the full table for wide panes, four slices for narrow ones (CSS picks).
  const pulmonic = section('Pulmonic consonants', 'Consonants (pulmonic)');
  const full = el('div', 'pulmonic-full');
  full.append(pulmonicTable(0, places.length - 1, make));
  const split = el('div', 'pulmonic-split');
  for (const group of placeGroups) {
    split.append(el('h3', '', group.name), pulmonicTable(group.from, group.to, make));
  }
  pulmonic.append(full, split, el('p', 'chart-note',
    'Symbols to the right in a cell are voiced, to the left are voiceless. Shaded areas denote articulations judged impossible.'));

  section('Vowels', 'Vowels').append(vowelChart(make), el('p', 'chart-note',
    'Where symbols appear in pairs, the one to the right represents a rounded vowel.'));

  const np = el('div', 'np-grid');
  for (const group of nonPulmonic) {
    const column = el('div', 'np-column');
    column.append(el('h3', '', group.name));
    for (const [symbol, label] of group.rows) column.append(labelledRow(make(symbol), label));
    np.append(column);
  }
  section('Non-pulmonic consonants', 'Consonants (non-pulmonic)').append(np);

  section('Other symbols & affricates', 'Other symbols').append(labelledList(otherSymbols, make));
  section('Diacritics', 'Diacritics').append(
    el('p', 'chart-note', 'Examples show the mark on a letter; a click inserts the mark only.'),
    labelledList(diacritics, make));
  section('Suprasegmentals', 'Suprasegmentals').append(labelledList(suprasegmentals, make));

  const toneGrid = el('div', 'tone-grid');
  for (const group of tones) {
    const column = el('div', 'tone-column');
    column.append(el('h3', '', group.name));
    for (const [mark, letters, label, example] of group.rows) {
      const row = el('div', 'tone-row');
      row.append(make(mark), letters ? make(letters) : el('span'), el('span', 'chart-label', label), el('span', 'chart-example', example ?? ''));
      column.append(row);
    }
    toneGrid.append(column);
  }
  section('Tones & word accents', 'Tones & word accents').append(toneGrid);

  section('Transcription brackets', 'Extras (not on the chart)').append(labelledList(extras, make));
}

function pulmonicTable(from, to, make) {
  const table = el('table', 'pulmonic');
  const head = el('tr');
  head.append(el('th', 'corner'));
  for (let place = from; place <= to; place++) {
    const th = el('th', '', places[place].short);
    th.scope = 'col';
    th.title = places[place].name;
    head.append(th);
  }
  table.append(el('thead'));
  table.tHead.append(head);
  const body = el('tbody');
  for (const manner of manners) {
    const row = el('tr');
    const th = el('th', '', manner.name);
    th.scope = 'row';
    row.append(th);
    for (const cell of placedCells(manner)) {
      if (cell.place < from || cell.place > to) continue;
      const td = el('td');
      if (cell.span > 1) td.colSpan = cell.span;
      if (cell.impossible) {
        td.className = 'shade';
        td.title = 'Judged impossible';
      } else {
        const pair = el('div', 'pair');
        for (const half of [cell.voiceless, cell.voiced]) {
          if (half === '#') { const shaded = el('span', 'half shade'); shaded.title = 'Judged impossible'; pair.append(shaded); }
          else if (half) { const slot = el('span', 'half'); slot.append(make(half)); pair.append(slot); }
          else pair.append(el('span', 'half'));
        }
        td.append(pair);
      }
      row.append(td);
    }
    body.append(row);
  }
  table.append(body);
  return table;
}

const pct = n => `${(n * 100).toFixed(2)}%`;

function vowelChart(make) {
  const chart = el('div', 'vowel-chart');
  const plot = el('div', 'vowel-plot');
  plot.setAttribute('role', 'group');
  plot.setAttribute('aria-label', 'Vowel chart: front to back, close to open');
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('aria-hidden', 'true');
  const lines = [
    [0, 0, 1, 0], [frontX(0), 0, frontX(1), 1], [1, 0, 1, 1], [frontX(1), 1, 1, 1],
    [frontX(1 / 3), 1 / 3, 1, 1 / 3], [frontX(2 / 3), 2 / 3, 1, 2 / 3], [centralX(0), 0, centralX(1), 1]
  ];
  for (const [x1, y1, x2, y2] of lines) {
    const line = document.createElementNS(svgNS, 'line');
    Object.entries({ x1: x1 * 100, y1: y1 * 100, x2: x2 * 100, y2: y2 * 100 }).forEach(([k, v]) => line.setAttribute(k, v));
    line.setAttribute('vector-effect', 'non-scaling-stroke');
    svg.append(line);
  }
  plot.append(svg);
  for (const [label, x] of [['Front', frontX(0)], ['Central', centralX(0)], ['Back', 1]]) {
    const node = el('span', 'vowel-axis vowel-axis-x', label);
    node.style.left = pct(x);
    plot.append(node);
  }
  for (const height of vowelHeights) {
    const node = el('span', 'vowel-axis vowel-axis-y', height.name);
    node.style.top = pct(height.y);
    plot.append(node);
  }
  for (const vowel of vowels) {
    const spot = el('div', 'vowel');
    spot.style.left = pct(vowel.x);
    spot.style.top = pct(vowel.y);
    if (!vowel.left) spot.append(make(vowel.center ?? vowel.right));
    else spot.append(make(vowel.left), el('span', vowel.dot ? 'vowel-dot' : 'vowel-space'), make(vowel.right));
    plot.append(spot);
  }
  chart.append(plot);
  return chart;
}

function labelledRow(button, label, example) {
  const row = el('div', 'chart-row');
  row.append(button, el('span', 'chart-label', label));
  if (example) row.append(el('span', 'chart-example', example));
  return row;
}

function labelledList(rows, make) {
  const list = el('div', 'chart-list');
  for (const [symbol, label, example] of rows) list.append(labelledRow(make(symbol), label, example));
  return list;
}
