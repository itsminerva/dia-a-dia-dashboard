# Dia a Dia Dashboard

Dashboard personal con agenda, recordatorios por email, bienestar, finanzas, notas y un espacio universitario con horario y Pomodoro.

## Requisitos

- Node.js
- npm
- Una cuenta de correo para enviar recordatorios

## Instalacion

```bash
npm install
```

## Variables de entorno

Crea un archivo `.env` en la raiz del proyecto:

```env
PORT=3000
EMAIL_USER=tu_correo@gmail.com
EMAIL_PASS=tu_app_password
```

`EMAIL_PASS` debe ser una contraseña de aplicacion, no la contraseña normal de Gmail.

## Ejecutar

```bash
npm start
```

Luego abre:

```txt
http://localhost:3000/index.html
```

## Paginas

- Dashboard principal: `/index.html`
- Universidad: `/universidad.html`

## Notas

El archivo `.env`, `node_modules` y `backend/data.json` no se suben a GitHub.
