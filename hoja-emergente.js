/* Referencia: cada simulador lleva este script pegado como <script id="hoja-js">, junto con los bloques
   «HOJA EMERGENTE» y «ESTÉTICA MAC» de estetica-comun.css. Los HTML no dependen de este archivo. */
/* HOJA EMERGENTE · Fisiología v4 · 2026-10-02 (abre también desde [data-hoja-alternar] en la barra)
   Lo visual y la explicación quedan en pantalla; controles y resultados, en la hoja.
   - Compu (≥ 1100 px): panel lateral que se apoya sobre la columna de explicación
     (atributo data-ancla de la hoja). Si no hay columna visible, va contra el borde derecho.
   - Celular y tablet: hoja inferior con altura media (deja ver el dibujo) y grande.
   Marcado: .hoja-fab · #hoja[data-ancla][data-panel] · .hoja-velo · .hoja-espacio
   Dentro de la hoja: [data-hoja-sec] (pestañas) · .hoja-sec[data-sec] · [data-hoja-elegir]
   (los botones de ese bloque cierran la hoja al elegir) · [data-hoja-cerrar].
   Fuera: [data-hoja-tope] (barras fijas que la hoja no debe tapar) · [data-hoja-mirar]
   (lo que se vuelve a mostrar al cerrar tras elegir un escenario).
   API: FisioHoja.abrir([sec]) · .cerrar([{mirar}]) · .seccion(sec) · .mostrar(selector)
        · .contador(n) · .abierta() */
