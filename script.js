// ============================================
// CONFIGURATION
// ============================================
const { DateTime } = luxon;
const API_BASE = "https://api.aladhan.com/v1";

function getTimezone() {
    return state.detectedLocation?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Dhaka";
}

function getLocalNow() {
    return DateTime.now().setZone(getTimezone());
}

function formatInTimezone(format, timezone) {
    return DateTime.now().setZone(timezone).toFormat(format);
}

const cities = {
    dhaka: { name: "Dhaka", lat: 23.8103, lng: 90.4125 },
    chittagong: { name: "Chittagong", lat: 22.3569, lng: 91.7832 },
    sylhet: { name: "Sylhet", lat: 24.8995, lng: 91.8733 },
    khulna: { name: "Khulna", lat: 22.8456, lng: 89.5403 },
    barisal: { name: "Barisal", lat: 22.701, lng: 90.3535 },
    rajshahi: { name: "Rajshahi", lat: 24.3745, lng: 88.6042 },
    rangpur: { name: "Rangpur", lat: 25.7439, lng: 89.2752 },
    mymensingh: { name: "Mymensingh", lat: 24.7471, lng: 90.4203 },
};

const PRAYER_ORDER = [
    "fajr",
    "sunrise",
    "dhuhr",
    "asr",
    "maghrib",
    "isha",
];

const translations = {
    en: {
        loading: "Loading...",
        prayerTimes: "Prayer Times",
        footer: "Allah is sufficient for us.",
        nextPrayer: "Next Prayer",
        lastUpdated: "Updated",
        errorFetching: "Using offline prayer times. Some times may be inaccurate.",
        apiCredit: "Prayer times powered by Aladhan API • Optimized for Bangladesh",
        detectedLocation: "Detected",
        manualLocation: "Manual",
        prayers: {
            fajr: "Fajr",
            sunrise: "Sunrise",
            dhuhr: "Dhuhr",
            asr: "Asr",
            maghrib: "Maghrib",
            isha: "Isha",
        },
        days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    },
    bn: {
        loading: "লোড হচ্ছে...",
        prayerTimes: "নামাজের সময়",
        footer: "আল্লাহ্ই আমাদের জন্য যথেষ্ট",
        nextPrayer: "পরবর্তী নামাজ",
        lastUpdated: "আপডেট",
        errorFetching: "অফলাইন নামাজের সময় ব্যবহার করা হচ্ছে। কিছু সময় সঠিক নাও হতে পারে।",
        apiCredit: "নামাজের সময় Aladhan API দ্বারা • বাংলাদেশের জন্য অপ্টিমাইজড",
        detectedLocation: "সনাক্তকৃত",
        manualLocation: "ম্যানুয়াল",
        prayers: {
            fajr: "ফজর",
            sunrise: "সূর্যোদয়",
            dhuhr: "যোহর",
            asr: "আসর",
            maghrib: "মাগরিব",
            isha: "এশা",
        },
        days: ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার"],
        months: ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"],
    },
};

// ============================================
// STATE
// ============================================
let state = {
    lang: localStorage.getItem("praybd-lang") || "bn",
    theme: localStorage.getItem("praybd-theme") || "dark",
    city: localStorage.getItem("praybd-city") || "dhaka",
    detectedLocation: null,
    locationLoading: true,
    ipAddress: null,
    prayerTimes: null,
    currentPrayer: null,
    nextPrayer: null,
    hijriDate: null,
    lastUpdated: null,
    isLoading: true,
};

const elements = {};

// ============================================
// INITIALIZATION
// ============================================
async function init() {
    cacheElements();
    setupEventListeners();
    applyTheme();
    lucide.createIcons();
    renderLoadingState();

    await detectLocation();

    const savedCity = localStorage.getItem("praybd-city");
    if (!savedCity && state.detectedLocation) {
        const matchedCity = matchCityToOptions(state.detectedLocation.city);
        state.city = matchedCity;
        localStorage.setItem("praybd-city", matchedCity);
    }

    updateLocationDisplay();
    updateIpDisplay();

    fetchAllData();

    setInterval(updateCountdown, 1000);
    setInterval(updateCurrentTime, 1000);
    setInterval(updateHijriDateDisplay, 60000);
    scheduleMidnightRefresh();
}

