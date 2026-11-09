(() => {
  'use strict';

  const $ = (selector) => document.querySelector(selector);
  const money = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

  const FREE_FROM = 60;   // envío gratis a partir de este importe
  const SHIPPING = 4.9;   // coste de envío por debajo de ese importe
  const STORAGE_KEY = 'tramo-cart';

  // Prendas dibujadas con SVG: reciben el color como parámetro.
  const shade = 'rgba(0,0,0,.14)';
  const SHAPES = {
    tee: (c) => `<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false"><path d="M30 12 10 27l10 14 8-5v52h44V36l8 5 10-14L70 12Q50 26 30 12Z" fill="${c}"/><path d="M30 12Q50 26 70 12" fill="none" stroke="${shade}" stroke-width="3"/></svg>`,
    hoodie: (c) => `<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false"><path d="M32 18 6 40l8 32 14-4 2 22h44l2-22 14 4 8-32L68 18Q50 32 32 18Z" fill="${c}"/><path d="M34 19Q50-2 66 19Q50 34 34 19Z" fill="${shade}"/><rect x="38" y="62" width="24" height="14" rx="3" fill="${shade}"/></svg>`,
    pants: (c) => `<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false"><path d="M28 8h44l6 84H55L50 38l-5 54H22Z" fill="${c}"/><path d="M28 8h44v8H28Z" fill="${shade}"/></svg>`,
    tote: (c) => `<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false"><path d="M36 36Q36 8 50 8Q64 8 64 36" fill="none" stroke="${c}" stroke-width="4"/><path d="M22 34h56l4 58H18Z" fill="${c}"/><path d="M22 34h56l.4 6H21.6Z" fill="${shade}"/></svg>`,
    cap: (c) => `<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false"><path d="M16 62Q16 26 50 26Q84 26 84 62Z" fill="${c}"/><path d="M12 62h80c6 0 6 8-2 8H18c-8 0-10-6-6-8Z" fill="${c}"/><path d="M12 62h80" stroke="${shade}" stroke-width="3"/><circle cx="50" cy="26" r="3" fill="${shade}"/></svg>`
  };

  const CLOTHES = ['S', 'M', 'L', 'XL'];
  const ONE = ['Única'];

  const PRODUCTS = [
    { id: 'camiseta-pesada', name: 'Camiseta pesada', cat: 'Camisetas', shape: 'tee', price: 29, sizes: CLOTHES,
      colors: [['Ultramar', '#2B3BFF'], ['Hueso', '#E4E0D4'], ['Negro', '#1B1B22'], ['Pino', '#2F5D4A']] },
    { id: 'camiseta-bolsillo', name: 'Camiseta con bolsillo', cat: 'Camisetas', shape: 'tee', price: 32, sizes: CLOTHES,
      colors: [['Arcilla', '#C9674B'], ['Gris', '#8D8F98'], ['Blanco', '#F7F7F4']] },
    { id: 'sudadera-capucha', name: 'Sudadera con capucha', cat: 'Sudaderas', shape: 'hoodie', price: 69, sizes: CLOTHES,
      colors: [['Negro', '#1B1B22'], ['Ultramar', '#2B3BFF'], ['Gris', '#8D8F98']] },
    { id: 'sudadera-cuello', name: 'Sudadera cuello redondo', cat: 'Sudaderas', shape: 'hoodie', price: 59, sizes: CLOTHES,
      colors: [['Pino', '#2F5D4A'], ['Hueso', '#E4E0D4'], ['Arcilla', '#C9674B']] },
    { id: 'pantalon-cargo', name: 'Pantalón cargo', cat: 'Pantalones', shape: 'pants', price: 74, sizes: CLOTHES,
      colors: [['Arena', '#B9A98A'], ['Negro', '#1B1B22'], ['Pino', '#2F5D4A']] },
    { id: 'pantalon-recto', name: 'Pantalón recto', cat: 'Pantalones', shape: 'pants', price: 64, sizes: CLOTHES,
      colors: [['Azul tinta', '#26344F'], ['Gris', '#8D8F98']] },
    { id: 'tote-lona', name: 'Tote de lona', cat: 'Accesorios', shape: 'tote', price: 18, sizes: ONE,
      colors: [['Hueso', '#E4E0D4'], ['Ultramar', '#2B3BFF']] },
    { id: 'gorra-cinco', name: 'Gorra de cinco paneles', cat: 'Accesorios', shape: 'cap', price: 24, sizes: ONE,
      colors: [['Negro', '#1B1B22'], ['Arena', '#B9A98A'], ['Ultramar', '#2B3BFF']] }
  ];

  const byId = (id) => PRODUCTS.find((p) => p.id === id);
  const selectedColor = {};   // id del producto -> índice del color elegido
  let filter = 'Todo';
  let cart = loadCart();

  /* ---------- Colección ---------- */

  function cardHTML(p) {
    const i = selectedColor[p.id] ?? 0;
    const [colorName, hex] = p.colors[i];
    const swatches = p.colors.map(([name, h], k) =>
      `<button type="button" class="swatch" data-color="${k}" aria-label="${name}" aria-pressed="${k === i}" style="--c:${h}"></button>`
    ).join('');
    const sizes = p.sizes.map((s) => `<option>${s}</option>`).join('');
    return `
      <article class="card" data-id="${p.id}">
        <div class="card__art">${SHAPES[p.shape](hex)}</div>
        <div class="card__info">
          <h3>${p.name}</h3>
          <p class="price">${money.format(p.price)}</p>
        </div>
        <div class="swatch-row" role="group" aria-label="Color, ahora ${colorName}">${swatches}</div>
        <div class="card__buy">
          <label class="sr" for="size-${p.id}">Talla</label>
          <select id="size-${p.id}">${sizes}</select>
          <button type="button" class="btn btn--small" data-action="add">Añadir</button>
        </div>
      </article>`;
  }

  function renderFilters() {
    const cats = ['Todo', ...new Set(PRODUCTS.map((p) => p.cat))];
    $('#filters').innerHTML = cats.map((c) =>
      `<button type="button" class="chip" data-cat="${c}" aria-pressed="${c === filter}">${c}</button>`
    ).join('');
  }

  function renderGrid() {
    const list = filter === 'Todo' ? PRODUCTS : PRODUCTS.filter((p) => p.cat === filter);
    $('#grid').innerHTML = list.map(cardHTML).join('');
  }

  $('#filters').addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    filter = chip.dataset.cat;
    renderFilters();
    renderGrid();
    $(`.chip[data-cat="${filter}"]`).focus();
  });

  $('#grid').addEventListener('click', (e) => {
    const card = e.target.closest('.card');
    if (!card) return;
    const product = byId(card.dataset.id);

    const swatch = e.target.closest('.swatch');
    if (swatch) {
      const size = card.querySelector('select').value;
      selectedColor[product.id] = Number(swatch.dataset.color);
      card.outerHTML = cardHTML(product);
      const fresh = $(`.card[data-id="${product.id}"]`);
      fresh.querySelector('select').value = size;
      fresh.querySelector(`.swatch[data-color="${swatch.dataset.color}"]`).focus();
      return;
    }

    if (e.target.closest('[data-action="add"]')) {
      addToCart(product, selectedColor[product.id] ?? 0, card.querySelector('select').value);
    }
  });

  /* ---------- Carrito ---------- */

  function loadCart() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  }

  function saveCart() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch {
      /* si el navegador bloquea el almacenamiento, el carrito sigue funcionando en esta visita */
    }
  }

  function addToCart(product, colorIndex, size) {
    const [colorName, hex] = product.colors[colorIndex];
    const key = `${product.id}|${colorIndex}|${size}`;
    const existing = cart.find((l) => l.key === key);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ key, name: product.name, shape: product.shape, colorName, hex, size, price: product.price, qty: 1 });
    }
    saveCart();
    renderCart();
    $('#cart-msg').textContent = '';
    openCart();
  }

  function renderCart() {
    const count = cart.reduce((n, l) => n + l.qty, 0);
    const subtotal = cart.reduce((n, l) => n + l.price * l.qty, 0);
    const shipping = subtotal === 0 || subtotal >= FREE_FROM ? 0 : SHIPPING;

    $('#cart-count').textContent = count;
    $('#cart-empty').hidden = count > 0;

    $('#cart-list').innerHTML = cart.map((l) => `
      <li class="line" data-key="${l.key}">
        <div class="line__art">${SHAPES[l.shape](l.hex)}</div>
        <div>
          <h3>${l.name}</h3>
          <p>${l.colorName}, talla ${l.size}</p>
          <div class="qty">
            <button type="button" data-act="dec" aria-label="Quitar una unidad de ${l.name}">−</button>
            <span>${l.qty}</span>
            <button type="button" data-act="inc" aria-label="Añadir una unidad de ${l.name}">+</button>
            <button type="button" class="remove" data-act="rm" aria-label="Eliminar ${l.name} del carrito">Eliminar</button>
          </div>
        </div>
        <p class="line__price">${money.format(l.price * l.qty)}</p>
      </li>`).join('');

    $('#t-sub').textContent = money.format(subtotal);
    $('#t-ship').textContent = shipping === 0 && subtotal > 0 ? 'Gratis' : money.format(shipping);
    $('#t-total').textContent = money.format(subtotal + shipping);

    const missing = Math.max(0, FREE_FROM - subtotal);
    $('#ship-text').textContent = missing === 0 && subtotal > 0
      ? 'Tienes el envío gratis.'
      : `Te faltan ${money.format(missing)} para el envío gratis.`;
    $('#ship-bar').style.width = `${Math.min(100, (subtotal / FREE_FROM) * 100)}%`;
  }

  $('#cart-list').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const key = btn.closest('.line').dataset.key;
    const line = cart.find((l) => l.key === key);
    if (!line) return;

    if (btn.dataset.act === 'inc') line.qty += 1;
    if (btn.dataset.act === 'dec') line.qty -= 1;
    if (btn.dataset.act === 'rm') line.qty = 0;
    cart = cart.filter((l) => l.qty > 0);

    saveCart();
    renderCart();
  });

  $('#checkout').addEventListener('click', () => {
    $('#cart-msg').textContent = cart.length === 0
      ? 'Añade algún producto antes de finalizar la compra.'
      : 'Esto es una demostración: aquí iría el pago y no se ha cobrado nada.';
  });

  /* ---------- Panel del carrito: abrir, cerrar y mantener el foco dentro ---------- */

  const cartEl = $('#cart');
  const overlay = $('#overlay');
  let lastFocus = null;

  function openCart() {
    lastFocus = document.activeElement;
    cartEl.inert = false;
    cartEl.classList.add('is-open');
    overlay.hidden = false;
    document.body.classList.add('no-scroll');
    $('#close-cart').focus();
  }

  function closeCart() {
    cartEl.classList.remove('is-open');
    cartEl.inert = true;
    overlay.hidden = true;
    document.body.classList.remove('no-scroll');
    if (lastFocus) lastFocus.focus();
  }

  $('#open-cart').addEventListener('click', openCart);
  $('#close-cart').addEventListener('click', closeCart);
  overlay.addEventListener('click', closeCart);

  document.addEventListener('keydown', (e) => {
    if (!cartEl.classList.contains('is-open')) return;
    if (e.key === 'Escape') {
      closeCart();
      return;
    }
    if (e.key !== 'Tab') return;
    const items = [...cartEl.querySelectorAll('button:not([disabled])')];
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  /* ---------- Boletín ---------- */

  $('#news-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('#news-email');
    const msg = $('#news-msg');
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
    input.setAttribute('aria-invalid', String(!valid));
    if (!valid) {
      msg.textContent = 'Escribe un correo válido, por ejemplo nombre@correo.com.';
      input.focus();
      return;
    }
    msg.textContent = 'Listo. Esto es una demostración: el correo no se ha guardado en ningún sitio.';
    e.target.reset();
  });

  /* ---------- Inicio ---------- */

  $('#hero-shape').innerHTML = SHAPES.hoodie('#EDEDEA');
  renderFilters();
  renderGrid();
  renderCart();
})();
