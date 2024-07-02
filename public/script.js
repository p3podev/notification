document.addEventListener('DOMContentLoaded', function () {
  const notificationsContainer = document.getElementById('notifications');
  const notificationDetails = document.getElementById('notificationDetails');
  const alertTipo = document.getElementById('alertTipo');
  const alertMensaje = document.getElementById('alertMensaje');
  const alertUsuario = document.getElementById('alertUsuario');
  const alertLatitud = document.getElementById('alertLatitud');
  const alertLongitud = document.getElementById('alertLongitud');
  const alertFoto = document.getElementById('alertFoto');
  const mapElement = document.getElementById('map');
  let map;
  let activeNotificationId = null;

  // Obtener la URL del servidor de configuración
  fetch('/config')
    .then(response => response.json())
    .then(config => {
      const apiUrl = config.apiUrl;
      const socket = io(apiUrl);

      // Función para mostrar detalles de notificación
      function showDetails(alert) {
        alertTipo.textContent = alert.tipoAlerta;
        alertMensaje.textContent = alert.mensaje;
        alertUsuario.textContent = alert.usuario;
        alertLatitud.textContent = alert.latitud;
        alertLongitud.textContent = alert.longitud;
        alertFoto.src = alert.foto_url || ''; // Asegurarse de que la URL de la foto no sea null o undefined
        activeNotificationId = alert.id;

        // Si ya hay un mapa inicializado, eliminarlo
        if (map) {
          map.remove();
        }

        // Inicializar mapa de Leaflet
        map = L.map('map').setView([parseFloat(alert.latitud), parseFloat(alert.longitud)], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
        }).addTo(map);

        // Marcador en el mapa
        L.marker([parseFloat(alert.latitud), parseFloat(alert.longitud)]).addTo(map)
          .bindPopup(`<b>${alert.tipoAlerta}</b><br>${alert.usuario}`)
          .openPopup();

        // Mostrar detalles
        notificationDetails.classList.add('active');

        // Agregar cuadro de texto para feedback y botón "Hecho" si no existen
        if (!document.getElementById('feedbackInput')) {
          const feedbackInput = document.createElement('textarea');
          feedbackInput.id = 'feedbackInput';
          feedbackInput.placeholder = 'Escribe tu feedback aquí...';
          notificationDetails.appendChild(feedbackInput);

          const doneButton = document.createElement('button');
          doneButton.id = 'doneButton';
          doneButton.textContent = 'Hecho';
          doneButton.addEventListener('click', markAsDone);
          notificationDetails.appendChild(doneButton);
        }
      }

      // Función para mostrar notificaciones en la lista
      function displayNotification(alert) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.setAttribute('data-id', alert.id); // Asegúrate de que cada notificación tenga un ID único
        notification.innerHTML = `
          <strong>${alert.tipoAlerta}</strong>
          <p>Usuario: ${alert.usuario}</p>
        `;
        notificationsContainer.appendChild(notification);

        // Mostrar detalles al hacer clic en la notificación
        notification.addEventListener('click', () => {
          showDetails(alert);
        });
      }

      // Cargar notificaciones activas al iniciar
      fetch(`${apiUrl}/notificaciones`)
        .then(response => response.json())
        .then(notifications => {
          notifications.forEach(notification => {
            displayNotification(notification);
          });
        })
        .catch(error => {
          console.error('Error al cargar notificaciones:', error);
        });

      // Escuchar nuevas alertas desde el servidor
      socket.on('new-alert', (alert) => {
        displayNotification(alert);
      });

      // Función para marcar notificación como "Hecho"
      function markAsDone() {
        if (activeNotificationId !== null) {
          const feedback = document.getElementById('feedbackInput').value;
          fetch(`${apiUrl}/notificaciones/${activeNotificationId}/inactivar`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ feedback })
          })
          .then(response => {
            if (response.ok) {
              // Eliminar notificación de la lista
              const notification = document.querySelector(`.notification[data-id="${activeNotificationId}"]`);
              if (notification) {
                notification.remove();
              }
              // Ocultar detalles
              notificationDetails.classList.remove('active');
              activeNotificationId = null;
            } else {
              return response.text().then(text => { throw new Error(text) });
            }
          })
          .catch(error => {
            console.error('Error en la solicitud para marcar la notificación como hecha:', error);
            alert(`Error al marcar la notificación como hecha: ${error.message}`);
          });
        } else {
          console.error('No hay ninguna notificación activa seleccionada para marcar como hecha.');
          alert('Error: No hay ninguna notificación activa seleccionada.');
        }
      }
    })
    .catch(error => {
      console.error('Error al obtener la configuración:', error);
    });
});
