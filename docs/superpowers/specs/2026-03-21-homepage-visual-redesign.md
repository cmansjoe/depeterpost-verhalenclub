# Homepage Visuele Redesign — Van "Goed" naar "Super"

**Datum:** 2026-03-21
**Scope:** `index.html`, `style.css`, inline JS
**Aanpak:** Groepsthema-schil — één HTML, CSS custom properties per `data-groep`
**Omvang:** Dit is een bewust grote wijziging (volledige homepage redesign), goedgekeurd door de gebruiker. Implementatie wordt opgesplitst in kleine, testbare taken via het implementatieplan.

---

## Probleem

De technische utilities (`.glass`, `.fade-in`, `IntersectionObserver`) staan klaar, maar de visuele impact is minimaal. Hardcoded `.bento-groen/.bento-geel/.bento-paars` achtergrondkleuren overschrijven de glassmorphism-stijlen. De homepage voelt "goed" maar niet "super".

## Doelen

1. **Wow-factor** — visuele effecten, animaties, beweging
2. **Design-kwaliteit** — betere kleurtoepassingen, witruimte, typografie
3. **Interactiviteit** — hover-effecten, micro-interacties, spelachtige elementen
4. **Leeftijdsadaptief** — duidelijk merkbaar verschillende sfeer per groep

---

## Sectie 1: Groepsthema's

Eén universeel standaardthema (Betoverd Woud) voor nieuwe bezoekers. Zodra `data-groep` bekend is via localStorage, verandert de hele sfeer via CSS custom properties.

### Standaard (geen groep) — CSS defaults

Wanneer geen `data-groep` attribuut aanwezig is, gelden deze fallback-waarden (in `:root` of `body[data-pagina="landing"]`):

- `--landing-bg: #1B4D2E`
- `--landing-accent: #4CC97A`
- `--landing-accent-licht: rgba(76,201,122,0.15)`
- `--landing-accent-rand: rgba(76,201,122,0.3)`
- `--landing-glass-bg: rgba(255,255,255,0.06)`
- `--landing-glass-rand: rgba(255,255,255,0.12)`
- `--landing-tekst: #F0FDF4`
- `--landing-tekst-zacht: rgba(167,196,181,0.75)`
- `--landing-orb-1: rgba(76,201,122,0.12)`
- `--landing-orb-2: rgba(247,201,72,0.08)`
- `--landing-stroke: #4CC97A`
- `--landing-particle-kleuren: #4CC97A, #34D399, #F7C948` (JS array)
- Font: `Baloo 2`

### Groep A (6-8): Warme Papierwereld
- `--landing-bg: #FFFBF0` (warm ivoor) — **licht thema**
- `--landing-accent: #F28C38`
- `--landing-glass-bg: rgba(0,0,0,0.04)`
- `--landing-glass-rand: rgba(242,140,56,0.25)`
- `--landing-tekst: #3D2B1F` — **donkere tekst voor WCAG contrast op lichte achtergrond**
- `--landing-tekst-zacht: rgba(61,43,31,0.7)`
- Orbs: zachte oranje en gele glows
- Particle header: oranje/gele deeltjeskleuren
- SVG stroke: `#F28C38`
- Font: `Baloo 2` — rond, groot, vrolijk
- Gevoel: zonnig, veilig, als een mooi kinderboek

### Groep B (9-11): Nachtelijk Atelier
- `--landing-bg: #141b2d` (diep marineblauw)
- `--landing-accent: #8B5CF6`
- `--landing-glass-bg: rgba(255,255,255,0.06)`
- `--landing-glass-rand: rgba(139,92,246,0.3)`
- `--landing-tekst: #e2e0ff`
- `--landing-tekst-zacht: rgba(226,224,255,0.7)`
- Orbs: paarse en indigo glows
- Particle header: paars/magenta deeltjes
- SVG stroke: `#8B5CF6`
- Font: `Grandstander` — stoerder, speels
- Gevoel: magisch, dromerig, als een geheim nachtavontuur

