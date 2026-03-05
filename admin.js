// ============================================
// Depeterpost Verhalen Club - Admin Script
// ============================================
// Beheert de admin pagina voor moderatie.
// Geen AI, alles handmatig!
// ============================================

// Bewaar alle pending inzendingen (voor filtering)
let allePending = [];
let huidigFilter = 'alle';

// ── Laad pending inzendingen zodra de pagina klaar is ──
document.addEventListener('DOMContentLoaded', () => {
    laadPending();
});

/**
 * Haal alle pending inzendingen op van de server.
 */
async function laadPending() {
    const lijst = document.getElementById('pendingLijst');

    // Toon laad melding
    lijst.innerHTML = `
        <div class="leeg-melding">
            <span class="emoji">⏳</span>
            <p>Laden...</p>
        </div>
    `;

    try {
        const response = await fetch('/api/admin/pending');
        allePending = await response.json();

        // Update de teller
        document.getElementById('pendingTeller').textContent = allePending.length;

        // Toon de gefilterde lijst
        toonGefilterd();

    } catch (err) {
        console.error('Fout bij laden pending:', err);
        lijst.innerHTML = `
            <div class="leeg-melding">
                <span class="emoji">❌</span>
                <p>Kan geen verbinding maken. Is de server actief?</p>
            </div>
        `;
    }
}

/**
 * Filter de inzendingen op type en toon ze.
 * @param {string} type - 'alle', 'idee', of 'verhaal'
 */
function filterType(type) {
    huidigFilter = type;

    // Pas de knop stijlen aan
    document.querySelectorAll('[id^="filter-"]').forEach(btn => {
        btn.style.opacity = '0.6';
    });
    document.getElementById(`filter-${type}`).style.opacity = '1';

    toonGefilterd();
}

/**
 * Toon de inzendingen gefilterd op het huidige filter.
 */
function toonGefilterd() {
    const gefilterd = huidigFilter === 'alle'
        ? allePending
        : allePending.filter(i => i.type === huidigFilter);

    toonLijst(gefilterd);
}

/**
 * Render de lijst van inzendingen als HTML kaarten.
 * @param {Array} inzendingen - Array van inzending objecten
 */
function toonLijst(inzendingen) {
    const lijst = document.getElementById('pendingLijst');

    if (inzendingen.length === 0) {
        lijst.innerHTML = `
            <div class="leeg-melding">
                <span class="emoji">🎉</span>
                <p>Geen inzendingen in de wachtrij!</p>
            </div>
        `;
        return;
    }

    // Maak een kaart voor elke inzending
    lijst.innerHTML = inzendingen.map(inzending => maakPendingKaart(inzending)).join('');
}

/**
 * Maak HTML voor één pending kaart.
 * @param {Object} inzending - Het inzending object
 * @returns {string} HTML string
 */
function maakPendingKaart(inzending) {
    const isVerhaal = inzending.type === 'verhaal';
    const typeLabel = isVerhaal ? 'verhaal' : 'idee';
    const typeEmoji = isVerhaal ? '📖' : '💡';

    // Extra info voor verhalen: van welk basisverhaal?
    const verhaalInfo = isVerhaal && inzending.verhaalTitel
        ? `<p style="font-size: 0.82rem; color: #888; margin-bottom: 6px;">
                📌 Versie van: <strong>${escapeHTML(inzending.verhaalTitel)}</strong>
             </p>`
        : '';

    return `
        <div class="pending-kaart ${isVerhaal ? 'type-verhaal' : ''}" id="kaart-${inzending.id}">

            <!-- Meta info: naam + type label -->
            <div class="pending-meta">
                <span class="pending-naam">
                    ${typeEmoji} ${escapeHTML(inzending.naam)}
                </span>
                <span class="type-label ${typeLabel}">${typeLabel.toUpperCase()}</span>
            </div>

            <!-- Datum + eventueel verhaal info -->
            <p class="pending-datum">📅 ${inzending.datum}</p>
            ${verhaalInfo}

            <!-- De ingezonden tekst -->
            <div class="pending-tekst">${escapeHTML(inzending.tekst).replace(/\n/g, '<br>')}</div>

            <!-- Actie knoppen: goedkeuren of weigeren -->
            <div class="actie-knoppen">
                <button
                    class="knop knop-groen"
                    onclick="keurGoed('${inzending.id}')"
                    id="goedkeur-${inzending.id}"
                >
                    ✅ Goedkeuren
                </button>
                <button
                    class="knop knop-rood"
                    onclick="weiger('${inzending.id}')"
                    id="weiger-${inzending.id}"
                >
                    🗑️ Weigeren
                </button>
            </div>

        </div>
    `;
}

/**
 * Keur een inzending goed.
 * @param {string} id - Het ID van de inzending
 */
async function keurGoed(id) {
    const knop = document.getElementById(`goedkeur-${id}`);
    knop.disabled = true;
    knop.innerHTML = '<span class="laad-spinner"></span> Goedkeuren...';

    try {
        const response = await fetch(`/api/admin/approve/${id}`, {
            method: 'POST'
        });
        const data = await response.json();

        if (data.succes) {
            // Verwijder de kaart met animatie
            verwijderKaart(id);
            // Update de teller
            allePending = allePending.filter(i => i.id !== id);
            document.getElementById('pendingTeller').textContent = allePending.length;
        } else {
            alert('Fout: ' + data.bericht);
            knop.disabled = false;
            knop.innerHTML = '✅ Goedkeuren';
        }
    } catch (err) {
        console.error('Fout bij goedkeuren:', err);
        alert('Kon geen verbinding maken met de server.');
        knop.disabled = false;
        knop.innerHTML = '✅ Goedkeuren';
    }
}

/**
 * Weiger en verwijder een inzending.
 * @param {string} id - Het ID van de inzending
 */
async function weiger(id) {
    // Vraag bevestiging
    if (!confirm('Weet je zeker dat je deze inzending wilt weigeren en verwijderen?')) {
        return;
    }

    const knop = document.getElementById(`weiger-${id}`);
    knop.disabled = true;
    knop.innerHTML = '<span class="laad-spinner"></span> Verwijderen...';

    try {
        const response = await fetch(`/api/admin/reject/${id}`, {
            method: 'POST'
        });
        const data = await response.json();

        if (data.succes) {
            verwijderKaart(id);
            allePending = allePending.filter(i => i.id !== id);
            document.getElementById('pendingTeller').textContent = allePending.length;
        } else {
            alert('Fout: ' + data.bericht);
            knop.disabled = false;
            knop.innerHTML = '🗑️ Weigeren';
        }
    } catch (err) {
        console.error('Fout bij weigeren:', err);
        alert('Kon geen verbinding maken met de server.');
        knop.disabled = false;
        knop.innerHTML = '🗑️ Weigeren';
    }
}

/**
 * Verwijder een kaart met een fade-out animatie.
 * @param {string} id - Het ID van de inzending
 */
function verwijderKaart(id) {
    const kaart = document.getElementById(`kaart-${id}`);
    if (kaart) {
        // Fade out animatie
        kaart.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        kaart.style.opacity = '0';
        kaart.style.transform = 'scale(0.95)';

        // Verwijder na animatie
        setTimeout(() => {
            kaart.remove();

            // Als er geen kaarten meer zijn, toon leeg melding
            const lijst = document.getElementById('pendingLijst');
            if (lijst && !lijst.querySelector('.pending-kaart')) {
                toonGefilterd();
            }
        }, 300);
    }
}

/**
 * Beveilig tekst (zelfde functie als in script.js).
 */
function escapeHTML(tekst) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(tekst));
    return div.innerHTML;
}