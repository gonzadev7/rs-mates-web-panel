// --- EFECTO DE ZOOM EN IMÁGENES DE PRODUCTO ---

/**
 * Agrega un efecto de zoom a las imágenes de los productos.
 * Al hacer clic en una imagen, se muestra una versión ampliada en un overlay.
 */
function inicializarZoomEnImagenes() {
  // Selecciona todas las imágenes con la clase 'product-image'
  document.querySelectorAll(".product-image").forEach((img) => {
    // Agrega un listener de evento 'click' a cada imagen
    img.addEventListener("click", function (e) {
      e.stopPropagation(); // Evita que el evento se propague a elementos padres
      // Si ya existe un overlay de zoom, no hace nada
      if (document.querySelector(".zoom-overlay")) return;

      // Crea el overlay (fondo oscuro)
      const overlay = document.createElement("div");
      overlay.className = "zoom-overlay";

      // Crea la imagen ampliada
      const zoomImg = document.createElement("img");
      zoomImg.src = img.src;
      zoomImg.alt = img.alt;
      zoomImg.className = "zoomed-img";

      // Crea el botón para cerrar el zoom
      const closeBtn = document.createElement("button");
      closeBtn.className = "zoom-close-btn";
      closeBtn.innerHTML = "&times;"; // Símbolo 'x'
      closeBtn.title = "Cerrar";
      closeBtn.addEventListener("click", function (ev) {
        ev.stopPropagation();
        overlay.remove(); // Elimina el overlay al hacer clic en el botón
      });

      // Crea un contenedor para la imagen y el botón de cerrar
      const imgContainer = document.createElement("div");
      imgContainer.className = "zoomed-img-container";
      imgContainer.appendChild(zoomImg);
      imgContainer.appendChild(closeBtn);

      // Agrega el contenedor al overlay y el overlay al body
      overlay.appendChild(imgContainer);
      document.body.appendChild(overlay);

      // Permite cerrar el zoom haciendo clic fuera de la imagen (en el overlay)
      overlay.addEventListener("click", function (ev) {
        if (ev.target === overlay) overlay.remove();
      });
    });
  });
}
// Llama a la función para activar el zoom en las imágenes existentes al cargar la página
inicializarZoomEnImagenes();

// --- CARGA DE PRODUCTOS DESDE JSON Y RENDERIZADO DINÁMICO ---

/**
 * Carga los datos de los productos desde un archivo JSON de forma asíncrona.
 */
async function cargarProductos() {
  try {
    // Realiza la petición para obtener el archivo JSON
    const res = await fetch("assets/products.json", { cache: "no-store" });
    if (!res.ok) throw new Error("No se pudo cargar products.json");
    const productos = await res.json();
    // Si la carga es exitosa, renderiza los productos en la página
    renderizarProductos(productos);
  } catch (err) {
    console.error(err);
    // Muestra un mensaje de error si falla la carga
    const loading = document.getElementById("productos-loading");
    if (loading) loading.textContent = "No se pudieron cargar los productos.";
  }
}

/**
 * Crea el elemento HTML (card) para un solo producto.
 * @param {object} producto - El objeto del producto con sus datos.
 * @returns {HTMLElement} El elemento div de la card del producto.
 */
function crearCard(producto) {
  const card = document.createElement("div");
  card.className = "card";
  // Usa la imagen del producto o una imagen por defecto si no se especifica
  const imgSrc =
    producto.imagen && String(producto.imagen).trim() !== ""
      ? producto.imagen
      : "assets/logo2.png";
  const precioNum = Number(producto.precio) || 0;

  // Define la estructura HTML de la card
  card.innerHTML = `
    <img src="${imgSrc}" alt="${
    producto.alt || producto.nombre || "Producto"
  }" class="product-image" loading="lazy" />
    <div class="card-content">
      <h3>${producto.nombre || "Producto sin nombre"}</h3>
      ${
        Array.isArray(producto.caracteristicas) &&
        producto.caracteristicas.length
          ? `<ul>${producto.caracteristicas
              .map((c) => `<li>· ${c}</li>`)
              .join("")}</ul>`
          : ""
      }
      <div class="precio">$${formatearPrecio(precioNum)}${
    producto.notaPrecio ? ` (${producto.notaPrecio})` : ""
  }</div>
    </div>
    <button class="btn-agregar" data-nombre="${
      producto.nombre || "Producto"
    }" data-precio="${precioNum}">Agregar</button>
  `;
  return card;
}

