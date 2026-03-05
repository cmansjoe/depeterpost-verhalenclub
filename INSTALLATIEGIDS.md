# 📚 Installatiegids - Depeterpost Verhalen Club
## Compleet Beginnersgids

---

## Wat je nodig hebt

1. **Node.js** (gratis te downloaden)
2. **Een Anthropic API sleutel** (voor Claude AI)
3. **Je bestaande websitebestanden**

---

## Stap 1: Node.js installeren

1. Ga naar [https://nodejs.org](https://nodejs.org)
2. Klik op de grote groene knop "LTS" (de stabiele versie)
3. Download en installeer het programma (gewoon "Volgende" klikken)
4. **Controleer of het werkt:** open een terminal/opdrachtprompt en typ:
   ```
   node --version
   ```
   Je zou zoiets moeten zien: `v20.0.0`

**Terminal openen:**
- **Windows:** druk op `Win + R`, typ `cmd`, druk Enter
- **Mac:** druk op `Cmd + Spatie`, typ `terminal`, druk Enter

---

## Stap 2: Jouw websitebestanden organiseren

Maak een nieuwe map aan voor je website. Zet hierin ALLE bestanden:

```
mijn-website/
├── server.js           ← nieuw bestand (van mij)
├── dagelijks.js        ← nieuw bestand (van mij)
├── package.json        ← nieuw bestand (van mij)
├── .env                ← moet je zelf aanmaken (zie stap 3)
├── index.html          ← jouw bestaande bestand
├── verhalen.html       ← jouw bestaande bestand
├── admin.html          ← bijgewerkt bestand (van mij)
├── admin.js            ← jouw bestaande bestand
├── script.js           ← jouw bestaande bestand
├── style.css           ← jouw bestaande bestand
├── schrijfopdracht.html ← nieuw bestand (van mij)
├── verhaal-overzicht.html ← nieuw bestand (van mij)
└── data/               ← map wordt automatisch aangemaakt
```

---

## Stap 3: API sleutel instellen

1. Ga naar [https://console.anthropic.com](https://console.anthropic.com)
2. Maak een account aan (of log in)
3. Ga naar "API Keys" en maak een nieuwe sleutel aan
4. Hernoem het bestand `.env.template` naar `.env`
5. Open `.env` in een teksteditor (bijv. Kladblok/Notepad)
6. Vervang `sk-ant-VERVANG_DIT_MET_JOUW_ECHTE_SLEUTEL` met jouw echte sleutel
7. Sla het bestand op

⚠️ **Belangrijk:** Zet de `.env` nooit online! Deze bevat je geheime sleutel.

---

## Stap 4: Bibliotheken installeren

1. Open een terminal
2. Navigeer naar je websitemap:
   ```
   cd pad/naar/mijn-website
   ```
   Voorbeeld Windows: `cd C:\Users\JouwNaam\mijn-website`
   Voorbeeld Mac: `cd ~/mijn-website`

3. Installeer de benodigde bibliotheken:
   ```
   npm install
   ```
   Dit duurt even. Je ziet veel tekst voorbij komen — dat is normaal.

---

## Stap 5: Server starten

Typ in de terminal:
```
node server.js
```

Je ziet:
```
🚀 Server draait op http://localhost:5500
📖 Verhalenpagina: http://localhost:5500/schrijfopdracht.html
🔒 Admin paneel:   http://localhost:5500/admin.html
```

Open dan http://localhost:5500 in je browser!

**Server stoppen:** druk `Ctrl + C` in de terminal.

---

## Stap 6: Eerste opdracht aanmaken

1. Ga naar http://localhost:5500/admin.html
2. Klik op de tab **"Schrijfopdracht"**
3. Klik op **"Genereer Nieuwe Opdracht"**
4. Wacht even — Claude maakt nu een opdracht aan!
5. Ga naar http://localhost:5500/schrijfopdracht.html om het te zien

---

## Dagelijks gebruik

### Elke avond (handmatig):

1. Ga naar admin.html → tab **"Inzendingen"**
2. Klik "Laad inzendingen" om alle verhaaljes te zien
3. Ga naar tab **"Dagelijks Script"**
4. Voer de stappen 1-4 uit:
   - **Stap 1:** Klik "Kies Winnaar" → Claude kiest de beste inzending
   - **Stap 2:** Klik "Corrigeer Tekst" (ID wordt automatisch ingevuld)
   - **Stap 3:** Klik "Verhaal Bijwerken"
   - **Stap 4:** Klik "Genereer Opdracht" voor de volgende dag

### Of automatisch (geavanceerd):

Laat `dagelijks.js` automatisch draaien elke avond om 20:00:

**Mac/Linux (cron job):**
```
crontab -e
```
Voeg toe:
```
0 20 * * * node /volledig/pad/naar/dagelijks.js
```

**Windows (Taakplanner):**
1. Open "Taakplanner"
2. Klik "Basistaak maken"
3. Stel in: dagelijks, 20:00
4. Actie: programma starten → `node`
5. Argumenten: `C:\pad\naar\dagelijks.js`

---

## Nieuwe pagina's die zijn toegevoegd

### Voor bezoekers:
- **`/schrijfopdracht.html`** — Hier schrijven kinderen hun verhaaltje
  - Ziet de opdracht van vandaag
  - Tekstvak om te schrijven
  - Drie bolletjes die groen worden
  - Insturenknop actief als alles groen is

- **`/verhaal-overzicht.html`** — Alle hoofdstukken van het grote verhaal

### Voor de beheerder (admin):
- **`/admin.html`** — Uitgebreid met 4 tabs:
  - 📋 Moderatie (ideeën en verhaalversies)
  - 🎯 Schrijfopdracht beheer
  - 📝 Inzendingen bekijken
  - 🌙 Dagelijkse verwerking

---

## Navigatie toevoegen aan index.html

Open `index.html` en zoek de navigatiebalk:
```html
<nav>
    <a href="index.html" class="actief">🏠 Home</a>
    <a href="verhalen.html">📖 Verhalen</a>
</nav>
```

Verander dit naar:
```html
<nav>
    <a href="index.html" class="actief">🏠 Home</a>
    <a href="verhalen.html">📖 Verhalen</a>
    <a href="schrijfopdracht.html">✏️ Schrijfopdracht</a>
    <a href="verhaal-overzicht.html">📚 Ons Verhaal</a>
</nav>
```

---

## Veelgestelde vragen

**Q: Ik zie "Kan geen verbinding maken"**
A: Controleer of de server draait (`node server.js` in terminal)

**Q: Ik krijg "ANTHROPIC_API_KEY is niet ingesteld"**
A: Controleer je `.env` bestand — staat de sleutel er correct in?

**Q: De opdracht van gisteren staat er nog**
A: Genereer handmatig een nieuwe opdracht via admin.html

**Q: Hoe reset ik alle data?**
A: Verwijder de bestanden in de `data/` map. Ze worden opnieuw aangemaakt.

---

## Bestandsoverzicht — wat doet wat?

| Bestand | Wat doet het? |
|---------|---------------|
| `server.js` | De backend: alle API-routes en dataopslag |
| `dagelijks.js` | Automatisch dagelijks script |
| `package.json` | Lijst van benodigde bibliotheken |
| `.env` | Jouw geheime API-sleutel (nooit online!) |
| `schrijfopdracht.html` | Pagina voor kinderen om te schrijven |
| `verhaal-overzicht.html` | Pagina met het volledige verhaal |
| `admin.html` | Beheerderspaneel (uitgebreid) |
| `data/opdrachten.json` | Alle dagelijkse opdrachten |
| `data/inzendingen.json` | Alle ingezonden verhaaltjes |
| `data/verhaal.json` | Het doorlopende grote verhaal |
| `data/pending.json` | Wachtende ideeën en verhaalversies |

---

*Vragen? Kijk nog eens in deze gids of vraag om hulp! 🌟*
