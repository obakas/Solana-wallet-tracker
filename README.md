This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# 🪐 Solana Wallet Inspector

A full-stack developer tool to analyze Solana wallet activity, track SPL token balances, detect memecoins, visualize transaction patterns, and export audit-ready reports — all in a sleek modern UI built with Next.js, TailwindCSS, RainbowKit, and Recharts.

---

## ✨ Features

- 🔍 **Scan Wallet** – Fetch native SOL + SPL token balances.
- 🐸 **Detect Memecoins** – Identify tokens matching memecoin keyword signatures.
- 📜 **View Transactions** – Decode and summarize on-chain transaction instructions.
- 📊 **Visual Analytics** – Toggle between pie or bar charts of token and transaction data.
- 🧾 **Export Reports** – One-click download to **CSV** or **PDF** for audit or offline review.
- ⚛️ **Modern Stack** – Built with React 19, Next.js 15, Tailwind CSS, RainbowKit, Wagmi, Recharts.

---

## 🧰 Stack

| Tech             | Purpose                              |
|------------------|--------------------------------------|
| **Next.js 15**   | Full-stack React framework           |
| **Tailwind CSS** | Styling and UI layout                |
| **Solana Web3.js** | Blockchain interaction              |
| **Recharts**     | Chart rendering (Pie & Bar)          |
| **RainbowKit**   | WalletConnect UI integration         |
| **jsPDF**        | PDF export                           |
| **Blob/CSV**     | CSV export                           |

---

## 🚀 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/solana-wallet-inspector.git
cd solana-wallet-inspector
2. Install dependencies
bash
Copy code
npm install
3. Set up your .env.local
Create a .env.local in the root and add your Solana RPC endpoint:

env
Copy code
NEXT_PUBLIC_SOLANA_RPC=https://your-rpc-url-here/
💡 Use QuickNode, Ankr, or Helius for reliable RPC access.

4. Start the dev server
bash
Copy code
npm run dev
Then visit: http://localhost:3000

🧠 How It Works
📁 /lib/solanaFunctions.ts
getTokenBalances(address) — fetches native SOL + all SPL tokens owned.

detectMemecoins(address) — matches token names/symbols against meme keywords.

getTransactions(address, numTx) — retrieves and parses transaction instructions.

🌐 /api/* endpoints
Built with Next.js API routes.

/api/token-balances, /api/transactions, /api/detect-memecoins

💻 Frontend Components
SolanaToolUI – Main container with tabbed navigation and output views.

TokenChart, BarChart, TokenTable – Render charts and token lists.

Uses react-hot-toast, jsPDF, and native clipboard/CSV logic.

📸 Screenshots
(optional) Add screenshots or Loom video here to showcase features.

📦 Export Formats
Format	Description
CSV	Wallet balance + transaction log
PDF	Human-readable offline reports

🛡️ Disclaimer
This tool is for educational and analytical purposes only.
It does not store user data or perform any on-chain transactions.

Use with caution and verify all wallet addresses before scanning.

🙌 Credits
Built with love by Obaka
Crafted to help devs, auditors, and analysts explore the Solana blockchain smarter.

🧩 Roadmap
 NFT Metadata parsing

 Chart time filters (last 7 days, 30 days, etc)

 Connect wallet + interactive on-chain actions

 Live memecoin price feed integration

 Dark/light theme toggle

📄 License
MIT License © 2025 Obaka

yaml
Copy code

---

### ✅ What You Should Update

- Replace `https://github.com/obakas/Solana-wallet-tracker` with your real GitHub repo link
- Add your screenshots or a Loom walkthrough
- Consider turning parts of this into GitHub Pages documentation

---

Want a **project thumbnail image**, **demo video script**, or a **GitHub project description** next? Just say the word — let’s make your portfolio pop 💥







Ask ChatGPT