function renderLoadingState() {
    elements.countdown.textContent = "--:--:--";
    elements.nextPrayerLabel.textContent = translations[state.lang].loading || "Loading...";
    elements.currentTime.textContent = "";

    elements.gregorianDate.textContent = translations[state.lang].loading || "Loading...";
    elements.hijriDate.textContent = translations[state.lang].loading || "Loading...";

    renderPrayerSkeletons();
}

function updateLocationIndicator() {
    const headerTitle = document.querySelector("h1");
    if (!headerTitle) return;

    const existingBadge = headerTitle.querySelector(".location-badge");
    if (existingBadge) existingBadge.remove();

    const t = translations[state.lang];
    const cityName = state.detectedLocation?.city || "Dhaka";

    const badge = document.createElement("span");
    badge.className = "location-badge text-xs px-2 py-0.5 rounded ml-2 bg-emerald-800 text-emerald-200";
    badge.textContent = cityName;
    badge.title = t.detectedLocation;

    headerTitle.appendChild(badge);
}

function cacheElements() {
    elements.langToggle = document.getElementById("langToggle");
    elements.themeToggle = document.getElementById("themeToggle");
    elements.detectedLocation = document.getElementById("detectedLocation");
    elements.ipDisplay = document.getElementById("ipDisplay");
    elements.prayerGrid = document.getElementById("prayerGrid");
    elements.countdown = document.getElementById("countdown");
    elements.nextPrayerLabel = document.getElementById("nextPrayerLabel");
    elements.currentTime = document.getElementById("currentTime");
    elements.lastUpdated = document.getElementById("lastUpdated");
    elements.gregorianDate = document.getElementById("gregorianDate");
    elements.hijriDate = document.getElementById("hijriDate");
    elements.errorSection = document.getElementById("errorSection");
    elements.errorMessage = document.getElementById("errorMessage");
    elements.apiCredit = document.getElementById("apiCredit");
}

function setupEventListeners() {
    elements.langToggle.addEventListener("click", toggleLanguage);
    elements.themeToggle.addEventListener("click", toggleTheme);
}

function updateLocationDisplay() {
    const detectedEl = document.getElementById("detectedLocation");
    if (detectedEl) {
        const cityName = state.detectedLocation?.city || "Dhaka";
        const country = state.detectedLocation?.country === "BD" ? "Bangladesh" : state.detectedLocation?.country || "Bangladesh";
        detectedEl.textContent = `${cityName}, ${country}`;
    }

    const autoBadge = document.getElementById("autoBadge");
    if (autoBadge) {
        autoBadge.classList.remove("hidden");
    }
}

function updateIpDisplay() {
    if (!elements.ipDisplay) return;

    const ip = state.ipAddress || state.detectedLocation?.ip;
    if (ip) {
        elements.ipDisplay.textContent = `Connected via: ${ip}`;
    } else {
        elements.ipDisplay.textContent = "";
    }
}

function applyTheme() {
    if (state.theme === "light")
        document.documentElement.classList.add("light");
}

