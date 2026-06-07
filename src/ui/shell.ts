import type { Note } from "@core/note";
import { SECURE_CONTENT_MASK } from "@core/note";
import type { AppMenuPayload } from "./appMenu.js";

export type ShellContext = {
  noteCount: number;
  isDesktop: boolean;
};

/** Wired from `mountApp`: note operations through the controller/service stack. */
export type ShellApi = {
  createNote: (
    title: string,
    content: string,
    isSecure?: boolean,
  ) => Promise<{ ok: true; note: Note } | { ok: false; message: string }>;
  updateNote: (
    id: string,
    title: string,
    content: string,
    isSecure?: boolean,
  ) => Promise<{ ok: true; note: Note } | { ok: false; message: string }>;
  deleteNote: (id: string) => Promise<{ ok: true } | { ok: false; message: string }>;
  findNotes: (query: string) => Promise<{ ok: true; notes: Note[] } | { ok: false; message: string }>;
  listNotes: () => Promise<Note[]>;
  hasVault: () => boolean;
  isVaultUnlocked: () => boolean;
  lockVault: () => void;
  unlockVault: (password: string) => Promise<{ ok: true } | { ok: false; message: string }>;
};

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function formatDate(iso?: string): string {
  if (!iso) {
    return "";
  }
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
}

function renderShellHtml(): string {
  return `
    <div class="app-shell">
      <header class="app-header">
        <div class="app-brand">
          <span class="app-brand-icon" aria-hidden="true">✦</span>
          <span>AstraNotes</span>
        </div>
        <div class="header-actions">
          <span class="vault-status" data-role="vault-status">Vault locked</span>
          <button type="button" class="btn-ghost" data-action="toggle-vault">Unlock vault</button>
        </div>
      </header>
      <div class="app-body">
        <aside class="app-sidebar" aria-label="Notes sidebar">
          <div class="sidebar-top">
            <button type="button" data-action="focus-new-note" class="btn-new-note">+ New note</button>
            <label class="sidebar-search">
              <input type="text" data-field="search" maxlength="500" autocomplete="off" placeholder="Search by title…" />
            </label>
            <div class="sidebar-search-actions">
              <button type="button" data-action="search-notes" class="btn-sidebar">Find</button>
              <button type="button" data-action="clear-search" class="btn-sidebar">Clear</button>
            </div>
            <p class="sidebar-feedback" data-role="search-feedback" hidden></p>
          </div>
          <div class="sidebar-empty" data-sidebar-empty hidden>No notes available</div>
          <ul class="sidebar-note-list" data-note-list aria-label="Saved notes"></ul>
          <p class="sidebar-meta" data-workspace-meta></p>
        </aside>
        <main class="workspace-main">
          <div class="editor-panel" data-editor-panel>
            <div class="editor-empty" data-editor-empty>
              <div class="editor-empty-icon" aria-hidden="true">📝</div>
              <h2>Your notes workspace</h2>
              <p>Select a note from the sidebar or create a new one to get started.</p>
            </div>
            <div class="editor-form" data-editor-form hidden>
              <div class="editor-form-header">
                <h2 class="editor-form-title" data-role="editor-label">New note</h2>
                <label class="secure-toggle">
                  <input type="checkbox" data-field="secure" />
                  <span class="secure-toggle-label">
                    <span class="secure-icon" aria-hidden="true">🔒</span>
                    Secure note
                  </span>
                </label>
              </div>
              <label class="note-field">
                <span>Title</span>
                <input type="text" data-field="title" maxlength="500" autocomplete="off" placeholder="Note title" />
              </label>
              <label class="note-field">
                <span>Content</span>
                <textarea data-field="content" rows="12" placeholder="Write something…"></textarea>
              </label>
              <p class="secure-hint" data-role="secure-hint" hidden>Secure notes are encrypted on your device. Unlock the vault to view or edit them.</p>
              <div class="note-form-actions">
                <button type="button" data-action="save-note" class="btn-primary">Save note</button>
                <button type="button" data-action="delete-note" class="btn-danger" hidden>Delete</button>
                <button type="button" data-action="refresh-notes" class="btn-secondary">Refresh</button>
              </div>
              <p class="form-feedback form-feedback--error" data-role="form-error" hidden></p>
              <p class="form-feedback form-feedback--ok" data-role="form-success" hidden></p>
            </div>
          </div>
        </main>
      </div>
      <div class="vault-overlay" data-role="vault-overlay" hidden>
        <div class="vault-modal" role="dialog" aria-labelledby="vault-title" aria-modal="true">
          <h2 id="vault-title" data-role="vault-title">Unlock vault</h2>
          <p class="vault-modal-desc" data-role="vault-desc">Enter your vault password to view and edit secure notes.</p>
          <label class="note-field">
            <span>Vault password</span>
            <input type="password" data-field="vault-password" autocomplete="current-password" placeholder="Enter password" />
          </label>
          <p class="form-feedback form-feedback--error" data-role="vault-error" hidden></p>
          <div class="vault-modal-actions">
            <button type="button" data-action="confirm-vault" class="btn-primary">Unlock</button>
            <button type="button" data-action="cancel-vault" class="btn-secondary">Cancel</button>
          </div>
        </div>
      </div>
      <div class="live-region" aria-live="polite" data-aria-live></div>
    </div>
  `;
}

