# KoriKosmos.dev

The personal website and digital garden of **Maan, aka KoriKosmos**, built with the modern web stack. This repository hosts my portfolio, blog, interactive games, and a dynamic "Tunes" page that tracks my listening habits.

![Astro](https://img.shields.io/badge/Astro-5.11-orange?style=flat-square&logo=astro)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1-38bdf8?style=flat-square&logo=tailwind-css)
![DaisyUI](https://img.shields.io/badge/DaisyUI-5.5-5a0ef8?style=flat-square&logo=daisyui)
![Docker](https://img.shields.io/badge/Docker-Enabled-2496ed?style=flat-square&logo=docker)

## 🚀 Tech Stack

-   **Framework:** [Astro 5](https://astro.build) (SSR mode with Node.js adapter)
-   **Styling:** [Tailwind CSS 4](https://tailwindcss.com) + [DaisyUI 5](https://daisyui.com)
-   **CMS:** [Decap CMS](https://decapcms.org) (Git-based content management)
-   **Deployment:** Docker (Multi-stage build, Alpine Node.js)
-   **State Management:** Nano Stores (for cross-component state like themes)

## ✨ Features

-   **Dynamic Theming**: Switch between **Light**, **Dark**, **Forest** and **Batman** themes (persisted via local storage).
-   **Tunes Page**: Real-time integration with Last.fm using a secure server-side proxy to hide API keys.
-   **Interactive Games**:
    -   **Tetris**: A full-featured clone with SRS rotation, hold mechanic, touch controls for mobile, and global leaderboards.
    -   **Rock Paper Scissors**: Simple game with persisted scores.
-   **Oneko Cat**: A toggleable retro cat that chases your cursor across the screen.
-   **Blog & Portfolio**: Content managed via Markdown and Decap CMS.
-   **CV**: Data-driven curriculum vitae generated from JSON.

## 🛠️ Getting Started

### Prerequisites

-   **Node.js** (v20+ recommended)
-   **npm**

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/korikosmos/korikosmos.dev.git
    cd korikosmos.dev
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Configure environment variables:
     Copy `.env.example` to `.env` and add your keys (required for Last.fm features):
    ```bash
    cp .env.example .env
    ```
    *Note: `LASTFM_API_KEY` and `LASTFM_USER` are required for the Tunes page to work.*

### Development

Start the development server:

```bash
npm run dev
```

Visit `http://localhost:4321` to see the site.

### Production Build

Build the static assets and server code:

```bash
npm run build
```

Preview the build locally:

```bash
npm run preview
```

## 🐳 Docker Deployment

You can build and run the entire application as a Docker container.

```bash
docker compose up --build
```

The site will be available at `http://localhost:8484`.

**Update Script**:
The included `./update-deploy.sh` script pulls the latest changes from Git, rebuilds the container, and restarts it—useful for simple VPS deployments.

## 📂 Project Structure

```
src/
├── components/    # Reusable Astro components (UI, Cards, Games)
├── content/       # Content Collections (Blog, Projects)
├── data/          # Static data (CV, initial game scores)
├── layouts/       # Page layouts (Head, Footer, Navbar)
├── lib/           # Game engines (Tetris) & shared utilities
├── pages/         # File-based routing & API endpoints
│   ├── api/       # Server-side API routes (Last.fm, Leaderboards)
│   ├── games/     # Game pages
│   └── ...        # Top-level pages (index, about, tunes)
├── styles/        # Global CSS & Tailwind configuration
└── config.ts      # Site-wide constants & navigation
```

## 📝 Documentation

For detailed development guidelines, architectural decisions, and style guides, please refer to [AGENTS.md](./AGENTS.md). This file serves as the primary extensive documentation for AI agents and developers alike.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
