let RECOMEN = [];

fetch("data/datos.json")
  .then(res => res.json())
  .then(data => {
    const grid = document.getElementById("gridRecomendaciones");

    const lista = data.recomendaciones.filter(r =>
      r.documento.toLowerCase() !== "documento"
    );

    lista.forEach((rec, i) => {
      const card = document.createElement("div");
      card.className = "card-recomendacion";

      card.innerHTML = `
        <div class="preview">
          <canvas id="pdfPrev${i}"></canvas>
        </div>
        <div class="info">
          <h4>${rec.documento}</h4>
          <button onclick="window.open('recomendaciones/${rec.pdf}', '_blank')">
            Ver PDF
          </button>
        </div>
      `;

      grid.appendChild(card);

      renderPDFPreview(`recomendaciones/${rec.pdf}`, `pdfPrev${i}`);
    });
  });


function renderPDFPreview(url, canvasId) {
  const loadingTask = pdfjsLib.getDocument(url);
  loadingTask.promise.then(pdf => {
    pdf.getPage(1).then(page => {
      const viewport = page.getViewport({ scale: 1.2 });
      const canvas = document.getElementById(canvasId);
      const ctx = canvas.getContext("2d");

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      page.render({
        canvasContext: ctx,
        viewport
      });
    });
  });
}


function mostrarDoc(r) {
  document.getElementById("infoReco").innerHTML = `
    <p><strong>Documento:</strong> ${r.documento}</p>
  `;

  document.getElementById("visorPDF").src =
    "recomendaciones/" + r.pdf;
}

/* BOTÓN ABRIR PDF */
function abrirPDFCompleto() {
  const pdf = document.getElementById("visorPDF").src;
  if (pdf) window.open(pdf, "_blank");
}
