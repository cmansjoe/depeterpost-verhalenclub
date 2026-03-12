const express   = require('express');
const fs        = require('fs');
const path      = require('path');
const crypto    = require('crypto');
const Anthropic = require('@anthropic-ai/sdk');
const nodemailer = require('nodemailer');

require('dotenv').config();

const app    = express();
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ── Data paden ──
const DATA_DIR          = path.join(__dirname, 'data');
const OPDRACHTEN_PAD    = path.join(DATA_DIR, 'opdrachten.json');
const INZENDINGEN_PAD   = path.join(DATA_DIR, 'inzendingen.json');
const VERHAAL_PAD       = path.join(DATA_DIR, 'verhaal.json');
const PENDING_PAD       = path.join(DATA_DIR, 'pending.json');
const VIEWS_PAD         = path.join(DATA_DIR, 'views.json');
const VERHALEN_PAD      = path.join(DATA_DIR, 'verhalen.json');
const RATINGS_PAD       = path.join(DATA_DIR, 'ratings.json');
const GEBRUIKERS_PAD    = path.join(DATA_DIR, 'gebruikers.json');
const SESSIES_PAD       = path.join(DATA_DIR, 'sessies.json');
const PROJECTEN_PAD     = path.join(DATA_DIR, 'projecten.json');
const VIDEOS_PAD        = path.join(DATA_DIR, 'videos.json');
const VERIFICATIE_PAD   = path.join(DATA_DIR, 'verificatie.json');
const RESET_PAD                  = path.join(DATA_DIR, 'wachtwoord_reset.json');
const PERSOONLIJKE_VERHALEN_PAD  = path.join(DATA_DIR, 'persoonlijke-verhalen.json');
const INGEZONDEN_VERHALEN_PAD    = path.join(DATA_DIR, 'ingezonden-verhalen.json');
const INSPIRATIE_PAD             = path.join(DATA_DIR, 'inspiratie-bibliotheek.json');
const SAMEN_SESSIES_PAD          = path.join(DATA_DIR, 'samen-sessies.json');

// In-memory SSE verbindingen per sessie: code → [res, res, ...]
const sseVerbindingen = new Map();

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ── E-mail transporter (Gmail) ──
function maakTransporter() {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_GEBRUIKER,
            pass: process.env.EMAIL_WACHTWOORD  // App-wachtwoord van Gmail
        }
    });
}

async function stuurMail(naar, onderwerp, html) {
    try {
        const transporter = maakTransporter();
        await transporter.sendMail({
            from: `"Depeterpost Verhalen Club" <${process.env.EMAIL_GEBRUIKER}>`,
            to: naar,
            subject: onderwerp,
            html
        });
        return true;
    } catch (err) {
        console.error('E-mail fout:', err.message);
        return false;
    }
}

// ── Hulpfuncties ──
function leesJSON(pad, standaard) {
    if (!fs.existsSync(pad)) return standaard;
    try { return JSON.parse(fs.readFileSync(pad, 'utf8')); }
    catch (e) { return standaard; }
}

function schrijfJSON(pad, data) {
    fs.writeFileSync(pad, JSON.stringify(data, null, 2), 'utf8');
}

function extractEersteJsonBlok(tekst) {
    const start = tekst.indexOf('{');
    if (start === -1) return null;
    let depth = 0, inString = false, escape = false;
    for (let i = start; i < tekst.length; i++) {
        const c = tekst[i];
        if (escape)            { escape = false; continue; }
        if (c === '\\' && inString) { escape = true; continue; }
        if (c === '"')         { inString = !inString; continue; }
        if (inString)          continue;
        if (c === '{')         depth++;
        else if (c === '}') { depth--; if (depth === 0) return tekst.slice(start, i + 1); }
    }
    return null;
}

function parseAIJson(tekst) {
    let schoon = tekst.replace(/```json/gi, '').replace(/```/g, '').trim();
    schoon = schoon.replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ');
    const blok = extractEersteJsonBlok(schoon);
    if (!blok) throw new Error('Geen geldige JSON gevonden in AI antwoord');
    try { return JSON.parse(blok); }
    catch (e) {
        try {
            let gerepareerd = blok
                .replace(/\/\/[^\n]*/g, '')
                .replace(/\/\*[\s\S]*?\*\//g, '')
                .replace(/,\s*([}\]])/g, '$1')
                .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
                .replace(/:\s*'([^']*)'/g, ': "$1"')
                .trim();
            return JSON.parse(gerepareerd);
        } catch (e2) {
            throw new Error(`Kan AI-antwoord niet als JSON verwerken: ${e2.message}`);
        }
    }
}

// ── Inspiratiebibliotheek helper ──
// Kiest ongebruikte of zeldzaam gebruikte elementen uit de bibliotheek
// zodat de AI altijd verse inspiratie krijgt en nooit herhaalt.
function kiesInspiratie(groep) {
    const lib = leesJSON(INSPIRATIE_PAD, {});
    const opdrachten = leesJSON(OPDRACHTEN_PAD, []);

    // Verzamel wat al eerder gebruikt is
    const gebruiktePersonages = new Set(opdrachten.map(o => (o.personage || '').toLowerCase()));
    const gebruikteOmgevingen  = new Set(opdrachten.map(o => (o.omgeving  || '').toLowerCase()));
    function kiesOngebruikt(lijst, gebruikte, aantal = 1) {
        if (!lijst?.length) return [];
        const ongebruikt = lijst.filter(item =>
            !Array.from(gebruikte).some(g => item.toLowerCase().includes(g) || g.includes(item.toLowerCase().split(' ')[0]))
        );
        const pool = ongebruikt.length >= aantal ? ongebruikt : lijst;
        const geschud = [...pool].sort(() => Math.random() - 0.5);
        return geschud.slice(0, aantal);
    }

    const themaPool   = [...(lib.themas?.[groep] || []), ...(lib.themas?.B || [])];
    const gekozenThemas    = kiesOngebruikt(themaPool, new Set(), 2);
    const gekozenOmgeving  = kiesOngebruikt(lib.omgevingen || [], gebruikteOmgevingen, 2);
    const gekozenPersonage = kiesOngebruikt(lib.personageTyepen || [], gebruiktePersonages, 2);
    const gekozenObject    = kiesOngebruikt(lib.magischeObjecten || [], new Set(), 1);
    const gekozenDier      = kiesOngebruikt(lib.dieren || [], new Set(), 1);
    const gekozenHook      = kiesOngebruikt(lib.plotHooks || [], new Set(), 1);
    const gekozenQuest     = kiesOngebruikt((lib.quests?.[groep] || lib.quests?.B || []), new Set(), 1);

    return { gekozenThemas, gekozenOmgeving, gekozenPersonage, gekozenObject, gekozenDier, gekozenHook, gekozenQuest };
}

function hashWachtwoord(ww) {
    return crypto.createHash('sha256').update(ww + 'depeterpost-salt-2024').digest('hex');
}

function maakToken() {
    return crypto.randomBytes(32).toString('hex');
}

function maakCode(lengte = 6) {
    return crypto.randomInt(100000, 999999).toString();
}

// ── Initialiseer databestanden ──
if (!fs.existsSync(VERHAAL_PAD)) {
    schrijfJSON(VERHAAL_PAD, {
        titel: "Het Grote Avontuur van de Verhalen Club",
        samenvatting: "Dit is het begin van een groot doorlopend verhaal, geschreven door alle kinderen samen.",
        hoofdstukken: [],
        personages: ["Blauwje de draak", "Tina de wolkenmaker", "Dapper de hond"],
        locaties: ["Het Betoverde Woud", "Domdorp", "De Regenboogbrug"]
    });
}
if (!fs.existsSync(OPDRACHTEN_PAD))  schrijfJSON(OPDRACHTEN_PAD, []);
if (!fs.existsSync(INZENDINGEN_PAD)) schrijfJSON(INZENDINGEN_PAD, []);
if (!fs.existsSync(PENDING_PAD))     schrijfJSON(PENDING_PAD, []);
if (!fs.existsSync(VIEWS_PAD))       schrijfJSON(VIEWS_PAD, {});
if (!fs.existsSync(VERHALEN_PAD))    schrijfJSON(VERHALEN_PAD, []);
if (!fs.existsSync(RATINGS_PAD))     schrijfJSON(RATINGS_PAD, {});
if (!fs.existsSync(GEBRUIKERS_PAD))  schrijfJSON(GEBRUIKERS_PAD, []);
if (!fs.existsSync(SESSIES_PAD))     schrijfJSON(SESSIES_PAD, []);
if (!fs.existsSync(PROJECTEN_PAD))   schrijfJSON(PROJECTEN_PAD, []);
if (!fs.existsSync(VERIFICATIE_PAD)) schrijfJSON(VERIFICATIE_PAD, []);
if (!fs.existsSync(RESET_PAD))       schrijfJSON(RESET_PAD, []);
if (!fs.existsSync(VIDEOS_PAD)) {
    schrijfJSON(VIDEOS_PAD, [{
        id: "video-1",
        titel: "Welkom bij de Verhalen Club!",
        beschrijving: "De eerste video van de Depeterpost Verhalen Club.",
        type: "youtube",
        bronUrl: "https://www.youtube.com/embed/cEbgBSsMKj0",
        youtubeId: "cEbgBSsMKj0",
        thumbnail: "",
        datum: new Date().toISOString().split('T')[0],
        volgorde: 1,
        views: 0
    }]);
}

// ════════════════════════════════════════
// MIDDLEWARE
// ════════════════════════════════════════
function checkAdmin(req, res, next) {
    const token = req.headers['x-admin-token'];
    if (!token) return res.status(401).json({ succes: false, bericht: 'Niet ingelogd.' });
    const sessies = leesJSON(SESSIES_PAD, []);
    const sessie = sessies.find(s => s.token === token && s.type === 'admin');
    if (!sessie) return res.status(401).json({ succes: false, bericht: 'Ongeldige sessie.' });
    if (Date.now() - sessie.aangemaakt > 8 * 60 * 60 * 1000) {
        schrijfJSON(SESSIES_PAD, sessies.filter(s => s.token !== token));
        return res.status(401).json({ succes: false, bericht: 'Sessie verlopen.' });
    }
    next();
}

function checkGebruiker(req, res, next) {
    const token = req.headers['x-user-token'];
    if (!token) return res.status(401).json({ succes: false, bericht: 'Niet ingelogd.' });
    const sessies = leesJSON(SESSIES_PAD, []);
    const sessie = sessies.find(s => s.token === token && s.type === 'gebruiker');
    if (!sessie) return res.status(401).json({ succes: false, bericht: 'Ongeldige sessie.' });
    req.gebruikerId = sessie.gebruikerId;
    next();
}

// ════════════════════════════════════════
// AUTH: Admin
// ════════════════════════════════════════
app.post('/api/auth/admin/login', (req, res) => {
    const { wachtwoord } = req.body;
    if (wachtwoord !== (process.env.ADMIN_WACHTWOORD || 'admin123')) {
        return res.json({ succes: false, bericht: 'Verkeerd wachtwoord.' });
    }
    const token = maakToken();
    const sessies = leesJSON(SESSIES_PAD, []);
    sessies.push({ token, type: 'admin', aangemaakt: Date.now() });
    schrijfJSON(SESSIES_PAD, sessies);
    res.json({ succes: true, token });
});

app.post('/api/auth/admin/logout', (req, res) => {
    const token = req.headers['x-admin-token'];
    if (token) schrijfJSON(SESSIES_PAD, leesJSON(SESSIES_PAD, []).filter(s => s.token !== token));
    res.json({ succes: true });
});

