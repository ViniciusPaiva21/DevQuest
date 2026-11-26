(function () {
  "use strict";

  const STORAGE_KEY = "devquest-theme";
  const DEFAULT_THEME = "christmas";
  const themes = {
    dark: {
      label: "Noite",
      description: "Tema preto atual"
    },
    pixel: {
      label: "Retrô",
      description: "Pixel art, luar e aventura"
    },
    christmas: {
      label: "Natal",
      description: "Verde pinheiro, dourado e estrelas"
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
            <strong data-theme-current>${themes[DEFAULT_THEME].label}</strong>
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
    const atmosphere = document.createElement("div");
    atmosphere.className = "christmas-atmosphere";
    atmosphere.setAttribute("aria-hidden", "true");
    // Posições distribuídas de forma estável; animações CSS não criam timers.
    for (let index = 0; index < 34; index++) {
      const sparkle = document.createElement("span");
      sparkle.className = "christmas-sparkle";
      sparkle.style.cssText = `--x:${(index * 37 + 3) % 100}%;--y:${(index * 23 + 7) % 100}%;--delay:-${index * .7}s;--duration:${7 + index % 6}s;--size:${2 + index % 3}px`;
      atmosphere.appendChild(sparkle);
    }
    const star = document.createElement("span");
    star.className = "christmas-shooting-star";
    atmosphere.appendChild(star);
    document.body.appendChild(atmosphere);
  }


  // One lightweight, theme-aware favicon shared by every application page.
  function initializeFavicon() {
    if (!document.head || !document.createElement || !window.matchMedia) return;
    if (document.getElementById("devquest-favicon")) return;

    const palette = {
      dark:      { bg: "#18181f", border: "#45405a", ink: "#c4a5ff" },
      classic:   { bg: "#e9f2ff", border: "#b8c9e4", ink: "#2459a8" },
      christmas: { bg: "#102d25", border: "#53634c", ink: "#f6cf79" },
      pixel:     { bg: "#211936", border: "#604c87", ink: "#dfbaff" }
    };
    const shapes = ["M 11 10 L 4.5 16 L 11 22", "M 19 7 L 13 25", "M 21 10 L 27.5 16 L 21 22"];
    const icon = document.createElement("link");
    icon.id = "devquest-favicon";
    icon.rel = "icon";
    icon.type = "image/svg+xml";
    icon.setAttribute("sizes", "any");
    document.head.appendChild(icon);

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const ease = x => { const t = Math.max(0, Math.min(1, x)); return t * t * (3 - 2 * t); };
    // Full symbol remains visible for most of the cycle. No abrupt flashes.
    // Fade down in sequence, then gently draw the three symbols back in.
    const frames = [];
    let timer = null;
    let index = 0;
    function createFrame(theme, levels) {
      const color = palette[theme] || palette.dark;
      const lines = shapes.map((d, i) =>
        '<path d="' + d + '" opacity="' + levels[i].toFixed(3) + '"/>'
      ).join("");
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">' +
        '<rect x="1" y="1" width="30" height="30" rx="7" fill="' + color.bg + '" stroke="' + color.border + '"/>' +
        '<g fill="none" stroke="' + color.ink + '" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">' + lines + '</g></svg>';
      return "data:image/svg+xml," + encodeURIComponent(svg);
    }
    function stop() {
      if (timer !== null) window.clearTimeout(timer);
      timer = null;
    }
    function rebuild() {
      stop();
      const theme = document.documentElement.dataset.theme;
      const full = createFrame(theme, [1, 1, 1]);
      icon.href = full;
      frames.length = 0;
      index = 0;
      if (motion.matches || document.hidden) return;
      const steps = 18;
      for (let j = 0; j <= steps; j++) {
        const t = j / steps;
        frames.push(createFrame(theme, shapes.map((_, i) => 1 - .78 * ease((t - i * .13) / .65))));
      }
      for (let j = 1; j <= steps; j++) {
        const t = j / steps;
        frames.push(createFrame(theme, shapes.map((_, i) => .22 + .78 * ease((t - i * .13) / .65))));
      }
      function advance() {
        if (motion.matches || document.hidden) { stop(); icon.href = full; return; }
        icon.href = frames[index++];
        if (index === frames.length) {
          index = 0;
          timer = window.setTimeout(advance, 3200);
        } else {
          timer = window.setTimeout(advance, 115);
        }
      }
      timer = window.setTimeout(advance, 3200);
    }
    window.addEventListener("devquest:themechange", rebuild);
    document.addEventListener("visibilitychange", rebuild);
    if (motion.addEventListener) motion.addEventListener("change", rebuild);
    else if (motion.addListener) motion.addListener(rebuild);
    rebuild();
  }

  const initialTheme = readSavedTheme();
  applyTheme(initialTheme, false);
  initializeFavicon();

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
