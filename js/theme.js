(function () {
  "use strict";

  const STORAGE_KEY = "devquest-theme";
  const DEFAULT_THEME = "dark";
  const themes = {
    dark: {
      label: "Noite",
      description: "Tema preto atual"
    },
    classic: {
      label: "Clássico",
      description: "Branco, azul e verde"
    }
  };

  function normalizeTheme(theme) {
    return Object.hasOwn(themes, theme) ? theme : DEFAULT_THEME;
  }

  function readSavedTheme() {
    try {
      return normalizeTheme(window.localStorage.getItem(STORAGE_KEY));
    } catch {
      return DEFAULT_THEME;
    }
  }

  function updatePickers(theme) {
    document.querySelectorAll("[data-theme-trigger]").forEach((trigger) => {
      trigger.setAttribute("aria-label", `Escolher tema. Atual: ${themes[theme].label}`);
      const label = trigger.querySelector("[data-theme-current]");
      if (label) label.textContent = themes[theme].label;
    });

    document.querySelectorAll("[data-theme-option]").forEach((option) => {
      const isActive = option.dataset.themeOption === theme;
      option.classList.toggle("is-active", isActive);
      option.setAttribute("aria-checked", String(isActive));
    });
  }

  function applyTheme(theme, persist = true) {
    const selectedTheme = normalizeTheme(theme);

    document.documentElement.dataset.theme = selectedTheme;
    document.documentElement.style.colorScheme = selectedTheme === "classic" ? "light" : "dark";

    if (persist) {
      try {
        window.localStorage.setItem(STORAGE_KEY, selectedTheme);
      } catch {
        // O tema continua funcionando durante a sessão se o armazenamento estiver bloqueado.
      }
    }

    updatePickers(selectedTheme);
    window.dispatchEvent(new CustomEvent("devquest:themechange", { detail: { theme: selectedTheme } }));
  }

  function pickerMarkup(menuId) {
    return `
      <div class="theme-picker">
        <button
          type="button"
          class="theme-trigger"
          data-theme-trigger
          aria-haspopup="menu"
          aria-expanded="false"
          aria-controls="${menuId}"
        >
          <svg class="theme-trigger-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3a9 9 0 1 0 0 18h1.5a1.5 1.5 0 0 0 0-3H12a1.5 1.5 0 0 1 0-3h2a7 7 0 0 0 7-7c0-2.76-4.03-5-9-5Z"></path>
            <circle cx="7.5" cy="10.5" r="1"></circle>
            <circle cx="10" cy="7" r="1"></circle>
            <circle cx="14" cy="7" r="1"></circle>
          </svg>
          <span class="theme-trigger-copy">
            <small>Tema</small>
            <strong data-theme-current>Noite</strong>
          </span>
          <svg class="theme-trigger-chevron" viewBox="0 0 24 24" aria-hidden="true">
            <path d="m6 9 6 6 6-6"></path>
          </svg>
        </button>

        <div id="${menuId}" class="theme-menu" data-theme-menu role="menu" hidden>
          <div class="theme-menu-heading">
            <strong>Aparência</strong>
            <span>A escolha fica salva neste navegador</span>
          </div>

          ${Object.entries(themes)
            .map(
              ([themeId, theme]) => `
                <button
                  type="button"
                  class="theme-option"
                  data-theme-option="${themeId}"
                  role="menuitemradio"
                  aria-checked="false"
                >
                  <span class="theme-preview theme-preview--${themeId}" aria-hidden="true">
                    <span></span><span></span><span></span>
                  </span>
                  <span class="theme-option-copy">
                    <strong>${theme.label}</strong>
                    <small>${theme.description}</small>
                  </span>
                  <span class="theme-option-check" aria-hidden="true">✓</span>
                </button>
              `
            )
            .join("")}
        </div>
      </div>
    `;
  }

  function initializePicker(slot, index) {
    const menuId = `theme-menu-${index + 1}`;
    slot.innerHTML = pickerMarkup(menuId);

    const picker = slot.querySelector(".theme-picker");
    const trigger = picker.querySelector("[data-theme-trigger]");
    const menu = picker.querySelector("[data-theme-menu]");

    function closeMenu(restoreFocus = false) {
      menu.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
      if (restoreFocus) trigger.focus();
    }

    trigger.addEventListener("click", () => {
      const willOpen = menu.hidden;
      menu.hidden = !willOpen;
      trigger.setAttribute("aria-expanded", String(willOpen));
      if (willOpen) menu.querySelector(".theme-option.is-active")?.focus();
    });

    menu.addEventListener("click", (event) => {
      const option = event.target.closest("[data-theme-option]");
      if (!option) return;
      applyTheme(option.dataset.themeOption);
      closeMenu(true);
    });

    picker.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !menu.hidden) {
        event.preventDefault();
        closeMenu(true);
      }
    });

    document.addEventListener("click", (event) => {
      if (!picker.contains(event.target)) closeMenu();
    });
  }

  function initializeThemeControls() {
    document.querySelectorAll("[data-theme-slot]").forEach(initializePicker);
    updatePickers(document.documentElement.dataset.theme || DEFAULT_THEME);
  }

  const initialTheme = readSavedTheme();
  applyTheme(initialTheme, false);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeThemeControls, { once: true });
  } else {
    initializeThemeControls();
  }

  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) applyTheme(event.newValue, false);
  });

  window.DevQuestTheme = Object.freeze({
    get: () => document.documentElement.dataset.theme || DEFAULT_THEME,
    set: applyTheme
  });
})();
