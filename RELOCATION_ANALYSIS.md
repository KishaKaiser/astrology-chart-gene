# Relocation comparison

Open a chart's **Relocation** tab, select or enter up to ten cities/coordinates,
then choose **Calculate selected places**. Calculations run locally; manual
coordinate entry works without a geocoding connection. City search reuses the
existing OpenStreetMap search. The optional **Generate plain-language comparison**
uses the selected Ollama model. Results save with the chart in the shared library.
Changing the candidate list does not replace the saved report until recalculated.

Regenerate interpretation section 1 to incorporate the calculated destinations.
The prompt compares only those places, with reasons and tradeoffs, instead of
claiming to find the best place worldwide. Export Options includes **Relocation
analysis** for the ranked suggestions and saved narrative. Individual birthplace
and destination chart-data pages are omitted from PDF exports; the detailed
calculations remain available in the Relocation tab. Reports whose birth data
no longer matches are excluded from section 1 and export until recalculated.

## Calculation method

- Convert the natal civil date/time and natal timezone to one UTC instant using
  the existing birth-time converter. DST gaps and repeated times require a valid
  time/explicit offset. Never reinterpret the birth clock in a destination zone.
- Recalculate geocentric Sun–Pluto longitudes once with Astronomy Engine, using
  the tropical ecliptic of date. These positions remain identical across cities.
  The original natal chart is not modified.
- Calculate local apparent sidereal time from GAST plus east-positive longitude.
  Use true obliquity of date to find the eastern horizon/ecliptic intersection
  (Ascendant) and the upper meridian/ecliptic intersection (Midheaven). Descendant
  and IC are opposite those angles.
- Use **whole-sign houses** consistently for both birthplace and destination
  comparisons. The MC need not coincide with the 10th-house cusp. This independent
  calculation may differ from the original chart engine and its house system.
- List planetary conjunctions within 5 degrees of the four angles, measured in
  ecliptic longitude. These are not distances to astrocartography lines.
- This implementation supports latitudes strictly between -66 and +66 degrees;
  polar comparisons are rejected rather than returning unstable rising angles.

This supports a worldwide candidate-city ranking and selected-place comparisons.
It is not an astrocartography world map or a factual city/lifestyle assessment.
Interpretive suitability is not a guarantee. Birth-time accuracy and practical
factors such as work, budget, housing, and support networks still matter.

Astronomical primitives: [Astronomy Engine reference](https://github.com/cosinekitty/astronomy/tree/master/source/js).

## Checks

```
node scripts/test-relocation.mjs
node scripts/test-shared-library.mjs
node scripts/test-shared-library-client.mjs
npm run build
```

Tests independently rotate the calculated Ascendant into horizon coordinates
and verify zero altitude/eastern azimuth, verify the MC's meridian, compare an
identical destination with the birthplace, and check timezones, DST failures,
unchanged planetary longitudes, stale-data detection, and report facts.

Redeploy the astrology frontend, preserving its storage folder. No additional
API, database migration, or backend environment variable is needed.

## Domestic and international top ten

Choose a domestic country and Overall balance, Career, Home, or Relationships,
then **Find my top 10 places**. The best five cities within the chosen country
and the best five outside it are combined and sorted by the same raw score,
highest first. Domestic and International labels appear in the saved list and
export. The birth location country suffix supplies a default when recognized;
otherwise the user chooses it explicitly. Country and priority edits do not
change an existing saved report until a new search runs. Ranking works locally without Ollama; the optional narrative still
uses Ollama. A new search replaces the saved comparison. Manual recalculation
removes ranking metadata. Results, reasons and tradeoffs are included in export
and supplied to section 1 when regenerated. Existing manual reports still work.

The bundled 7,166-city list comes from Natural Earth's 1:10m populated places:
https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_10m_populated_places.geojson
Downloaded 2026-10-30; English city/region/country names and city-center coordinates only.
Entries outside the latitude limit and repeated full place names are excluded.
Coordinates are public domain: https://www.naturalearthdata.com/about/terms-of-use/
The importer excludes latitudes outside the supported open interval (-66, 66).
This is a fixed worldwide sample, not every city or a current livability dataset.

Scoring method `worldwide-v1`: angular strength decreases linearly from 1 at
conjunction to 0 at 12 degrees. Weights: Sun +3, Moon +2, Mercury +1.5,
Venus/Jupiter +4, Mars/Pluto -2, Saturn -3, Uranus/Neptune -1.5. A specific
priority doubles the corresponding MC (career), IC (home), or Descendant
(relationships) contribution, including challenging contributions. Supportive
planets receive +0.75 for relevant houses: career 2/6/10, home 4,
relationships 5/7/11. Balanced includes all three groups. Raw scores are sorted
descending with a stable English-name tie break. Scores are internal comparative
weights, not probabilities. The top three positive and two negative factors are
shown. All cities use the same score. The quota ensures exactly five domestic and five
international results, with no additional continent quota. Countries with fewer
than five supported candidates produce an explanatory error and can still use
manual comparisons; results are never silently padded or duplicated.

New searches use method `domestic-international-v1` with the same scoring weights.
Saved `worldwide-v1` five-place reports remain readable and are not rewritten.
The selected country is persisted with each new ranking. Manual comparisons
now accept up to ten places and clear automatic ranking metadata.

This heuristic does not evaluate local safety, immigration eligibility, cost,
employment, climate, or the entire natal aspect pattern. It uses recalculated
natal planetary positions at the fixed birth instant and relocated angles/houses.
