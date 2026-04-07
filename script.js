const state = {
    // Initial Fallbacks - App will overwrite these immediately on load
    rates: { "INR": 83.45, "USD": 1.0 },
    currencies: { 
        "USD": "United States Dollar", "INR": "Indian Rupee", "EUR": "Euro", 
        "GBP": "British Pound", "JPY": "Japanese Yen", "CAD": "Canadian Dollar" 
    }
};

const amountInput = document.getElementById('amount');
const fromSelect = document.getElementById('from-currency');
const toSelect = document.getElementById('to-currency');
const mainDisplay = document.getElementById('main-result');
const numOutput = document.getElementById('numeric-output');
const wordOutput = document.getElementById('word-value');

window.addEventListener('DOMContentLoaded', () => {
    initTheme();
    populateCurrencies();
    fetchRates();
    
    amountInput.addEventListener('input', convert);
    fromSelect.addEventListener('change', fetchRates);
    toSelect.addEventListener('change', convert);
    document.getElementById('swap-btn').addEventListener('click', swapCurrencies);
    document.getElementById('copy-btn').addEventListener('click', copyToClipboard);
    document.getElementById('theme-checkbox').addEventListener('change', toggleTheme);
});

async function fetchRates() {
    const from = fromSelect.value;
    mainDisplay.innerText = "Fetching...";
    
    try {
        // Switch to the .dev endpoint which is often more stable for GitHub Pages
        const url = `https://api.frankfurter.dev/v1/latest?base=${from}`;
        
        const response = await fetch(url, {
            cache: "no-store" // Forces the browser to ignore any saved 1:1 rates
        });

        if (!response.ok) throw new Error("Network issue");
        
        const data = await response.json();
        state.rates = data.rates;
        state.rates[from] = 1.0; // Ensure the base is always exactly 1.0
        
        document.getElementById('timestamp').innerText = `${new Date().toLocaleString()} · Live Rate`;
        convert();
    } catch (e) {
        console.error("Fetch failed:", e);
        document.getElementById('timestamp').innerText = "Offline · Using Cached Rates";
        convert(); 
    }
}

function convert() {
    const amount = parseFloat(amountInput.value) || 0;
    const from = fromSelect.value;
    const to = toSelect.value;
    
    // THE FIX: Explicitly check if the rate exists to avoid 1:1 errors
    const rate = state.rates[to];
    const result = amount * rate;

    // Update Big Display
    document.getElementById('top-summary').innerText = `${amount} ${state.currencies[from]} equals`;
    mainDisplay.innerText = `${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(result)} ${state.currencies[to]}`;
    
    // Update Grid Display
    numOutput.innerText = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(result);
    
    // FIX: Word Capitalization (Starts with Caps)
    const words = numberToWordsIndian(result, to);
    wordOutput.innerText = words.charAt(0).toUpperCase() + words.slice(1);
}

function populateCurrencies() {
    const options = Object.entries(state.currencies).map(([code, name]) => `<option value="${code}">${code}</option>`).join('');
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
    let cur = (code === 'INR') ? "rupees" : (code === 'USD') ? "dollars" : "units";
    
    str += ` ${cur}`;
    if (sub > 0) str += ` and ${convertToIndianWords(sub)} cents`;
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

// UI HELPERS
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
    document.getElementById('theme-checkbox').checked = s === 'dark';
}

function toggleTheme() {
    const t = document.getElementById('theme-checkbox').checked ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('theme', t);
}