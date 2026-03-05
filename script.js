// ============================================
// Depeterpost Verhalen Club - Frontend Script
// ============================================
// Dit bestand regelt alles op de homepage
// en de verhalenpagina voor bezoekers.
// ============================================

// Huidige video ID voor view-teller en sterrenrating
let currentVideoId = "VIDEO1";

// ── Wacht tot de pagina volledig geladen is ──
document.addEventListener('DOMContentLoaded', () => {
    // Laad goedgekeurde verhalen als we op de verhalenpagina zijn
    if (document.getElementById('goedgekeurde-versies-verhaal-1')) {
        laadGoedgekeurdeVersies();
    }

    // Koppel het ideeformulier als we op de homepage zijn
    const ideeFormulier = document.getElementById('ideeFormulier');
    if (ideeFormulier) {
        ideeFormulier.addEventListener('submit', verstuurIdee);
    }
});

// ============================================
// IDEE FORMULIER (Homepage)
// ============================================

/**
 * Verstuur een nieuw idee naar de server.
 * Wordt aangeroepen als het formulier ingediend wordt.
 */
async function verstuurIdee(event) {
    // Voorkom dat de pagina herlaadt
    event.preventDefault();

    // Haal de waarden op uit het formulier
    const naam = document.getElementById('ideeNaam').value.trim();
    const tekst = document.getElementById('ideeTekst').value.trim();

    // Haal de knoppen en meldingen op
    const knop = document.getElementById('ideeVerzendKnop');
    const succes = document.getElementById('ideeSucces');
    const fout = document.getElementById('ideeFout');

    // Verberg oude meldingen
    succes.style.display = 'none';
    fout.style.display = 'none';

    // Toon laad animatie op de knop
    knop.disabled = true;
    knop.innerHTML = '<span class="laad-spinner"></span> Versturen...';

    try {
        // Stuur POST verzoek naar de server
        const response = await fetch('/api/idee', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ naam, tekst })
        });

        const data = await response.json();

        if (data.succes) {
            // Succes! Toon bevestiging en maak formulier leeg
            succes.style.display = 'block';
            document.getElementById('ideeFormulier').reset();
        } else {
            // Fout van de server
            fout.textContent = data.bericht || 'Er ging iets mis.';
            fout.style.display = 'block';
        }
    } catch (err) {
        // Netwerkfout of andere fout
        console.error('Fout bij versturen idee:', err);
        fout.textContent = '😕 Kan geen verbinding maken met de server.';
        fout.style.display = 'block';
    }

    // Herstel de knop
    knop.disabled = false;
    knop.innerHTML = '🚀 Verstuur Mijn Idee!';
}

// ============================================
// VERHALEN PAGINA - VERSIE FORMULIER
// ============================================

/**
 * Toon of verberg het formulier om een verhaalversie in te sturen.
 * @param {string} formulierId - Het ID van het formulier element
 */
