const CAMPOS = {
  columnas: {
    id: "ID Columna",
    seccion: "Sección",
    plano: "Plano",
    peso: "Peso refuerzo (kg)",
    volumen: "Volumen (m³)"
  },
  muros: {
    id: "ID Muro",
    espesor: "Espesor (m)",
    longitud: "Longitud (m)",
    plano: "Plano",
    peso: "Peso refuerzo (kg)",
    volumen: "Volumen (m³)"
  },
  vigas: {
    id: "ID Viga",
    piso: "Piso",
    seccion: "Sección",
    plano: "Plano",
    peso: "Peso refuerzo (kg)",
    volumen: "Volumen (m³)"
  }
};

Chart.register(ChartDataLabels);

let DATA = {};
let elementos = [];
let elementoSeleccionado = null;

const tipo = new URLSearchParams(window.location.search).get("tipo");

const tituloSeccion = document.getElementById("tituloSeccion");
const lista = document.getElementById("lista");
const detalle = document.getElementById("detalle");
const buscador = document.getElementById("buscador");
const tipoGrafica = document.getElementById("tipoGrafica");

let chart = null;

fetch("data/datos.json")
  .then(res => res.json())
  .then(data => {
    document.getElementById("tituloProyecto").textContent =
      data.info.proyecto;

  });

/* =======================
   CARGAR JSON
======================= */
fetch("data/datos.json")
  .then(res => res.json())
  .then(data => {
    DATA = data;

    if (!DATA[tipo]) {
      detalle.innerHTML = "<p>Error: sección no encontrada</p>";
      return;
    }

    elementos = DATA[tipo];
    tituloSeccion.textContent = tipo.toUpperCase();

    cargarLista(elementos);
  });

/* =======================
   BUSCADOR
======================= */
buscador.addEventListener("input", e => {
  const txt = e.target.value.toLowerCase();

  const filtrados = elementos.filter(el =>
    JSON.stringify(el).toLowerCase().includes(txt)
  );
  cargarLista();

});

/* =======================
   SELECCIONAR
======================= */

const selectElemento = document.getElementById("selectElemento");

function cargarLista() {
  selectElemento.innerHTML =
    `<option value="">Seleccione un ${tipo.slice(0, -1)}</option>`;

  elementos.forEach((el, i) => {
    const nombre =
      el.id || el["ID Columna"] || el["ID Muro"] || el["ID Viga"];

    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = nombre;
    selectElemento.appendChild(opt);
  });
}

selectElemento.addEventListener("change", () => {
  const idx = selectElemento.value;
  if (idx === "") return;
  seleccionarElemento(elementos[idx]);
});


function seleccionarElemento(el) {
  elementoSeleccionado = el;

  const campos = CAMPOS[tipo];

  detalle.innerHTML = `
    <h3>${el.id}</h3>
    <div class="card-detalle">
      ${Object.keys(campos)
        .filter(c => {
            if (tipo === "vigas" && (c === "peso" || c === "volumen")) {
                return false;
            }
            return el[c] !== undefined;
        })
        .map(c => `
          <div class="fila">
            <span class="label">${campos[c]}</span>
            <span class="valor">${el[c]}</span>
          </div>
        `)
        .join("")}
    </div>
  `;

  renderGrafica();
}

function agruparVigasPorPiso(vigas) {
  const resumen = {};

  vigas.forEach(v => {
    const piso = v.piso || "Sin piso";

    if (!resumen[piso]) {
      resumen[piso] = {
        volumen: 0,
        peso: 0
      };
    }

    resumen[piso].volumen += Number(v.volumen) || 0;
    resumen[piso].peso += Number(v.peso) || 0;
  });

  return resumen;
}


/* =======================
   GRAFICA
======================= */
tipoGrafica.addEventListener("change", renderGrafica);

function renderGrafica() {
  if (!elementoSeleccionado) return;

  const campo = tipoGrafica.value;

  if (tipo === "vigas") {
  renderGraficaVigasPorPiso(campo);
  return;
    }


  // SUMA TODO EL PROYECTO
  const totalProyecto =
    [...DATA.columnas, ...DATA.muros, ...DATA.vigas]
      .reduce((s, e) => s + (Number(e[campo]) || 0), 0);

  const valorElemento = Number(elementoSeleccionado[campo]) || 0;
  const resto = totalProyecto;
  const nombreElemento = elementoSeleccionado.id;
  const maxValor = Math.max(valorElemento,totalProyecto);

  const ctx = document.getElementById("grafica");

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: [nombreElemento, "Resto del proyecto"],
      datasets: [{
        data: [valorElemento, resto],
        backgroundColor: [
          "#30ad36",   // verde → elemento
          "#9e9e9e"    // gris → proyecto
        ],
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        datalabels: {
            anchor: "end",
            align: "top",
            formatter: value => {
                const unidad = campo === "peso" ? " kg" : " m³";
                return value.toFixed(1) + unidad;
            },
            font: {
                weight: "bold"
            }
        }
    },

      scales: {
        y: { beginAtZero: true, suggestedMax: maxValor * 1.15 }
      }
    }
  });
}

function renderGraficaVigasPorPiso(campo) {
  const pisoSeleccionado = elementoSeleccionado.piso;

  // 🔹 Suma vigas SOLO del piso seleccionado
  const sumaPiso = DATA.vigas
    .filter(v => v.piso === pisoSeleccionado)
    .reduce((s, v) => s + (Number(v[campo]) || 0), 0);

  // 🔹 Total del proyecto (igual que columnas/muros)
  const totalProyecto =
    [...DATA.columnas, ...DATA.muros, ...DATA.vigas]
      .reduce((s, e) => s + (Number(e[campo]) || 0), 0);

  const restoProyecto = totalProyecto;
  const maxValor = Math.max(sumaPiso, totalProyecto);

  const ctx = document.getElementById("grafica");
  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: [
        `Piso ${pisoSeleccionado}`,
        "Resto del proyecto"
      ],
      datasets: [{
        data: [sumaPiso, restoProyecto],
        backgroundColor: ["#30ad36", "#9e9e9e"],
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        datalabels: {
          anchor: "end",
          align: "top",
          formatter: value => {
            const unidad = campo === "peso" ? " kg" : " m³";
            return value.toFixed(1) + unidad;
          },
          font: { weight: "bold" }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          suggestedMax: maxValor * 1.15
        }
      }
    }
  });
}


