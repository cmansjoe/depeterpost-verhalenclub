# WoordSpeler.nl — Website Upgrade Design Spec
**Datum:** 2026-03-20
**Doel:** Van "goed" naar "super" — incrementele upgrade naar productie-waardige kinderervaring

---

## Scope

Dit document beschrijft de designrichting en technische aanpak voor de upgrade van WoordSpeler.nl. De focus ligt op drie prioriteitspagina's, met als doel dat alle pagina's consistent worden.

---

## Beslissingen (vastgelegd na brainstorm)

| Vraag | Beslissing | Reden |
|---|---|---|
| Tech stack | **Blijf vanilla** HTML/CSS/JS | Geen herschrijving nodig, betere performance, leeftijdsgroep CSS-systeem werkt perfect |
| Framework | Geen React/Vue/Next.js | Overkill voor content platform, Hetzner VPS + Express is ideaal |
| 21st.dev | Designs vertalen naar vanilla | Componenten als inspiratie, niet rechtstreeks importeren |
| Fonten | Baloo 2 / Grandstander / Lora | Per leeftijdsgroep, wetenschappelijk onderbouwd |
| Deployment | Hetzner VPS + WoordSpeler.nl | Gepland, nog niet live |

---

## Prioriteitspagina's

1. **`index.html`** — Homepage, eerste indruk, meeste bezoekers
2. **`schrijfopdracht.html`** — Core functie, dagelijkse schrijfopdracht
3. **`verhalen.html`** — Verhalen overzicht, community gevoel

Alle andere pagina's volgen hetzelfde design systeem voor consistentie.

---

## Design Richting

### Visuele stijl
- **Layout:** Bento-grid systeem — asymmetrische kaarten die organisch aanvoelen
- **Stijl:** Glassmorphism — `backdrop-filter: blur(12px)`, transparante randen
- **Radius:** `24px` op kaarten, `50px` op knoppen (al gedefinieerd in `:root`)
- **Animaties:** Subtiele micro-interacties (hover, focus, scroll-entrance)
- **Thema:** Donker Betoverd Woud als basis, leeftijdsgroep overschrijft per context

### Leeftijdsadaptief design (via `data-groep` attribuut)

| Groep | Leeftijd | Kleur | Sfeer | Achtergrond |
|---|---|---|---|---|
| A | 6–8 jaar | Oranje `#F28C38` | Warm, veilig, speels | Ivoor `#FFFBF0` |
| B | 9–11 jaar | Paars `#8B5CF6` | Dromerig, creatief | Nacht `#141b2d` |
| C | 12+ jaar | Blauw `#38BDF8` | Gefocust, serieus | Donker studio |

Wetenschappelijke basis: ScienceDirect 2022–2025 kleurpsychologie onderzoek.

### Typografie per groep
- **Groep A:** `Baloo 2 800` voor titels — rond, leesbaar, vrolijk
- **Groep B:** `Grandstander 700` voor titels — speels maar stoerder
- **Groep C:** `Lora italic` + `Grandstander` — meer karakter, minder kleuterschool

---

## Technische Aanpak

### Component systeem
- Herbruikbare CSS-klassen in `style.css` (al deels aanwezig)
- Vanilla JS voor interacties — geen dependencies
- 21st.dev componenten handmatig vertalen naar vanilla CSS/JS
- `frontend-design` skill verplicht bij elk UI-component

### Toegankelijkheid (WCAG 2.2)
- Voldoende contrast per leeftijdsgroep-thema
- Focus-states zichtbaar (al gedefinieerd via `--schrijf-focus-glow`)
- Leesbare fontgrootte: min `1rem` (Groep B/C), `1.1rem` (Groep A)
- Touch-targets minimaal `44x44px`

### Performance
- Geen zware dependencies
- Google Fonts via `@import` (al aanwezig)
- Afbeeldingen lazy-loaded
- Animaties via CSS transforms (GPU-versneld)

---

## Werkwijze

- **Incrementeel:** Elke prompt = één duidelijke verbetering
- **Skills:** `frontend-design` voor UI, `superpowers:brainstorming` voor nieuwe features
- **Consistentie:** Elke pagina gebruikt dezelfde CSS-variabelen en klassen
- **Review:** Na elke grote stap `superpowers:requesting-code-review`

---

## Volgende Stappen (implementatieplan)

1. `index.html` — Bento-grid homepage met hero, opdracht-preview, community-stats
2. `schrijfopdracht.html` — Verbeterde schrijfervaring per leeftijdsgroep
3. `verhalen.html` — Verhalen-grid met filters en animaties
4. Consistentie-pass over alle overige pagina's
5. Deployment prep voor Hetzner + WoordSpeler.nl
