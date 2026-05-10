'use strict';
const TWO_PI=Math.PI*2, rand=(a,b)=>a+Math.random()*(b-a), lerp=(a,b,t)=>a+(b-a)*t, clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

// ══════════════════════════════════════
//  GLOBAL CANVAS
// ══════════════════════════════════════
const gc=document.getElementById('c'), gx=gc.getContext('2d');
let W,H,gF=0;
function resize(){W=gc.width=innerWidth;H=gc.height=innerHeight;}
resize(); window.addEventListener('resize',resize);

// ── Falling petals (persistent) ──
const PETALS=Array.from({length:35},()=>mkP(true));
function mkP(init=false){
  return{x:rand(0,W||900),y:init?rand(0,H||700):-20,
    vx:rand(-.3,.3),vy:rand(.2,.85),
    angle:rand(0,TWO_PI),spin:rand(-.02,.02),
    w:rand(4,12),h:rand(6,17),a:rand(.06,.28)};
}
function drawPetals(){
  PETALS.forEach(p=>{
    p.x+=p.vx;p.y+=p.vy;p.angle+=p.spin;
    if(p.y>H+20){Object.assign(p,mkP());p.x=rand(0,W);p.y=-20;}
    if(p.x<-20)p.x=W+20;if(p.x>W+20)p.x=-20;
    gx.save();gx.globalAlpha=p.a;
    gx.translate(p.x,p.y);gx.rotate(p.angle);
    gx.beginPath();gx.ellipse(0,0,p.w*.38,p.h*.5,0,0,TWO_PI);
    gx.fillStyle='rgba(245,238,218,.9)';gx.fill();gx.restore();
  });
}

// ── Click burst petals ──
let bursts=[];
function burst(x,y,n=22){
  for(let i=0;i<n;i++){
    const a=rand(0,TWO_PI),s=rand(1.5,8);
    bursts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-rand(1,4),
      life:1,decay:rand(.015,.04),w:rand(3,10),h:rand(5,15),angle:rand(0,TWO_PI),spin:rand(-.08,.08)});
  }
}
function drawBursts(){
  for(let i=bursts.length-1;i>=0;i--){
    const p=bursts[i];
    p.x+=p.vx;p.y+=p.vy;p.vy+=.12;p.vx*=.97;p.angle+=p.spin;p.life-=p.decay;
    if(p.life<=0){bursts.splice(i,1);continue;}
    gx.save();gx.globalAlpha=p.life*.7;
    gx.translate(p.x,p.y);gx.rotate(p.angle);
    gx.beginPath();gx.ellipse(0,0,p.w*.38,p.h*.5,0,0,TWO_PI);
    gx.fillStyle='rgba(245,238,218,.9)';gx.fill();gx.restore();
  }
}

// ── Cursor ──
let cx=500,cy=300,tx=500,ty=300,trail=[];
window.addEventListener('mousemove',e=>{
  tx=e.clientX;ty=e.clientY;
  if(gF%2===0)trail.push({x:tx,y:ty,life:1,r:rand(1.5,3.5),decay:rand(.05,.1)});
});
function drawCursor(){
  cx=lerp(cx,tx,.15);cy=lerp(cy,ty,.15);
  for(let i=trail.length-1;i>=0;i--){
    const t=trail[i];t.life-=t.decay;
    if(t.life<=0){trail.splice(i,1);continue;}
    gx.globalAlpha=t.life*.14;gx.fillStyle='rgba(245,238,218,.9)';
    gx.beginPath();gx.arc(t.x,t.y,t.r*t.life,0,TWO_PI);gx.fill();
  }
  gx.globalAlpha=1;
  gx.fillStyle='rgba(245,238,218,.82)';
  gx.beginPath();gx.arc(cx,cy,4,0,TWO_PI);gx.fill();
  gx.strokeStyle='rgba(245,238,218,.18)';gx.lineWidth=1;
  gx.beginPath();gx.arc(tx,ty,13,0,TWO_PI);gx.stroke();
}

