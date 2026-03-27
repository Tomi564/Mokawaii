// === DATOS DE PRODUCTOS ===
const productos = {
  1: { nombre: 'Cinnamonroll',              precio: 30000, img: 'imgs/Productos/mokachan.jpg' },
  2: { nombre: 'Kuromi',                    precio: 25000, img: 'imgs/Productos/kuromi.jpg' },
  3: { nombre: 'Gato Salchicha',            precio: 28000, img: 'imgs/Productos/gachicha.jpg' },
  4: { nombre: 'Capybara con mochila',      precio: 32000, img: 'imgs/Productos/capymochi.jpg' },
  5: { nombre: 'Capybara con papas fritas', precio: 29000, img: 'imgs/Productos/capypapafrita.jpg' },
  6: { nombre: 'Capybara con tortuga',      precio: 35000, img: 'imgs/Productos/capytortuga.jpg' },
};

// === CARRITO (persiste en localStorage) ===
let carrito = JSON.parse(localStorage.getItem('mokawaii_carrito')) || {};

function guardarCarrito() {
  localStorage.setItem('mokawaii_carrito', JSON.stringify(carrito));
}

function actualizarBadge() {
  const total = Object.values(carrito).reduce((sum, item) => sum + item.cantidad, 0);
  const badge = document.getElementById('cart-badge');
  if (total > 0) {
    badge.textContent = total;
    badge.style.display = 'inline-block';
  } else {
    badge.style.display = 'none';
  }
}

function agregarAlCarrito(id) {
  if (carrito[id]) {
    carrito[id].cantidad++;
  } else {
    carrito[id] = { ...productos[id], cantidad: 1 };
  }
  guardarCarrito();
  actualizarBadge();
  var toast = new bootstrap.Toast(document.getElementById('toast-carrito'));
  toast.show();
}

function eliminarDelCarrito(id) {
  delete carrito[id];
  guardarCarrito();
  actualizarBadge();
  renderCarrito();
}

function cambiarCantidad(id, delta) {
  if (carrito[id]) {
    carrito[id].cantidad += delta;
    if (carrito[id].cantidad <= 0) delete carrito[id];
  }
  guardarCarrito();
  actualizarBadge();
  renderCarrito();
}

function renderCarrito() {
  const lista    = document.getElementById('carrito-items');
  const totalEl  = document.getElementById('carrito-total');
  const btnPagar = document.getElementById('btn-ir-pago');
  const items    = Object.entries(carrito);

  if (items.length === 0) {
    lista.innerHTML = '<p class="text-center text-muted py-5">Tu carrito está vacío 🛒</p>';
    totalEl.textContent = '$0';
    btnPagar.style.display = 'none';
    return;
  }

  let html = '';
  let suma = 0;
  items.forEach(([id, item]) => {
    suma += item.precio * item.cantidad;
    html += `
      <div class="carrito-item d-flex align-items-center gap-3 mb-3 p-2">
        <img src="${item.img}" alt="${item.nombre}" width="60" height="60" style="object-fit:cover;border-radius:8px;flex-shrink:0;">
        <div class="flex-grow-1">
          <p class="mb-0 fw-bold carrito-item-nombre">${item.nombre}</p>
          <p class="mb-0 carrito-item-precio">$${item.precio.toLocaleString('es-AR')}</p>
        </div>
        <div class="d-flex align-items-center gap-1">
          <button class="btn btn-sm btn-qty" onclick="cambiarCantidad(${id}, -1)">−</button>
          <span class="px-1">${item.cantidad}</span>
          <button class="btn btn-sm btn-qty" onclick="cambiarCantidad(${id}, 1)">+</button>
        </div>
        <button class="btn btn-sm btn-eliminar" onclick="eliminarDelCarrito(${id})">✕</button>
      </div>`;
  });

  lista.innerHTML = html;
  totalEl.textContent = '$' + suma.toLocaleString('es-AR');
  btnPagar.style.display = 'block';
}

// === PASARELA DE PAGO ===
function mostrarPasoPago(paso) {
  document.querySelectorAll('.paso-pago').forEach(el => el.style.display = 'none');
  document.getElementById('paso-' + paso).style.display = 'block';
}

function mostrarEntrega() {
  const val = document.getElementById('metodo-entrega').value;
  document.querySelectorAll('#entrega-envio, #entrega-retiro').forEach(el => el.style.display = 'none');
  if (val) document.getElementById('entrega-' + val).style.display = 'block';
}

function mostrarMetodoPago() {
  const val = document.getElementById('metodo-pago').value;
  document.querySelectorAll('#metodo-tarjeta, #metodo-transferencia').forEach(el => el.style.display = 'none');
  if (val) document.getElementById('metodo-' + val).style.display = 'block';
}

