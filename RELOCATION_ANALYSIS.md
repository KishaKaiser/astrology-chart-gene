# Relocation comparison

Open a chart's **Relocation** tab, select or enter up to five cities/coordinates,
then choose **Calculate selected places**. Calculations run locally; manual
coordinate entry works without a geocoding connection. City search reuses the
existing OpenStreetMap search. The optional **Generate plain-language comparison**
uses the selected Ollama model. Results save with the chart in the shared library.
Changing the candidate list does not replace the saved report until recalculated.

Regenerate interpretation section 1 to incorporate the calculated destinations.
The prompt compares only those places, with reasons and tradeoffs, instead of
claiming to find the best place worldwide. Export Options includes **Relocation
analysis** for the calculations and saved narrative. Reports whose birth data
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

This is a selected-place relocated-chart comparison, not an astrocartography
world map, automatic worldwide ranking, or a factual city/lifestyle assessment.
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
