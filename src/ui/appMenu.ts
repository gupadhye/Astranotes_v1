/** Payloads from the Electron application menu (`app-menu` IPC). Keep in sync with `electron/preload.ts`. */
export type AppMenuPayload = { action: "view"; target: "workspace" };
