import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(projectRoot, "js/theme.js"), "utf8");
const storage = new Map([["devquest-theme", "classic"]]);
const documentElement = { dataset: {}, style: {} };
const preferenceEvents = [];

class MockCustomEvent {
  constructor(type, options) {
    this.type = type;
    this.detail = options?.detail;
  }
}

const context = {
  CustomEvent: MockCustomEvent,
  document: {
    documentElement,
    readyState: "loading",
    querySelectorAll: () => [],
    addEventListener: () => {}
  },
  window: {
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value)
    },
    addEventListener: () => {},
    dispatchEvent: (event) => preferenceEvents.push(event)
  }
};

vm.runInNewContext(source, context);

assert.equal(documentElement.dataset.theme, "classic", "deve restaurar o tema salvo");
assert.equal(documentElement.style.colorScheme, "light", "o tema clássico deve usar controles claros");
assert.equal(context.window.DevQuestTheme.get(), "classic");

context.window.DevQuestTheme.set("dark");
assert.equal(documentElement.dataset.theme, "dark", "deve trocar para o tema noite");
assert.equal(storage.get("devquest-theme"), "dark", "deve persistir a escolha");

context.window.DevQuestTheme.set("pixel");
assert.equal(documentElement.dataset.theme, "pixel", "deve aceitar o tema Retrô");
assert.equal(documentElement.style.colorScheme, "dark");
assert.equal(storage.get("devquest-theme"), "pixel");
vm.runInNewContext(source, context);
assert.equal(context.window.DevQuestTheme.get(), "pixel", "deve restaurar Retrô ao recarregar");

// Preferências antigas do Halloween devem voltar ao tema padrão.
storage.set("devquest-theme", "vampire");
vm.runInNewContext(source, context);
assert.equal(context.window.DevQuestTheme.get(), "dark", "tema removido deve voltar para Noite");
context.window.DevQuestTheme.set("vampire");
assert.equal(storage.get("devquest-theme"), "dark");

context.window.DevQuestTheme.set("christmas");
assert.equal(context.window.DevQuestTheme.get(), "christmas", "deve aceitar Natal");
assert.equal(storage.get("devquest-theme"), "christmas");
vm.runInNewContext(source, context);
assert.equal(context.window.DevQuestTheme.get(), "christmas", "deve restaurar Natal");

context.window.DevQuestTheme.set("tema-inexistente");
assert.equal(documentElement.dataset.theme, "dark", "um tema inválido deve voltar ao padrão");

storage.delete("devquest-theme");
vm.runInNewContext(source, context);
assert.equal(context.window.DevQuestTheme.get(), "dark", "primeira visita deve abrir em Noite");
assert.equal(documentElement.style.colorScheme, "dark");
context.window.DevQuestTheme.set("christmas");
vm.runInNewContext(source, context);
assert.equal(context.window.DevQuestTheme.get(), "christmas", "deve manter a escolha de outro tema ao voltar");
const originalGetItem = context.window.localStorage.getItem;
context.window.localStorage.getItem = () => { throw new Error("armazenamento bloqueado"); };
vm.runInNewContext(source, context);
assert.equal(context.window.DevQuestTheme.get(), "dark", "sem armazenamento deve abrir em Noite");
context.window.localStorage.getItem = originalGetItem;

console.log("Temas validados: restauração, troca e persistência no navegador funcionando.");

const lastSettings = () => preferenceEvents.filter(e => e.type === "devquest:settingschange").at(-1).detail;
assert.equal(lastSettings().opacity, 45);
assert.equal(lastSettings().effect, true);
assert.equal(lastSettings().interactive, true);
assert.equal(lastSettings().paw, true);
storage.set("devquest-night-settings", JSON.stringify({ opacity: 12, effect: false, interactive: false, paw: false }));
vm.runInNewContext(source, context);
assert.equal(lastSettings().opacity, 12);
assert.equal(lastSettings().effect, false);
assert.equal(lastSettings().interactive, false);
assert.equal(lastSettings().paw, false);
assert.equal(documentElement.dataset.dqPawEnabled, "false");
console.log("Preferências padrão e escolhas salvas validadas.");