// ════════════════════════════════════════
// AUTH: Registratie met e-mailverificatie
// ════════════════════════════════════════
app.post('/api/auth/registreer', async (req, res) => {
    const { gebruikersnaam, wachtwoord, email, avatar, leeftijdsgroep, regelsGeaccepteerd } = req.body;

    // Validatie
    if (!gebruikersnaam || !wachtwoord || !email) {
        return res.json({ succes: false, bericht: 'Gebruikersnaam, e-mailadres en wachtwoord zijn verplicht.' });
    }
    if (!regelsGeaccepteerd) {
        return res.json({ succes: false, bericht: 'Je moet de gebruiksregels accepteren om mee te doen.' });
    }
    if (gebruikersnaam.trim().length < 2) {
        return res.json({ succes: false, bericht: 'Gebruikersnaam moet minstens 2 tekens lang zijn.' });
    }
    if (wachtwoord.length < 6) {
        return res.json({ succes: false, bericht: 'Wachtwoord moet minstens 6 tekens lang zijn.' });
    }
    // E-mail validatie
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
        return res.json({ succes: false, bericht: 'Voer een geldig e-mailadres in.' });
    }

    const gebruikers = leesJSON(GEBRUIKERS_PAD, []);

    // Unieke gebruikersnaam
    if (gebruikers.find(g => g.gebruikersnaam.toLowerCase() === gebruikersnaam.toLowerCase().trim())) {
        return res.json({ succes: false, bericht: 'Deze gebruikersnaam is al bezet. Kies een andere!' });
    }
    // Uniek e-mail
    if (gebruikers.find(g => g.email?.toLowerCase() === email.toLowerCase().trim())) {
        return res.json({ succes: false, bericht: 'Dit e-mailadres is al in gebruik.' });
    }

    const nieuweGebruiker = {
        id: `user-${Date.now()}`,
        gebruikersnaam: gebruikersnaam.trim(),
        wachtwoordHash: hashWachtwoord(wachtwoord),
        email: email.toLowerCase().trim(),
        emailGeverifieerd: false,
        avatar: avatar || '🦁',
        leeftijdsgroep: leeftijdsgroep || 'B',
        punten: 0,
        badges: [],
        aangemeldOp: new Date().toISOString(),
        aantalInzendingen: 0,
        aantalWinsten: 0,
        aaneengeslotenDagen: 0,
        laasteInzending: null,
        regelsGeaccepteerd: true,
        regelsGeaccepteerdOp: new Date().toISOString()
    };

    gebruikers.push(nieuweGebruiker);
    schrijfJSON(GEBRUIKERS_PAD, gebruikers);

    // Stuur verificatiecode
    const code = maakCode();
    const verificaties = leesJSON(VERIFICATIE_PAD, []);
    // Verwijder oude codes van dit e-mail
    const gefilterd = verificaties.filter(v => v.email !== email.toLowerCase().trim());
    gefilterd.push({
        email: email.toLowerCase().trim(),
        gebruikerId: nieuweGebruiker.id,
        code,
        aangemaakt: Date.now(),
        verlopen: Date.now() + 30 * 60 * 1000 // 30 minuten geldig
    });
    schrijfJSON(VERIFICATIE_PAD, gefilterd);

    // Stuur e-mail (maar ga door ook als e-mail mislukt)
    const emailVerstuurd = await stuurMail(
        email.trim(),
        '✉️ Bevestig je e-mailadres — Depeterpost Verhalen Club',
        `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #7C3AED; font-size: 28px;">📬 Welkom bij de Verhalen Club!</h1>
            <p style="font-size: 16px; color: #333;">Hallo <strong>${gebruikersnaam}</strong>! 👋</p>
            <p style="font-size: 16px; color: #333;">Super dat je meedoet! Vul deze code in om je e-mailadres te bevestigen:</p>
            <div style="background: linear-gradient(135deg, #7C3AED, #E8197D); color: white; font-size: 36px; font-weight: bold; text-align: center; padding: 20px; border-radius: 16px; letter-spacing: 8px; margin: 24px 0;">
                ${code}
            </div>
            <p style="font-size: 14px; color: #888;">⏰ Deze code is 30 minuten geldig.</p>
            <p style="font-size: 14px; color: #888;">Als jij je niet hebt aangemeld, kun je deze e-mail negeren.</p>
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #aaa;">Depeterpost Verhalen Club 📚</p>
        </div>
        `
    );

    // Geef token terug voor direct inloggen (voor als verificatie later kan)
    const token = maakToken();
    const sessies = leesJSON(SESSIES_PAD, []);
    sessies.push({ token, type: 'gebruiker', gebruikerId: nieuweGebruiker.id, aangemaakt: Date.now() });
    schrijfJSON(SESSIES_PAD, sessies);

    const { wachtwoordHash, ...veiligeProfiel } = nieuweGebruiker;
    res.json({
        succes: true,
        token,
        gebruiker: veiligeProfiel,
        verificatieVereist: true,
        emailVerstuurd,
        bericht: emailVerstuurd
            ? `We hebben een verificatiecode gestuurd naar ${email}`
            : 'Account aangemaakt! E-mail kon niet verstuurd worden, vraag de beheerder om verificatie.'
    });
});

// ── Verifieer e-mail code ──
app.post('/api/auth/verifieer-email', (req, res) => {
    const { code, gebruikerId } = req.body;
    if (!code || !gebruikerId) {
        return res.json({ succes: false, bericht: 'Code en gebruiker zijn verplicht.' });
    }

    const verificaties = leesJSON(VERIFICATIE_PAD, []);
    const verificatie = verificaties.find(v => v.gebruikerId === gebruikerId && v.code === code.trim());

    if (!verificatie) {
        return res.json({ succes: false, bericht: 'Onjuiste code. Probeer het opnieuw.' });
    }
    if (Date.now() > verificatie.verlopen) {
        schrijfJSON(VERIFICATIE_PAD, verificaties.filter(v => v.gebruikerId !== gebruikerId));
        return res.json({ succes: false, bericht: 'Code verlopen. Vraag een nieuwe code aan.' });
    }

    // Markeer e-mail als geverifieerd
    const gebruikers = leesJSON(GEBRUIKERS_PAD, []);
    const idx = gebruikers.findIndex(g => g.id === gebruikerId);
    if (idx !== -1) {
        gebruikers[idx].emailGeverifieerd = true;
        schrijfJSON(GEBRUIKERS_PAD, gebruikers);
    }

    // Verwijder verificatiecode
    schrijfJSON(VERIFICATIE_PAD, verificaties.filter(v => v.gebruikerId !== gebruikerId));

    res.json({ succes: true, bericht: 'E-mail bevestigd! Welkom bij de club! 🎉' });
});

// ── Stuur verificatiecode opnieuw ──
app.post('/api/auth/stuur-verificatie-opnieuw', async (req, res) => {
    const { gebruikerId } = req.body;
    const gebruikers = leesJSON(GEBRUIKERS_PAD, []);
    const gebruiker = gebruikers.find(g => g.id === gebruikerId);
    if (!gebruiker) return res.json({ succes: false, bericht: 'Gebruiker niet gevonden.' });
    if (gebruiker.emailGeverifieerd) return res.json({ succes: false, bericht: 'E-mail is al bevestigd.' });

    const code = maakCode();
    const verificaties = leesJSON(VERIFICATIE_PAD, []);
    const gefilterd = verificaties.filter(v => v.gebruikerId !== gebruikerId);
    gefilterd.push({
        email: gebruiker.email,
        gebruikerId,
        code,
        aangemaakt: Date.now(),
        verlopen: Date.now() + 30 * 60 * 1000
    });
    schrijfJSON(VERIFICATIE_PAD, gefilterd);

    const ok = await stuurMail(
        gebruiker.email,
        '🔢 Nieuwe verificatiecode — Depeterpost Verhalen Club',
        `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;">
            <h2 style="color:#7C3AED;">Nieuwe verificatiecode</h2>
            <p>Hallo <strong>${gebruiker.gebruikersnaam}</strong>! Hier is je nieuwe code:</p>
            <div style="background:linear-gradient(135deg,#7C3AED,#E8197D);color:white;font-size:36px;font-weight:bold;text-align:center;padding:20px;border-radius:16px;letter-spacing:8px;margin:24px 0;">${code}</div>
            <p style="color:#888;font-size:14px;">⏰ Geldig voor 30 minuten.</p>
        </div>`
    );

    res.json({ succes: ok, bericht: ok ? 'Nieuwe code verstuurd!' : 'E-mail kon niet verstuurd worden.' });
});

// ════════════════════════════════════════
// AUTH: Login
// ════════════════════════════════════════
app.post('/api/auth/login', (req, res) => {
    const { gebruikersnaam, wachtwoord } = req.body;
    const gebruikers = leesJSON(GEBRUIKERS_PAD, []);
    // Login met gebruikersnaam OF e-mail
    const gebruiker = gebruikers.find(g =>
        g.gebruikersnaam.toLowerCase() === gebruikersnaam?.toLowerCase().trim() ||
        g.email?.toLowerCase() === gebruikersnaam?.toLowerCase().trim()
    );
    if (!gebruiker || gebruiker.wachtwoordHash !== hashWachtwoord(wachtwoord)) {
        return res.json({ succes: false, bericht: 'Gebruikersnaam of wachtwoord klopt niet.' });
    }

    const token = maakToken();
    const sessies = leesJSON(SESSIES_PAD, []);
    sessies.push({ token, type: 'gebruiker', gebruikerId: gebruiker.id, aangemaakt: Date.now() });
    schrijfJSON(SESSIES_PAD, sessies);

    const { wachtwoordHash, ...veiligeProfiel } = gebruiker;
    res.json({
        succes: true,
        token,
        gebruiker: veiligeProfiel,
        verificatieVereist: !gebruiker.emailGeverifieerd
    });
});

// ════════════════════════════════════════
// AUTH: Wachtwoord vergeten / resetten
// ════════════════════════════════════════
app.post('/api/auth/wachtwoord-vergeten', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.json({ succes: false, bericht: 'E-mailadres is verplicht.' });

    const gebruikers = leesJSON(GEBRUIKERS_PAD, []);
    const gebruiker = gebruikers.find(g => g.email?.toLowerCase() === email.toLowerCase().trim());

    // Altijd succes teruggeven (veiligheid: nooit verklappen of e-mail bestaat)
    if (!gebruiker) {
        return res.json({ succes: true, bericht: 'Als dit e-mailadres bekend is, ontvang je een reset-e-mail.' });
    }

    const token = maakToken();
    const resets = leesJSON(RESET_PAD, []);
    const gefilterd = resets.filter(r => r.gebruikerId !== gebruiker.id);
    gefilterd.push({
        token,
        gebruikerId: gebruiker.id,
        email: gebruiker.email,
        aangemaakt: Date.now(),
        verlopen: Date.now() + 60 * 60 * 1000 // 1 uur geldig
    });
    schrijfJSON(RESET_PAD, gefilterd);

    const resetLink = `${process.env.SITE_URL || 'http://localhost:5500'}/login.html?reset=${token}`;

    await stuurMail(
        gebruiker.email,
        '🔑 Wachtwoord opnieuw instellen — Depeterpost Verhalen Club',
        `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;">
            <h2 style="color:#7C3AED;">🔑 Wachtwoord vergeten?</h2>
            <p>Hallo <strong>${gebruiker.gebruikersnaam}</strong>!</p>
            <p>Klik op de knop om een nieuw wachtwoord in te stellen. Deze link is 1 uur geldig.</p>
            <div style="text-align:center;margin:28px 0;">
                <a href="${resetLink}" style="background:linear-gradient(135deg,#7C3AED,#E8197D);color:white;text-decoration:none;padding:14px 32px;border-radius:30px;font-size:16px;font-weight:bold;display:inline-block;">
                    🔑 Nieuw wachtwoord instellen
                </a>
            </div>
            <p style="color:#888;font-size:13px;">Als jij dit niet hebt aangevraagd, is er niets aan de hand. Negeer deze e-mail gewoon.</p>
            <p style="color:#aaa;font-size:12px;">Of kopieer deze link: ${resetLink}</p>
        </div>`
    );

    res.json({ succes: true, bericht: 'Als dit e-mailadres bekend is, ontvang je een reset-e-mail.' });
});