function announce(root: HTMLElement, message: string): void {
  const live = root.querySelector("[data-aria-live]");
  if (live) {
    live.textContent = message;
  }
}

function setSidebarMessage(root: HTMLElement, kind: "error" | "success" | "none", text: string): void {
  const el = root.querySelector<HTMLElement>("[data-role='search-feedback']");
  if (!el) {
    return;
  }
  if (kind === "none" || !text) {
    el.hidden = true;
    el.textContent = "";
    el.className = "sidebar-feedback";
    return;
  }
  el.textContent = text;
  el.hidden = false;
  el.className = `sidebar-feedback sidebar-feedback--${kind}`;
}

function setFormMessage(root: HTMLElement, kind: "error" | "success" | "none", text: string): void {
  const err = root.querySelector<HTMLElement>("[data-role='form-error']");
  const ok = root.querySelector<HTMLElement>("[data-role='form-success']");
  if (!err || !ok) {
    return;
  }
  if (kind === "none") {
    err.hidden = true;
    ok.hidden = true;
    err.textContent = "";
    ok.textContent = "";
    return;
  }
  if (kind === "error") {
    err.textContent = text;
    err.hidden = false;
    ok.hidden = true;
    ok.textContent = "";
    return;
  }
  ok.textContent = text;
  ok.hidden = false;
  err.hidden = true;
  err.textContent = "";
}

function setVaultError(root: HTMLElement, message: string): void {
  const err = root.querySelector<HTMLElement>("[data-role='vault-error']");
  if (!err) {
    return;
  }
  if (!message) {
    err.hidden = true;
    err.textContent = "";
    return;
  }
  err.textContent = message;
  err.hidden = false;
}

function focusTitle(root: HTMLElement): void {
  root.querySelector<HTMLInputElement>('[data-field="title"]')?.focus();
}

function clearForm(root: HTMLElement): void {
  const title = root.querySelector<HTMLInputElement>('[data-field="title"]');
  const content = root.querySelector<HTMLTextAreaElement>('[data-field="content"]');
  const secure = root.querySelector<HTMLInputElement>('[data-field="secure"]');
  if (title) {
    title.value = "";
  }
  if (content) {
    content.value = "";
  }
  if (secure) {
    secure.checked = false;
  }
  updateSecureHint(root);
}

function getIsSecure(root: HTMLElement): boolean {
  return root.querySelector<HTMLInputElement>('[data-field="secure"]')?.checked ?? false;
}

function setIsSecure(root: HTMLElement, value: boolean): void {
  const secure = root.querySelector<HTMLInputElement>('[data-field="secure"]');
  if (secure) {
    secure.checked = value;
  }
  updateSecureHint(root);
}

function updateSecureHint(root: HTMLElement): void {
  const hint = root.querySelector<HTMLElement>("[data-role='secure-hint']");
  const secure = getIsSecure(root);
  if (hint) {
    hint.hidden = !secure;
  }
}

function setEditorMode(root: HTMLElement, mode: "empty" | "form"): void {
  const empty = root.querySelector<HTMLElement>("[data-editor-empty]");
  const form = root.querySelector<HTMLElement>("[data-editor-form]");
  if (empty) {
    empty.hidden = mode !== "empty";
  }
  if (form) {
    form.hidden = mode !== "form";
  }
}