(function () {
  'use strict';
  var R = document.documentElement;
  var hoja, fab, velo, cuerpo, cab, espacio, anclas = [], panel = null, abridores = [], ultimo = null;
  var abierta = false, grande = false, modo = '', lado = { left: 0, width: 380 }, raf = 0;
  var MQ = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function visible(el) { return !!el && el.getClientRects().length > 0; }
  function suave() { return MQ && MQ.matches ? 'auto' : 'smooth'; }
  function anchoVista() { return R.clientWidth || window.innerWidth; }

  function anclaVisible() {
    for (var i = 0; i < anclas.length; i++) {
      var el = $(anclas[i]);
      if (visible(el)) {
        var b = el.getBoundingClientRect(), cs = getComputedStyle(el);
        var pl = parseFloat(cs.paddingLeft) || 0, pr = parseFloat(cs.paddingRight) || 0, pt = parseFloat(cs.paddingTop) || 0;
        var r = { left: b.left + pl, right: b.right - pr, top: b.top + pt, width: b.width - pl - pr, height: b.height };
        if (r.width > 0 && r.height > 0) return { el: el, r: r };
      }
    }
    return null;
  }
  function anclaALaDerecha(a) { return !!a && a.r.left > anchoVista() * 0.45; }
  function altoContenido() { return cab.offsetHeight + cuerpo.scrollHeight + 6; }
  function altoMedio() {
    var h = Math.min(Math.max(320, window.innerHeight * (window.innerWidth < 700 ? 0.46 : 0.5)), window.innerHeight - 72);
    return Math.round(Math.min(h, altoContenido()));
  }
  function altoGrande() { return Math.round(Math.min(window.innerHeight - 24, Math.max(altoMedio(), altoContenido()))); }

  function medir() {
    if (!hoja) return;
    var w = anchoVista(), a = anclaVisible(), m = 'inferior';
    if (w >= 1100) m = 'lateral';           // en compu, siempre al costado (sobre la columna de explicación si está a la derecha)
    if (m !== modo) {
      hoja.classList.add('sin-anim');
      R.classList.toggle('hoja-lateral', m === 'lateral');
      R.classList.toggle('hoja-inferior', m === 'inferior');
      modo = m; grande = false; R.classList.remove('hoja-grande');
      requestAnimationFrame(function () { requestAnimationFrame(function () { hoja.classList.remove('sin-anim'); }); });
    }
    anclas.forEach(function (sel) { var el = $(sel); if (el) el.classList.toggle('hoja-cubierta', abierta && m === 'lateral' && !!a && a.el === el && anclaALaDerecha(a)); });
    if (m === 'lateral') {
      var left, width;
      if (anclaALaDerecha(a)) {
        width = Math.max(a.r.width, 340); left = a.r.left;
        if (left + width > w - 12) left = w - 12 - width;
      } else { width = Math.min(390, w - 40); left = w - 20 - width; }
      lado = { left: Math.round(left), width: Math.round(width) };
      hoja.style.left = lado.left + 'px'; hoja.style.width = lado.width + 'px'; hoja.style.right = 'auto';
      hoja.style.height = '';
      R.style.setProperty('--hoja-fab-der', Math.max(16, Math.round(w - (left + width))) + 'px');
      posicion();
    } else {
      hoja.style.left = ''; hoja.style.width = ''; hoja.style.right = ''; hoja.style.top = ''; hoja.style.maxHeight = '';
      if (!hoja.classList.contains('arrastrando')) hoja.style.height = (grande ? altoGrande() : altoMedio()) + 'px';
      R.style.removeProperty('--hoja-fab-der');
    }
    espaciar();
  }

  function posicion() {
    raf = 0;
    if (!hoja || modo !== 'lateral') return;
    var top = 16, a = anclaVisible();
    if (anclaALaDerecha(a)) top = Math.max(top, a.r.top);
    $$('[data-hoja-tope]').forEach(function (t) {
      if (!visible(t)) return;
      var r = t.getBoundingClientRect();
      if (r.bottom > 0 && r.height > 0 && r.right > lado.left && r.left < lado.left + lado.width) top = Math.max(top, r.bottom + 12);
    });
    top = Math.round(Math.min(top, window.innerHeight * 0.42));
    hoja.style.top = top + 'px';
    hoja.style.maxHeight = (window.innerHeight - top - 16) + 'px';
  }
  function alDesplazar() { if (!raf) raf = requestAnimationFrame(posicion); }

  function espaciar() {
    if (!espacio) return;
    espacio.style.height = (abierta && modo === 'inferior') ? (hoja.offsetHeight + 'px') : '';
  }

  function topeFijo() {
    var b = 0;
    $$('[data-hoja-tope]').forEach(function (t) {
      if (!visible(t)) return;
      var r = t.getBoundingClientRect(), cs = getComputedStyle(t);
      if (cs.position === 'fixed' && r.bottom > 0) b = Math.max(b, r.bottom);
      // pegajosa: cuenta donde queda una vez pegada, no donde está ahora
      else if (cs.position === 'sticky') b = Math.max(b, (parseFloat(cs.top) || 0) + r.height);
    });
    return b;
  }

  function abrir(sec) {
    if (!init()) return;
    if (sec) seccion(sec);
    if (abierta || R.classList.contains('hoja-off')) return;
    abierta = true; grande = false;
    var act = document.activeElement;
    ultimo = (act && (act === fab || abridores.indexOf(act) >= 0)) ? act : null;
    R.classList.remove('hoja-grande');
    medir();
    hoja.inert = false; hoja.removeAttribute('aria-hidden');
    R.classList.add('hoja-abierta');
    fab.setAttribute('aria-expanded', 'true');
    abridores.forEach(function (b) { b.setAttribute('aria-expanded', 'true'); });
    if (modo === 'lateral') {
      var a = anclaVisible();
      if (anclaALaDerecha(a) && a.r.top > window.innerHeight * 0.42) {
        window.scrollBy({ top: a.r.top - topeFijo() - 16, behavior: suave() });
      }
    } else {
      // hoja inferior: si el dibujo quedó por debajo (o ya pasó), se sube para que se vea arriba de la hoja
      var m = $('[data-hoja-mirar]');
      if (visible(m)) {
        var r = m.getBoundingClientRect(), t = topeFijo();
        if (r.top > t + 12 || r.bottom < t + 60) window.scrollBy({ top: r.top - t - 8, behavior: suave() });
      }
    }
    espaciar();
    var foco = $('[data-hoja-sec][aria-selected="true"]', hoja) || $('.hoja-tt', hoja);
    if (foco) { try { foco.focus({ preventScroll: true }); } catch (e) { foco.focus(); } }
  }

  function cerrar(o) {
    if (!hoja || !abierta) return;
    var dentro = hoja.contains(document.activeElement);
    abierta = false; grande = false;
    R.classList.remove('hoja-abierta', 'hoja-grande');
    hoja.inert = true; hoja.setAttribute('aria-hidden', 'true');
    hoja.style.setProperty('--hoja-desp', '0px');
    fab.setAttribute('aria-expanded', 'false');
    abridores.forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
    $$('.hoja-cubierta').forEach(function (el) { el.classList.remove('hoja-cubierta'); });
    espaciar();
    if (dentro && !R.classList.contains('hoja-off')) {
      // el foco vuelve al botón que la abrió, o al que esté a la vista
      var dest = ultimo && ultimo.offsetParent !== null ? ultimo : (modo === 'lateral' ? (abridores.filter(function (b) { return b.offsetParent !== null; })[0] || fab) : fab);
      try { dest.focus({ preventScroll: true }); } catch (e) {}
    }
    if (o && o.mirar) {
      var m = $('[data-hoja-mirar]');
      if (visible(m)) {
        var r = m.getBoundingClientRect();
        if (r.bottom < 80 || r.top > window.innerHeight - 80) m.scrollIntoView({ behavior: suave(), block: 'start' });
      }
    }
  }

  function setGrande(g) {
    grande = !!g;
    R.classList.toggle('hoja-grande', grande);
    hoja.style.height = (grande ? altoGrande() : altoMedio()) + 'px';
    espaciar();
  }

  function seccion(k) {
    if (!init()) return;
    var ok = false;
    $$('.hoja-sec', hoja).forEach(function (s) { if (s.dataset.sec === k) ok = true; });
    if (!ok) return;
    $$('.hoja-sec', hoja).forEach(function (s) { s.hidden = s.dataset.sec !== k; });
    $$('[data-hoja-sec]', hoja).forEach(function (b) {
      var on = b.dataset.hojaSec === k;
      b.setAttribute('aria-selected', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1;
    });
    cuerpo.scrollTop = 0;
    if (modo === 'inferior' && abierta && !hoja.classList.contains('arrastrando')) hoja.style.height = (grande ? altoGrande() : altoMedio()) + 'px';
    espaciar();
    // lo que se dibuja según el ancho (lienzos) vuelve a medirse
    requestAnimationFrame(function () { window.dispatchEvent(new Event('resize')); });
  }

  function mostrar(sel) {
    if (!init()) return;
    var el = typeof sel === 'string' ? $(sel) : sel;
    if (!el || !hoja.contains(el)) return;
    var s = el.closest('.hoja-sec');
    if (s && s.hidden) seccion(s.dataset.sec);
    abrir();
    requestAnimationFrame(function () {
      var top = el.getBoundingClientRect().top - cuerpo.getBoundingClientRect().top + cuerpo.scrollTop - 8;
      cuerpo.scrollTo({ top: Math.max(0, top), behavior: suave() });
      el.classList.remove('hoja-resalta'); void el.offsetWidth; el.classList.add('hoja-resalta');
    });
  }

  function contador(n) {
    if (!init()) return;
    $$('.hoja-fab-n').forEach(function (b) { b.textContent = n ? String(n) : ''; b.hidden = !n; });
  }

  function vigilar() {
    var on = !panel || visible(panel);
    R.classList.toggle('hoja-off', !on);
    if (!on) cerrar(); else medir();
  }

  function arrastre() {
    var y0 = null, t0 = 0, h0 = 0, dy = 0, movio = false, enAsa = false;
    cab.addEventListener('pointerdown', function (e) {
      if (modo !== 'inferior' || !abierta) return;
      if (e.button) return;
      enAsa = !!e.target.closest('.hoja-asa');
      if (!enAsa && e.target.closest('button,a,input,select,textarea,label')) return;
      y0 = e.clientY; t0 = performance.now(); h0 = hoja.getBoundingClientRect().height; dy = 0; movio = false;
      try { cab.setPointerCapture(e.pointerId); } catch (err) {}
      hoja.classList.add('arrastrando');
    });
    cab.addEventListener('pointermove', function (e) {
      if (y0 === null) return;
      dy = e.clientY - y0; if (Math.abs(dy) > 5) movio = true;
      if (!movio) return;
      var hm = altoMedio(), hg = altoGrande(), h = h0 - dy;
      if (h > hg) h = hg + (h - hg) * 0.15;
      if (h >= hm) { hoja.style.height = h + 'px'; hoja.style.setProperty('--hoja-desp', '0px'); }
      else { hoja.style.height = hm + 'px'; hoja.style.setProperty('--hoja-desp', (hm - h) + 'px'); }
    });
    function fin() {
      if (y0 === null) return;
      var v = dy / Math.max(1, performance.now() - t0), h = h0 - dy, hm = altoMedio(), hg = altoGrande();
      y0 = null;
      hoja.classList.remove('arrastrando');
      if (!movio) { if (enAsa) setGrande(!grande); return; }
      if (h < hm * 0.72 || (v > 0.8 && h < hm + 60)) { cerrar(); hoja.style.height = hm + 'px'; return; }
      hoja.style.setProperty('--hoja-desp', '0px');
      setGrande(hg > hm + 40 && (v < -0.5 || (v <= 0.5 && h > (hm + hg) / 2)));
    }
    cab.addEventListener('pointerup', fin);
    cab.addEventListener('pointercancel', fin);
  }

  function init() {
    if (hoja) return true;
    hoja = document.getElementById('hoja');
    if (!hoja) return false;
    fab = $('.hoja-fab'); velo = $('.hoja-velo'); espacio = $('.hoja-espacio');
    cuerpo = $('.hoja-cuerpo', hoja); cab = $('.hoja-cab', hoja);
    anclas = (hoja.getAttribute('data-ancla') || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    panel = hoja.getAttribute('data-panel') ? $(hoja.getAttribute('data-panel')) : null;
    anclas.forEach(function (sel) { var el = $(sel); if (el) el.classList.add('hoja-ancla'); });
    hoja.inert = true; hoja.setAttribute('aria-hidden', 'true');

    fab.addEventListener('click', function () { abrir(); });
    abridores = $$('[data-hoja-alternar]');
    abridores.forEach(function (b) { b.addEventListener('click', function () { if (abierta) cerrar(); else abrir(); }); });
    $$('[data-hoja-cerrar]').forEach(function (b) { b.addEventListener('click', function () { cerrar(); }); });
    var pest = $$('[data-hoja-sec]', hoja);
    pest.forEach(function (b, i) {
      b.addEventListener('click', function () { seccion(b.dataset.hojaSec); });
      b.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        var n = pest[(i + (e.key === 'ArrowRight' ? 1 : pest.length - 1)) % pest.length];
        seccion(n.dataset.hojaSec); n.focus();
      });
    });
    hoja.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-hoja-elegir] button');
      if (b && !b.disabled) setTimeout(function () { cerrar({ mirar: true }); }, 200);
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && abierta) cerrar(); });
    arrastre();
    window.addEventListener('resize', medir);
    window.addEventListener('scroll', alDesplazar, { passive: true });
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(function () { medir(); });
      ro.observe(document.body);
      anclas.forEach(function (s) { var el = $(s); if (el) ro.observe(el); });
    }
    if (panel && window.MutationObserver) new MutationObserver(vigilar).observe(panel, { attributes: true, attributeFilter: ['class', 'hidden', 'style'] });
    vigilar(); medir();
    return true;
  }

  window.FisioHoja = {
    abrir: abrir, cerrar: cerrar, seccion: seccion, mostrar: mostrar, contador: contador,
    abierta: function () { return abierta; }
  };
  init();
})();
