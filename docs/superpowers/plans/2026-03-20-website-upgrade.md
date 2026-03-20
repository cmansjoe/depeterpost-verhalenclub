# WoordSpeler.nl Website Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform WoordSpeler.nl from a functional site into a "super" tier experience with Bento-grid layouts, Glassmorphism effects, and age-adaptive design for three age groups.

**Architecture:** Vanilla HTML/CSS/JS with a Node.js/Express backend and Supabase auth. All design changes happen in `style.css` (shared) and individual HTML files. Age-group theming is driven by `data-groep` on `<body>`, set server-side after login. No frameworks, no build step.

**Tech Stack:** HTML5, CSS custom properties, vanilla JS, Supabase, Express, Google Fonts (Baloo 2, Grandstander, Lora)

**Spec:** `docs/superpowers/specs/2026-03-20-website-upgrade-design.md`

**Skills required:** `frontend-design` for all UI components

---

## File Map

| File | Actie | Verantwoordelijkheid |
|---|---|---|
| `style.css` | Modify | Glassmorphism utilities, bento-grid systeem, reduced-motion, font-per-groep |
| `index.html` | Modify | Bento-grid homepage: hero, dagelijkse opdracht preview, community stats |
| `schrijfopdracht.html` | Modify | Verbeterde schrijfervaring per leeftijdsgroep |
| `verhalen.html` | Modify | Verhalen-grid met scroll-animaties |
| `script.js` | Modify | `data-groep` instellen na Supabase login |

---

## Task 1: CSS Design System — Glassmorphism & Bento utilities

**Doel:** Voeg herbruikbare utility-klassen toe aan `style.css` die alle pagina's kunnen gebruiken. Geen bestaande stijlen verwijderen — alleen toevoegen.

**Files:**
- Modify: `style.css` (voeg toe na de bestaande `:root` en groep-thema blokken)

- [ ] **Stap 1: Lees de huidige style.css**

  Open `style.css` en zoek het einde van het `[data-groep="C"]` blok. Alle nieuwe code komt daarna.

- [ ] **Stap 2: Voeg Glassmorphism utilities toe**

  ```css
  /* ══ GLASSMORPHISM UTILITIES ══ */

  /* Donker thema (standaard + Groep B + C) */
  .glass {
    background: rgba(255, 255, 255, 0.06);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: var(--radius);
  }

  /* Licht thema (Groep A) */
  [data-groep="A"] .glass {
    background: rgba(0, 0, 0, 0.04);
    border: 1px solid rgba(242, 140, 56, 0.25);
  }

  .glass:hover {
    background: rgba(255, 255, 255, 0.09);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
    transition: all 0.3s ease;
  }

  [data-groep="A"] .glass:hover {
    background: rgba(0, 0, 0, 0.07);
    border-color: rgba(242, 140, 56, 0.4);
  }
  ```

- [ ] **Stap 3: Voeg Bento-grid systeem toe**

  ```css
  /* ══ BENTO-GRID SYSTEEM ══ */

  .bento-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 16px;
    width: 100%;
  }

  /* Bento cel groottes */
  .bento-1 { grid-column: span 1; }
  .bento-2 { grid-column: span 2; }
  .bento-3 { grid-column: span 3; }
  .bento-4 { grid-column: span 4; }
  .bento-6 { grid-column: span 6; }
  .bento-tall { grid-row: span 2; }

  /* Mobiel: alles op 1 kolom */
  @media (max-width: 768px) {
    .bento-grid {
      grid-template-columns: 1fr;
      gap: 12px;
    }
    .bento-1, .bento-2, .bento-3,
    .bento-4, .bento-6 { grid-column: span 1; }
    .bento-tall { grid-row: span 1; }
  }

  /* Bento kaart basis */
  .bento-card {
    border-radius: var(--radius);
    padding: 24px;
    min-height: 140px;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .bento-card:hover {
    transform: translateY(-3px);
    box-shadow: var(--schaduw-hover);
  }
  ```

