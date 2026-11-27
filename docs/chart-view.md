# Chart view

Visual companion: [chart-view.html](chart-view.html) (open it in a browser).

## Why

The List view groups symbols by category, but a phonetics student reads the IPA chart by position: place of articulation across, manner down, voiceless left and voiced right, and vowels by tongue height and backness. Chart view lays the same symbols out the way the IPA chart (revised to 2020) does, so a sound can be found by where it is made.

## Decisions

| Question | Decision | Reason |
|---|---|---|
| Where is the switch? | A **List / Chart** switch in the pane header | Word add-in ribbons have no checkbox or toggle-button control, and the add-in has a single pane anyway. The switch shows which view is on and is one click away. |
| Default | List view on first open, then the last choice is remembered (`localStorage` key `jbc-speech-view`) | Requested. The List view is unchanged. |
| Reference layout | The 2020 IPA chart (same content as the IPA's interactive chart) | It's the standard layout, and the arrangement is available under CC BY-SA 3.0. We store positions only, not the artwork. |
| Narrow pane | The pulmonic table is split into four slices: **Lips** (bilabial, labiodental), **Tongue tip & blade** (dental to retroflex), **Tongue body** (palatal, velar, uvular), **Throat** (pharyngeal, glottal) | 11 places × 2 voicing doesn't fit in ~300 px. Slicing by place keeps the chart's rows, pairs and shading. |
| Wide pane | At a viewport width of 680 px or more, one full table replaces the slices (CSS media query) | She can widen the pane when she wants the whole table. |
| Search in Chart view | Non-matching symbols are dimmed, not removed | Removing symbols would break the chart's shape. |
| Jump to | Chart sections use the same `category-N` ids as List sections | One menu works in both views. |
| Diacritics | Shown with the chart's example (for example n̥); a click inserts only the mark | Same rule as List view: the dotted circle and the base letter are never inserted. |
| Symbols not on the chart | **Extras** section: t͡ʃ d͡ʒ t͡s d͡z ɚ ɝ ɫ [ ] / | Every library symbol is reachable from both views. |

ɫ (velarized alveolar lateral) was added to the inventory, because the chart shows it as the example for the velarized or pharyngealized diacritic.

## Structure

- `src/chart-layout.js` is data only: places, place groups, manners with cells (`[voiceless, voiced]`, `''` empty, `'#'` impossible half, `X` fully impossible, `span` for merged dental–postalveolar cells), vowel positions, and labelled rows for the other sections. `chartSymbols()` lists every insertable symbol.
- `src/chart-view.js` builds the DOM. It receives `button(symbol)` from `taskpane.js`, so insertion, Shift-click audio, tooltips and keyboard handling are shared with List view.
- `src/taskpane.js` has `symbolButton(item)` (taken out of the old `render()`), the `view` state, and the switch handlers. `?view=chart` in the URL overrides the saved view, which is handy for previews and screenshots.

### Vowel geometry

Positions are fractions of the trapezoid: `y` 0 = close … 1 = open; `x` 0 = front edge at the close row … 1 = back. The front edge is `x = 0.43·y`, measured from the 2020 chart. The central line is midway between the front and back edges. A pair is centred on its point, with the dot between the unrounded (left) and rounded (right) vowels. The plot height is `clamp(210px, 48vw, 330px)`; `aspect-ratio` is avoided because its min-height widened the plot past a narrow pane.

## Pulmonic shading (from the 2020 chart)

- Fully shaded: nasal, pharyngeal and glottal; trill and tap, velar and glottal; lateral fricative and lateral approximant, bilabial, labiodental, pharyngeal and glottal.
- Voiced half shaded: pharyngeal plosive and glottal plosive.

## Tests

`tests/chart.test.mjs`:
- The chart and the inventory contain exactly the same symbols, each once on the chart.
- Every manner row covers all 11 places, and no merged cell crosses a narrow-pane slice.
- Landmarks match the 2020 chart: t d merged across dental to postalveolar, θ and ʒ positions, and the shaded cells.
- Vowels stay inside the trapezoid.

## Still to check in Word

Insert a consonant, a vowel and a diacritic from Chart view. Shift-click a vowel. Widen the pane past ~680 px. Hide and reopen the pane, and confirm Chart view is remembered.
