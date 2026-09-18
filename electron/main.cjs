const { app, BrowserWindow, shell } = require("electron");
const path = require("path");

// Démarre le serveur Express (bundle CJS auto-contenu) avant d'ouvrir la fenêtre.
require(path.join(__dirname, "..", "dist-server", "server.cjs"));

const PORT = Number(process.env.PORT) || 8787;
const APP_URL = `http://localhost:${PORT}`;

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: "#FAF9F6",
    autoHideMenuBar: true,
    title: "Slider",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadURL(APP_URL);
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
