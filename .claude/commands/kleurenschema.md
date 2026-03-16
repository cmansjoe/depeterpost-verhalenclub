# 🎨 WoordSpeler Kleurenschema & Kleurpsychologie Skill

Gebruik `/kleurenschema` wanneer je kleuren, CSS of schrijfomgevingen aanpast op WoordSpeler.
Dit document combineert peer-reviewed onderzoek (2022–2025) met de bestaande site-structuur.

---

## ONDERZOEKSBASIS — Kleur & Kinderen (6–12 jaar)

### Neurowetenschappelijke grondbeginselen

- **Warme kleuren** (oranje, geel) activeren de amygdala → energie, sociale betrokkenheid.
- **Koele kleuren** (blauw, groen) activeren de prefrontale cortex → gefocust denken, kalmte.
- **Rood** is kritisch: activeert *vermijdingsmotivatie* in academische contexten. Kinderen schrijven met minder durf en nemen minder creatief risico als rood dominant is in de schrijfomgeving (Elliot et al., PubMed meta-analyse). Gebruik rood uitsluitend als systeemwaarschuwing buiten de editor.
- **Blauw** stimuleert divergent denken en creatieve output: blauwe omgevingen produceren tweemaal zoveel creatieve ideeën als rode omgevingen (Frontiers in Psychology).
- **Groen** verhoogt de *kwaliteit* van creatieve ideeën: even groen zien voor een schrijftaak verhoogt zowel woordcreativiteit als beeldcreativiteit (ResearchGate 2015, meerdere replicaties).
- **Kleurmoeheid**: verzadigde, felle combinaties overprikkelen. Maximaal 5–6 gelijktijdige kleuren is het cognitieve optimum; daarboven meetbare prestatiedaling.
- **Kindervisus**: tot 12 jaar in ontwikkeling → hoog contrast niet optioneel. Minimum WCAG AA (4.5:1), streef naar 7:1 voor schrijftekst.

---

## BEVINDINGEN PER LEEFTIJDSGROEP

### 🟠 Groep A — 6 tot 8 jaar

**Profiel**
Op 7-jarige leeftijd begint een voorkeur voor blauw boven rood te ontstaan, omdat rood door socialisatie al geassocieerd wordt met stoppen en gevaar (ScienceDirect, Development of the Red-Negative Association). Kinderen zijn in deze fase al gevoeliger voor kleur-betekenis dan kleuters.

**Kritieke bevinding (2025):**
Een studie op gehospitaliseerde schoolkinderen (ScienceDirect 2025) toont dat blauw negatieve emotionele associaties oproept bij jongere kinderen: "koud", "ontmoedigd", "depressief". Gebruik blauw voor Groep A uitsluitend als functioneel accent, **nooit** als dominante achtergrond.

**Kleurprofiel:**
- Voorkeur: warm oranje, helder geel, warm groen, warm crème.
- Jongens: blauw en rood als favorieten voor identiteitskleuren (niet achtergronden).
- Meisjes: rood en paars als favorieten.
- Nielsen Norman Group (2024): 6–8 jarigen zijn een aparte UX-categorie — reageren op bold accenten maar raken snel overprikkeld.

**Schrijfomgeving:**
- Lichte, warme achtergrond (crème/ivoor) — wetenschappelijk het sterkst voor leesbaarheid EN emotionele veiligheid.
- Warm donkerbruin tekst (geen koud zwart, geen helder rood).
- Oranje accenten beperkt en doelgericht (knoppen, succesmomenten).
- **Nooit**: donkere achtergronden, koud grijs, blauw als basis.

---

### 🔵 Groep B — 9 tot 11 jaar

**Profiel**
Transitiefase: verschuiving van warm naar koel. Kunnen langer focussen. Blauw is de meest stabiele favoriet voor beide geslachten in onderzoek (Lyu, Color Research & Application 2022). Voorkeur voor paars daalt met leeftijd; voorkeur voor oranje en donkere tinten neemt juist toe.

