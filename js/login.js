const USUARIOS = [
  { user: "cliente.aycardi", pass: "1234", rol: "cliente" },
  { user: "admin.aycardi", pass: "1234", rol: "interno" }
];
const tituloSeccion = document.getElementById("tituloSeccion");

fetch("data/datos.json")
  .then(res => res.json())
  .then(data => {
    document.getElementById("tituloProyecto").textContent =
      data.info.proyecto;

  });


function cargarTitulos(data) {
  const tituloProyecto = document.getElementById("tituloProyecto");
  if (tituloProyecto) {
    tituloProyecto.textContent = data.info.proyecto || "";
  }
}

function login() {
  const user = document.getElementById("usuario")?.value;
  const pass = document.getElementById("password")?.value;
  const error = document.getElementById("loginError");

  const valido = USUARIOS.find(
    u => u.user === user && u.pass === pass
  );

  if (valido) {
    localStorage.setItem("autenticado", "true");
    localStorage.setItem("usuario", user);
    localStorage.setItem("rol", valido.rol)
    window.location.href = "app.html";
  } else {
    if (error) error.textContent = "Usuario o contraseña incorrectos";
  }
}



function protegerPagina() {
  if (localStorage.getItem("autenticado") !== "true") {
    window.location.href = "index.html";
  }
}


function logout() {
  localStorage.removeItem("autenticado");
  window.location.href = "index.html";
}