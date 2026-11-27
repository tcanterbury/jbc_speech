// Layout of the IPA chart (revised to 2020), used by the Chart view.
// Every symbol here must also exist in symbols.js; tests/chart.test.mjs checks both directions.
// The chart's arrangement follows the IPA chart, available under CC BY-SA 3.0 from the
// International Phonetic Association. This file stores positions only, not chart artwork.

// ---- Pulmonic consonants -------------------------------------------------
export const places = [
  { name: 'Bilabial', short: 'Bilabial' },
  { name: 'Labiodental', short: 'Labiodent.' },
  { name: 'Dental', short: 'Dental' },
  { name: 'Alveolar', short: 'Alveolar' },
  { name: 'Postalveolar', short: 'Postalv.' },
  { name: 'Retroflex', short: 'Retroflex' },
  { name: 'Palatal', short: 'Palatal' },
  { name: 'Velar', short: 'Velar' },
  { name: 'Uvular', short: 'Uvular' },
  { name: 'Pharyngeal', short: 'Pharyng.' },
  { name: 'Glottal', short: 'Glottal' }
];

// Narrow panes show the pulmonic table in these four slices (place indexes, inclusive).
export const placeGroups = [
  { name: 'Lips', from: 0, to: 1 },
  { name: 'Tongue tip & blade', from: 2, to: 5 },
  { name: 'Tongue body', from: 6, to: 8 },
  { name: 'Throat', from: 9, to: 10 }
];

// A cell holds [voiceless, voiced]. '' = empty, '#' = that half judged impossible (shaded).
// X marks a fully shaded cell. span merges places, like Dental–Postalveolar on the chart.
const c = (voiceless = '', voiced = '', span = 1) => ({ voiceless, voiced, span });
const X = { impossible: true, span: 1 };

export const manners = [
  { name: 'Plosive', cells: [c('p', 'b'), c(), c('t', 'd', 3), c('ʈ', 'ɖ'), c('c', 'ɟ'), c('k', 'ɡ'), c('q', 'ɢ'), c('', '#'), c('ʔ', '#')] },
  { name: 'Nasal', cells: [c('', 'm'), c('', 'ɱ'), c('', 'n', 3), c('', 'ɳ'), c('', 'ɲ'), c('', 'ŋ'), c('', 'ɴ'), X, X] },
  { name: 'Trill', cells: [c('', 'ʙ'), c(), c('', 'r', 3), c(), c(), X, c('', 'ʀ'), c(), X] },
  { name: 'Tap or Flap', cells: [c(), c('', 'ⱱ'), c('', 'ɾ', 3), c('', 'ɽ'), c(), X, c(), c(), X] },
  { name: 'Fricative', cells: [c('ɸ', 'β'), c('f', 'v'), c('θ', 'ð'), c('s', 'z'), c('ʃ', 'ʒ'), c('ʂ', 'ʐ'), c('ç', 'ʝ'), c('x', 'ɣ'), c('χ', 'ʁ'), c('ħ', 'ʕ'), c('h', 'ɦ')] },
  { name: 'Lateral fricative', cells: [X, X, c('ɬ', 'ɮ', 3), c(), c(), c(), c(), X, X] },
  { name: 'Approximant', cells: [c(), c('', 'ʋ'), c('', 'ɹ', 3), c('', 'ɻ'), c('', 'j'), c('', 'ɰ'), c(), c(), c()] },
  { name: 'Lateral approximant', cells: [X, X, c('', 'l', 3), c('', 'ɭ'), c('', 'ʎ'), c('', 'ʟ'), c(), X, X] }
];

// Adds the starting place index to every cell so slices can be cut by place.
export function placedCells(manner) {
  let place = 0;
  return manner.cells.map(cell => { const placed = { ...cell, place }; place += cell.span; return placed; });
}

