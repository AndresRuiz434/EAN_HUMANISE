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
        <span class="label">Volumen piso seleccionado (m³)</span>
        <span class="valor" id="kpiVolumen">—</span>
      </div>

      <div class="fila">
        <span class="label">Acero total (kg)</span>
        <span class="valor" id="kpiPeso">—</span>
      </div>

      <div class="fila">
        <span class="label">Cuantía promedio(kg/m³)</span>
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

  let registros;

  if (tipo === "vigas") {
    // 👉 SOLO la viga seleccionada
    registros = [el];
  } else {
    registros = DATA[tipo].filter(e =>
      e.id === el.id &&
      (piso === "TOTAL" || e.piso === piso)
    );
  }

actualizarKPIs(registros, piso);

  if (tipo === "vigas") {
  const aceroPiso = obtenerAceroTotalVigasPorPiso(el.piso);

  document.getElementById("kpiPeso").textContent =
    aceroPiso.toFixed(1) + " kg";

  document.querySelector(
    '.fila .label:contains("Acero")'
  );
}


  actualizarKPIs(registros, piso);
}


if (tipo === "vigas") {
  const aceroPiso = obtenerAceroTotalVigasPorPiso(el.piso);

  document.getElementById("kpiPeso").textContent =
    `${aceroPiso.toFixed(1)} kg`;
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

function obtenerAceroTotalVigasPorPiso(piso) {
  const vigasPiso = DATA.vigas.filter(v =>
    v.piso === piso &&
    v.peso !== undefined &&
    v.peso !== null &&
    v.peso !== "" &&
    !isNaN(Number(v.peso))
  );

  // El acero total del piso viene solo en UNA viga
  return vigasPiso.length > 0 ? Number(vigasPiso[0].peso) : 0;
}


/* =======================
   GRAFICA
======================= */
tipoGrafica.addEventListener("change", renderGrafica);

function renderGrafica() {
  if (!elementoSeleccionado) return;

  const campo = tipoGrafica.value;
  const ctx = document.getElementById("grafica");
  if (!ctx) return;

  if (chart) chart.destroy();

  let valorUnidad = 0;
  let labelUnidad = "";

  const pisoSel = selectPiso?.value || "TOTAL";

  // ===== COLUMNAS / MUROS =====
  if (tipo === "columnas" || tipo === "muros") {

    const id = elementoSeleccionado.id;

    // 🔹 Volumen → del piso seleccionado
    if (campo === "volumen") {
      valorUnidad = DATA[tipo]
        .filter(e =>
          e.id === id &&
          (pisoSel === "TOTAL" || e.piso === pisoSel)
        )
        .reduce((s, e) => s + (Number(e.volumen) || 0), 0);

      labelUnidad = pisoSel === "TOTAL"
        ? `${id} (todos los pisos)`
        : `${id} – Piso ${pisoSel}`;
    }

    // 🔹 Peso → total del elemento
    if (campo === "peso") {
      valorUnidad = Number(
        DATA[tipo].find(e => e.id === id && e.peso)?.peso || 0
      );

      labelUnidad = `${id} – Total`;
    }
  }

  // ===== VIGAS =====
  else if (tipo === "vigas") {
    const piso = elementoSeleccionado.piso;

    valorUnidad =
      campo === "peso"
        ? obtenerAceroTotalVigasPorPiso(piso)
        : DATA.vigas
            .filter(v => v.piso === piso)
            .reduce((s, v) => s + (Number(v.volumen) || 0), 0);

    labelUnidad = `Vigas Piso ${piso}`;
  }

  // ===== LOSAS =====
  else if (tipo === "losas") {
    const piso = elementoSeleccionado.piso;

    valorUnidad = DATA.losas
      .filter(l => l.piso === piso)
      .reduce((s, l) => s + (Number(l[campo]) || 0), 0);

    labelUnidad = `Losa Piso ${piso}`;
  }

  const totalProyecto = obtenerTotalProyectoPorTipo(campo);
  const maxValor = Math.max(valorUnidad, totalProyecto);

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: [labelUnidad,  `Total proyecto (${tipo})`],
      datasets: [{
        data: [valorUnidad, totalProyecto],
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
          formatter: v => {
            const u = campo === "peso" ? " kg" : " m³";
            return v.toFixed(1) + u;
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



function obtenerOrdenPiso(piso) {
  if (!piso) return 999;

  const p = piso.toString().toLowerCase();

  // Sótanos y cimentación
  if ( 
    p.includes("sot") ||
    p.includes("b") && /\d/.test(p) ||
    p.includes("cim") ||
    p.includes("ciment") ||
    p.includes("base")
  ) {
    // Extrae número si existe (B2, SOT1, etc.)
    const num = parseInt(p.match(/\d+/)?.[0] || "0", 10);
    return -100 + num * -1;
  }

  // Pisos normales
  if (p.includes("piso")) {
    const num = parseInt(p.match(/\d+/)?.[0] || "0", 10);
    return num;
  }

  // Cubiertas
  if (
    p.includes("cubierta") ||
    p.includes("cub") ||
    p.includes("maq")
  ) {
    return 1000;
  }

  // Otros (por seguridad)
  return 500;
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
  const pisos = [...new Set(datos.map(d => d.piso))]
    .sort((a, b) => obtenerOrdenPiso(a) - obtenerOrdenPiso(b));


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

  let volumenTotal = 0;   // para cuantía
  let volumenPiso = 0;    // para mostrar
  let acero = 0;

  if (tipo === "vigas") {

    const piso = registrosElemento[0]?.piso;

    // 🔹 Volumen TOTAL de vigas del piso (para cuantía promedio)
    volumenTotal = DATA.vigas
      .filter(v => v.piso === piso)
      .reduce((s, v) => s + (Number(v.volumen) || 0), 0);

    // 🔹 Volumen de la(s) viga(s) seleccionada(s) (dato geométrico)
    volumenPiso = registrosElemento.reduce(
      (s, v) => s + (Number(v.volumen) || 0), 0
    );

    // 🔹 Acero TOTAL del piso (una sola vez)
    acero = obtenerAceroTotalVigasPorPiso(piso);

  } else {

    const id = registrosElemento[0].id;

    const todos = DATA[tipo].filter(e => e.id === id);

    const pisoRegs = pisoSeleccionado === "TOTAL"
      ? todos
      : todos.filter(e => e.piso === pisoSeleccionado);

    // 🔹 Volumen total del elemento
    volumenTotal = todos.reduce(
      (s, e) => s + (Number(e.volumen) || 0), 0
    );

    // 🔹 Volumen del piso seleccionado
    volumenPiso = pisoRegs.reduce(
      (s, e) => s + (Number(e.volumen) || 0), 0
    );

    // 🔹 Acero total del elemento (una sola vez)
    acero = Number(
      todos.find(e => e.peso && Number(e.peso) > 0)?.peso || 0
    );
  }

  const cuantia = volumenTotal > 0 ? acero / volumenTotal : 0;

  document.getElementById("kpiVolumen").textContent =
    volumenPiso > 0 ? volumenPiso.toFixed(2) + " m³" : "—";

  document.getElementById("kpiPeso").textContent =
    acero > 0 ? acero.toFixed(1) + " kg" : "—";

  document.getElementById("kpiCuantia").textContent =
    cuantia > 0 ? cuantia.toFixed(0) + " kg/m³" : "—";

  let totalPesoProyecto = 0;
  let totalVolProyecto = 0;

  if (tipo === "vigas") {

    const pisos = [...new Set(DATA.vigas.map(v => v.piso))];

    totalPesoProyecto = pisos.reduce(
      (s, p) => s + obtenerAceroTotalVigasPorPiso(p), 0
    );

    totalVolProyecto = DATA.vigas.reduce(
      (s, v) => s + (Number(v.volumen) || 0), 0
    );

  } else {

    totalPesoProyecto = DATA[tipo].reduce(
      (s, e) => s + (Number(e.peso) || 0), 0
    );

    totalVolProyecto = DATA[tipo].reduce(
      (s, e) => s + (Number(e.volumen) || 0), 0
    );
  }

  const prom = totalVolProyecto > 0
    ? totalPesoProyecto / totalVolProyecto
    : 0;

  const diff = prom > 0 ? ((cuantia - prom) / prom) * 100 : 0;

  let txt = diff.toFixed(0) + "%";
  if (diff > 15) txt = "🔴 " + txt;
  else if (diff > 5) txt = "🟠 " + txt;
  else txt = "🟢 " + txt;

  document.getElementById("kpiComparacion").textContent =
    cuantia > 0 ? txt : "—";
}

function obtenerTotalProyectoPorTipo(campo) {

  if (tipo === "vigas") {
    if (campo === "peso") {
      const pisos = [...new Set(DATA.vigas.map(v => v.piso))];
      return pisos.reduce(
        (s, p) => s + obtenerAceroTotalVigasPorPiso(p), 0
      );
    }

    return DATA.vigas.reduce(
      (s, v) => s + (Number(v[campo]) || 0), 0
    );
  }

  if (tipo === "losas") {
    return DATA.losas.reduce(
      (s, l) => s + (Number(l[campo]) || 0), 0
    );
  }

  // columnas / muros
  return DATA[tipo].reduce(
    (s, e) => s + (Number(e[campo]) || 0), 0
  );
}

