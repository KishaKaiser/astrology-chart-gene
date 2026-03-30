# Test Instructions for September 1, 1977 Birth Chart

## Test Data
- **Name**: Test Chart
- **Date**: September 1, 1977  (1977-09-01)
- **Time**: 17:00 (5:00 PM)
- **Location**: Indianapolis, IN
- **Coordinates**: Latitude 39.7684, Longitude -86.1581
- **Timezone**: -05:00 (EST - Indianapolis did NOT observe DST in 1977)

## Expected Results
**Sun Sign**: VIRGO (not Libra)

### Why Virgo?
- September 1, 1977 at 17:00 EST = September 1, 1977 at 22:00 UTC
- The Sun enters Libra around September 23 each year
- On September 1, the Sun is still in Virgo (around 8-9° Virgo)

## How to Test
1. Open the application
2. A test component will be visible at the top of the page
3. Click "Run Sun Sign Test" button
4. Check the results displayed on screen
5. Check the browser console (F12) for detailed calculation logs
6. Verify the Sun sign shows as **Virgo** in the test results

## Alternative Manual Test
1. Click "Generate Chart" button in the header
2. Fill in the form with the test data above
3. Click "Generate Chart"
4. Check the Sun sign in the generated chart

## Timezone Conversion Logic
The code in `/src/lib/astrology-calc.ts` lines 309-314 handles timezone conversion:

```typescript
const offsetTotalMinutes = (sign === '-' ? 1 : -1) * (offsetHours * 60 + offsetMinutes)
const localTimestamp = Date.UTC(year, month - 1, day, hour, minute, 0, 0)
const utcTimestamp = localTimestamp + (offsetTotalMinutes * 60 * 1000)
dateTime = new Date(utcTimestamp)
```

For `-05:00` timezone:
- sign = '-', so multiplier is 1
- offsetTotalMinutes = 1 * 300 = +300 minutes
- Adds 5 hours to local time to get UTC
- 17:00 local + 5:00 = 22:00 UTC ✓

This formula is CORRECT:
- Negative timezones (e.g., `-05:00`) are BEHIND UTC → ADD hours to get UTC
- Positive timezones (e.g., `+05:30`) are AHEAD of UTC → SUBTRACT hours to get UTC

## Console Logging
You should see logs like:
```
=== SUN SIGN TEST FOR SEPTEMBER 1, 1977 ===
Birth data:
  Date: September 1, 1977
  Time: 17:00 (5:00 PM)
  Location: Indianapolis, IN
  Timezone: -05:00 (EST, no DST in 1977)
  Expected: Sun in Virgo

[...detailed calculation logs...]

=== RESULT ===
Sun Sign: Virgo
Sun Position: 8.xxxx° Virgo
Sun Longitude: 158.xxxx°
```

If the Sun is showing as Libra (180°-210°), there's still a timezone conversion issue.
