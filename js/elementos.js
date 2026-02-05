const CAMPOS = {
  columnas: {
    id: "ID Columna",
    seccion: "Sección",
    plano: "Plano",
  },
  muros: {
    id: "ID Muro",
    espesor: "Espesor (m)",
    longitud: "Longitud (m)",
    plano: "Plano",
  },
  vigas: {
    id: "ID Viga",
    piso: "Piso",
    seccion: "Sección",
    plano: "Plano",
    peso: "Peso refuerzo (kg)",
    volumen: "Volumen (m³)"
  },
    losas: {
    piso: "Piso",
    plano: "Plano",
    resistencia: "Resistencia (MPa)",
    area: "Área (m²)",
    volumen: "Volumen (m³)",
    peso: "Peso refuerzo (kg)"
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

    renderGraficaResistenciaPorPiso(DATA[tipo]);

    const selectPiso = document.getElementById("selectPiso");
    const bloquePiso = document.getElementById("bloquePiso");

    if (tipo === "columnas" || tipo === "muros") {
      bloquePiso.style.display = "block";

      const pisos = [...new Set(DATA[tipo].map(e => String(e.piso || "").trim()).filter(p => p !== "" && p.toLowerCase() !== "piso"))];

      pisos.sort((a, b) => pisoIndex(a) - pisoIndex(b));

      pisos.forEach(p => {
        const opt = document.createElement("option");
        opt.value = p;
        opt.textContent = p;
        selectPiso.appendChild(opt);
  });
}

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

selectElemento.addEventListener("change", e => {
  const index = e.target.value;

  // Sin selección
  if (index === "") {
    detalle.innerHTML = "";
    return;
  }

  // Tomar SIEMPRE desde elementos (filtrado)
  const el = elementos[index];

  if (!el) {
    console.warn("Elemento no encontrado para índice:", index);
    return;
  }

  seleccionarElemento(el);
});



function cargarLista() {

  // ===== LOSAS =====
  if (tipo === "losas") {
    selectElemento.innerHTML = `<option value="">Seleccione un piso</option>`;

    elementos.forEach((el, i) => {
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = el.piso; 
      selectElemento.appendChild(opt);
    });

    return;
  }

  // ===== RESTO =====
  selectElemento.innerHTML =
    `<option value="">Seleccione un ${tipo.slice(0, -1)}</option>`;

  elementos.forEach((el, i) => {
    const nombre = el.id || el["ID Columna"] || el["ID Muro"] || el["ID Viga"];
    const piso = el.piso ? ` (${el.piso})` : "";

    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = nombre + piso;
    selectElemento.appendChild(opt);
  });
}

function seleccionarElemento(el) {
  elementoSeleccionado = el;

  if (tipo === "losas") {

    detalle.innerHTML = `
      <h3>Losa – ${el.piso}</h3>

      <div class="card-detalle">
        <div class="fila">
          <span class="label">Plano</span>
          <span class="valor">${el.plano}</span>
        </div>

        <div class="fila">
          <span class="label">Resistencia</span>
          <span class="valor">${el.resistencia} MPa</span>
        </div>

        <div class="fila">
          <span class="label">Área</span>
          <span class="valor">${el.area} m²</span>
        </div>

        <div class="fila">
          <span class="label">Volumen</span>
          <span class="valor">${el.volumen} m³</span>
        </div>

        <div class="fila">
          <span class="label">Peso refuerzo</span>
          <span class="valor">${el.peso} kg</span>
        </div>

        <div class="separador"></div>

        <div class="fila">
          <span class="label">Cuantía (kg/m³)</span>
          <span class="valor">${(el.peso / el.volumen).toFixed(1)}</span>
        </div>

        <div class="fila">
          <span class="label">Cuantía (kg/m²)</span>
          <span class="valor">${(el.peso / el.area).toFixed(1)}</span>
        </div>

        <div class="fila">
          <span class="label">Consumo (m³/m²)</span>
          <span class="valor">${(el.volumen / el.area).toFixed(3)}</span>
        </div>
      </div>
    `;

    renderGrafica();
    return; 
  }

  const campos = CAMPOS[tipo];

  detalle.innerHTML = `
    <h3>${el.id}</h3>

    <div class="card-detalle" id="cardDetalle">
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

      <div class="separador"></div>

      <div class="fila">
        <span class="label">Volumen total (m³)</span>
        <span class="valor" id="kpiVolumen">—</span>
      </div>

      <div class="fila">
        <span class="label">Acero total (kg)</span>
        <span class="valor" id="kpiPeso">—</span>
      </div>

      <div class="fila">
        <span class="label">Cuantía (kg/m³)</span>
        <span class="valor" id="kpiCuantia">—</span>
      </div>

      <div class="fila">
        <span class="label">Comparación</span>
        <span class="valor" id="kpiComparacion">—</span>
      </div>
    </div>
  `;

  renderGrafica();

  const piso = selectPiso?.value || "TOTAL";

  const registros = DATA[tipo].filter(e =>
    e.id === el.id &&
    (piso === "TOTAL" || e.piso === piso)
  );

  actualizarKPIs(registros, piso);
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

  // Suma vigas SOLO del piso seleccionado
  const sumaPiso = DATA.vigas
    .filter(v => v.piso === pisoSeleccionado)
    .reduce((s, v) => s + (Number(v[campo]) || 0), 0);

  // Total del proyecto (igual que columnas/muros)
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

function colorPorResistencia(r) {
  if (r <= 21) return "#0019FF"; 
  if (r <= 24.5) return "#0049FF";
  if (r <= 28) return "#0062FF";
  if (r <= 31.5) return "#00AAFF";  
  if (r <= 35) return "#00C3FF"; 
  if (r <= 42) return "#00D8FF";
  if (r <= 49) return "#00F3FF"; 
  return "#C0392B";                 
}

function renderGraficaResistenciaPorPiso(vigas) {

  // 1. Eliminar la primera fila (encabezados)
  const datos = vigas.slice(1).filter(v =>
    v.piso && !isNaN(Number(v.resistencia))
  );

  if (datos.length === 0) {
    console.warn("No hay datos válidos para la gráfica");
    return;
  }

  // 2. Agrupar por piso (resistencia promedio)
  const porPiso = {};

  datos.forEach(v => {
    const piso = v.piso;
    const res = Number(v.resistencia);

    if (!porPiso[piso]) {
      porPiso[piso] = { suma: 0, n: 0 };
    }

    porPiso[piso].suma += res;
    porPiso[piso].n++;
  });

  // 3. Ordenar pisos
  const pisos = Object.keys(porPiso).sort((a, b) => pisoIndex(a) - pisoIndex(b));

  // 4. Crear datasets (uno por piso)
  const datasets = pisos.map(piso => {
    const resProm = porPiso[piso].suma / porPiso[piso].n;

    return {
      label: piso,
      data: [1],
      backgroundColor: colorPorResistencia(resProm),
      resistencia: resProm,
      stack: "pisos"
    };
  });

  const ctx = document.getElementById("graficaPisos");
  if (!ctx) return;

  if (window.chartPisos) {
    window.chartPisos.destroy();
  }

  window.chartPisos = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Resistencia"],
      datasets
    },
    options: {
      indexAxis: "x",
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 0.5,

      scales: {
        x: {
          stacked: true,
          display: false
        },
        y: {
          stacked: true,
          ticks: {
            callback: (_, index) => pisos[index]
          },
          title: {
            display: true,
            text: "Pisos"
          }
        }
      },

      plugins: {
        legend: { display: false },
        datalabels: {
          color: "#fff",
          font: { weight: "bold" },
          formatter: (_, ctx) =>
            ctx.dataset.resistencia.toFixed(0) + " MPa"
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}


selectPiso?.addEventListener("change", () => {
  filtrarPorPiso();
  if (elementoSeleccionado) {
    const piso = selectPiso.value;
    const registros = DATA[tipo].filter(e => e.id === elementoSeleccionado.id);
    actualizarKPIs(registros, piso);
  }
});

function pisoIndex(p) {
  const txt = p.toUpperCase().trim();

  // 🔹 Sótanos
  if (txt.startsWith("B") || txt.startsWith("SOT")) {
    const n = parseInt(txt.replace(/\D/g, "")) || 1;
    return -n;
  }

  // Planta baja
  if (txt === "PB" || txt === "PLANTA BAJA") return 0;

  // Cubiertas
  if (txt.includes("CUB")) return 1000;

  // Cuarto de máquinas
  if (txt.includes("MAQ")) return 1001;

  // Pisos normales
  const n = parseInt(txt.replace(/\D/g, ""));
  return isNaN(n) ? 500 : n;
}




function filtrarPorPiso() {
  const piso = selectPiso.value;

  elementos = DATA[tipo].filter(e =>
    piso === "TOTAL" || e.piso === piso
  );

  cargarLista();
}

function actualizarKPIs(registrosElemento, pisoSeleccionado) {

  // TODOS los registros del elemento (para volumen total)
  const todos = DATA[tipo].filter(e => e.id === registrosElemento[0].id);

  // Registros SOLO del piso seleccionado
  const piso = pisoSeleccionado === "TOTAL"
    ? todos
    : todos.filter(e => e.piso === pisoSeleccionado);

  // Volúmenes
  const volumenTotal = todos.reduce((s, e) => s + (Number(e.volumen) || 0), 0);
  const volumenPiso = piso.reduce((s, e) => s + (Number(e.volumen) || 0), 0);

  // Acero → se toma UNA sola vez
  const acero = Number(
    todos.find(e => e.peso && Number(e.peso) > 0)?.peso || 0
  );

  // Cuantía REAL del elemento
  const cuantia = volumenTotal > 0 ? acero / volumenTotal : 0;

  // Mostrar
  document.getElementById("kpiVolumen").textContent =
    (pisoSeleccionado === "TOTAL" ? volumenTotal : volumenPiso).toFixed(2) + " m³";

  document.getElementById("kpiPeso").textContent = acero.toFixed(1) + " kg";
  document.getElementById("kpiCuantia").textContent = cuantia.toFixed(0) + " kg/m³";

  // Cuantía promedio del proyecto (por tipo)
  const totalPeso = DATA[tipo].reduce((s, e) => s + (Number(e.peso) || 0), 0);
  const totalVol = DATA[tipo].reduce((s, e) => s + (Number(e.volumen) || 0), 0);
  const prom = totalVol > 0 ? totalPeso / totalVol : 0;

  const diff = ((cuantia - prom) / prom) * 100;

  let txt = diff.toFixed(0) + "%";
  if (diff > 15) txt = "🔴 " + txt;
  else if (diff > 5) txt = "🟠 " + txt;
  else txt = "🟢 " + txt;

  document.getElementById("kpiComparacion").textContent = txt;
}



