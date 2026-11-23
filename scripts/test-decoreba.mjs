import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
const read = file => fs.readFileSync(new URL(file, root), 'utf8');
const context = vm.createContext({window:{}});
for (const file of ['js/subjects.js','js/utils.js','js/decoreba-core.js']) vm.runInContext(read(file), context, {filename:file});
const core = context.window.DevQuestDecoreba;
const optionsOnly = html => html.split('<ol class="decoreba-options"')[1];
const utils = context.window.DevQuestUtils;
const metadata = JSON.parse(read('data/decoreba-cues.json'));
let total = 0;
for (const [id, subject] of Object.entries(context.window.DEVQUEST_SUBJECTS)) {
  const questions = JSON.parse(read(subject.jsonPath))[subject.jsonKey];
  const original = JSON.stringify(questions);
  const entries = core.prepareSession(questions, metadata.subjects[id]);
  assert.equal(entries.length, questions.length);
  for (const entry of entries) {
    total++;
    const label = `${id}: ${core.questionKey(entry.question)}`;
    assert.equal(entry.options.filter(o => utils.answersMatch(o, entry.question.resposta)).length, 1, label);
    const html = core.renderQuestion(entry);
    assert.equal((html.match(/data-correct="true"/g)||[]).length, 1, label);
    const [prompt, options] = html.split('<ol class="decoreba-options"');
    assert.equal((prompt.match(/<mark /g)||[]).length, entry.cues.pergunta.length, label+' prompt');
    assert.equal((options.match(/<mark /g)||[]).length, entry.cues.resposta.length, label+' answer');
    assert.equal(core.questionKey({...entry.question, opcoes:[...entry.question.opcoes].reverse()}), core.questionKey(entry.question));
  }
  assert.equal(JSON.stringify(questions), original, 'Original bank must not be mutated');
  assert.throws(()=>core.prepareSession(questions, {}), /Destaques/);
}
assert.equal(total, 573);
assert.equal(Object.keys(metadata.subjects).length, 18);
assert.equal(core.highlight('<script>alert(1)</script>', ['script']).includes('<script>'), false);
assert.equal((core.highlight('abc abc', ['abc','abc','a']).match(/<mark /g)||[]).length, 1);
assert.equal(core.highlight('a < b && c > d', []), 'a &lt; b &amp;&amp; c &gt; d');
for (const file of ['index.html','disciplinas.html','quiz.html','infernus.html']) {
  assert.match(read(file), /href="decoreba.html"/);
}
console.log(`Decoreba validado: ${total} questões, 18 matérias, gabaritos únicos, destaques exatos, escape HTML e bancos preservados.`);