// ============================================
// IP GEOLOCATION
// ============================================
async function detectLocation() {
    const cacheKey = "praybd-detected-location";
    const cacheDuration = 24 * 60 * 60 * 1000;

    const cached = localStorage.getItem(cacheKey);
    if (cached) {
        try {
            const parsed = JSON.parse(cached);
            if (parsed.detectedAt && (Date.now() - parsed.detectedAt < cacheDuration)) {
                state.detectedLocation = parsed;
                state.locationLoading = false;
                return parsed;
            }
        } catch (e) {
            localStorage.removeItem(cacheKey);
        }
    }

    try {
        const response = await fetch("https://ipapi.co/json/");
        if (response.ok) {
            const data = await response.json();
            const locationData = {
                city: data.city || "Dhaka",
                lat: data.latitude || 23.8103,
                lng: data.longitude || 90.4125,
                country: data.country_code || "BD",
                timezone: data.timezone || "Asia/Dhaka",
                ip: data.ip || null,
                detectedAt: Date.now()
            };

            localStorage.setItem(cacheKey, JSON.stringify(locationData));
            state.detectedLocation = locationData;
            state.ipAddress = locationData.ip;
            state.locationLoading = false;
            return locationData;
        }
    } catch (error) {
        console.warn("ipapi.co failed, trying fallback:", error);
    }

    try {
        const response = await fetch("https://ip-api.com/json");
        if (response.ok) {
            const data = await response.json();
            if (data.status === "success") {
                const locationData = {
                    city: data.city || "Dhaka",
                    lat: data.lat || 23.8103,
                    lng: data.lon || 90.4125,
                    country: data.countryCode || "BD",
                    timezone: data.timezone || "Asia/Dhaka",
                    ip: data.query || null,
                    detectedAt: Date.now()
                };

                localStorage.setItem(cacheKey, JSON.stringify(locationData));
                state.detectedLocation = locationData;
                state.ipAddress = locationData.ip;
                state.locationLoading = false;
                return locationData;
            }
        }
    } catch (error) {
        console.warn("ip-api.com failed, using fallback:", error);
    }

    const fallback = {
        city: "Dhaka",
        lat: 23.8103,
        lng: 90.4125,
        country: "BD",
        timezone: "Asia/Dhaka",
        ip: null,
        detectedAt: Date.now()
    };
    state.detectedLocation = fallback;
    state.ipAddress = fallback.ip;
    state.locationLoading = false;
    return fallback;
}

function matchCityToOptions(detectedCity) {
    if (!detectedCity) return "dhaka";

    const cityLower = detectedCity.toLowerCase();
    const cityKeys = Object.keys(cities);

    const dhakaAreas = ["mirpur", "gazipur", "uttara", "savar", "tongi", "narayanganj", "keraniganj"];
    if (dhakaAreas.some(area => cityLower.includes(area))) {
        return "dhaka";
    }

    const sylhetAreas = ["sylhet", "zindabazar"];
    if (sylhetAreas.some(area => cityLower.includes(area))) {
        return "sylhet";
    }

    if (cityLower.includes("chattogram") || cityLower.includes("chittagong")) {
        return "chittagong";
    }

    for (const key of cityKeys) {
        if (cityLower === key || cityLower === cities[key].name.toLowerCase()) {
            return key;
        }
    }

    for (const key of cityKeys) {
        if (cities[key].name.toLowerCase().includes(cityLower) ||
            cityLower.includes(cities[key].name.toLowerCase())) {
            return key;
        }
    }

    return "dhaka";
}

// ============================================
// DATA FETCHING
// ============================================
async function fetchAllData() {
    state.isLoading = true;
    hideError();
    try {
        await Promise.all([fetchPrayerTimes(), fetchHijriDate()]);
        state.lastUpdated = DateTime.now();
        updateLastUpdatedDisplay();
        state.isLoading = false;
    } catch (error) {
        showError(translations[state.lang].errorFetching);
        state.isLoading = false;
    }
}

async function fetchPrayerTimes() {
    const city = cities[state.city];
    const date = getLocalNow();
    const dateStr = `${date.day}-${date.month}-${date.year}`;

    const lat = state.detectedLocation?.lat || city.lat;
    const lng = state.detectedLocation?.lng || city.lng;
    const locationKey = `${lat.toFixed(2)}-${lng.toFixed(2)}`;
    const cacheKey = `prayertimes-${locationKey}-${dateStr}`;

    const cached = localStorage.getItem(cacheKey);
    if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.date === dateStr && parsed.timestamp) {
            const cacheAge = Date.now() - parsed.timestamp;
            if (cacheAge < 24 * 60 * 60 * 1000) {
                state.prayerTimes = parsed.times;
                updatePrayerDisplay();
                return;
            }
        }
    }

    try {
        const response = await fetch(
            `${API_BASE}/timings/${dateStr}?latitude=${lat}&longitude=${lng}&method=1&school=1&timetype=24`,
        );

        if (!response.ok) throw new Error("API request failed");

        const data = await response.json();

        if (data.code === 200 && data.data) {
            const t = data.data.timings;
            state.prayerTimes = {
                fajr: t.Fajr,
                sunrise: t.Sunrise,
                dhuhr: t.Dhuhr,
                asr: t.Asr,
                maghrib: t.Maghrib,
                isha: t.Isha,
            };

            if (data.data.hijri) {
                state.hijriDate = data.data.hijri;
                updateHijriDateDisplay();
            }

            localStorage.setItem(
                cacheKey,
                JSON.stringify({
                    date: dateStr,
                    times: state.prayerTimes,
                    timestamp: Date.now(),
                }),
            );

            updatePrayerDisplay();
        }
    } catch (error) {
        console.error("Aladhan failed, using fallback:", error);
        state.prayerTimes = calculateFallbackTimes();
        updatePrayerDisplay();
    }
}

