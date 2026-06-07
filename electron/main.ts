import { app, BrowserWindow, ipcMain, Menu } from "electron";
import path from "node:path";
import { createNodeJsonFileStorage } from "../src/adapters/nodeJsonFileStorage.js";
import { createNodeVaultStorage } from "../src/adapters/nodeVaultStorage.js";
import type { NotesSnapshot } from "../src/core/fileStorageManager.js";
import type { VaultConfig } from "../src/core/vaultConfig.js";

function notesFilePath(): string {
  return path.join(app.getPath("userData"), "notes.json");
}

function vaultFilePath(): string {
  return path.join(app.getPath("userData"), "vault.json");
}

function createApplicationMenu(): void {
  const isMac = process.platform === "darwin";

  const template: Electron.MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: "about" },
              { type: "separator" },
              { role: "services" },
              { type: "separator" },
              { role: "hide" },
              { role: "hideOthers" },
              { role: "unhide" },
              { type: "separator" },
              { role: "quit" },
            ],
          } satisfies Electron.MenuItemConstructorOptions,
        ]
      : []),
    {
      label: "File",
      submenu: [isMac ? { role: "close" } : { role: "quit" }],
    },
    {
      label: "Notes",
      submenu: [
        {
          label: "Notes workspace",
          accelerator: "CmdOrCtrl+1",
          click: (_item, focusedWindow) => {
            const win = focusedWindow as BrowserWindow | undefined;
            win?.webContents.send("app-menu", { action: "view", target: "workspace" });
          },
        },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createWindow(): void {
  const win = new BrowserWindow({
    width: 960,
    height: 640,
    minWidth: 480,
    minHeight: 360,
    title: "AstraNotes",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    void win.loadURL(devUrl);
  } else {
    void win.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
}

app.whenReady().then(() => {
  const io = createNodeJsonFileStorage(notesFilePath());
  const vaultIo = createNodeVaultStorage(vaultFilePath());

  ipcMain.handle("notes:load", async (): Promise<NotesSnapshot> => {
    try {
      return await io.read();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not load notes.";
      throw new Error(message);
    }
  });

  ipcMain.handle("notes:save", async (_event, snapshot: NotesSnapshot): Promise<void> => {
    try {
      await io.write(snapshot);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not save notes.";
      throw new Error(message);
    }
  });

  ipcMain.handle("vault:load", async (): Promise<VaultConfig | null> => {
    try {
      return await vaultIo.load();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not load vault.";
      throw new Error(message);
    }
  });

  ipcMain.handle("vault:save", async (_event, config: VaultConfig): Promise<void> => {
    try {
      await vaultIo.save(config);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not save vault.";
      throw new Error(message);
    }
  });

  createApplicationMenu();
  createWindow();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
