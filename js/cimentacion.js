/* ==========================================
   Página: Cimentacion
   Depende de: data/datos.json
   Uso: Visualización de elementos de cimentacion (vigas, contencion, pilotes, losas)
========================================== */


/* =====================================================
   CONFIGURACIÓN Y VARIABLES GLOBALES
===================================================== */

const CAMPOS = {
  pilotes: {
  id: "ID Pilote",
  seccion: "Sección",
  cantidad: "Cantidad",
  profundidad: "Profundidad (m)",
  longitud: "Longitud (m)",
  plano: "Plano",
  resistencia: "Resistencia (MPa)",
  volumen: "Volumen (m³)",
  peso: "Peso refuerzo (kg)"
    },
    contencion: {
    id: "ID Contención",
    espesor: "Espesor (m)",
    longitud: "Longitud (m)",
    plano: "Plano",
    cantidad: "Cantidad",
    volumen: "Volumen (m³)",
    peso: "Peso refuerzo (kg)"
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
let elementosOriginales = [];
let elementos = [];
let elementoSeleccionado = null;

const tipo = new URLSearchParams(window.location.search).get("tipo");
const TIPOS_CIMENTACION = ["pilotes", "contencion", "vigas", "losas"];


if (tipo === "pilotes" || tipo === "contencion") {
  const bloqueRes = document.querySelector(".grafica-resistencia");
  if (bloqueRes) bloqueRes.style.display = "none";
}

const tituloSeccion = document.getElementById("tituloSeccion");
const lista = document.getElementById("lista");
const detalle = document.getElementById("detalle");
const buscador = document.getElementById("buscador");
const tipoGrafica = document.getElementById("tipoGrafica");

let chart = null;

if (!TIPOS_CIMENTACION.includes(tipo)) {
  detalle.innerHTML = "<p>Tipo no válido para cimentación</p>";
  throw new Error("Tipo no válido en cimentacion.js");
}

/* =====================================================
   INICIALIZACIÓN 
===================================================== */

fetch("data/datos.json")
  .then(res => res.json())
  .then(data => {
    DATA = data;
    document.getElementById("tituloProyecto").textContent =
      data.info.proyecto;

    if (!DATA[tipo]) {
      detalle.innerHTML = "<p>Error: sección no encontrada</p>";
      return;
    }

    if (tipo === "vigas" || tipo === "losas") {
      elementosOriginales = DATA[tipo].filter(e =>
        e.piso &&
        e.piso.toString().toLowerCase().includes("ciment")
      );
    } else {
      elementosOriginales = DATA[tipo];
    }

elementos = [...elementosOriginales];
        
    cargarLista(elementos);

    if (tipo === "losas") {
      if (elementos.length > 0) {
        seleccionarElemento(elementos[0]);
      } else {
        detalle.innerHTML = "<p>No se encontró losa de cimentación</p>";
      }
    }

    if (tipo === "losas") {
      selectElemento.style.display = "none";
    }

    if (tipo === "pilotes" || tipo === "contencion") {
        selectElemento.value = "TODOS";
        mostrarResumenCapitulo();
    }

    if (tipo === "vigas" || tipo === "losas") {
      renderGraficaResistenciaPorPiso(DATA[tipo]);
    }

    const selectPiso = document.getElementById("selectPiso");
    const bloquePiso = document.getElementById("bloquePiso");

  });

/* =======================
   BUSCADOR
======================= */
buscador.addEventListener("input", e => {
  const txt = e.target.value.toLowerCase();

  elementos = elementosOriginales.filter(el =>
  JSON.stringify(el).toLowerCase().includes(txt)
  );

  cargarLista();

});

/* =====================================================
   UI - SELECTORES Y LISTAS
===================================================== */

const selectElemento = document.getElementById("selectElemento");

selectElemento.addEventListener("change", e => {
  const index = e.target.value;

  if (e.target.value === "TODOS") {
    mostrarResumenCapitulo();
    return;
  }

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

  // ===== LIMPIAR SELECT =====
  selectElemento.innerHTML =
    `<option value="">Seleccione un ${tipo.slice(0, -1)}</option>`;

  // ===== AGREGAR TODOS (pilotes y contencion) =====
    if (tipo === "pilotes" || tipo === "contencion") {
    selectElemento.innerHTML +=
        `<option value="TODOS">Todos</option>`;
    }

  // ===== AGREGAR ELEMENTOS =====
  elementos.forEach((el, i) => {
    const nombre = el.id;
    const piso = el.piso ? ` (${el.piso})` : "";

    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = nombre + piso;
    selectElemento.appendChild(opt);
  });
}

/* =====================================================
   UI - DETALLE DEL ELEMENTO
===================================================== */

function seleccionarElemento(el) {
  elementoSeleccionado = el;

  if (tipo === "losas") {

    detalle.innerHTML = `
      <h3>Losa – ${el.piso}</h3>

      <div class="card-detalle">
        <div class="fila">
          <span class="label">Plano</span>
          <span class="valor plano-link" data-plano="${el.plano}">
            ${el.plano}
          </span>
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
    `;

    // Crear contenedor comparativo
    const comparativoDiv = document.createElement("div");
    comparativoDiv.id = "bloqueComparativo";
    detalle.appendChild(comparativoDiv);

    mostrarComparativoEntrepiso(el.piso);

    renderGrafica();
    return; 
  }

  if (tipo === "pilotes") {

  detalle.innerHTML = `
    <h3>${el.id}</h3>

    <div class="card-detalle">

      <div class="fila">
        <span class="label">Sección</span>
        <span class="valor">${el.seccion}</span>
      </div>

      <div class="fila">
        <span class="label">Cantidad</span>
        <span class="valor">${el.cantidad}</span>
      </div>

      <div class="fila">
        <span class="label">Profundidad</span>
        <span class="valor">${el.profundidad} m</span>
      </div>

      <div class="fila">
        <span class="label">Longitud</span>
        <span class="valor">${el.longitud} m</span>
      </div>

      <div class="fila">
        <span class="label">Plano</span>
        <span class="valor plano-link" data-plano="${el.plano}">
          ${el.plano}
        </span>
      </div>

      <div class="fila">
        <span class="label">Resistencia</span>
        <span class="valor">${el.resistencia} MPa</span>
      </div>

      <div class="fila">
        <span class="label">Volumen total del elemento (m³)</span>
        <span class="valor">${el.volumen} m³</span>
      </div>

      <div class="fila">
        <span class="label">Peso total de refuerzo del elemento (kg)</span>
        <span class="valor">${el.peso} kg</span>
      </div>

    </div>
  `;

      // Crear contenedor comparativo
    const comparativoDiv = document.createElement("div");
    comparativoDiv.id = "bloqueComparativo";
    detalle.appendChild(comparativoDiv);

    // Mostrar comparativo)
    mostrarComparativo(el, "TOTAL");

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
        .map(c => {
          if (c === "plano") {
            return `
              <div class="fila">
                <span class="label">${campos[c]}</span>
                <span class="valor plano-link" data-plano="${el.plano}">
                  ${el.plano}
                </span>
              </div>
            `;
          }

          return `
            <div class="fila">
              <span class="label">${campos[c]}</span>
              <span class="valor">${el[c]}</span>
            </div>
          `;
        })
        .join("")}

      <div class="separador"></div>

      ${(tipo === "pilotes" || tipo === "contencion") ? `

      <div class="fila">
        <span class="label" id="labelVolumenPiso">Volumen (m³)</span>
        <span class="valor" id="kpiVolumen">—</span>
      </div>

        <div class="fila">
          <span class="label">Acero total (kg)</span>
          <span class="valor" id="kpiPeso">—</span>
        </div>

        <div class="fila">
          <span class="label">Cuantía promedio (kg/m³)</span>
          <span class="valor" id="kpiCuantia">—</span>
        </div>
      ` : ""}

    </div>
  `;

  // Crear contenedor comparativo vacío
  const comparativoDiv = document.createElement("div");
  comparativoDiv.id = "bloqueComparativo";
  detalle.appendChild(comparativoDiv);

  const pisoSel = el.piso;
  mostrarComparativoEntrepiso(pisoSel);

  renderGrafica();

  const piso = selectPiso?.value || "TOTAL";

  let registros;

  if (tipo === "vigas") {
    // SOLO la viga seleccionada
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

}

  actualizarKPIs(registros, piso);
  mostrarComparativo(el, piso);
}

function mostrarComparativo(el, pisoSeleccionado) {

  if (tipo !== "pilotes" && tipo !== "contencion") return;

  const id = el.id;

  const todosElemento = DATA[tipo].filter(e => e.id === id);

  const regsElemento = pisoSeleccionado === "TOTAL"
    ? todosElemento
    : todosElemento.filter(e => e.piso === pisoSeleccionado);

  const volumenElemento = regsElemento.reduce(
    (s, e) => s + (Number(e.volumen) || 0), 0
  );

  const aceroElemento = Number(
    todosElemento.find(e => e.peso && Number(e.peso) > 0)?.peso || 0
  );

  const regsCapitulo = pisoSeleccionado === "TOTAL"
    ? DATA[tipo]
    : DATA[tipo].filter(e => e.piso === pisoSeleccionado);

  const volumenCapitulo = regsCapitulo.reduce(
    (s, e) => s + (Number(e.volumen) || 0), 0
  );

  const aceroCapitulo = DATA[tipo].reduce(
    (s, e) => s + (Number(e.peso) || 0), 0
  );

  const partVol = volumenCapitulo > 0
    ? (volumenElemento / volumenCapitulo) * 100
    : 0;

  const partAcero = aceroCapitulo > 0
    ? (aceroElemento / aceroCapitulo) * 100
    : 0;

  const bloque = document.getElementById("bloqueComparativo");
  if (!bloque) return;

  bloque.innerHTML = `
    <div class="card-detalle" style="margin-top:20px">
      <h4>Comparación Elemento vs Total ${tipo}</h4>

      <table style="width:100%; border-collapse: collapse; text-align:center;">
        <thead>
          <tr>
            <th style="text-align:left;">Concepto</th>
            <th>Elemento</th>
            <th>Capítulo</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="text-align:left;">Volumen (m³)</td>
            <td>${volumenElemento.toFixed(2)}</td>
            <td>${volumenCapitulo.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="text-align:left;">Acero (kg)</td>
            <td>${aceroElemento.toFixed(1)}</td>
            <td>${aceroCapitulo.toFixed(1)}</td>
          </tr>
        </tbody>
      </table>

      <div class="separador"></div>

      <div class="fila">
        <span class="label">Participación volumen</span>
        <span class="valor">${partVol.toFixed(1)} %</span>
      </div>

      <div class="fila">
        <span class="label">Participación acero</span>
        <span class="valor">${partAcero.toFixed(1)} %</span>
      </div>

    </div>
  `;
}

/* =====================================================
   KPIs Y CÁLCULOS
===================================================== */

function actualizarKPIs(registrosElemento, pisoSeleccionado) {

  let volumenTotal = 0;   // para cuantía
  let volumenPiso = 0;    // para mostrar
  let acero = 0;

  const labelVol = document.getElementById("labelVolumenPiso");

  if (labelVol) {

    if (tipo === "vigas") {

      // En vigas siempre fijo
      labelVol.textContent = "Volumen (m³)";

    } else {

      if (pisoSeleccionado === "TOTAL") {
        labelVol.textContent = "Volumen todos los pisos (m³)";
      } else {

        if (pisoSeleccionado.toLowerCase().includes("piso")) {
          labelVol.textContent = `Volumen ${pisoSeleccionado} (m³)`;
        } else {
          labelVol.textContent = `Volumen Piso ${pisoSeleccionado} (m³)`;
        }

      }

    }
  }

  if (tipo === "vigas") {

    const piso = registrosElemento[0]?.piso;

    // Volumen TOTAL de vigas del piso (para cuantía promedio)
    volumenTotal = DATA.vigas
      .filter(v => v.piso === piso)
      .reduce((s, v) => s + (Number(v.volumen) || 0), 0);

    // Volumen de la(s) viga(s) seleccionada(s) (dato geométrico)
    volumenPiso = registrosElemento.reduce(
      (s, v) => s + (Number(v.volumen) || 0), 0
    );

    // Acero TOTAL del piso (una sola vez)
    acero = obtenerAceroTotalVigasPorPiso(piso);

  } else {

    const id = registrosElemento[0].id;

    const todos = DATA[tipo].filter(e => e.id === id);

    const pisoRegs = pisoSeleccionado === "TOTAL"
      ? todos
      : todos.filter(e => e.piso === pisoSeleccionado);

    // Volumen total del elemento
    volumenTotal = todos.reduce(
      (s, e) => s + (Number(e.volumen) || 0), 0
    );

    // Volumen del piso seleccionado
    volumenPiso = pisoRegs.reduce(
      (s, e) => s + (Number(e.volumen) || 0), 0
    );

    // Acero total del elemento (una sola vez)
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

}



/* =======================
   GRAFICAS
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

  // ===== PILOTES / CONTENCION =====
  if (tipo === "pilotes" || tipo === "contencion") {

    const id = elementoSeleccionado.id;

    // Volumen del piso seleccionado
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

    // Peso → total del elemento
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

    const registros = DATA.losas.filter(l => l.piso === piso);

    if (!registros.length) return;

    valorUnidad = registros.reduce((s, l) => {
      const val = Number(l[campo]);
      return s + (isNaN(val) ? 0 : val);
    }, 0);
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

function renderGraficaResistenciaPorPiso(vigas) {

  // 1. Eliminar la primera fila (encabezados)
  const datos = vigas.filter(v =>
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

/* =====================================================
   HELPERS / UTILIDADES
===================================================== */

function mostrarResumenCapitulo() {

  const resumen = DATA.capitulos.find(c =>
    c.capitulo.toLowerCase().includes(tipo)
    );

  if (!resumen) {
    detalle.innerHTML = "<p>No hay datos de capítulo</p>";
    return;
  }

  const cantidad = DATA[tipo].length;

  detalle.innerHTML = `
    <h3>Resumen general – ${tipo.toUpperCase()}</h3>

    <div class="card-detalle">

      <div class="fila">
        <span class="label">Volumen total del capítulo (${tipo}) (m³)</span>
        <span class="valor">${resumen.volumen.toFixed(2)} m³</span>
      </div>

      <div class="fila">
        <span class="label">Acero total</span>
        <span class="valor">${resumen.peso.toFixed(1)} kg</span>
      </div>

      <div class="separador"></div>

      <div class="fila">
        <span class="label">Consumo de concreto promedio (m³/m²)</span>
        <span class="valor">${resumen.consumo.toFixed(3)}</span>
      </div>

      <div class="fila">
        <span class="label">Cuantía promedio por área(kg/m²)</span>
        <span class="valor">${resumen.cuantiaArea.toFixed(1)}</span>
      </div>

      <div class="fila">
        <span class="label">Cuantía promedio volumétrica (kg/m³)</span>
        <span class="valor">${resumen.cuantiaVol.toFixed(0)}</span>
      </div>

    </div>
  `;

  elementoSeleccionado = null;

  if (chart) chart.destroy();
}

function mostrarComparativoEntrepiso(pisoSeleccionado) {

  if (tipo !== "losas") return;
  if (!pisoSeleccionado) return;

  let nombreVigas;
  let nombreLosas;
  let titulo;

  const pisoLower = pisoSeleccionado.toLowerCase();

  // ===== CASO CIMENTACIÓN =====
  if (pisoLower.includes("ciment")) {

    nombreVigas = "vigas cimentación";
    nombreLosas = "losa cimentación";
    titulo = "Cimentación";

  } else {

    const numeroPiso = pisoSeleccionado.toString().match(/\d+/)?.[0];
    if (!numeroPiso) return;

    nombreVigas = `vigas piso ${numeroPiso}`;
    nombreLosas = `losa piso ${numeroPiso}`;
    titulo = `Piso ${numeroPiso}`;
  }

  const capVigas = DATA.capitulos.find(c =>
    c.capitulo.toLowerCase() === nombreVigas
  );

  const capLosas = DATA.capitulos.find(c =>
    c.capitulo.toLowerCase() === nombreLosas
  );

  if (!capVigas || !capLosas) {
    console.warn("No se encontraron capítulos:", nombreVigas, nombreLosas);
    return;
  }

  const bloque = document.getElementById("bloqueComparativo");
  if (!bloque) return;

  bloque.innerHTML = `
    <div class="card-detalle" style="margin-top:20px">
      <h4>Comparación Entrepiso – ${titulo}</h4>

      <table style="width:100%; border-collapse: collapse; text-align:center;">
        <thead>
          <tr>
            <th style="text-align:left;">Concepto</th>
            <th>Vigas</th>
            <th>Losa</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="text-align:left;">Volumen (m³)</td>
            <td>${capVigas.volumen.toFixed(2)}</td>
            <td>${capLosas.volumen.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="text-align:left;">Peso refuerzo (kg)</td>
            <td>${capVigas.peso.toFixed(1)}</td>
            <td>${capLosas.peso.toFixed(1)}</td>
          </tr>
          <tr>
            <td style="text-align:left;">Cuantía (kg/m³)</td>
            <td>${capVigas.cuantiaVol.toFixed(0)}</td>
            <td>${capLosas.cuantiaVol.toFixed(0)}</td>
          </tr>
          <tr>
            <td style="text-align:left;">Cuantía (kg/m²)</td>
            <td>${capVigas.cuantiaArea.toFixed(1)}</td>
            <td>${capLosas.cuantiaArea.toFixed(1)}</td>
          </tr>
          <tr>
            <td style="text-align:left;">Consumo (m³/m²)</td>
            <td>${capVigas.consumo.toFixed(3)}</td>
            <td>${capLosas.consumo.toFixed(3)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
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
  return DATA[tipo].reduce(
    (s, e) => s + (Number(e[campo]) || 0), 0
  );
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

function filtrarPorPiso() {
  const piso = selectPiso.value;

  elementos = DATA[tipo].filter(e =>
    piso === "TOTAL" || e.piso === piso
  );

  cargarLista();
}


document.addEventListener("click", e => {
  const target = e.target;

  if (target.classList.contains("plano-link")) {
    const plano = target.dataset.plano;

    if (plano) {
      window.location.href = `planos.html?plano=${encodeURIComponent(plano)}`;
    }
  }
});

const rol = localStorage.getItem("rol");
if (!rol) {
  window.location.href = "index.html";
}
