const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const os = require("os");
const { startPingLoop, stopPingLoop, stopAll } = require("./ping-monitor");

function showNativeDialog(event, options) {
  if (process.platform !== "linux" && process.platform !== "win32") return;

  const win = BrowserWindow.fromWebContents(event.sender) || null;
  dialog.showMessageBox(win, {
    type: options.type ?? "warning",
    title: options.title ?? "Notification",
    message: options.message ?? "",
    detail: options.detail ?? "",
    buttons: options.buttons ?? ["OK"],
    defaultId: 0,
    cancelId: 0,
    noLink: true,
  });
}

const lastShown = new Map();
function showOnce(key, event, options, cooldownMs = 2000) {
  const now = Date.now();
  const last = lastShown.get(key) || 0;
  if (now - last < cooldownMs) return;
  lastShown.set(key, now);
  showNativeDialog(event, options);
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile("index.html");
}

app.on("ready", createWindow);

ipcMain.on("request-interfaces", (event) => {
  const nets = os.networkInterfaces();
  const interfaces = [];
  for (const name in nets) {
    for (const net of nets[name]) {
      if (!net.internal && net.family === "IPv4") {
        interfaces.push({ name, address: net.address });
      }
    }
  }
  event.sender.send("response-interfaces", interfaces);
});

app.on("window-all-closed", () => {
  stopAll();
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  stopAll();
});

ipcMain.on("add-row", (event, data) => {
  const { host, pingName, name, address } = data;
  event.sender.send("response-row", {
    ipTarget: host,
    pingName,
    interfaceName: name,
    status: "paused",
    address,
  });
});

ipcMain.on("error", (event, data) => {
  const { name, host } = data;

  showOnce(
    "error-duplicate-ping",
    event,
    {
      type: "error",
      title: "",
      message: "Cet hôte est déjà surveillé.",
      detail: `Interface: ${name || "?"}\nHôte/IP: ${host || "?"}`,
      buttons: ["OK"],
    },
    1500
  );
});

ipcMain.on("fields-required", (event) => {
  showOnce(
    "error-fields-required",
    event,
    {
      type: "warning",
      title: "Champs requis",
      message: "Merci de remplir tous les champs avant d’ajouter un ping.",
      buttons: ["OK"],
    },
    1500
  );
});

ipcMain.on("start-ping", (event, payload) => {
  const { id, ipTarget, address, interfaceName } = payload;
  startPingLoop(ipTarget, interfaceName, address, id, (result) => {
    event.sender.send("ping-result", result);
  });
});

ipcMain.on("action", (event, data) => {
  const { action, rowId } = data;
  console.log(`Action: ${action}, Row ID: ${rowId}`);
});

ipcMain.on("delete", (event, data) => {
  const { rowId, action } = data;
  stopPingLoop(rowId);
  event.sender.send("delete-it", rowId);
});
