const storeKey = "universityDashboard";
const days = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];
let timer = null;
let isBreak = false;
let remaining = 25 * 60;
let running = false;

const state = loadUniversity();

function uid() {
  return globalThis.crypto && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadUniversity() {
  const saved = localStorage.getItem(storeKey);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      localStorage.removeItem(storeKey);
    }
  }
  return {
    classes: [
      { id: uid(), name: "Matematicas", day: "Lunes", time: "08:00", room: "Aula 204", color: "#c9e7f4" },
      { id: uid(), name: "Psicologia", day: "Miercoles", time: "10:00", room: "Lab 2", color: "#f8cdd8" }
    ],
    notes: "",
    log: []
  };
}

function saveUniversity() {
  localStorage.setItem(storeKey, JSON.stringify(state));
}

function renderSchedule() {
  const grid = document.querySelector("#scheduleGrid");
  grid.innerHTML = "";
  days.forEach((day) => {
    const column = document.createElement("section");
    column.className = "schedule-day";
    column.innerHTML = `<h3>${day}</h3>`;
    const classes = state.classes.filter((entry) => entry.day === day).sort((a, b) => a.time.localeCompare(b.time));
    if (!classes.length) {
      const empty = document.createElement("span");
      empty.className = "task-meta";
      empty.textContent = "Sin clases";
      column.appendChild(empty);
    }
    classes.forEach((entry) => {
      const card = document.createElement("article");
      card.className = "class-card";
      card.style.setProperty("--class-color", entry.color);
      card.innerHTML = `
        <strong></strong>
        <span>${entry.time} - ${entry.room || "Sin aula"}</span>
        <button type="button">Eliminar</button>
      `;
      card.querySelector("strong").textContent = entry.name;
      card.querySelector("button").addEventListener("click", () => {
        state.classes = state.classes.filter((item) => item.id !== entry.id);
        saveUniversity();
        renderSchedule();
      });
      column.appendChild(card);
    });
    grid.appendChild(column);
  });
}

function renderTimer() {
  const minutes = String(Math.floor(remaining / 60)).padStart(2, "0");
  const seconds = String(remaining % 60).padStart(2, "0");
  document.querySelector("#timerDisplay").textContent = `${minutes}:${seconds}`;
  document.querySelector("#timerMode").textContent = isBreak ? "Descanso" : "Pomodoro";
}

function startTimer() {
  if (running) return;
  running = true;
  timer = window.setInterval(() => {
    remaining -= 1;
    if (remaining <= 0) {
      finishTimerRound();
    }
    renderTimer();
  }, 1000);
}

function pauseTimer() {
  running = false;
  window.clearInterval(timer);
}

function resetTimer() {
  pauseTimer();
  isBreak = false;
  remaining = Number(document.querySelector("#focusMinutes").value || 25) * 60;
  renderTimer();
}

function finishTimerRound() {
  pauseTimer();
  playBell();
  if (isBreak) {
    notify("Descanso terminado", "Es momento de volver al estudio.");
    isBreak = false;
    remaining = Number(document.querySelector("#focusMinutes").value || 25) * 60;
  } else {
    notify("Pomodoro terminado", "Toma una pausa para descansar.");
    isBreak = true;
    remaining = Number(document.querySelector("#breakMinutes").value || 5) * 60;
  }
}

function notify(title, body) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body });
  }
  state.log.push({
    time: new Date().toLocaleString("es-DO", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }),
    message: `${title}: ${body}`
  });
  state.log = state.log.slice(-20);
  saveUniversity();
  renderNotifications();
}

function renderNotifications() {
  document.querySelector("#universityNotificationStatus").textContent = `Permiso del navegador: ${"Notification" in window ? Notification.permission : "no disponible"}.`;
  const list = document.querySelector("#universityNotifications");
  list.innerHTML = "";
  const entries = state.log.slice(-8).reverse();
  if (!entries.length) {
    const empty = document.createElement("li");
    empty.textContent = "Todavia no hay alertas.";
    list.appendChild(empty);
    return;
  }
  entries.forEach((entry) => {
    const item = document.createElement("li");
    item.textContent = `${entry.time} - ${entry.message}`;
    list.appendChild(item);
  });
}

function playBell() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const context = new AudioContext();
  [660, 880, 1040].forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.001, context.currentTime + index * 0.16);
    gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + index * 0.16 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + index * 0.16 + 0.34);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(context.currentTime + index * 0.16);
    oscillator.stop(context.currentTime + index * 0.16 + 0.36);
  });
}

function bindUniversity() {
  document.querySelector("#classForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const name = document.querySelector("#className").value.trim();
    if (!name) return;
    state.classes.push({
      id: uid(),
      name,
      day: document.querySelector("#classDay").value,
      time: document.querySelector("#classTime").value,
      room: document.querySelector("#classRoom").value.trim(),
      color: document.querySelector("#classColor").value
    });
    event.currentTarget.reset();
    saveUniversity();
    renderSchedule();
  });

  document.querySelector("#universityNotes").value = state.notes || "";
  document.querySelector("#universityNotes").addEventListener("input", (event) => {
    state.notes = event.target.value;
    saveUniversity();
  });

  document.querySelector("#startTimer").addEventListener("click", startTimer);
  document.querySelector("#pauseTimer").addEventListener("click", pauseTimer);
  document.querySelector("#resetTimer").addEventListener("click", resetTimer);
  document.querySelector("#focusMinutes").addEventListener("input", resetTimer);
  document.querySelector("#breakMinutes").addEventListener("input", () => {
    if (isBreak) resetTimer();
  });

  document.querySelector("#universityNotifyBtn").addEventListener("click", async () => {
    if (!("Notification" in window)) {
      notify("Notificaciones", "Este navegador no soporta notificaciones.");
      return;
    }
    const result = await Notification.requestPermission();
    notify("Notificaciones", `Permiso: ${result}.`);
  });
}

bindUniversity();
renderSchedule();
renderTimer();
renderNotifications();