function toggleVersieFormulier(formulierId) {
    const formulier = document.getElementById(formulierId);
    if (formulier) {
        formulier.classList.toggle('zichtbaar');

        // Scroll naar het formulier als het geopend wordt
        if (formulier.classList.contains('zichtbaar')) {
            setTimeout(() => {
                formulier.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
        }
    }
}

/**
 * Verstuur een bezoeker-versie van een verhaal.
 * @param {Event} event - Het submit event
 * @param {string} verhaalId - ID van het basisverhaal (bijv. 'verhaal-1')
 * @param {string} verhaalTitel - Titel van het basisverhaal
 * @param {string} suffix - Uniek suffix voor de form elementen (bijv. 'v1')
 */
async function verstuurVerhaal(event, verhaalId, verhaalTitel, suffix) {
    event.preventDefault();

    const naam = document.getElementById(`naam-${suffix}`).value.trim();
    const tekst = document.getElementById(`tekst-${suffix}`).value.trim();
    const succesEl = document.getElementById(`succes-${suffix}`);
    const foutEl = document.getElementById(`fout-${suffix}`);

    // Verberg oude meldingen
    succesEl.style.display = 'none';
    foutEl.style.display = 'none';

    // Vind de submit knop in dit formulier
    const formulier = event.target;
    const knop = formulier.querySelector('button[type="submit"]');
    const origineleTekst = knop.innerHTML;
    knop.disabled = true;
    knop.innerHTML = '<span class="laad-spinner"></span> Versturen...';

    try {
        const response = await fetch('/api/verhaal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ naam, tekst, verhaalId, verhaalTitel })
        });

        const data = await response.json();

        if (data.succes) {
            succesEl.style.display = 'block';
            formulier.reset(); // Formulier leegmaken
        } else {
            foutEl.textContent = data.bericht || 'Er ging iets mis.';
            foutEl.style.display = 'block';
        }
    } catch (err) {
        console.error('Fout bij versturen verhaal:', err);
        foutEl.textContent = '😕 Kan geen verbinding maken. Controleer of de server draait.';
        foutEl.style.display = 'block';
    }

    knop.disabled = false;
    knop.innerHTML = origineleTekst;
}

// ============================================
// GOEDGEKEURDE VERSIES LADEN
// ============================================

/**
 * Laad alle goedgekeurde verhaalversies van de server
 * en toon ze bij het juiste basisverhaal.
 */
async function laadGoedgekeurdeVersies() {
    try {
        const response = await fetch('/api/verhalen');
        const verhalen = await response.json();

        // Groepeer verhalen per basisverhaal
        const verhaalGroepen = {};
        verhalen.forEach(v => {
            if (!verhaalGroepen[v.verhaalId]) {
                verhaalGroepen[v.verhaalId] = [];
            }
            verhaalGroepen[v.verhaalId].push(v);
        });

        // Loop door alle basisverhalen en toon de versies
        ['verhaal-1', 'verhaal-2'].forEach(id => {
            const container = document.getElementById(`goedgekeurde-versies-${id}`);
            if (!container) return;

            const versies = verhaalGroepen[id] || [];

            if (versies.length === 0) {
                container.innerHTML = '<p class="geen-versies">Nog geen versies. Wees de eerste! 👆</p>';
            } else {
                container.innerHTML = versies.map(v => maakVersieKaart(v)).join('');
            }
        });

    } catch (err) {
        console.error('Fout bij laden versies:', err);
    }
}

/**
 * Maak HTML voor één versie-kaart.
 * @param {Object} versie - Het versie object
 * @returns {string} HTML string
 */
function maakVersieKaart(versie) {
    return `
        <div class="versie-kaart">
            <p class="versie-naam">✍️ ${escapeHTML(versie.naam)}</p>
            <p class="versie-datum">📅 ${versie.datum}</p>
            <p class="versie-tekst">${escapeHTML(versie.tekst).replace(/\n/g, '<br>')}</p>
        </div>
    `;
}

/**
 * Beveilig tekst tegen HTML injectie (XSS bescherming).
 * Vervang speciale HTML tekens door hun veilige versies.
 * @param {string} tekst - De onveilige tekst
 * @returns {string} Veilige tekst
 */
function escapeHTML(tekst) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(tekst));
    return div.innerHTML;
}
// ============================================
// VIDEO STATS: VIEWS & RATINGS
// ============================================

function increaseView(id) {
  fetch("/api/view/" + id, { method: "POST" });
}

function rate(star) {
  fetch("/api/rate/" + currentVideoId, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rating: star })
  })
    .then(res => res.json())
    .then(data => {
      document.getElementById("avgRating").textContent = data.average;
      document.getElementById("totalRatings").textContent = data.totalRatings;
    });
}

function loadStats(id) {
  fetch("/api/stats/" + id)
    .then(res => res.json())
    .then(data => {
      document.getElementById("viewCount").textContent = data.views;
      document.getElementById("avgRating").textContent = data.average;
      document.getElementById("totalRatings").textContent = data.totalRatings;
    });
}

window.onload = function () {
  loadStats(currentVideoId);
  increaseView(currentVideoId);
};
