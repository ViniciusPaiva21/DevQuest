import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js';
import { getAuth, signInAnonymously, setPersistence, browserSessionPersistence } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js';
import { getDatabase, ref, get, runTransaction, onValue, onDisconnect, remove, set } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js';
const app=initializeApp({apiKey:"AIzaSyBjUK3n6sjC-J5qJm0BXvTVAy_a9j7cMlM",authDomain:"devquest-db0d7.firebaseapp.com",databaseURL:"https://devquest-db0d7-default-rtdb.firebaseio.com",projectId:"devquest-db0d7",storageBucket:"devquest-db0d7.firebasestorage.app",messagingSenderId:"115124170463",appId:"1:115124170463:web:501f4efb4ef19f3cdb836a"});
const auth=getAuth(app),db=getDatabase(app);
const avatars=[['alien','Alien'],['alegria','Alegria'],['cachorro','Cachorro'],['mestre','Mestre'],['rockeira','Rockeira'],['robo','Robô'],['ninja','Ninja'],['vampiro','Vampiro'],['pirata','Pirata'],['nerd','Nerd']];
const $=id=>document.getElementById(id),key='devquest-multiplayer-profile';
let saved={};try{saved=JSON.parse(localStorage.getItem(key)||'{}')||{}}catch{}
let selected=avatars.some(a=>a[0]===saved.avatar)?saved.avatar:'vampiro',uid,roomCode='',slot='',host=false,unsub=null,disconnect=null,busy=false;
const name=$('mp-name');name.value=typeof saved.name==='string'?saved.name.slice(0,24):'';
function notice(msg){$('mp-next').textContent=msg;$('mp-next').hidden=false}
function persist(){try{localStorage.setItem(key,JSON.stringify({name:name.value.trim(),avatar:selected}))}catch{}}
function buttons(){ $('mp-create').disabled=$('mp-join').disabled=busy||!name.value.trim(); }
function sync(){const a=avatars.find(a=>a[0]===selected);$('mp-avatar-preview').src='images/avatars/'+a[0]+'.png';$('mp-avatar-preview').alt=a[1];$('mp-avatar-name').textContent=a[1];for(const b of $('mp-avatars').children)b.setAttribute('aria-pressed',String(b.dataset.avatar===selected));buttons();persist()}
for(const [id,label] of avatars){const b=document.createElement('button');b.type='button';b.className='mp-avatar';b.dataset.avatar=id;b.setAttribute('aria-label',label);const img=document.createElement('img');img.src='images/avatars/'+id+'.png';img.alt='';const span=document.createElement('span');span.textContent=label;b.append(img,span);b.addEventListener('click',()=>{selected=id;sync()});$('mp-avatars').append(b)}
name.addEventListener('input',sync);sync();
let authReady;
async function identify(){if(!authReady)authReady=(async()=>{await setPersistence(auth,browserSessionPersistence);return (await signInAnonymously(auth)).user.uid})().catch(e=>{authReady=null;throw e});uid=await authReady}
const roomRef=code=>ref(db,'rooms/'+code);
const player=()=>({uid,name:name.value.trim(),avatar:selected});
function code(){const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';return Array.from(crypto.getRandomValues(new Uint8Array(6)),n=>chars[n%chars.length]).join('')}
function reset(msg){currentRoom=null;deck=[];lastRender='';$('mp-game').hidden=true;$('mp-results').hidden=true;$('mp-settings').hidden=true;if(unsub)unsub();unsub=null;roomCode='';slot='';host=false;disconnect=null;$('mp-lobby').hidden=true;$('mp-profile-panel').hidden=false;buttons();notice(msg)}
async function enterLobby(c,s,isHost){roomCode=c;slot=s;host=isHost;disconnect=onDisconnect(isHost?roomRef(c):ref(db,'rooms/'+c+'/players/'+s));try{await disconnect.remove()}catch(e){await remove(isHost?roomRef(c):ref(db,'rooms/'+c+'/players/'+s)).catch(()=>{});reset('Não foi possível configurar a conexão.');throw e}
$('mp-profile-panel').hidden=true;$('mp-lobby').hidden=false;$('mp-room-code').textContent=c;
unsub=onValue(roomRef(c),snap=>{const room=snap.val();if(!room||!room.players?.[s]||room.players[s].uid!==uid){if(disconnect)disconnect.cancel().catch(()=>{});reset('A sala foi encerrada ou você foi desconectado.');return}const players=Object.values(room.players);$('mp-count').textContent=players.length+'/5 jogadores';$('mp-players').replaceChildren();for(const p of players){const row=document.createElement('div');row.className='mp-player';row.dataset.uid=p.uid;const img=document.createElement('img');img.src='images/avatars/'+p.avatar+'.png';img.alt='';const label=document.createElement('strong');label.textContent=p.name;const role=document.createElement('span');role.textContent=(p.uid===room.host?'Anfitrião':'Jogador')+(p.uid===uid?' · Você':'');row.append(img,label,role);$('mp-players').append(row)}renderGame(room)},()=>reset('Não foi possível acessar a sala.'))}
async function action(fn){if(busy||!name.value.trim())return;busy=true;buttons();try{persist();await identify();await fn()}catch(e){console.error(e);notice(e.code==='PERMISSION_DENIED'||e.code==='permission-denied'?'Acesso negado. Confira as regras do Firebase ou tente outro avatar.':e.message||'Não foi possível conectar.')}finally{busy=false;buttons()}}
$('mp-create').onclick=()=>action(async()=>{for(let i=0;i<5;i++){const c=code(),p=player();const result=await runTransaction(roomRef(c),old=>old===null?{host:uid,createdAt:Date.now(),players:{s0:p}}:undefined,{applyLocally:false});if(result.committed){await enterLobby(c,'s0',true);return}}throw Error('Não foi possível gerar código. Tente novamente.')});
$('mp-join').onclick=()=>{if(busy)return;const c=(prompt('Digite o código da sala:')||'').trim().toUpperCase();if(!/^[A-Z2-9]{6}$/.test(c)){notice('Informe um código de 6 caracteres.');return}action(async()=>{const room=(await get(roomRef(c))).val();if(!room)throw Error('Sala não encontrada.');if(room.game)throw Error('A partida já começou.');const p=player(),players=room.players||{};if(Object.values(players).some(x=>x.uid===uid))throw Error('Você já está nesta sala. Use outra janela anônima para testar.');if(Object.values(players).some(x=>x.avatar===p.avatar))throw Error('Este avatar já está em uso. Escolha outro.');for(let i=1;i<5;i++){const s='s'+i;if(players[s])continue;const result=await runTransaction(ref(db,'rooms/'+c+'/players/'+s),old=>old===null?p:undefined,{applyLocally:false});if(result.committed){await enterLobby(c,s,false);return}}throw Error('Sala lotada. Tente outra sala.')})};
$('mp-copy').onclick=async()=>{try{await navigator.clipboard.writeText(roomCode);$('mp-lobby-status').textContent='Código copiado!'}catch{$('mp-lobby-status').textContent='Código: '+roomCode}};
$('mp-leave').onclick=async()=>{if(!roomCode)return;const target=host?roomRef(roomCode):ref(db,'rooms/'+roomCode+'/players/'+slot);try{await remove(target);if(disconnect)await disconnect.cancel();reset('Você saiu da sala.')}catch(e){$('mp-lobby-status').textContent='Não foi possível sair. Tente novamente.'}};

const subjects=window.DEVQUEST_SUBJECTS||{};
for(const [id,s] of Object.entries(subjects).sort((a,b)=>a[1].label.localeCompare(b[1].label,'pt-BR'))){const opt=document.createElement('option');opt.value=id;opt.textContent=s.label;$('mp-subject').append(opt)}
let currentRoom=null,deck=[],offset=0,advancing=false,starting=false,submitting=false,lastRender='',nextAttempt=0;
onValue(ref(db,'.info/serverTimeOffset'),s=>{offset=s.val()||0});
const now=()=>Date.now()+offset;
function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function makeQuestion(q){if(!Array.isArray(q.opcoes)||!q.opcoes.every(x=>typeof x==='string')||typeof q.resposta!=='string'||!q.opcoes.includes(q.resposta))return null;const text=[q.titulo,q.descricao].filter(Boolean).join('\n');if(!text.trim()||q.opcoes.length<2||q.opcoes.length>8)return null;const options=q.preservarOrdem?[...q.opcoes]:shuffle(q.opcoes);return {text,options,correct:options.indexOf(q.resposta)}}
function chooseTotal(mode,custom,available){
 if(!Number.isInteger(available)||available<1)throw Error('Esta disciplina não possui questões disponíveis para o multiplayer.');
 if(mode==='all')return available;
 const requested=mode==='custom'?custom:Number(mode);
 if(!Number.isInteger(requested)||requested<1)throw Error('Informe uma quantidade inteira maior que zero.');
 if(requested>available)throw Error('Esta disciplina possui '+available+' questões disponíveis. Escolha uma quantidade menor ou todas.');
 return requested;
}
let countSequence=0;
async function updateAvailable(){
 const seq=++countSequence,s=subjects[$('mp-subject').value];
 $('mp-available').textContent='Verificando questões disponíveis…';
 try{
  const res=await fetch(s.jsonPath);if(!res.ok)throw Error('Falha ao carregar');
  const data=await res.json(),n=(data[s.jsonKey]||[]).filter(q=>makeQuestion(q)!==null).length;
  if(seq!==countSequence)return;
  $('mp-available').textContent=n+' questões disponíveis nesta disciplina.';
  $('mp-quantity').options[0].textContent='Todas as questões ('+n+')';
  for(const opt of $('mp-quantity').options){if(['10','20','30'].includes(opt.value))opt.disabled=Number(opt.value)>n;}
  if($('mp-quantity').selectedOptions[0]?.disabled)$('mp-quantity').value='all';
  $('mp-custom').max=String(n);$('mp-custom').value=String(Math.min(n,Math.max(1,Number($('mp-custom').value)||1)));
  $('mp-custom-wrap').hidden=$('mp-quantity').value!=='custom';
 }catch(e){if(seq===countSequence){$('mp-available').textContent='Não foi possível consultar a quantidade. Tente novamente.';$('mp-quantity').options[0].textContent='Todas as questões';}}
}
$('mp-subject').addEventListener('change',updateAvailable);
$('mp-quantity').addEventListener('change',()=>{$('mp-custom-wrap').hidden=$('mp-quantity').value!=='custom'});
updateAvailable();
function publicQ(q){return {text:q.text,options:q.options}}
function participants(room){return Object.keys(room.players||{}).sort().map(s=>room.players[s])}
function renderGame(room){currentRoom=room;const g=room.game;const ps=participants(room);$('mp-settings').hidden=!host||!!g&&g.phase!=='finished';$('mp-game').hidden=!g||g.phase==='finished';$('mp-results').hidden=!g||g.phase!=='finished';$('mp-start').hidden=!host||!!g&&g.phase!=='finished';$('mp-start').disabled=starting||ps.length<2;$('mp-start').textContent=g?'Revanche':'Iniciar partida';
if(!g){$('mp-lobby-status').textContent=ps.length<2?'Aguardando mais jogadores.':host?'Configure a partida e comece.':'Aguardando o anfitrião.';lastRender='';return}
if(g.phase==='finished'){renderResults(g);$('mp-lobby-status').textContent='Partida encerrada.';return}
const active=g.roster[g.activeUid],mine=active.uid===uid;const answer=room.answers?.[g.turnKey];$('mp-lobby-status').textContent=g.subjectLabel+' · Questão '+(g.index+1)+'/'+g.total;$('mp-turn').textContent=mine?'Sua vez!':'Vez de '+active.name;
for(const row of $('mp-players').children){row.classList.toggle('mp-active',row.dataset.uid===active.uid)}
const renderKey=[g.id,g.index,g.turnKey,g.phase,answer?.choice,g.correct].join('|');if(renderKey!==lastRender){lastRender=renderKey;$('mp-question').textContent=g.question.text;$('mp-options').replaceChildren();g.question.options.forEach((o,i)=>{const b=document.createElement('button');b.type='button';b.textContent=String.fromCharCode(65+i)+') '+o;b.disabled=!mine||g.phase!=='question'||!!answer||!!g.wrong?.[i];b.className='mp-option';if(g.wrong?.[i])b.classList.add('mp-wrong');if(g.phase==='reveal'&&i===g.correct)b.classList.add('mp-correct');if(g.phase==='reveal'&&i===g.choice&&i!==g.correct)b.classList.add('mp-wrong');if(answer?.choice===i)b.classList.add('mp-picked');b.onclick=()=>submit(g,i);$('mp-options').append(b)});$('mp-feedback').textContent=g.phase==='reveal'?(g.choice===g.correct?g.roster[g.activeUid].name+' acertou! +1 ponto':'Ninguém acertou esta pergunta.')+(g.correct>=0?' Resposta certa: '+g.question.options[g.correct]:''):answer?'Resposta enviada.':(g.passMessage?g.passMessage+' · ':'')+(mine?'Escolha uma alternativa.':'Acompanhe a resposta do jogador.')}
}
async function submit(g,i){if(submitting||!roomCode||g.phase!=='question'||g.activeUid!==uid||g.wrong?.[i]||currentRoom?.game?.turnKey!==g.turnKey||now()>=g.deadline)return;submitting=true;const buttons=[...$('mp-options').children];buttons.forEach(b=>b.disabled=true);try{await set(ref(db,'rooms/'+roomCode+'/answers/'+g.turnKey),{uid,choice:i})}catch(e){$('mp-feedback').textContent='Não foi possível enviar a resposta.';if(currentRoom?.game?.turnKey===g.turnKey&&currentRoom.game.phase==='question')buttons.forEach((b,j)=>b.disabled=!!g.wrong?.[j])}finally{submitting=false}}
$('mp-start').onclick=async()=>{if(!host||starting||!currentRoom||participants(currentRoom).length<2)return;starting=true;$('mp-start').disabled=true;try{const s=subjects[$('mp-subject').value],quantity=$('mp-quantity').value,customQuantity=Number($('mp-custom').value),seconds=Number($('mp-time').value);const response=await fetch(s.jsonPath);if(!response.ok)throw Error('Não foi possível carregar as questões.');const data=await response.json();const pool=shuffle((data[s.jsonKey]||[]).map(makeQuestion).filter(Boolean));const room= (await get(roomRef(roomCode))).val();const players=participants(room);if(players.length<2)throw Error('São necessários pelo menos dois jogadores.');const total=chooseTotal(quantity,customQuantity,pool.length);deck=pool.slice(0,total);const order=players.map(p=>p.uid),roster=Object.fromEntries(players.map(p=>[p.uid,p])),scores=Object.fromEntries(order.map(u=>[u,0]));const id=code(),stats=Object.fromEntries(order.map(u=>[u,{hits:0,errors:0,timeouts:0}]));await set(ref(db,'rooms/'+roomCode+'/game'),{id,stats,attempt:0,activeUid:order[0],turnKey:id+'_0_0',phase:'question',subjectLabel:s.label,seconds,order,roster,scores,index:0,total,question:publicQ(deck[0]),deadline:now()+seconds*1000});lastRender=''}catch(e){$('mp-lobby-status').textContent=e.message||'Não foi possível iniciar.'}finally{starting=false;$('mp-start').disabled=!currentRoom||participants(currentRoom).length<2}};

function renderResults(g){
 const ranking=$('mp-ranking');ranking.replaceChildren();
 const stats=g.stats||{},players=Object.values(g.roster).sort((a,b)=>(g.scores[b.uid]||0)-(g.scores[a.uid]||0));
 let rank=0,previous=-1;
 for(const [i,p] of players.entries()){
  const points=g.scores[p.uid]||0;if(points!==previous)rank=i+1;previous=points;
  const st=stats[p.uid]||{hits:points,errors:0,timeouts:0},total=st.hits+st.errors+st.timeouts,grade=total?10*st.hits/total:0;
  const row=document.createElement('article');row.className='mp-result';
  const head=document.createElement('div');head.className='mp-player';const img=document.createElement('img');img.src='images/avatars/'+p.avatar+'.png';img.alt='';
  const n=document.createElement('strong');n.textContent=rank+'º · '+p.name+(p.uid===uid?' · Você':'');const pts=document.createElement('span');pts.textContent=points+' pts';head.append(img,n,pts);
  const detail=document.createElement('p');detail.textContent='Nota: '+(total?grade.toFixed(1).replace('.',',')+'/10':'—')+' · '+st.hits+' acertos · '+st.errors+' erros · '+st.timeouts+' tempos esgotados';
  const bar=document.createElement('div');bar.className='mp-result-bar';bar.setAttribute('role','img');bar.setAttribute('aria-label',detail.textContent);
  for(const [k,count] of [['hits',st.hits],['errors',st.errors],['timeouts',st.timeouts]]){const part=document.createElement('span');part.className='mp-bar-'+k;part.style.width=(total?100*count/total:0)+'%';bar.append(part)}
  row.append(head,detail,bar);ranking.append(row);
 }
}
function advanceState(old,g,q,answer,presentUids,time){
 if(!old||old.turnKey!==g.turnKey||old.phase!==g.phase)return;
 if(g.phase==='question'){
  const active=g.activeUid,choice=answer?.uid===active&&Number.isInteger(answer.choice)&&answer.choice>=0&&answer.choice<q.options.length&&!g.wrong?.[answer.choice]?answer.choice:-1;
  const stats={...old.stats},st={...(stats[active]||{hits:0,errors:0,timeouts:0})},scores={...old.scores};
  const wrong={...old.wrong},tried={...old.tried,[active]:true};
  if(choice===q.correct){st.hits++;scores[active]=(scores[active]||0)+1}
  else if(choice>=0){st.errors++;wrong[choice]=true}
  else st.timeouts++;
  stats[active]=st;
  const pos=g.order.indexOf(active),candidates=Array.from({length:g.order.length},(_,i)=>g.order[(pos+i+1)%g.order.length]);
  const next=candidates.find(u=>!tried[u]&&presentUids.includes(u));
  if(choice!==q.correct&&next&&presentUids.length>=2){
   const attempt=(g.attempt||0)+1;
   return {...old,stats,scores,wrong,tried,attempt,activeUid:next,turnKey:g.id+'_'+g.index+'_'+attempt,passMessage:g.roster[active].name+(choice<0?' ficou sem tempo':' errou')+'! A pergunta passou adiante.',deadline:time+g.seconds*1000};
  }
  return {...old,stats,scores,wrong,tried,phase:'reveal',choice,correct:q.correct,deadline:time+4000};
 }
 const index=g.index+1;
 if(index>=g.total||presentUids.length<2)return {...old,phase:'finished'};
 const nextQ=deck[index];if(!nextQ)return;
 const next=Array.from({length:g.order.length},(_,i)=>g.order[(index+i)%g.order.length]).find(u=>presentUids.includes(u));
 return {...old,index,attempt:0,activeUid:next,turnKey:g.id+'_'+index+'_0',phase:'question',question:publicQ(nextQ),wrong:null,tried:null,passMessage:null,choice:-1,correct:-1,deadline:time+g.seconds*1000};
}
async function tick(){
 const room=currentRoom,g=room?.game;if(!g||g.phase==='finished')return;
 const remaining=Math.max(0,g.deadline-now());$('mp-clock').textContent=(g.phase==='reveal'?'Próxima questão em ':'Tempo: ')+Math.ceil(remaining/1000)+'s';
 if(g.phase==='question'&&remaining===0)for(const b of $('mp-options').children)b.disabled=true;
 if(!host||advancing||now()<nextAttempt||!deck[g.index])return;
 const presentUids=participants(room).map(p=>p.uid),answer=room.answers?.[g.turnKey];
 if(g.phase==='question'&&!answer&&remaining>0&&presentUids.includes(g.activeUid))return;
 if(g.phase==='reveal'&&remaining>0)return;
 advancing=true;
 try{await runTransaction(ref(db,'rooms/'+roomCode+'/game'),old=>advanceState(old,g,deck[g.index],answer,presentUids,now()),{applyLocally:false})}
 catch(e){nextAttempt=now()+2000;$('mp-feedback').textContent='Falha ao sincronizar. Tentando novamente.'}
 finally{advancing=false}
}
setInterval(tick,200);