// Global loop
function gLoop(){
  gx.clearRect(0,0,W,H);
  drawPetals();drawBursts();drawCursor();
  gF++;requestAnimationFrame(gLoop);
}
gLoop();

// ══════════════════════════════════════
//  SEAL
// ══════════════════════════════════════
const sc=document.getElementById('seal-c'),sx=sc.getContext('2d');
sc.width=sc.height=56;
const SEALS=['卷','火','幕','云','水','爱'];
function drawSeal(ch){
  sx.clearRect(0,0,56,56);
  sx.fillStyle='rgba(162,28,18,.88)';sx.fillRect(3,3,50,50);
  sx.strokeStyle='rgba(120,18,10,.7)';sx.lineWidth=1.5;sx.strokeRect(7,7,42,42);
  sx.fillStyle='rgba(245,236,220,.92)';
  sx.font='bold 26px "Noto Serif SC"';sx.textAlign='center';sx.textBaseline='middle';
  sx.fillText(ch,28,30);
  sc.classList.add('show');
}

// ══════════════════════════════════════
//  SCENE ENGINE
// ══════════════════════════════════════
let scene=0,transiting=false;
const TOTAL=6;

function flashTransition(cb){
  if(transiting)return;transiting=true;
  const f=document.createElement('div');
  f.style.cssText='position:fixed;inset:0;z-index:999;background:#050402;opacity:0;transition:opacity .32s ease;pointer-events:none;';
  document.body.appendChild(f);
  void f.offsetWidth;f.style.opacity='1';
  setTimeout(()=>{
    cb();
    f.style.transition='opacity .65s ease';f.style.opacity='0';
    setTimeout(()=>{f.remove();transiting=false;},680);
  },340);
}

function goTo(idx){
  document.querySelectorAll('.scene').forEach(s=>s.classList.remove('active'));
  document.getElementById('s'+idx).classList.add('active');
  document.querySelectorAll('.dot').forEach((d,i)=>d.classList.toggle('on',i===idx));
  drawSeal(SEALS[idx]);
  INTROS[idx]&&INTROS[idx]();
  document.getElementById('prog-fill').style.width=`${(idx/(TOTAL-1))*100}%`;
}

function next(){
  if(transiting||scene>=TOTAL-1)return;
  flashTransition(()=>{scene++;goTo(scene);});
}
function restart(){flashTransition(()=>{scene=0;goTo(0);});}

document.addEventListener('click',e=>{
  if(e.target.id==='replay-btn')return;
  if(scene===TOTAL-1)return;
  burst(e.clientX,e.clientY,14);
  setTimeout(next,80);
});