/**
 * Renderiza la lista de productos en el contenedor principal.
 * @param {Array<object>} productos - El array de productos a mostrar.
 */
function renderizarProductos(productos) {
  const contenedor = document.getElementById("productos");
  const loading = document.getElementById("productos-loading");
  if (loading) loading.remove(); // Oculta el mensaje de "cargando"
  contenedor.innerHTML = ""; // Limpia el contenedor antes de agregar nuevos productos
  productos.forEach((p) => contenedor.appendChild(crearCard(p)));

  // Agrega eventos a los botones "Agregar" de cada card
  contenedor.querySelectorAll(".btn-agregar").forEach((btn) => {
    btn.addEventListener("click", () => {
      const nombre = btn.getAttribute("data-nombre");
      const precio = parseFloat(btn.getAttribute("data-precio"));
      agregarAlCarrito(nombre, precio);
    });
  });
  // Re-inicializa el efecto de zoom para las nuevas imágenes cargadas
  inicializarZoomEnImagenes();
}

// --- LÓGICA DEL CARRITO DE COMPRAS ---

// Array que almacena los productos del carrito
let carrito = [];

// Elementos del DOM relacionados con el carrito
const carritoIcono = document.getElementById("carrito-icono");
const carritoContenido = document.getElementById("carrito-contenido");
const contadorCarrito = document.getElementById("contador-carrito");
const totalPrecio = document.getElementById("total-precio");
const cerrarCarrito = document.getElementById("cerrar-carrito");
const vaciarCarrito = document.getElementById("vaciar-carrito");
const enviarWsp = document.getElementById("enviar-wsp");

/**
 * Agrega un producto al array del carrito y actualiza la UI.
 * @param {string} producto - El nombre del producto.
 * @param {number} precio - El precio del producto.
 */
function agregarAlCarrito(producto, precio) {
  carrito.push({ nombre: producto, precio: precio });
  actualizarCarrito();
  animarContador();
}

/**
 * Formatea un número como moneda local (peso argentino).
 * @param {number} precio - El precio a formatear.
 * @returns {string} El precio formateado con separadores de miles.
 */
function formatearPrecio(precio) {
  return precio.toLocaleString("es-AR");
}

/**
 * Actualiza toda la interfaz del carrito: contador, lista de productos y total.
 */
function actualizarCarrito() {
  const lista = document.getElementById("lista-carrito");

  // Actualiza el contador de ítems en el ícono del carrito
  const totalItems = carrito.length;
  contadorCarrito.textContent = totalItems;

  // Calcula el precio total
  const total = carrito.reduce((sum, item) => sum + item.precio, 0);
  totalPrecio.textContent = formatearPrecio(total);

  // Muestra u oculta el contador si hay ítems en el carrito
  if (totalItems > 0) {
    contadorCarrito.classList.add("visible");
  } else {
    contadorCarrito.classList.remove("visible");
  }

  // Actualiza la lista de productos en el carrito
  lista.innerHTML = "";

  // Agrupa los productos para mostrar la cantidad de cada uno
  const productosUnicos = {};
  carrito.forEach((item) => {
    if (!productosUnicos[item.nombre]) {
      productosUnicos[item.nombre] = { cantidad: 0, precio: item.precio };
    }
    productosUnicos[item.nombre].cantidad++;
  });

  // Crea y agrega los elementos de la lista para cada producto único
  Object.entries(productosUnicos).forEach(([producto, data], index) => {
    const li = document.createElement("li");
    const subtotal = data.precio * data.cantidad;
    li.innerHTML = `
      <span class="item-nombre">${producto}</span>
      <span class="item-precio">$${formatearPrecio(subtotal)}</span>
      <span style="display: flex; align-items: center; gap: 4px;">
        <span class="item-cantidad">${data.cantidad}</span>
        <button class="quitar-producto" data-producto="${producto}" title="Quitar uno">✕</button>
      </span>
    `;
    li.style.animationDelay = `${index * 0.1}s`; // Animación de entrada escalonada
    lista.appendChild(li);
  });

  // Agrega eventos a los botones para quitar un producto
  document.querySelectorAll(".quitar-producto").forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.stopPropagation(); // Evita que se cierre el carrito al hacer clic
      quitarUnProducto(this.dataset.producto);
    });
  });

  /**
   * Quita una unidad de un producto específico del carrito.
   * @param {string} nombreProducto - El nombre del producto a quitar.
   */
  function quitarUnProducto(nombreProducto) {
    const index = carrito.findIndex((item) => item.nombre === nombreProducto);
    if (index !== -1) {
      carrito.splice(index, 1); // Elimina la primera ocurrencia del producto
      actualizarCarrito(); // Vuelve a renderizar el carrito
    }
  }

  // Habilita o deshabilita el botón de enviar a WhatsApp si el carrito está vacío
  enviarWsp.disabled = totalItems === 0;
}