### Groep C (12+): Gefocuste Studio
- `--landing-bg: #0d1117` (bijna-zwart)
- `--landing-accent: #38BDF8` — **blauw/cyaan** (volgt CLAUDE.md: Groep C = `#38BDF8`)
- `--landing-glass-bg: rgba(255,255,255,0.05)`
- `--landing-glass-rand: rgba(56,189,248,0.2)`
- `--landing-tekst: #e6edf3`
- `--landing-tekst-zacht: rgba(230,237,243,0.7)`
- Orbs: gedempte cyaan glows, kleiner en subtieler
- Particle header: cyaan/wit deeltjes, strakker
- SVG stroke: `#38BDF8`
- Font: `Grandstander` titels + `Lora` body
- Gevoel: professioneel, volwassen, als een echte schrijfstudio

### Technisch
- Alles via CSS custom properties op `body[data-pagina="landing"][data-groep]` selectors
- Bento-cellen verliezen hardcoded achtergrondkleuren, worden `.glass` met accent via `--landing-*` vars
- Orbs en particle canvas kleuren worden in JS aangestuurd op basis van `data-groep`
- `border-radius: 24px` op alle kaarten (conform CLAUDE.md, de huidige 36px wordt gecorrigeerd)

---

## Sectie 2: Page flow & content herstructurering

Principe: verleiden eerst, dan navigeren.

### 1. Particle Header (behouden, verbeterd)
- Particle canvas met "WoordSpeler" blijft
- Subtitel "Jouw woorden. Jouw spel." blijft
- **Nieuw:** Bij eerste bezoek (geen groep) verschijnt een speelse groepkiezer — drie klikbare kaartjes (Jonge Vos / Slimme Uil / Wijze Draak) met hover-animaties. Zet `data-groep` op `<body>` en slaat op in localStorage.
- **Groepwisseling:** De groepkiezer is altijd bereikbaar via een kleine knop in de footer ("Wissel van groep"). Bij klik verschijnt de kiezer opnieuw.
- **Als groep al bekend:** De groepkiezer is verborgen, de pagina laadt direct in het juiste thema.

### 2. Hero-sectie (nieuw)
- Eén grote `.glass` cel over de volle breedte
- Korte, pakkende tekst: wat is WoordSpeler en waarom is het gaaf
- Prominente CTA-knop ("Begin je avontuur")
- Geanimeerde illustratie of decoratief element

### 3. De drie spelmodi (herwerkt)
De drie modi zijn bestaande features die al pagina's hebben:

| Modus | Linkt naar | Beschrijving |
|---|---|---|
| Het Woordduel | `verhaal.html` | Dagelijkse schrijfopdracht, AI beoordeelt, winnaar in het echte verhaal |
| Mijn Woordenschat | `mijn-dossier.html` | Persoonlijk dossier met eigen verhalen |
| De Woordenstorm | `sessie-host.html` / `sessie-join.html` | Samen schrijven met klas of vrienden |

- Drie gelijke `.glass` cellen naast elkaar (desktop)
- Elk met: icoon/illustratie met hover-animatie, naam + korte beschrijving, CTA-knop

### 4. Social proof (herwerkt)
- "Laatste Winnaars" + teller/statistiek ("Al X verhalen geschreven!")
- Compacter, visueel aantrekkelijker

### 5. Footer (verbeterd)
- Quote behouden
- "Over WoordSpeler" info verhuist hiernaartoe
- Links naar Verhalen, Video's etc.
- **"Wissel van groep" knop** — opent de groepkiezer opnieuw

### Wat verdwijnt
- "Stuur een Idee In" bento-cel — past beter op eigen pagina of in dossier
- "Over ons" bento-cel — wordt onderdeel van de footer
- Twee gescheiden bento-grids worden één vloeiende flow

---

## Sectie 3: Visuele effecten & micro-interacties

### Glassmorphism
- Alle bento-cellen worden `.glass` — geen hardcoded achtergrondkleuren
- Groepsthema-achtergrond schijnt door glaskaarten heen
- Hover: glas helderder, border licht op in accentkleur, `translateY(-4px)` + grotere `box-shadow`

### Achtergrond-orbs (verbeterd)
- 5-6 orbs in plaats van 3, kleiner en gevarieerder
- Langzamere, vloeiendere drift-animatie
- Kleuren reageren op `data-groep` (via inline style updates in JS)
- Bij scroll: subtiele parallax via `requestAnimationFrame`-gebaseerde scroll handler met passive listener (`{ passive: true }`). Berekent `translateY` offset als percentage van `scrollY`. Geen `IntersectionObserver` — dit is een continu effect.

### Shine-shimmer op hover
- Bestaande `bentoGlans` effect subtieler en breder
- Subtiele glow achter de kaart bij hover (pseudo-element met blur)

