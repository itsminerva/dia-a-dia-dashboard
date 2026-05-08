const defaultTasks = [
  { id: createId(), text: "Revisar pendientes importantes", time: "09:00", area: "Personal", done: false },
  { id: createId(), text: "Preparar outfit o bolso para manana", time: "20:30", area: "Casa", done: false },
  { id: createId(), text: "Tomar 15 minutos para ordenar ideas", time: "21:00", area: "Personal", done: false }
];

const apiBase = "http://localhost:3000/api";
const habits = ["Skincare", "Lectura", "Ejercicio"];
const dayLabels = ["L", "M", "X", "J", "V", "S", "D"];
const state = loadState();

const taskForm = document.querySelector("#taskForm");
const taskText = document.querySelector("#taskText");
const taskDate = document.querySelector("#taskDate");
const taskTime = document.querySelector("#taskTime");
const taskArea = document.querySelector("#taskArea");
const taskList = document.querySelector("#taskList");
const waterCount = document.querySelector("#waterCount");
const savingGoal = document.querySelector("#savingGoal");
const savedAmount = document.querySelector("#savedAmount");
const savingProgress = document.querySelector("#savingProgress");
const savingText = document.querySelector("#savingText");
const savingPreview = document.querySelector("#savingPreview");
const moodSelect = document.querySelector("#moodSelect");
const moodVisual = document.querySelector("#moodVisual");
const priorityInput = document.querySelector("#priorityInput");
const notesArea = document.querySelector("#notesArea");
const taskDialog = document.querySelector("#taskDialog");
const registerDialog = document.querySelector("#registerDialog");
const registerForm = document.querySelector("#registerForm");
const notificationList = document.querySelector("#notificationList");
const notificationStatus = document.querySelector("#notificationStatus");

function loadState() {
  const saved = localStorage.getItem("personalDashboard");
  if (!saved) {
    return {
      tasks: defaultTasks,
      water: 2,
      mood: "Tranquila",
      priority: "Terminar lo mas importante",
      savingGoal: 300,
      savedAmount: 120,
      notes: "",
      checkins: {},
      habits: {},
      user: {},
      notificationLog: []
    };
  }

  try {
    const parsed = JSON.parse(saved);
    return {
      ...parsed,
      tasks: parsed.tasks || defaultTasks,
      user: parsed.user || {},
      notificationLog: parsed.notificationLog || []
    };
  } catch {
    return {
      tasks: defaultTasks,
      water: 2,
      mood: "Tranquila",
      priority: "Terminar lo mas importante",
      savingGoal: 300,
      savedAmount: 120,
      notes: "",
      checkins: {},
      habits: {},
      user: {},
      notificationLog: []
    };
  }
}

