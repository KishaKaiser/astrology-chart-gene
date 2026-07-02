# ✨ Astrology Chart Generator

A Vite + TypeScript + React astrology chart application built on the [GitHub Spark](https://githubnext.com/projects/spark) platform.

---

## 🚀 Quick Start (one command)

After cloning the repository, run:

```bash
npm run setup
```

This single command will:

1. **Check** your Node.js and npm versions (Node.js 18+ required).
2. **Install** all npm dependencies (`npm install`).
3. **Create** a `.env` file from `.env.example` if one doesn't already exist.
4. **Pre-bundle** dependencies with Vite for a faster first launch.

Once setup completes, start the development server:

```bash
npm run dev
```

Then open **http://localhost:5173** in your browser.

---

## 🗄️ Data Layer

This app uses **GitHub Spark's cloud KV store** for data persistence (`useKV` from `@github/spark/hooks`). The KV store is:

- **Automatically provisioned** when deployed on GitHub Spark — no manual database setup required.
- **Mocked in-memory** when running locally via `npm run dev`, so all features work without any database server.

> **Limitation:** Data saved locally is not persisted between dev-server restarts. Persistent storage is only available when the app is deployed to GitHub Spark.

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run setup` | One-command install & setup (run this first) |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Run ESLint |
| `npm run optimize` | Pre-bundle dependencies with Vite |
| `npm run preview` | Preview the production build locally |
| `npm run kill` | Kill any process using port 5000 |

---

## 🧩 What's Inside?

- A full-featured astrology chart generator
- GitHub Spark KV store for cloud persistence
- Vite + React + TypeScript frontend
- Tailwind CSS + Radix UI component library
- D3 for chart visualization
- Swiss Ephemeris calculations (built-in, no external service needed)

---

## 📄 License

The Spark Template files and resources from GitHub are licensed under the terms of the MIT license, Copyright GitHub, Inc.
