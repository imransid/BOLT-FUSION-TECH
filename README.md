# BOLT FUSION TECH — Software Agency Website

A modern, high-performance website for a full-stack software agency. Showcases services (mobile apps, backends, AI, robotics, ERP & SaaS), team, skills, client logos, testimonials, and meeting booking — built with Next.js 14, React 18, Three.js, and Tailwind CSS.

[![Live Demo](https://img.shields.io/badge/demo-software--agency--website.vercel.app-blue?style=flat)](https://software-agency-website.vercel.app/)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Scripts](#scripts)
- [Project Structure](#project-structure)
- [Deployment](#deployment)
- [License](#license)

---

## Features

- **3D landing** — Hero section with a Three.js (React Three Fiber) scene for a distinctive first impression
- **Responsive layout** — Optimized for desktop, tablet, and mobile with safe-area and viewport handling
- **Sticky navigation** — Always-visible nav with smooth scroll-to-section
- **Sections** — Landing, About Team, Skills, Clients (logo slider), Testimonials (carousel), Book Meeting, Contact
- **Carousels** — Embla Carousel for testimonials and client logos with autoplay and custom styling
- **Analytics** — Vercel Analytics for performance and usage insights
- **Code quality** — TypeScript, ESLint, Prettier, and Husky for consistent style and checks

---

## Tech Stack

| Category      | Technology |
|---------------|------------|
| Framework     | [Next.js 14](https://nextjs.org/) (App Router) |
| UI            | [React 18](https://react.dev/) |
| Styling       | [Tailwind CSS](https://tailwindcss.com/) |
| 3D            | [Three.js](https://threejs.org/), [React Three Fiber](https://docs.pmnd.rs/react-three-fiber), [@react-three/drei](https://github.com/pmndrs/drei) |
| Carousel      | [Embla Carousel](https://www.embla-carousel.com/) (React, autoplay, class-names) |
| Language      | [TypeScript](https://www.typescriptlang.org/) |
| Analytics     | [Vercel Analytics](https://vercel.com/docs/concepts/analytics) |
| Tooling       | ESLint, Prettier, Husky |

---

## Prerequisites

- **Node.js** 18.x or later
- **Yarn** (or npm / pnpm)

---

## Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Danielkhakbaz/Software-Agency-Website.git
   cd Software-Agency-Website
   ```

2. **Install dependencies**

   ```bash
   yarn
   ```

3. **Start the development server**

   ```bash
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Scripts

| Command        | Description |
|----------------|-------------|
| `yarn dev`     | Run the app in development mode with hot reload |
| `yarn build`   | Build for production |
| `yarn start`   | Start the production server (run after `yarn build`) |
| `yarn lint`    | Run ESLint |
| `yarn fix`     | Run ESLint with auto-fix and Prettier format |
| `yarn upgrade` | Interactive dependency upgrades (`upgrade-interactive`) |
| `yarn knip`    | Run [Knip](https://github.com/webpro/knip) for dead code / unused exports |
| `yarn analyze` | Build with bundle analyzer (`ANALYZE=true yarn build`) |

Husky runs on `git commit` (configured via `prepare` in `package.json`).

---

## Project Structure

```text
Software-Agency-Website/
├── app/                    # Next.js App Router (layout, page, not-found)
├── components/             # Section & feature components
│   ├── app/                # Page sections (landing, about-team, skills, clients, etc.)
│   └── layout/             # Sticky nav and shared layout components
├── constants/              # App constants (e.g. testimonials)
├── hooks/                  # Custom hooks (e.g. useAnimationFrame)
├── layout/                 # Global layout (e.g. footer)
├── providers/              # React context providers (scroll, width-size, carousel)
├── public/                 # Static assets (images, favicon)
├── styles/                 # Global and module CSS
├── theme/                  # Fonts and theme (e.g. Inter, Syne)
├── utils/                  # Utilities (e.g. Compose for providers)
├── .eslintrc.json
├── .prettierrc
├── next.config.js
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## Deployment

The project is set up for [Vercel](https://vercel.com/):

- Connect your Git repo to Vercel and deploy; default build command is `next build`, output directory is the default for Next.js.
- Optional: add [Vercel Analytics](https://vercel.com/docs/concepts/analytics) in the dashboard (the app already includes `@vercel/analytics`).

---

## License

This project is private. All rights reserved.

---

**BOLT FUSION TECH** — Full-stack software agency: mobile apps, backends, AI, robotics, ERP & SaaS. Secure, scalable, delivered.