### Scroll-entrance animaties
- `.fade-in` met gestaffelde delays (`transition-delay` per cel)
- Eerste cel direct, elke volgende 100ms later — cascade-effect
- Hero-sectie: schaal van 0.95 naar 1 + fade

### Groepkiezer animaties
- Zachte "ademende" schaal-animatie op de drie kaartjes
- Hover: kaartje kantelt licht in 3D (`perspective` + `rotateY`), accentkleur gloeit op
- Klik: lightweight inline confetti-burst (geen externe library, ~30 regels JS, canvas-gebaseerd, korte burst van 20-30 deeltjes in de groepskleur, verwijdert zichzelf na 1.5s)

### Particle header verbeteringen
- Deeltjes groter en helderder
- Kleurenpalet past zich aan groepsthema aan (JS leest `data-groep` en kiest kleurenset)
- Muisinteractie-radius iets groter

### Knop-animaties
- CTA-knoppen: subtiele gradient-shift bij hover
- Pijl-animatie (4px naar rechts) bij hover
- Actieve state: korte "indruk" schaal (0.96)

### Performance
- Alle animaties via `transform` en `opacity` (GPU-versneld)
- `will-change` alleen op elementen die daadwerkelijk animeren
- `prefers-reduced-motion` respecteren — alle animaties uit
- Scroll parallax: `requestAnimationFrame` + passive scroll listener

---

## Sectie 4: Typografie & spacing

### Typografie per groep

**Standaard / Groep A:**
- `Baloo 2` overal
- Hero-titel: `2.2rem`, weight 900
- Bento-namen: `1.4rem`, weight 800
- Body tekst: `1rem`, line-height 1.8
- Knoppen: `0.95rem`, weight 900

**Groep B:**
- Titels: `Grandstander`, weight 900
- Hero-titel: `2rem`
- Bento-namen: `1.3rem`, weight 700
- Body tekst: `0.95rem` Baloo 2, line-height 1.75

**Groep C:**
- Titels: `Grandstander`, weight 700
- Body: `Lora`
- Hero-titel: `1.8rem`
- Bento-namen: `1.2rem`, weight 700
- Body tekst: `0.9rem` Lora, line-height 1.7
- Alles compacter en "volwassener"

### Spacing
- Container max-width: `1100px`
- Sectie-afstand: `48px`
- Bento-grid gap: `16px`
- Kaart-padding: `28px 24px`
- `border-radius: 24px` op kaarten, `50px` op knoppen (conform CLAUDE.md)
- Mobiel: padding schaalt via `clamp()`

### Responsive breakpoints

Consolidatie: de bestaande 768px breakpoint in `style.css` voor `.bento-grid` wordt vervangen door deze twee breakpoints (alleen voor de homepage grid):

- `>900px`: drie spelmodi naast elkaar — `grid-template-columns: repeat(3, 1fr)`
- `560px-900px`: twee kolommen — `grid-template-columns: repeat(2, 1fr)`, derde eronder
- `<560px`: alles gestapeld — `grid-template-columns: 1fr`, grotere touch targets, meer padding

### Grid systeem

De homepage gebruikt een **nieuw 3-koloms grid** specifiek voor de spelmodi-sectie, gescheiden van het bestaande 6-koloms `.bento-grid` systeem in `style.css`. Dit voorkomt conflicten:

- `.homepage-grid` — nieuw, 3 kolommen voor de spelmodi
- Hero en social proof gebruiken geen grid, maar full-width `.glass` cellen
- Het bestaande `.bento-grid` systeem in `style.css` blijft onaangetast voor andere pagina's

---

## Bestanden die wijzigen

| Bestand | Wijziging |
|---|---|
| `index.html` | Herstructurering: nieuwe page flow, groepkiezer, hero-sectie, drie gelijke spelmodi, compactere social proof, verbeterde footer |
| `style.css` | Nieuwe `--landing-*` CSS vars per `data-groep` voor homepage, `.homepage-grid` class, groepkiezer styling |
| `index.html` inline `<style>` | Verwijder hardcoded `.bento-groen/.bento-geel/.bento-paars`, vervang door `.glass` + CSS vars, `border-radius: 24px` |
| `index.html` inline `<script>` | Particle kleuren per groep, orb-parallax met rAF, groepkiezer logica, confetti-burst, gestaffelde fade-in delays |
