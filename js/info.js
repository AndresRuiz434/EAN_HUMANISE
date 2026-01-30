document.addEventListener("DOMContentLoaded", () => {
  fetch("data/datos.json")
    .then(res => res.json())
    .then(data => {
      configurarBIM(data.info.bim);
    })
    .catch(err => console.error("Error cargando datos:", err));
});



function configurarBIM(linkBIM) {
  const btn = document.getElementById("btnBIM");
  if (!btn || !linkBIM) return;

  btn.href = linkBIM;
}