async function fetchHijriDate() {
    if (state.hijriDate) {
        updateHijriDateDisplay();
        return;
    }

    const now = getLocalNow();
    const dateStr = `${now.day}-${now.month}-${now.year}`;

    try {
        const response = await fetch(`${API_BASE}/gToH/${dateStr}`);
        if (response.ok) {
            const data = await response.json();
            if (data.data && data.data.hijri) {
                state.hijriDate = data.data.hijri;
            }
        }
    } catch (error) {
        console.error("Error fetching Hijri date:", error);
    }
    updateHijriDateDisplay();
}

function calculateFallbackTimes() {
    const now = DateTime.now();
    const month = now.month;
    const isSummer = month >= 4 && month <= 9;

    const baseTimes = {
        fajr: isSummer ? "04:30" : "04:50",
        sunrise: isSummer ? "05:15" : "05:35",
        dhuhr: "12:00",
        asr: isSummer ? "15:45" : "16:00",
        maghrib: isSummer ? "18:30" : "18:10",
        isha: isSummer ? "19:45" : "19:30",
    };

    return baseTimes;
}

// ============================================
// PRAYER CALCULATIONS
// ============================================
function updatePrayerDisplay() {
    if (!state.prayerTimes) return;
    renderPrayerCards();
    updateCountdown();
    updateDates();
    updateHijriDateDisplay();
}

function determineCurrentNextPrayer() {
    const now = getLocalNow();
    const currentMinutes = now.hour * 60 + now.minute;

    const prayersWithMins = PRAYER_ORDER.map((key) => ({
        key,
        name: translations[state.lang].prayers[key],
        time: state.prayerTimes[key],
        minutes: timeToMinutes(state.prayerTimes[key]),
        icon: getPrayerIcon(key),
    })).filter((p) => p.key !== "sunrise");

    let currentIdx = -1;
    let nextIdx = 0;

    for (let i = 0; i < prayersWithMins.length; i++) {
        if (currentMinutes >= prayersWithMins[i].minutes)
            currentIdx = i;
        else if (nextIdx === i && currentIdx < i) nextIdx = i;
    }

    if (currentIdx === prayersWithMins.length - 1) nextIdx = 0;

    state.currentPrayer =
        currentIdx >= 0 ? prayersWithMins[currentIdx] : null;
    state.nextPrayer = prayersWithMins[nextIdx];
}

function timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
}

function format12Hour(timeStr) {
    if (!timeStr) return "--:--";
    const [h, m] = timeStr.split(":").map(Number);
    const date = new Date();
    date.setHours(h, m, 0, 0);
    return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
}

function formatTime(timeStr) {
    if (!timeStr) return "--:--";
    const time12 = format12Hour(timeStr);
    if (state.lang === "bn") {
        const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
        const toBn = (n) =>
            n
                .toString()
                .split("")
                .map((d) => bnDigits[parseInt(d)])
                .join("");
        return time12
            .replace(/\d+/g, (match) => toBn(match))
            .replace("AM", "এ এম")
            .replace("PM", "পি এম");
    }
    return time12;
}

function getPrayerIcon(key) {
    const icons = {
        fajr: "sunrise",
        sunrise: "sun",
        dhuhr: "sun",
        asr: "cloud-sun",
        maghrib: "sunset",
        isha: "moon",
    };
    return icons[key] || "clock";
}

// ============================================
// RENDERING
// ============================================
function renderPrayerSkeletons() {
    const t = translations[state.lang].prayers;
    elements.prayerGrid.innerHTML = PRAYER_ORDER.map(
        (key) => `
                    <div class="prayer-card glass-card rounded-xl p-4 skeleton">
                        <div class="flex items-center gap-2 mb-2">
                            <div class="w-4 h-4 rounded bg-gold-400/30"></div>
                            <div class="h-4 w-16 rounded bg-gold-400/30"></div>
                        </div>
                        <div class="h-8 w-20 rounded bg-gold-400/30"></div>
                    </div>
                `,
    ).join("");
}