// Exercise page wiring using a small DOM adapter; this is not a visual browser test.
async function page(subjectId, fail = false) {
  const elements = Object.fromEntries([...read('decoreba.html').matchAll(/id="([^"]+)"/g)].map(([,id]) => [id, {
    hidden: !['decoreba-catalog'].includes(id), listeners: {},
    addEventListener(event, handler) { this.listeners[event] = handler; },
    focus() {}, scrollIntoView() {}, contains() {return true;},
  }]));
  const links = [{},{}];
  let failure = fail;
  let now = 0;
  let timerId = 0;
  const timers = new Map();
  const advance = milliseconds => { now += milliseconds; for (const tick of [...timers.values()]) tick(); };
  const ctx = vm.createContext({window:{}, URLSearchParams,
    Date: {now:()=>now}, setInterval: fn => {timers.set(++timerId,fn);return timerId;}, clearInterval: id => timers.delete(id),
    console: {error(){}},
    location:{search:`?materia=${subjectId}`,protocol:'http:'},
    document:{body:{style:{setProperty(){}}},getElementById(id){assert.ok(elements[id], id);return elements[id];},querySelectorAll(){return links;}},
    fetch: async file => ({ok: !failure,status:failure?503:200,json:async()=>JSON.parse(read(file))}),
  });
  for (const file of ['js/subjects.js','js/utils.js','js/decoreba-core.js','js/decoreba.js']) vm.runInContext(read(file),ctx,{filename:file});
  const flush = () => new Promise(resolve=>setImmediate(resolve));
  await flush();
  if (fail) {
    assert.equal(elements['decoreba-error'].hidden,false);
    failure=false;elements['decoreba-retry'].listeners.click();await flush();
  }
  assert.equal(elements['decoreba-error'].hidden,true);
  assert.equal(elements['decoreba-session'].hidden,false);
  assert.equal(elements['decoreba-loading'].hidden,true);
  const pilot = ['empreendedorismo','segurancainformacao'].includes(subjectId);
  const answer = () => elements['decoreba-question-area'].listeners.click({target:{closest:()=>({dataset:{optionIndex:'0'}})}});
  if (pilot) {
    assert.equal(elements['decoreba-next'].disabled,true);
    assert.doesNotMatch(optionsOnly(elements['decoreba-question-area'].innerHTML),/Resposta correta|<mark |data-correct/);
    assert.equal(elements['decoreba-timer-seconds'].textContent,'10s');
    advance(1000);
    assert.equal(elements['decoreba-timer-seconds'].textContent,'09s');
    advance(8999);
    assert.doesNotMatch(optionsOnly(elements['decoreba-question-area'].innerHTML),/<mark /);
    advance(1);
    assert.equal(elements['decoreba-timer-seconds'].textContent,'00s');
    assert.equal((optionsOnly(elements['decoreba-question-area'].innerHTML).match(/<mark /g)||[]).length,1);
    answer();
    assert.equal(timers.size,0);
    assert.equal(elements['decoreba-next'].disabled,false);
    assert.match(elements['decoreba-question-area'].innerHTML,/Resposta correta/);
  }
  const first=elements['decoreba-question-area'].innerHTML;
  elements['decoreba-next'].listeners.click();
  elements['decoreba-previous'].listeners.click();
  assert.equal(elements['decoreba-question-area'].innerHTML,first,'Back keeps option order');
  const count=elements['decoreba-progress'].max;
  for(let i=0;i<count;i++) { if(pilot) answer(); elements['decoreba-next'].listeners.click(); }
  assert.equal(elements['decoreba-session'].hidden,true);
  assert.equal(elements['decoreba-finish'].hidden,false);
  assert.equal(links[0].href,`quiz.html?materia=${subjectId}`);
  elements['decoreba-restart'].listeners.click();await flush();
  assert.equal(elements['decoreba-session'].hidden,false);
  assert.equal(elements['decoreba-previous'].disabled,true);
  if(pilot) {
    assert.doesNotMatch(optionsOnly(elements['decoreba-question-area'].innerHTML),/<mark /);
    answer();
    assert.equal(timers.size,0);
    assert.match(elements['decoreba-feedback'].textContent,/Antes da dica|Não foi dessa vez/);
    const once = elements['decoreba-question-area'].innerHTML;
    answer(); assert.equal(elements['decoreba-question-area'].innerHTML,once);
    elements['decoreba-next'].listeners.click();
    advance(5000);
    assert.doesNotMatch(optionsOnly(elements['decoreba-question-area'].innerHTML),/<mark /);
    elements['decoreba-previous'].listeners.click();
    assert.equal(timers.size,0);
    elements['decoreba-next'].listeners.click();
    advance(9999);
    assert.doesNotMatch(optionsOnly(elements['decoreba-question-area'].innerHTML),/<mark /);
    advance(1);
    assert.match(optionsOnly(elements['decoreba-question-area'].innerHTML),/<mark /);
  }
}
for(const id of Object.keys(context.window.DEVQUEST_SUBJECTS)) await page(id);
await page('segurancainformacao',true);
console.log('Fluxos Decoreba validados: carregar, avançar, voltar, concluir, reiniciar e recuperar erro de rede.');

const pilotData = JSON.parse(read('data/decoreba-pilot.json'));
assert.deepEqual(Object.keys(pilotData.subjects).sort(), ['empreendedorismo','segurancainformacao']);
let pilotCount=0;
for (const [id, cues] of Object.entries(pilotData.subjects)) {
  const qs=JSON.parse(read(`data/${id}.json`))[id];
  const original=JSON.stringify(qs);
  for(const entry of core.prepareSession(qs,metadata.subjects[id],cues)) {
    pilotCount++;
    const neutral=core.renderQuestion(entry,{selected:null,revealed:false});
    const revealed=core.renderQuestion(entry,{selected:null,revealed:true});
    assert.doesNotMatch(optionsOnly(neutral),/data-correct|Resposta correta|option--correct|<mark /);
    assert.doesNotMatch(neutral, /decoreba-option-key/);
    assert.equal((optionsOnly(revealed).match(/<mark /g)||[]).length,1);
    const correctIndex=entry.options.findIndex(o=>utils.answersMatch(o,entry.question.resposta));
    const correctKey=entry.optionCues.find(c=>c.texto===utils.getOptionContent(entry.options[correctIndex])).trecho;
    assert.ok(revealed.includes(`<mark class="decoreba-keyword">${utils.escapeHtml(correctKey)}</mark>`));
    assert.equal(core.validateOptionCues(entry.question,[]),false);
  }
  assert.equal(JSON.stringify(qs),original);
}
assert.equal(pilotCount,90);
console.log('Piloto: 90 questões, chaves por conteúdo, sem revelação antecipada, liberação em 10s, resposta antecipada e cancelamento de timers validados.');

const sample={question:{descricao:'Uma linha quebrada\ncontinua aqui.\nI. Primeira afirmação.\nII. Segunda afirmação.',opcoes:['Sim','Não'],resposta:'Sim'}, cues:{pergunta:[{campo:'descricao',texto:'linha'}],resposta:['Sim']},options:['Sim','Não']};
const sampleHtml=core.renderQuestion(sample);
assert.ok(sampleHtml.includes('quebrada continua aqui.'));
assert.ok(sampleHtml.includes('<br><br>I.'));
assert.ok(sampleHtml.includes('<br><br>II.'));
console.log('Layout: brilho dentro do texto, sem etiquetas, parágrafos/afirmações preservados e contagem 10s → 09s → 00s validados.');