// ── Stel nieuw wachtwoord in via reset-token ──
app.post('/api/auth/reset-wachtwoord', (req, res) => {
    const { token, nieuwWachtwoord } = req.body;
    if (!token || !nieuwWachtwoord) {
        return res.json({ succes: false, bericht: 'Token en nieuw wachtwoord zijn verplicht.' });
    }
    if (nieuwWachtwoord.length < 6) {
        return res.json({ succes: false, bericht: 'Wachtwoord moet minstens 6 tekens lang zijn.' });
    }

    const resets = leesJSON(RESET_PAD, []);
    const reset = resets.find(r => r.token === token);

    if (!reset) return res.json({ succes: false, bericht: 'Ongeldige resetlink.' });
    if (Date.now() > reset.verlopen) {
        schrijfJSON(RESET_PAD, resets.filter(r => r.token !== token));
        return res.json({ succes: false, bericht: 'Deze link is verlopen. Vraag een nieuwe aan.' });
    }

    const gebruikers = leesJSON(GEBRUIKERS_PAD, []);
    const idx = gebruikers.findIndex(g => g.id === reset.gebruikerId);
    if (idx === -1) return res.json({ succes: false, bericht: 'Gebruiker niet gevonden.' });

    gebruikers[idx].wachtwoordHash = hashWachtwoord(nieuwWachtwoord);
    schrijfJSON(GEBRUIKERS_PAD, gebruikers);
    schrijfJSON(RESET_PAD, resets.filter(r => r.token !== token));

    res.json({ succes: true, bericht: 'Wachtwoord succesvol gewijzigd! Je kunt nu inloggen.' });
});

// ── Check reset token geldigheid ──
app.get('/api/auth/check-reset/:token', (req, res) => {
    const resets = leesJSON(RESET_PAD, []);
    const reset = resets.find(r => r.token === req.params.token);
    if (!reset || Date.now() > reset.verlopen) {
        return res.json({ geldig: false });
    }
    res.json({ geldig: true });
});

// ── Profiel ophalen ──
app.get('/api/auth/profiel', checkGebruiker, (req, res) => {
    const gebruikers = leesJSON(GEBRUIKERS_PAD, []);
    const gebruiker = gebruikers.find(g => g.id === req.gebruikerId);
    if (!gebruiker) return res.json({ succes: false, bericht: 'Gebruiker niet gevonden.' });
    const inzendingen = leesJSON(INZENDINGEN_PAD, []);
    const eigenInzendingen = inzendingen.filter(i => i.gebruikerId === req.gebruikerId);
    const { wachtwoordHash, ...veiligeProfiel } = gebruiker;
    res.json({ succes: true, gebruiker: veiligeProfiel, inzendingen: eigenInzendingen });
});

// ── Mijn Dossier: alles in één call ──
app.get('/api/mijn-dossier', checkGebruiker, (req, res) => {
    const gebruikers = leesJSON(GEBRUIKERS_PAD, []);
    const gebruiker = gebruikers.find(g => g.id === req.gebruikerId);
    if (!gebruiker) return res.json({ succes: false, bericht: 'Gebruiker niet gevonden.' });

    // Inzendingen: match op gebruikerId OF op naam (voor oudere inzendingen zonder userId)
    const alleInzendingen = leesJSON(INZENDINGEN_PAD, []);
    const eigenInzendingen = alleInzendingen.filter(i =>
        i.gebruikerId === req.gebruikerId ||
        (!i.gebruikerId && i.naam === gebruiker.gebruikersnaam)
    );

    const persoonlijkeVerhalen = leesJSON(PERSOONLIJKE_VERHALEN_PAD, [])
        .filter(v => v.gebruikerId === req.gebruikerId);

    const { wachtwoordHash, ...veiligeProfiel } = gebruiker;
    res.json({
        succes: true,
        gebruiker: veiligeProfiel,
        inzendingen: eigenInzendingen,
        persoonlijkeVerhalen
    });
});

// ── Badge toekenner ──
function kenBadgesToe(gebruikerId) {
    const gebruikers = leesJSON(GEBRUIKERS_PAD, []);
    const idx = gebruikers.findIndex(g => g.id === gebruikerId);
    if (idx === -1) return;
    const g = gebruikers[idx];
    const badges = new Set(g.badges || []);
    if (g.aantalInzendingen >= 1)   badges.add('eerste_verhaal');
    if (g.aantalInzendingen >= 5)   badges.add('op_dreef');
    if (g.aantalInzendingen >= 20)  badges.add('verhaalmeester');
    if (g.aantalWinsten >= 1)       badges.add('kampioen');
    if (g.aantalWinsten >= 5)       badges.add('super_kampioen');
    if (g.aaneengeslotenDagen >= 7) badges.add('trouwe_schrijver');
    if (g.aaneengeslotenDagen >= 30) badges.add('legenda');
    gebruikers[idx].badges = [...badges];
    schrijfJSON(GEBRUIKERS_PAD, gebruikers);
}

// ════════════════════════════════════════
// PROJECTEN
// ════════════════════════════════════════
app.get('/api/projecten', (req, res) => {
    res.json(leesJSON(PROJECTEN_PAD, []).filter(p => p.actief));
});

app.get('/api/projecten/alle', checkAdmin, (req, res) => {
    res.json(leesJSON(PROJECTEN_PAD, []));
});

app.post('/api/admin/project/nieuw', checkAdmin, (req, res) => {
    const { naam, beschrijving, aantalDagen, leeftijdsgroepen } = req.body;
    if (!naam) return res.json({ succes: false, bericht: 'Naam is verplicht.' });
    const start = new Date();
    const eind  = new Date();
    eind.setDate(eind.getDate() + (aantalDagen || 10));
    const nieuwProject = {
        id: `project-${Date.now()}`,
        naam, beschrijving: beschrijving || '',
        startDatum: start.toISOString().split('T')[0],
        eindDatum:  eind.toISOString().split('T')[0],
        aantalDagen: aantalDagen || 10,
        leeftijdsgroepen: leeftijdsgroepen || ['A', 'B', 'C'],
        actief: true, gearchiveerd: false,
        aangemaakt: new Date().toISOString()
    };
    const groepenNamen = { A: '6-8 jaar', B: '9-11 jaar', C: '12+ jaar' };
    nieuwProject.verhalen = {};
    (leeftijdsgroepen || ['A', 'B', 'C']).forEach(groep => {
        const verhaalId = `verhaal-${nieuwProject.id}-${groep}`;
        nieuwProject.verhalen[groep] = verhaalId;
        schrijfJSON(path.join(DATA_DIR, `${verhaalId}.json`), {
            id: verhaalId, projectId: nieuwProject.id, leeftijdsgroep: groep,
            groepNaam: groepenNamen[groep],
            titel: `${naam} — Groep ${groepenNamen[groep]}`,
            samenvatting: `Een spannend verhaal voor kinderen van ${groepenNamen[groep]}.`,
            hoofdstukken: [], personages: [], locaties: []
        });
    });
    const projecten = leesJSON(PROJECTEN_PAD, []);
    projecten.push(nieuwProject);
    schrijfJSON(PROJECTEN_PAD, projecten);
    res.json({ succes: true, project: nieuwProject });
});

app.post('/api/admin/project/:id/archiveer', checkAdmin, (req, res) => {
    const projecten = leesJSON(PROJECTEN_PAD, []);
    const idx = projecten.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.json({ succes: false, bericht: 'Project niet gevonden.' });
    projecten[idx].actief = false;
    projecten[idx].gearchiveerd = true;
    schrijfJSON(PROJECTEN_PAD, projecten);
    res.json({ succes: true });
});

// ════════════════════════════════════════
// SCHRIJFOPDRACHT
// ════════════════════════════════════════
const LEEFTIJD_STIJL = {
    A: { naam: '6-8 jaar', maxWoorden: 100, taalTip: 'Gebruik korte, eenvoudige zinnen. Maximaal 100 woorden. Schrijf zoals je tegen een 7-jarige zou praten.' },
    B: { naam: '9-11 jaar', maxWoorden: 200, taalTip: 'Gebruik normale zinnen met wat meer detail. Maximaal 200 woorden.' },
    C: { naam: '12+ jaar', maxWoorden: 350, taalTip: 'Gebruik volledige verhaalstructuur, bijzondere woorden zijn welkom. Maximaal 350 woorden.' }
};

app.get('/api/opdracht/vandaag', (req, res) => {
    const { groep } = req.query;
    const opdrachten = leesJSON(OPDRACHTEN_PAD, []);
    const vandaag = new Date().toISOString().split('T')[0];
    let opdracht = opdrachten.find(o => o.datum === vandaag && (!groep || o.leeftijdsgroep === groep));
    if (!opdracht) opdracht = opdrachten.find(o => o.datum === vandaag);
    opdracht ? res.json({ succes: true, opdracht }) : res.json({ succes: false, bericht: 'Nog geen opdracht voor vandaag.' });
});

