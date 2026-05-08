(function () {
  const button = document.querySelector("[data-search-trigger]");
  const dialog = document.querySelector("[data-search-dialog]");
  const closeBtn = document.querySelector("[data-search-close]");
  const mount = document.getElementById("pagefind-search");
  if (!button || !dialog || !mount) return;

  let initialized = false;
  let available = null;

  async function checkAvailable() {
    if (available !== null) return available;
    try {
      const r = await fetch("/pagefind/pagefind-ui.js", { method: "HEAD" });
      available = r.ok;
    } catch {
      available = false;
    }
    if (!available) {
      // No Pagefind index at this build — disable the trigger entirely.
      button.setAttribute("hidden", "");
    }
    return available;
  }

  function escapeHTML(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  async function ensureUI() {
    if (initialized) return;
    initialized = true;
    try {
      const mod = await import("/pagefind/pagefind-ui.js");
      if (!mod.PagefindUI) {
        throw new Error(
          "/pagefind/pagefind-ui.js loaded but did not export PagefindUI",
        );
      }
      new mod.PagefindUI({
        element: "#pagefind-search",
        showSubResults: true,
        showImages: false,
        resetStyles: false,
      });
    } catch (err) {
      console.error("[search] Pagefind UI failed to load:", err);
      mount.innerHTML =
        '<div class="space-y-3 px-2 py-6">' +
        '<p class="text-center text-sm font-medium text-ink-700 dark:text-ink-200">Search is unavailable in this build.</p>' +
        '<p class="text-center text-xs text-ink-500 dark:text-ink-400">Run <code class="rounded bg-ink-100 px-1.5 py-0.5 font-mono dark:bg-ink-800">npm run build</code> to generate the Pagefind index, then <code class="rounded bg-ink-100 px-1.5 py-0.5 font-mono dark:bg-ink-800">npx serve public</code>.</p>' +
        '<details class="mt-2 text-xs text-ink-500 dark:text-ink-400"><summary class="cursor-pointer">Diagnostic detail</summary>' +
        '<pre class="mt-2 whitespace-pre-wrap rounded bg-ink-50 p-2 font-mono text-[11px] dark:bg-ink-800">' +
        escapeHTML((err && err.message) || String(err)) +
        "</pre></details>" +
        "</div>";
    }
  }

  function open() {
    dialog.removeAttribute("hidden");
    document.body.style.overflow = "hidden";
    ensureUI().then(() => {
      const input = dialog.querySelector("input");
      if (input) input.focus();
    });
  }

  function close() {
    dialog.setAttribute("hidden", "");
    document.body.style.overflow = "";
  }

  // Probe for the Pagefind bundle once at startup. If absent, hide the trigger.
  checkAvailable();

  button.addEventListener("click", () => {
    open();
  });

  if (closeBtn) closeBtn.addEventListener("click", close);

  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) close();
  });

  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      // Only intercept ⌘K when search is available; otherwise let the browser handle it.
      if (available === false) return;
      e.preventDefault();
      open();
    } else if (e.key === "Escape" && !dialog.hasAttribute("hidden")) {
      close();
    }
  });
})();