// ══════════════════════════════════════
//  SCENE INTRO EFFECTS
// ══════════════════════════════════════
const INTROS=[

// ─────────────────────────────────────
// S0: SCROLL UNROLL — reveals xiagui
// ─────────────────────────────────────
function s0Intro(){
  const ov=document.getElementById('s0-overlay');
  const ey=document.getElementById('s0-ey');
  const k=document.getElementById('s0-k');
  const sub=document.getElementById('s0-s');
  const hint=document.querySelector('.click-hint');
  // Reset
  ov.style.transform='scaleX(1)';ov.style.transformOrigin='right center';
  [ey,k,sub].forEach(e=>{e.style.opacity='0';e.style.transform='';});
  hint.style.opacity='0';hint.style.animation='none';

  // Scroll unrolls left→right: overlay shrinks from right
  setTimeout(()=>{
    ov.style.transition='transform 1.8s cubic-bezier(.77,0,.175,1)';
    ov.style.transform='scaleX(0)';
  },200);

  // Text sequence
  setTimeout(()=>{
    ey.style.transition='opacity 1s ease';ey.style.opacity='1';
  },1400);
  setTimeout(()=>{
    k.style.transition='opacity 1.4s ease, transform 1.4s cubic-bezier(.2,.8,.2,1)';
    k.style.opacity='1';k.style.transform='scale(1)';
  },1700);
  setTimeout(()=>{
    sub.style.transition='opacity 1.2s ease';sub.style.opacity='1';
  },2600);
  setTimeout(()=>{
    hint.style.transition='opacity .5s ease';hint.style.opacity='1';
    hint.style.animation='pulse 3s ease-in-out infinite';
  },3200);
},

// ─────────────────────────────────────
// S1: FIRE BURNS edges inward — reveals nizan
// ─────────────────────────────────────
function s1Intro(){
  const canvas=document.getElementById('c1');
  canvas.width=W;canvas.height=H;
  const ctx=canvas.getContext('2d');
  const poem=document.getElementById('s1-poem');
  const lines=document.querySelectorAll('.sl');
  poem.classList.remove('show');
  lines.forEach(l=>l.classList.remove('show'));
  canvas.style.opacity='1';

  // Fire: erode from all 4 edges using expanding ellipse clip
  let progress=0;
  const cx2=W/2,cy2=H/2;
  const maxRX=W*.72,maxRY=H*.72;

  // Embers
  const embers=Array.from({length:60},()=>({
    x:rand(0,W),y:rand(0,H),
    vx:rand(-.5,.5),vy:rand(-2,-.3),
    life:rand(.4,1),decay:rand(.008,.02),
    r:rand(1,4),hue:rand(20,45)
  }));

  function drawFire(){
    ctx.clearRect(0,0,W,H);
    progress=Math.min(progress+.008,1);
    const eased=1-Math.pow(1-progress,3);

    // Dark mask with hole cut by fire
    ctx.save();
    ctx.fillStyle='rgba(5,4,2,.97)';
    ctx.beginPath();ctx.rect(0,0,W,H);
    // Subtract inner ellipse — irregular fire edge
    const pts=120;
    ctx.moveTo(cx2+maxRX*eased,cy2);
    for(let i=0;i<=pts;i++){
      const a=(i/pts)*TWO_PI;
      const wobble=1+Math.sin(a*7+progress*15)*.06+rand(-.03,.03);
      const rx=maxRX*eased*wobble;
      const ry=maxRY*eased*wobble;
      ctx.lineTo(cx2+Math.cos(a)*rx, cy2+Math.sin(a)*ry);
    }
    ctx.closePath();
    ctx.fill('evenodd');

    // Fire glow ring
    const fireGrad=ctx.createRadialGradient(cx2,cy2,maxRX*eased*.75,cx2,cy2,maxRX*eased*1.05);
    fireGrad.addColorStop(0,'rgba(255,120,20,0)');
    fireGrad.addColorStop(.5,`rgba(255,80,10,${.35*(1-progress)})`);
    fireGrad.addColorStop(.8,`rgba(200,40,5,${.5*(1-progress)})`);
    fireGrad.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=fireGrad;ctx.beginPath();ctx.rect(0,0,W,H);ctx.fill();

    // Embers
    embers.forEach(e=>{
      e.x+=e.vx;e.y+=e.vy;e.life-=e.decay;
      if(e.life<=0){
        e.x=rand(0,W);e.y=H+10;e.life=rand(.4,1);
        e.vx=rand(-.5,.5);e.vy=rand(-2,-.3);
      }
      // Only show embers near the fire ring
      const dx=e.x-cx2,dy=e.y-cy2;
      const dist=Math.sqrt(dx*dx+dy*dy);
      const ring=Math.min(maxRX,maxRY)*eased;
      if(Math.abs(dist-ring)<ring*.3){
        ctx.save();ctx.globalAlpha=e.life*.8;
        ctx.fillStyle=`hsl(${e.hue},95%,65%)`;
        ctx.shadowBlur=8;ctx.shadowColor=`hsl(${e.hue},95%,60%)`;
        ctx.beginPath();ctx.arc(e.x,e.y,e.r,0,TWO_PI);ctx.fill();
        ctx.restore();
      }
    });

    if(progress<1){requestAnimationFrame(drawFire);}
    else{
      // Fade out canvas
      let fa=1;
      (function fadeCanvas(){
        fa-=.03;canvas.style.opacity=Math.max(0,fa);
        if(fa>0)requestAnimationFrame(fadeCanvas);
        else canvas.style.opacity='0';
      })();
      poem.classList.add('show');
      lines.forEach((l,i)=>setTimeout(()=>l.classList.add('show'),300+i*300));
    }
  }
  setTimeout(drawFire,150);
},

// ─────────────────────────────────────
// S2: SILK CURTAIN — splits & falls
// ─────────────────────────────────────
function s2Intro(){
  const canvas=document.getElementById('c2');
  canvas.width=W;canvas.height=H;
  const ctx=canvas.getContext('2d');
  const label=document.querySelector('.s2-label');
  const title=document.querySelector('.s2-title');
  label.style.opacity='0';title.style.opacity='0';title.style.transform='translateY(20px)';
  canvas.style.opacity='1';

  // Two silk panels — left slides left, right slides right
  let splitX=0; // how far each panel has moved
  const maxSplit=W*.55;
  // Silk wave offset
  let waveT=0;

  function drawCurtain(){
    ctx.clearRect(0,0,W,H);
    splitX=Math.min(splitX+6,maxSplit);
    waveT+=.06;
    const ease=1-Math.pow(1-splitX/maxSplit,3);

    // Left panel
    ctx.save();
    ctx.fillStyle='rgba(20,14,8,.92)';
    // Silky wavy right edge
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.lineTo(W/2-splitX,0);
    for(let y=0;y<=H;y+=8){
      const wx=W/2-splitX+Math.sin(y*.018+waveT)*12*(1-ease*.7);
      ctx.lineTo(wx,y);
    }
    ctx.lineTo(0,H);ctx.closePath();
    // Silk sheen gradient
    const lg=ctx.createLinearGradient(0,0,W/2,0);
    lg.addColorStop(0,'rgba(12,9,5,.98)');
    lg.addColorStop(.7,'rgba(28,20,12,.9)');
    lg.addColorStop(1,'rgba(45,32,18,.6)');
    ctx.fillStyle=lg;ctx.fill();
    ctx.restore();

    // Right panel
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(W,0);
    ctx.lineTo(W/2+splitX,0);
    for(let y=0;y<=H;y+=8){
      const wx=W/2+splitX-Math.sin(y*.018+waveT+Math.PI)*12*(1-ease*.7);
      ctx.lineTo(wx,y);
    }
    ctx.lineTo(W,H);ctx.closePath();
    const lg2=ctx.createLinearGradient(W/2,0,W,0);
    lg2.addColorStop(0,'rgba(45,32,18,.6)');
    lg2.addColorStop(.3,'rgba(28,20,12,.9)');
    lg2.addColorStop(1,'rgba(12,9,5,.98)');
    ctx.fillStyle=lg2;ctx.fill();
    ctx.restore();

    // Gold trim on edges
    ctx.strokeStyle='rgba(200,160,60,.4)';ctx.lineWidth=2;
    // Left trim
    ctx.beginPath();ctx.moveTo(W/2-splitX,0);
    for(let y=0;y<=H;y+=8){
      ctx.lineTo(W/2-splitX+Math.sin(y*.018+waveT)*12*(1-ease*.7),y);
    }
    ctx.stroke();
    // Right trim
    ctx.beginPath();ctx.moveTo(W/2+splitX,0);
    for(let y=0;y<=H;y+=8){
      ctx.lineTo(W/2+splitX-Math.sin(y*.018+waveT+Math.PI)*12*(1-ease*.7),y);
    }
    ctx.stroke();

    if(splitX<maxSplit){requestAnimationFrame(drawCurtain);}
    else{
      let fa=1;
      (function fade(){fa-=.025;canvas.style.opacity=Math.max(0,fa);if(fa>0)requestAnimationFrame(fade);else canvas.style.opacity='0';})();
      setTimeout(()=>{label.style.transition='opacity 1s ease';label.style.opacity='1';},200);
      setTimeout(()=>{
        title.style.transition='opacity 1.2s ease,transform 1.2s ease';
        title.style.opacity='1';title.style.transform='none';
      },700);
    }
  }
  setTimeout(drawCurtain,150);
},

// ─────────────────────────────────────
// S3: CLOUDS PART from centre
// ─────────────────────────────────────
function s3Intro(){
  const canvas=document.getElementById('c3');
  canvas.width=W;canvas.height=H;
  const ctx=canvas.getContext('2d');
  const lines=document.querySelectorAll('.s3-line');
  lines.forEach(l=>{l.style.opacity='0';l.style.transform='translateX(-30px)';});
  canvas.style.opacity='1';

  // Cloud particles — start packed at centre, drift outward
  const NUM=180;
  const clouds=Array.from({length:NUM},()=>{
    const a=rand(0,TWO_PI);
    const startR=rand(0,W*.08);
    return{
      x:W/2+Math.cos(a)*startR, y:H/2+Math.sin(a)*startR,
      vx:Math.cos(a)*rand(1.5,5), vy:Math.sin(a)*rand(1,3.5)-rand(.5,1.5),
      size:rand(40,140), alpha:rand(.55,.9),
      decay:rand(.004,.012)
    };
  });

  function drawClouds(){
    ctx.clearRect(0,0,W,H);
    let alive=false;
    clouds.forEach(c=>{
      c.x+=c.vx;c.y+=c.vy;c.alpha-=c.decay;c.vx*=.98;c.vy*=.98;
      if(c.alpha<=0)return;
      alive=true;
      ctx.save();
      ctx.globalAlpha=c.alpha;
      const g=ctx.createRadialGradient(c.x,c.y,0,c.x,c.y,c.size);
      g.addColorStop(0,'rgba(220,215,205,.85)');
      g.addColorStop(.5,'rgba(200,195,182,.5)');
      g.addColorStop(1,'rgba(180,175,162,0)');
      ctx.fillStyle=g;
      ctx.beginPath();ctx.arc(c.x,c.y,c.size,0,TWO_PI);ctx.fill();
      ctx.restore();
    });
    if(alive){requestAnimationFrame(drawClouds);}
    else{
      canvas.style.opacity='0';
      lines.forEach((l,i)=>setTimeout(()=>{
        l.style.transition='opacity .9s ease,transform .9s ease';
        l.style.opacity='1';l.style.transform='none';
      },200+i*320));
    }
  }
  setTimeout(drawClouds,100);
},

// ─────────────────────────────────────
// S4: WATER RIPPLE spreads from centre
// ─────────────────────────────────────
function s4Intro(){
  const canvas=document.getElementById('c4');
  const panel=document.getElementById('s4-right');
  const letter=document.getElementById('s4-letter');
  letter.classList.remove('show');
  canvas.width=panel.offsetWidth||W*.5;canvas.height=H;
  const ctx=canvas.getContext('2d');
  canvas.style.opacity='1';

  // Dark overlay with ripple rings eating it away
  const ripples=[];
  let spawnCount=0;
  const cx2=canvas.width/2, cy2=H/2;

  function spawnRipple(){
    ripples.push({r:0,maxR:Math.max(canvas.width,H)*1.1,speed:rand(5,9),alpha:.9});
  }
  spawnRipple();

  function drawWater(){
    ctx.clearRect(0,0,canvas.width,H);

    // Dark base
    ctx.fillStyle='rgba(5,4,2,.97)';ctx.fillRect(0,0,canvas.width,H);

    // Each ripple punches a "hole" (lighter reveal)
    ripples.forEach(rp=>{
      rp.r+=rp.speed;rp.alpha=Math.max(0,rp.alpha-.008);
      // Water ring glow
      ctx.save();
      for(let ring=0;ring<4;ring++){
        const rr=rp.r-ring*18;if(rr<0)continue;
        const ringA=(rp.alpha*(4-ring)/4)*.6;
        ctx.strokeStyle=`rgba(160,200,220,${ringA})`;
        ctx.lineWidth=2-ring*.3;
        ctx.beginPath();ctx.arc(cx2,cy2,rr,0,TWO_PI);ctx.stroke();
      }
      // Clear circle — composite
      ctx.globalCompositeOperation='destination-out';
      const g=ctx.createRadialGradient(cx2,cy2,Math.max(0,rp.r-60),cx2,cy2,rp.r);
      g.addColorStop(0,'rgba(0,0,0,.85)');
      g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx2,cy2,rp.r,0,TWO_PI);ctx.fill();
      ctx.globalCompositeOperation='source-over';
      ctx.restore();
    });

    // Spawn more ripples
    if(spawnCount<3 && ripples[ripples.length-1].r>canvas.width*.25){
      spawnRipple();spawnCount++;
    }

    const allGone=ripples.every(r=>r.r>Math.max(canvas.width,H)*1.05);
    if(!allGone){requestAnimationFrame(drawWater);}
    else{
      let fa=1;
      (function fadeC(){fa-=.025;canvas.style.opacity=Math.max(0,fa);if(fa>0)requestAnimationFrame(fadeC);else canvas.style.opacity='0';})();
      letter.classList.add('show');
    }
  }
  setTimeout(drawWater,200);
},