app.post('/api/admin/genereer-opdracht', checkAdmin, async (req, res) => {
    try {
        const { leeftijdsgroep, projectId } = req.body;
        const groep = leeftijdsgroep || 'B';
        const stijl = LEEFTIJD_STIJL[groep];
        const vandaag = new Date().toISOString().split('T')[0];

        let verhaal = leesJSON(VERHAAL_PAD, {});
        if (projectId) {
            const project = leesJSON(PROJECTEN_PAD, []).find(p => p.id === projectId);
            if (project?.verhalen?.[groep]) {
                const verhaalPad = path.join(DATA_DIR, `${project.verhalen[groep]}.json`);
                if (fs.existsSync(verhaalPad)) verhaal = leesJSON(verhaalPad, verhaal);
            }
        }

        const hoofdstukken = verhaal.hoofdstukken || [];
        const laatste3 = hoofdstukken.slice(-3);
        const verhaalContext = laatste3.length > 0
            ? laatste3.map(h => `Hoofdstuk ${h.nummer} (door ${h.auteur}):\n${h.tekst.substring(0, 400)}`).join('\n\n---\n\n')
            : 'Dit is het begin van het verhaal, er zijn nog geen hoofdstukken.';
        const laasteHoofdstuk = hoofdstukken[hoofdstukken.length - 1];
        const openEindje = laasteHoofdstuk
            ? `Het verhaal eindigde met: "${laasteHoofdstuk.tekst.substring(laasteHoofdstuk.tekst.length - 200)}"`
            : '';

        // Kies verse inspiratie die nog niet eerder is gebruikt
        const inspiratie = kiesInspiratie(groep);
        const inspiratieBlok = `
INSPIRATIE VOOR VANDAAG (gebaseerd op kinderliteratuur-onderzoek):
Mogelijke thema's om op te bouwen: ${inspiratie.gekozenThemas.join(' | ')}
Interessante omgevingsideeën: ${inspiratie.gekozenOmgeving.join(' | ')}
Personage-ideeën: ${inspiratie.gekozenPersonage.join(' | ')}
Magisch object als inspiratie: ${inspiratie.gekozenObject[0] || ''}
Dier als inspiratie: ${inspiratie.gekozenDier[0] || ''}
Verhaalstarter-idee: ${inspiratie.gekozenHook[0] || ''}
Quest-idee: ${inspiratie.gekozenQuest[0] || ''}

⚠️ Gebruik deze inspiratie CREATIEF als vertrekpunt — pas het aan zodat het logisch aansluit op het verhaal hierboven. Kopieer niet letterlijk, maar laat je erdoor inspireren.`;

        const prompt = `Je bent een enthousiaste jonge leraar en creatieve schrijfcoach voor kinderen van ${stijl.naam}.
Je stijl: opgewekt, bemoedigend, concreet. Je geeft opdrachten die logisch aansluiten op het verhaal.

HET VERHAAL TOT NU TOE:
Titel: ${verhaal.titel || 'Nog geen titel'}
Bekende personages: ${(verhaal.personages || []).join(', ') || 'nog geen'}
Bekende locaties: ${(verhaal.locaties || []).join(', ') || 'nog geen'}

LAATSTE HOOFDSTUKKEN:
${verhaalContext}

${openEindje ? `OPEN EINDJE:\n${openEindje}\n` : ''}
${inspiratieBlok}

INSTRUCTIES:
- Analyseer zorgvuldig wat er in het verhaal is gebeurd
- De nieuwe opdracht MOET logisch voortvloeien uit de vorige gebeurtenissen
- Gebruik de inspiratie hierboven als vonk voor iets nieuws — voorkom herhaling van eerder gebruikte personages en omgevingen
- Gebruik bestaande personages of introduceer een nieuw personage dat past bij de inspiratie
- Wees creatief maar niet chaotisch — logische verhaallijn is belangrijker dan verrassingen
- Schrijf de opdrachttekst in vrolijk, enthousiast kindertaal voor ${stijl.naam}
- ${stijl.taalTip}

UITLEG VELDEN:
- verhaaleinde: 1 zin hoe het vorige hoofdstuk eindigde (verleden tijd, voor het kind als context)
- beginpunt: 1 zin precies waar het verhaal vandaag begint (tegenwoordige tijd, startpositie schrijver)
- ideeen: 2 uitnodigende verhaalontwikkelingsideeën die kinderen KUNNEN volgen maar NIET hoeven. Creatief, 1-2 zinnen elk.
- sleutelwoorden: 3 woorden die het verhaal sturen in de gewenste richting. Het kind MOET ze verwerken. Kies sturende woorden (emotie, object, of actie die de plot vooruit helpt).

Geef ALLEEN geldig JSON:
{
  "datum": "${vandaag}",
  "leeftijdsgroep": "${groep}",
  "personage": "naam van het personage van vandaag",
  "omgeving": "omgeving die aansluit op het verhaal",
  "verhaaleinde": "zo eindigde het vorige hoofdstuk (1 zin, verleden tijd)",
  "beginpunt": "hier begint het verhaal vandaag (1 zin, tegenwoordige tijd)",
  "gebeurtenis": "zelfde als beginpunt",
  "ideeen": ["uitnodigend idee 1 in kindertaal (1-2 zinnen)", "uitnodigend idee 2 in kindertaal (1-2 zinnen)"],
  "opdrachttekst": "vrolijke opdracht in kindertaal, max 2 zinnen",
  "sleutelwoorden": ["sturingswoord1", "sturingswoord2", "sturingswoord3"],
  "aansluitingsTip": "hoe sluit dit aan op het vorige hoofdstuk"
}`;

        const message = await client.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 900,
            temperature: 0.6,
            messages: [{ role: 'user', content: prompt }]
        });

        const resultaat = parseAIJson(message.content[0].text);
        const opdrachten = leesJSON(OPDRACHTEN_PAD, []);
        const gefilterd = opdrachten.filter(o => !(o.datum === vandaag && o.leeftijdsgroep === groep));
        gefilterd.push(resultaat);
        schrijfJSON(OPDRACHTEN_PAD, gefilterd);
        res.json({ succes: true, opdracht: resultaat });
    } catch (err) {
        console.error('Fout bij genereren opdracht:', err);
        res.json({ succes: false, bericht: err.message });
    }
});

// Verwijder opdracht voor een specifieke dag + groep
app.delete('/api/admin/opdracht', checkAdmin, (req, res) => {
    const { datum, groep } = req.query;
    if (!datum || !groep) return res.json({ succes: false, bericht: 'datum en groep zijn verplicht.' });
    const opdrachten = leesJSON(OPDRACHTEN_PAD, []);
    const nieuw = opdrachten.filter(o => !(o.datum === datum && o.leeftijdsgroep === groep));
    schrijfJSON(OPDRACHTEN_PAD, nieuw);
    res.json({ succes: true, verwijderd: opdrachten.length - nieuw.length });
});

// ════════════════════════════════════════
// VERHAAL INSTUREN MET AI-FEEDBACK
// ════════════════════════════════════════
app.post('/api/inzending', async (req, res) => {
    const { naam, tekst, opdrachtDatum, leeftijdsgroep, gebruikerId } = req.body;
    if (!tekst || tekst.trim().length < 10) {
        return res.json({ succes: false, bericht: 'Tekst is te kort.' });
    }

    const datum = opdrachtDatum || new Date().toISOString().split('T')[0];
    const groep  = leeftijdsgroep || 'B';
    const stijl  = LEEFTIJD_STIJL[groep];

    const opdracht = leesJSON(OPDRACHTEN_PAD, []).find(o =>
        o.datum === datum && (o.leeftijdsgroep === groep || !o.leeftijdsgroep)
    );

    let feedback = null;
    try {
        const feedbackPrompt = `Je bent een enthousiaste jonge leraar en schrijfcoach voor kinderen van ${stijl.naam}.
Je toon: warm, bemoedigend, concreet en leuk. Alsof je naast het kind zit.

${opdracht ? `De schrijfopdracht was:
Personage: "${opdracht.personage}"
Omgeving: "${opdracht.omgeving}"
Gebeurtenis: "${opdracht.gebeurtenis}"` : ''}

Het verhaaltje van het kind:
"""
${tekst.trim()}
"""

INSTRUCTIES:
- Geef ALTIJD eerst een oprecht, persoonlijk compliment over iets concreets
- Maximaal 3 spelfouten benoemen (de meest leerzame)
- Maximaal 3 verbeterpunten, altijd positief geformuleerd
- Aanmoediging moet persoonlijk zijn en verwijzen naar iets uit het verhaal zelf
- Wees warm en enthousiast, zoals een jonge leraar die het beste uit kinderen haalt

Geef ALLEEN geldig JSON:
{
  "algemeenCompliment": "persoonlijk compliment over iets specifieks (1-2 zinnen)",
  "spelfouten": [{"origineel": "fout woord", "verbetering": "correct woord", "uitleg": "korte kindvriendelijke uitleg"}],
  "verbeterpunten": [{"type": "categorie", "uitleg": "vriendelijke tip in kindertaal"}],
  "opdrachtvolgingScore": 85,
  "aanmoediging": "persoonlijke aanmoediging die verwijst naar iets uit dit verhaal",
  "woordAantal": ${tekst.trim().split(/\s+/).length},
  "maxWoorden": ${stijl.maxWoorden}
}`;

        const message = await client.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 800,
            temperature: 0.6,
            messages: [{ role: 'user', content: feedbackPrompt }]
        });
        feedback = parseAIJson(message.content[0].text);
    } catch (err) {
        console.error('Fout bij AI feedback:', err);
        feedback = {
            algemeenCompliment: "Super goed gedaan dat je een verhaal hebt geschreven!",
            spelfouten: [], verbeterpunten: [],
            opdrachtvolgingScore: 75,
            aanmoediging: "Blijf schrijven, je wordt elke dag beter!",
            woordAantal: tekst.trim().split(/\s+/).length,
            maxWoorden: stijl.maxWoorden
        };
    }

    const nieuweInzending = {
        id: `inz-${Date.now()}`,
        naam: naam?.trim() || 'Anoniem',
        gebruikerId: gebruikerId || null,
        tekst: tekst.trim(),
        datum, opdrachtDatum: datum,
        leeftijdsgroep: groep,
        tijdstip: new Date().toISOString(),
        winnaar: false, feedback
    };

    const inzendingen = leesJSON(INZENDINGEN_PAD, []);
    inzendingen.push(nieuweInzending);
    schrijfJSON(INZENDINGEN_PAD, inzendingen);

    if (gebruikerId) {
        const gebruikers = leesJSON(GEBRUIKERS_PAD, []);
        const idx = gebruikers.findIndex(g => g.id === gebruikerId);
        if (idx !== -1) {
            gebruikers[idx].punten = (gebruikers[idx].punten || 0) + 10;
            gebruikers[idx].aantalInzendingen = (gebruikers[idx].aantalInzendingen || 0) + 1;
            gebruikers[idx].laasteInzending = datum;
            schrijfJSON(GEBRUIKERS_PAD, gebruikers);
            kenBadgesToe(gebruikerId);
        }
    }

    res.json({ succes: true, bericht: 'Je verhaaltje is ontvangen!', feedback, inzendingId: nieuweInzending.id });
});

// ── Check verhaal (bolletjes systeem) ──
app.post('/api/check-verhaal', async (req, res) => {
    const { tekst, opdrachtDatum, leeftijdsgroep } = req.body;
    if (!tekst || tekst.trim().length < 10) return res.json({ succes: false, bericht: 'Tekst is te kort.' });
    try {
        const groep = leeftijdsgroep || 'B';
        const datum = opdrachtDatum || new Date().toISOString().split('T')[0];
        const opdracht = leesJSON(OPDRACHTEN_PAD, []).find(o =>
            o.datum === datum && (o.leeftijdsgroep === groep || !o.leeftijdsgroep)
        );
        if (!opdracht) return res.json({ succes: false, bericht: 'Geen opdracht gevonden voor vandaag.' });

        const message = await client.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 200,
            temperature: 0.3,
            messages: [{ role: 'user', content:
                `Controleer vriendelijk of dit kinderverhaaltje de opdrachtelementen bevat.
Opdracht: Personage: "${opdracht.personage}", Omgeving: "${opdracht.omgeving}", Gebeurtenis: "${opdracht.gebeurtenis}"
Verhaaltje: ${tekst}
Wees soepel en positief. Geef ALLEEN geldig JSON:
{"personageAanwezig": true, "omgevingAanwezig": false, "gebeurtenisAanwezig": true, "feedback": "bemoedigende zin"}`
            }]
        });
        res.json({ succes: true, check: parseAIJson(message.content[0].text) });
    } catch (err) {
        res.json({ succes: false, bericht: err.message });
    }
});

// ════════════════════════════════════════
// ADMIN: INZENDINGEN & WINNAAR
// ════════════════════════════════════════
app.get('/api/admin/inzendingen/vandaag', checkAdmin, (req, res) => {
    const vandaag = new Date().toISOString().split('T')[0];
    res.json(leesJSON(INZENDINGEN_PAD, []).filter(i => i.opdrachtDatum === vandaag));
});

app.post('/api/admin/kies-winnaar', checkAdmin, async (req, res) => {
    try {
        const { leeftijdsgroep } = req.body;
        const inzendingen = leesJSON(INZENDINGEN_PAD, []);
        const vandaag = new Date().toISOString().split('T')[0];
        let kandidaten = inzendingen.filter(i => i.opdrachtDatum === vandaag);
        if (leeftijdsgroep) kandidaten = kandidaten.filter(i => i.leeftijdsgroep === leeftijdsgroep);
        if (kandidaten.length === 0) return res.json({ succes: false, bericht: 'Geen inzendingen gevonden.' });

        const opdracht = leesJSON(OPDRACHTEN_PAD, []).find(o =>
            o.datum === vandaag && (!leeftijdsgroep || o.leeftijdsgroep === leeftijdsgroep)
        );
        const message = await client.messages.create({
            model: 'claude-sonnet-4-6', max_tokens: 200, temperature: 0.4,
            messages: [{ role: 'user', content:
                `Je bent jurylid voor een kinderverhaaltjeswedstrijd.
Opdracht: "${opdracht?.personage}", "${opdracht?.omgeving}", "${opdracht?.gebeurtenis}"
${kandidaten.map((i, n) => `Inzending ${n+1} (ID: ${i.id}, Naam: ${i.naam}):\n${i.tekst}`).join('\n\n---\n\n')}
Kies de beste. Geef ALLEEN geldig JSON:
{"winnaarId": "het exacte ID", "reden": "korte enthousiaste uitleg in kindertaal (max 2 zinnen)"}`
            }]
        });
        const resultaat = parseAIJson(message.content[0].text);
        schrijfJSON(INZENDINGEN_PAD, inzendingen.map(i => ({ ...i, winnaar: i.id === resultaat.winnaarId ? true : i.winnaar })));
        const winnaar = kandidaten.find(i => i.id === resultaat.winnaarId);
        if (winnaar?.gebruikerId) {
            const gebruikers = leesJSON(GEBRUIKERS_PAD, []);
            const idx = gebruikers.findIndex(g => g.id === winnaar.gebruikerId);
            if (idx !== -1) {
                gebruikers[idx].punten = (gebruikers[idx].punten || 0) + 50;
                gebruikers[idx].aantalWinsten = (gebruikers[idx].aantalWinsten || 0) + 1;
                schrijfJSON(GEBRUIKERS_PAD, gebruikers);
                kenBadgesToe(winnaar.gebruikerId);
            }
        }
        res.json({ succes: true, winnaar, reden: resultaat.reden });
    } catch (err) {
        res.json({ succes: false, bericht: err.message });
    }
});

