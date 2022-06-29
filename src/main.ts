import { app, BrowserWindow, Tray, Menu, MenuItem, shell, ipcMain, globalShortcut, screen } from "electron";
import * as path from "path";
import electronReload from "electron-reload";
import Positioner from "./positioner";

interface MenuTray extends Tray {
  contextMenu?: Menu;
}

let overlayWindow: BrowserWindow;
let mainWindow: BrowserWindow;
let tray: MenuTray;

const isDev = app.commandLine.hasSwitch("dev");

function preventRefresh(window: BrowserWindow) {
  if (isDev) return;

  window.on("focus", () => {
    globalShortcut.register("CommandOrControl+R", () => undefined);
    globalShortcut.register("CommandOrControl+Shift+R", () => undefined);
    globalShortcut.register("F5", () => undefined);
  });
  window.on("blur", () => {
    globalShortcut.unregisterAll();
  });
}

function createOverlayWindow() {
  // Create the browser window.
  overlayWindow = new BrowserWindow({
    title: "GFN Clips",
    webPreferences: {
      preload: path.join(__dirname, "preloadOverlay.js"),
    },
    frame: false,
    autoHideMenuBar: true,
    transparent: true,
    skipTaskbar: true,
    hasShadow: false,
    show: false,
  });

  preventRefresh(overlayWindow);

  overlayWindow.setIgnoreMouseEvents(true, { forward: true });
  overlayWindow.setAlwaysOnTop(true, "screen-saver");
  overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  overlayWindow.setFullScreenable(false);

  overlayWindow.loadFile(path.join(__dirname, "../pages/html/overlay.html"));

  overlayWindow.webContents.openDevTools();
}

function createMainWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    title: "GFN Clips",
    webPreferences: {
      preload: path.join(__dirname, "preloadMain.js"),
    },
    width: 800,
    height: 600,
    show: false,
    frame: false,
    autoHideMenuBar: true,
    transparent: true,
    skipTaskbar: false,
    hasShadow: false,
    resizable: false,
  });

  preventRefresh(mainWindow);

  mainWindow.loadFile(path.join(__dirname, "../pages/html/tray.html"));

  mainWindow.on("close", (e) => {
    e.preventDefault();
    mainWindow.hide();
  });
  mainWindow.on("show", () => {
    Positioner.position(mainWindow, tray.getBounds());
    mainWindow.focus();
  });
  mainWindow.webContents.once("dom-ready", () => {
    mainWindow.show();
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'allow' };
  });
}

function createTray() {
  if (app.dock) {
    app.dock.hide();
  }

  tray = new Tray(path.join(__dirname, "../assets/logo512.png"));
  tray.contextMenu = Menu.buildFromTemplate([
    new MenuItem({
      label: "Exit",
      type: "normal",
      click: () => app.quit(),
    })
  ]);

  tray.setToolTip("GFNClips");
  tray.setIgnoreDoubleClickEvents(true);
  tray.on("click", function () {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
      return;
    }
    mainWindow.show();
  });
  tray.on("right-click", () => {
    tray.popUpContextMenu(tray.contextMenu);
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
  createOverlayWindow();
  createMainWindow();
  createTray();

  if (isDev) electronReload(process.cwd(), {});
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.on("minimize-window", (e, isMain: boolean) => {
  if (isMain)
    mainWindow.minimize();
  else
    overlayWindow.minimize();
});

ipcMain.on("close-window", (e, isMain: boolean) => {
  if (isMain)
    mainWindow.hide();
  else
    overlayWindow.hide();
});

ipcMain.on("show-window", () => {
  overlayWindow.maximize();
  overlayWindow.show();
  overlayWindow.focus();
});

ipcMain.handle("set-ignore-mouse-events", (e, ...args: [boolean, Electron.IgnoreMouseEventsOptions]) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  console.log(args[0]);
  win.setIgnoreMouseEvents(...args);
});

// This handler updates our mouse event settings depending
// on whether the user is hovering over a clickable element
// in the call window.

setInterval(() => {
  const point = screen.getCursorScreenPoint();
  overlayWindow.capturePage({ x: point.x, y: point.y, width: 1, height: 1 }).then((image) => {
    const buffer = image.getBitmap();
    const [r, g, b, a] = [buffer[0], buffer[1], buffer[2], buffer[3]];
    if (a === 0) {
      overlayWindow.setIgnoreMouseEvents(true, { forward: true });
    } else {
      overlayWindow.setIgnoreMouseEvents(false);
    }
  });
}, 50);

// regex to find timestamp from name
// /[0-9]{1,4}\.[0-9]{1,2}\.[0-9]{1,2} - [0-9]{1,2}.[0-9]{1,2}.[0-9]{1,2}.[0-9]{1,2}/i