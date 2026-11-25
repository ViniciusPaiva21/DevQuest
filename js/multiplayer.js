(() => {
  'use strict';
  const avatars = [['alien','Alien'],['alegria','Alegria'],['cachorro','Cachorro'],['mestre','Mestre'],['rockeira','Rockeira'],['robo','Robô'],['ninja','Ninja'],['vampiro','Vampiro'],['pirata','Pirata'],['nerd','Nerd']];
  const key='devquest-multiplayer-profile';
  const $=id=>document.getElementById(id);
  let saved={};try{saved=JSON.parse(localStorage.getItem(key)||'{}')||{};}catch{}
  let selected=avatars.some(a=>a[0]===saved.avatar)?saved.avatar:'vampiro';
  const name=$('mp-name');name.value=typeof saved.name==='string'?saved.name.slice(0,24):'';
  function persist(){try{localStorage.setItem(key,JSON.stringify({name:name.value.trim(),avatar:selected}));}catch{}}
  function sync(){const a=avatars.find(a=>a[0]===selected);$('mp-avatar-preview').src=`images/avatars/${a[0]}.png`;$('mp-avatar-preview').alt=a[1];$('mp-avatar-name').textContent=a[1];for(const b of $('mp-avatars').children)b.setAttribute('aria-pressed',String(b.dataset.avatar===selected));$('mp-create').disabled=$('mp-join').disabled=!name.value.trim();persist();$('mp-next').hidden=true;}
  for(const [id,label] of avatars){const b=document.createElement('button');b.type='button';b.className='mp-avatar';b.dataset.avatar=id;b.setAttribute('aria-label',label);const img=document.createElement('img');img.src=`images/avatars/${id}.png`;img.alt='';const span=document.createElement('span');span.textContent=label;b.append(img,span);b.addEventListener('click',()=>{selected=id;sync();});$('mp-avatars').append(b);}
  name.addEventListener('input',sync);for(const [id,action] of [['mp-create','Criar sala'],['mp-join','Entrar em uma sala']])$(id).addEventListener('click',()=>{if(!name.value.trim())return;persist();const next=$('mp-next');next.textContent=`${action}: perfil de ${name.value.trim()} salvo. A conexão com as salas será habilitada na próxima etapa.`;next.hidden=false;});sync();
})();
