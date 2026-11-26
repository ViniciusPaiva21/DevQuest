(function () {
  "use strict";

  const STORAGE_KEY = "devquest-theme";
  const DEFAULT_THEME = "christmas";
  const SETTINGS_KEY = "devquest-night-settings";
  const defaults = Object.freeze({ effect: true, interactive: true, paw: true, opacity: 16 });
  function readSettings() {
    try {
      const saved = JSON.parse(window.localStorage.getItem(SETTINGS_KEY) || "{}");
      return normalizeSettings(saved);
    } catch { return {...defaults}; }
  }
  function normalizeSettings(saved) {
    const s = saved && typeof saved === "object" ? saved : {};
    return { effect: typeof s.effect === "boolean" ? s.effect : defaults.effect,
      interactive: typeof s.interactive === "boolean" ? s.interactive : defaults.interactive,
      paw: typeof s.paw === "boolean" ? s.paw : defaults.paw,
      opacity: typeof s.opacity === "number" && Number.isFinite(s.opacity) ? Math.max(0, Math.min(45, Math.round(s.opacity))) : defaults.opacity };
  }
  let settings = readSettings();
  function updateSettingsControls() {
    const dark = document.documentElement.dataset.theme === "dark";
    document.querySelectorAll("[data-night-settings]").forEach(el => { el.hidden = !dark; });
    document.querySelectorAll("[data-night-setting]").forEach(el => {
      const key = el.dataset.nightSetting;
      if (key === "opacity") el.value = settings.opacity;
      else el.checked = settings[key];
      if (key === "opacity" || key === "interactive") el.disabled = !settings.effect;
    });
    document.querySelectorAll("[data-night-opacity]").forEach(el => { el.textContent = settings.opacity + "%"; });
  }
  function applySettings(next, persist = true) {
    settings = normalizeSettings(next);
    document.documentElement.dataset.dqPawEnabled = String(settings.paw);
    if (persist) {
      try { window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch {}
    }
    updateSettingsControls();
    window.dispatchEvent(new CustomEvent("devquest:settingschange", { detail: {...settings} }));
  }
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
      trigger.setAttribute("aria-label", `Configurações. Tema atual: ${themes[theme].label}`);
      const label = trigger.querySelector("[data-theme-current]");
      if (label) label.textContent = themes[theme].label;
    });

    document.querySelectorAll("[data-theme-option]").forEach((option) => {
      const isActive = option.dataset.themeOption === theme;
      option.classList.toggle("is-active", isActive);
      option.setAttribute("aria-pressed", String(isActive));
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
    updateSettingsControls();
    window.dispatchEvent(new CustomEvent("devquest:themechange", { detail: { theme: selectedTheme } }));
  }

  function pickerMarkup(menuId) {
    return `
      <div class="theme-picker">
        <button
          type="button"
          class="theme-trigger"
          data-theme-trigger
          title="Configurações"
          aria-expanded="false"
          aria-controls="${menuId}"
        >
          <svg class="theme-trigger-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2.8h2l.7 2.5 1.5.9 2.5-.7 2 3.4-1.8 1.8v1.8l1.8 1.8-2 3.4-2.5-.7-1.5.9-.7 2.5h-4l-.7-2.5-1.5-.9-2.5.7-2-3.4 1.8-1.8v-1.8L3.3 8.9l2-3.4 2.5.7 1.5-.9.7-2.5h2Z"></path>
            <circle cx="12" cy="11.6" r="3"></circle>
          </svg>
          <span class="theme-trigger-copy">
            <small>Configurações</small>
            <strong data-theme-current>${themes[DEFAULT_THEME].label}</strong>
          </span>
          <svg class="theme-trigger-chevron" viewBox="0 0 24 24" aria-hidden="true">
            <path d="m6 9 6 6 6-6"></path>
          </svg>
        </button>

        <div id="${menuId}" class="theme-menu" data-theme-menu role="region" aria-label="Configurações de aparência" hidden>
          <div class="theme-menu-heading">
            <strong>Configurações</strong>
            <span>Temas e preferências salvos neste navegador</span>
          </div>

          ${Object.entries(themes)
            .map(
              ([themeId, theme]) => `
                <button
                  type="button"
                  class="theme-option"
                  data-theme-option="${themeId}"
                  aria-pressed="false"
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
          <section class="dq-night-settings" data-night-settings hidden aria-label="Efeitos do tema Noite">
            <div class="dq-settings-heading"><strong>Tema Noite</strong><span>Letter Glitch</span></div>
            <label class="dq-settings-range">
              <span>Intensidade do fundo <output data-night-opacity>16%</output></span>
              <input type="range" min="0" max="45" step="1" data-night-setting="opacity" aria-label="Intensidade do fundo">
            </label>
            <label class="dq-settings-toggle"><span>Fundo de letras</span><input type="checkbox" data-night-setting="effect"></label>
            <label class="dq-settings-toggle"><span>Interação com o mouse</span><input type="checkbox" data-night-setting="interactive"></label>
            <label class="dq-settings-toggle"><span>Cursor de patinha</span><input type="checkbox" data-night-setting="paw"></label>
            <button type="button" class="dq-settings-reset" data-night-reset>Restaurar configurações padrão</button>
          </section>
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
      // Keep the panel open so the newly selected theme's options are accessible.
    });

    menu.addEventListener("input", event => {
      const input = event.target.closest("[data-night-setting]");
      if (!input) return;
      const key = input.dataset.nightSetting;
      if (!Object.hasOwn(defaults, key)) return;
      applySettings({...settings, [key]: key === "opacity" ? Number(input.value) : input.checked});
    });
    menu.addEventListener("click", event => {
      if (event.target.closest("[data-night-reset]")) applySettings(defaults);
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
    updateSettingsControls();
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
    initializeLetterGlitch();
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


  // Mouse cursor states exclusive to Noite. Native cursor, no overlay or lag.
  function initializeNightCursor() {
    if (!window.matchMedia || !document.head || !document.createElement) return;
    const root = document.documentElement;
    const mouse = window.matchMedia("(any-hover: hover) and (any-pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const scriptUrl = document.currentScript?.src;
    let releaseTimer = null;
    let down = false;
    const enabled = () => root.dataset.theme === "dark" && settings.paw && mouse.matches;
    function reset() {
      if (releaseTimer !== null) window.clearTimeout(releaseTimer);
      releaseTimer = null;
      down = false;
      delete root.dataset.dqPaw;
    }
    function preload() {
      if (!enabled() || !scriptUrl || !window.Image) return;
      for (const name of ["normal", "hover", "click"]) {
        const img = new window.Image();
        img.src = new URL("../assets/cursors/night-" + name + ".png", scriptUrl).href;
      }
    }
    function onDown(event) {
      if (!enabled() || event.pointerType !== "mouse" || event.button !== 0) return;
      if (event.target?.closest?.('textarea,[contenteditable]:not([contenteditable="false"]),input:not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="checkbox"]):not([type="radio"]),:disabled,[aria-disabled="true"]')) return;
      reset();
      down = true;
      root.dataset.dqPaw = "pressed";
    }
    function onUp(event) {
      if (event.pointerType !== "mouse" || event.button !== 0 || !down) return;
      down = false;
      if (!enabled()) { reset(); return; }
      const finish = () => {
        releaseTimer = null;
        root.dataset.dqPaw = "rest";
      };
      if (reduced.matches) finish();
      else releaseTimer = window.setTimeout(finish, 130);
    }
    function onMove(event) {
      if (event.pointerType === "mouse" && root.dataset.dqPaw === "rest") delete root.dataset.dqPaw;
    }
    document.addEventListener("pointerdown", onDown, true);
    window.addEventListener("pointerup", onUp, true);
    document.addEventListener("pointermove", onMove, true);
    document.addEventListener("pointercancel", reset, true);
    window.addEventListener("blur", reset);
    window.addEventListener("pagehide", reset);
    window.addEventListener("devquest:themechange", () => { reset(); preload(); });
    window.addEventListener("devquest:settingschange", () => { reset(); if (settings.paw) preload(); });
    if (mouse.addEventListener) mouse.addEventListener("change", () => { reset(); preload(); });
    preload();
  }


  // Letter Glitch: native two-layer canvas, adapted from the approved local preview.
  function initializeLetterGlitch() {
    if (!window.matchMedia || !window.requestAnimationFrame || document.getElementById("dq-letter-glitch")) return;
    const layer = document.createElement("div");
    layer.id = "dq-letter-glitch";
    layer.className = "dq-letter-glitch";
    layer.setAttribute("aria-hidden", "true");
    const canvas = document.createElement("canvas"), overlay = document.createElement("canvas");
    const ctx = canvas.getContext("2d"), fx = overlay.getContext("2d");
    if (!ctx || !fx) return;
    layer.append(canvas, overlay);
    document.body.prepend(layer);
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#  const initialTheme = readSavedTheme();*()-_+=/[]{};:<>0123456789";
    const colors = ["#6837a3", "#7535cc", "#8500ff"];
    const sx = 10, sy = 22, radius = 140;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width=0,height=0,cols=0,rows=0,grid=[],raf=0,last=0,lastFrame=0,pulses=[];
    let mouse={x:0,y:0,active:false}, overlayDirty=false;
    const active = () => document.documentElement.dataset.theme === "dark" && settings.effect && settings.opacity > 0;
    const animate = () => active() && !motion.matches && !document.hidden;
    const randomCell = () => ({char:chars[Math.floor(Math.random()*chars.length)],color:Math.random()<.75?0:1+Math.floor(Math.random()*2),a:Math.random()<.1?0:.45+Math.random()*.55});
    function drawCell(i) {
      const x=i%cols*sx,y=Math.floor(i/cols)*sy,c=grid[i];
      ctx.clearRect(x,y,sx,sy);ctx.globalAlpha=c.a;ctx.fillStyle=colors[c.color];
      ctx.fillText(c.char,x+sx/2,y+sy/2);ctx.globalAlpha=1;
    }
    function resize() {
      if (!active()) return;
      width=window.innerWidth;height=window.innerHeight;
      if (!width || !height) return;
      const dpr=Math.min(window.devicePixelRatio||1,1.5);
      cols=Math.ceil(width/sx);rows=Math.ceil(height/sy);
      for(const [c,context] of [[canvas,ctx],[overlay,fx]]) {
        c.width=Math.round(width*dpr);c.height=Math.round(height*dpr);
        context.setTransform(dpr,0,0,dpr,0,0);
        context.font="14px ui-monospace,Consolas,monospace";context.textBaseline="middle";context.textAlign="center";
      }
      grid=Array.from({length:cols*rows},randomCell);grid.forEach((_,i)=>drawCell(i));
      overlayDirty=false;
    }
    function clearOverlay() { if(overlayDirty){fx.clearRect(0,0,width,height);overlayDirty=false;} }
    function cellsNear(x,y,r,draw) {
      const a=Math.max(0,Math.floor((x-r)/sx)),b=Math.min(cols-1,Math.ceil((x+r)/sx));
      const c=Math.max(0,Math.floor((y-r)/sy)),d=Math.min(rows-1,Math.ceil((y+r)/sy));
      for(let row=c;row<=d;row++)for(let col=a;col<=b;col++){
        const px=col*sx+sx/2,py=row*sy+sy/2,dx=px-x,dy=py-y;
        draw(grid[row*cols+col],px,py,dx,dy,Math.hypot(dx,dy));
      }
    }
    function render(t) {
      raf=0;if(!animate())return;raf=window.requestAnimationFrame(render);
      if(t-lastFrame<1000/30)return;lastFrame=t;
      if(!grid.length)return;
      if(t-last>115){last=t;const n=Math.ceil(grid.length*.026);for(let j=0;j<n;j++){const i=Math.floor(Math.random()*grid.length);grid[i]=randomCell();drawCell(i);}}
      clearOverlay();if(!settings.interactive)return;
      pulses=pulses.filter(p=>t-p.start<950);
      if(mouse.active){overlayDirty=true;cellsNear(mouse.x,mouse.y,radius,(cell,px,py,dx,dy,dist)=>{
        const fall=Math.max(0,1-dist/radius);if(!fall)return;
        fx.fillStyle=colors[cell.color===0?1:2];fx.globalAlpha=fall*fall*.48;
        fx.fillText(cell.char,px+Math.sin(py*.11+t*.004)*fall*5,py);
      });}
      for(const p of pulses){overlayDirty=true;const age=Math.max(0,(t-p.start)/950),r=age*240;
        cellsNear(p.x,p.y,r+26,(cell,px,py,dx,dy,dist)=>{
          const band=Math.max(0,1-Math.abs(dist-r)/26);if(!band)return;
          fx.globalAlpha=band*(1-age)*.72;fx.fillStyle="#a56aff";
          fx.fillText(cell.char,px+dx/(dist||1)*band*10,py+dy/(dist||1)*band*6);
        });
      }fx.globalAlpha=1;
    }
    function sync() {
      layer.hidden=!active();
      canvas.style.opacity=String(settings.opacity/100);
      overlay.style.opacity=String(Math.min(1,settings.opacity/100*1.5));
      if(!settings.interactive || !animate()){pulses=[];mouse.active=false;clearOverlay();}
      if(!active()){if(raf)window.cancelAnimationFrame(raf);raf=0;return;}
      if(width!==window.innerWidth||height!==window.innerHeight||!grid.length)resize();
      if(!animate()){if(raf)window.cancelAnimationFrame(raf);raf=0;}
      else if(!raf)raf=window.requestAnimationFrame(render);
    }
    window.addEventListener("resize",resize);
    window.addEventListener("devquest:themechange",sync);
    window.addEventListener("devquest:settingschange",sync);
    document.addEventListener("visibilitychange",sync);
    if(motion.addEventListener)motion.addEventListener("change",sync);
    else if(motion.addListener)motion.addListener(sync);
    window.addEventListener("pointermove",e=>{if(animate()&&settings.interactive&&e.pointerType==="mouse"){mouse={x:e.clientX,y:e.clientY,active:true};}},{passive:true});
    document.addEventListener("pointerleave",()=>{mouse.active=false;});
    window.addEventListener("blur",()=>{mouse.active=false;pulses=[];});
    window.addEventListener("pointerdown",e=>{if(e.button===0&&e.pointerType==="mouse"&&animate()&&settings.interactive){pulses.push({x:e.clientX,y:e.clientY,start:performance.now()});if(pulses.length>5)pulses.shift();}},{passive:true});
    sync();
  }

  const initialTheme = readSavedTheme();
  applyTheme(initialTheme, false);
  applySettings(settings, false);
  initializeFavicon();
  initializeNightCursor();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeThemeControls, { once: true });
  } else {
    initializeThemeControls();
  }

  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) applyTheme(event.newValue, false);
    if (event.key === SETTINGS_KEY || event.key === null) applySettings(readSettings(), false);
  });

  window.DevQuestTheme = Object.freeze({
    get: () => document.documentElement.dataset.theme || DEFAULT_THEME,
    set: applyTheme
  });
})();
