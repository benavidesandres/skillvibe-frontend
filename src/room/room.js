import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/room.css';

// Sala de videollamada SIMULADA: muestra tu cámara/micrófono locales, un
// temporizador y un segundo participante falso. No transmite entre personas.
// Para video real, reemplaza el bloque "participante simulado" por WebRTC/Jitsi.
const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const room = params.get('room');
const me = (params.get('nombre') || 'Tú').slice(0, 60);

let stream = null;
let timerId = null;
let talkId = null;
let remoteId = null;

function showMessage(html) {
  $('stage').innerHTML = html;
  $('controls').hidden = true;
}

if (!room || !/^[0-9a-f-]{8,64}$/i.test(room)) {
  showMessage(
    '<p class="text-center text-body-secondary mt-5">Este enlace no tiene un código de sala válido. Abre la clase desde tus reservas en SkillVibe.</p>',
  );
} else {
  $('room').textContent = `Sala ${room.slice(0, 8)}`;
  $('meName').textContent = me;
  $('meInitial').textContent = me.charAt(0).toUpperCase();

  const start = Date.now();
  timerId = setInterval(() => {
    const s = Math.floor((Date.now() - start) / 1000);
    $('timer').textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  }, 1000);

  if (navigator.mediaDevices?.getUserMedia) {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((s) => {
        stream = s;
        $('local').srcObject = s;
        $('local').hidden = false;
        $('localFallback').hidden = true;
      })
      .catch(() => {
        $('camMsg').textContent = 'Sin acceso a la cámara. Puedes seguir en la sala.';
      });
  } else {
    $('camMsg').textContent = 'Tu navegador no permite usar la cámara aquí (necesita HTTPS o localhost).';
  }

  // Participante simulado: "entra" a los 4 s y alterna entre hablando y en silencio
  remoteId = setTimeout(() => {
    $('remoteMsg').textContent = 'Conectado (simulado)';
    $('remote').classList.add('talking');
    talkId = setInterval(() => $('remote').classList.toggle('talking'), 3000);
  }, 4000);

  const toggle = (button, kind, onText, offText) =>
    button.addEventListener('click', () => {
      if (!stream) return;
      const tracks = kind === 'mic' ? stream.getAudioTracks() : stream.getVideoTracks();
      const enabled = !tracks[0]?.enabled;
      tracks.forEach((t) => (t.enabled = enabled));
      button.textContent = enabled ? onText : offText;
      button.classList.toggle('btn-outline-light', enabled);
      button.classList.toggle('btn-warning', !enabled);
    });
  toggle($('btnMic'), 'mic', 'Silenciar micrófono', 'Activar micrófono');
  toggle($('btnCam'), 'cam', 'Apagar cámara', 'Encender cámara');

  $('btnLeave').addEventListener('click', () => {
    stream?.getTracks().forEach((t) => t.stop());
    clearInterval(timerId);
    clearInterval(talkId);
    clearTimeout(remoteId);
    showMessage(
      '<div class="text-center mt-5"><p class="h5">Saliste de la clase.</p><p class="text-body-secondary">Puedes cerrar esta pestaña. El tutor finaliza la clase desde SkillVibe.</p></div>',
    );
  });

  window.addEventListener('pagehide', () => stream?.getTracks().forEach((t) => t.stop()));
}
