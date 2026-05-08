const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const cron = require("node-cron");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;
const dataPath = path.join(__dirname, "data.json");

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..")));

function ensureDataFile() {
  if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, JSON.stringify({ users: [], tasks: [] }, null, 2));
  }
}

function readData() {
  ensureDataFile();
  return JSON.parse(fs.readFileSync(dataPath, "utf8"));
}

function writeData(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

function getTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

function todayInLocalTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function currentLocalTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    emailConfigured: Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS)
  });
});

app.post("/api/register", (req, res) => {
  const { name = "", email = "" } = req.body;

  if (!email.includes("@")) {
    return res.status(400).json({ ok: false, message: "Correo invalido" });
  }

  const data = readData();
  data.users = [{ name: name.trim(), email: email.trim() }];
  writeData(data);

  res.json({ ok: true, user: data.users[0] });
});

app.post("/api/tasks", (req, res) => {
  const { text, date, time, area, email } = req.body;

  if (!text || !date || !time || !email) {
    return res.status(400).json({ ok: false, message: "Faltan datos de la tarea" });
  }

  const data = readData();
  const task = {
    id: Date.now().toString(),
    text: text.trim(),
    date,
    time,
    area: area || "Personal",
    email,
    notified: false,
    createdAt: new Date().toISOString()
  };

  data.tasks.push(task);
  writeData(data);

  res.json({ ok: true, task });
});

app.get("/api/tasks", (req, res) => {
  const data = readData();
  res.json({ ok: true, tasks: data.tasks });
});

cron.schedule("* * * * *", async () => {
  const transporter = getTransporter();
  if (!transporter) return;

  const data = readData();
  const today = todayInLocalTime();
  const time = currentLocalTime();
  let changed = false;

  for (const task of data.tasks) {
    if (!task.notified && task.date === today && task.time === time && task.email) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: task.email,
        subject: "Recordatorio de tarea",
        text: `Tienes una tarea pendiente: ${task.text}\nCategoria: ${task.area}\nHora: ${task.time}`
      });

      task.notified = true;
      task.notifiedAt = new Date().toISOString();
      changed = true;
      console.log(`Correo enviado a ${task.email}: ${task.text}`);
    }
  }

  if (changed) writeData(data);
});

app.listen(port, () => {
  ensureDataFile();
  console.log(`Backend corriendo en http://localhost:${port}`);
  console.log(`Dashboard: http://localhost:${port}/index.html`);
});
