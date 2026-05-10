# Pray BD - Prayer Times Web App

## Project Overview

Modern Islamic prayer times web application for Bangladesh with real-time countdown, Hijri date, and city selection.

**Website:** pray.netlify.app
**Tech Stack:** Single HTML file with Tailwind CSS, Luxon, Lucide Icons
**Primary API:** Aladhan.com (Method 1, School 1 - Karachi/Hanafi)

## Features

- Real-time countdown to next prayer (prominent, large display)
- Accurate Hanafi prayer times for Bangladesh (Karachi method)
- Gregorian and Hijri date (updates at Maghrib)
- City selection (8 major cities)
- Dark/Light theme toggle
- Bengali/English language support
- Automatic midnight refresh
- Local caching (24-hour)

## API Integration

### Primary: Aladhan (Method 1 - Karachi, School 1 - Hanafi)
- Endpoint: `https://api.aladhan.com/v1/timingsByCity/{date}?city={city}&country=Bangladesh&method=1&school=1&timetype=24`
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
- `determineCurrentNextPrayer()` - Calculates current/next prayer
- `updateHijriDateDisplay()` - Updates with Maghrib offset
- `renderPrayerCards()` - Renders prayer time cards
- `scheduleMidnightRefresh()` - Auto-refreshes at midnight

## File Structure

```
prayerTime/
├── index.html    # Complete app (HTML + CSS + JS)
└── CLAUDE.md     # This documentation
```

## Maintenance

- Clear localStorage if times seem incorrect
- API has built-in 24-hour caching
- Fallback times in `calculateFallbackTimes()`