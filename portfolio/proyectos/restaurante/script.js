(() => {
  'use strict';

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  /* ---------- Horario (0 = domingo ... 6 = sábado) ---------- */

  const WEEKDAY = [['13:00', '16:00'], ['20:00', '23:00']];
  const WEEKEND = [['13:00', '16:30'], ['20:00', '24:00']];
  const SCHEDULE = {
    0: [['13:00', '17:00']],
    1: [],
    2: WEEKDAY,
    3: WEEKDAY,
    4: WEEKDAY,
    5: WEEKEND,
    6: WEEKEND
  };
  const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

  const toMinutes = (hhmm) => {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  };
  const label = (hhmm) => (hhmm === '24:00' ? '00:00' : hhmm);

  // Devuelve si el local está abierto ahora y un texto que lo explica.
  function openStatus(now = new Date()) {
    const day = now.getDay();
    const minutes = now.getHours() * 60 + now.getMinutes();

    for (const [from, to] of SCHEDULE[day]) {
      if (minutes >= toMinutes(from) && minutes < toMinutes(to)) {
        return { open: true, text: `Abierto ahora, cerramos a las ${label(to)}.` };
      }
    }

    for (let offset = 0; offset <= 7; offset += 1) {
      const d = (day + offset) % 7;
      for (const [from] of SCHEDULE[d]) {
        if (offset === 0 && toMinutes(from) <= minutes) continue;
        const when = offset === 0 ? 'hoy' : offset === 1 ? 'mañana' : `el ${DAY_NAMES[d]}`;
        return { open: false, text: `Cerrado ahora. Abrimos ${when} a las ${from}.` };
      }
    }
    return { open: false, text: 'Cerrado ahora.' };
  }

  function paintStatus() {
    const { open, text } = openStatus();
    ['#status-hero', '#status-visit'].forEach((id) => {
      const el = $(id);
      el.textContent = text;
      el.dataset.open = String(open);
    });

    const today = new Date().getDay();
    $$('.hours tr').forEach((row) => {
      const days = row.dataset.days.split(',').map(Number);
      row.classList.toggle('is-today', days.includes(today));
    });
  }

  paintStatus();
  setInterval(paintStatus, 60 * 1000);

  /* ---------- Carta con pestañas ---------- */

  const tabs = $$('[role="tab"]');

  function selectTab(tab) {
    tabs.forEach((t) => {
      const active = t === tab;
      t.setAttribute('aria-selected', String(active));
      t.tabIndex = active ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !active;
    });
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', (e) => {
      let next = null;
      if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
      if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
      if (e.key === 'Home') next = tabs[0];
      if (e.key === 'End') next = tabs[tabs.length - 1];
      if (next) {
        e.preventDefault();
        next.focus();
        selectTab(next);
      }
    });
  });

  /* ---------- Reservas ---------- */

  const form = $('#booking');
  const dateInput = $('#date');
  const timeSelect = $('#time');
  const message = $('#booking-msg');

  const pad = (n) => String(n).padStart(2, '0');
  const todayISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };
  const parseISO = (value) => {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  // Franjas cada 30 minutos; la última mesa se sirve una hora antes de cerrar.
  function slotsFor(day) {
    const slots = [];
    for (const [from, to] of SCHEDULE[day]) {
      for (let t = toMinutes(from); t <= toMinutes(to) - 60; t += 30) {
        slots.push(`${pad(Math.floor(t / 60))}:${pad(t % 60)}`);
      }
    }
    return slots;
  }

  function setError(field, text) {
    $(`#err-${field}`).textContent = text;
    $(`#${field}`).setAttribute('aria-invalid', String(Boolean(text)));
  }

  function refreshTimes() {
    timeSelect.innerHTML = '';
    setError('time', '');

    if (!dateInput.value) {
      timeSelect.disabled = true;
      timeSelect.innerHTML = '<option value="">Elige primero la fecha</option>';
      return;
    }

    const date = parseISO(dateInput.value);
    const slots = slotsFor(date.getDay());

    if (dateInput.value < todayISO()) {
      timeSelect.disabled = true;
      timeSelect.innerHTML = '<option value="">Fecha no válida</option>';
      setError('date', 'Elige una fecha de hoy en adelante.');
    } else if (slots.length === 0) {
      timeSelect.disabled = true;
      timeSelect.innerHTML = '<option value="">Cerrado ese día</option>';
      setError('date', 'Los lunes cerramos. Elige otro día.');
    } else {
      setError('date', '');
      timeSelect.disabled = false;
      timeSelect.innerHTML = '<option value="">Elige la hora</option>' +
        slots.map((s) => `<option value="${s}">${s}</option>`).join('');
    }
  }

  dateInput.min = todayISO();
  dateInput.addEventListener('change', refreshTimes);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    message.textContent = '';

    const name = $('#name').value.trim();
    const phone = $('#phone').value.trim();
    const digits = phone.replace(/\D/g, '');
    const guests = Number($('#guests').value);

    const errors = {};
    if (name.length < 2) errors.name = 'Escribe tu nombre.';
    if (digits.length < 9) errors.phone = 'Escribe un teléfono de al menos 9 cifras.';
    if (!dateInput.value) errors.date = 'Elige una fecha.';
    else if (dateInput.value < todayISO()) errors.date = 'Elige una fecha de hoy en adelante.';
    else if (slotsFor(parseISO(dateInput.value).getDay()).length === 0) errors.date = 'Los lunes cerramos. Elige otro día.';
    if (!timeSelect.value && !errors.date) errors.time = 'Elige una hora.';

    ['name', 'phone', 'date', 'time'].forEach((f) => setError(f, errors[f] || ''));

    const firstInvalid = ['name', 'phone', 'date', 'time'].find((f) => errors[f]);
    if (firstInvalid) {
      $(`#${firstInvalid}`).focus();
      return;
    }

    const dateText = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
      .format(parseISO(dateInput.value));
    message.textContent =
      `Mesa para ${guests} ${guests === 1 ? 'persona' : 'personas'} el ${dateText} a las ${timeSelect.value}. ` +
      `Te llamaremos al ${phone} para confirmarla. Esto es una demostración: la reserva no se ha enviado a ningún restaurante.`;

    form.reset();
    refreshTimes();
  });
})();