**Kritieke bevinding:**
Kleurrijke ontwerpen verhogen intrinsieke motivatie significant tegenover monochroom — maar alleen als kleur *relevante informatie benadrukt*, niet als decoratie. Willekeurige kleurrijkheid verhoogt cognitieve belasting (Frontiers in Psychology 2024).

**Kleurprofiel:**
- Middenblauw (#457B9D range) werkt cognitief het sterkst voor creativiteit bij deze groep.
- Paars is aanvaardbaar als accent maar polariserend bij jongens als dominant element.
- Groen als secundair versterkt creatieve kwaliteit verder.
- Lichtpaars/lavender: goed voor meisjes, neutraal voor jongens.

**Schrijfomgeving:**
- Donker marineblauw basis (diep genoeg zodat het niet "koud" aanvoelt maar "nacht"-achtig).
- Zachte paarse/lila tekstkleur.
- Geel/warm accent voor motivatie-elementen.
- **Nooit**: kinderpalet (te veel geel/oranje), maar ook niet volledig grijs-minimalistisch.

---

### 🟢 Groep C — 12 jaar en ouder

**Profiel**
Pre-adolescenten verwerpen actief kinderlijkheid in interfaces. Donkere thema's worden geassocieerd met autonomie, moderne esthetiek en "eigen ruimte" — hogere sessieduur gemeten (Android Authority, Nielsen Norman Group). Lichte interfaces voelen als "school en werkdruk".

**Kritieke bevinding:**
Paars op donkere achtergrond wordt door adolescenten geassocieerd met "dromerig, nobel, romantisch" — sterke keuze voor een creatieve schrijfclub-sfeer. Wit, blauw, zwart en groen zijn populaire keuzes bij tienerjongens.

**Kleurprofiel:**
- Donker bosgroen of blauwgroen dominant.
- Optioneel donker thema (#1A1A2E met groen of paarse accenten).
- Gedempte paars/lavendel voor fantasie-stukken.
- **Nooit**: heldere primaire kleuren (infantiel), neonkleuren als dominant, pastels.

**Schrijfomgeving:**
- Donker, minimaal, gefocust.
- Één hero-accentkleur max.
- Near-black (nooit puur zwart — gebruik diepblauw `#0D1B2A` of `#0d1117`).

---

## DE DRIE VASTE GROEPKLEUREN — NOOIT WIJZIGEN

| Groep | Hex | CSS | Gebruik |
|-------|-----|-----|---------|
| 🟠 A (6–8) | `#F28C38` | — | Badges, buttons, borders Groep A |
| 🔵 B (9–11) | `#8B5CF6` | `--paars` | Badges, buttons, borders Groep B |
| 🟢 C (12+) | `#4CC97A` | `--groen` | Badges, buttons, borders Groep C |

---

## SCHRIJFOMGEVINGEN PER LEEFTIJDSGROEP

De schrijfcanvas (textarea + directe omgeving) heeft het meeste impact op schrijfprestatie.
Onderzoek is eenduidig: **lichte achtergrond wint voor leesbaarheid en leesuithouding** bij alle leeftijden.
Donker thema is optioneel voor Groep C (hogere betrokkenheid bij adolescenten), maar nooit puur zwart.

### Groep A — "Warme Papierwereld" 🟠
```css
[data-groep="A"] {
  --schrijf-bg:         #FFFBF0;   /* Warm ivoor — voelt als papier */
  --schrijf-kaart:      #FFF8E1;   /* Licht geel-getint */
  --schrijf-tekst:      #3D2B1F;   /* Warm donkerbruin — NIET koud zwart */
  --schrijf-placeholder:#A89080;
  --schrijf-rand:       rgba(242,140,56, 0.35);
  --schrijf-focus-glow: rgba(242,140,56, 0.18);
  --schrijf-radius:     18px;      /* Ronder = vriendelijker */
  --schrijf-fontsize:   1.1rem;
  --schrijf-lineheight: 1.9;       /* Ruim interlinie voor jonge lezers */
}
```
```css
/* Textarea implementatie Groep A */
[data-groep="A"] textarea {
  background:    var(--schrijf-bg);
  color:         var(--schrijf-tekst);
  border:        2px solid var(--schrijf-rand);
  border-radius: var(--schrijf-radius);
  font-size:     var(--schrijf-fontsize);
  line-height:   var(--schrijf-lineheight);
}
[data-groep="A"] textarea:focus {
  border-color:  #F28C38;
  box-shadow:    0 0 0 4px var(--schrijf-focus-glow);
}
```
**Sfeerwoorden**: warm, uitnodigend, veilig, als een notitieboekje thuis.

---

### Groep B — "Nachtelijk Atelier" 🔵
```css
[data-groep="B"] {
  --schrijf-bg:         #141b2d;   /* Diep marineblauw — "nacht" */
  --schrijf-kaart:      #1e2a4a;
  --schrijf-tekst:      #e2e0ff;   /* Zachte lila-wit */
  --schrijf-placeholder:#6b6b8a;
  --schrijf-rand:       rgba(139,92,246, 0.3);
  --schrijf-focus-glow: rgba(139,92,246, 0.14);
  --schrijf-radius:     16px;
  --schrijf-fontsize:   1rem;
  --schrijf-lineheight: 1.75;
}
```
```css
[data-groep="B"] textarea {
  background:    var(--schrijf-bg);
  color:         var(--schrijf-tekst);
  border:        2px solid var(--schrijf-rand);
  border-radius: var(--schrijf-radius);
  font-size:     var(--schrijf-fontsize);
  line-height:   var(--schrijf-lineheight);
}
[data-groep="B"] textarea:focus {
  border-color:  #8B5CF6;
  box-shadow:    0 0 0 4px var(--schrijf-focus-glow);
}
```
**Sfeerwoorden**: mysterieus, creatief, als schrijven bij maanlicht.

---

### Groep C — "Gefocuste Studio" 🟢
```css
[data-groep="C"] {
  --schrijf-bg:         #0d1117;   /* Near-black — nooit puur #000000 */
  --schrijf-kaart:      #161b22;
  --schrijf-tekst:      #e6edf3;   /* Zacht blauwwit */
  --schrijf-placeholder:#484f58;
  --schrijf-rand:       rgba(76,201,122, 0.18);
  --schrijf-focus-glow: rgba(76,201,122, 0.09);
  --schrijf-radius:     12px;      /* Minder rond = professioneler */
  --schrijf-fontsize:   0.95rem;
  --schrijf-lineheight: 1.7;
}
```
```css
[data-groep="C"] textarea {
  background:    var(--schrijf-bg);
  color:         var(--schrijf-tekst);
  border:        1px solid var(--schrijf-rand);  /* Subtieler */
  border-radius: var(--schrijf-radius);
  font-size:     var(--schrijf-fontsize);
  line-height:   var(--schrijf-lineheight);
}
[data-groep="C"] textarea:focus {
  border-color:  #4CC97A;
  box-shadow:    0 0 0 3px var(--schrijf-focus-glow);
}
```
**Sfeerwoorden**: minimaal, gefocust, serieus schrijverschap.

---

### JavaScript implementatie (groep detectie)
```javascript
// Stel groepskleur in bij paginastart
const groep = localStorage.getItem('groep') || 'B';
document.body.setAttribute('data-groep', groep);
```

---

## PAGINA-SPECIFIEKE KLEURREGELS

### index.html — Landing & Homepage
- Doel: iedereen verwelkomen, sfeer neerzetten.
- Huidig donkergroen + goud/oranje = universeel en werkt voor alle leeftijden. Niet wijzigen.
- Orbs/achtergrond: "betoverd woud" sluit aan bij storytelling — behouden.
- Regel: géén groep-specifieke kleur dominant op de homepage.

### schrijfopdracht.html — Opdracht bekijken
- Doel: nieuwsgierigheid en motivatie opwekken.
- Goudkleurige datum-tag ✓ (universeel aantrekkelijk).
- Groep-badges (oranje/paars/groen) correct ✓.
- Opdracht-kaart donker gradient met groene gloed ✓.

### sessie-schrijf.html & mijn-verhaal.html — SCHRIJFCANVAS ⚠️ Kritiekst
- Zie schrijfomgevingen per groep hierboven.
- Gebruik `data-groep` attribuut op `<body>`.
- Geen animaties in of direct rond de textarea — afleiding tijdens schrijven.

### verhalen.html & verhaal-overzicht.html — Galerij
- Doel: inspiratie, ontdekking, trots op eigen werk.
- Verhaalkaarten kunnen een subtiele groepskleur-rand tonen (welke groep schreef het).
- Donkergroen + goud: bibliotheeksfeer ✓.

### mijn-dossier.html — Persoonlijk dossier
- Groepskleur prominenter: avatar/profiel-gloed, voortgangsbalken, statistieken.
- "Dit is mijn plek" gevoel — persoonlijker dan de gemeenschappelijke pagina's.

### sessie-host.html / sessie-join.html / sessie-verhaal.html — Multiplayer
- Iets warmer en energieker dan solo-schrijven (samenwerken = meer sociale energie).
- Cyan (`#38BDF8`) of warmoranje als extra sociaal-accent.
- Nog steeds gefocust genoeg om te schrijven.

### login.html & toestemming.html — Onboarding
- Doel: vertrouwen en veiligheid uitstralen (ook voor ouders).
- Kalm, vertrouwenwekkend — geen felle accenten die alarm of urgentie suggereren.

### admin.html — Beheer
- Volwassen beheerders, niet kinderen.
- Zakelijk, functioneel — geen kinderpalet.

---

## DOPAMINE-MOMENTEN — Kleurbeloning op succesmomenten

Gebruik kleur als beloning op exacte momenten. Spaarzaam, nooit continu.

| Moment | Groep A 🟠 | Groep B 🔵 | Groep C 🟢 |
|--------|-----------|-----------|-----------|
| Inzending verzonden | Confetti-kleuren burst | Paarse gloed + gouden ster | Subtiele groene shimmer |
| AI kiest jouw verhaal | Goud gloeiende rand + feestanimatie | Paars-goud glow + tekst | Eenvoudige gouden badge |
| Dagstreak behaald | Oranje vlam-animatie | Blauwe vonkjes | Kleine groene checkmark |
| Eerste schrijfsessie | Warme regenboog welkomstbanner | Paarse "Welkom schrijver" badge | Minimale groen-groet |

---

## 60-30-10 KLEURVERHOUDING

Wetenschappelijk onderbouwde verhouding voor kindvriendelijke interfaces:

| Deel | Wat | Voorbeeld Groep B |
|------|-----|------------------|
| **60%** dominante kleur | Achtergrond, rustige vlakken | `#141b2d` (dark navy) |
| **30%** secundaire kleur | Navigatie, cards, structuur | `#8B5CF6` paars (groepskleur) |
| **10%** accent | Knoppen, badges, actief element | `#F7C948` geel (motivatie) |

---

## VERBODEN COMBINATIES

| ❌ | Waarom |
|----|--------|
| Rood dominant in schrijfomgeving | Activeert vermijdingsmotivatie → kinderen schrijven met minder durf (Elliot, PubMed) |
| `#ffffff` als textarea achtergrond | Halos bij astigmatisme (vaker ondiagnosticeerd bij kinderen), oogvermoeidheid |
| `#000000` als achtergrond | Negatieve emoties bij < 10 jaar; "beangstigend" |
| Blauw als dominante achtergrond voor Groep A | Emotionele associaties: "koud", "ontmoedigd" (ScienceDirect 2025) |
| Helder geel `#FFFF00` als achtergrond | Verblindend, veroorzaakt agitatie bij langdurige blootstelling |
| Rood + oranje als kleurpaar | Maximale overprikkeling, verhoogt hartslagfrequentie, verlaagt focus |
| Grijs of bruin dominant | Demotiveert, reduceert energieniveau bij alle leeftijden |
| > 6 gelijktijdige kleuren per scherm | Cognitieve overbelasting, meetbare prestatiedaling |
| Animaties in/rond textarea | Directe afleiding tijdens schrijven |
| Felgroen neon `#00FF00` | Oogvermoeidheid bij leestaak; positief groen is altijd gedempt |
| Kinderlijk palet voor Groep C | Tieners verwerpen dit actief — verlies van vertrouwen |

---

## CONTRASTREGELS (Strenger dan WCAG standaard)

Kinderogen zijn in ontwikkeling → wij hanteren hogere normen:

| Element | Minimum ratio | Reden |
|---------|--------------|-------|
| Schrijftekst (textarea) | **7:1** | Langdurig schrijven en lezen |
| Navigatietekst | **4.5:1** | WCAG AA baseline |
| Knoppen (tekst op kleur) | **4.5:1** | Klikbaarheid |
| Placeholder tekst | **3:1** | Oriëntatie |
| Grote titels (>24px) | **3:1** | WCAG AA voor grote tekst |

**Kleur als enige indicator:** Nooit. Voeg altijd icoon of tekst toe bij foutmeldingen (kleurenblindheid).
**Rood-groen combinaties voor betekenisvolle info:** Verboden (meest voorkomende kleurenblindheid).

---

## DYSLEXIE-VRIENDELIJKE KLEUREN

Significant deel van de doelgroep heeft (ongediagnosticeerde) dyslexie:

- **Beste achtergrond**: crème/off-white (`#FEFAE0`, `#FAF7F0`) → snelst gelezen combinatie.
- **Beste tekstkleur**: warm donkergrijs/bruin (`#2D2926`) — NIET puur zwart.
- **Turquoise overlay** optie: kortste gemeten leestaaktijd bij dyslexie (CMU/ACM onderzoek).
- **Nooit puur wit**: halos bij astigmatisme & Irlen Syndroom.
- **Nunito font** (jouw huisstijl) = uitstekend voor dyslexie ✓ (sans-serif, ruime vormen).

---

## SNELREFERENTIE — BESLISBOOM

Twijfel je over een kleurkeuze? Loop dit af:

1. **Ken je de groep?** → gebruik `[data-groep="A/B/C"]` schrijfomgeving.
2. **Is het een button/actie?** → groepskleur als achtergrond, wit als tekst, 4.5:1 contrast.
3. **Is het een textarea/schrijfveld?** → gebruik `--schrijf-bg` en `--schrijf-tekst` van de groep. Nooit puur wit of zwart.
4. **Is het een border/rand?** → `--schrijf-rand` (altijd semi-transparant, nooit solid vol-kleur).
5. **Is het een succesbericht?** → groepskleur als glow/border, niet als volle achtergrond.
6. **Is het een foutmelding?** → `#F87171` rood, wit tekst, buiten de schrijfomgeving, kort zichtbaar.
7. **Is het gemeenschappelijk (alle groepen)?** → huidig donkergroen palet (`style.css`) — niet wijzigen.
8. **Twijfel?** → kies warm crème achtergrond + donkere tekst = altijd veilig.

---

## WETENSCHAPPELIJKE BRONNEN

- Lyu (2022) — Color design in application interfaces for children — *Color Research & Application* (Wiley)
- Frontiers in Psychology (2024) — Information relevance and colorfulness in multimedia learning
- ScienceDirect (2025) — Color preferences and emotional associations in hospitalized school-age children
- PMC — Effects of red and blue on cognitive task performance — *Elliot et al.*
- PMC (2025) — Immediate Effects of Light Mode and Dark Mode on Visual Fatigue
- Nielsen Norman Group (2024) — UX Design for Children (Ages 3–12), 4th Edition
- Nielsen Norman Group — Dark Mode vs. Light Mode: Which Is Better?
- CMU/ACM (2017) — Good Background Colors for Readers: Study with and without Dyslexia
- ResearchGate (2015) — Facilitating creative thinking: effects of plants and the colour green
- PubMed (2023) — Colour-cued paragraph writing instruction for students with learning disabilities
- PMC (2016) — Disruptive Effects of Colorful vs. Non-colorful Play Areas
- WCAG 2.1 / WebAIM Contrast Guidelines
- Smashing Magazine (2024) — A Practical Guide to Designing for Children
- DesignMantic — Age and Gender Based Color Preferences
- Jouw eigen onderzoek: Kleureffecten op kinderen 6–12 jaar (2025, WoordSpeler projectdocument)
