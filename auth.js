// auth.js — Gedeelde auth-helpers voor alle pagina's
// Ingeladen via <script src="auth.js"></script>

const AUTH = (() => {

    const TOKEN_KEY   = 'userToken';
    const REFRESH_KEY = 'userRefreshToken';
    const INFO_KEY    = 'userInfo';

    function getToken()     { return localStorage.getItem(TOKEN_KEY); }
    function getRefresh()   { return localStorage.getItem(REFRESH_KEY); }
    function getUserInfo()  {
        try { return JSON.parse(localStorage.getItem(INFO_KEY)); } catch { return null; }
    }

    function slaOp(token, refreshToken, gebruiker) {
        if (token)        localStorage.setItem(TOKEN_KEY, token);
        if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
        if (gebruiker)    localStorage.setItem(INFO_KEY, JSON.stringify({
            id:             gebruiker.id,
            gebruikersnaam: gebruiker.gebruikersnaam,
            leeftijdsgroep: gebruiker.leeftijdsgroep,
            is_admin:       gebruiker.is_admin || false
        }));
    }

    function wis() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_KEY);
        localStorage.removeItem(INFO_KEY);
        // Verwijder ook de oude sleutels (voor bestaande sessies)
        localStorage.removeItem('authToken');
        localStorage.removeItem('userInfo');
    }

    async function uitloggen() {
        const token = getToken();
        if (token) {
            try {
                await fetch('/api/auth/admin/logout', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            } catch { /* stil falen is ok */ }
        }
        wis();
        window.location.href = 'index.html';
    }

    function getHeaders(extraHeaders = {}) {
        const token = getToken();
        return {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...extraHeaders
        };
    }

    async function apiFetch(url, opties = {}) {
        const token = getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...(opties.headers || {})
        };
        const r = await fetch(url, { ...opties, headers });
        if (r.status === 401) {
            // Token verlopen — uitloggen
            wis();
            window.location.href = 'login.html';
            return null;
        }
        return r.json();
    }

    // Initialiseer de navigatiebalk op elke pagina
    function initNav() {
        const p = (location.pathname.split('/').pop() || 'index.html').split('?')[0];
        document.querySelectorAll('#hoofdNav a[href]').forEach(a => {
            if (a.getAttribute('href').split('?')[0] === p) a.classList.add('actief');
        });

        const u = getUserInfo();
        if (!u) return;

        const ll = document.getElementById('navLoginLink');
        if (ll) {
            const badge = document.createElement('span');
            badge.className = 'nav-agent';
            badge.title = 'Ingelogd als ' + u.gebruikersnaam;
            badge.textContent = '📖 ' + u.gebruikersnaam;

            const ul = document.createElement('a');
            ul.className = 'nav-agent-uitloggen';
            ul.href = '#';
            ul.textContent = '🚪 Uitloggen';
            ul.addEventListener('click', e => { e.preventDefault(); uitloggen(); });

            ll.replaceWith(badge);
            badge.insertAdjacentElement('afterend', ul);
        }

        const md = document.getElementById('navMijnDossierLink');
        if (md) md.style.display = '';

        const gc = document.getElementById('navGeheimeClubLink');
        if (gc) gc.style.display = 'inline-flex';
    }

    return { getToken, getRefresh, getUserInfo, slaOp, wis, uitloggen, getHeaders, apiFetch, initNav };
})();
