const state = {
    rates: { "INR": 83.45, "USD": 1.0 },
    currencies: { 
        "USD": "US Dollar", "INR": "Indian Rupee", "EUR": "Euro", 
        "GBP": "British Pound", "JPY": "Japanese Yen", "CAD": "Canadian Dollar" 
    }
};

const amountInput = document.getElementById('amount');
const fromSelect = document.getElementById('from-currency');
const toSelect = document.getElementById('to-currency');
const mainDisplay = document.getElementById('main-result-display');
const numOutput = document.getElementById('numeric-output');
const wordOutput = document.getElementById('word-value');
const themeCheckbox = document.getElementById('theme-checkbox');

window.addEventListener('DOMContentLoaded', () => {
    initTheme();
    populateCurrencies();
    fetchRates();
    
    amountInput.addEventListener('input', convert);
    fromSelect.addEventListener('change', fetchRates);
    toSelect.addEventListener('change', convert);
    document.getElementById('swap-btn').addEventListener('click', swapCurrencies);
    document.getElementById('copy-btn').addEventListener('click', copyToClipboard);
    themeCheckbox.addEventListener('change', toggleTheme);
});

async function fetchRates() {
    const from = fromSelect.value.toUpperCase();
    try {
        const response = await fetch(`https://open.er-api.com/v6/latest/${from}`);
        const data = await response.json();
        state.rates = data.rates;
        document.getElementById('timestamp').innerText = `${new Date().toLocaleTimeString()} · Live Market`;
        convert();
    } catch (e) {
        convert();
    }
}

function convert() {
    const amount = parseFloat(amountInput.value) || 0;
    const from = fromSelect.value;
    const to = toSelect.value;
    const rate = state.rates[to] || 1;
    const result = amount * rate;

    document.getElementById('top-rate-summary').innerText = `${amount.toLocaleString('en-IN')} ${state.currencies[from]} equals`;
    mainDisplay.innerText = `${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(result)} ${state.currencies[to]}`;
    numOutput.innerText = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(result);
    
    const words = numberToWordsIndian(result, to);
    wordOutput.innerText = words.charAt(0).toUpperCase() + words.slice(1);
}

function populateCurrencies() {
    const options = Object.entries(state.currencies).map(([code]) => `<option value="${code}">${code}</option>`).join('');
    fromSelect.innerHTML = options;
    toSelect.innerHTML = options;
    fromSelect.value = 'USD';
    toSelect.value = 'INR';
}

function numberToWordsIndian(n, code) {
    const amount = n.toFixed(2).split(".");
    const main = parseInt(amount[0]);
    const sub = parseInt(amount[1]);
    
    let str = (main === 0) ? "zero" : convertToIndianWords(main);
    
    // FIX: Currency specific sub-units
    let cur = "units", subCur = "cents";
    if (code === 'INR') { cur = "rupees"; subCur = "paise"; }
    else if (code === 'USD') { cur = "dollars"; subCur = "cents"; }
    else if (code === 'GBP') { cur = "pounds"; subCur = "pence"; }
    else if (code === 'EUR') { cur = "euros"; subCur = "cents"; }

    str += ` ${cur}`;
    if (sub > 0) str += ` and ${convertToIndianWords(sub)} ${subCur}`;
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
    navigator.clipboard.writeText(wordOutput.innerText);
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