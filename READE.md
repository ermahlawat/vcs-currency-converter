# GlobalConvert

A high-performance, mobile-first Currency Converter with unique Word-Based output in the Indian Numbering System (Lakhs/Crores).

## 🚀 Quick Start
1. Clone this repository or download the files.
2. Open `index.html` in any modern web browser.
3. No installation or `npm install` required.

## 🌐 GitHub Pages Deployment
1. Create a new repository on GitHub.
2. Push `index.html`, `style.css`, and `script.js` to the `main` branch.
3. Go to **Settings > Pages**.
4. Select **Branch: main** and click **Save**.
5. Your app is live at `https://<username>.github.io/<repo-name>/`.

## 🛠 Features
- **Live Rates:** Powered by the Frankfurter API (European Central Bank data).
- **Offline First:** Once rates are fetched, they are cached in `localStorage`. The app works perfectly without an internet connection using the last known rates.
- **Indian Numbering Logic:** Converts amounts into words (e.g., "One Lakh" instead of "One Hundred Thousand") automatically.
- **Glassmorphism UI:** Modern, clean design with full dark mode support.
- **Copy to Clipboard:** One-tap copying of the word-based output for invoices or professional use.

## 🔌 API & Reliability
The app uses `https://api.frankfurter.app`. 
- **No API Key required.**
- **No usage limits** for standard web traffic.
- If the API is unreachable, a red "Offline Mode" badge appears, and the app seamlessly switches to local data.

## 📝 Word Conversion Logic
The JavaScript logic implements the recursive Indian numbering scales:
- 1,000 = Thousand
- 1,00,000 = Lakh
- 1,00,00,000 = Crore
It handles decimals up to 2 places (Paise/Cents).