// ═══════════════════════════════════════════════════
//  Character/specials.js  —  8 Special Weapons
//  แก้ SPECIALS_CONFIG เพื่อเปลี่ยนอาวุธหรือปรับค่า
// ═══════════════════════════════════════════════════

// ─────────────────────────────────────────────────────
//  SPECIALS CONFIG  ← แก้ตรงนี้เพื่อปรับแต่งอาวุธ
// ─────────────────────────────────────────────────────
const SPECIALS_CONFIG = [
  {
    id          : 'flame',
    hud         : 'FLAME',
    name        : '🔥 Flame Burst',
    desc        : 'ยิง 12 นัดกระจาย 180°',
    imgKey      : 'specialFlame',
    color       : 'rgb(255,120,0)',
    glowColor   : 'rgba(255,80,0,0.6)',
    damage      : 15,       // ดาเมจต่อนัด
    count       : 12,       // จำนวนนัด
    spreadDeg   : 180,      // องศาที่กระจาย
    speed       : 7,        // ความเร็วกระสุน
  },
  {
    id          : 'thunder',
    hud         : 'THUNDER',
    name        : '⚡ Thunder Strike',
    desc        : 'สายฟ้าล็อคเป้าศัตรูใกล้สุด',
    imgKey      : 'specialThunder',
    color       : 'rgb(200,150,255)',
    glowColor   : 'rgba(180,100,255,0.6)',
    damage      : 80,       // ดาเมจ homing bullet
    speed       : 10,       // ความเร็ว
    turnSpeed   : 0.12,     // ความเร็วหัน (radian/frame)
  },
  {
    id          : 'tornado',
    hud         : 'TORNADO',
    name        : '🌀 Tornado',
    desc        : 'bullet วนรอบตัวแล้วพุ่งออก',
    imgKey      : 'specialTornado',
    color       : 'rgb(80,180,255)',
    glowColor   : 'rgba(60,160,255,0.6)',
    damage      : 100,      // ดาเมจต่อนัด
    orbitCount  : 6,        // จำนวน bullet วนรอบ
    orbitRadius : 60,       // รัศมีวนรอบ
    orbitSpeed  : 0.18,     // ความเร็ววน (radian/frame)
    orbitTime   : 60,       // เฟรมที่วนก่อนพุ่ง
  },
  {
    id          : 'bigbomb',
    hud         : 'BIG BOMB',
    name        : '💣 Big Bomb',
    desc        : 'ระเบิดพื้นที่วงกว้าง',
    imgKey      : 'specialBigbomb',
    color       : 'rgb(220,60,60)',
    glowColor   : 'rgba(220,30,30,0.6)',
    damage      : 400,      // ดาเมจ (boss)
    radius      : 130,      // รัศมีระเบิด
    speed       : 5,        // ความเร็วลูกบอม
    fuseTime    : 30,       // เฟรมก่อนระเบิด (เร็วขึ้น)
  },
  {
    id          : 'starrain',
    hud         : 'STAR RAIN',
    name        : '🌟 Star Rain',
    desc        : 'ดาวตก 8 ดวงจากด้านบน',
    imgKey      : 'specialStarrain',
    color       : 'rgb(255,220,0)',
    glowColor   : 'rgba(255,200,0,0.6)',
    damage      : 50,       // ดาเมจต่อดาว
    count       : 8,        // จำนวนดาว
    speed       : 9,        // ความเร็วตก
    spread      : 320,      // ความกว้างที่กระจาย (px)
  },
  {
    id          : 'barrier',
    hud         : 'BARRIER',
    name        : '🛡️ Barrier',
    desc        : 'กำแพงดูดซับกระสุนบอส 5 วิ',
    imgKey      : 'specialBarrier',
    color       : 'rgb(0,220,255)',
    glowColor   : 'rgba(0,200,255,0.5)',
    duration    : 300,      // เฟรมที่ barrier อยู่ (5 วิ @ 60fps)
    width       : 200,      // ความกว้าง barrier
    height      : 12,       // ความสูง barrier
    offsetY     : 40,       // ระยะเหนือผู้เล่น
  },
  {
    id          : 'laser',
    hud         : 'LASER',
    name        : '🎯 Laser',
    desc        : 'เลเซอร์ยาวทะลุทุกอย่าง',
    imgKey      : 'specialLaser',
    color       : 'rgb(255,60,60)',
    glowColor   : 'rgba(255,0,0,0.5)',
    damage      : 12,       // ดาเมจต่อเฟรมที่โดน (laser ยิงนาน 90f = 1080 total > thunder 80)
    duration    : 120,      // เฟรมที่เลเซอร์ยิง (2 วิ)
    width       : 18,       // ความกว้าง beam
  },
  {
    id          : 'wave',
    hud         : 'WAVE',
    name        : '🌊 Wave Bomb',
    desc        : 'คลื่นระเบิดแผ่รอบตัว',
    imgKey      : 'specialWave',
    color       : 'rgb(0,255,180)',
    glowColor   : 'rgba(0,220,180,0.5)',
    damage      : 150,      // ดาเมจต่อครั้งที่โดน
    maxRadius   : 380,      // รัศมีสูงสุด — ครอบคลุมบอสที่อยู่บนสุด
    expandSpeed : 14,       // px/frame ที่ขยาย
    duration    : 40,       // เฟรมทั้งหมด
  },
];

