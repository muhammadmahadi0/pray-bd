# Pray BD 🕌

Modern prayer times web app for Bangladesh with real-time countdown and Hijri date.

**Live:** [pray.netlify.app](https://pray.netlify.app)

## Features

- Real-time countdown to next prayer
- Accurate Hanafi prayer times (Karachi method)
- Sunrise & sunset times
- Gregorian & Hijri date
- Auto-detect location via IP
- 8 major Bangladeshi cities
- Dark/Light theme
- Bengali/English language
- 24-hour local caching

## Tech

HTML + CSS + JS • Tailwind CSS • Luxon • Lucide Icons • Aladhan API

## Usage

Open the page — location auto-detects. Prayer times and countdown start immediately. Toggle language (BN/EN) or theme (dark/light) from the header.

## API

[Aladhan API](https://aladhan.com/prayer-times-api) — Method 1 (Karachi), School 1 (Hanafi). Falls back to seasonal Bangladesh times if offline.

## File Structure

```
├── index.html    # HTML + CDN config
├── script.js     # All logic
├── style.css     # Custom styles
└── README.md     # This file
```
