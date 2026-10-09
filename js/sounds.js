(function () {
  "use strict";
  const STORAGE_KEY = "devquest-sound-muted";
  const AudioEngine = window.AudioContext || window.webkitAudioContext;
  let muted = false;
  let context, master, generation = 0;
  const sources = new Set();
  try { muted = window.localStorage.getItem(STORAGE_KEY) === "true"; } catch { /* preferência só nesta sessão */ }

  function stop() {
    generation++;
    sources.forEach((source) => { try { source.stop(); } catch { /* já terminou */ } });
    sources.clear();
  }

  function updateControls() {
    document.querySelectorAll("[data-sound-toggle]").forEach((button) => {
      button.textContent = !AudioEngine ? "Som indisponível" : muted ? "♪ Som desligado" : "♪ Som ligado";
      button.setAttribute("aria-pressed", String(!muted && !!AudioEngine));
      button.setAttribute("aria-label", !AudioEngine ? "Efeitos sonoros indisponíveis neste navegador" : muted ? "Ativar efeitos sonoros" : "Silenciar efeitos sonoros");
      button.disabled = !AudioEngine;
    });
  }

  function setMuted(value, persist = true) {
    muted = !!value;
    if (muted) stop();
    if (persist) { try { window.localStorage.setItem(STORAGE_KEY, String(muted)); } catch { /* sem armazenamento */ } }
    updateControls();
  }

  function track(source, nodes, start, duration) {
    sources.add(source);
    source.onended = () => {
      sources.delete(source);
      source.disconnect();
      nodes.forEach((node) => node.disconnect());
    };
    source.start(start);
    source.stop(start + duration);
  }

  function noise(start, duration, frequency, level) {
    const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const source = context.createBufferSource();
    source.buffer = buffer;
    const filter = context.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(frequency, start);
    filter.frequency.exponentialRampToValueAtTime(frequency * .45, start + duration);
    filter.Q.value = .6;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(level, start + duration * .17);
    gain.gain.exponentialRampToValueAtTime(.001, start + duration);
    source.connect(filter).connect(gain).connect(master);
    track(source, [filter, gain], start, duration);
  }

  function bubble(start, frequency, duration) {
    const source = context.createOscillator();
    source.type = "sine";
    source.frequency.setValueAtTime(frequency, start);
    source.frequency.exponentialRampToValueAtTime(frequency * .36, start + duration);
    const gain = context.createGain();
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(.16, start + .008);
    gain.gain.exponentialRampToValueAtTime(.001, start + duration);
    source.connect(gain).connect(master);
    track(source, [gain], start, duration);
  }

  async function play(correct) {
    if (muted || !AudioEngine || document.documentElement.dataset.theme !== "vampire") return;
    stop();
    const request = generation;
    try {
      // Criado somente em resposta a um gesto do usuário; nunca há autoplay.
      if (!context) {
        context = new AudioEngine();
        master = context.createGain();
        master.gain.value = .22;
        master.connect(context.destination);
      }
      if (context.state === "suspended") await context.resume();
      if (muted || generation !== request || document.documentElement.dataset.theme !== "vampire") return;
      const now = context.currentTime + .01;
      if (correct) {
        // Quatro batidas de asas, cada vez mais distantes.
        [0, .16, .32, .5].forEach((delay, i) => noise(now + delay, .18, 1250 - i * 150, .7 - i * .12));
      } else {
        // Jorro suave e bolhas descendentes: líquido derramando, sem susto alto.
        noise(now, .85, 720, .32);
        [0, .08, .19, .31, .44, .61, .75].forEach((delay, i) => bubble(now + delay, 470 + (i % 3) * 110, .16));
      }
    } catch { /* Falha de áudio jamais interrompe o quiz. */ }
  }

  function initialize() {
    document.querySelectorAll("[data-theme-slot]").forEach((slot) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "sound-toggle";
      button.setAttribute("data-sound-toggle", "");
      button.addEventListener("click", () => setMuted(!muted));
      slot.appendChild(button);
    });
    updateControls();
  }

  window.addEventListener("devquest:answer", (event) => {
    if (typeof event.detail?.correct === "boolean") void play(event.detail.correct);
  });
  window.addEventListener("devquest:themechange", stop);
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY || event.key === null) setMuted(event.newValue === "true", false);
  });
  document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
  else initialize();
})();