function setSelectedNoteId(root: HTMLElement, selectedNoteId: string | null): void {
  root.dataset.selectedNoteId = selectedNoteId ?? "";
  const deleteBtn = root.querySelector<HTMLButtonElement>('[data-action="delete-note"]');
  const saveBtn = root.querySelector<HTMLButtonElement>('[data-action="save-note"]');
  const label = root.querySelector<HTMLElement>("[data-role='editor-label']");
  if (deleteBtn) {
    deleteBtn.hidden = !selectedNoteId;
  }
  if (saveBtn) {
    saveBtn.textContent = selectedNoteId ? "Update note" : "Save note";
  }
  if (label) {
    label.textContent = selectedNoteId ? "Edit note" : "New note";
  }
}

function getSelectedNoteId(root: HTMLElement): string | null {
  const id = root.dataset.selectedNoteId;
  return id ? id : null;
}

function fillForm(root: HTMLElement, note: Note): void {
  const title = root.querySelector<HTMLInputElement>('[data-field="title"]');
  const content = root.querySelector<HTMLTextAreaElement>('[data-field="content"]');
  if (title) {
    title.value = note.title;
  }
  if (content) {
    content.value = note.content === SECURE_CONTENT_MASK ? "" : note.content;
    content.placeholder = note.isSecure && note.content === SECURE_CONTENT_MASK
      ? "Unlock the vault to view this secure note"
      : "Write something…";
    content.readOnly = note.isSecure === true && note.content === SECURE_CONTENT_MASK;
  }
  setIsSecure(root, Boolean(note.isSecure));
}

function updateVaultStatus(root: HTMLElement, shellApi: ShellApi): void {
  const status = root.querySelector<HTMLElement>("[data-role='vault-status']");
  const toggleBtn = root.querySelector<HTMLButtonElement>('[data-action="toggle-vault"]');
  const unlocked = shellApi.isVaultUnlocked();
  const hasVault = shellApi.hasVault();

  if (status) {
    status.textContent = unlocked ? "Vault unlocked" : "Vault locked";
    status.classList.toggle("vault-status--unlocked", unlocked);
  }
  if (toggleBtn) {
    toggleBtn.textContent = unlocked ? "Lock vault" : hasVault ? "Unlock vault" : "Set up vault";
  }
}

function showVaultModal(root: HTMLElement, shellApi: ShellApi): void {
  const overlay = root.querySelector<HTMLElement>("[data-role='vault-overlay']");
  const title = root.querySelector<HTMLElement>("[data-role='vault-title']");
  const desc = root.querySelector<HTMLElement>("[data-role='vault-desc']");
  const password = root.querySelector<HTMLInputElement>('[data-field="vault-password"]');
  const confirmBtn = root.querySelector<HTMLButtonElement>('[data-action="confirm-vault"]');
  const hasVault = shellApi.hasVault();

  if (title) {
    title.textContent = hasVault ? "Unlock vault" : "Set up vault";
  }
  if (desc) {
    desc.textContent = hasVault
      ? "Enter your vault password to view and edit secure notes."
      : "Create a vault password to encrypt secure notes on this device.";
  }
  if (confirmBtn) {
    confirmBtn.textContent = hasVault ? "Unlock" : "Create vault";
  }
  if (password) {
    password.value = "";
  }
  setVaultError(root, "");
  if (overlay) {
    overlay.hidden = false;
  }
  password?.focus();
}

function hideVaultModal(root: HTMLElement): void {
  const overlay = root.querySelector<HTMLElement>("[data-role='vault-overlay']");
  if (overlay) {
    overlay.hidden = true;
  }
}

function updateWorkspace(
  root: HTMLElement,
  notes: Note[],
  selectedNoteId: string | null,
  emptyMessage = "No notes available",
): void {
  const ul = root.querySelector("[data-note-list]");
  const empty = root.querySelector<HTMLElement>("[data-sidebar-empty]");
  const meta = root.querySelector("[data-workspace-meta]");
  if (!ul || !empty || !meta) {
    return;
  }

  if (notes.length === 0) {
    empty.textContent = emptyMessage;
    empty.hidden = false;
    ul.innerHTML = "";
  } else {
    empty.hidden = true;
    ul.innerHTML = notes
      .map((n) => {
        const preview = n.isSecure
          ? "🔒 Secure note"
          : n.content.length > 80
            ? `${escapeHtml(n.content.slice(0, 80))}…`
            : escapeHtml(n.content);
        const when = formatDate(n.updatedAt ?? n.createdAt);
        const selected = n.id === selectedNoteId ? " sidebar-note-item--selected" : "";
        const secureClass = n.isSecure ? " sidebar-note-item--secure" : "";
        return `<li class="sidebar-note-item${selected}${secureClass}" data-note-id="${escapeHtml(n.id)}" role="button" tabindex="0">
          <span class="sidebar-note-title">${n.isSecure ? '<span class="secure-badge" aria-hidden="true">🔒</span>' : ""}${escapeHtml(n.title)}</span>
          <span class="sidebar-note-preview">${preview}</span>
          ${when ? `<span class="sidebar-note-date">${escapeHtml(when)}</span>` : ""}
        </li>`;
      })
      .join("");
  }
  meta.textContent = `${notes.length} note${notes.length === 1 ? "" : "s"}`;
}