// ─────────────────────────────────────
// S5: PETAL BLOOM — bg brightens, text rises
// ─────────────────────────────────────
function s5Intro(){
  const photo=document.querySelector('.s5-photo');
  const main=document.querySelector('.s5-main');
  const sub=document.querySelector('.s5-sub');
  const btn=document.getElementById('replay-btn');
  photo.style.filter='saturate(0%) brightness(.5)';
  [main,sub,btn].forEach(e=>{e.style.opacity='0';e.style.transition='';});
  main.style.transform='scale(.9)';

  // Bloom — massive petal burst
  burst(W/2,H*.45,60);

  setTimeout(()=>{
    photo.style.transition='filter 2.5s ease';
    photo.style.filter='saturate(100%) brightness(1)';
  },100);
  setTimeout(()=>{
    // Keep spawning petals
    const iv=setInterval(()=>burst(rand(W*.2,W*.8),rand(H*.2,H*.8),8),300);
    setTimeout(()=>clearInterval(iv),2000);
  },200);
  setTimeout(()=>{
    main.style.transition='opacity 1.4s ease,transform 1.4s cubic-bezier(.2,.8,.2,1)';
    main.style.opacity='1';main.style.transform='scale(1)';
  },700);
  setTimeout(()=>{sub.style.transition='opacity 1.2s ease';sub.style.opacity='1';},1800);
  setTimeout(()=>{btn.style.transition='opacity 1s ease';btn.style.opacity='1';btn.style.pointerEvents='all';},2600);
}

];

// ══════════════════════════════════════
//  PROGRESS DOTS
// ══════════════════════════════════════
const dotsEl=document.getElementById('dots');
for(let i=0;i<TOTAL;i++){
  const d=document.createElement('span');d.className='dot'+(i===0?' on':'');
  d.addEventListener('click',()=>{if(!transiting&&i!==scene)flashTransition(()=>{scene=i;goTo(i);});});
  dotsEl.appendChild(d);
}

// ══════════════════════════════════════
//  START
// ══════════════════════════════════════
goTo(0);