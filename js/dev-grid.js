(() => {
"use strict";
// Grid Scan visual adapted to native Canvas 2D from the supplied React reference.
// No React, WebGL requirement, camera, microphone or external network access.
const c=document.getElementById("dev-grid"),ctx=c?.getContext("2d");if(!ctx)return;
const reduced=matchMedia("(prefers-reduced-motion: reduce)");
const cells=8,depth=3,eye=1.25,duration=2.4,delay=1.6,cycle=duration+delay;
let w=0,h=0,dpr=1,raf=0,last=0,t=0,mx=0,my=0,tx=0,ty=0,pings=[];
function resize(){w=innerWidth;h=innerHeight;dpr=Math.min(devicePixelRatio||1,1.5);c.width=Math.round(w*dpr);c.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);draw();}
function project(x,y,z){const f=eye/(eye+z);return [w/2+x*f+mx*(1-f),h/2+y*f+my*(1-f)];}
function line(a,b,color,width=1){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();}
function frame(z,color,width=1){const a=project(-w/2,-h/2,z),b=project(w/2,h/2,z);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.strokeRect(a[0],a[1],b[0]-a[0],b[1]-a[1]);}
function draw(){
 ctx.clearRect(0,0,w,h);
 const a=project(-w/2,-h/2,depth),b=project(w/2,h/2,depth);
 const nx=Math.max(8,Math.round(cells*w/Math.max(h,1)));
 for(let i=0;i<=nx;i++){const x=w*(i/nx-.5);line(project(x,-h/2,0),project(x,-h/2,depth),"#4d475788");line(project(x,h/2,0),project(x,h/2,depth),"#4d475788");line(project(x,-h/2,depth),project(x,h/2,depth),"#4d47574d");}
 for(let i=0;i<=cells;i++){const y=h*(i/cells-.5);line(project(-w/2,y,0),project(-w/2,y,depth),"#4d475788");line(project(w/2,y,0),project(w/2,y,depth),"#4d475788");line(project(-w/2,y,depth),project(w/2,y,depth),"#4d47574d");}
 for(let z=0;z<=depth+.01;z+=1/cells){const alpha=Math.round(95*(1-.6*z/depth)).toString(16).padStart(2,"0");frame(z,"#4d4757"+alpha,.75);}
 if(reduced.matches)return;
 const intro=t<2.2,phase=intro?t/2.2:(t-2.2)%cycle/duration;
 if(phase<=1){
 const z=phase*depth,alpha=Math.min(1,phase*8,(1-phase)*8);
 ctx.save();ctx.globalAlpha=alpha*.75;ctx.shadowColor="#4a00ff";ctx.shadowBlur=20;frame(z,"#8546ff",1.6);ctx.shadowBlur=0;frame(z,"#c4a9ff",.65);
 for(let j=1;j<=7;j++){let zz=z-j*.04;if(zz>=0){ctx.globalAlpha=alpha*.15*(1-j/8);frame(zz,"#4a00ff",2);}}
 ctx.globalAlpha=alpha*.12;ctx.translate(0,h*2);ctx.scale(1,-1);frame(z,"#4a00ff",4);ctx.restore();
 // Stable small sparks along the moving scan frame.
 const aa=project(-w/2,-h/2,z),bb=project(w/2,h/2,z);ctx.fillStyle="#975cff";ctx.globalAlpha=alpha*.55;
 for(let i=0;i<25;i++){let f=((i*37)%101)/101,xx=aa[0]+f*(bb[0]-aa[0]),yy=i%2?aa[1]:bb[1];ctx.fillRect(xx,yy,1.5,1.5);}ctx.globalAlpha=1;
 }
 pings=pings.filter(p=>t-p.t<2.4);
 for(const p of pings){const age=(t-p.t)/2.4;ctx.save();ctx.strokeStyle="#7840ff";ctx.globalAlpha=(1-age)**2*.65;ctx.shadowColor="#4a00ff";ctx.shadowBlur=12;ctx.beginPath();ctx.ellipse(p.x,p.y,8+age*240,6+age*160,0,0,Math.PI*2);ctx.stroke();ctx.restore();}
}
function tick(now){raf=0;if(document.hidden||reduced.matches)return;if(last&&now-last<32){raf=requestAnimationFrame(tick);return;}const dt=last?Math.min(.08,(now-last)/1000):.016;last=now;t+=dt;mx+=(tx-mx)*.09;my+=(ty-my)*.09;draw();raf=requestAnimationFrame(tick);}
function sync(){if(raf)cancelAnimationFrame(raf);raf=0;last=0;if(reduced.matches){mx=my=0;draw();}else if(!document.hidden)raf=requestAnimationFrame(tick);}
addEventListener("resize",resize,{passive:true});addEventListener("pointermove",e=>{tx=(e.clientX-w/2)*.20;ty=(e.clientY-h/2)*.20;},{passive:true});addEventListener("pointerdown",e=>{if(e.button===0&&!reduced.matches){pings.push({x:e.clientX,y:e.clientY,t});if(pings.length>4)pings.shift();}},{passive:true});
document.addEventListener("visibilitychange",sync);reduced.addEventListener?.("change",sync);resize();sync();
})();