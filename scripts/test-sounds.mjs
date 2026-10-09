import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../js/sounds.js', import.meta.url), 'utf8');
const handlers = {};
const storage = new Map();
const buttons = [];
let engines = 0, noises = 0, bubbles = 0, stops = 0;
const parameter = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} });
const node = () => ({ gain: parameter(), frequency: parameter(), Q: parameter(), connect(next) { return next; }, disconnect() {}, start() {}, stop() { stops++; } });
class AudioContext {
  constructor() { engines++; this.sampleRate = 8000; this.currentTime = 0; this.state = 'running'; this.destination = {}; }
  createGain() { return node(); }
  createBiquadFilter() { return node(); }
  createBuffer(_channels, length) { return { getChannelData: () => new Float32Array(length) }; }
  createBufferSource() { noises++; return node(); }
  createOscillator() { bubbles++; return node(); }
}
const document = {
  documentElement: { dataset: { theme: 'dark' } }, readyState: 'complete', hidden: false,
  querySelectorAll(selector) { return selector === '[data-theme-slot]' ? [{ appendChild(button) { buttons.push(button); } }] : buttons; },
  createElement() { return { attributes: {}, setAttribute(k, v) { this.attributes[k] = v; }, addEventListener(k, f) { this[k] = f; } }; },
  addEventListener(k, f) { handlers[k] = f; }
};
const window = {
  AudioContext,
  localStorage: { getItem: (key) => storage.get(key), setItem: (key, value) => storage.set(key, value) },
  addEventListener(k, f) { handlers[k] = f; }
};
vm.runInNewContext(source, { window, document });
assert.equal(engines, 0, 'não deve iniciar áudio ao carregar');
handlers['devquest:answer']({ detail: { correct: true } });
assert.equal(engines, 0, 'outros temas permanecem sem efeitos');
document.documentElement.dataset.theme = 'vampire';
handlers['devquest:answer']({ detail: { correct: true } });
assert.equal(noises, 4, 'acerto deve produzir quatro batidas de asas');
handlers['devquest:answer']({ detail: { correct: false } });
assert.equal(noises, 5, 'erro deve produzir um jorro');
assert.equal(bubbles, 7, 'erro deve produzir sete bolhas');
buttons[0].click();
assert.equal(storage.get('devquest-sound-muted'), 'true');
assert.equal(buttons[0].attributes['aria-pressed'], 'false');
handlers['devquest:answer']({ detail: { correct: true } });
assert.equal(noises, 5, 'silenciado não pode tocar');
buttons[0].click();
handlers['devquest:answer']({ detail: { correct: true } });
assert.equal(noises, 9, 'reativação deve funcionar');
const beforeStop = stops;
handlers['devquest:themechange']();
assert.ok(stops > beforeStop, 'troca de tema interrompe o efeito');
handlers.storage({ key: 'devquest-sound-muted', newValue: 'true' });
assert.equal(buttons[0].attributes['aria-pressed'], 'false');
// Armazenamento bloqueado e navegador sem Web Audio não quebram a página.
window.AudioContext = undefined;
window.localStorage.getItem = () => { throw new Error('blocked'); };
vm.runInNewContext(source, { window, document });
assert.equal(buttons.at(-1).disabled, true);
console.log('Sons validados: acerto, erro, ausência de autoplay, silêncio, persistência, interrupção e fallback.');
