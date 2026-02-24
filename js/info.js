

/* ==========================================
   Página: Información adicional
   Depende de: data/datos.json
   Uso: Vista BIM + PDF cantidades
========================================== */

let PDF_INFO = null;

document.addEventListener("DOMContentLoaded", () => {

  fetch("data/datos.json")
    .then(res => res.json())
    .then(data => {
      configurarBIM(data.info.bim);
      PDF_INFO = data.infoAdicional?.pdf;
      if (PDF_INFO) {
        renderPDFPreview(`info/${PDF_INFO}`, "pdfPreviewInfo");
      }
      const btn = document.getElementById("btnVerInforme");
      if (btn && PDF_INFO) {
        btn.addEventListener("click", () => {
          verPDFInfo(PDF_INFO);
        });
      }
    })
    .catch(err => console.error("Error cargando datos:", err));
});


function configurarBIM(linkBIM) {
  const btn = document.getElementById("btnBIM");
  if (!btn || !linkBIM) return;

  btn.href = linkBIM;
}

function renderPDFPreview(url, canvasId) {
  const loadingTask = pdfjsLib.getDocument(url);
  loadingTask.promise.then(pdf => {
    pdf.getPage(1).then(page => {

      const viewport = page.getViewport({ scale: 1.2 });
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;

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

async function verPDFInfo(pdf) {

  const overlay = document.getElementById("visorOverlayInfo");
  const container = document.getElementById("pdfCanvasContainerInfo");

  container.innerHTML = "";
  overlay.style.display = "flex";

  const loadingTask = pdfjsLib.getDocument(`info/${pdf}`);
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


function cerrarVisorInfo() {
  document.getElementById("visorOverlayInfo").style.display = "none";
  document.getElementById("pdfCanvasContainerInfo").innerHTML = "";
}


// Protección sesión
const rol = localStorage.getItem("rol");
if (!rol) {
  window.location.href = "index.html";
}