- [ ] **Stap 4: Voeg scroll-entrance animaties toe**

  ```css
  /* ══ SCROLL-ENTRANCE ANIMATIES ══ */

  .fade-in {
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.5s ease, transform 0.5s ease;
  }

  .fade-in.visible {
    opacity: 1;
    transform: translateY(0);
  }

  /* Reduced motion: geen animaties */
  @media (prefers-reduced-motion: reduce) {
    .fade-in {
      opacity: 1;
      transform: none;
      transition: none;
    }
    .bento-card:hover,
    .glass:hover {
      transform: none;
    }
    * {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
  ```

- [ ] **Stap 5: Voeg font-per-groep toe**

  ```css
  /* ══ FONT PER LEEFTIJDSGROEP ══ */

  /* Standaard (niet ingelogd) */
  h1, h2, h3 { font-family: 'Grandstander', cursive; }

  /* Groep A: Baloo 2 — rond en vrolijk */
  [data-groep="A"] h1,
  [data-groep="A"] h2,
  [data-groep="A"] h3 {
    font-family: 'Baloo 2', cursive;
    font-weight: 800;
  }

  /* Groep B: Grandstander — speels maar stoerder */
  [data-groep="B"] h1,
  [data-groep="B"] h2,
  [data-groep="B"] h3 {
    font-family: 'Grandstander', cursive;
    font-weight: 700;
  }

  /* Groep C: Grandstander titels + Lora body */
  [data-groep="C"] h1,
  [data-groep="C"] h2,
  [data-groep="C"] h3 {
    font-family: 'Grandstander', cursive;
    font-weight: 700;
  }

  [data-groep="C"] p,
  [data-groep="C"] li,
  [data-groep="C"] .body-text {
    font-family: 'Lora', serif;
    font-weight: 400;
  }
  ```

- [ ] **Stap 6: Controleer visueel**

  Open `index.html` in de browser. Voeg tijdelijk `class="glass bento-card"` toe aan een `<div>` om te controleren dat de stijlen werken. Verwijder daarna de test-div.

- [ ] **Stap 7: Commit**

  ```bash
  git add style.css
  git commit -m "feat: add glassmorphism utilities, bento-grid system, scroll animations"
  ```

---

## Task 2: `data-groep` instellen na login

**Doel:** Na login wordt `data-groep` op `<body>` gezet. De auth werkt via `auth.js` met `localStorage` — **geen Supabase SDK call nodig**. Het `leeftijdsgroep` veld zit al in de opgeslagen gebruikersinfo.

**Files:**
- Modify: `auth.js` → voeg `setGroepThema()` toe aan de `initNav` functie
- Of: voeg het toe aan elk HTML-bestand in de `<script>` sectie

**Hoe auth werkt (lees dit eerst):**
- `auth.js` exporteert `Auth.getUserInfo()` → geeft `{ gebruikersnaam, leeftijdsgroep, ... }`
- `leeftijdsgroep` is `"A"`, `"B"`, of `"C"` — direct bruikbaar als `data-groep` waarde
- Geen async call nodig: de info zit al in `localStorage`

- [ ] **Stap 1: Voeg setGroepThema toe aan auth.js**

  Zoek in `auth.js` de `initNav` functie (rond regel 83). Voeg direct na `const u = getUserInfo();` toe:

  ```javascript
  // Zet leeftijdsgroep-thema op <body>
  if (u?.leeftijdsgroep) {
    document.body.setAttribute('data-groep', u.leeftijdsgroep);
  }
  ```

- [ ] **Stap 2: Controleer in browser**

  Log in als een testgebruiker. Open DevTools → Elements. Controleer dat `<body data-groep="A">` (of B of C) verschijnt. Controleer ook dat het achtergrondkleur verandert per groep.

- [ ] **Stap 3: Test alle drie groepen**

  In DevTools console:
  ```javascript
  document.body.setAttribute('data-groep', 'A') // → ivoor achtergrond
  document.body.setAttribute('data-groep', 'B') // → donkerblauw
  document.body.setAttribute('data-groep', 'C') // → donker studio
  ```

- [ ] **Stap 4: Commit**

  ```bash
  git add auth.js
  git commit -m "feat: set data-groep on body from localStorage leeftijdsgroep for age theming"
  ```

---

## Task 3: Homepage (`index.html`) — Bento-grid layout