function renderPrayerCards() {
    if (!state.prayerTimes) return;

    const t = translations[state.lang].prayers;
    const prayers = PRAYER_ORDER.map((key) => ({
        key,
        name: t[key],
        time: state.prayerTimes[key],
        icon: getPrayerIcon(key),
    }));

    const now = getLocalNow();
    const currentMinutes = now.hour * 60 + now.minute;

    const prayerKeys = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
    let currentIdx = -1;
    let nextIdx = -1;

    for (let i = 0; i < prayerKeys.length; i++) {
        const mins = timeToMinutes(state.prayerTimes[prayerKeys[i]]);
        if (currentMinutes >= mins) {
            currentIdx = i;
        } else if (nextIdx === -1) {
            nextIdx = i;
        }
    }

    if (nextIdx === -1) nextIdx = 0;
    if (currentIdx === -1) currentIdx = prayerKeys.length - 1;

    state.currentPrayer = {
        key: prayerKeys[currentIdx], name: t[prayerKeys[currentIdx]], time: state.prayerTimes[prayerKeys[currentIdx]]
    };
    state.nextPrayer = {
        key: prayerKeys[nextIdx],
        name: t[prayerKeys[nextIdx]],
        time: state.prayerTimes[prayerKeys[nextIdx]]
    };

    elements.prayerGrid.innerHTML = prayers
        .map((prayer) => {
            const isPrayer = prayer.key !== "sunrise";
            const prayerIdx = prayerKeys.indexOf(prayer.key);
            const isActive = isPrayer && prayerIdx === currentIdx;
            const isNext = isPrayer && prayerIdx === nextIdx;
            const timeLeft = isNext && !isActive
                ? getTimeRemaining(prayer.time)
                : "";

            return `
                        <div class="prayer-card glass-card rounded-xl p-4">
                            <div class="flex items-center gap-2 mb-2">
                                <i data-lucide="${prayer.icon}" class="w-4 h-4 text-gold-400"></i>
                                <span class="text-sm font-medium">${prayer.name}</span>
                            </div>
                            <div class="text-2xl font-bold text-gold-400">${formatTime(prayer.time)}</div>
                            ${isNext && timeLeft && !isActive ? `<div class="text-xs text-cream-200 mt-1">${timeLeft}</div>` : ""}
                        </div>
                    `;
        })
        .join("");

    lucide.createIcons();
}

function getTimeRemaining(timeStr) {
    const now = getLocalNow();
    const [h, m] = timeStr.split(":").map(Number);
    let target = now.set({ hour: h, minute: m, second: 0 });
    if (target < now) target = target.plus({ days: 1 });
    const diff = target.diff(now, ["hours", "minutes"]).toObject();
    const hours = Math.floor(diff.hours);
    const mins = Math.floor(diff.minutes);
    if (state.lang === "bn") {
        const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
        const toBn = (n) =>
            n
                .toString()
                .split("")
                .map((d) => bnDigits[parseInt(d)])
                .join("");
        return `${toBn(hours)} ঘণ্টা ${toBn(mins)} মিনিট`;
    }
    return `${hours}h ${mins}m`;
}

// ============================================
// COUNTDOWN & TIME
// ============================================

function formatCountdownTime(hours, mins, secs) {
    const h = String(Math.floor(hours)).padStart(2, "0");
    const m = String(Math.floor(mins)).padStart(2, "0");
    const s = String(Math.floor(secs)).padStart(2, "0");
    if (state.lang === "bn") {
        const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
        const toBn = (n) =>
            n
                .toString()
                .split("")
                .map((d) => bnDigits[parseInt(d)])
                .join("");
        return `${toBn(h)}:${toBn(m)}:${toBn(s)}`;
    }
    return `${h}:${m}:${s}`;
}

