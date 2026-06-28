/* ============================================================
   29projects Lab — behaviour
   A framework-free port of the Claude Design `DCLogic` component
   (design/29projects-lab.dc.html). Reproduces, with no runtime
   dependency:
     • the data-hover / data-focus / data-active pseudo-state layering
       that the design runtime applied to inline styles
     • the cold-open intro lifecycle (timers, skip, reduced-motion)
     • scroll reveals + animated stat counters (IntersectionObserver)
     • the Request Board form (validation, domain chips, submit, reset)
   ============================================================ */
(function () {
  'use strict';

  var reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var on = function (el, ev, fn) { el.addEventListener(ev, fn); };
  var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };

  /* ----------------------------------------------------------
     1. Pseudo-state interaction shim
     Replaces the design runtime's style-hover / style-focus /
     style-active. Each element's resting style lives in
     dataset.baseStyle; the active state layers are appended on top
     and the whole thing is recomputed on every state change so
     leaving a state cleanly restores the base.
     ---------------------------------------------------------- */
  function enhance(el) {
    var hover = el.getAttribute('data-hover');
    var focus = el.getAttribute('data-focus');
    var active = el.getAttribute('data-active');
    if (el.dataset.baseStyle == null) el.dataset.baseStyle = el.getAttribute('style') || '';
    var st = { hover: false, focus: false, active: false };

    function apply() {
      var css = el.dataset.baseStyle || '';
      if (st.hover && hover) css += ';' + hover;
      if (st.focus && focus) css += ';' + focus;
      if (st.active && active) css += ';' + active;
      el.setAttribute('style', css);
    }
    el._applyInteraction = apply;

    if (hover) {
      on(el, 'mouseenter', function () { st.hover = true; apply(); });
      on(el, 'mouseleave', function () { st.hover = false; st.active = false; apply(); });
    }
    if (focus) {
      on(el, 'focus', function () { st.focus = true; apply(); });
      on(el, 'blur', function () { st.focus = false; apply(); });
    }
    if (active) {
      on(el, 'mousedown', function () { st.active = true; apply(); });
      on(window, 'mouseup', function () { if (st.active) { st.active = false; apply(); } });
    }
  }
  function enhanceAll() { each(document.querySelectorAll('[data-hover],[data-focus],[data-active]'), enhance); }

  /* ----------------------------------------------------------
     2. Scroll reveals
     ---------------------------------------------------------- */
  function setupReveals() {
    var els = document.querySelectorAll('[data-reveal]');
    if (reduced || !('IntersectionObserver' in window)) {
      each(els, function (el) { el.style.opacity = '1'; el.style.transform = 'none'; });
      return;
    }
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (e) {
        if (e.isIntersecting) { e.target.style.opacity = '1'; e.target.style.transform = 'none'; io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    each(els, function (el) { io.observe(el); });
  }

  /* ----------------------------------------------------------
     3. Animated stat counters
     ---------------------------------------------------------- */
  function fmt(el, val) {
    var pad = parseInt(el.getAttribute('data-pad') || '0', 10);
    var pre = el.getAttribute('data-prefix') || '';
    var suf = el.getAttribute('data-suffix') || '';
    var s = String(Math.round(val));
    while (s.length < pad) s = '0' + s;
    return pre + s + suf;
  }
  function finishCounter(el) { el.textContent = fmt(el, parseFloat(el.getAttribute('data-to')) || 0); }
  function animateCounter(el) {
    var to = parseFloat(el.getAttribute('data-to')) || 0;
    var dur = 1100, start = performance.now(), ease = function (t) { return 1 - Math.pow(1 - t, 3); };
    function tick(now) {
      var p = Math.min(1, (now - start) / dur);
      el.textContent = fmt(el, to * ease(p));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  function setupCounters() {
    var els = document.querySelectorAll('[data-counter]');
    if (reduced || !('IntersectionObserver' in window)) { each(els, finishCounter); return; }
    var co = new IntersectionObserver(function (ents) {
      ents.forEach(function (e) { if (e.isIntersecting) { animateCounter(e.target); co.unobserve(e.target); } });
    }, { threshold: 0.6 });
    each(els, function (el) { co.observe(el); });
  }

  /* ----------------------------------------------------------
     4. Cold-open intro
     ---------------------------------------------------------- */
  function setupIntro() {
    var intro = document.getElementById('intro');
    var pitch = document.querySelector('[data-pitch-pulse]');

    function pulse() {
      if (pitch && !reduced) {
        pitch.style.animation = 'pulseBtn .8s ease .15s 1';
        pitch.dataset.baseStyle = pitch.getAttribute('style');
      }
    }
    if (!intro) { return; }
    if (reduced) { if (intro.parentNode) intro.parentNode.removeChild(intro); return; }

    var skip = document.getElementById('skip-intro');
    var dismissed = false;
    function dismiss() {
      if (dismissed) return;
      dismissed = true;
      document.removeEventListener('keydown', onKey);
      intro.style.opacity = '0';
      setTimeout(function () {
        if (intro.parentNode) intro.parentNode.removeChild(intro);
        pulse();
      }, 460);
    }
    var timers = [
      setTimeout(function () { intro.setAttribute('data-ready', 'true'); }, 2700),
      setTimeout(dismiss, 3200)
    ];
    function endIntro() { timers.forEach(clearTimeout); dismiss(); }

    // The splash is a modal overlay: while it's up, Escape dismisses it and Tab is
    // trapped to the Skip button so focus never reaches the nav/hero controls hidden
    // underneath. The listener is document-level so it works before the user has
    // tabbed into the overlay, and is removed the moment the splash dismisses.
    function onKey(e) {
      if (e.key === 'Escape') endIntro();
      else if (e.key === 'Tab' && skip) { e.preventDefault(); skip.focus(); }
    }
    if (skip) on(skip, 'click', endIntro);
    document.addEventListener('keydown', onKey);
  }

  /* ----------------------------------------------------------
     5. Request Board form
     ---------------------------------------------------------- */
  function chipStyle(sel, color, fg) {
    return "font-family:'Space Mono',monospace;font-weight:700;font-size:13px;letter-spacing:.04em;text-transform:uppercase;cursor:pointer;border:2px solid #181410;padding:9px 14px;" +
      'background:' + (sel ? color : '#FBF3E7') + ';color:' + (sel ? fg : '#181410') + ';' +
      'box-shadow:' + (sel ? '3px 3px 0 #181410' : 'none') + ';transition:transform .12s;';
  }

  function setupForm() {
    var form = document.getElementById('brief-form');
    var success = document.getElementById('brief-success');
    if (!form || !success) return;

    var fields = { contact: document.getElementById('f-contact'), build: document.getElementById('f-build') };
    var errs = { contact: document.querySelector('[data-error="contact"]'), build: document.querySelector('[data-error="build"]') };
    var selected = {};

    function setChip(chip, sel) {
      var name = chip.getAttribute('data-domain');
      selected[name] = sel;
      chip.setAttribute('aria-pressed', sel ? 'true' : 'false');
      chip.dataset.baseStyle = chipStyle(sel, chip.getAttribute('data-color'), chip.getAttribute('data-fg'));
      if (chip._applyInteraction) chip._applyInteraction(); else chip.setAttribute('style', chip.dataset.baseStyle);
    }
    var chips = document.querySelectorAll('[data-domain]');
    each(chips, function (chip) {
      on(chip, 'click', function () { setChip(chip, !selected[chip.getAttribute('data-domain')]); });
    });

    function showErr(key, msg) {
      var e = errs[key], i = fields[key];
      if (e) { e.textContent = msg; e.style.display = ''; }
      if (i) i.setAttribute('aria-invalid', 'true');
    }
    function clearErr(key) {
      var e = errs[key], i = fields[key];
      if (e) { e.textContent = ''; e.style.display = 'none'; }
      if (i) i.setAttribute('aria-invalid', 'false');
    }
    Object.keys(fields).forEach(function (k) {
      if (fields[k]) on(fields[k], 'input', function () { clearErr(k); });
    });

    var submitBtn = form.querySelector('button[type="submit"]');
    var formError = form.querySelector('[data-form-error]');
    var submitLabel = submitBtn ? submitBtn.textContent : 'Send it to the lab →';
    var apiBase = (function () {
      var m = document.querySelector('meta[name="api-base"]');
      return ((m && m.getAttribute('content')) || '').replace(/\/+$/, '');
    })();
    var submitting = false;

    function showFormError(msg) { if (formError) { formError.textContent = msg; formError.style.display = ''; } }
    function clearFormError() { if (formError) { formError.textContent = ''; formError.style.display = 'none'; } }
    function setSubmitting(state) {
      submitting = state;
      if (!submitBtn) return;
      submitBtn.disabled = state;
      submitBtn.style.opacity = state ? '0.6' : '';
      submitBtn.style.cursor = state ? 'wait' : 'pointer';
      submitBtn.textContent = state ? 'Sending…' : submitLabel;
    }
    function showSuccess() {
      setSubmitting(false);
      form.style.display = 'none';
      success.style.display = 'block';
      var heading = success.querySelector('[data-success-focus]');
      if (heading) heading.focus();
    }

    on(form, 'submit', function (ev) {
      ev.preventDefault();
      if (submitting) return;
      clearFormError();
      var ok = true;
      if (!fields.build.value.trim()) { showErr('build', 'Tell us what should exist.'); ok = false; }
      if (!fields.contact.value.trim()) { showErr('contact', 'We need a way to reach you.'); ok = false; }
      if (!ok) return;

      var payload = {
        handle: (document.getElementById('f-handle') || {}).value || '',
        contact: fields.contact.value,
        build: fields.build.value,
        why: (document.getElementById('f-why') || {}).value || '',
        domains: Object.keys(selected).filter(function (n) { return selected[n]; }),
        source: 'request-board'
      };

      // No backend wired yet -> confirm from in-session state (graceful fallback).
      if (!apiBase) { showSuccess(); return; }

      setSubmitting(true);
      fetch(apiBase + '/api/briefs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      }).then(function () {
        showSuccess();
      }).catch(function () {
        setSubmitting(false);
        showFormError('Couldn’t reach the lab — please try again, or email kunaldrall29@gmail.com.');
      });
    });

    var resetBtn = document.getElementById('brief-reset');
    if (resetBtn) on(resetBtn, 'click', function () {
      form.reset();
      each(chips, function (chip) { setChip(chip, false); });
      clearErr('contact'); clearErr('build'); clearFormError();
      success.style.display = 'none';
      form.style.display = 'grid';
      if (fields.build) fields.build.focus();
    });
  }

  /* ---------------------------------------------------------- */
  function init() {
    enhanceAll();
    setupReveals();
    setupCounters();
    setupIntro();
    setupForm();
  }
  if (document.readyState === 'loading') on(document, 'DOMContentLoaded', init);
  else init();
})();