**Doel:** Vervang de huidige homepage-layout door een Bento-grid met hero, dagelijkse opdracht preview, en community-stats. Gebruik de `frontend-design` skill voor de precieze implementatie.

**Files:**
- Modify: `index.html`

> ⚠️ **VERPLICHT:** Gebruik de `frontend-design` skill voor de volledige implementatie van dit task.

- [ ] **Stap 1: Lees de volledige index.html**

  Lees `index.html` volledig zodat je weet welke secties er al zijn en wat behouden moet blijven.

- [ ] **Stap 2: Definieer de Bento-grid structuur**

  De homepage krijgt deze Bento-grid lay-out:

  ```
  [ Hero / Welkomst (bento-4 bento-tall) ] [ Opdracht van vandaag (bento-2) ]
  [                                        ] [ Community stats (bento-2)     ]
  [ Recente verhalen (bento-3)             ] [ Meedoen CTA (bento-3)         ]
  ```

- [ ] **Stap 3: Implementeer de Bento-grid (frontend-design skill)**

  Gebruik `frontend-design` skill. De grid wrapper:

  ```html
  <main>
    <div class="container">
      <div class="bento-grid">

        <!-- Hero kaart -->
        <div class="bento-card glass bento-4 bento-tall fade-in" aria-label="Welkom bij WoordSpeler">
          <!-- Bestaande hero-content hier -->
        </div>

        <!-- Opdracht van vandaag -->
        <div class="bento-card glass bento-2 fade-in" aria-label="Opdracht van vandaag">
          <h2>✍️ Opdracht van vandaag</h2>
          <!-- Dynamisch gevuld via script.js -->
          <div id="opdracht-preview"></div>
          <a href="schrijfopdracht.html" class="btn-primair">Schrijf mee →</a>
        </div>

        <!-- Community stats -->
        <div class="bento-card glass bento-2 fade-in" aria-label="Community statistieken">
          <h3>🌟 Community</h3>
          <p><span id="stat-schrijvers">—</span> schrijvers actief</p>
          <p><span id="stat-verhalen">—</span> verhalen geschreven</p>
        </div>

        <!-- Recente verhalen -->
        <div class="bento-card glass bento-3 fade-in" aria-label="Recente verhalen">
          <h2>📚 Recente verhalen</h2>
          <div id="recente-verhalen"></div>
          <a href="verhalen.html">Alle verhalen →</a>
        </div>

        <!-- Meedoen CTA -->
        <div class="bento-card bento-3 fade-in" style="background: var(--groep-kleur, var(--groen));" aria-label="Doe mee">
          <h2>Doe jij ook mee? 🚀</h2>
          <p>Schrijf elke dag een stukje van het grote verhaal!</p>
          <a href="login.html" class="btn-primair">Begin nu</a>
        </div>

      </div>
    </div>
  </main>
  ```

- [ ] **Stap 4: Voeg scroll-entrance JS toe aan index.html**

  ```javascript
  // Scroll-entrance animaties
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
  ```

- [ ] **Stap 5: Controleer visueel**

  Open `index.html` in browser. Controleer:
  - Grid is zichtbaar op desktop (6 kolommen)
  - Grid stapelt op mobiel (1 kolom)
  - Glassmorphism effect zichtbaar (backdrop-blur)
  - Fade-in animaties werken bij scrollen
  - Geen layout-breuk op 320px, 768px, 1280px breedte

- [ ] **Stap 6: Controleer toegankelijkheid**

  - Tab door de pagina — focus-states zichtbaar?
  - Alle kaarten hebben `aria-label`?
  - Semantic HTML: `<main>`, koppen in volgorde?

- [ ] **Stap 7: Commit**

  ```bash
  git add index.html
  git commit -m "feat: bento-grid homepage layout with glassmorphism and scroll animations"
  ```

---

## Task 4: Schrijfopdracht (`schrijfopdracht.html`) — Leeftijdsadaptieve schrijfervaring

**Doel:** Verbeter de schrijfpagina zodat de interface aanvoelt per leeftijdsgroep. Groep A: warmte en veiligheid. Groep B: donker en creatief. Groep C: focus en studio-sfeer.

**Files:**
- Modify: `schrijfopdracht.html`

