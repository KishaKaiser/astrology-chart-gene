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
2. Click "Generate Chart" button in the header
3. Fill in the form with the test data above
4. Click "Generate Chart"
5. Check the browser console (F12) for detailed calculation logs
6. Verify the Sun sign shows as **Virgo** in the generated chart

## What Changed
Fixed the timezone offset calculation in `/src/lib/astrology-calc.ts`:
- Changed `sign === '+' ? 1 : -1` to `sign === '-' ? -1 : 1`
- This ensures negative timezone offsets (like -05:00) correctly ADD hours to get UTC
- Added extensive logging to verify the conversion

## Console Logging
You should see logs like:
```
Timezone offset parsed: { sign: "-", offsetHours: 5, offsetMinutes: 0 }
Offset total minutes (positive = ahead of UTC): -300
Input local time: 1977-09-01 17:00
Calculated UTC time: 1977-09-01T22:00:00.000Z
Verification: UTC should be AHEAD local time by 5 hours
```

This confirms:
- Local time: 17:00 (5 PM)
- UTC time: 22:00 (10 PM) - which is 5 hours later ✓
- Swiss Ephemeris calculates planetary positions at UTC time 22:00
- Sun position at that time should be ~8-9° Virgo
