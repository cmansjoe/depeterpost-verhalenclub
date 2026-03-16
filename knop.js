// ── Knop Component: cursor-glow + click-ripple ──────────────
// Gebaseerd op hover-glow-button + ripple-button (knop.txt)
(function () {
  'use strict';

  function initKnop(btn) {
    if (btn._knopInit) return;
    btn._knopInit = true;

    // Cursor-glow: CSS custom properties bijwerken bij hover
    btn.addEventListener('mousemove', function (e) {
      var r = this.getBoundingClientRect();
      this.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      this.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });

    // Click-ripple: cirkel die uitdijt vanaf klikpunt
    btn.addEventListener('click', function (e) {
      if (this.disabled) return;
      var r    = this.getBoundingClientRect();
      var size = Math.max(r.width, r.height) * 2.4;
      var x    = e.clientX - r.left - size / 2;
      var y    = e.clientY - r.top  - size / 2;

      var ripple = document.createElement('span');
      ripple.className = 'knop-ripple';
      ripple.style.cssText =
        'width:'  + size + 'px;' +
        'height:' + size + 'px;' +
        'left:'   + x    + 'px;' +
        'top:'    + y    + 'px;';
      this.appendChild(ripple);
      ripple.addEventListener('animationend', function () { ripple.remove(); });
    });
  }

  function initAlle() {
    document.querySelectorAll('.knop').forEach(initKnop);
  }

  // Init bij laden
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAlle);
  } else {
    initAlle();
  }

  // Herinitaliseer bij dynamisch toegevoegde knoppen (bijv. verhalen-kaarten)
  document.addEventListener('DOMContentLoaded', function () {
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        m.addedNodes.forEach(function (node) {
          if (node.nodeType !== 1) return;
          if (node.classList && node.classList.contains('knop')) initKnop(node);
          if (node.querySelectorAll) node.querySelectorAll('.knop').forEach(initKnop);
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });
})();