app.post('/api/admin/corrigeer-winnaar', checkAdmin, async (req, res) => {
    const { inzendingId } = req.body;
    try {
        const inzendingen = leesJSON(INZENDINGEN_PAD, []);
        const inzending = inzendingen.find(i => i.id === inzendingId);
        if (!inzending) return res.json({ succes: false, bericht: 'Inzending niet gevonden.' });
        const message = await client.messages.create({
            model: 'claude-sonnet-4-6', max_tokens: 800, temperature: 0.3,
            messages: [{ role: 'user', content:
                `Corrigeer dit kinderverhaaltje licht: alleen spelfouten en grammatica, behoud de schrijfstijl volledig.
${inzending.tekst}
Geef ALLEEN geldig JSON: {"gecorrigeerdeTekst": "tekst", "wijzigingen": "beschrijving"}`
            }]
        });
        const resultaat = parseAIJson(message.content[0].text);
        schrijfJSON(INZENDINGEN_PAD, inzendingen.map(i =>
            i.id === inzendingId ? { ...i, gecorrigeerdeTekst: resultaat.gecorrigeerdeTekst, wijzigingen: resultaat.wijzigingen } : i
        ));
        res.json({ succes: true, ...resultaat });
    } catch (err) {
        res.json({ succes: false, bericht: err.message });
    }
});

app.post('/api/admin/update-verhaal', checkAdmin, (req, res) => {
    const { inzendingId } = req.body;
    try {
        const inzendingen = leesJSON(INZENDINGEN_PAD, []);
        const inzending = inzendingen.find(i => i.id === inzendingId);
        if (!inzending) return res.json({ succes: false, bericht: 'Inzending niet gevonden.' });
        const verhaal = leesJSON(VERHAAL_PAD, { hoofdstukken: [] });
        const nieuwHoofdstuk = {
            nummer: (verhaal.hoofdstukken?.length || 0) + 1,
            datum: inzending.opdrachtDatum,
            auteur: inzending.naam,
            leeftijdsgroep: inzending.leeftijdsgroep || 'B',
            tekst: inzending.gecorrigeerdeTekst || inzending.tekst,
            inzendingId
        };
        verhaal.hoofdstukken = verhaal.hoofdstukken || [];
        verhaal.hoofdstukken.push(nieuwHoofdstuk);
        schrijfJSON(VERHAAL_PAD, verhaal);
        res.json({ succes: true, hoofdstuk: nieuwHoofdstuk });
    } catch (err) {
        res.json({ succes: false, bericht: err.message });
    }
});

// Reset het grote verhaal (archiveer + begin opnieuw)
app.post('/api/admin/verhaal/reset', checkAdmin, (req, res) => {
    try {
        const verhaal = leesJSON(VERHAAL_PAD, {});
        if ((verhaal.hoofdstukken || []).length > 0) {
            const backupNaam = `verhaal-archief-${Date.now()}.json`;
            schrijfJSON(path.join(DATA_DIR, backupNaam), {
                ...verhaal,
                gearchiveerdOp: new Date().toISOString()
            });
        }
        schrijfJSON(VERHAAL_PAD, {
            titel: verhaal.titel || 'Het Grote Avontuur',
            samenvatting: '',
            personages: [],
            locaties: [],
            hoofdstukken: []
        });
        // Verwijder opdrachten van vandaag en toekomst
        const vandaag = new Date().toISOString().split('T')[0];
        const opdrachten = leesJSON(OPDRACHTEN_PAD, []);
        schrijfJSON(OPDRACHTEN_PAD, opdrachten.filter(o => o.datum < vandaag));
        res.json({ succes: true });
    } catch (err) {
        res.json({ succes: false, bericht: err.message });
    }
});

// ════════════════════════════════════════
// PENDING, VERHALEN, STATS, VIDEO
// ════════════════════════════════════════
app.post('/api/idee', (req, res) => {
    const { naam, tekst } = req.body;
    if (!naam || !tekst) return res.json({ succes: false, bericht: 'Naam en tekst zijn verplicht.' });
    const pending = leesJSON(PENDING_PAD, []);
    pending.push({ id: `idee-${Date.now()}`, type: 'idee', naam: naam.trim(), tekst: tekst.trim(), datum: new Date().toLocaleDateString('nl-NL') });
    schrijfJSON(PENDING_PAD, pending);
    res.json({ succes: true });
});

app.post('/api/verhaal', (req, res) => {
    const { naam, tekst, verhaalId, verhaalTitel } = req.body;
    if (!naam || !tekst) return res.json({ succes: false, bericht: 'Naam en tekst zijn verplicht.' });
    const pending = leesJSON(PENDING_PAD, []);
    pending.push({ id: `verhaal-${Date.now()}`, type: 'verhaal', naam: naam.trim(), tekst: tekst.trim(), verhaalId, verhaalTitel, datum: new Date().toLocaleDateString('nl-NL') });
    schrijfJSON(PENDING_PAD, pending);
    res.json({ succes: true });
});

app.get('/api/admin/pending', checkAdmin, (req, res) => res.json(leesJSON(PENDING_PAD, [])));

app.post('/api/admin/approve/:id', checkAdmin, (req, res) => {
    const pending = leesJSON(PENDING_PAD, []);
    const item = pending.find(i => i.id === req.params.id);
    if (!item) return res.json({ succes: false, bericht: 'Niet gevonden.' });
    schrijfJSON(PENDING_PAD, pending.filter(i => i.id !== req.params.id));
    if (item.type === 'verhaal') {
        const verhalen = leesJSON(VERHALEN_PAD, []);
        verhalen.push({ ...item, goedgekeurd: true });
        schrijfJSON(VERHALEN_PAD, verhalen);
    }
    res.json({ succes: true });
});

app.post('/api/admin/reject/:id', checkAdmin, (req, res) => {
    schrijfJSON(PENDING_PAD, leesJSON(PENDING_PAD, []).filter(i => i.id !== req.params.id));
    res.json({ succes: true });
});

app.get('/api/verhalen', (req, res) => res.json(leesJSON(VERHALEN_PAD, [])));
app.get('/api/verhaal',  (req, res) => res.json(leesJSON(VERHAAL_PAD, { titel: 'Het Grote Avontuur', samenvatting: '', hoofdstukken: [] })));

app.post('/api/view/:id', (req, res) => {
    const views = leesJSON(VIEWS_PAD, {});
    views[req.params.id] = (views[req.params.id] || 0) + 1;
    schrijfJSON(VIEWS_PAD, views);
    res.json({ succes: true });
});

app.post('/api/rate/:id', (req, res) => {
    const ratings = leesJSON(RATINGS_PAD, {});
    if (!ratings[req.params.id]) ratings[req.params.id] = { totaal: 0, aantal: 0 };
    ratings[req.params.id].totaal += req.body.rating;
    ratings[req.params.id].aantal += 1;
    schrijfJSON(RATINGS_PAD, ratings);
    const gem = (ratings[req.params.id].totaal / ratings[req.params.id].aantal).toFixed(1);
    res.json({ average: gem, totalRatings: ratings[req.params.id].aantal });
});

app.get('/api/stats/:id', (req, res) => {
    const views = leesJSON(VIEWS_PAD, {});
    const ratings = leesJSON(RATINGS_PAD, {});
    const r = ratings[req.params.id] || { totaal: 0, aantal: 0 };
    res.json({ views: views[req.params.id] || 0, average: r.aantal > 0 ? (r.totaal / r.aantal).toFixed(1) : '0.0', totalRatings: r.aantal });
});

app.get('/api/videos', (req, res) => {
    res.json(leesJSON(VIDEOS_PAD, []).sort((a, b) => (a.volgorde || 0) - (b.volgorde || 0)));
});

app.post('/api/admin/video/toevoegen', checkAdmin, (req, res) => {
    const { titel, beschrijving, type, bronUrl, youtubeId, thumbnail, volgorde } = req.body;
    if (!titel || !type) return res.json({ succes: false, bericht: 'Titel en type zijn verplicht.' });
    const videos = leesJSON(VIDEOS_PAD, []);
    videos.push({
        id: `video-${Date.now()}`, titel,
        beschrijving: beschrijving || '', type,
        bronUrl: type === 'youtube' ? (youtubeId ? `https://www.youtube.com/embed/${youtubeId}` : bronUrl) : bronUrl,
        youtubeId: youtubeId || null,
        thumbnail: thumbnail || '',
        datum: new Date().toISOString().split('T')[0],
        volgorde: volgorde || videos.length + 1,
        views: 0
    });
    schrijfJSON(VIDEOS_PAD, videos);
    res.json({ succes: true });
});

app.delete('/api/admin/video/:id', checkAdmin, (req, res) => {
    schrijfJSON(VIDEOS_PAD, leesJSON(VIDEOS_PAD, []).filter(v => v.id !== req.params.id));
    res.json({ succes: true });
});

app.post('/api/admin/video/volgorde', checkAdmin, (req, res) => {
    const videos = leesJSON(VIDEOS_PAD, []);
    (req.body.volgorde || []).forEach(({ id, volgorde: v }) => {
        const idx = videos.findIndex(vid => vid.id === id);
        if (idx !== -1) videos[idx].volgorde = v;
    });
    schrijfJSON(VIDEOS_PAD, videos);
    res.json({ succes: true });
});

// ════════════════════════════════════════
// PERSOONLIJKE VERHALEN
// ════════════════════════════════════════

// Publieke paginaroute — serveert verhaal-publiek.html voor /verhaal/:id
app.get('/verhaal/:id', (req, res) =>
    res.sendFile(path.join(__dirname, 'verhaal-publiek.html')));

// AI: genereer onderwerp + personages
app.post('/api/mijn-verhaal/genereer-onderwerp', checkGebruiker, async (req, res) => {
    try {
        const inspiratie = kiesInspiratie('B');
        const message = await client.messages.create({
            model: 'claude-sonnet-4-6', max_tokens: 300, temperature: 0.9,
            messages: [{ role: 'user', content:
                `Genereer een leuk en creatief verhaalonderwerp voor een kind van 9-12 jaar.
Laat je inspireren door deze ideeën uit kinderliteratuur-onderzoek:
- Thema-ideeën: ${inspiratie.gekozenThemas.join(' | ')}
- Omgeving-ideeën: ${inspiratie.gekozenOmgeving.join(' | ')}
- Personage-ideeën: ${inspiratie.gekozenPersonage.join(' | ')}
- Magisch object: ${inspiratie.gekozenObject[0] || ''}
- Dier als metgezel: ${inspiratie.gekozenDier[0] || ''}

Gebruik deze als inspiratie, niet als letterlijke instructie. Combineer ze creatief tot iets origineels.
Geef ALLEEN geldig JSON:
{"onderwerp": "korte beschrijving van het thema (max 1 zin)", "personages": "2-3 leuke personages met korte beschrijving, gescheiden door komma's"}`
            }]
        });
        const resultaat = parseAIJson(message.content[0].text);
        res.json({ succes: true, onderwerp: resultaat.onderwerp, personages: resultaat.personages });
    } catch (err) {
        res.json({ succes: false, bericht: err.message });
    }
});

