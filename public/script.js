let mapa = null;
let marcador = null;
document.addEventListener("DOMContentLoaded", async () => {
  const panicoContainer = document.querySelector(".notificaciones .panico");
  const navUserDiv = document.querySelector("div > span");
  const generalContainer = document.querySelector(".notificaciones .general");
  const alertaSection = document.querySelector(".alerta"); // Sección de alerta donde se mostrará la información
  const alerta = document.querySelector("section.alerta");
  const notificaciones = document.querySelector("section.notificaciones");
  const closeButton = document.getElementById("close");
  const respuestaButton = document.getElementById("respuestaButton");
  const sirenaButton = document.getElementById("sirena");
  const resueltoButton = document.getElementById("resuelto");
  const contestacionContainer = document.querySelector(
    "section.alerta .contestacion_container"
  );
  const mapaDiv = document.getElementById("mapa");
  let AdminId = null;
  // Mapeo de descripción a clases para las notificaciones generales
  const tipoAlertaClase = {
    "Personal no autorizado": "personal",
    Robo: "robo",
    Incendio: "incendio",
    "Emergencia Médica": "medica",
    Novedad: "novedad",
    "Falla Mecánica": "falla",
    "Vehiculo no autorizado": "vehiculo",
  };

  try {
    // Obtener la URL del API desde el servidor de configuración
    const configResponse = await fetch("/config");
    if (!configResponse.ok) {
      throw new Error("Error al obtener la configuración del servidor");
    }

    const config = await configResponse.json();
    const API_URL = config.apiUrl;

    // Consumir la API para obtener el usuario aleatorio
    const response1 = await fetch(`${API_URL}/random-admin`);
    if (!response1.ok) throw new Error("Error al obtener el usuario aleatorio");
    const data1 = await response1.json();
    if (data1.username && data1.mail && data1.id) {
      navUserDiv.textContent = `Usuario: ${data1.username} ${data1.mail}`;
      AdminId = data1.id;
    } else {
      navUserDiv.textContent = "Usuario: No disponible";
      AdminId = null;
    }
    // Consumir el API para obtener las alarmas activas
    const response = await fetch(`${API_URL}/active-alarms`);
    if (!response.ok) {
      throw new Error("Error al consumir el API de alarmas activas");
    }

    const data = await response.json();

    // Filtrar y generar las alertas de "Boton Pánico"
    const panicoAlertas = data.filter(
      (alerta) => alerta.descripcion_tipo_alerta === "Boton Pánico"
    );
    panicoAlertas.forEach((alerta) => {
      const notificacionHTML = `
        <div class="notificacion panico" data-id="${alerta.id_alarma}">
          <div class="usuarioTipo">
            <p>Usuario: <span>${alerta.nombre_usuario} ${
        alerta.apellido_usuario
      }</span></p>
            <p>Rol: <span>${alerta.rol_usuario}</span></p>
          </div>
          <div class="usuarioTipo">
            <p>Ubicación: <span>${
              alerta.descripcion_georeferencia || "Sin ubicación"
            }</span></p>
            <p>Tipo: <span>${alerta.descripcion_tipo_alerta}</span></p>
          </div>
          <p>Fecha: <span>${alerta.fecha}</span></p>
        </div>
      `;
      panicoContainer.insertAdjacentHTML("beforeend", notificacionHTML);
    });

    // Generar HTML para las notificaciones generales
    const generalAlertas = data.filter(
      (alerta) => alerta.descripcion_tipo_alerta !== "Boton Pánico"
    );
    generalAlertas.forEach((alerta) => {
      const claseTipo =
        tipoAlertaClase[alerta.descripcion_tipo_alerta] || "default";
      const notificacionHTML = `
        <div class="notificacion ${claseTipo}" data-id="${alerta.id_alarma}">
          <div class="usuarioTipo">
            <p>Usuario: <span>${alerta.nombre_usuario} ${
        alerta.apellido_usuario
      }</span></p>
            <p>Rol: <span>${alerta.rol_usuario}</span></p>
          </div>
          <div class="usuarioTipo">
            <p>Ubicación: <span>${
              alerta.descripcion_georeferencia || "Sin ubicación"
            }</span></p>
            <p>Tipo: <span>${alerta.descripcion_tipo_alerta}</span></p>
          </div>
          <p>Fecha: <span>${alerta.fecha}</span></p>
        </div>
      `;
      generalContainer.insertAdjacentHTML("beforeend", notificacionHTML);
    });

    // Delegar eventos de clic para consumir el API y mostrar información en la sección alerta
    document
      .querySelector(".notificaciones")
      .addEventListener("click", async (event) => {
        notificaciones.style.display = "none";
        alerta.style.display = "flex";
        let state_sirena = 0;
        const notificacionDiv = event.target.closest(".notificacion");
        if (notificacionDiv) {
          const idAlarma = notificacionDiv.dataset.id;

          try {
            // Consumir el API para obtener la alarma por id
            const alarmaResponse = await fetch(
              `${API_URL}/alarmas/${idAlarma}`
            );
            if (!alarmaResponse.ok) {
              throw new Error("Error al obtener los detalles de la alarma");
            }

            const alarmaData = await alarmaResponse.json();

            // Actualizar la sección de alerta con los datos de la alarma
            alertaSection.querySelector(".tipoAlerta span").textContent =
              alarmaData.descripcion_tipo_alerta;
            alertaSection.querySelector(
              ".usuarioFecha p:nth-of-type(1) span"
            ).textContent = `${alarmaData.nombre_usuario} ${alarmaData.apellido_usuario}`;
            alertaSection.querySelector(
              ".usuarioFecha p:nth-of-type(2) span"
            ).textContent = alarmaData.fecha || "Sin fecha";
            alertaSection.querySelector(
              ".ubicacionTelefono p:nth-of-type(1) span"
            ).textContent =
              alarmaData.descripcion_georeferencia || "Sin ubicación";
            alertaSection.querySelector(
              ".ubicacionTelefono p:nth-of-type(2) span"
            ).textContent = alarmaData.telefono_usuario || "Sin telefono";
            alertaSection.querySelector(
              ".rolDependencia p:nth-of-type(1) span"
            ).textContent = alarmaData.rol_usuario;
            alertaSection.querySelector(
              ".rolDependencia p:nth-of-type(2) span"
            ).textContent = alarmaData.dependencia_usuario;
            alertaSection.querySelector(".mensaje").textContent =
              alarmaData.mensaje || "No hay mensaje";
            alertaSection.querySelector(".foto_container img").src =
              alarmaData.foto_url ||
              "https://img.freepik.com/vector-premium/no-hay-foto-disponible-icono-vector-simbolo-imagen-predeterminado-imagen-proximamente-sitio-web-o-aplicacion-movil_87543-10615.jpg";
            // Condición para mostrar u ocultar el div sirena_container
            const sirenaContainer = document.querySelector(".sirena_container");
            if (alarmaData.descripcion_tipo_alerta === "Boton Pánico") {
              sirenaContainer.style.display = "none"; // Ocultar el contenedor
            } else {
              sirenaContainer.style.display = "block"; // Mostrar el contenedor
            }
            if (mapaDiv) {
              // Limpiar el contenido del mapa solo si no se ha inicializado
              if (!mapa) {
                // Inicializar el mapa solo si no existe una instancia
                let latitud = parseFloat(alarmaData.latitud);
                let longitud = parseFloat(alarmaData.longitud);

                // Verificar si las coordenadas son válidas
                if (!isNaN(latitud) && !isNaN(longitud)) {
                  // Asegúrate de que el contenedor tenga un tamaño definido
                  mapaDiv.style.height = "400px"; // O ajusta a un valor adecuado

                  // Inicializa el mapa con las coordenadas
                  mapa = L.map(mapaDiv).setView([latitud, longitud], 19);

                  // Añadir el tile layer (fondo del mapa)
                  L.tileLayer(
                    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
                    {
                      attribution:
                        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                    }
                  ).addTo(mapa);

                  // Inicializar el marcador
                  marcador = L.marker([latitud, longitud], {
                    icon: L.divIcon({
                      className: "leaflet-div-icon",
                      html: '<div style="background-color: red; width: 20px; height: 20px; border-radius: 50%;"></div>',
                      iconSize: [20, 20], // Tamaño del marcador
                    }),
                  })
                    .addTo(mapa)
                    .openPopup();
                } else {
                  console.error(
                    "Coordenadas no válidas",
                    alarmaData.latitud,
                    alarmaData.longitud
                  );
                }
              } else {
                // Solo intentar actualizar el marcador si ha sido inicializado
                if (marcador) {
                  const latitud = parseFloat(alarmaData.latitud);
                  const longitud = parseFloat(alarmaData.longitud);

                  // Verificar si las coordenadas son válidas
                  if (!isNaN(latitud) && !isNaN(longitud)) {
                    marcador.setLatLng([latitud, longitud]);
                    mapa.setView([latitud, longitud], 19);
                  } else {
                    console.error(
                      "Coordenadas no válidas",
                      alarmaData.latitud,
                      alarmaData.longitud
                    );
                  }
                } else {
                  // Si el marcador no está inicializado, crear un nuevo marcador
                  console.log("Marcador no inicializado, creando uno nuevo.");
                  const latitud = parseFloat(alarmaData.latitud);
                  const longitud = parseFloat(alarmaData.longitud);

                  if (!isNaN(latitud) && !isNaN(longitud)) {
                    marcador = L.marker([latitud, longitud], {
                      icon: L.divIcon({
                        className: "leaflet-div-icon",
                        html: '<div style="background-color: red; width: 20px; height: 20px; border-radius: 50%;"></div>',
                        iconSize: [20, 20], // Tamaño del marcador
                      }),
                    })
                      .addTo(mapa)
                      .openPopup();
                  } else {
                    console.error(
                      "Coordenadas no válidas",
                      alarmaData.latitud,
                      alarmaData.longitud
                    );
                  }
                }
              }
            } else {
              console.error("El div del mapa no está disponible.");
            }

            sirenaButton.addEventListener("click", async () => {
              state_sirena = state_sirena === 0 ? 1 : 0;
              sirenaButton.textContent =
                state_sirena === 0 ? "Activar Sirena" : "Desactivar Sirena";

              // Realizar la solicitud a la API para actualizar el estado de la sirena
              try {
                const response = await fetch(
                  `${API_URL}/sirena_2/${idAlarma}`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ estado: state_sirena }),
                  }
                );

                const data = await response.json();
                if (response.ok) {
                  console.log(data.message); // Éxito
                  toggleResueltoButton(); // Actualizar estado del botón "Resuelto"
                  applyButtonStyles(); // Aplicar estilos al botón
                } else {
                  console.error(data.error); // Error
                }
              } catch (error) {
                console.error("Error al comunicar con el servidor:", error);
              }
              function toggleResueltoButton() {
                if (state_sirena === 1) {
                  // Sirena activada, desactivar el botón "Resuelto"
                  resueltoButton.disabled = true;
                  resueltoButton.style.cursor = "not-allowed"; // Cambiar cursor
                  resueltoButton.title = "Desactive la sirena primero"; // Tooltip
                } else {
                  // Sirena desactivada, habilitar el botón "Resuelto"
                  resueltoButton.disabled = false;
                  resueltoButton.style.cursor = "pointer"; // Cambiar cursor
                  resueltoButton.title = "La notificación fue resuelta";
                }
              }
              function applyButtonStyles() {
                if (state_sirena === 1) {
                  // Estilos para cuando la sirena está activada
                  sirenaButton.style.background = "var(--primary)";
                  sirenaButton.style.boxShadow =
                    "0 0 20px rgba(255, 62, 62, 0.5)";

                  // Agregar clase de hover
                  sirenaButton.classList.add("sirena-hover");
                } else {
                  // Restaurar estilo cuando la sirena está desactivada
                  sirenaButton.style.background = "";
                  sirenaButton.style.boxShadow = "";

                  // Eliminar clase de hover
                  sirenaButton.classList.remove("sirena-hover");
                }
              }
              // Inicializar el estado del botón "Resuelto" cuando se carga la página
              toggleResueltoButton();
            });
            resueltoButton.addEventListener("click", async () => {
              const idAlarma = notificacionDiv.dataset.id; // Obtener el ID de la notificación seleccionada
              let respuesta =
                document.getElementById("respuestaTextArea").value; // Obtener el valor del textarea para el feedback

              // Si el textarea está vacío, asignar una respuesta por defecto
              if (!respuesta.trim()) {
                respuesta = "Su solicitud fue resuelta";
              }

              try {
                // Enviar solicitud a /feedback/:id con la respuesta
                // Enviar solicitud a /feedback/:id con la respuesta
                const feedbackResponse = await fetch(
                  `${API_URL}/feedback/${idAlarma}`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ feedback: respuesta }), // Cambié 'respuesta' por 'feedback'
                  }
                );

                if (!feedbackResponse.ok) {
                  throw new Error("Error al enviar el feedback");
                }

                // Asegurarse de que el estado no sea null
                const estado = 0; // Siempre enviar 0 en lugar de null

                // Enviar solicitud a /estado/:id con el estado 0
                const estadoResponse = await fetch(
                  `${API_URL}/estado/${idAlarma}`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ estado }), // Estado siempre será 0
                  }
                );

                if (!estadoResponse.ok) {
                  throw new Error("Error al actualizar el estado");
                }

                console.log("Feedback y estado actualizados correctamente");

                // Reiniciar el textarea a vacío
                document.getElementById("respuestaTextArea").value = "";
                alerta.style.display = "none";
                notificaciones.style.display = "flex";
                contestacionContainer.style.display = "none"; // Ocultar
                // Opcional: puedes actualizar la UI o realizar otras acciones aquí
              } catch (error) {
                console.error("Error al comunicar con el servidor:", error);
              }
            });
          } catch (error) {
            console.error("Error al obtener los detalles de la alarma:", error);
          }
        }
      });

    closeButton.addEventListener("click", () => {
      // Cambia los estilos de display
      alerta.style.display = "none";
      notificaciones.style.display = "flex";
      contestacionContainer.style.display = "none"; // Ocultar
      // Reiniciar el mapa y el marcador
      // Limpiar el mapa y el marcador
      if (mapa) {
        // Eliminar todas las capas excepto la capa base (tile layer)
        mapa.eachLayer(function (layer) {
          if (!(layer instanceof L.TileLayer)) {
            mapa.removeLayer(layer); // Eliminar capa si no es un tile layer
          }
        });
        // Eliminar el marcador si existe
        if (marcador) {
          mapa.removeLayer(marcador); // Eliminar el marcador
          marcador = null; // Asegúrate de que el marcador también sea nulo
        }
      }
    });
    respuestaButton.addEventListener("click", () => {
      if (
        contestacionContainer.style.display === "none" ||
        contestacionContainer.style.display === ""
      ) {
        // Si está oculto o no tiene display configurado
        contestacionContainer.style.display = "block"; // Mostrar
      } else {
        contestacionContainer.style.display = "none"; // Ocultar
      }
    });
  } catch (error) {
    console.error("Error:", error);
    panicoContainer.insertAdjacentHTML(
      "beforeend",
      "<p>Error al cargar las notificaciones de pánico.</p>"
    );
    generalContainer.insertAdjacentHTML(
      "beforeend",
      "<p>Error al cargar las notificaciones generales.</p>"
    );
  }
});
