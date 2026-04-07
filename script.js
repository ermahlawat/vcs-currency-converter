const state = {
    rates: { "INR": 83.45, "EUR": 0.92, "GBP": 0.79, "JPY": 151.6, "USD": 1.0 },
    lastUpdate: null,
    currencies: {
        "USD": "USD", "EUR": "EUR", "GBP": "GBP", "INR": "INR", "AUD": "AUD", "CAD": "CAD", "JPY": "JPY", "CNY": "CNY"
    }
};

const amountInput = document.getElementById('amount');
const fromSelect = document.getElementById('from-currency');
const toSelect = document.getElementById('to-currency');
const resValue = document.getElementById('res-value');
const wordValue = document.getElementById('word-value');
const rateText = document.getElementById('rate-text');
const lastUpdateText = document.getElementById('last-updated');
const themeCheckbox = document.getElementById('theme-checkbox');

window.addEventListener('DOMContentLoaded', () => {
    initTheme();
    populateCurrencies();
    fetchRates();
    
    amountInput.addEventListener('input', convert);
    fromSelect.addEventListener('change', fetchRates);
    toSelect.addEventListener('change', convert);
    document.getElementById('swap-btn').addEventListener('click', swapCurrencies);
    document.getElementById('copy-words').addEventListener('click', copyToClipboard);
    themeCheckbox.addEventListener('change', toggleTheme);
});

async function fetchRates() {
    const base = fromSelect.value;
    try {
        const response = await fetch(`https://api.frankfurter.app/latest?from=${base}`);
        if (!response.ok) throw new Error();
        const data = await response.json();
        
        state.rates = data.rates;
        state.rates[base] = 1.0; // Force base to be 1.0
        state.lastUpdate = new Date().toLocaleTimeString();
        
        localStorage.setItem(`rates_${base}`, JSON.stringify(state.rates));
        convert();
    } catch (err) {
        const cached = localStorage.getItem(`rates_${base}`);
        if (cached) state.rates = JSON.parse(cached);
        convert();
    }
}

function convert() {
    const amount = parseFloat(amountInput.value);
    const from = fromSelect.value;
    const to = toSelect.value;

    if (isNaN(amount) || amount <= 0) {
        resValue.innerText = '0.00';
        wordValue.innerText = 'Zero units only';
        return;
    }

    // Fixed logic: result = input * (rate of 'to' currency relative to 'from')
    const rate = state.rates[to];
    const result = amount * rate;

    resValue.innerText = new Intl.NumberFormat('en-IN', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2
    }).format(result);
    
    wordValue.innerText = numberToWordsIndian(result, to);
    rateText.innerText = `1 ${from} = ${rate.toFixed(4)} ${to}`;
    lastUpdateText.innerText = `Refreshed at: ${state.lastUpdate || 'Cache'}`;
}

function populateCurrencies() {
    const options = Object.entries(state.currencies)
        .map(([code]) => `<option value="${code}">${code}</option>`)
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
    themeCheckbox.checked = s === 'dark';
}

function toggleTheme() {
    const t = themeCheckbox.checked ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('theme', t);
}