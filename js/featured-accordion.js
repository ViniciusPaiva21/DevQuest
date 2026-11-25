(() => {
'use strict';
const gallery=document.getElementById('dq-ag-gallery'),dots=document.getElementById('dq-ag-dots'),indicator=document.getElementById('dq-ag-indicator');
if(!gallery||!dots||!indicator)return;
const subjects=window.DEVQUEST_SUBJECTS||{},featured=window.DEVQUEST_FEATURED_SUBJECTS||[];
const arts={estruturasdados2:['tree','#6ee7b7'],algebralinear:['math','#93c5fd'],empreendedorismo:['rocket','#fdba74'],apoiodecisao:['data','#86efac'],segurancainformacao:['shield','#c4b5fd']};
const items=featured.filter(x=>subjects[x.subjectId]).map(x=>({id:x.subjectId,course:x.courseId,label:subjects[x.subjectId].label,desc:subjects[x.subjectId].description,art:arts[x.subjectId]?.[0]||'data',color:arts[x.subjectId]?.[1]||'#a78bfa'}));
if(!items.length)return;
let active=Math.min(2,items.length-1);
const panels=[],buttons=[],hover=matchMedia('(hover:hover) and (pointer:fine)'),reduce=matchMedia('(prefers-reduced-motion: reduce)');
const pad=n=>String(n).padStart(2,'0');
function select(i,focus=false){active=i;panels.forEach((p,j)=>{p.classList.toggle('is-active',i===j);p.setAttribute('aria-expanded',String(i===j));p.querySelector('a').tabIndex=i===j?0:-1;buttons[j].classList.toggle('is-active',i===j);buttons[j].setAttribute('aria-pressed',String(i===j));if(i!==j){p.style.setProperty('--x','0px');p.style.setProperty('--y','0px')}});indicator.textContent=pad(i+1)+' / '+pad(items.length);if(focus)panels[i].focus()}
const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e};
items.forEach((item,i)=>{
 const panel=el('article','dq-ag-panel');panel.tabIndex=0;panel.setAttribute('aria-label',item.label);panel.style.setProperty('--panel-accent',item.color);
 const img=el('img','dq-ag-art');img.src='images/featured/'+item.art+'.svg';img.alt='';img.draggable=false;
 const top=el('div','dq-ag-top');top.append(el('span','dq-ag-no',pad(i+1)),el('span','dq-ag-course',item.course));
 const collapsed=el('span','dq-ag-collapsed',item.label),content=el('div','dq-ag-content'),link=el('a','dq-ag-link','Iniciar quiz ');link.href='quiz.html?materia='+encodeURIComponent(item.id)+'&curso='+encodeURIComponent(item.course);const arrow=el('span','','↗');arrow.setAttribute('aria-hidden','true');link.append(arrow);
 content.append(el('small','','✦ NOVA DISCIPLINA'),el('h3','',item.label),el('p','',item.desc),link);panel.append(img,top,collapsed,content);gallery.append(panel);panels.push(panel);
 const dot=el('button');dot.type='button';dot.setAttribute('aria-label',item.label);dots.append(dot);buttons.push(dot);dot.onclick=()=>select(i,true);
 panel.addEventListener('pointerenter',()=>{if(hover.matches)select(i)});
 panel.addEventListener('pointermove',e=>{if(!hover.matches||i!==active||reduce.matches)return;const r=panel.getBoundingClientRect();panel.style.setProperty('--x',((e.clientX-r.left)/r.width-.5)*12+'px');panel.style.setProperty('--y',((e.clientY-r.top)/r.height-.5)*10+'px')});
 panel.addEventListener('pointerleave',()=>{panel.style.setProperty('--x','0px');panel.style.setProperty('--y','0px')});
 panel.addEventListener('focusin',()=>select(i));panel.addEventListener('click',e=>{if(!e.target.closest('a'))select(i)});
 panel.addEventListener('keydown',e=>{if(e.target!==panel)return;if(['ArrowRight','ArrowDown','ArrowLeft','ArrowUp'].includes(e.key)){e.preventDefault();select((i+(['ArrowRight','ArrowDown'].includes(e.key)?1:-1)+items.length)%items.length,true)}else if(e.key==='Enter'){e.preventDefault();if(active===i)location.href=link.href;else select(i)}else if(e.key===' '){e.preventDefault();select(i)}});
});
document.getElementById('dq-ag-count').textContent=pad(items.length)+' DISCIPLINAS';select(active);
})();