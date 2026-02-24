/* ==========================================
   Página: Menú principal
   Depende de: data/datos.json
   Uso: Visualización del menú principal para ambos roles, admin y cliente
========================================== */


let DATA = {};
let elementos = [];

fetch("data/datos.json")
  .then(res => res.json())
  .then(data => {
    DATA = data;

    document.getElementById("tituloProyecto").textContent =
      data.info.proyecto;

    configurarBarraProgreso(data.info);

    // inicializar vista
    elementos = DATA.columnas || [];
    renderLista(elementos);
  });


document.addEventListener("DOMContentLoaded", () => {

  const rol = localStorage.getItem("rol") || "externo";
  console.log("Rol activo:", rol);

  if (rol === "interno") {
    document
      .querySelectorAll('[data-seccion="estructural"], [data-seccion="info"]')
      .forEach(el => el.style.display = "none");
  }

  document.querySelectorAll(".menu-seccion").forEach(seccion => {
    const visibles = seccion.querySelectorAll(
      ".card:not([style*='display: none'])"
    );

    if (visibles.length === 0) {
      seccion.style.display = "none";
    }
});

});


function abrirSeccion(tipo) {
  tipoActivo = tipo;
  elementos = DATA[tipo];

  document.getElementById("tituloSeccion").innerText = tipo;
  mostrarVista("elementosView");

  renderLista(elementos);
}

function configurarBarraProgreso(info) {

  const rol = localStorage.getItem("rol") || "cliente";

  if (rol !== "interno") return;

  const barra = document.getElementById("barraProgreso");
  if (!barra) return;

  barra.classList.remove("hidden");

  const progresoDiseno = Number(info.progresoDiseno || 0);
  const progresoDibujo = Number(info.progresoDibujo || 0);

  dibujarDonut("donutDiseno", progresoDiseno, "#2563eb");
  dibujarDonut("donutDibujo", progresoDibujo, "#16a34a");
}


function dibujarDonut(canvasId, porcentaje, color) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const r = canvas.width / 2;
  const center = r;
  const inicio = -Math.PI / 2;
  const angulo = (porcentaje / 100) * 2 * Math.PI;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Fondo
  ctx.beginPath();
  ctx.arc(center, center, r - 6, 0, 2 * Math.PI);
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 8;
  ctx.stroke();

  // Progreso
  ctx.beginPath();
  ctx.arc(center, center, r - 6, inicio, inicio + angulo);
  ctx.strokeStyle = color;
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.stroke();

  // Texto %
  ctx.fillStyle = "#111";
  ctx.font = "bold 14px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`${porcentaje}%`, center, center);
}


let tablaActual = "Columnas";

const lista = document.getElementById("listaElementos");
const detalle = document.getElementById("detalleElemento");
const inputBusqueda = document.getElementById("busqueda");

function renderLista(data) {
  lista.innerHTML = "";

  data.forEach(el => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <strong>${el["ID Columna"]}</strong><br/>
      Sección: ${el["Sección"]}
    `;

    card.onclick = () => mostrarDetalle(el);
    lista.appendChild(card);
  });
}


inputBusqueda.addEventListener("input", () => {
  const texto = inputBusqueda.value.toLowerCase();

  const filtrados = elementos.filter(el =>
    Object.values(el)
      .join(" ")
      .toLowerCase()
      .includes(texto)
  );

  renderLista(filtrados);
});

document.addEventListener("DOMContentLoaded", () => {

  const rol = (localStorage.getItem("rol") || "")
    .toLowerCase()
    .trim();

  if (rol === "interno") {

    document.querySelectorAll(".side-menu a").forEach(link => {
      const href = link.getAttribute("href") || "";

      // Ocultar elementos estructurales
      if (
        href.includes("elementos.html?tipo=columnas") ||
        href.includes("elementos.html?tipo=vigas") ||
        href.includes("elementos.html?tipo=muros") ||
        href.includes("elementos.html?tipo=losas") ||
        href.includes("info.html")
      ) {
        link.style.display = "none";
      }
    });
  }

});

document.addEventListener("DOMContentLoaded", () => {

  const btnCerrar = document.getElementById("btnCerrarSesion");

  if (btnCerrar) {
    btnCerrar.addEventListener("click", () => {

      // Limpiar sesión
      localStorage.removeItem("rol");
      localStorage.removeItem("usuario");

      // Volver a login
      window.location.href = "index.html";
    });
  }

});

const rol = localStorage.getItem("rol");
if (!rol) {
  window.location.href = "index.html";
}

