function mostrarVista(id) {
  document.querySelectorAll(".view").forEach(v => v.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

function abrirSeccion(tipo) {
  tipoActivo = tipo;
  elementos = DATA[tipo];

  document.getElementById("tituloSeccion").innerText = tipo;
  mostrarVista("elementosView");

  renderLista(elementos);
}

function volverMenu() {
  mostrarVista("menuView");
}


let tablaActual = "Columnas";
let elementos = DATA[tablaActual];

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

fetch("data/datos.json")
  .then(res => res.json())
  .then(data => {
    document.getElementById("tituloProyecto").textContent =
      data.info.proyecto;

  });

function mostrarDetalle(el) {
  detalle.innerHTML = `
    <h3>Elemento ${el["ID Columna"]}</h3>
    <p><b>Sección:</b> ${el["Sección"]}</p>
    <p><b>Cantidad:</b> ${el["Cantidad"]}</p>
    <p><b>Resistencia:</b> ${el["Resistencia (MPa)"]} MPa</p>
    <p><b>Plano:</b> ${el["Plano"]}</p>
  `;
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

renderLista(elementos);

function cambiarTipo(nuevoTipo) {
  tipoActivo = nuevoTipo;
  elementos = DATA[tipoActivo];

  document.getElementById("tituloSeccion").innerText = tipoActivo;

  renderLista(elementos);
  limpiarDetalle();
}