// ─────────────────────────────────────────────────────
//  Base class
// ─────────────────────────────────────────────────────
class SpecialBase {
  constructor(cfg) {
    this.cfg   = cfg;
    this.alive = true;
    this._t    = 0;
  }
  update() { this._t++; }
  draw(ctx) {}
  getRect() { return null; }  // override ถ้าต้องการ collision
  // helper: glow circle
  _glow(ctx, x, y, r, col) {
    const g = ctx.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0, col); g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
  }
}

// ─────────────────────────────────────────────────────
//  1. FLAME — 12 นัดกระจาย 180° ด้านบน
// ─────────────────────────────────────────────────────
class SpecialFlameBullet extends SpecialBase {
  constructor(x, y, vx, vy, cfg) {
    super(cfg);
    this.x=x; this.y=y; this.vx=vx; this.vy=vy;
    this.r=8;
  }
  get cx(){return this.x;} get cy(){return this.y;}
  get w(){return this.r*2;} get h(){return this.r*2;}

  update() {
    super.update();
    this.x+=this.vx; this.y+=this.vy;
    if(this.y<HUD_H||this.y>HUD_H+GAME_H||this.x<0||this.x>WIDTH) this.alive=false;
  }
  draw(ctx) {
    ctx.save();
    this._glow(ctx,this.x,this.y,this.r*2.5,this.cfg.glowColor);
    ctx.fillStyle = this.cfg.color;
    ctx.beginPath(); ctx.arc(this.x,this.y,this.r*(0.8+0.2*Math.sin(this._t*0.5)),0,Math.PI*2); ctx.fill();
    ctx.restore();
  }
  getRect(){return{x:this.x-this.r,y:this.y-this.r,w:this.r*2,h:this.r*2};}
}

function createSpecialFlame(px,py,cfg){
  const bullets=[];
  const half = cfg.spreadDeg/2;
  for(let i=0;i<cfg.count;i++){
    const deg = -90 - half/2 + (cfg.spreadDeg/(cfg.count-1))*i;
    const rad = deg*Math.PI/180;
    bullets.push(new SpecialFlameBullet(px,py, Math.cos(rad)*cfg.speed, Math.sin(rad)*cfg.speed, cfg));
  }
  return bullets;
}

// ─────────────────────────────────────────────────────
//  2. THUNDER — Homing bullet ล็อคศัตรูใกล้สุด
// ─────────────────────────────────────────────────────
class SpecialThunderBullet extends SpecialBase {
  constructor(x,y,cfg,enemies,boss){
    super(cfg);
    this.x=x; this.y=y; this.r=10;
    this._enemies=enemies;
    this._boss=boss||null;
    this._angle = -Math.PI/2;  // เริ่มยิงขึ้น
    this._vx=Math.cos(this._angle)*cfg.speed;
    this._vy=Math.sin(this._angle)*cfg.speed;
    this._trail=[];
  }
  get cx(){return this.x;} get cy(){return this.y;}
  get w(){return this.r*2;} get h(){return this.r*2;}