function getSpecialPeriod() {
    if (!state.prayerTimes || !state.prayerTimes.sunrise || !state.prayerTimes.dhuhr) return null;

    const now = getLocalNow();
    const cm = now.hour * 60 + now.minute;
    const cs = now.hour * 3600 + now.minute * 60 + now.second;

    const sun = timeToMinutes(state.prayerTimes.sunrise);
    const dhuhr = timeToMinutes(state.prayerTimes.dhuhr);
    const sunriseEnd = sun + 15;
    const ishraqEnd = sunriseEnd + 120; // 2 hours after prohibited period
    const chashtEnd = dhuhr - 10;

    if (cm >= sun && cm < sunriseEnd) {
        // Sunrise prohibited period — RED
        const remainSec = (sunriseEnd * 60 - cs + 86400) % 86400;
        return {
            type: "prohibited",
            labelBn: "সূর্যোদয় (নিষিদ্ধ)",
            labelEn: "Sunrise (prohibited)",
            remainSec,
            isRed: true,
        };
    }

    if (cm >= sunriseEnd && cm < ishraqEnd) {
        // Ishraq
        const remainSec = (chashtEnd * 60 - cs + 86400) % 86400;
        return {
            type: "ishraq",
            labelBn: "ইশরাক",
            labelEn: "Ishraq",
            remainSec,
            isRed: false,
        };
    }

    if (cm >= ishraqEnd && cm < chashtEnd) {
        // Chasht
        const remainSec = (chashtEnd * 60 - cs + 86400) % 86400;
        return {
            type: "chasht",
            labelBn: "চাশত",
            labelEn: "Chasht",
            remainSec,
            isRed: false,
        };
    }

    return null;
}

function getNextPrayerInfo() {
    if (!state.prayerTimes) return null;

    const now = getLocalNow();
    const currentMinutes = now.hour * 60 + now.minute;

    const prayerKeys = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
    const prayerNames = translations[state.lang].prayers;

    for (let i = 0; i < prayerKeys.length; i++) {
        const key = prayerKeys[i];
        const prayerTime = state.prayerTimes[key];
        if (!prayerTime) continue;

        const prayerMinutes = timeToMinutes(prayerTime);
        if (currentMinutes < prayerMinutes) {
            return {
                key: key,
                name: prayerNames[key],
                time: prayerTime,
                isTomorrow: false
            };
        }
    }

    return {
        key: "fajr",
        name: prayerNames.fajr,
        time: state.prayerTimes.fajr,
        isTomorrow: true
    };
}

function updateCountdown() {
    if (!state.prayerTimes) return;

    // Check special morning periods first (prohibited / Ishraq / Chasht)
    const special = getSpecialPeriod();
    if (special) {
        const h = special.remainSec / 3600;
        const m = (special.remainSec % 3600) / 60;
        const s = special.remainSec % 60;
        elements.countdown.textContent = formatCountdownTime(h, m, s);
        elements.countdown.style.color = special.isRed ? "#ef4444" : "";
        elements.nextPrayerLabel.textContent = state.lang === "bn" ? special.labelBn : special.labelEn;
        return;
    }

    // Normal — reset red
    elements.countdown.style.color = "";

    const nextInfo = getNextPrayerInfo();
    if (!nextInfo) return;

    state.nextPrayer = nextInfo;

    const now = getLocalNow();
    const [h, m] = nextInfo.time.split(":").map(Number);
    let target = now.set({ hour: h, minute: m, second: 0 });

    if (target <= now) {
        target = target.plus({ days: 1 });
    }

    const diff = target
        .diff(now, ["hours", "minutes", "seconds"])
        .toObject();

    elements.countdown.textContent = formatCountdownTime(diff.hours, diff.minutes, diff.seconds);

    const t = translations[state.lang];
    const tomorrowLabel = nextInfo.isTomorrow ? ` (${state.lang === "bn" ? "আগামীকাল" : "Tomorrow"})` : "";
    elements.nextPrayerLabel.textContent = `${t.nextPrayer}: ${nextInfo.name}${tomorrowLabel}`;
}

function updateCurrentTime() {
    const now = getLocalNow();
    const timeStr = now.toFormat("hh:mm:ss a");
    if (state.lang === "bn") {
        const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
        const toBn = (n) =>
            n
                .toString()
                .split("")
                .map((d) => bnDigits[parseInt(d)])
                .join("");
        const parts = timeStr.split(" ");
        const timePart = parts[0]
            .split(":")
            .map((t) => toBn(t))
            .join(":");
        elements.currentTime.textContent = `${timePart} ${parts[1] === "AM" ? "এ এম" : "পি এম"}`;
    } else {
        elements.currentTime.textContent = timeStr;
    }
}

