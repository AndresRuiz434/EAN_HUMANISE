/* ==========================================
   Página: Planos
   Depende de: data/datos.json y carpeta de planos/
   Uso: Visualización en pdf de todos los planos cargados 
========================================== */
let PLANOS = [];

fetch("data/datos.json")
  .then(res => res.json())
  .then(data => {
    document.getElementById("tituloProyecto").textContent =
      data.info.proyecto;

    PLANOS = data.planos;
    cargarSelector();

    const planoURL = obtenerPlanoDesdeURL();

    if (planoURL) {
      const planoBuscado = planoURL.trim().toLowerCase();

      const index = PLANOS.findIndex(p =>
        String(p.plano).trim().toLowerCase() === planoBuscado
      );

      if (index >= 0) {
        const sel = document.getElementById("selectorPlanos");
        sel.value = index;
        mostrarPlano(PLANOS[index]);
      }
    }
  });


function cargarSelector() {
  const sel = document.getElementById("selectorPlanos");

  PLANOS.forEach((p, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = p.plano;
    sel.appendChild(opt);
  });

  sel.addEventListener("change", e => {
    const index = e.target.value;
    if (index === "") return;
    mostrarPlano(PLANOS[index]);
  });
}

function mostrarPlano(p) {
  document.getElementById("infoPlano").innerHTML = `
    <p><strong>Código:</strong> ${p.plano}</p>
    <div class="divider"></div>
    <p><strong>Número:</strong> ${p.numero}</p>
    <div class="divider"></div>
    <p><strong>Versión:</strong> ${p.version}</p>
    <div class="divider"></div>
    <p><strong>Fecha:</strong> ${formatFecha(p.fecha)}</p>
    <div class="divider"></div>
    <p><strong>Contenido:</strong> ${p.contenido}</p>
  `;

  document.getElementById("visorPDF").src =
    "planos/" + p.pdf;
}

/* ===== FECHA ===== */

function excelDateToJSDate(serial) {
  const utcDays = serial - 25569;
  const utcValue = utcDays * 86400;
  return new Date(utcValue * 1000);
}

function formatFecha(serial) {
  if (!serial) return "-";
  const d = excelDateToJSDate(serial);
  return d.toLocaleDateString("es-CO");
}

/* CONTROLES PDF */

function abrirPDFCompleto() {
  const pdf = document.getElementById("visorPDF").src;
  if (pdf) window.open(pdf, "_blank");
}

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

function obtenerPlanoDesdeURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("plano");
}

const rol = localStorage.getItem("rol");
if (!rol) {
  window.location.href = "index.html";
}
