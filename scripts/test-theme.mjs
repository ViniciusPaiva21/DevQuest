import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(projectRoot, "js/theme.js"), "utf8");
const storage = new Map([["devquest-theme", "classic"]]);
const documentElement = { dataset: {}, style: {} };

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
    dispatchEvent: () => {}
  }
};

vm.runInNewContext(source, context);

assert.equal(documentElement.dataset.theme, "classic", "deve restaurar o tema salvo");
assert.equal(documentElement.style.colorScheme, "light", "o tema clássico deve usar controles claros");
assert.equal(context.window.DevQuestTheme.get(), "classic");

context.window.DevQuestTheme.set("dark");
assert.equal(documentElement.dataset.theme, "dark", "deve trocar para o tema noite");
assert.equal(storage.get("devquest-theme"), "dark", "deve persistir a escolha");

context.window.DevQuestTheme.set("tema-inexistente");
assert.equal(documentElement.dataset.theme, "dark", "um tema inválido deve voltar ao padrão");

console.log("Temas validados: restauração, troca e persistência no navegador funcionando.");