// ---- Vowels ----------------------------------------------------------------
// Positions are fractions of the trapezoid: y 0 = close … 1 = open; x 0 = front edge at the
// close row … 1 = back. The front edge slants right as the vowels open, as on the chart.
export const FRONT_SLANT = 0.43;
export const frontX = y => FRONT_SLANT * y;
export const centralX = y => (frontX(y) + 1) / 2;
export const vowelHeights = [
  { name: 'Close', y: 0 }, { name: 'Close-mid', y: 1 / 3 }, { name: 'Open-mid', y: 2 / 3 }, { name: 'Open', y: 1 }
];
// dot: true draws the chart's dot between an unrounded (left) and rounded (right) pair.
export const vowels = [
  { y: 0, x: frontX(0), left: 'i', right: 'y', dot: true },
  { y: 0, x: centralX(0), left: 'ɨ', right: 'ʉ', dot: true },
  { y: 0, x: 1, left: 'ɯ', right: 'u', dot: true },
  { y: 1 / 6, x: 0.21, left: 'ɪ', right: 'ʏ' },
  { y: 1 / 6, x: 0.8, right: 'ʊ' },
  { y: 1 / 3, x: frontX(1 / 3), left: 'e', right: 'ø', dot: true },
  { y: 1 / 3, x: centralX(1 / 3), left: 'ɘ', right: 'ɵ', dot: true },
  { y: 1 / 3, x: 1, left: 'ɤ', right: 'o', dot: true },
  { y: 1 / 2, x: centralX(1 / 2), center: 'ə' },
  { y: 2 / 3, x: frontX(2 / 3), left: 'ɛ', right: 'œ', dot: true },
  { y: 2 / 3, x: centralX(2 / 3), left: 'ɜ', right: 'ɞ', dot: true },
  { y: 2 / 3, x: 1, left: 'ʌ', right: 'ɔ', dot: true },
  { y: 5 / 6, x: frontX(5 / 6) + 0.05, center: 'æ' },
  { y: 5 / 6, x: centralX(5 / 6), center: 'ɐ' },
  { y: 1, x: frontX(1), left: 'a', right: 'ɶ', dot: true },
  { y: 1, x: 1, left: 'ɑ', right: 'ɒ', dot: true }
];

// ---- Labelled lists: [symbol, chart label, example] -----------------------
export const nonPulmonic = [
  { name: 'Clicks', rows: [['ʘ', 'Bilabial'], ['ǀ', 'Dental'], ['ǃ', '(Post)alveolar'], ['ǂ', 'Palatoalveolar'], ['ǁ', 'Alveolar lateral']] },
  { name: 'Voiced implosives', rows: [['ɓ', 'Bilabial'], ['ɗ', 'Dental/alveolar'], ['ʄ', 'Palatal'], ['ɠ', 'Velar'], ['ʛ', 'Uvular']] },
  { name: 'Ejectives', rows: [['ʼ', 'Ejective mark'], ['pʼ', 'Bilabial'], ['tʼ', 'Dental/alveolar'], ['kʼ', 'Velar'], ['sʼ', 'Alveolar fricative']] }
];

export const otherSymbols = [
  ['ʍ', 'Voiceless labial-velar fricative'], ['w', 'Voiced labial-velar approximant'],
  ['ɥ', 'Voiced labial-palatal approximant'], ['ʜ', 'Voiceless epiglottal fricative'],
  ['ʢ', 'Voiced epiglottal fricative'], ['ʡ', 'Epiglottal plosive'],
  ['ɕ', 'Alveolo-palatal fricative (voiceless)'], ['ʑ', 'Alveolo-palatal fricative (voiced)'],
  ['ɺ', 'Voiced alveolar lateral flap'], ['ɧ', 'Simultaneous ʃ and x'],
  ['͡', 'Tie bar above — affricates and double articulations', 't͡s k͡p'],
  ['͜', 'Tie bar below', 't͜s']
];

