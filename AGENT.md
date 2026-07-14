# Pray BD - Prayer Times Web App

## Project Overview

Modern Islamic prayer times web application for Bangladesh with real-time countdown, Hijri date, and city selection.

**Website:** pray.netlify.app
**Tech Stack:** HTML + CSS + JS with Tailwind CSS, Luxon, Lucide Icons
**Primary API:** Aladhan.com (Method 1, School 1 - Karachi/Hanafi)

## Features

- Real-time countdown to next prayer (prominent, large display)
- Sunrise and sunset times displayed
- Accurate Hanafi prayer times for Bangladesh (Karachi method)
- Gregorian and Hijri date
- City selection (8 major cities)
- Dark/Light theme toggle
- Bengali/English language support
- Automatic midnight refresh
- Local caching (24-hour)
- **Special timer periods:** Sunrise prohibited (RED), Ishraq, Chasht (countdown to Dhuhr-10min)

## API Integration

### Primary: Aladhan (Method 1 - Karachi, School 1 - Hanafi)
- Endpoint: `https://api.aladhan.com/v1/timings/{date}?latitude={lat}&longitude={lng}&method=1&school=1`
- Method 1 = University of Islamic Sciences, Karachi
- School 1 = Hanafi (for Asr calculation)

### Fallback: Local calculation
- Uses seasonal times for Bangladesh (Hanafi)
- Fajr: 04:30-04:50
- Asr: 15:45-16:00 (Hanafi)
- Maghrib: 18:10-18:30
- Isha: 19:30-19:45

### Hijri Date
- Aladhan gToH endpoint for accurate Hijri date

## Design

- Dark theme: Pure black (#000000) with emerald/gold accents
- Glassmorphism cards with backdrop blur
- Islamic geometric pattern background
- Mobile-first responsive
- Large countdown: 3.5rem mobile, 4.5rem tablet, 7rem desktop

## Key Functions

- `fetchPrayerTimes()` - Fetches from Aladhan with method=1, school=1
- `updateCountdown()` - Updates every second
- `renderPrayerCards()` - Renders prayer time cards with current/next badges
- `getNextPrayerInfo()` - Returns next upcoming prayer for countdown
- `updateHijriDateDisplay()` - Updates Hijri date display
- `scheduleMidnightRefresh()` - Auto-refreshes at midnight
- `detectLocation()` - Auto-detect city via IP geolocation

## Current Prayer Logic

- Current prayer = the last prayer whose time has arrived
- Before Fajr: Isha stays current (Isha window extends to Fajr)
- Next prayer = first upcoming prayer; wraps to Fajr if all passed
- Countdown cycles through Fajr, Dhuhr, Asr, Maghrib, Isha
- Sunrise/sunset are displayed as cards but excluded from current/next badges

## File Structure

```
prayerTime/
├── index.html    # HTML structure and CDN config
├── script.js     # All application logic
├── style.css     # Custom CSS styles
└── AGENT.md      # This documentation
```

## Maintenance

- Clear localStorage if times seem incorrect
- API has built-in 24-hour caching
- Fallback times in `calculateFallbackTimes()`