function showSuccess(root: HTMLElement, message: string): void {
  setFormMessage(root, "success", message);
  announce(root, message);
  window.setTimeout(() => setFormMessage(root, "none", ""), 2500);
}

function showError(root: HTMLElement, message: string): void {
  setFormMessage(root, "error", message);
  announce(root, message);
}

async function refreshList(root: HTMLElement, shellApi: ShellApi): Promise<Note[]> {
  const notes = await shellApi.listNotes();
  updateWorkspace(root, notes, getSelectedNoteId(root));
  updateVaultStatus(root, shellApi);
  return notes;
}

export function mountShell(root: HTMLElement, _ctx: ShellContext, shellApi: ShellApi): void {
  root.innerHTML = renderShellHtml();
  setSelectedNoteId(root, null);
  setEditorMode(root, "empty");
  updateVaultStatus(root, shellApi);

  root.querySelector<HTMLInputElement>('[data-field="secure"]')?.addEventListener("change", () => {
    updateSecureHint(root);
  });

  function openEditor(): void {
    setEditorMode(root, "form");
  }

  function selectNote(note: Note): void {
    setSelectedNoteId(root, note.id);
    openEditor();
    fillForm(root, note);
    setFormMessage(root, "none", "");
    void refreshList(root, shellApi);
    focusTitle(root);
    announce(root, `Selected: ${note.title}`);
  }

  function startNewNote(): void {
    setSelectedNoteId(root, null);
    openEditor();
    clearForm(root);
    setFormMessage(root, "none", "");
    const content = root.querySelector<HTMLTextAreaElement>('[data-field="content"]');
    if (content) {
      content.readOnly = false;
      content.placeholder = "Write something…";
    }
    void refreshList(root, shellApi);
    focusTitle(root);
    announce(root, "New note");
  }

  root.addEventListener("click", (event) => {
    const el = (event.target as HTMLElement).closest("[data-action]");
    const action = el?.getAttribute("data-action");
    if (action === "focus-new-note") {
      startNewNote();
    }
    if (action === "toggle-vault") {
      if (shellApi.isVaultUnlocked()) {
        shellApi.lockVault();
        updateVaultStatus(root, shellApi);
        void refreshList(root, shellApi);
        const selectedId = getSelectedNoteId(root);
        if (selectedId) {
          void shellApi.listNotes().then((notes) => {
            const note = notes.find((n) => n.id === selectedId);
            if (note) {
              fillForm(root, note);
            }
          });
        }
        showSuccess(root, "Vault locked.");
        announce(root, "Vault locked");
      } else {
        showVaultModal(root, shellApi);
      }
    }
    if (action === "cancel-vault") {
      hideVaultModal(root);
    }
  });

  root.addEventListener("click", async (event) => {
    const noteEl = (event.target as HTMLElement).closest<HTMLElement>("[data-note-id]");
    if (noteEl) {
      const id = noteEl.getAttribute("data-note-id");
      if (!id) {
        return;
      }
      const notes = await shellApi.listNotes();
      const note = notes.find((n) => n.id === id);
      if (note) {
        selectNote(note);
      }
      return;
    }

    const el = (event.target as HTMLElement).closest("[data-action]");
    const action = el?.getAttribute("data-action");
    if (!action) {
      return;
    }

    try {
      if (action === "confirm-vault") {
        const password = root.querySelector<HTMLInputElement>('[data-field="vault-password"]')?.value ?? "";
        const wasNewVault = !shellApi.hasVault();
        const result = await shellApi.unlockVault(password);
        if (!result.ok) {
          setVaultError(root, result.message);
          return;
        }
        hideVaultModal(root);
        updateVaultStatus(root, shellApi);
        await refreshList(root, shellApi);
        const selectedId = getSelectedNoteId(root);
        if (selectedId) {
          const notes = await shellApi.listNotes();
          const note = notes.find((n) => n.id === selectedId);
          if (note) {
            fillForm(root, note);
          }
        }
        showSuccess(root, wasNewVault ? "Vault created." : "Vault unlocked.");
        return;
      }

      if (action === "refresh-notes") {
        setFormMessage(root, "none", "");
        await refreshList(root, shellApi);
        showSuccess(root, "Notes refreshed.");
        return;
      }

      if (action === "clear-search") {
        const search = root.querySelector<HTMLInputElement>('[data-field="search"]');
        if (search) {
          search.value = "";
        }
        setSidebarMessage(root, "none", "");
        await refreshList(root, shellApi);
        announce(root, "Search cleared");
        return;
      }

      if (action === "search-notes") {
        const query = root.querySelector<HTMLInputElement>('[data-field="search"]')?.value ?? "";
        setSidebarMessage(root, "none", "");
        const result = await shellApi.findNotes(query);
        if (!result.ok) {
          setSidebarMessage(root, "error", result.message);
          announce(root, result.message);
          if (result.message === "No note found.") {
            updateWorkspace(root, [], getSelectedNoteId(root), "No matching notes");
          }
          return;
        }
        updateWorkspace(root, result.notes, getSelectedNoteId(root));
        const count = result.notes.length;
        setSidebarMessage(root, "success", `Found ${count} note${count === 1 ? "" : "s"}.`);
        announce(root, `Found ${count} note${count === 1 ? "" : "s"}.`);
        window.setTimeout(() => setSidebarMessage(root, "none", ""), 2500);
        return;
      }

      if (action === "delete-note") {
        const selectedId = getSelectedNoteId(root);
        if (!selectedId) {
          return;
        }
        setFormMessage(root, "none", "");
        const result = await shellApi.deleteNote(selectedId);
        if (!result.ok) {
          showError(root, result.message);
          return;
        }
        setSelectedNoteId(root, null);
        setEditorMode(root, "empty");
        clearForm(root);
        await refreshList(root, shellApi);
        showSuccess(root, "Note deleted.");
        return;
      }

      if (action !== "save-note") {
        return;
      }

      const title = root.querySelector<HTMLInputElement>('[data-field="title"]')?.value ?? "";
      const content = root.querySelector<HTMLTextAreaElement>('[data-field="content"]')?.value ?? "";
      const isSecure = getIsSecure(root);
      const selectedId = getSelectedNoteId(root);

      setFormMessage(root, "none", "");

      if (selectedId) {
        const result = await shellApi.updateNote(selectedId, title, content, isSecure);
        if (!result.ok) {
          showError(root, result.message);
          return;
        }
        selectNote(result.note);
        showSuccess(root, "Note updated.");
        return;
      }

      const result = await shellApi.createNote(title, content, isSecure);
      if (!result.ok) {
        showError(root, result.message);
        return;
      }

      selectNote(result.note);
      showSuccess(root, "Note saved.");
    } catch {
      showError(root, "Something went wrong. Please try again.");
    }
  });

  root.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") {
      return;
    }
    const searchInput = (event.target as HTMLElement).closest<HTMLInputElement>('[data-field="search"]');
    if (searchInput) {
      event.preventDefault();
      root.querySelector<HTMLButtonElement>('[data-action="search-notes"]')?.click();
      return;
    }
    const noteEl = (event.target as HTMLElement).closest<HTMLElement>("[data-note-id]");
    if (noteEl) {
      event.preventDefault();
      noteEl.click();
    }
  });

  const api = typeof window !== "undefined" ? window.electronAPI : undefined;
  const unsubscribe = api?.onAppMenu?.((payload: AppMenuPayload) => {
    if (payload.action === "view" && payload.target === "workspace") {
      startNewNote();
      announce(root, "Notes");
    }
  });

  void (async () => {
    try {
      await refreshList(root, shellApi);
    } catch {
      showError(root, "Could not load notes.");
    }
  })();

  window.addEventListener(
    "beforeunload",
    () => {
      unsubscribe?.();
    },
    { once: true },
  );
}