> ⚠️ **VERPLICHT:** Gebruik de `frontend-design` skill voor de volledige implementatie.

- [ ] **Stap 1: Lees de volledige schrijfopdracht.html**

  Lees het bestand volledig. Let op: de `--schrijf-*` variabelen in `style.css` zijn al per groep gedefinieerd.

- [ ] **Stap 2: Verbeter de schrijfkaart layout**

  De schrijfkaart wordt een Bento-style kaart met twee zones:

  ```html
  <main>
    <div class="container">

      <!-- Opdracht kaart (boven) -->
      <div class="bento-card glass fade-in" role="complementary" aria-label="Schrijfopdracht">
        <div class="opdracht-badge">📅 Opdracht van vandaag</div>
        <h1 id="opdracht-titel">Laden...</h1>
        <p id="opdracht-tekst"></p>
      </div>

      <!-- Schrijfveld kaart (onder) -->
      <div class="bento-card glass fade-in schrijf-kaart" aria-label="Jouw verhaal schrijven">
        <div class="schrijf-toolbar">
          <span class="woord-teller"><span id="woord-count">0</span> woorden</span>
          <span class="karakter-teller"><span id="char-count">0</span> tekens</span>
        </div>

        <textarea
          id="verhaal-input"
          placeholder="Begin hier jouw verhaal..."
          aria-label="Schrijf jouw verhaalstuk hier"
          rows="12"
        ></textarea>

        <div class="schrijf-acties">
          <button class="btn-primair" id="opslaan-btn" aria-label="Sla jouw verhaal op">
            💾 Opslaan
          </button>
          <button class="btn-secundair" id="inzenden-btn" aria-label="Stuur jouw verhaal in">
            🚀 Insturen
          </button>
        </div>
      </div>

    </div>
  </main>
  ```

- [ ] **Stap 3: Voeg woord/karakter-teller JS toe**

  ```javascript
  const textarea = document.getElementById('verhaal-input');
  const woordCount = document.getElementById('woord-count');
  const charCount = document.getElementById('char-count');

  textarea.addEventListener('input', () => {
    const tekst = textarea.value.trim();
    woordCount.textContent = tekst ? tekst.split(/\s+/).length : 0;
    charCount.textContent = textarea.value.length;
  });
  ```

- [ ] **Stap 4: Controleer per groep**

  Test met DevTools: zet `document.body.setAttribute('data-groep', 'A')` in de console.
  - Groep A: ivoor achtergrond, oranje accenten, grotere tekst
  - Groep B: donker blauw, paarse accenten
  - Groep C: donker studio, blauwe accenten, Lora body-font

- [ ] **Stap 5: Commit**

  ```bash
  git add schrijfopdracht.html
  git commit -m "feat: age-adaptive writing experience with bento layout and word counter"
  ```

---

## Task 5: Verhalen (`verhalen.html`) — Story-grid met animaties

**Doel:** Vervang de verhalen-lijst door een visueel aantrekkelijk grid met Bento-stijl kaarten en scroll-animaties.

**Files:**
- Modify: `verhalen.html`

> ⚠️ **VERPLICHT:** Gebruik de `frontend-design` skill voor de volledige implementatie.

- [ ] **Stap 1: Lees de volledige verhalen.html**

  Let op hoe verhalen nu worden geladen (via script.js of inline data).

- [ ] **Stap 2: Verhaal-kaart template**

  Elke verhaal-kaart gebruikt dit patroon:

  ```html
  <!-- Template voor één verhaalkaart (gegenereerd via JS) -->
  <article class="bento-card glass fade-in verhaal-kaart" data-groep="{groep}" aria-label="Verhaal: {titel}">
    <div class="verhaal-groep-badge">Groep {groep}</div>
    <h2 class="verhaal-titel">{titel}</h2>
    <p class="verhaal-excerpt">{eerste 100 tekens}...</p>
    <div class="verhaal-meta">
      <span>✍️ {auteur}</span>
      <span>📅 {datum}</span>
    </div>
    <a href="verhaal.html?id={id}" class="verhaal-lees-meer" aria-label="Lees {titel}">
      Lees verder →
    </a>
  </article>
  ```

