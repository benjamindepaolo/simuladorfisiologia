/* Referencia: la portada y cada simulador llevan este script pegado como <script id="mac-js">.
   El marcado de la barra lateral y de la barra de herramientas se describe en REGISTRO.md (parte 6).
   Los HTML no dependen de este archivo. */
/* NAVEGACIÓN MAC · Fisiología v4 · 2026-10-02
   - Barra lateral: fija a la izquierda cuando la ventana tiene 1440 px o más (se puede ocultar
     y se recuerda la elección en "fisio-barra"); más angosta, se abre por encima con el botón.
   - FisioNav.marcar(clave): resalta en la barra la sección abierta. */
(function () {
  'use strict';
  var R = document.documentElement, KEY = 'fisio-barra', ANCHO_FIJA = 1440;
  var bl = document.getElementById('barraLateral');
  if (!bl) return;
  var botones = Array.prototype.slice.call(document.querySelectorAll('[data-bl-alternar]'));

  function pref() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function guardar(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  function fijaPosible() { return window.innerWidth >= ANCHO_FIJA; }
  function visible() { return R.classList.contains('bl-fija') || R.classList.contains('bl-abierta'); }
  function avisar() {
    requestAnimationFrame(function () { window.dispatchEvent(new Event('resize')); });
    setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 360);
  }
  function sync() {
    var v = visible();
    botones.forEach(function (b) { b.setAttribute('aria-expanded', v ? 'true' : 'false'); });
    bl.inert = !v;
  }
  function aplicar() {
    var antes = R.classList.contains('bl-fija');
    var fija = fijaPosible() && pref() !== 'oculta';
    R.classList.toggle('bl-fija', fija);
    if (fija) R.classList.remove('bl-abierta');
    if (antes !== fija) avisar();
    sync();
  }
  function alternar() {
    if (fijaPosible()) {
      var fija = !R.classList.contains('bl-fija');
      guardar(fija ? 'visible' : 'oculta');
      R.classList.toggle('bl-fija', fija);
      avisar();
    } else {
      R.classList.toggle('bl-abierta');
      if (R.classList.contains('bl-abierta')) {
        var a = bl.querySelector('[aria-current], .actual, a');
        if (a) { try { a.focus({ preventScroll: true }); } catch (e) {} }
      }
    }
    sync();
  }
  function cerrarEncima() {
    if (!R.classList.contains('bl-abierta')) return;
    R.classList.remove('bl-abierta'); sync();
    if (botones[0]) { try { botones[0].focus({ preventScroll: true }); } catch (e) {} }
  }

  botones.forEach(function (b) { b.addEventListener('click', alternar); });
  Array.prototype.forEach.call(document.querySelectorAll('[data-bl-cerrar]'), function (v) { v.addEventListener('click', cerrarEncima); });
  bl.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a');
    if (a && R.classList.contains('bl-abierta')) setTimeout(cerrarEncima, 60);
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrarEncima(); });
  window.addEventListener('resize', function () {
    var f = fijaPosible();
    if (f !== aplicar.f) { aplicar.f = f; aplicar(); }
  });
  aplicar.f = fijaPosible();
  aplicar();
  requestAnimationFrame(function () { requestAnimationFrame(function () { R.classList.remove('bl-sin-anim'); }); });

  window.FisioNav = {
    alternar: alternar,
    marcar: function (k) {
      Array.prototype.forEach.call(bl.querySelectorAll('.bl-subs [data-k]'), function (a) {
        if (a.getAttribute('data-k') === k) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      });
    }
  };
})();
