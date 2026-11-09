(() => {
  'use strict';

  const $ = (selector) => document.querySelector(selector);

  const euros = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  const numbers = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 });

  const WORK_WEEKS = 46;   // semanas laborables al año
  const REDUCTION = 0.35;  // reducción estimada del tiempo en tareas repetitivas

  /* ---------- Calculadora de ahorro ---------- */

  const people = $('#emp');
  const hours = $('#hrs');
  const cost = $('#cost');

  function calculate() {
    const p = Number(people.value);
    const h = Number(hours.value);
    const c = Number(cost.value);

    const yearlyCost = p * h * c * WORK_WEEKS;
    const saving = yearlyCost * REDUCTION;
    const hoursSaved = p * h * WORK_WEEKS * REDUCTION;

    $('#emp-out').textContent = numbers.format(p);
    $('#hrs-out').textContent = `${h} h`;
    $('#cost-out').textContent = euros.format(c);
    $('#saving').textContent = euros.format(saving);
    $('#hours-saved').textContent =
      `Son ${numbers.format(hoursSaved)} horas al año, sobre un coste actual de ${euros.format(yearlyCost)}.`;
  }

  [people, hours, cost].forEach((input) => input.addEventListener('input', calculate));
  calculate();

  /* ---------- Formulario de contacto ---------- */

  const form = $('#contact-form');
  const message = $('#contact-msg');

  const fields = [
    { id: 'c-name', check: (v) => v.trim().length >= 2, error: 'Escribe tu nombre.' },
    { id: 'c-email', check: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()), error: 'Escribe un correo válido, por ejemplo nombre@empresa.com.' },
    { id: 'c-size', check: (v) => v !== '', error: 'Elige el tamaño de tu empresa.' },
    { id: 'c-msg', check: (v) => v.trim().length >= 10, error: 'Cuéntanos en una frase qué quieres mejorar.' }
  ];

  function validateField({ id, check, error }) {
    const input = document.getElementById(id);
    const valid = check(input.value);
    document.getElementById(`err-${id}`).textContent = valid ? '' : error;
    input.setAttribute('aria-invalid', String(!valid));
    return valid;
  }

  // Al corregir un campo con error, el aviso desaparece en cuanto el valor es válido.
  fields.forEach((field) => {
    const input = document.getElementById(field.id);
    input.addEventListener('input', () => {
      if (input.getAttribute('aria-invalid') === 'true') validateField(field);
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    message.textContent = '';

    const results = fields.map((f) => ({ f, valid: validateField(f) }));
    const firstInvalid = results.find((r) => !r.valid);
    if (firstInvalid) {
      document.getElementById(firstInvalid.f.id).focus();
      return;
    }

    message.textContent = 'Solicitud recibida. Esto es una demostración: el mensaje no se ha enviado a nadie.';
    form.reset();
  });
})();