- [ ] **Stap 3: Grid layout**

  ```html
  <main>
    <div class="container">
      <h1 class="fade-in">📚 Alle verhalen</h1>

      <!-- Filter knoppen -->
      <div class="verhalen-filters fade-in" role="group" aria-label="Filter op groep">
        <button class="filter-btn actief" data-filter="alle">Alle</button>
        <button class="filter-btn" data-filter="A">🟠 Groep A</button>
        <button class="filter-btn" data-filter="B">🔵 Groep B</button>
        <button class="filter-btn" data-filter="C">🟢 Groep C</button>
      </div>

      <!-- Verhalen grid -->
      <div class="bento-grid" id="verhalen-grid" role="list">
        <!-- Kaarten worden hier gegenereerd via JS -->
      </div>
    </div>
  </main>
  ```

- [ ] **Stap 4: Filter JS**

  ```javascript
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;

      // Actieve staat
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('actief'));
      btn.classList.add('actief');

      // Filter kaarten
      document.querySelectorAll('.verhaal-kaart').forEach(kaart => {
        const groep = kaart.dataset.groep;
        kaart.style.display = (filter === 'alle' || groep === filter) ? '' : 'none';
      });
    });
  });
  ```

- [ ] **Stap 5: Controleer visueel**

  - Filter knoppen werken correct
  - Verhaalkaarten tonen op een grid
  - Scroll-animaties werken
  - Kaarten zien er goed uit op mobiel

- [ ] **Stap 6: Commit**

  ```bash
  git add verhalen.html
  git commit -m "feat: bento story grid with group filters and scroll animations"
  ```

---

## Task 6: Consistentie-pass overige pagina's

**Doel:** Alle overige pagina's krijgen dezelfde `<nav>`, `<main>` structuur en `.fade-in` klassen zodat het design consistent is.

**Scope:** Alleen de pagina's die bezoekers/kinderen zien. Admin en sessie-pagina's komen later.

**Files (prioriteit):**
- Modify: `login.html`, `mijn-dossier.html`, `mijn-verhaal.html`, `mijn-verhalen-overzicht.html`, `regels.html`

**Buiten scope (aparte pass later):**
- `sessie-host.html`, `sessie-join.html`, `sessie-schrijf.html`, `sessie-verhaal.html`
- `verhaal.html`, `verhaal-overzicht.html`, `verhaal-publiek.html`
- `admin.html` (admin-only, lagere prioriteit)

- [ ] **Stap 1: Controleer per pagina de `<body>` tag**

  ```bash
  grep -h "<body" *.html
  ```

  Zorg dat elke pagina een correcte `<main>` en `<nav>` heeft.

- [ ] **Stap 2: Voeg `.glass` en `.bento-card` toe aan bestaande kaarten**

  Per pagina: voeg `class="glass"` toe aan de belangrijkste content-containers.

- [ ] **Stap 3: Voeg scroll-entrance observer toe aan elke pagina**

  Kopieer de IntersectionObserver code (uit Task 3, stap 4) naar de `<script>` sectie van elke pagina, of verplaats het naar `script.js` als globale functie.

- [ ] **Stap 4: Commit**

  ```bash
  git add login.html mijn-dossier.html mijn-verhaal.html regels.html admin.html
  git commit -m "feat: apply consistent glass cards and scroll animations to all pages"
  ```

---

## Acceptatiecriteria (volledig klaar wanneer)

- [ ] Bento-grid zichtbaar op homepage, stapelt op mobiel
- [ ] Glassmorphism effect zichtbaar op alle kaarten (blur + transparante rand)
- [ ] Groep A (6-8): ivoor achtergrond, oranje accenten, Baloo 2 font
- [ ] Groep B (9-11): donkerblauw achtergrond, paarse accenten, Grandstander font
- [ ] Groep C (12+): donker studio, blauwe accenten, Lora body
- [ ] Scroll-animaties werken, stoppen bij `prefers-reduced-motion`
- [ ] Alle focus-states zichtbaar bij Tab-navigatie
- [ ] Geen layout-breuk op 320px, 768px, 1280px
- [ ] `data-groep` wordt correct ingesteld na login
- [ ] Filter op verhalen.html werkt per groep
