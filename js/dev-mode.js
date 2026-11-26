(() => {
"use strict";
const LIMIT_MS=5000;
// Pure review state machine: one entry per attempt, no duplicate retry for wrong + slow.
function createSession(questions,shuffle) {
  let queue=shuffle(questions),retry=[],index=0,round=1,attempts=0,correct=0,answered=false,done=queue.length===0;
  return {
    get current(){return done?null:queue[index]},get round(){return round},get index(){return index},get length(){return queue.length},
    get attempts(){return attempts},get correct(){return correct},get answered(){return answered},get done(){return done},
    answer(isCorrect,elapsed) {
      if(done||answered)return false;
      answered=true;attempts++;if(isCorrect)correct++;
      if(!isCorrect||elapsed>LIMIT_MS)retry.push(queue[index]);
      return true;
    },
    next(){
      if(done||!answered)return false;
      if(++index===queue.length){
        if(!retry.length){done=true;return true;}
        queue=shuffle(retry);retry=[];index=0;round++;correct=0;
      }
      answered=false;return true;
    }
  };
}
if(typeof module!=="undefined"&&module.exports)module.exports={createSession,LIMIT_MS};
if(typeof document==="undefined")return;
const $=id=>document.getElementById(id);
const {shuffle,escapeHtml,renderProse,answersMatch,getOptionContent,isCodeOption}=window.DevQuestUtils;
const subjects=window.DEVQUEST_SUBJECTS,courses=window.DEVQUEST_COURSES;
let game=null,bank=[],started=null,epoch=0,subject=null;
function show(id){for(const n of ["setup","session","result"])$(n).hidden=n!==id;}
function fillSubjects(){
  const ids=courses[$("course").value]?.subjects||[];
  $("subject").replaceChildren(...ids.map(id=>{const o=document.createElement("option");o.value=id;o.textContent=subjects[id].label;return o;}));
}
$("course").addEventListener("change",fillSubjects);fillSubjects();
const dialog=$("welcome");
$("ok").addEventListener("click",()=>dialog.close());
dialog.addEventListener("close",()=>{show("setup");$("course").focus()});
dialog.addEventListener("cancel",e=>{e.preventDefault()});
if(typeof dialog.showModal==="function")dialog.showModal();else{dialog.setAttribute("open","");$("ok").addEventListener("click",()=>{dialog.removeAttribute("open");show("setup")},{once:true});}
function begin(){
  if(!bank.length)return;
  game=createSession(bank,shuffle);$("subject-title").textContent=subject.label;show("session");render();
}
$("start").addEventListener("click",async()=>{
  const token=++epoch;const config=subjects[$("subject").value];if(!config)return;
  $("start").disabled=true;$("load-status").textContent="Carregando questões...";
  try{
    const res=await fetch(config.jsonPath);if(!res.ok)throw Error("HTTP "+res.status);
    const data=await res.json();const list=data[config.jsonKey];
    if(!Array.isArray(list)||!list.length||list.some(q=>!Array.isArray(q.opcoes)||q.opcoes.length<2||typeof q.resposta!=="string"))throw Error("Banco inválido");
    if(token!==epoch)return;subject=config;bank=list;begin();$("load-status").textContent="";
  }catch(e){if(token===epoch)$("load-status").textContent="Não foi possível carregar a disciplina. Tente novamente.";}
  finally{if(token===epoch)$("start").disabled=false;}
});
function format(q){
  const title=q.titulo?"<h2>"+escapeHtml(q.titulo)+"</h2>":"";
  const desc=q.descricaoMonoespacada?"<pre>"+escapeHtml(q.descricao)+"</pre>":renderProse(q.descricao);
  const image=q.imagem?'<img src="'+escapeHtml(q.imagem)+'" alt="Imagem da questão">':"";
  const after=q.descricaoAposImagem?renderProse(q.descricaoAposImagem):"";
  const hint=q.originalPDF&&q.imagem?'<p>Leia as alternativas na imagem. <a href="'+escapeHtml(q.imagem)+'" target="_blank" rel="noopener">Ampliar questão</a></p>':"";
  const code=q.codigo?"<pre>"+escapeHtml(q.codigo)+"</pre>":"";
  const statements=Array.isArray(q.afirmacoes)?q.afirmacoes.map(a=>'<div class="dq-prose-statement"><strong>'+escapeHtml(a.id)+'</strong> '+escapeHtml(a.texto)+'</div>').join(""):"";
  return title+desc+image+after+hint+code+statements;
}
function status(){
  $("round").textContent="RODADA "+game.round;
  $("position").textContent="Questão "+(game.index+1)+" de "+game.length;
  $("correct-count").textContent=game.correct+" acertos nesta rodada";
  $("progress").max=game.length;$("progress").value=game.index+(game.answered?1:0);
}
function render(){
  const q=game.current,token=++epoch;started=null;status();$("next").hidden=true;
  $("question").innerHTML=format(q);$("question").tabIndex=-1;
  $("options").replaceChildren();
  const options=q.preservarOrdem||q.originalPDF?[...q.opcoes]:shuffle(q.opcoes);
  const entries=options.map((o,i)=>{
    const b=document.createElement("button");b.type="button";b.className="option";b.disabled=true;
    const letter=document.createElement("span");letter.textContent=String.fromCharCode(65+i)+")";
    const copy=document.createElement(isCodeOption(o)?"pre":"span");copy.className="copy";copy.textContent=q.originalPDF?"Alternativa "+getOptionContent(o):getOptionContent(o);
    b.append(letter,copy);$("options").append(b);
    const correct=answersMatch(o,q.resposta);
    b.addEventListener("click",()=>{
      if(token!==epoch||started===null||!game.answer(correct,performance.now()-started))return;
      entries.forEach(({button,correct:ok})=>{button.disabled=true;if(ok)button.classList.add("correct");});
      if(!correct)b.classList.add("wrong");status();$("next").hidden=false;$("next").focus({preventScroll:true});
    });
    return {button:b,correct};
  });
  // The clock starts only when the question is visible, including its image if present.
  const img=$("question").querySelector("img");
  const ready=()=>requestAnimationFrame(()=>requestAnimationFrame(()=>{
    if(token!==epoch||game.answered)return;
    started=performance.now();entries.forEach(e=>e.button.disabled=false);
  }));
  if(img&&!img.complete){let fired=false;const finish=()=>{if(fired)return;fired=true;ready()};img.addEventListener("load",finish,{once:true});img.addEventListener("error",finish,{once:true});}
  else ready();
  window.scrollTo(0,0);$("question").focus({preventScroll:true});
}
$("next").addEventListener("click",()=>{
  if(!game||!game.next())return;
  if(!game.done){render();return;}
  ++epoch;show("result");$("result-detail").textContent=bank.length+" questões · "+game.attempts+" tentativas · "+game.round+" rodadas.";
  $("result-title").focus();
});
$("restart").addEventListener("click",begin);
function choose(){++epoch;game=null;started=null;show("setup");$("start").disabled=false;$("subject").focus();}
$("choose").addEventListener("click",choose);
$("back").addEventListener("click",()=>{if(window.confirm("Encerrar este treinamento? O progresso desta sessão será perdido."))choose()});
})();