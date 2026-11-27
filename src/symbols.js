// Unicode inventory, organized by phonetic properties (not a reproduction of the chart artwork).
const rows = (category, text) => text.trim().split('\n').map(line => {
  const [symbol, name] = line.split('|');
  return { symbol, name, category, combining: /^\p{Mark}/u.test(symbol) };
});
export const symbols = [
  ...rows('Pulmonic consonants', `
p|Voiceless bilabial plosive
b|Voiced bilabial plosive
t|Voiceless alveolar plosive
d|Voiced alveolar plosive
ʈ|Voiceless retroflex plosive
ɖ|Voiced retroflex plosive
c|Voiceless palatal plosive
ɟ|Voiced palatal plosive
k|Voiceless velar plosive
ɡ|Voiced velar plosive
q|Voiceless uvular plosive
ɢ|Voiced uvular plosive
ʔ|Glottal stop
m|Bilabial nasal
ɱ|Labiodental nasal
n|Alveolar nasal
ɳ|Retroflex nasal
ɲ|Palatal nasal
ŋ|Velar nasal
ɴ|Uvular nasal
ʙ|Bilabial trill
r|Alveolar trill
ʀ|Uvular trill
ⱱ|Labiodental flap
ɾ|Alveolar tap
ɽ|Retroflex flap
ɸ|Voiceless bilabial fricative
β|Voiced bilabial fricative
f|Voiceless labiodental fricative
v|Voiced labiodental fricative
θ|Voiceless dental fricative
ð|Voiced dental fricative
s|Voiceless alveolar fricative
z|Voiced alveolar fricative
ʃ|Voiceless postalveolar fricative
ʒ|Voiced postalveolar fricative
ʂ|Voiceless retroflex fricative
ʐ|Voiced retroflex fricative
ç|Voiceless palatal fricative
ʝ|Voiced palatal fricative
x|Voiceless velar fricative
ɣ|Voiced velar fricative
χ|Voiceless uvular fricative
ʁ|Voiced uvular fricative
ħ|Voiceless pharyngeal fricative
ʕ|Voiced pharyngeal fricative
h|Voiceless glottal fricative
ɦ|Voiced glottal fricative
ɬ|Voiceless alveolar lateral fricative
ɮ|Voiced alveolar lateral fricative
ʋ|Labiodental approximant
ɹ|Alveolar approximant
ɻ|Retroflex approximant
j|Palatal approximant
ɰ|Velar approximant
l|Alveolar lateral approximant
ɭ|Retroflex lateral approximant
ʎ|Palatal lateral approximant
ʟ|Velar lateral approximant`),
  ...rows('Vowels', `
i|Close front unrounded vowel
y|Close front rounded vowel
ɨ|Close central unrounded vowel
ʉ|Close central rounded vowel
ɯ|Close back unrounded vowel
u|Close back rounded vowel
ɪ|Near-close near-front unrounded vowel
ʏ|Near-close near-front rounded vowel
ʊ|Near-close near-back rounded vowel
e|Close-mid front unrounded vowel
ø|Close-mid front rounded vowel
ɘ|Close-mid central unrounded vowel
ɵ|Close-mid central rounded vowel
ɤ|Close-mid back unrounded vowel
o|Close-mid back rounded vowel
ə|Mid central vowel (schwa)
ɛ|Open-mid front unrounded vowel
œ|Open-mid front rounded vowel
ɜ|Open-mid central unrounded vowel
ɞ|Open-mid central rounded vowel
ʌ|Open-mid back unrounded vowel
ɔ|Open-mid back rounded vowel
æ|Near-open front unrounded vowel
ɐ|Near-open central vowel
a|Open front unrounded vowel
ɶ|Open front rounded vowel
ɑ|Open back unrounded vowel
ɒ|Open back rounded vowel`),
  ...rows('Non-pulmonic consonants', `
ʘ|Bilabial click
ǀ|Dental click
ǃ|Postalveolar click
ǂ|Palatoalveolar click
ǁ|Alveolar lateral click
ɓ|Voiced bilabial implosive
ɗ|Voiced alveolar implosive
ʄ|Voiced palatal implosive
ɠ|Voiced velar implosive
ʛ|Voiced uvular implosive
ʼ|Ejective marker
pʼ|Bilabial ejective
tʼ|Alveolar ejective
kʼ|Velar ejective
sʼ|Alveolar fricative ejective`),
  ...rows('Other symbols & affricates', `
ʍ|Voiceless labial-velar fricative
w|Voiced labial-velar approximant
ɥ|Voiced labial-palatal approximant
ʜ|Voiceless epiglottal fricative
ʢ|Voiced epiglottal fricative
ʡ|Epiglottal plosive
ɕ|Voiceless alveolo-palatal fricative
ʑ|Voiced alveolo-palatal fricative
ɺ|Voiced alveolar lateral flap
ɧ|Simultaneous postalveolar and velar fricative
͡|Tie bar above (insert between two symbols)
͜|Tie bar below (insert between two symbols)
t͡ʃ|Voiceless postalveolar affricate
d͡ʒ|Voiced postalveolar affricate
t͡s|Voiceless alveolar affricate
d͡z|Voiced alveolar affricate
ɚ|Rhotic schwa
ɝ|Rhotic open-mid central vowel
ɫ|Velarized alveolar lateral approximant (dark l)`),
  ...rows('Diacritics', `
̥|Voiceless (below)
̊|Voiceless (above)
̬|Voiced
ʰ|Aspirated
̹|More rounded
̜|Less rounded
̟|Advanced
̠|Retracted
̈|Centralized
̽|Mid-centralized
̩|Syllabic (below)
̍|Syllabic (above)
̯|Non-syllabic (below)
̑|Non-syllabic (above)
˞|Rhoticity
̤|Breathy voiced
̰|Creaky voiced
̼|Linguolabial
ʷ|Labialized
ʲ|Palatalized
ˠ|Velarized
ˤ|Pharyngealized
̴|Velarized or pharyngealized
̝|Raised
̞|Lowered
̘|Advanced tongue root
̙|Retracted tongue root
̪|Dental
̺|Apical
̻|Laminal
̃|Nasalized
ⁿ|Nasal release
ˡ|Lateral release
̚|No audible release`),
  ...rows('Suprasegmentals', `
ˈ|Primary stress
ˌ|Secondary stress
ː|Long
ˑ|Half-long
̆|Extra-short
|Minor group boundary
‖|Major intonation group boundary
.|Syllable break
‿|Linking (no break)`),
  ...rows('Tones & word accents', `
˥|Extra-high level tone
˦|High level tone
˧|Mid level tone
˨|Low level tone
˩|Extra-low level tone
̋|Extra-high tone diacritic
́|High tone diacritic
̄|Mid tone diacritic
̀|Low tone diacritic
̏|Extra-low tone diacritic
˩˥|Rising tone
˥˩|Falling tone
˦˥|High-rising tone
˩˨|Low-rising tone
˧˦˧|Rising-falling tone
̌|Rising tone diacritic
̂|Falling tone diacritic
᷄|High-rising tone diacritic
᷅|Low-rising tone diacritic
᷈|Rising-falling tone diacritic
ꜜ|Downstep
ꜛ|Upstep
↗|Global rise
↘|Global fall`),
  ...rows('Transcription brackets', `
[|Phonetic transcription opening bracket
]|Phonetic transcription closing bracket
/|Phonemic transcription slash`)
];
// A literal pipe is also the inventory's field separator.
symbols.find(item => item.symbol === '').symbol = '|';
export const categories = [...new Set(symbols.map(item => item.category))];
export function codepoints(text) {
  return [...text].map(char => 'U+' + char.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')).join(' ');
}
export function searchSymbols(query) {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return symbols.filter(item => words.every(word => `${item.symbol} ${item.name} ${item.category} ${codepoints(item.symbol)}`.toLowerCase().includes(word)));
}
export function displaySymbol(item) { return item.combining ? '◌' + item.symbol : item.symbol; }
