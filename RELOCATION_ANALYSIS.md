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
export. The user selects the current home/domestic country explicitly; the birthplace
is not assumed to be the current residence. An optional current-home city
provides a separate chart comparison reference without changing birth data. Country and priority edits do not
change an existing saved report until a new search runs. Ranking works locally without Ollama; the optional narrative still
uses Ollama. A new search replaces the saved comparison. Manual recalculation
removes ranking metadata. Results, reasons and tradeoffs are included in export
and supplied to section 1 when regenerated. Existing manual reports still work.

The bundled 7,166-city list comes from Natural Earth's 1:10m populated places:
https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_10m_populated_places.geojson
Downloaded 2026-10-30; City/region/country names, city-center coordinates, historical POP_MAX
metropolitan population estimates, administrative-capital role and WORLDCITY flag.
Population/role metadata refreshed 2026-10-31 from the same public-domain source.
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

Earlier searches used method `domestic-international-v1`; new searches use
`practical-v1`, described below.
Saved `worldwide-v1` five-place reports remain readable and are not rewritten.
The selected country is persisted with each new ranking. Manual comparisons
now accept up to ten places and clear automatic ranking metadata.

This heuristic does not evaluate local safety, immigration eligibility, cost,
employment, climate, or the entire natal aspect pattern. It uses recalculated
natal planetary positions at the fixed birth instant and relocated angles/houses.

## Practical ranking (practical-v1)

Final score = 0.60 × Astrology + 0.25 × Urban-access estimate +
0.10 × Regional importance + 0.05 × Population. All components are 0–100.
The 25% term is explicitly a **livability proxy**, not a measured livability index.
There is no current hospital, school, transport-route, safety, housing, job or
cost-of-living dataset in this offline implementation. Neither UI nor AI should
claim those facilities are verified.

- Astrology: `50 + 50 * tanh(rawAstrologyScore / 12)`, using the prior raw
  astrology rules. Fixed normalization avoids changing a city's score just by
  adding/removing candidate cities or choosing a different domestic country.
- Urban access: 70% proximity to the closest same-country urban center with
  POP_MAX >= 250,000, fading linearly from 100 at 0 km to 0 at 200 km; 30% number
  of other same-country centers with >= 50,000 people within 100 km (full credit
  at four). Distances are straight-line; ferries, borders, terrain and road
  connectivity are not assessed. A qualifying large city is its own urban hub.
- Regional importance: 100 for a national capital or world-city flag, 75 for an
  administrative regional capital, 25 otherwise. This is administrative role,
  not the dataset's map-label importance, which can favor remote settlements.
- Population: logarithmic scaling from 10,000 (0) to 5,000,000 (100), clamped.
  Natural Earth POP_MAX can describe a metro area, is historical, and must not
  be presented as a current municipal census count. Shared inputs mean these
  components are not statistically independent.

Filters run BEFORE scoring: default cities >= 100,000 people, plus towns >=
25,000 within 50 km of a same-country 250,000-person hub (the user's preference
is to allow both). Every candidate must also be within 100 km of such a hub.
Thresholds, an optional maximum population, smaller-place toggle and domestic
region exclusions are editable. Missing population excludes a city. Unknown
region names produce an error rather than silently ignoring an exclusion.
No exclusion for Alaska is imposed automatically; users can exclude Alaska by
name, while sizeable urban centers there can otherwise qualify. These filters
reduce isolation but do not prove service availability.

The best five qualifying domestic and five qualifying international places
are sorted together by final score. Insufficient candidates produce an error;
filters are never relaxed silently. New reports persist filters, components,
urban-access inputs and optional current-home chart reference. Old reports stay
readable and are flagged in the UI until a new search applies the formula.
Birthplace is always the natal reference and is never a distance ranking bonus.
Current home only changes comparison context, not the birth instant or ranking.
UI, export, and AI context include the weighting and proxy limitations.

Data field definitions and population methodology:
https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-populated-places/