function updateLastUpdatedDisplay() {
    if (!state.lastUpdated) return;
    const t = translations[state.lang];
    const timeStr = state.lastUpdated.toFormat("hh:mm a");
    elements.lastUpdated.textContent = `${t.lastUpdated}: ${timeStr}`;
}

// ============================================
// DATE DISPLAYS
// ============================================
function updateDates() {
    const now = getLocalNow();
    const t = translations[state.lang];
    const dayName = t.days[now.weekday % 7];
    const monthName = t.months[now.month - 1];
    elements.gregorianDate.textContent = `${dayName}, ${monthName} ${now.day}, ${now.year}`;
    updateHijriDateDisplay();
}

function updateHijriDateDisplay() {
    const now = getLocalNow();

    if (state.hijriDate) {
        let day = parseInt(state.hijriDate.day);
        let month = state.hijriDate.month.en;
        let year = state.hijriDate.year;

        // Aladhan calculates Hijri (Umm al-Qura), which is often 1 day ahead
        // of Bangladesh local moon sighting. Subtract 1 day to align.
        const monthLengths = {
            Muharram: 30,
            Safar: 29,
            "Rabi al-Awwal": 30,
            "Rabi al-Thani": 29,
            "Jumada al-Awwal": 30,
            "Jumada al-Thani": 29,
            Rajab: 30,
            "Sha'ban": 29,
            Ramadan: 30,
            Shawwal: 29,
            "Dhu al-Qidah": 30,
            "Dhu al-Hijjah": 29,
        };
        const months = Object.keys(monthLengths);

        // Decrement by 1 for Bangladesh local sighting
        day -= 1;
        if (day < 1) {
            // Go to previous month
            const idx = months.indexOf(month);
            if (idx > 0) {
                month = months[idx - 1];
            } else {
                month = "Dhu al-Hijjah";
                year--;
            }
            day = monthLengths[month] || 30;
        }

        const maxDay = monthLengths[month] || 30;
        if (day > maxDay) {
            day = 1;
            const idx = months.indexOf(month);
            if (idx < 11) month = months[idx + 1];
            else {
                month = "Muharram";
                year++;
            }
        }

        elements.hijriDate.textContent = `${day} ${month}, ${year} AH`;
    } else {
        const hijriYear =
            Math.floor(
                (now.toMillis() -
                    new Date("2024-07-08").getTime()) /
                (1000 * 60 * 60 * 24) /
                354.37,
            ) +
            1445;
        elements.hijriDate.textContent = `${now.day} ${translations[state.lang].months[now.month - 1]}, ${hijriYear} ${state.lang === "bn" ? "হিজরি" : "AH"}`;
    }
}

// ============================================
// MIDNIGHT REFRESH
// ============================================
function scheduleMidnightRefresh() {
    const now = getLocalNow();
    const tomorrow = now
        .plus({ days: 1 })
        .set({ hour: 0, minute: 0, second: 5 });
    setTimeout(() => {
        fetchAllData();
        scheduleMidnightRefresh();
    }, tomorrow.diff(now).toMillis());
}

// ============================================
// EVENT HANDLERS
// ============================================
function toggleLanguage() {
    state.lang = state.lang === "en" ? "bn" : "en";
    localStorage.setItem("praybd-lang", state.lang);
    updateLanguageUI();
}

function toggleTheme() {
    state.theme = state.theme === "dark" ? "light" : "dark";
    localStorage.setItem("praybd-theme", state.theme);
    document.documentElement.classList.toggle("light");
}

function updateLanguageUI() {
    const t = translations[state.lang];
    document.getElementById("prayerTimesTitle").textContent =
        t.prayerTimes;
    document.getElementById("footerText").textContent = t.footer;
    document.getElementById("apiCredit").textContent = t.apiCredit;
    renderPrayerCards();
    updateDates();
    updateCountdown();
    updateLocationDisplay();
    updateIpDisplay();
}

function showError(message) {
    elements.errorMessage.textContent = message;
    elements.errorSection.classList.remove("hidden");
}

function hideError() {
    elements.errorSection.classList.add("hidden");
}

// Start
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}