/**
 * Agrega una animación de escala al contador del carrito para feedback visual.
 */
function animarContador() {
  contadorCarrito.style.transform = "scale(1.3)";
  setTimeout(() => {
    contadorCarrito.style.transform = "scale(1)";
  }, 200);
}

/**
 * Muestra el panel del carrito.
 */
function mostrarCarrito() {
  carritoContenido.classList.remove("carrito-oculto");
  carritoContenido.classList.add("carrito-visible");
}

/**
 * Oculta el panel del carrito.
 */
function ocultarCarrito() {
  carritoContenido.classList.remove("carrito-visible");
  carritoContenido.classList.add("carrito-oculto");
}

/**
 * Vacía completamente el carrito.
 */
function vaciarCarritoCompleto() {
  carrito = [];
  actualizarCarrito();
  // Pequeña animación para feedback visual de vaciado
  const lista = document.getElementById("lista-carrito");
  lista.style.opacity = "0.5";
  setTimeout(() => {
    lista.style.opacity = "1";
  }, 300);
}

// --- EVENT LISTENERS GENERALES ---

// Muestra el carrito al hacer clic en el ícono
carritoIcono.addEventListener("click", mostrarCarrito);
// Oculta el carrito al hacer clic en el botón de cerrar
cerrarCarrito.addEventListener("click", ocultarCarrito);
// Vacía el carrito al hacer clic en el botón correspondiente
vaciarCarrito.addEventListener("click", vaciarCarritoCompleto);

// Cierra el carrito si se hace clic fuera de su contenedor
document.addEventListener("click", (e) => {
  if (!document.getElementById("carrito-flotante").contains(e.target)) {
    ocultarCarrito();
  }
});

// Envía el pedido a tsApp al hacer clic en el botón
enviarWsp.addEventListener("click", () => {
  if (carrito.length === 0) return;

  // Animación para el botón
  enviarWsp.style.transform = "scale(0.95)";
  setTimeout(() => {
    enviarWsp.style.transform = "";
  }, 150);

  // Agrupa los productos para el mensaje de WhatsApp
  const productosUnicos = {};
  carrito.forEach((item) => {
    if (!productosUnicos[item.nombre]) {
      productosUnicos[item.nombre] = { cantidad: 0, precio: item.precio };
    }
    productosUnicos[item.nombre].cantidad++;
  });

  const total = carrito.reduce((sum, item) => sum + item.precio, 0);

  // Construye el mensaje con los productos, cantidades y subtotales
  const mensajeItems = Object.entries(productosUnicos)
    .map(([producto, data]) => {
      const subtotal = data.precio * data.cantidad;
      return `- ${producto} (x${data.cantidad}) - $${formatearPrecio(
        subtotal
      )}`;
    })
    .join("\n");

  // Formatea el mensaje final y lo codifica para la URL
  const mensaje = encodeURIComponent(
    `Hola! Quiero pedir:\n${mensajeItems}\n\n*Total: $${formatearPrecio(
      total
    )}*`
  );
  // Abre una nueva pestaña con el enlace de WhatsApp
  const url = `https://wa.me/541134206794?text=${mensaje}`;
  window.open(url, "_blank");
});

// --- INICIALIZACIÓN ---

// Actualiza el carrito al cargar la página (para asegurar que el total y contador estén en 0)
actualizarCarrito();

// Carga los productos cuando el DOM esté completamente cargado
if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", cargarProductos);
} else {
  // Si el DOM ya está cargado, los carga inmediatamente
  cargarProductos();
}