  update(){
    super.update();
    // ล็อคบอสก่อนถ้ามี ไม่งั้นหา enemy ใกล้สุด
    let target = null;
    if (this._boss && this._boss.alive) {
      target = this._boss;
    } else {
      let minD = 9999;
      for(const e of this._enemies){
        if(!e.alive) continue;
        const d=Math.hypot(e.cx-this.x,e.cy-this.y);
        if(d<minD){minD=d;target=e;}
      }
    }
    if(target){
      const ta=Math.atan2(target.cy-this.y,target.cx-this.x);
      let da=ta-this._angle;
      while(da>Math.PI)da-=Math.PI*2;
      while(da<-Math.PI)da+=Math.PI*2;
      this._angle+=Math.sign(da)*Math.min(Math.abs(da),this.cfg.turnSpeed);
      this._vx=Math.cos(this._angle)*this.cfg.speed;
      this._vy=Math.sin(this._angle)*this.cfg.speed;
    }
    this._trail.push({x:this.x,y:this.y});
    if(this._trail.length>12) this._trail.shift();
    this.x+=this._vx; this.y+=this._vy;
    if(this.y<HUD_H-20||this.y>HUD_H+GAME_H+20||this.x<-20||this.x>WIDTH+20) this.alive=false;
    if(this._t>180) this.alive=false;  // timeout 3 วิ
  }
  draw(ctx){
    ctx.save();
    // trail
    this._trail.forEach((p,i)=>{
      const a=i/this._trail.length;
      ctx.fillStyle=`rgba(200,150,255,${a*0.5})`;
      ctx.beginPath(); ctx.arc(p.x,p.y,this.r*a*0.6,0,Math.PI*2); ctx.fill();
    });
    this._glow(ctx,this.x,this.y,this.r*3,this.cfg.glowColor);
    ctx.fillStyle='rgb(255,255,150)';
    ctx.beginPath(); ctx.arc(this.x,this.y,this.r,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=this.cfg.color;
    ctx.beginPath(); ctx.arc(this.x,this.y,this.r*0.6,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }
  getRect(){return{x:this.x-this.r,y:this.y-this.r,w:this.r*2,h:this.r*2};}
}

function createSpecialThunder(px,py,cfg,enemies,boss){
  return [new SpecialThunderBullet(px,py,cfg,enemies,boss)];
}

// ─────────────────────────────────────────────────────
//  3. TORNADO — orbit รอบผู้เล่น แล้วพุ่งออก
// ─────────────────────────────────────────────────────
class SpecialTornadoBullet extends SpecialBase {
  constructor(cfg, player, indexAngle, orbitTime){
    super(cfg);
    this._player=player;
    this._orbitAngle=indexAngle;
    this._phase='orbit';
    this.x=player.cx; this.y=player.cy;
    this.r=9; this._vx=0; this._vy=0;
    this._orbitEnd=orbitTime;  // แต่ละตัวมี timer แยก
  }
  get cx(){return this.x;} get cy(){return this.y;}
  get w(){return this.r*2;} get h(){return this.r*2;}

  update(){
    super.update();
    if(this._phase==='orbit'){
      this._orbitAngle+=this.cfg.orbitSpeed;
      this.x=this._player.cx+Math.cos(this._orbitAngle)*this.cfg.orbitRadius;
      this.y=this._player.cy+Math.sin(this._orbitAngle)*this.cfg.orbitRadius;
      if(this._t>=this._orbitEnd){
        this._phase='fly';
        // พุ่งขึ้นตรงๆ ทุกตัว โดยมีเฉียงซ้าย/ขวาตาม orbit position
        const side = Math.cos(this._orbitAngle);  // -1 ถึง +1
        this._vx = side * 4;   // เฉียงซ้าย/ขวาเล็กน้อย
        this._vy = -12;         // พุ่งขึ้นแรง
      }
    } else {
      this.x+=this._vx; this.y+=this._vy;
      if(this.y<HUD_H-20||this.y>HUD_H+GAME_H+20||this.x<-20||this.x>WIDTH+20) this.alive=false;
    }
  }
  draw(ctx){
    ctx.save();
    this._glow(ctx,this.x,this.y,this.r*2,this.cfg.glowColor);
    ctx.strokeStyle=this.cfg.color; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(this.x,this.y,this.r,0,Math.PI*2); ctx.stroke();
    ctx.fillStyle='rgba(80,180,255,0.7)';
    ctx.beginPath(); ctx.arc(this.x,this.y,this.r*0.5,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }
  getRect(){
    if(this._phase==='orbit') return null;
    return{x:this.x-this.r,y:this.y-this.r,w:this.r*2,h:this.r*2};
  }
}

function createSpecialTornado(px,py,cfg,player){
  const bullets=[];
  for(let i=0;i<cfg.orbitCount;i++){
    const a=(2*Math.PI/cfg.orbitCount)*i;
    // stagger: แต่ละตัวพุ่งออกต่างเวลากัน
    const orbitEnd = cfg.orbitTime + i*10;
    const b = new SpecialTornadoBullet(cfg,player,a,orbitEnd);
    bullets.push(b);
  }
  return bullets;
}

// ─────────────────────────────────────────────────────
//  4. BIG BOMB — ลูกเดียวพุ่งขึ้น แล้วระเบิด area
// ─────────────────────────────────────────────────────
class SpecialBigBomb extends SpecialBase {
  constructor(x,y,cfg){
    super(cfg);
    this.x=x; this.y=y; this.r=14;
    this._vy=-cfg.speed;
    this._phase='fly';  // fly → explode
    this._expR=0;
  }
  get cx(){return this.x;} get cy(){return this.y;}
  get w(){return this.r*2;} get h(){return this.r*2;}

  update(){
    super.update();
    if(this._phase==='fly'){
      this.y+=this._vy;
      if(this.y<HUD_H+60||this._t>=this.cfg.fuseTime){
        this._phase='explode'; this._expT=0;
      }
    } else {
      this._expT++;
      this._expR=Math.max(1, Math.min(this.cfg.radius, this._expT*(this.cfg.radius/15)));
      if(this._expT>25) this.alive=false;
    }
  }
  draw(ctx){
    ctx.save();
    if(this._phase==='fly'){
      this._glow(ctx,this.x,this.y,this.r*2,this.cfg.glowColor);
      // ลูกระเบิด
      ctx.fillStyle='rgb(40,40,40)';
      ctx.beginPath(); ctx.arc(this.x,this.y,this.r,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='rgb(220,60,60)';
      ctx.beginPath(); ctx.arc(this.x-5,this.y-5,this.r*0.4,0,Math.PI*2); ctx.fill();
      // ชนวน
      ctx.strokeStyle='rgb(255,180,0)'; ctx.lineWidth=3;
      ctx.beginPath(); ctx.moveTo(this.x,this.y-this.r);
      ctx.quadraticCurveTo(this.x+10,this.y-this.r-15,this.x+5,this.y-this.r-25); ctx.stroke();
    } else {
      // explosion
      const prog=this._expT/25;
      const alpha=1-prog;
      if(this._expR<2){ ctx.restore(); return; }
      this._glow(ctx,this.x,this.y,this._expR*1.2,`rgba(255,100,0,${alpha*0.5})`);
      ctx.strokeStyle=`rgba(255,200,0,${alpha})`;
      ctx.lineWidth=5*(1-prog*0.5);
      ctx.beginPath(); ctx.arc(this.x,this.y,this._expR,0,Math.PI*2); ctx.stroke();
      ctx.strokeStyle=`rgba(255,80,0,${alpha*0.7})`;
      ctx.lineWidth=8;
      ctx.beginPath(); ctx.arc(this.x,this.y,this._expR*0.6,0,Math.PI*2); ctx.stroke();
    }
    ctx.restore();
  }
  getRect(){
    if(this._phase==='fly') return{x:this.x-this.r,y:this.y-this.r,w:this.r*2,h:this.r*2};
    if(this._phase==='explode'&&this._expR>2) return{x:this.x-this._expR,y:this.y-this._expR,w:this._expR*2,h:this._expR*2};
    return null;
  }
}

function createSpecialBigBomb(px,py,cfg){
  return [new SpecialBigBomb(px,py,cfg)];
}

// ─────────────────────────────────────────────────────
//  5. STAR RAIN — ดาว 8 ดวงตกจากด้านบน
// ─────────────────────────────────────────────────────
class SpecialStarBullet extends SpecialBase {
  constructor(x,cfg){
    super(cfg);
    this.x=x; this.y=HUD_H-10; this.r=12;
    this._vy=cfg.speed;
    this._rot=0;
  }
  get cx(){return this.x;} get cy(){return this.y;}
  get w(){return this.r*2;} get h(){return this.r*2;}

  update(){
    super.update();
    this.y+=this._vy; this._rot+=0.15;
    if(this.y>HUD_H+GAME_H+20) this.alive=false;
  }
  _drawStar(ctx,cx,cy,ro,ri,pts,rot){
    ctx.beginPath();
    for(let i=0;i<pts*2;i++){
      const a=rot+i*Math.PI/pts;
      const r2=i%2===0?ro:ri;
      i===0?ctx.moveTo(cx+r2*Math.cos(a),cy+r2*Math.sin(a)):ctx.lineTo(cx+r2*Math.cos(a),cy+r2*Math.sin(a));
    }
    ctx.closePath();
  }
  draw(ctx){
    ctx.save();
    this._glow(ctx,this.x,this.y,this.r*2.5,this.cfg.glowColor);
    ctx.fillStyle='rgb(255,220,0)';
    this._drawStar(ctx,this.x,this.y,this.r,this.r*0.45,5,this._rot); ctx.fill();
    ctx.fillStyle='rgb(255,255,180)';
    this._drawStar(ctx,this.x,this.y,this.r*0.5,this.r*0.2,5,this._rot+0.3); ctx.fill();
    ctx.restore();
  }
  getRect(){return{x:this.x-this.r,y:this.y-this.r,w:this.r*2,h:this.r*2};}
}

function createSpecialStarRain(px,py,cfg){
  const bullets=[];
  for(let i=0;i<cfg.count;i++){
    const x=Math.max(20,Math.min(WIDTH-20, px - cfg.spread/2 + (cfg.spread/(cfg.count-1))*i + (Math.random()-0.5)*30));
    const b=new SpecialStarBullet(x,cfg);
    b._t=-i*8;  // stagger
    bullets.push(b);
  }
  return bullets;
}

// ─────────────────────────────────────────────────────
//  6. BARRIER — กำแพงเหนือผู้เล่น ดูดซับกระสุนบอส
// ─────────────────────────────────────────────────────
class SpecialBarrier extends SpecialBase {
  constructor(cfg,player){
    super(cfg);
    this._player=player;
    this._hp=8;  // รับกระสุนได้ 8 ลูก
    this.w=cfg.width; this.h=cfg.height;
    this.alive=true;
    this._flash=0;
  }
  get x(){return this._player.cx-this.w/2;}
  get y(){return this._player.y-this.cfg.offsetY-this.h;}
  get cx(){return this._player.cx;}
  get cy(){return this.y+this.h/2;}

  onHit(){
    this._hp--;
    this._flash=8;
    if(this._hp<=0) this.alive=false;
  }

  update(){
    super.update();
    if(this._flash>0) this._flash--;
    if(this._t>=this.cfg.duration) this.alive=false;
  }
  draw(ctx){
    const prog=this._t/this.cfg.duration;
    const fade=prog>0.8?(1-prog)/0.2:1;
    const flash=this._flash>0;
    ctx.save();
    ctx.globalAlpha=fade*0.9;
    // glow
    this._glow(ctx,this.cx,this.cy,this.w*0.6,flash?'rgba(255,255,255,0.3)':this.cfg.glowColor);
    // bar
    ctx.fillStyle=flash?'rgb(255,255,255)':`rgba(0,200,255,${0.4+0.2*Math.sin(this._t*0.2)})`;
    ctx.beginPath(); ctx.roundRect(this.x,this.y,this.w,this.h,this.h/2); ctx.fill();
    ctx.strokeStyle=flash?'#fff':this.cfg.color;
    ctx.lineWidth=2; ctx.stroke();
    // HP dots
    const dotW=this.w/(this._hp+1);
    for(let i=0;i<this._hp;i++){
      ctx.fillStyle='rgba(255,255,255,0.8)';
      ctx.beginPath(); ctx.arc(this.x+dotW*(i+1),this.cy,3,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }
  getRect(){return{x:this.x,y:this.y,w:this.w,h:this.h};}
}

function createSpecialBarrier(px,py,cfg,player){
  return [new SpecialBarrier(cfg,player)];
}

// ─────────────────────────────────────────────────────
//  7. LASER — beam ยาวต่อเนื่อง damage ทุก frame
// ─────────────────────────────────────────────────────
class SpecialLaser extends SpecialBase {
  constructor(x,cfg){
    super(cfg);
    this.x=x; this.y=HUD_H;
    this.w=cfg.width; this.h=GAME_H;
    this._hitCooldown={};  // enemy id → cooldown
  }
  get cx(){return this.x;} get cy(){return this.y+this.h/2;}

  update(){
    super.update();
    if(this._t>=this.cfg.duration) this.alive=false;
  }
  draw(ctx){
    const prog=this._t/this.cfg.duration;
    const fade=prog>0.85?(1-prog)/0.15:1;
    const pulse=0.85+0.15*Math.sin(this._t*0.4);
    ctx.save();
    ctx.globalAlpha=fade;
    // outer glow
    const grd=ctx.createLinearGradient(this.x-this.w*2,0,this.x+this.w*2,0);
    grd.addColorStop(0,'rgba(255,0,0,0)');
    grd.addColorStop(0.5,`rgba(255,60,60,${0.4*pulse})`);
    grd.addColorStop(1,'rgba(255,0,0,0)');
    ctx.fillStyle=grd;
    ctx.fillRect(this.x-this.w*2,this.y,this.w*4,this.h);
    // core beam
    const beamGrd=ctx.createLinearGradient(this.x-this.w/2,0,this.x+this.w/2,0);
    beamGrd.addColorStop(0,'rgba(255,100,100,0.6)');
    beamGrd.addColorStop(0.5,`rgba(255,255,200,${pulse})`);
    beamGrd.addColorStop(1,'rgba(255,100,100,0.6)');
    ctx.fillStyle=beamGrd;
    ctx.fillRect(this.x-this.w/2,this.y,this.w,this.h);
    ctx.restore();
  }
  // Laser ใช้ special collision ใน game.js
  getRect(){return{x:this.x-this.w/2,y:this.y,w:this.w,h:this.h};}
}

function createSpecialLaser(px,py,cfg){
  return [new SpecialLaser(px,cfg)];
}

// ─────────────────────────────────────────────────────
//  8. WAVE BOMB — คลื่นแผ่ออกรอบตัว
// ─────────────────────────────────────────────────────
class SpecialWave extends SpecialBase {
  constructor(x,y,cfg){
    super(cfg);
    this.x=x; this.y=y; this._r=10;
    this._hitSet=new Set();
  }
  get cx(){return this.x;} get cy(){return this.y;}
  get r(){return this._r;}

  update(){
    super.update();
    this._r=Math.max(5, Math.min(this.cfg.maxRadius, 10+this._t*this.cfg.expandSpeed));
    if(this._t>=this.cfg.duration) this.alive=false;
  }
  draw(ctx){
    const prog=this._t/this.cfg.duration;
    const alpha=1-prog;
    ctx.save();
    // 3 วง concentric
    [1, 0.65, 0.35].forEach((scale,i)=>{
      const r2=this._r*scale;
      ctx.strokeStyle=`rgba(0,255,${150+i*35},${alpha*(1-i*0.25)})`;
      ctx.lineWidth=6-i*1.5;
      ctx.beginPath(); ctx.arc(this.x,this.y,r2,0,Math.PI*2); ctx.stroke();
    });
    this._glow(ctx,this.x,this.y,this._r*0.4,`rgba(0,255,180,${alpha*0.3})`);
    ctx.restore();
  }
  getCircle(){return{x:this.x,y:this.y,r:this._r};}
  getRect(){return{x:this.x-this._r,y:this.y-this._r,w:this._r*2,h:this._r*2};}
}

function createSpecialWave(px,py,cfg){
  return [new SpecialWave(px,py,cfg)];
}

// ─────────────────────────────────────────────────────
//  Factory — สร้าง special ตาม id
// ─────────────────────────────────────────────────────
function createSpecial(id, px, py, player, enemies, boss) {
  const cfg = SPECIALS_CONFIG.find(c=>c.id===id);
  if(!cfg) return [];
  switch(id){
    case 'flame':    return createSpecialFlame(px,py,cfg);
    case 'thunder':  return createSpecialThunder(px,py,cfg,enemies,boss);
    case 'tornado':  return createSpecialTornado(px,py,cfg,player);
    case 'bigbomb':  return createSpecialBigBomb(px,py,cfg);
    case 'starrain': return createSpecialStarRain(px,py,cfg);
    case 'barrier':  return createSpecialBarrier(px,py,cfg,player);
    case 'laser':    return createSpecialLaser(px,py,cfg);
    case 'wave':     return createSpecialWave(px,py,cfg);
    default:         return [];
  }
}
