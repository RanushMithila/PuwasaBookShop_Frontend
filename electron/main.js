const { app, BrowserWindow } = require("electron");
const path = require("path");
const isDev = process.env.NODE_ENV === "development";

// Handle Squirrel installer events for Windows
// if (require("electron-squirrel-startup")) {
//   app.quit();
// }

// Create the main window
const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"), // Load the preload script
      nodeIntegration: false, // Disable Node.js integration for security
      contextIsolation: true, // Enable context isolation for secure API exposure
    },
  });

  mainWindow.maximize();

  // Load the appropriate URL or file based on the environment
  if (isDev) {
    mainWindow.loadURL("http://localhost:5173"); // Development server URL
    mainWindow.webContents.openDevTools(); // Open developer tools in development mode
  } else {
    mainWindow.loadFile(path.join(__dirname, "dist-frontend/index.html")); // Production build
  }
};

app.whenReady().then(() => {
  createWindow();

  // Register IPC handlers
  require("./ipcHandlers/printHandler"); // Ensure this file exists and handles IPC events
  require("./ipcHandlers/helloHandler");
  require("./ipcHandlers/machineIdHandler"); // Machine ID handler for device registration

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit the app when all windows are closed (except on macOS)
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