function abrirCheckout() {
  const offcanvasEl = document.getElementById('carritoOffcanvas');
  const offcanvasInstance = bootstrap.Offcanvas.getInstance(offcanvasEl);
  if (offcanvasInstance) offcanvasInstance.hide();

  // Armar resumen
  const resumen = document.getElementById('resumen-pedido');
  let html = '';
  let suma = 0;
  Object.values(carrito).forEach(item => {
    suma += item.precio * item.cantidad;
    html += `
      <div class="d-flex justify-content-between mb-1 small">
        <span>${item.nombre} <span class="text-muted">x${item.cantidad}</span></span>
        <span>$${(item.precio * item.cantidad).toLocaleString('es-AR')}</span>
      </div>`;
  });
  html += `<hr class="my-2">
    <div class="d-flex justify-content-between fw-bold">
      <span>Total</span>
      <span>$${suma.toLocaleString('es-AR')}</span>
    </div>`;
  resumen.innerHTML = html;

  // Reset formulario
  document.getElementById('metodo-entrega').value = '';
  document.getElementById('metodo-pago').value = '';
  document.querySelectorAll('.metodo-seccion').forEach(el => el.style.display = 'none');
  ['cc-nombre','cc-numero','cc-vencimiento','cc-cvv'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('pago-error').style.display = 'none';

  mostrarPasoPago(1);
  const modal = new bootstrap.Modal(document.getElementById('checkoutModal'));
  modal.show();
}

function procesarPago() {
  const entrega = document.getElementById('metodo-entrega').value;
  const metodo  = document.getElementById('metodo-pago').value;

  if (!entrega || !metodo) {
    document.getElementById('pago-error').style.display = 'block';
    document.getElementById('pago-error').textContent = 'Por favor seleccioná un método de entrega y forma de pago.';
    return;
  }

  if (entrega === 'envio') {
    const calle  = document.getElementById('envio-calle').value.trim();
    const ciudad = document.getElementById('envio-ciudad').value.trim();
    const cp     = document.getElementById('envio-cp').value.trim();
    if (!calle || !ciudad || !cp) {
      document.getElementById('pago-error').style.display = 'block';
      document.getElementById('pago-error').textContent = 'Por favor completá la dirección de envío.';
      return;
    }
  }

  if (metodo === 'tarjeta') {
    const tipo        = document.getElementById('tipo-tarjeta').value;
    const nombre      = document.getElementById('cc-nombre').value.trim();
    const numero      = document.getElementById('cc-numero').value.replace(/\s/g, '');
    const vencimiento = document.getElementById('cc-vencimiento').value.trim();
    const cvv         = document.getElementById('cc-cvv').value.trim();
    if (!tipo || !nombre || numero.length < 16 || vencimiento.length < 5 || cvv.length < 3) {
      document.getElementById('pago-error').style.display = 'block';
      document.getElementById('pago-error').textContent = 'Por favor completá todos los datos de la tarjeta.';
      return;
    }
  }

  document.getElementById('pago-error').style.display = 'none';
  mostrarPasoPago(2);

  setTimeout(() => {
    const orderNum = 'MK-' + Math.random().toString(36).substring(2, 7).toUpperCase();
    document.getElementById('numero-orden').textContent = orderNum;
    carrito = {};
    guardarCarrito();
    actualizarBadge();
    mostrarPasoPago(3);
  }, 2500);
}

// === FILTRO DE PRODUCTOS ===
function filtrarProductos() {
  const texto = document.getElementById('filtro-nombre').value.toLowerCase().trim();
  const rango = document.getElementById('filtro-precio').value;
  let visibles = 0;

  document.querySelectorAll('.producto-col').forEach(col => {
    const nombre = col.dataset.nombre;
    const precio = parseInt(col.dataset.precio);
    let mostrar = nombre.includes(texto);

    if (mostrar && rango) {
      const [min, max] = rango.split('-').map(Number);
      mostrar = precio >= min && precio <= max;
    }

    col.style.display = mostrar ? '' : 'none';
    if (mostrar) visibles++;
  });

  document.getElementById('sin-resultados').style.display = visibles === 0 ? 'block' : 'none';
}

// === AGREGAR DESDE DETALLE ===
function agregarDesdeDetalle() {
  const qty = parseInt(document.getElementById('detalle-qty').value) || 1;
  for (let i = 0; i < qty; i++) {
    if (carrito[5]) {
      carrito[5].cantidad++;
    } else {
      carrito[5] = { ...productos[5], cantidad: 1 };
    }
  }
  guardarCarrito();
  actualizarBadge();
  var toast = new bootstrap.Toast(document.getElementById('toast-carrito'));
  toast.show();
}

// === FORMULARIO DE CONTACTO ===
function enviarContacto(e) {
  e.preventDefault();
  document.getElementById('contacto-form').style.display = 'none';
  document.getElementById('contacto-exito').style.display = 'block';
  document.getElementById('contacto-exito').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// === NEWSLETTER ===
function suscribirNewsletter() {
  const email = document.getElementById('newsletter-email').value.trim();
  if (!email || !email.includes('@')) return;
  document.getElementById('newsletter-email').value = '';
  document.querySelector('.newsletter-form').style.display = 'none';
  document.getElementById('newsletter-ok').style.display = 'block';
}

// === FORMATO DE CAMPOS DE TARJETA ===
document.addEventListener('DOMContentLoaded', function () {
  actualizarBadge();

  document.getElementById('cc-numero').addEventListener('input', function () {
    let v = this.value.replace(/\D/g, '').substring(0, 16);
    this.value = v.replace(/(.{4})/g, '$1 ').trim();
  });

  document.getElementById('cc-vencimiento').addEventListener('input', function () {
    let v = this.value.replace(/\D/g, '').substring(0, 4);
    if (v.length >= 3) v = v.substring(0, 2) + '/' + v.substring(2);
    this.value = v;
  });

  document.getElementById('cc-cvv').addEventListener('input', function () {
    this.value = this.value.replace(/\D/g, '').substring(0, 4);
  });
});