// Nieuw persoonlijk verhaal aanmaken (met eerste AI-opdracht)
app.post('/api/mijn-verhaal', checkGebruiker, async (req, res) => {
    const { titel, aantalDelen, onderwerpKeuze, onderwerp, personages } = req.body;
    if (!titel?.trim()) return res.json({ succes: false, bericht: 'Titel is verplicht.' });
    const n = Math.min(10, Math.max(2, parseInt(aantalDelen) || 3));

    // Genereer eerste schrijfopdracht via AI
    let eersteOpdracht = 'Begin jouw verhaal! Stel de locatie voor en laat je hoofdpersonage kennismaken met de lezer. Wat zien ze? Wat voelen ze? Maak het meteen spannend!';
    let eersteHint = '';
    try {
        const msg = await client.messages.create({
            model: 'claude-sonnet-4-6', max_tokens: 300, temperature: 0.8,
            messages: [{ role: 'user', content:
                `Genereer een spannende schrijfopdracht voor deel 1 van een persoonlijk kinderverhaal (9-12 jaar).
Verhaal: "${titel.trim()}"
Personages: ${personages?.trim() || 'vrij te kiezen'}
Onderwerp/setting: ${onderwerp?.trim() || 'vrij te kiezen'}
Totaal aantal delen: ${n}

Geef ALLEEN geldig JSON:
{"opdracht": "spannende schrijfopdracht in 2-3 zinnen, spreek kind aan met 'jij'", "hint": "optionele schrijftip (1 zin, begin met Tip:)"}`
            }]
        });
        const r = parseAIJson(msg.content[0].text);
        if (r?.opdracht) { eersteOpdracht = r.opdracht; eersteHint = r.hint || ''; }
    } catch (_) {}

    const nieuw = {
        id: `pverhaal-${Date.now()}`,
        gebruikerId: req.gebruikerId,
        titel: titel.trim(),
        aantalDelen: n,
        onderwerpKeuze: onderwerpKeuze || 'zelf',
        onderwerp: onderwerp?.trim() || '',
        personages: personages?.trim() || '',
        huidigDeelNummer: 1,
        delen: Array.from({ length: n }, (_, i) => ({
            nummer: i + 1, tekst: '',
            opdracht: i === 0 ? eersteOpdracht : '',
            hint:     i === 0 ? eersteHint    : '',
            voltooid: false,
            bijgewerkt: new Date().toISOString()
        })),
        status: 'bezig',
        aangemaakt: new Date().toISOString(),
        bijgewerkt: new Date().toISOString(),
        openbaar: true
    };
    const alle = leesJSON(PERSOONLIJKE_VERHALEN_PAD, []);
    alle.push(nieuw);
    schrijfJSON(PERSOONLIJKE_VERHALEN_PAD, alle);
    res.json({ succes: true, verhaal: nieuw });
});

// Alle eigen verhalen ophalen
app.get('/api/mijn-verhalen', checkGebruiker, (req, res) => {
    const alle = leesJSON(PERSOONLIJKE_VERHALEN_PAD, []);
    res.json(alle.filter(v => v.gebruikerId === req.gebruikerId));
});

// Enkel verhaal ophalen (publiek)
app.get('/api/verhaal/:id', (req, res) => {
    const verhaal = leesJSON(PERSOONLIJKE_VERHALEN_PAD, []).find(v => v.id === req.params.id);
    if (!verhaal) return res.status(404).json({ succes: false, bericht: 'Verhaal niet gevonden.' });
    if (!verhaal.openbaar) return res.status(403).json({ succes: false, bericht: 'Dit verhaal is niet openbaar.' });
    // Voeg gebruikersnaam toe
    const gebruiker = leesJSON(GEBRUIKERS_PAD, []).find(g => g.id === verhaal.gebruikerId);
    res.json({ ...verhaal, auteursnaam: gebruiker?.gebruikersnaam || 'Onbekend', auteurAvatar: gebruiker?.avatar || '📖' });
});

// Verhaal bijwerken
app.put('/api/mijn-verhaal/:id', checkGebruiker, (req, res) => {
    const alle = leesJSON(PERSOONLIJKE_VERHALEN_PAD, []);
    const idx = alle.findIndex(v => v.id === req.params.id && v.gebruikerId === req.gebruikerId);
    if (idx === -1) return res.status(404).json({ succes: false, bericht: 'Niet gevonden.' });
    const { titel, onderwerp, personages, delen, status, huidigDeelNummer } = req.body;
    if (titel !== undefined) alle[idx].titel = titel.trim();
    if (onderwerp !== undefined) alle[idx].onderwerp = onderwerp.trim();
    if (personages !== undefined) alle[idx].personages = personages.trim();
    if (status !== undefined) alle[idx].status = status;
    if (huidigDeelNummer !== undefined) alle[idx].huidigDeelNummer = huidigDeelNummer;
    if (Array.isArray(delen)) {
        alle[idx].delen = delen.map((d, i) => ({
            nummer: i + 1,
            tekst: d.tekst || '',
            opdracht: d.opdracht !== undefined ? d.opdracht : (alle[idx].delen[i]?.opdracht || ''),
            hint:     d.hint     !== undefined ? d.hint     : (alle[idx].delen[i]?.hint     || ''),
            voltooid: d.voltooid || false,
            bijgewerkt: new Date().toISOString()
        }));
    }
    alle[idx].bijgewerkt = new Date().toISOString();
    schrijfJSON(PERSOONLIJKE_VERHALEN_PAD, alle);
    res.json({ succes: true, verhaal: alle[idx] });
});

// Verhaal verwijderen
app.delete('/api/mijn-verhaal/:id', checkGebruiker, (req, res) => {
    const alle = leesJSON(PERSOONLIJKE_VERHALEN_PAD, []);
    const nieuw = alle.filter(v => !(v.id === req.params.id && v.gebruikerId === req.gebruikerId));
    if (nieuw.length === alle.length) return res.status(404).json({ succes: false, bericht: 'Niet gevonden.' });
    schrijfJSON(PERSOONLIJKE_VERHALEN_PAD, nieuw);
    res.json({ succes: true });
});

// Genereer volgende schrijfopdracht op basis van alles wat er al is
app.post('/api/mijn-verhaal/:id/volgende-opdracht', checkGebruiker, async (req, res) => {
    try {
        const alle = leesJSON(PERSOONLIJKE_VERHALEN_PAD, []);
        const idx = alle.findIndex(v => v.id === req.params.id && v.gebruikerId === req.gebruikerId);
        if (idx === -1) return res.status(404).json({ succes: false, bericht: 'Niet gevonden.' });
        const verhaal = alle[idx];
        const volgendNr = parseInt(req.body.volgendDeelNummer) || (verhaal.huidigDeelNummer + 1);
        const isLaatste = volgendNr === verhaal.aantalDelen;

        const voltooideDelenTekst = verhaal.delen
            .filter(d => d.voltooid && d.tekst.trim())
            .map(d => `Deel ${d.nummer}:\n${d.tekst.trim().substring(0, 400)}`)
            .join('\n\n');

        const basis = `Verhaal: "${verhaal.titel}"
Personages: ${verhaal.personages || 'vrij te kiezen'}
Setting: ${verhaal.onderwerp || 'vrij te kiezen'}
Wat er al is geschreven:
${voltooideDelenTekst || '(nog niets)'}`;

        const prompt = isLaatste
            ? `${basis}

Genereer een GRAND FINALE schrijfopdracht voor het LAATSTE deel (${volgendNr} van ${verhaal.aantalDelen}).
De opdracht moet alle losse eindjes samenvoegen en het verhaal tot een bevredigend einde brengen. Maak het episch!
Geef ALLEEN geldig JSON: {"opdracht": "epische finale opdracht in 2-3 zinnen, spreek kind aan met 'jij'", "hint": "tip hoe mooi af te sluiten (1 zin, begin met Tip:)"}`
            : `${basis}

Genereer een schrijfopdracht voor deel ${volgendNr} van ${verhaal.aantalDelen}.
Bouw logisch voort op de vorige delen. Introduceer nieuwe spanning of een probleem.${volgendNr >= Math.ceil(verhaal.aantalDelen * 0.7) ? ' Stuur het verhaal richting het einde.' : ''}
Geef ALLEEN geldig JSON: {"opdracht": "spannende opdracht in 2-3 zinnen, spreek kind aan met 'jij'", "hint": "optionele schrijftip (1 zin, begin met Tip:)"}`;

        const msg = await client.messages.create({
            model: 'claude-sonnet-4-6', max_tokens: 300, temperature: 0.8,
            messages: [{ role: 'user', content: prompt }]
        });
        const resultaat = parseAIJson(msg.content[0].text);
        if (!resultaat?.opdracht) return res.json({ succes: false, bericht: 'Kon geen opdracht genereren.' });

        // Sla opdracht op in het volgende deel
        if (alle[idx].delen[volgendNr - 1]) {
            alle[idx].delen[volgendNr - 1].opdracht = resultaat.opdracht;
            alle[idx].delen[volgendNr - 1].hint = resultaat.hint || '';
        }
        alle[idx].huidigDeelNummer = volgendNr;
        alle[idx].bijgewerkt = new Date().toISOString();
        schrijfJSON(PERSOONLIJKE_VERHALEN_PAD, alle);

        res.json({ succes: true, opdracht: resultaat.opdracht, hint: resultaat.hint || '', isLaatsteDeel: isLaatste });
    } catch (err) {
        res.json({ succes: false, bericht: err.message });
    }
});

// Controleer of huidige deeltekst aansluit op het vorige deel (dot 3)
app.post('/api/mijn-verhaal/:id/check-deel', checkGebruiker, async (req, res) => {
    try {
        const { deelNummer, tekst } = req.body;
        if (deelNummer <= 1) return res.json({ succes: true, verbindt: true }); // eerste deel altijd ok
        const verhaal = leesJSON(PERSOONLIJKE_VERHALEN_PAD, [])
            .find(v => v.id === req.params.id && v.gebruikerId === req.gebruikerId);
        if (!verhaal) return res.status(404).json({ succes: false, bericht: 'Niet gevonden.' });
        const vorigDeel = verhaal.delen.find(d => d.nummer === deelNummer - 1);
        if (!vorigDeel?.tekst?.trim()) return res.json({ succes: true, verbindt: true });

        const msg = await client.messages.create({
            model: 'claude-haiku-4-5-20251001', max_tokens: 80, temperature: 0,
            messages: [{ role: 'user', content:
                `Sluit dit nieuwe stuk verhaal logisch aan op het vorige deel? Antwoord alleen met geldig JSON.
Vorig deel: "${vorigDeel.tekst.trim().substring(0, 400)}"
Nieuwe tekst: "${(tekst || '').trim().substring(0, 400)}"
JSON: {"verbindt": true} of {"verbindt": false}`
            }]
        });
        const r = parseAIJson(msg.content[0].text);
        res.json({ succes: true, verbindt: r?.verbindt !== false });
    } catch (_) {
        res.json({ succes: true, verbindt: true }); // bij fout: niet blokkeren
    }
});

