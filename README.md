<!-- Documentation-only file: optional support for setup and usage. -->
# FinLedger — Finance Management App

A clean, professional finance tracker built with HTML, CSS, JavaScript + Supabase.

---

## 📁 File Structure

```
finledger/
├── index.html          ← Overview / Dashboard page
├── transactions.html   ← Full CRUD Transactions page
├── css/
│   └── style.css       ← All styling (Cazura-inspired theme)
├── js/
│   ├── config.js       ← ⚠️ PUT YOUR SUPABASE KEYS HERE
│   └── transactions.js ← All CRUD logic
└── README.md
```

---

## ⚙️ Step 1 — Create Supabase Table

Go to your Supabase dashboard → SQL Editor → Run this:

```sql
CREATE TABLE finance (
  id                BIGSERIAL PRIMARY KEY,
  category          TEXT NOT NULL,
  date              DATE NOT NULL,
  time              TIME,
  amount            NUMERIC(12,2) NOT NULL,
  method            TEXT,
  type              TEXT CHECK (type IN ('income','expense')) NOT NULL,
  customer_supplier TEXT,
  product           TEXT,
  quantity          INTEGER,
  invoice_no        TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔑 Step 2 — Add Your Supabase Keys

Open `js/config.js` and replace:

```js
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE';
```

Find these at: Supabase Dashboard → Project Settings → API

---

## 🔓 Step 3 — Enable Public Access (RLS)

In Supabase SQL Editor:

```sql
-- Allow all operations (no login required)
ALTER TABLE finance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON finance
  FOR ALL USING (true) WITH CHECK (true);
```

---

## 🚀 Step 4 — Deploy to GitHub Pages

1. Push all files to a GitHub repo
2. Go to repo → Settings → Pages
3. Set source: `main` branch, `/ (root)`
4. Your app is live at: `https://yourusername.github.io/finledger/`

---

## ✅ Features

| Feature | Status |
|---------|--------|
| Create transaction | ✅ Modal popup |
| Read all transactions | ✅ Table with pagination |
| Update transaction | ✅ Edit modal |
| Delete transaction | ✅ Confirm modal |
| Live search | ✅ Filters as you type |
| Summary cards (from DB) | ✅ Real-time totals |
| Export CSV | ✅ One click |
| Overview dashboard | ✅ Recent transactions |

---

## 🎨 Theme

- **Font:** Inter (Google Fonts)
- **Primary:** Teal `#0D7377`
- **Sidebar:** Dark `#1a1f2e`
- **Income:** Green `#059669`
- **Expense:** Red `#dc2626`
