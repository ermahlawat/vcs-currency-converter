const state = {
    // FIXED: Starter rates ensure the app NEVER shows NaN on first load
    rates: { "INR": 83.50, "EUR": 0.92, "GBP": 0.79, "JPY": 151.0, "USD": 1.0 },
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

const amountInput = document.getElementById('amount');
const fromSelect = document.getElementById('from-currency');
const toSelect = document.getElementById('to-currency');
const resValue = document.getElementById('res-value');
const wordValue = document.getElementById('word-value');
const rateText = document.getElementById('rate-text');
const lastUpdateText = document.getElementById('last-updated');
const offlineBadge = document.getElementById('offline-badge');

window.addEventListener('DOMContentLoaded', () => {
    initTheme();
    populateCurrencies();
    fetchRates();
    renderFavs();
    
    amountInput.addEventListener('input', convert);
    fromSelect.addEventListener('change', fetchRates);
    toSelect.addEventListener('change', convert);
    document.getElementById('swap-btn').addEventListener('click', swapCurrencies);
    document.getElementById('copy-words').addEventListener('click', copyToClipboard);
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
});

async function fetchRates() {
    const base = fromSelect.value;
    try {
        const response = await fetch(`https://api.frankfurter.app/latest?from=${base}&nocache=${Date.now()}`);
        if (!response.ok) throw new Error();
        
        const data = await response.json();
        state.rates = data.rates;
        state.lastUpdate = new Date().toLocaleTimeString();
        
        offlineBadge.classList.add('hidden');
        localStorage.setItem(`rates_${base}`, JSON.stringify(state.rates));
        convert();
    } catch (err) {
        offlineBadge.classList.remove('hidden');
        const cached = localStorage.getItem(`rates_${base}`);
        if (cached) {
            state.rates = JSON.parse(cached);
        }
        convert();
    }
}

function convert() {
    const amount = parseFloat(amountInput.value);
    const to = toSelect.value;
    const from = fromSelect.value;

    // Safety: prevent NaN if data isn't loaded yet
    if (isNaN(amount) || amount <= 0) {
        resValue.innerText = '0.00';
        wordValue.innerText = 'Zero units only';
        return;
    }

    let result = (from === to) ? amount : amount * (state.rates[to] || 1);

    resValue.innerText = (from === 'INR' || to === 'INR') ? 
        new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2 }).format(result) :
        new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(result);
    
    wordValue.innerText = numberToWordsIndian(result, to);
    if (state.rates[to]) rateText.innerText = `1 ${from} = ${state.rates[to].toFixed(4)} ${to}`;
    lastUpdateText.innerText = `Last updated: ${state.lastUpdate || 'Initial Load'}`;
}

function populateCurrencies() {
    const options = Object.entries(state.currencies)
        .map(([code, name]) => `<option value="${code}">${code} - ${name}</option>`)
        .join('');
    fromSelect.innerHTML = options;
    toSelect.innerHTML = options;
    fromSelect.value = 'USD';
    toSelect.value = 'INR';
}

function numberToWordsIndian(n, code) {
    const amount = n.toFixed(2).split(".");
    const main = parseInt(amount[0]);
    const sub = parseInt(amount[1]);
    let str = (main === 0) ? "Zero" : convertToIndianWords(main);
    
    let cur = "rupees", sCur = "paise";
    if (code === 'USD') { cur = "dollars"; sCur = "cents"; }
    else if (code === 'EUR') { cur = "euros"; sCur = "cents"; }
    else if (code === 'GBP') { cur = "pounds"; sCur = "pence"; }

    str += ` ${cur}`;
    if (sub > 0) str += ` and ${convertToIndianWords(sub)} ${sCur}`;
    return str + " only";
}

function convertToIndianWords(num) {
    const ones = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
    const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
    if (num < 20) return ones[num];
    if (num < 100) return tens[Math.floor(num/10)] + (num%10 !== 0 ? " " + ones[num%10] : "");
    if (num < 1000) return ones[Math.floor(num/100)] + " hundred" + (num%100 !== 0 ? " and " + convertToIndianWords(num%100) : "");
    if (num < 100000) return convertToIndianWords(Math.floor(num/1000)) + " thousand" + (num%1000 !== 0 ? " " + convertToIndianWords(num%1000) : "");
    if (num < 10000000) return convertToIndianWords(Math.floor(num/100000)) + " lakh" + (num%100000 !== 0 ? " " + convertToIndianWords(num%100000) : "");
    return convertToIndianWords(Math.floor(num/10000000)) + " crore" + (num%10000000 !== 0 ? " " + convertToIndianWords(num%10000000) : "");
}

function swapCurrencies() {
    const t = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = t;
    fetchRates();
}

function copyToClipboard() {
    navigator.clipboard.writeText(wordValue.innerText);
    const t = document.getElementById('toast');
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2000);
}

function initTheme() {
    const s = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', s);
}

function toggleTheme() {
    const c = document.documentElement.getAttribute('data-theme');
    const t = c === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('theme', t);
}

function renderFavs() {
    document.getElementById('favorites-list').innerHTML = state.favs.map(p => `<div class="chip" onclick="applyPair('${p}')">${p}</div>`).join('');
}

window.applyPair = (p) => {
    const [f, t] = p.split('/');
    fromSelect.value = f;
    toSelect.value = t;
    fetchRates();
};