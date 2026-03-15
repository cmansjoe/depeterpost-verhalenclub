// ============================================
// WoordSpeler - Dagelijks Script
// ============================================
// Dit script draai je elke avond (bijv. om 20:00)
// om automatisch:
//   1. De winnaar te kiezen
//   2. De tekst te corrigeren
//   3. Het verhaal bij te werken
//   4. De opdracht voor morgen te genereren
//
// HOE GEBRUIKEN:
//   node dagelijks.js
//
// OF automatisch plannen (cron job):
//   crontab -e
//   Voeg toe: 0 20 * * * node /pad/naar/dagelijks.js
// ============================================

const BASE_URL = 'http://localhost:5500';

async function haalJSON(url, opties = {}) {
    const response = await fetch(url, opties);
    return response.json();
}

async function dagelijksScript() {
    console.log('\n🌙 Start dagelijks script...\n');

    // ── Stap 1: Kies de winnaar van vandaag ──
    console.log('🏆 Stap 1: Winnaar kiezen...');
    const winnaarResultaat = await haalJSON(`${BASE_URL}/api/admin/kies-winnaar`, { method: 'POST' });

    if (!winnaarResultaat.succes) {
        console.log('⚠️  Geen winnaar gevonden:', winnaarResultaat.bericht);
        // Ga toch door met opdracht genereren
    } else {
        console.log(`✅ Winnaar: ${winnaarResultaat.winnaar.naam}`);
        console.log(`   Reden: ${winnaarResultaat.reden}`);

        // ── Stap 2: Corrigeer de winnende tekst ──
        console.log('\n✏️  Stap 2: Tekst corrigeren...');
        const corrigeerResultaat = await haalJSON(`${BASE_URL}/api/admin/corrigeer-winnaar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ inzendingId: winnaarResultaat.winnaar.id })
        });

        if (!corrigeerResultaat.succes) {
            console.log('⚠️  Fout bij corrigeren:', corrigeerResultaat.bericht);
        } else {
            console.log(`✅ Wijzigingen: ${corrigeerResultaat.wijzigingen}`);

            // ── Stap 3: Update het verhaal ──
            console.log('\n📖 Stap 3: Verhaal bijwerken...');
            const updateResultaat = await haalJSON(`${BASE_URL}/api/admin/update-verhaal`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inzendingId: winnaarResultaat.winnaar.id })
            });

            if (!updateResultaat.succes) {
                console.log('⚠️  Fout bij updaten:', updateResultaat.bericht);
            } else {
                console.log(`✅ Hoofdstuk ${updateResultaat.hoofdstuk.nummer} toegevoegd!`);
            }
        }
    }

    // ── Stap 4: Genereer opdracht voor morgen ──
    console.log('\n🎯 Stap 4: Opdracht voor morgen genereren...');
    const opdrachtResultaat = await haalJSON(`${BASE_URL}/api/admin/genereer-opdracht`, { method: 'POST' });

    if (!opdrachtResultaat.succes) {
        console.log('⚠️  Fout bij genereren opdracht:', opdrachtResultaat.bericht);
    } else {
        console.log('✅ Nieuwe opdracht gegenereerd!');
        console.log(`   Personage: ${opdrachtResultaat.opdracht.personage}`);
        console.log(`   Omgeving:  ${opdrachtResultaat.opdracht.omgeving}`);
        console.log(`   Datum:     ${opdrachtResultaat.opdracht.datum}`);
    }

    console.log('\n🎉 Dagelijks script klaar!\n');
}

// Voer het script uit
dagelijksScript().catch(err => {
    console.error('❌ Fout in dagelijks script:', err);
    process.exit(1);
});
