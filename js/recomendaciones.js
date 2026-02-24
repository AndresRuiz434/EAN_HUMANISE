/* ==========================================
   Página: Recomendaciones
   Depende de: data/datos.json y carpeta recomendaciones/
   Uso: Documentos de recomendacion de aditivos, resinas, anclajes y empalmes
========================================== */


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
          <button onclick="verPDF('${rec.pdf}', '${rec.documento}')">
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


async function verPDF(pdf, titulo) {
  const overlay = document.getElementById("visorOverlay");
  const container = document.getElementById("pdfCanvasContainer");

  document.getElementById("visorTitulo").textContent = titulo;
  container.innerHTML = ""; 

  overlay.style.display = "flex";

  const loadingTask = pdfjsLib.getDocument(`recomendaciones/${pdf}`);
  const pdfDoc = await loadingTask.promise;

  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.2 });

    const canvas = document.createElement("canvas");
    canvas.className = "pdf-page";

    const ctx = canvas.getContext("2d");
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    container.appendChild(canvas);

    await page.render({
      canvasContext: ctx,
      viewport
    }).promise;
  }
}

function cerrarVisor() {
  document.getElementById("visorOverlay").style.display = "none";
  document.getElementById("pdfCanvasContainer").innerHTML = "";
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

const rol = localStorage.getItem("rol");
if (!rol) {
  window.location.href = "index.html";
}
