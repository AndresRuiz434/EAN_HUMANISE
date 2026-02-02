document.addEventListener("DOMContentLoaded", () => {
  fetch("data/datos.json")
    .then(res => res.json())
    .then(data => {
      cargarTitulos(data);
      cargarParametros(data.parametros);
      cargarMateriales(data.materiales);
      configurarWhatsapp(data.info);
      configurarCorreo(data.info);
    })
    .catch(err => console.error("Error cargando datos:", err));
});

function cargarTitulos(data) {
  const tituloProyecto = document.getElementById("tituloProyecto");
  if (tituloProyecto) {
    tituloProyecto.textContent = data.info.proyecto || "";
  }
}

function cargarParametros(parametros) {
  const tbody = document.querySelector("#tablaParametros tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  parametros.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.caracteristica}</td>
      <td>${p.valor}</td>
    `;
    tbody.appendChild(tr);
  });
}

function cargarMateriales(materiales) {
  const tbody = document.querySelector("#tablaMateriales tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  materiales.forEach(m => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${m.material}</td>
      <td>${m.resistencia} kg/cm²</td>
    `;
    tbody.appendChild(tr);
  });
}

function configurarWhatsapp(info) {
  const btn = document.getElementById("btnWhatsapp");
  if (!btn) return;

  const mensaje = encodeURIComponent(
    `Hola, quisiera información sobre el proyecto: ${info.proyecto}`
  );

  btn.href = `https://wa.me/57${info.telefono}?text=${mensaje}`;
}

function configurarCorreo(info) {
  const btn = document.getElementById("btnCorreo");
  if (!btn) return;

  const correo = info.correo; 
  const asunto = encodeURIComponent(`Consulta proyecto: ${info.proyecto}`);
  const cuerpo = encodeURIComponent(
    `Buen día,\n\nQuisiera recibir información sobre el proyecto:\n${info.proyecto}\n\nGracias.`
  );

  btn.href = `mailto:${correo}?subject=${asunto}&body=${cuerpo}`;
}

