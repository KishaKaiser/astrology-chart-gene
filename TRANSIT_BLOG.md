# Upcoming transit blog topics

The Blog Posts generator now calculates a calendar from the scan time through six
calendar months later (month-end dates are clamped). Each row has a Generate post
button. Category filters and Show more keep the list manageable. Refresh transits
recalculates the date window. The worker runs locally without a transit API key.

The calendar includes Sun and Mercury–Pluto sign changes, Mercury–Pluto retrograde
periods, major aspects between those bodies, new/full moons, and global solar and
lunar eclipse peaks. Fast Moon-to-planet aspects, daily lunar sign changes, natal
transits, minor aspects, asteroids, and retrograde shadow periods are not included.

Positions use [Astronomy Engine](https://github.com/cosinekitty/astronomy/tree/master/source/js),
pinned in package-lock.json: apparent geocentric vectors converted to tropical
ecliptic longitude of date. Scanning uses six-hour steps, with detected boundaries
refined to one minute; calculated times are approximate, not observatory-grade
predictions. Very brief grazing contacts between samples may not appear.
Retrograde speed uses a centered six-hour longitude difference. Aspects use a
fixed 1° orb around conjunction, sextile, square, trine, and opposition. A period
within orb can turn away without an exact contact. Long intervals may contain
multiple exact contacts. Already-active and continuing-beyond-window periods are
explicitly clipped and labelled rather than inventing actual start/end dates.
Ingresses, lunations, and eclipses are point events, not assumed multi-day periods.
Eclipses replace ordinary lunations that occur on the same day. Eclipse peaks
are global and do not imply visibility at a user's location.

The list displays dates in the browser's timezone. The selected event's UTC
dates, exact contacts, and boundary caveats are sent to the AI and retained on
saved posts. Articles explicitly use UTC. The AI writes ordinary Markdown rather
than putting a long article inside JSON. Missing headings get a topic-based
title; empty/very short outputs and service failures surface errors. A failed
generation leaves the previous draft intact. Model selection uses the existing
Ollama selector. Saved posts, editing, copying, downloads, and existing publishing
tools remain available. Legacy recurring topic schedules use the new text writer
but are explicitly educational, without claims about uncalculated event dates.

Validation:

```
node scripts/test-upcoming-transits.mjs
node scripts/test-blog-generation.mjs
npm run build
```

Eclipse fixtures reference NASA's [solar catalog](https://eclipse.gsfc.nasa.gov/SEcat5/SE2001-2100.html)
and [lunar catalog](https://eclipse.gsfc.nasa.gov/LEcat5/LE2001-2100.html).
Those catalogs label greatest-eclipse times in dynamical time; tests allow ten
minutes when comparing with the computed UTC peaks. The equinox is also checked
against Astronomy Engine's independent season search, and exact aspect positions
are checked against their claimed angles.

Deploy the frontend with `npm ci` followed by the existing build/start process.
No Chatterbox backend changes or new server environment variables are required.
