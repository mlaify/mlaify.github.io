(function () {
  const trigger = document.querySelector("[data-mobile-nav-trigger]");
  const panel = document.querySelector("[data-mobile-nav-panel]");
  if (!trigger || !panel) return;

  function setOpen(open) {
    trigger.setAttribute("aria-expanded", String(open));
    if (open) {
      panel.removeAttribute("hidden");
    } else {
      panel.setAttribute("hidden", "");
    }
  }

  trigger.addEventListener("click", () => {
    const open = trigger.getAttribute("aria-expanded") !== "true";
    setOpen(open);
  });

  panel.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => setOpen(false));
  });
})();
