# Judea Ann C. Tablate — Portfolio

A futuristic, motion-driven portfolio built with vanilla JS + GSAP + Lenis smooth scroll, bundled with Vite.

## What's inside
- **Vite** — dev server with hot reload + production bundler
- **GSAP + ScrollTrigger** — scroll-based reveals, magnetic buttons, hero text animation, analog clock hands
- **Lenis** — buttery smooth scrolling
- Vanilla HTML/CSS/JS — no framework, easy to read and edit
- Fonts: **Unbounded** (display), **Inter** (body), **JetBrains Mono** (HUD/labels) via Google Fonts

## Run it in VS Code

### 1. Install Node.js
You need Node.js installed (v18 or newer). Check with:
```
node -v
```
If that fails, download it from https://nodejs.org (LTS version) and install it.

### 2. Open the project
- Unzip this folder.
- In VS Code: **File → Open Folder…** → select the `judea-portfolio` folder.

### 3. Install dependencies
Open a terminal in VS Code (**Terminal → New Terminal**) and run:
```
npm install
```
This downloads Vite, GSAP, and Lenis into a `node_modules` folder (only needs to be done once).

### 4. Start the dev server
```
npm run dev
```
Vite will print a local URL, usually `http://localhost:5173`. Open it in your browser — the site is now running with hot reload, so any file you save updates instantly.

### 5. Build for production (when you're ready to deploy)
```
npm run build
```
This outputs an optimized, minified version into a `dist/` folder. That `dist/` folder is what you upload to a host like Vercel, Netlify, or GitHub Pages.

To preview the production build locally before deploying:
```
npm run preview
```

## Project structure
```
judea-portfolio/
  index.html         ← page markup
  public/
    judea-photo.jpg   ← profile photo, used by src/binary-photo.js
  src/
    style.css         ← all styling
    main.js           ← all animation/interaction logic
    three-scene.js     ← the 3D neural-network hero scene + Contact accent (Three.js)
    binary-photo.js    ← animated digit-overlay portrait effect
  package.json
```

## The 3D hero scene
The hero background is a real WebGL scene (`src/three-scene.js`, using Three.js) — a rotating "neural network" of ~46 connected nodes in 3D space, not a flat canvas trick. It has genuine perspective/depth, and gently rotates toward your mouse. Tweak `NODE_COUNT`, `RADIUS`, or `EDGE_THRESHOLD` at the top of that file to make it denser/sparser.

## Editing content
- Text, links, project descriptions: edit directly in `index.html`.
- Colors, fonts, spacing: edit the CSS variables at the top of `src/style.css` (the `:root` block).
- Animation behavior (scroll effects, cursor, magnetic buttons, clock, sound): `src/main.js`.
- To swap your photo: replace `public/judea-photo.jpg` with a new file of the same name (or update the path in `main.js` where `initBinaryPhoto` is called).

## Deploying
Easiest options once `npm run build` produces a `dist/` folder:
- **Netlify / Vercel**: connect your GitHub repo, set build command `npm run build` and publish directory `dist`.
- **GitHub Pages**: push the `dist/` folder contents to a `gh-pages` branch (or use the `gh-pages` npm package).