// Diacritics in the chart's three-column order. The example is shown, only the mark is inserted.
export const diacritics = [
  ['̥', 'Voiceless', 'n̥ d̥'], ['̊', 'Voiceless (above, for descenders)', 'ŋ̊'],
  ['̬', 'Voiced', 's̬ t̬'], ['ʰ', 'Aspirated', 'tʰ dʰ'],
  ['̹', 'More rounded', 'ɔ̹'], ['̜', 'Less rounded', 'ɔ̜'],
  ['̟', 'Advanced', 'u̟'], ['̠', 'Retracted', 'e̠'],
  ['̈', 'Centralized', 'ë'], ['̽', 'Mid-centralized', 'e̽'],
  ['̩', 'Syllabic', 'n̩'], ['̍', 'Syllabic (above, for descenders)', 'ŋ̍'],
  ['̯', 'Non-syllabic', 'e̯'], ['̑', 'Non-syllabic (above)', 'ŋ̑'],
  ['˞', 'Rhoticity', 'ə˞ a˞'],
  ['̤', 'Breathy voiced', 'b̤ a̤'], ['̰', 'Creaky voiced', 'b̰ a̰'],
  ['̼', 'Linguolabial', 't̼ d̼'], ['ʷ', 'Labialized', 'tʷ dʷ'],
  ['ʲ', 'Palatalized', 'tʲ dʲ'], ['ˠ', 'Velarized', 'tˠ dˠ'],
  ['ˤ', 'Pharyngealized', 'tˤ dˤ'], ['̴', 'Velarized or pharyngealized', 'ɫ'],
  ['̝', 'Raised (ɹ̝ = voiced alveolar fricative)', 'e̝'],
  ['̞', 'Lowered (β̞ = voiced bilabial approximant)', 'e̞'],
  ['̘', 'Advanced tongue root', 'e̘'], ['̙', 'Retracted tongue root', 'e̙'],
  ['̪', 'Dental', 't̪ d̪'], ['̺', 'Apical', 't̺ d̺'], ['̻', 'Laminal', 't̻ d̻'],
  ['̃', 'Nasalized', 'ẽ'], ['ⁿ', 'Nasal release', 'dⁿ'], ['ˡ', 'Lateral release', 'dˡ'],
  ['̚', 'No audible release', 'd̚']
];

export const suprasegmentals = [
  ['ˈ', 'Primary stress', 'ˌfoʊnəˈtɪʃən'], ['ˌ', 'Secondary stress'],
  ['ː', 'Long', 'eː'], ['ˑ', 'Half-long', 'eˑ'], ['̆', 'Extra-short', 'ĕ'],
  ['|', 'Minor (foot) group'], ['‖', 'Major (intonation) group'],
  ['.', 'Syllable break', 'ɹi.ækt'], ['‿', 'Linking (absence of a break)']
];

// Tones: each row offers the diacritic and the tone letter(s) the chart pairs with it.
export const tones = [
  { name: 'Level', rows: [
    ['̋', '˥', 'Extra high', 'e̋'], ['́', '˦', 'High', 'é'], ['̄', '˧', 'Mid', 'ē'],
    ['̀', '˨', 'Low', 'è'], ['̏', '˩', 'Extra low', 'ȅ'],
    ['ꜜ', '', 'Downstep'], ['ꜛ', '', 'Upstep']
  ] },
  { name: 'Contour', rows: [
    ['̌', '˩˥', 'Rising', 'ě'], ['̂', '˥˩', 'Falling', 'ê'],
    ['᷄', '˦˥', 'High rising', 'e᷄'], ['᷅', '˩˨', 'Low rising', 'e᷅'],
    ['᷈', '˧˦˧', 'Rising-falling', 'e᷈'], ['↗', '', 'Global rise'], ['↘', '', 'Global fall']
  ] }
];

// Library symbols that are not on the chart itself.
export const extras = [
  ['t͡ʃ', 'Voiceless postalveolar affricate'], ['d͡ʒ', 'Voiced postalveolar affricate'],
  ['t͡s', 'Voiceless alveolar affricate'], ['d͡z', 'Voiced alveolar affricate'],
  ['ɚ', 'Rhotic schwa'], ['ɝ', 'Rhotic open-mid central vowel'], ['ɫ', 'Velarized alveolar lateral'],
  ['[', 'Phonetic bracket (open)'], [']', 'Phonetic bracket (close)'], ['/', 'Phonemic slash']
];

// Every insertable symbol in the chart layout, in chart order.
export function chartSymbols() {
  const out = [];
  for (const manner of manners) for (const cell of manner.cells) {
    for (const half of [cell.voiceless, cell.voiced]) if (half && half !== '#') out.push(half);
  }
  for (const v of vowels) for (const s of [v.left, v.right, v.center]) if (s) out.push(s);
  for (const group of nonPulmonic) for (const [s] of group.rows) out.push(s);
  for (const [s] of otherSymbols) out.push(s);
  for (const [s] of diacritics) out.push(s);
  for (const [s] of suprasegmentals) out.push(s);
  for (const group of tones) for (const [mark, letters] of group.rows) { out.push(mark); if (letters) out.push(letters); }
  for (const [s] of extras) out.push(s);
  return out;
}
