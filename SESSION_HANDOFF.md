# Session Handoff — Website Upgrade "Super"

**Datum:** 2026-03-21
**Plan:** `docs/superpowers/plans/2026-03-20-website-upgrade.md`
**Methode:** Subagent-Driven Development

---

## Voltooide taken

| Task | Beschrijving | Commits |
|------|-------------|---------|
| **Task 1** | CSS Design System — Glassmorphism, Bento-grid, scroll-animaties, font-per-groep in `style.css` | `103ce36`, `9efd210` |
| **Task 2** | `data-groep` instellen op `<body>` na login via `auth.js` | `c8ae4f1` |
| **Task 3** | Homepage `index.html` — `.glass` en `.fade-in` op alle bento-cellen, IntersectionObserver | `2415821`, `a1e7046` |
| **Task 4** | Schrijfopdracht `schrijfopdracht.html` — `.glass` en `.fade-in` op hoofdkaarten, IntersectionObserver | `70dd4e5` |

## Volgende stap: Task 5

**Verhalen (`verhalen.html`) — Story-grid met animaties**

De pagina heeft al een geavanceerde layout met 3 weergavemodi (list/grid/stack), filter-knoppen per groep, zoekbalk, AI-afbeeldingen, en een particles.js achtergrond. Aanpak moet conservatief zijn (zoals Task 3 en 4):

1. Voeg `.glass` en `.fade-in` toe aan de filter-balk en verhaal-kaarten
2. Voeg IntersectionObserver JS toe (zelfde patroon als Task 3/4)
3. Behoud alle bestaande functionaliteit (3 layout modes, swipe, filters, zoeken)

**Start commando:** `"Ga verder met de website upgrade. Begin bij Task 5. Plan: docs/superpowers/plans/2026-03-20-website-upgrade.md"`

## Daarna: Task 6

**Consistentie-pass overige pagina's** — `.glass` en `.fade-in` toevoegen aan: `login.html`, `mijn-dossier.html`, `mijn-verhaal.html`, `mijn-verhalen-overzicht.html`, `regels.html`

---

## Geleerde lessen deze sessie

- **Conservatieve aanpak werkt:** De bestaande pagina's hebben al een goed design. Voeg utility classes toe, verwijder alleen echt dubbele CSS. Niet alles vervangen.
- **IntersectionObserver patroon:** Altijd `querySelectorAll` binnen `DOMContentLoaded`, altijd `observer.unobserve()` na trigger.
- **Transition scoping:** Gebruik `transition: background 0.3s, border-color 0.3s, transform 0.3s` in plaats van `transition: all` (performance op mobiel).
- **Inline vs style.css:** Pagina-specifieke inline `<style>` overrulet style.css via cascade. Breakpoints en kleuren in inline styles zijn bewust anders — niet verwijderen.