// AI suggestie voor een deel
app.post('/api/mijn-verhaal/:id/ai-suggest', checkGebruiker, async (req, res) => {
    try {
        const { deelNummer } = req.body;
        const verhaal = leesJSON(PERSOONLIJKE_VERHALEN_PAD, [])
            .find(v => v.id === req.params.id && v.gebruikerId === req.gebruikerId);
        if (!verhaal) return res.status(404).json({ succes: false, bericht: 'Niet gevonden.' });
        const vorigeDelen = verhaal.delen
            .filter(d => d.nummer < deelNummer && d.tekst.trim())
            .map(d => `Deel ${d.nummer}:\n${d.tekst.trim()}`).join('\n\n');
        const prompt = `Je bent een enthousiaste schrijfcoach voor kinderen van 9-12 jaar.

Verhaal: "${verhaal.titel}"
Personages: ${verhaal.personages || 'vrij te kiezen'}
Onderwerp: ${verhaal.onderwerp || 'vrij te kiezen'}
${vorigeDelen ? `\nWat er al is geschreven:\n${vorigeDelen}\n` : ''}
Schrijf nu een leuke, creatieve suggestie voor deel ${deelNummer} van ${verhaal.aantalDelen}.
Houd het kort (3-6 zinnen), in kindertaal, en maak het spannend of grappig.
Geef ALLEEN de tekst voor het deel, geen uitleg of titels.`;
        const message = await client.messages.create({
            model: 'claude-sonnet-4-6', max_tokens: 350, temperature: 0.75,
            messages: [{ role: 'user', content: prompt }]
        });
        res.json({ succes: true, suggestie: message.content[0].text.trim() });
    } catch (err) {
        res.json({ succes: false, bericht: err.message });
    }
});

// ════════════════════════════════════════
// INGEZONDEN VERHALEN
// ════════════════════════════════════════

// Verhaal insturen (publiek, met AI-moderatie)
app.post('/api/verhaal-insturen', async (req, res) => {
    const { naam, titel, tekst } = req.body;
    if (!naam?.trim()) return res.json({ succes: false, bericht: 'Vul je naam in.' });
    if (!titel?.trim()) return res.json({ succes: false, bericht: 'Vul een titel in.' });
    if (!tekst?.trim() || tekst.trim().length < 20) return res.json({ succes: false, bericht: 'Je verhaal is te kort (minimaal 20 tekens).' });
    try {
        const message = await client.messages.create({
            model: 'claude-haiku-4-5-20251001', max_tokens: 150, temperature: 0,
            messages: [{ role: 'user', content:
                `Beoordeel dit verhaal voor een kinderwebsite (doelgroep 6-14 jaar).
Controleer op: 18+ inhoud, grof geweld, scheldwoorden of ongepaste thema's.
Geef ALLEEN geldig JSON: {"goedgekeurd": true, "reden": ""}
Of bij afkeuring: {"goedgekeurd": false, "reden": "korte kindvriendelijke uitleg waarom niet"}

Verhaal:
"""
${tekst.trim()}
"""`
            }]
        });
        const resultaat = parseAIJson(message.content[0].text);
        if (!resultaat.goedgekeurd) {
            return res.json({ succes: false, bericht: `Je verhaal is helaas niet geaccepteerd. ${resultaat.reden || 'Het voldoet niet aan de richtlijnen voor onze kinderwebsite.'}` });
        }
        const nieuw = {
            id: `ingezonden-${Date.now()}`,
            naam: naam.trim(),
            titel: titel.trim(),
            tekst: tekst.trim(),
            datum: new Date().toISOString().split('T')[0],
            tijdstip: new Date().toISOString(),
            status: 'goedgekeurd'
        };
        const alle = leesJSON(INGEZONDEN_VERHALEN_PAD, []);
        alle.push(nieuw);
        schrijfJSON(INGEZONDEN_VERHALEN_PAD, alle);
        res.json({ succes: true, bericht: 'Je verhaal is goedgekeurd en staat nu op de site! 🎉' });
    } catch (err) {
        res.json({ succes: false, bericht: 'Er ging iets mis. Probeer het opnieuw.' });
    }
});

// Alle goedgekeurde ingezonden verhalen ophalen
app.get('/api/ingezonden-verhalen', (req, res) => {
    res.json(leesJSON(INGEZONDEN_VERHALEN_PAD, []).filter(v => v.status === 'goedgekeurd'));
});

// Admin: ingezonden verhaal verwijderen
app.delete('/api/admin/ingezonden-verhaal/:id', checkAdmin, (req, res) => {
    const alle = leesJSON(INGEZONDEN_VERHALEN_PAD, []);
    const nieuw = alle.filter(v => v.id !== req.params.id);
    if (nieuw.length === alle.length) return res.status(404).json({ succes: false, bericht: 'Niet gevonden.' });
    schrijfJSON(INGEZONDEN_VERHALEN_PAD, nieuw);
    res.json({ succes: true });
});

// ════════════════════════════════════════
// SAMEN SCHRIJVEN — SESSIES
// ════════════════════════════════════════

// Stuur een SSE-update naar alle verbonden clients van een sessie
function sseZend(code, sessie) {
    const lijst = sseVerbindingen.get(code);
    if (!lijst || lijst.length === 0) return;
    const bericht = `data: ${JSON.stringify({ type: 'staat', sessie })}\n\n`;
    for (const res of lijst) {
        try { res.write(bericht); } catch (_) {}
    }
}

// GET /api/sessie/:code/status-stream — SSE verbinding voor real-time updates
app.get('/api/sessie/:code/status-stream', (req, res) => {
    const code = req.params.code.toUpperCase();

    res.setHeader('Content-Type',  'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection',    'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Nginx: schakel buffering uit
    res.flushHeaders();

    // Stuur huidige staat meteen bij verbinden
    const sessies = leesJSON(SAMEN_SESSIES_PAD, []);
    const sessie  = sessies.find(s => s.code === code);
    if (sessie) {
        res.write(`data: ${JSON.stringify({ type: 'staat', sessie })}\n\n`);
    } else {
        res.write(`data: ${JSON.stringify({ type: 'fout', bericht: 'Sessie niet gevonden.' })}\n\n`);
    }

    // Registreer verbinding
    if (!sseVerbindingen.has(code)) sseVerbindingen.set(code, []);
    sseVerbindingen.get(code).push(res);

    // Ping elke 25s om verbinding levend te houden (proxies/firewalls)
    const pingTimer = setInterval(() => {
        try { res.write(': ping\n\n'); } catch (_) { clearInterval(pingTimer); }
    }, 25000);

    // Cleanup bij verbreking
    req.on('close', () => {
        clearInterval(pingTimer);
        const rest = (sseVerbindingen.get(code) || []).filter(r => r !== res);
        if (rest.length > 0) sseVerbindingen.set(code, rest);
        else sseVerbindingen.delete(code);
    });
});

// Genereer een unieke 6-tekens lobbycode (hoofdletters + cijfers)
function genereerLobbycode() {
    const tekens = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += tekens[Math.floor(Math.random() * tekens.length)];
    return code;
}

// POST /api/sessie/nieuw — Maak een nieuwe gezamenlijke schrijfsessie aan
app.post('/api/sessie/nieuw', (req, res) => {
    const { groep, aantalDeelnemers } = req.body;
    if (!groep || !['A', 'B', 'C'].includes(groep)) {
        return res.status(400).json({ succes: false, bericht: 'Ongeldige groep. Kies A, B of C.' });
    }
    const aantal = parseInt(aantalDeelnemers, 10);
    if (isNaN(aantal) || aantal < 2 || aantal > 32) {
        return res.status(400).json({ succes: false, bericht: 'Aantal deelnemers moet tussen 2 en 32 zijn.' });
    }

    const sessies = leesJSON(SAMEN_SESSIES_PAD, []);

    // Zorg dat de lobbycode uniek is
    let code;
    const bestaandeCodes = new Set(sessies.map(s => s.code));
    do { code = genereerLobbycode(); } while (bestaandeCodes.has(code));

    const nieuweSessie = {
        code,
        groep,
        aantalDeelnemers: aantal,
        status: 'wachten',           // wachten | actief | klaar
        aangemaaktOp: new Date().toISOString(),
        deelnemers: [],              // { naam, hoofdstukNummer, hoofdstukTekst, klaar }
        blueprint: null,             // wordt later ingevuld
        eindverhaal: null            // wordt later ingevuld na montage
    };

    sessies.push(nieuweSessie);
    schrijfJSON(SAMEN_SESSIES_PAD, sessies);

    res.json({ succes: true, code, sessie: nieuweSessie });
});

// GET /api/sessie/:code — Haal een sessie op via lobbycode
app.get('/api/sessie/:code', (req, res) => {
    const code = req.params.code.toUpperCase();
    const sessies = leesJSON(SAMEN_SESSIES_PAD, []);
    const sessie = sessies.find(s => s.code === code);
    if (!sessie) return res.status(404).json({ succes: false, bericht: 'Sessie niet gevonden. Controleer de code.' });
    res.json({ succes: true, sessie });
});

// POST /api/sessie/:code/join — Voeg een deelnemer toe aan een sessie
app.post('/api/sessie/:code/join', (req, res) => {
    const code = req.params.code.toUpperCase();
    const { naam } = req.body;
    if (!naam || naam.trim().length < 2) {
        return res.status(400).json({ succes: false, bericht: 'Vul een naam in van minimaal 2 tekens.' });
    }

    const sessies = leesJSON(SAMEN_SESSIES_PAD, []);
    const idx = sessies.findIndex(s => s.code === code);
    if (idx === -1) return res.status(404).json({ succes: false, bericht: 'Sessie niet gevonden. Controleer de code.' });

    const sessie = sessies[idx];
    if (sessie.status !== 'wachten') {
        return res.status(400).json({ succes: false, bericht: 'Deze sessie is al gestart of afgelopen.' });
    }
    if (sessie.deelnemers.length >= sessie.aantalDeelnemers) {
        return res.status(400).json({ succes: false, bericht: 'De sessie zit al vol.' });
    }
    const naamTrimmed = naam.trim();
    if (sessie.deelnemers.some(d => d.naam.toLowerCase() === naamTrimmed.toLowerCase())) {
        return res.status(400).json({ succes: false, bericht: 'Deze naam is al in gebruik in de sessie.' });
    }

    const hoofdstukNummer = sessie.deelnemers.length + 1;
    sessie.deelnemers.push({
        naam: naamTrimmed,
        hoofdstukNummer,
        hoofdstukTekst: null,
        klaar: false
    });

    schrijfJSON(SAMEN_SESSIES_PAD, sessies);
    sseZend(code, sessies[idx]);
    res.json({ succes: true, hoofdstukNummer, sessie: sessies[idx] });
});

// POST /api/sessie/:code/schrijft — Markeer deelnemer als actief schrijvend (voor whiteboard)
app.post('/api/sessie/:code/schrijft', (req, res) => {
    const code = req.params.code.toUpperCase();
    const { hoofdstukNummer } = req.body;
    const sessies = leesJSON(SAMEN_SESSIES_PAD, []);
    const idx = sessies.findIndex(s => s.code === code);
    if (idx === -1) return res.status(404).json({ succes: false, bericht: 'Sessie niet gevonden.' });
    const dIdx = sessies[idx].deelnemers.findIndex(d => d.hoofdstukNummer === hoofdstukNummer);
    if (dIdx !== -1) sessies[idx].deelnemers[dIdx].schrijft = true;
    schrijfJSON(SAMEN_SESSIES_PAD, sessies);
    sseZend(code, sessies[idx]);
    res.json({ succes: true });
});

// POST /api/sessie/:code/hoofdstuk — Sla een ingestuurd hoofdstuk op
app.post('/api/sessie/:code/hoofdstuk', (req, res) => {
    const code = req.params.code.toUpperCase();
    const { hoofdstukNummer, tekst } = req.body;

    if (!tekst || tekst.trim().split(/\s+/).filter(Boolean).length < 10) {
        return res.status(400).json({ succes: false, bericht: 'Je verhaal is te kort.' });
    }

    const sessies = leesJSON(SAMEN_SESSIES_PAD, []);
    const idx = sessies.findIndex(s => s.code === code);
    if (idx === -1) return res.status(404).json({ succes: false, bericht: 'Sessie niet gevonden.' });

    const sessie = sessies[idx];
    if (sessie.status !== 'actief') {
        return res.status(400).json({ succes: false, bericht: 'De sessie is niet actief.' });
    }

    const dIdx = sessie.deelnemers.findIndex(d => d.hoofdstukNummer === parseInt(hoofdstukNummer, 10));
    if (dIdx === -1) return res.status(404).json({ succes: false, bericht: 'Deelnemer niet gevonden.' });
    if (sessie.deelnemers[dIdx].klaar) {
        return res.json({ succes: true, bericht: 'Al ingestuurd.' });
    }

    sessies[idx].deelnemers[dIdx].hoofdstukTekst = tekst.trim();
    sessies[idx].deelnemers[dIdx].klaar          = true;
    sessies[idx].deelnemers[dIdx].schrijft        = false;
    sessies[idx].deelnemers[dIdx].ingezondOp      = new Date().toISOString();

    // Als iedereen klaar is: sessie op 'klaar' zetten
    const alleKlaar = sessies[idx].deelnemers.every(d => d.klaar);
    if (alleKlaar) sessies[idx].status = 'klaar';

    schrijfJSON(SAMEN_SESSIES_PAD, sessies);
    sseZend(code, sessies[idx]);
    res.json({ succes: true, alleKlaar, sessie: sessies[idx] });
});

// POST /api/sessie/:code/blueprint — Genereer Story Blueprint + start de sessie
app.post('/api/sessie/:code/blueprint', async (req, res) => {
    const code = req.params.code.toUpperCase();
    const sessies = leesJSON(SAMEN_SESSIES_PAD, []);
    const idx = sessies.findIndex(s => s.code === code);
    if (idx === -1) return res.status(404).json({ succes: false, bericht: 'Sessie niet gevonden.' });

    const sessie = sessies[idx];
    if (sessie.status !== 'wachten') {
        return res.status(400).json({ succes: false, bericht: 'Sessie is al gestart of afgelopen.' });
    }
    if (sessie.deelnemers.length < 2) {
        return res.status(400).json({ succes: false, bericht: 'Er zijn minimaal 2 deelnemers nodig om te starten.' });
    }

    try {
        const groep = sessie.groep;
        const stijl = LEEFTIJD_STIJL[groep];
        const inspiratie = kiesInspiratie(groep);
        const aantalHoofdstukken = sessie.deelnemers.length;

        const deelnemersLijst = sessie.deelnemers
            .map(d => `Hoofdstuk ${d.hoofdstukNummer}: ${d.naam}`)
            .join('\n');

        const prompt = `Je bent een creatieve schrijfcoach die een samen-schrijf-avontuur begeleidt voor kinderen van ${stijl.naam}.
Er zijn ${aantalHoofdstukken} kinderen die elk één hoofdstuk schrijven. Samen vormen ze één doorlopend verhaal.

DEELNEMERS EN HUN HOOFDSTUK:
${deelnemersLijst}

INSPIRATIE (gebruik dit als vertrekpunt, niet als letterlijke instructie):
- Thema-ideeën: ${inspiratie.gekozenThemas.join(' | ')}
- Omgeving: ${inspiratie.gekozenOmgeving[0] || ''}
- Hoofdpersonage-type: ${inspiratie.gekozenPersonage[0] || ''}
- Magisch object: ${inspiratie.gekozenObject[0] || ''}
- Dier als metgezel: ${inspiratie.gekozenDier[0] || ''}
- Verhaalstarter: ${inspiratie.gekozenHook[0] || ''}

INSTRUCTIES:
- Maak een overkoepelend verhaalplan dat logisch werkt voor ${aantalHoofdstukken} hoofdstukken
- Elk hoofdstuk bouwt voort op het vorige — de verhaaldraad moet doorlopen
- Eerste hoofdstuk introduceert de wereld en het probleem
- Tussenhoofdstukken bouwen spanning op
- Laatste hoofdstuk brengt een bevredigend einde
- Schrijf in vrolijk, kindvriendelijk Nederlands voor ${stijl.naam}
- De sleutelwoorden per hoofdstuk MOETEN het kind verplicht verwerken (max 3 woorden)
- Elk hoofdstuk: max ${stijl.maxWoorden} woorden

Geef ALLEEN geldig JSON:
{
  "titel": "pakkende verhaaltitel",
  "setting": "korte beschrijving van de wereld/omgeving (2 zinnen)",
  "beginscene": "hoe begint het verhaal precies — de openingsscène (2-3 zinnen voor context)",
  "hoofdstukken": [
    {
      "nummer": 1,
      "schrijver": "naam van de schrijver",
      "opdracht": "wat dit kind schrijft — concrete schrijfopdracht in kindertaal (2-3 zinnen, spreek aan met 'jij')",
      "verhaaldraad": "wat er in dit hoofdstuk moet gebeuren voor de rode lijn (1 zin, voor de leraar/intern)",
      "beginpunt": "waar begint dit hoofdstuk precies (1 zin, tegenwoordige tijd)",
      "sleutelwoorden": ["woord1", "woord2", "woord3"]
    }
  ]
}`;

        const message = await client.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 200 + (aantalHoofdstukken * 150),
            temperature: 0.7,
            messages: [{ role: 'user', content: prompt }]
        });

        const blueprint = parseAIJson(message.content[0].text);

        // Valideer dat de AI het juiste aantal hoofdstukken heeft gegenereerd
        if (!blueprint.hoofdstukken || blueprint.hoofdstukken.length !== aantalHoofdstukken) {
            // Herstel indien nodig: vul ontbrekende hoofdstukken aan
            while ((blueprint.hoofdstukken || []).length < aantalHoofdstukken) {
                const nr = (blueprint.hoofdstukken?.length || 0) + 1;
                const deelnemer = sessie.deelnemers.find(d => d.hoofdstukNummer === nr);
                blueprint.hoofdstukken = blueprint.hoofdstukken || [];
                blueprint.hoofdstukken.push({
                    nummer: nr,
                    schrijver: deelnemer?.naam || `Schrijver ${nr}`,
                    opdracht: `Schrijf hoofdstuk ${nr} van het verhaal. Bouw voort op wat er al is gebeurd.`,
                    verhaaldraad: `Hoofdstuk ${nr}`,
                    beginpunt: 'Het verhaal gaat verder...',
                    sleutelwoorden: ['avontuur', 'moed', 'vriendschap']
                });
            }
        }

        // Zet status op actief en sla blueprint op
        sessies[idx].blueprint = blueprint;
        sessies[idx].status = 'actief';
        sessies[idx].gestartOp = new Date().toISOString();
        schrijfJSON(SAMEN_SESSIES_PAD, sessies);
        sseZend(code, sessies[idx]);

        res.json({ succes: true, blueprint, sessie: sessies[idx] });
    } catch (err) {
        console.error('Fout bij genereren blueprint:', err);
        res.json({ succes: false, bericht: err.message });
    }
});

