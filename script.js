/**
 * GlobalConvert - Production Core
 * Logic: Frankfurter API integration, LocalStorage caching, 
 * Indian Numbering Word Converter, and Offline handling.
 */

const state = {
    rates: {},
    base: 'USD',
    lastUpdate: null,
    currencies: {
        "USD": "US Dollar", "EUR": "Euro", "GBP": "British Pound",
        "INR": "Indian Rupee", "AUD": "Australian Dollar", "CAD": "Canadian Dollar",
        "SGD": "Singapore Dollar", "JPY": "Japanese Yen", "CNY": "Chinese Yuan",
        "BRL": "Brazilian Real", "MXN": "Mexican Peso", "ZAR": "South African Rand"
    },
    favs: ['USD/INR', 'EUR/USD', 'GBP/INR', 'USD/JPY']
};

// UI Elements
const amountInput = document.getElementById('amount');
const fromSelect = document.getElementById('from-currency');
const toSelect = document.getElementById('to-currency');
const resValue = document.getElementById('res-value');
const resSymbol = document.getElementById('res-symbol');
const wordValue = document.getElementById('word-value');
const rateText = document.getElementById('rate-text');
const lastUpdateText = document.getElementById('last-updated');
const offlineBadge = document.getElementById('offline-badge');

// --- Initialization ---

window.addEventListener('DOMContentLoaded', () => {
    initTheme();
    populateCurrencies();
    loadCachedData();
    fetchRates();
    renderFavs();
    
    // Listeners
    amountInput.addEventListener('input', convert);
    fromSelect.addEventListener('change', () => { fetchRates(); });
    toSelect.addEventListener('change', convert);
    document.getElementById('swap-btn').addEventListener('click', swapCurrencies);
    document.getElementById('copy-words').addEventListener('click', copyToClipboard);
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
});

function populateCurrencies() {
    const options = Object.entries(state.currencies)
        .map(([code, name]) => `<option value="${code}">${code} - ${name}</option>`)
        .join('');
    fromSelect.innerHTML = options;
    toSelect.innerHTML = options;
    
    fromSelect.value = 'USD';
    toSelect.value = 'INR';
}

// --- API & Data Handling ---

async function fetchRates() {
    const base = fromSelect.value;
    try {
        const response = await fetch(`https://api.frankfurter.app/latest?from=${base}`);
        if (!response.ok) throw new Error('Network error');
        
        const data = await response.json();
        state.rates = data.rates;
        state.lastUpdate = new Date().toLocaleString();
        
        // Cache data
        localStorage.setItem(`rates_${base}`, JSON.stringify(state.rates));
        localStorage.setItem('last_update', state.lastUpdate);
        
        offlineBadge.classList.add('hidden');
        convert();
    } catch (err) {
        console.warn("Using cached rates due to connection issue.");
        offlineBadge.classList.remove('hidden');
        loadCachedData(base);
        convert();
    }
}

function loadCachedData(base = fromSelect.value) {
    const cached = localStorage.getItem(`rates_${base}`);
    const update = localStorage.getItem('last_update');
    if (cached) {
        state.rates = JSON.parse(cached);
        state.lastUpdate = update;
    }
}

// --- Conversion Logic ---

function convert() {
    const amount = parseFloat(amountInput.value);
    const to = toSelect.value;
    const from = fromSelect.value;

    if (isNaN(amount) || amount <= 0) {
        resValue.innerText = '0.00';
        wordValue.innerText = 'Zero units only';
        rateText.innerText = `1 ${from} = ...`;
        return;
    }

    let result;
    if (from === to) {
        result = amount;
    } else {
        const rate = state.rates[to];
        result = amount * rate;
    }

    // Display Numeric
    const formattedNum = new Intl.NumberFormat('en-IN', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2
    }).format(result);

    resValue.innerText = formattedNum;
    
    // Display Words
    wordValue.innerText = numberToWordsIndian(result, to);

    // Update Meta Info
    if (state.rates[to]) {
        rateText.innerText = `1 ${from} = ${state.rates[to].toFixed(4)} ${to}`;
    }
    lastUpdateText.innerText = `Last updated: ${state.lastUpdate || 'Offline'}`;
}

function swapCurrencies() {
    const temp = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = temp;
    fetchRates();
}

// --- The Differentiator: Indian Numbering System Logic ---

function numberToWordsIndian(n, currencyCode) {
    const amount = n.toFixed(2).split(".");
    const mainNum = parseInt(amount[0]);
    const paisaNum = parseInt(amount[1]);

    let str = "";

    if (mainNum === 0) {
        str = "Zero";
    } else {
        str = convertToIndianWords(mainNum);
    }

    let currencyLabel = "rupees";
    let subLabel = "paise";

    // Basic localization for major non-INR currencies in word output
    if (currencyCode === 'USD') { currencyLabel = "dollars"; subLabel = "cents"; }
    else if (currencyCode === 'EUR') { currencyLabel = "euros"; subLabel = "cents"; }
    else if (currencyCode === 'GBP') { currencyLabel = "pounds"; subLabel = "pence"; }

    str += ` ${currencyLabel}`;

    if (paisaNum > 0) {
        str += ` and ${convertToIndianWords(paisaNum)} ${subLabel}`;
    }

    return str + " only";
}

function convertToIndianWords(num) {
    const ones = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
    const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

    if (num < 20) return ones[num];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? " " + ones[num % 10] : "");
    
    if (num < 1000) {
        return ones[Math.floor(num / 100)] + " hundred" + (num % 100 !== 0 ? " and " + convertToIndianWords(num % 100) : "");
    }
    
    // Indian System: Thousand (1,000), Lakh (1,00,000), Crore (1,00,00,000)
    if (num < 100000) {
        return convertToIndianWords(Math.floor(num / 1000)) + " thousand" + (num % 1000 !== 0 ? " " + convertToIndianWords(num % 1000) : "");
    }
    if (num < 10000000) {
        return convertToIndianWords(Math.floor(num / 100000)) + " lakh" + (num % 100000 !== 0 ? " " + convertToIndianWords(num % 100000) : "");
    }
    return convertToIndianWords(Math.floor(num / 10000000)) + " crore" + (num % 10000000 !== 0 ? " " + convertToIndianWords(num % 10000000) : "");
}

// --- UI Helpers ---

function renderFavs() {
    const container = document.getElementById('favorites-list');
    container.innerHTML = state.favs.map(pair => {
        return `<div class="chip" onclick="applyPair('${pair}')">${pair}</div>`;
    }).join('');
}

window.applyPair = (pair) => {
    const [from, to] = pair.split('/');
    fromSelect.value = from;
    toSelect.value = to;
    fetchRates();
};

function copyToClipboard() {
    const text = wordValue.innerText;
    navigator.clipboard.writeText(text);
    const toast = document.getElementById('toast');
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}

function initTheme() {
    const saved = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const target = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', target);
    localStorage.setItem('theme', target);
}