function createId() {
  return globalThis.crypto && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function saveState() {
  localStorage.setItem("personalDashboard", JSON.stringify(state));
}

async function postJson(path, payload) {
  const response = await fetch(`${apiBase}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Error del servidor" }));
    throw new Error(error.message || "Error del servidor");
  }

  return response.json();
}

function renderDate() {
  const formatter = new Intl.DateTimeFormat("es-DO", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });
  document.querySelector("#currentDate").textContent = formatter.format(new Date());
}

function renderTasks() {
  taskList.innerHTML = "";
  state.tasks
    .slice()
    .sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99"))
    .forEach((task) => {
      const item = document.createElement("li");
      item.className = `task-item${task.done ? " done" : ""}`;
      item.innerHTML = `
        <input type="checkbox" ${task.done ? "checked" : ""} aria-label="Completar tarea" />
        <div>
          <span class="task-title"></span>
          <span class="task-meta">${task.date || "Hoy"} - ${task.time || "Sin hora"} - ${task.area}</span>
        </div>
        <button class="delete-btn" aria-label="Eliminar tarea">x</button>
      `;
      item.querySelector(".task-title").textContent = task.text;
      item.querySelector("input").addEventListener("change", (event) => {
        task.done = event.target.checked;
        saveState();
        pulse(item);
        renderTasks();
      });
      item.querySelector("button").addEventListener("click", () => {
        animateOut(item);
        state.tasks = state.tasks.filter((entry) => entry.id !== task.id);
        saveState();
        window.setTimeout(renderTasks, 140);
      });
      taskList.appendChild(item);
    });

  animateList(".task-item");
}

function renderProfile() {
  document.querySelector("#profileName").textContent = state.user.name ? `Hola, ${state.user.name}` : "Hola";
  document.querySelector("#profileEmail").textContent = state.user.email || "Registra tu correo";
}

function renderNotifications() {
  const permission = "Notification" in window ? Notification.permission : "no disponible";
  notificationStatus.textContent = `Correo registrado: ${state.user.email || "pendiente"}. Permiso del navegador: ${permission}.`;
  notificationList.innerHTML = "";
  const entries = state.notificationLog.slice(-6).reverse();
  if (!entries.length) {
    const empty = document.createElement("li");
    empty.textContent = "Todavia no hay notificaciones.";
    notificationList.appendChild(empty);
    return;
  }
  entries.forEach((entry) => {
    const item = document.createElement("li");
    item.textContent = `${entry.time} - ${entry.message}`;
    notificationList.appendChild(item);
  });
}

function renderHabits() {
  const habitList = document.querySelector("#habitList");
  habitList.innerHTML = "";

  habits.forEach((habit) => {
    const activeDays = state.habits[habit] || [];
    const row = document.createElement("section");
    row.className = "habit-row";
    row.innerHTML = `
      <header>
        <strong>${habit}</strong>
        <span class="task-meta">${activeDays.length}/7</span>
      </header>
      <div class="habit-days"></div>
    `;

    const days = row.querySelector(".habit-days");
    dayLabels.forEach((label, index) => {
      const day = document.createElement("button");
      day.type = "button";
      day.textContent = label;
      day.className = activeDays.includes(index) ? "active" : "";
      day.addEventListener("click", () => {
        const current = new Set(state.habits[habit] || []);
        current.has(index) ? current.delete(index) : current.add(index);
        state.habits[habit] = Array.from(current).sort();
        saveState();
        renderHabits();
        pulse(day);
      });
      days.appendChild(day);
    });

    habitList.appendChild(row);
  });
}

function renderWater() {
  waterCount.textContent = state.water;
  pulse(waterCount.closest(".summary-card"));
}

function renderSavings() {
  const goal = Math.max(Number(state.savingGoal) || 0, 0);
  const saved = Math.max(Number(state.savedAmount) || 0, 0);
  const percent = goal ? Math.min((saved / goal) * 100, 100) : 0;
  savingGoal.value = goal;
  savedAmount.value = saved;
  if (window.gsap) {
    gsap.to(savingProgress, { width: `${percent}%`, duration: 0.55, ease: "power2.out" });
  } else {
    savingProgress.style.width = `${percent}%`;
  }
  savingPreview.textContent = `$${goal.toLocaleString("en-US")}`;
  savingText.textContent = goal
    ? `Has avanzado ${Math.round(percent)}% de tu meta. Faltan $${Math.max(goal - saved, 0).toLocaleString("en-US")}.`
    : "Agrega una meta para calcular tu progreso.";
}

function renderMood() {
  const colors = {
    Tranquila: "#c9e7f4",
    Enfocada: "#cceadb",
    Creativa: "#dcd3f6",
    Cansada: "#f5e5ad",
    Feliz: "#f8cdd8"
  };
  moodVisual.style.backgroundColor = colors[state.mood] || "#ffffff";
  pulse(moodVisual);
}

function bindInputs() {
  document.querySelectorAll("[data-open-task]").forEach((button) => {
    button.addEventListener("click", () => {
      taskDialog.showModal();
      document.body.classList.add("modal-open");
      taskDate.value = todayKey();
      taskText.focus();
      if (window.gsap) {
        gsap.fromTo(".task-dialog .task-form", { y: 24, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.28, ease: "power2.out" });
      }
    });
  });

  document.querySelector("[data-close-dialog]").addEventListener("click", closeTaskDialog);
  taskDialog.addEventListener("close", () => document.body.classList.remove("modal-open"));

  document.querySelectorAll("[data-open-register]").forEach((button) => {
    button.addEventListener("click", () => {
      registerDialog.showModal();
      document.body.classList.add("modal-open");
      document.querySelector("#userName").value = state.user.name || "";
      document.querySelector("#userEmail").value = state.user.email || "";
      document.querySelector("#userEmail").focus();
    });
  });

  document.querySelector("[data-close-register]").addEventListener("click", closeRegisterDialog);
  registerDialog.addEventListener("close", () => document.body.classList.remove("modal-open"));

  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    state.user = {
      name: document.querySelector("#userName").value.trim(),
      email: document.querySelector("#userEmail").value.trim()
    };
    saveState();
    closeRegisterDialog();
    renderProfile();
    try {
      await postJson("/register", state.user);
      addNotificationLog(`Registro guardado en el servidor para ${state.user.email}.`);
    } catch (error) {
      addNotificationLog(`Registro local guardado. Servidor no disponible: ${error.message}.`);
    }
  });

  document.querySelector("#enableNotifications").addEventListener("click", async () => {
    if (!("Notification" in window)) {
      addNotificationLog("Este navegador no soporta notificaciones.");
      return;
    }
    const result = await Notification.requestPermission();
    addNotificationLog(`Permiso de notificaciones: ${result}.`);
    renderNotifications();
  });

  document.querySelector("[data-focus-notes]").addEventListener("click", () => {
    document.querySelector("#bienestar").scrollIntoView({ behavior: "smooth", block: "center" });
    notesArea.focus();
    pulse(notesArea);
  });

  taskForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!taskText.value.trim()) return;
    const task = {
      id: createId(),
      text: taskText.value.trim(),
      date: taskDate.value || todayKey(),
      time: taskTime.value,
      area: taskArea.value,
      done: false,
      notified: false
    };

    state.tasks.push(task);
    taskForm.reset();
    closeTaskDialog();
    saveState();
    renderTasks();

    if (state.user.email && task.time) {
      try {
        await postJson("/tasks", { ...task, email: state.user.email });
        addNotificationLog(`Recordatorio por correo programado: ${task.text}.`);
      } catch (error) {
        addNotificationLog(`Tarea guardada localmente. Servidor no disponible: ${error.message}.`);
      }
    }
  });

  document.querySelectorAll("[data-step-water]").forEach((button) => {
    button.addEventListener("click", () => {
      state.water = Math.max(0, Math.min(8, state.water + Number(button.dataset.stepWater)));
      saveState();
      renderWater();
    });
  });

  [savingGoal, savedAmount].forEach((input) => {
    input.addEventListener("input", () => {
      state[input.id] = Number(input.value);
      saveState();
      renderSavings();
    });
  });

  moodSelect.addEventListener("change", () => {
    state.mood = moodSelect.value;
    saveState();
    renderMood();
  });

  priorityInput.addEventListener("input", () => {
    state.priority = priorityInput.value;
    saveState();
  });

  notesArea.addEventListener("input", () => {
    state.notes = notesArea.value;
    saveState();
  });

  document.querySelectorAll("[data-checkin]").forEach((input) => {
    const key = input.dataset.checkin;
    input.checked = Boolean(state.checkins[key]);
    input.addEventListener("change", () => {
      state.checkins[key] = input.checked;
      saveState();
      pulse(input.closest("label"));
    });
  });
}

function hydrateInputs() {
  waterCount.textContent = state.water;
  moodSelect.value = state.mood;
  priorityInput.value = state.priority;
  savingGoal.value = state.savingGoal;
  savedAmount.value = state.savedAmount;
  notesArea.value = state.notes;
}

function closeTaskDialog() {
  if (taskDialog.open) taskDialog.close();
  document.body.classList.remove("modal-open");
}

function closeRegisterDialog() {
  if (registerDialog.open) registerDialog.close();
  document.body.classList.remove("modal-open");
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function addNotificationLog(message) {
  state.notificationLog.push({
    time: new Date().toLocaleString("es-DO", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }),
    message
  });
  state.notificationLog = state.notificationLog.slice(-20);
  saveState();
  renderNotifications();
}

function notifyUser(title, body) {
  playBell();
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body });
  }
  addNotificationLog(`${title}: ${body}`);
}

function checkTaskReminders() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 5);
  let changed = false;

  state.tasks.forEach((task) => {
    if (!task.done && !task.notified && task.date === date && task.time === time) {
      task.notified = true;
      changed = true;
      notifyUser("Recordatorio de tarea", task.text);
    }
  });

  if (changed) saveState();
}

function playBell() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const context = new AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = 880;
  gain.gain.setValueAtTime(0.001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, context.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.6);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.62);
}

function pulse(element) {
  if (!element) return;
  if (window.gsap) {
    gsap.fromTo(element, { scale: 0.97 }, { scale: 1, duration: 0.28, ease: "back.out(2)" });
    return;
  }
  element.classList.remove("pop");
  void element.offsetWidth;
  element.classList.add("pop");
}

function animateOut(element) {
  if (!window.gsap || !element) return;
  gsap.to(element, { x: 16, opacity: 0, height: 0, marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0, duration: 0.18, ease: "power1.in" });
}

function animateList(selector) {
  if (!window.gsap) return;
  gsap.fromTo(selector, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.28, stagger: 0.035, ease: "power2.out" });
}

function introAnimation() {
  if (!window.gsap) return;
  gsap.from(".sidebar", { x: -24, opacity: 0, duration: 0.55, ease: "power2.out" });
  gsap.from(".topbar, .hero-panel, .summary-card, .image-tile, .panel", {
    y: 20,
    opacity: 0,
    duration: 0.55,
    stagger: 0.055,
    ease: "power2.out"
  });
  gsap.to(".ambient-layer span", {
    y: -18,
    x: 12,
    duration: 4.5,
    repeat: -1,
    yoyo: true,
    stagger: 0.6,
    ease: "sine.inOut"
  });
}

renderDate();
hydrateInputs();
bindInputs();
renderProfile();
renderWater();
renderTasks();
renderHabits();
renderSavings();
renderMood();
renderNotifications();
window.setInterval(checkTaskReminders, 30000);
window.addEventListener("load", introAnimation);