// GET /api/admin/sessies — Alle samen-sessies voor de admin
app.get('/api/admin/sessies', checkAdmin, (_req, res) => {
    const sessies = leesJSON(SAMEN_SESSIES_PAD, []);
    res.json({ succes: true, sessies });
});

// POST /api/sessie/:code/montage — AI samenvoegen van alle hoofdstukken
app.post('/api/sessie/:code/montage', async (req, res) => {
    const code = req.params.code.toUpperCase();
    const sessies = leesJSON(SAMEN_SESSIES_PAD, []);
    const idx = sessies.findIndex(s => s.code === code);
    if (idx === -1) return res.status(404).json({ succes: false, bericht: 'Sessie niet gevonden.' });

    const sessie = sessies[idx];
    if (sessie.status !== 'klaar') {
        return res.status(400).json({ succes: false, bericht: 'Niet alle hoofdstukken zijn ingestuurd.' });
    }
    if (sessie.eindverhaal) {
        return res.json({ succes: true, eindverhaal: sessie.eindverhaal, sessie });
    }

    const klaarDeelnemers = sessie.deelnemers.filter(d => d.klaar && d.hoofdstukTekst);
    if (klaarDeelnemers.length === 0) {
        return res.status(400).json({ succes: false, bericht: 'Geen ingestuurde hoofdstukken gevonden.' });
    }

    try {
        const bp = sessie.blueprint || {};
        const groep = sessie.groep || 'B';
        const stijl = LEEFTIJD_STIJL[groep] || LEEFTIJD_STIJL['B'];

        const hoofdstukkenTekst = klaarDeelnemers
            .sort((a, b) => a.hoofdstukNummer - b.hoofdstukNummer)
            .map(d => {
                const bpHst = (bp.hoofdstukken || []).find(h => h.nummer === d.hoofdstukNummer) || {};
                return `=== HOOFDSTUK ${d.hoofdstukNummer}: ${d.naam.toUpperCase()} ===\nOpdracht was: ${bpHst.opdracht || ''}\nVerhaaldraad: ${bpHst.verhaaldraad || ''}\n\nGeschreven tekst:\n${d.hoofdstukTekst}`;
            })
            .join('\n\n');

        const prompt = `Je bent een kinderboekenredacteur die het samengestelde verhaal van ${klaarDeelnemers.length} kinderen (groep ${groep}, ${stijl.naam}) afwerkt.

VERHAALTITEL: ${bp.titel || 'Ons Samen Verhaal'}
SETTING: ${bp.setting || ''}
BEGINSCÈNE: ${bp.beginscene || ''}

INGESTUURDE HOOFDSTUKKEN:
${hoofdstukkenTekst}

JOUW TAAK:
Bewerk dit gezamenlijke verhaal zodat het één vloeiend, samenhangend geheel wordt.
Regels:
- Bewaar de KERN en het PLEZIER van elke inzending — kinderen moeten hun eigen deel herkennen
- Maak overgangen tussen hoofdstukken soepel (voeg maximaal 1-2 verbindingszinnen toe tussen hoofdstukken)
- Corrigeer taalfouten subtiel, maar behoud de kindertaal en de energie van het origineel
- Schrijf in vrolijk, kindvriendelijk Nederlands voor ${stijl.naam}
- Elk hoofdstuk blijft een apart blok met de naam van de schrijver erbij
- Voeg een korte, pakkende afsluiting toe als het laatste hoofdstuk geen duidelijk einde heeft

Geef ALLEEN geldig JSON terug (geen markdown):
{
  "titel": "definitieve verhaaltitel (mag iets pakkender zijn dan het origineel)",
  "hoofdstukken": [
    {
      "nummer": 1,
      "schrijver": "naam van de schrijver",
      "tekst": "bewerkte hoofdstuktekst"
    }
  ],
  "slotwoord": "korte afsluiting of moraal van het verhaal (1-2 zinnen, optioneel)"
}`;

        const message = await client.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 400 + (klaarDeelnemers.length * 500),
            temperature: 0.6,
            messages: [{ role: 'user', content: prompt }]
        });

        const eindverhaal = parseAIJson(message.content[0].text);

        sessies[idx].eindverhaal = eindverhaal;
        sessies[idx].montageOp = new Date().toISOString();
        schrijfJSON(SAMEN_SESSIES_PAD, sessies);
        sseZend(code, sessies[idx]);

        res.json({ succes: true, eindverhaal, sessie: sessies[idx] });
    } catch (err) {
        console.error('Fout bij montage:', err);
        res.status(500).json({ succes: false, bericht: 'De AI kon het verhaal niet samenvoegen. Probeer opnieuw.' });
    }
});

// ════════════════════════════════════════
// START SERVER
// ════════════════════════════════════════
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n🚀 Server draait op http://localhost:${PORT}`);
    console.log(`🔒 Admin paneel:    http://localhost:${PORT}/admin.html`);
    console.log(`👤 Login pagina:    http://localhost:${PORT}/login.html`);
    console.log(`🎬 Video pagina:    http://localhost:${PORT}/videos.html`);
    console.log(`📜 Gebruiksregels: http://localhost:${PORT}/regels.html`);
    console.log(`\n💡 Zorg dat ADMIN_WACHTWOORD en EMAIL_GEBRUIKER in je .env staan!\n`);
});
