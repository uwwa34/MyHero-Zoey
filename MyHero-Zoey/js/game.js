// ═══════════════════════════════════════════════════
//  js/game.js  —  Game class (main loop)
// ═══════════════════════════════════════════════════

class Game {
  constructor(canvas, images, sounds) {
    this.canvas   = canvas;
    this.ctx      = canvas.getContext('2d');
    this.images   = images;
    this.sounds   = sounds;
    this.state    = STATE.INTRO;
    this.running  = true;
    this.lastTime = 0;
    this.accumulator = 0;
    this.stepMs   = 1000 / FPS;

    this.enemies  = []; this.bullets  = [];
    this.bbullets = []; this.ebullets = [];
    this.items    = [];

    this.player   = new Player(images);
    this.cage     = new Cage();
    this.boss     = new Boss(images);
    this.friend   = new Friend(images, WIDTH/2, HUD_H + GAME_H/2);

    this.spawnTimer = 0; this.killed = 0;
    this.introTimer = 0; this.introPhase = 0;
    this.boss.y = HUD_H - 150;
    this.gameTimer      = 0;    // นับเฟรมตั้งแต่เริ่ม PLAYING (ใช้คำนวณ bonus)
    this.gameTimerActive = false;

    this.victoryTimer   = 0;
    this.victoryCanExit = false;
    this.reachedFriend  = false;
    this.gameOverTimer  = 0;
    this.gameOverReady  = false;

    // Ranking
    this.rankingScreen = new RankingScreen(canvas);
    this.specialType   = ACTIVE_SPECIAL;  // กำหนดจาก settings.js

    this.keys   = {};
    this.joypad = new VirtualJoypad(canvas);
    this.joypad._onShoot = () => this._joyShoot();
    this.joypad._onBomb  = () => this._joyBomb();



    this._bindRankingTap(canvas);
    this._bindKeys();
    this._playBGM();
  }

  // ── Audio ─────────────────────────────────────────
  _playBGM() {
    if (!this.sounds.bgm) return;
    this.sounds.bgm.loop   = true;
    this.sounds.bgm.volume = 0.4;
    // ถ้า AudioContext ยัง suspended (iOS ก่อน interact) → เก็บ pending ไว้
    const p = this.sounds.bgm.play();
    if (p !== undefined) {
      p.catch(() => {
        // autoplay blocked → mark pending, จะ play เมื่อ user interact
        this._bgmPending = true;
      });
    }
  }

  // เรียกหลัง user interaction ครั้งแรก เพื่อ resume pending BGM
  _resumeBGMIfPending() {
    if (!this._bgmPending) return;
    this._bgmPending = false;
    this.sounds.bgm.play().catch(() => {});
  }
  _stopBGM() {
    if (!this.sounds.bgm) return;
    this.sounds.bgm.pause(); this.sounds.bgm.currentTime=0;
  }
  _play(key) {
    const s = this.sounds[key]; if (!s) return;
    // Audio pool: reuse existing Audio ถ้า paused อยู่ หรือ clone สูงสุด 4 ตัว
    if (!this._audioPool) this._audioPool = {};
    if (!this._audioPool[key]) this._audioPool[key] = [];
    const pool = this._audioPool[key];
    let node = pool.find(n => n.paused || n.ended);
    if (!node) {
      if (pool.length < 4) { node = s.cloneNode(); node.volume = 0.6; pool.push(node); }
      else { node = pool[0]; }  // reuse oldest
    }
    node.currentTime = 0;
    node.play().catch(() => {});
  }

  // ── Keys ──────────────────────────────────────────
  _bindRankingTap(canvas) {
    const toCanvas = (clientX, clientY) => {
      const r = canvas.getBoundingClientRect();
      return [(clientX-r.left)*WIDTH/r.width, (clientY-r.top)*HEIGHT/r.height];
    };
    canvas.addEventListener('touchstart', e => {
      if (!this.rankingScreen.visible) return;
      e.preventDefault();
      const [x,y] = toCanvas(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
      this.rankingScreen.handleTap(x, y);
    }, { passive: false });
    canvas.addEventListener('mousedown', e => {
      if (!this.rankingScreen.visible) return;
      const [x,y] = toCanvas(e.clientX, e.clientY);
      this.rankingScreen.handleTap(x, y);
    });
  }

  _bindKeys() {
    window.addEventListener('keydown', e => { this.keys[e.key]=true; this._handleKeyDown(e.key); });
    window.addEventListener('keyup',   e => { this.keys[e.key]=false; });
  }
  _handleKeyDown(key) {
    this._resumeBGMIfPending();   // iOS BGM unlock on first key
    if (this.state===STATE.VICTORY) {
      if (this.victoryCanExit) { this.victoryCanExit = false; this._goRanking(); }
      return;
    }
    if (this.state===STATE.GAME_OVER) {
      if (this.gameOverReady) { this.restart(); }  // Game Over → restart ตรงๆ
      return;
    }
    if (this.state===STATE.PLAYING||this.state===STATE.BOSS_FIGHT) {
      if (key===' ') this.shootPlayer();
      if (key==='b'||key==='B') this.shootBomb();
    }
  }
  _joyShoot() {
    this._resumeBGMIfPending();   // iOS BGM unlock on first tap
    if (this.state===STATE.PLAYING||this.state===STATE.BOSS_FIGHT) { this.shootPlayer(); return; }
    if (this.state===STATE.VICTORY) {
      if (this.victoryCanExit) { this.victoryCanExit = false; this._goRanking(); }
      return;
    }
    if (this.state===STATE.GAME_OVER) {
      if (this.gameOverReady) { this.restart(); }  // Game Over → restart ตรงๆ
      return;
    }
  }
  _joyBomb() {
    this._resumeBGMIfPending();
    if (this.state===STATE.PLAYING||this.state===STATE.BOSS_FIGHT) this.shootBomb();
  }

  // ── Ranking transition ────────────────────────────
  _startPlaying() {
    // specialType ถูกกำหนดจาก ACTIVE_SPECIAL ใน settings.js แล้ว
    this.specialType = ACTIVE_SPECIAL;
    this.state = STATE.PLAYING;
    this.spawnTimer = 0;
    this.killed = 0;
    this.gameTimer = 0;
    this.gameTimerActive = true;
  }

  _goRanking() {
    if (this.rankingScreen.visible) return;  // ป้องกันเรียกซ้ำ
    this.rankingScreen.show(this.player.score, () => { this.restart(); });
  }

  // ── Restart ───────────────────────────────────────
  restart() {
    this.rankingScreen.hide();  // ensure ranking is closed before restart
    this.enemies=[]; this.bullets=[]; this.bbullets=[]; this.ebullets=[]; this.items=[];

    this.player     = new Player(this.images);
    this.cage       = new Cage();
    this.boss       = new Boss(this.images);
    this.friend     = new Friend(this.images, WIDTH/2, HUD_H + GAME_H/2);
    this.boss.y     = HUD_H - 150;   // เริ่มนอกจอด้านบน เหมือนรอบแรก

    this.spawnTimer  = 0;
    this.killed      = 0;
    this.gameTimer   = 0;
    this.gameTimerActive = false;
    this.bonusBreakdown  = null;
    this.gameOverTimer   = 0;
    this.gameOverReady   = false;

    // กลับไป INTRO เหมือนรอบแรก
    this.introTimer  = 0;
    this.introPhase  = 0;
    this.state       = STATE.INTRO;
    this.specialType = ACTIVE_SPECIAL;

    this._playBGM();
  }

  // ── Boss scene ────────────────────────────────────
  _addBossScene() {
    this.cage.x = this.boss.cx - this.cage.w/2;
    this.cage.y = this.boss.top - this.cage.h - 5;
    this.friend = new Friend(this.images, this.cage.cx, this.cage.cy);
  }
  _syncCage() {
    this.cage.x = this.boss.cx - this.cage.w/2;
    this.cage.y = this.boss.top - this.cage.h - 5;
    if (this.friend && this.friend.alive) {
      this.friend.x = this.cage.cx - this.friend.w/2 + this.cage.struggleOffset();
      this.friend.y = this.cage.cy - this.friend.h/2;
    }
  }

  // ── Shooting ──────────────────────────────────────
  shootPlayer() {
    this._play('shoot');
    const cx=this.player.cx, y=this.player.top, lv=this.player.weaponLevel, spd=BULLET_SPEED_VAL;
    const add=(x,vx,vy)=>{ this.bullets.push(new Bullet(x,y,vx,vy??-spd,this.images)); };
    if      (lv===1) { add(cx,0); }
    else if (lv===2) { [-18,0,18].forEach(dx=>add(cx+dx,0)); }
    else if (lv===3) { [-28,-10,10,28,-19,19].forEach(dx=>add(cx+dx,0)); }
    else {
      // Lv4 (was Lv5): 9-way spread
      add(cx,0);
      [20,40,60,80].forEach(deg=>{
        const a=deg*Math.PI/180;
        add(cx,-Math.sin(a)*spd,-Math.cos(a)*spd);
        add(cx, Math.sin(a)*spd,-Math.cos(a)*spd);
      });
    }
  }
  shootBomb() {
    if (this.player.specials<=0) return;
    this.player.specials--;
    this._play('explode');
    const newBullets = createSpecial(
      this.specialType,
      this.player.cx, this.player.top,
      this.player, this.enemies,
      (this.state === STATE.BOSS_FIGHT && this.boss.alive) ? this.boss : null
    );
    newBullets.forEach(b => this.bbullets.push(b));
  }
  shootBoss() {
    this._play('bShoot');
    this.boss.getBullets().forEach(b=>this.ebullets.push(new BossBullet(b.x,b.y,b.vx,b.vy)));
  }

  // ── Collision ─────────────────────────────────────
  _overlap(a,b){ return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y; }

  handleCollisions() {
    const pR  = this.player.getRect();
    const bossInFight = this.state === STATE.BOSS_FIGHT && this.boss.alive;
    const bossR = bossInFight ? this.boss.getRect() : null;

    // ── วน enemies หนึ่งรอบ: เช็ค bullets, bbullets, player พร้อมกัน ──
    const inPlay = ![STATE.VICTORY, STATE.INTRO, STATE.GAME_OVER].includes(this.state);
    let playerHit = false;

    for (let ei = this.enemies.length - 1; ei >= 0; ei--) {
      const e = this.enemies[ei];
      if (!e.alive) continue;
      const eR = e.getRect();

      // bullet → enemy
      let killed = false;
      for (let bi = this.bullets.length - 1; bi >= 0; bi--) {
        const b = this.bullets[bi];
        if (!b.alive) continue;
        if (this._overlap(b.getRect(), eR)) {
          b.alive = false; e.alive = false; killed = true;
          this.player.score += 10; this.killed++;
          this._maybeDrop(e.cx, e.cy); break;
        }
      }
      if (killed) continue;

      // bbullet → enemy (pass-through)
      for (let bi = 0; bi < this.bbullets.length; bi++) {
        const b = this.bbullets[bi];
        if (!b.alive) continue;
        const r = b.getRect();
        if (!r) continue;
        let hit = false;
        if (b instanceof SpecialWave) {
          const dist = Math.hypot(e.cx - b.cx, e.cy - b.cy);
          hit = dist < b.r + Math.max(eR.w, eR.h)/2;
        } else if (b instanceof SpecialLaser) {
          hit = this._overlap(r, eR);
          // Laser: enemy ตาย แต่ laser ยังอยู่
          if (hit) { e.alive = false; killed = true; this.player.score += 15; this.killed++; this._maybeDrop(e.cx, e.cy); break; }
          continue;
        } else {
          hit = this._overlap(r, eR);
        }
        if (hit) {
          e.alive = false; killed = true;
          this.player.score += 15; this.killed++;
          this._maybeDrop(e.cx, e.cy); break;
        }
      }
      if (killed) continue;

      // enemy → player
      if (inPlay && this._overlap(eR, pR)) {
        e.alive = false; playerHit = true;
      }
    }

    // ── bullets → boss ──
    if (bossInFight) {
      for (let bi = this.bullets.length - 1; bi >= 0; bi--) {
        const b = this.bullets[bi];
        if (!b.alive) continue;
        if (this._overlap(b.getRect(), bossR)) {
          b.alive = false; this.boss.hp -= 20; this._checkBossDead();
        }
      }
      for (let bi = this.bbullets.length - 1; bi >= 0; bi--) {
        const b = this.bbullets[bi];
        if (!b.alive) continue;
        const r = b.getRect();
        if (!r) continue;
        // Laser & Wave: ต่อเนื่อง ไม่ destroy ตัวเอง
        if (b instanceof SpecialLaser) {
          if (this._overlap(r, bossR)) {
            this.boss.hp -= b.cfg.damage; this._checkBossDead();
          }
        } else if (b instanceof SpecialWave) {
          // circle vs rect — ใช้ distance จากจุดกึ่งกลางบอส
          const bCx = bossR.x + bossR.w/2, bCy = bossR.y + bossR.h/2;
          const dist = Math.hypot(bCx - b.cx, bCy - b.cy);
          if (dist < b.r + Math.max(bossR.w, bossR.h)/2) {
            if (!b._bossHit) {  // โดนครั้งเดียวต่อ wave
              b._bossHit = true;
              this.boss.hp -= b.cfg.damage; this._checkBossDead();
            }
          }
        } else if (b instanceof SpecialBigBomb) {
          // BigBomb: ตอน explode โดนได้ตลอด duration ไม่ destroy ตัวเอง
          // ตอน fly โดนแล้วก็ยังไม่ destroy (รอระเบิด)
          if (this._overlap(r, bossR)) {
            if (b._phase === 'fly') {
              // accelerate fuse — ระเบิดทันที
              b._phase = 'explode'; b._expT = 0;
            } else if (b._phase === 'explode' && !b._bossHit) {
              b._bossHit = true;
              this.boss.hp -= b.cfg.damage; this._checkBossDead();
            }
          }
        } else {
          // Flame, Thunder, Tornado, Star — destroy on hit
          if (this._overlap(r, bossR)) {
            b.alive = false; this.boss.hp -= b.cfg ? b.cfg.damage * 3 : 250; this._checkBossDead();
          }
        }
      }
    }

    // ── Barrier absorbs ebullets ──
    const barrier = this.bbullets.find(b=>b instanceof SpecialBarrier && b.alive);
    if (barrier) {
      const bR = barrier.getRect();
      for (let bi = this.ebullets.length-1; bi>=0; bi--) {
        const b = this.ebullets[bi];
        if (b.alive && this._overlap(b.getRect(), bR)) {
          b.alive = false; barrier.onHit();
        }
      }
    }

    // ── ebullets → player ──
    if (inPlay) {
      for (let bi = this.ebullets.length - 1; bi >= 0; bi--) {
        const b = this.ebullets[bi];
        if (b.alive && this._overlap(b.getRect(), pR)) {
          b.alive = false; playerHit = true;
        }
      }
    }

    if (playerHit) {
      this._play('hit');
      if (this.player.shieldHp > 0) this.player.shieldHp -= 20;
      else this.player.hp -= 10;
      if (this.player.hp <= 0) {
        this._play('explode'); this.state = STATE.GAME_OVER;
        this.gameTimerActive = false; this._stopBGM();
      }
    }

    // ── items → player ──
    for (let ii = this.items.length - 1; ii >= 0; ii--) {
      const it = this.items[ii];
      if (!it.alive || !this._overlap(it.getRect(), pR)) continue;
      this._play('item'); it.alive = false;
      if (it.type==='life')    this.player.hp = Math.min(100, this.player.hp + 20);
      if (it.type==='shield')  { this.player.shieldHp = 100; this.player.shieldTimer = 600; }
      if (it.type==='special') this.player.specials = Math.min(MAX_SPECIALS, this.player.specials + 1);
      if (it.type==='weapon' && this.player.weaponLevel < MAX_WEAPON_LEVEL) this.player.weaponLevel++;
    }
  }

  _maybeDrop(x,y){
    if(Math.random()<0.28){
      const types=['life','life','shield','special','weapon'];
      const t=types[Math.floor(Math.random()*types.length)];
      this.items.push(new Item(x, y, t, this.images));
    }
  }

  _checkBossDead(){
    if(this.boss.hp<=0&&this.boss.alive){
      this._play('explode'); this.boss.alive=false;
      const cx=this.cage.cx, cy=this.cage.cy;
      this.cage.startBreak();
      if(this.friend) this.friend.alive=false;
      this.friend=new Friend(this.images,cx,cy);
      this.state=STATE.VICTORY;
      this.victoryTimer=0; this.reachedFriend=false; this.victoryCanExit=false;
      this.gameTimerActive = false;   // หยุดนับเวลา

      // ── Bonus Score ────────────────────────────────
      // time bonus: ยิ่งเร็วยิ่งได้เยอะ (สูงสุด 5000, ลดลงทุก 10 วินาที 60fps)
      const secElapsed = Math.floor(this.gameTimer / FPS);
      const timeBonus  = Math.max(0, 5000 - secElapsed * 30);
      // HP bonus: HP ที่เหลือ × 20
      const hpBonus    = this.player.hp * 20;
      // Special bonus: special ที่เหลือ × 300
      const spBonus    = this.player.specials * 300;
      const totalBonus = timeBonus + hpBonus + spBonus;
      this.player.score += totalBonus;
      this.bonusBreakdown = { timeBonus, hpBonus, spBonus, totalBonus, secElapsed };

      this._stopBGM(); this._play('win');
    }
  }

  // ── Intro ─────────────────────────────────────────
  updateIntro(){
    this.introTimer++;
    const t = this.introTimer;

    // Phase 0: เพื่อนอยู่คนเดียว — บอสซ่อนนอกจอ
    if (this.introPhase === 0) {
      this.friend.x = WIDTH/2 - this.friend.w/2;
      this.friend.y = HUD_H + GAME_H/2 - this.friend.h/2;
      this.boss.y   = HUD_H - 200;
      this.cage.alive = false;
      if (t >= 80) { this.introPhase = 1; }

    // Phase 1: บอสลงมาจากด้านบน มุ่งหาเพื่อน
    } else if (this.introPhase === 1) {
      const targetY = this.friend.y - this.boss.h - 10;
      if (this.boss.y < targetY) { this.boss.y += 4; }
      else {
        this.boss.y = targetY;
        if (t >= 200) {
          this.introPhase = 2;
          this.cage.alive = true;
          // กรงเริ่มจากด้านบนแล้วตกลงมา
          this.cage.x = this.friend.cx - this.cage.w/2;
          this.cage.y = HUD_H;
        }
      }

    // Phase 2: กรงตกลงมาครอบเพื่อน
    } else if (this.introPhase === 2) {
      const cageTargetY = this.friend.y - 10;
      this.cage.x = this.friend.cx - this.cage.w/2;
      if (this.cage.y < cageTargetY) {
        this.cage.y = Math.min(cageTargetY, this.cage.y + 2); //+ 6
      }
      this.friend.x = this.cage.cx - this.friend.w/2 + this.cage.struggleOffset();
      this.friend.y = this.cage.cy - this.friend.h/2;
      if (t >= 300) { this.introPhase = 3; }

    // Phase 3: บอส+กรง+เพื่อนลอยขึ้นหนี
    } else {
      this.boss.y -= 3;
      this.cage.x  = this.boss.cx - this.cage.w/2;
      this.cage.y  = this.boss.bottom + 5;
      this.friend.x = this.cage.cx - this.friend.w/2 + this.cage.struggleOffset();
      this.friend.y = this.cage.cy - this.friend.h/2;
      if (this.boss.bottom < HUD_H) {
        this.boss   = new Boss(this.images);
        this.cage   = new Cage();
        this.friend = null;
        this._startPlaying();  // เริ่มเล่นทันที ใช้ ACTIVE_SPECIAL
      }
    }
  }
  // ── Victory ───────────────────────────────────────
  updateVictory(){
    if(!this.reachedFriend){
      const tx=this.friend.right+25, ty=this.friend.cy;
      const dx=tx-this.player.cx, dy=ty-this.player.cy;
      if(Math.abs(dx)>3) this.player.x+=dx>0?3:-3;
      if(Math.abs(dy)>3) this.player.y+=dy>0?3:-3;
      if(Math.abs(dx)<=6&&Math.abs(dy)<=6){this.reachedFriend=true;this.victoryTimer=0;}
    } else {
      this.victoryTimer++;
      if(this.victoryTimer>=FPS*2) this.victoryCanExit=true;
    }
  }

  // ── Update ────────────────────────────────────────
  update(){

    this.player.padLeft  = this.joypad.state.left;
    this.player.padRight = this.joypad.state.right;

    if     (this.state===STATE.INTRO)      { this.updateIntro(); }
    else if(this.state===STATE.PLAYING)    {
      this.spawnTimer++;
      if(this.spawnTimer>=60){ this.enemies.push(new Enemy(this.images)); this.spawnTimer=0; }
      if(this.killed>=33){ this.state=STATE.BOSS_FIGHT; this._addBossScene(); }
      this.player.update(this.keys);
    }
    else if(this.state===STATE.BOSS_FIGHT){
      this.spawnTimer++;
      if(this.spawnTimer>=90){ this.enemies.push(new Enemy(this.images)); this.spawnTimer=0; }
      if(this.boss.alive&&this.boss.update()) this.shootBoss();
      this._syncCage();
      this.player.update(this.keys);
    }
    else if(this.state===STATE.VICTORY)   { this.updateVictory(); this.cage.update(); }
    else if(this.state===STATE.GAME_OVER) {
      this.gameOverTimer++;
      if (this.gameOverTimer >= FPS * 2) this.gameOverReady = true;  // 2 วินาที
    }

    if (this.gameTimerActive) this.gameTimer++;

    this.enemies  = this.enemies .filter(o=>{o.update();return o.alive;});
    this.bullets  = this.bullets .filter(o=>{o.update();return o.alive;});
    this.bbullets = this.bbullets.filter(o=>{o.update();return o.alive;});
    this.ebullets = this.ebullets.filter(o=>{o.update();return o.alive;});
    this.items    = this.items   .filter(o=>{o.update();return o.alive;});

    if (this.rankingScreen.visible) return;  // pause while ranking shown
    if(this.state===STATE.PLAYING||this.state===STATE.BOSS_FIGHT) this.handleCollisions();
  }

  // ── Draw ──────────────────────────────────────────
  draw(){
    const ctx=this.ctx;

    // Background
    ctx.fillStyle=COL.DARK; ctx.fillRect(0,0,WIDTH,HEIGHT);
    if(this.images.bg) ctx.drawImage(this.images.bg,0,HUD_H,WIDTH,GAME_H);
    else { ctx.fillStyle='rgb(5,8,20)'; ctx.fillRect(0,HUD_H,WIDTH,GAME_H); }

    // Clip game zone
    ctx.save();
    ctx.beginPath(); ctx.rect(0,HUD_H,WIDTH,GAME_H); ctx.clip();

    this.enemies.forEach(o=>o.draw(ctx));
    this.items  .forEach(o=>o.draw(ctx));

    // ── cage & friend: only in INTRO, BOSS_FIGHT, VICTORY ──
    if ([STATE.INTRO, STATE.BOSS_FIGHT, STATE.VICTORY].includes(this.state)) {
      if (this.friend) this.friend.draw(ctx);
      if (this.cage.alive) this.cage.draw(ctx);
    }
    // INTRO: แสดงบอสเฉพาะ phase 1+ (ไม่ให้โผล่ตอน phase 0 ที่เพื่อนอยู่คนเดียว)
    const showBoss = this.state === STATE.INTRO
      ? this.introPhase >= 1
      : this.boss.alive;
    if (showBoss) this.boss.draw(ctx);
    this.bullets .forEach(o=>o.draw(ctx));
    this.bbullets.forEach(o=>o.draw(ctx));
    this.ebullets.forEach(o=>o.draw(ctx));
    this.player.draw(ctx);

    ctx.restore();

    this._drawHUD();
    if(this.state===STATE.BOSS_FIGHT&&this.boss.alive) this._drawBossHP();

    // Joypad only when not in ranking
    if (!this.rankingScreen.visible) this.joypad.draw(ctx, this.player.specials);

    if(this.state===STATE.INTRO)     this._drawIntroCaption();
    if(this.state===STATE.VICTORY)   this._drawVictory();
    if(this.state===STATE.GAME_OVER) this._drawGameOver();

    // Ranking screen drawn on top
    this.rankingScreen.draw();
  }

  // ── HUD ───────────────────────────────────────────
  _drawHUD(){
    const ctx=this.ctx;
    ctx.fillStyle='rgba(0,10,25,0.88)'; ctx.fillRect(0,0,WIDTH,HUD_H);
    ctx.strokeStyle='rgba(0,160,200,0.3)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(0,HUD_H); ctx.lineTo(WIDTH,HUD_H); ctx.stroke();

    ctx.fillStyle=COL.CYAN; ctx.font='bold 13px Courier New';
    ctx.textBaseline='top'; ctx.textAlign='left';
    ctx.fillText('HP',10,10);

    const tx=34,ty=14,tw=110,th=11;
    ctx.fillStyle='rgb(60,0,0)'; this._rr(ctx,tx,ty,tw,th,3,true,false);
    const hw=Math.round(tw*this.player.hp/100);
    if(hw>0){ctx.fillStyle=COL.HP_COL; this._rr(ctx,tx,ty,hw,th,3,true,false);}
    ctx.strokeStyle='rgb(180,60,80)'; ctx.lineWidth=1; this._rr(ctx,tx,ty,tw,th,3,false,true);

    ctx.fillStyle=COL.YELLOW; ctx.font='bold 13px Courier New';
    ctx.textAlign='center';
    ctx.fillText(String(this.player.score).padStart(6,'0'), WIDTH/2.165, 18); //WIDTH/2, 18);

    // Weapon pips
    ctx.fillStyle='rgb(100,230,80)'; ctx.font='bold 12px Courier New'; ctx.textAlign='left';
    ctx.fillText(`WPN Lv${this.player.weaponLevel}`, WIDTH-175, 8);
    for(let i=0;i<MAX_WEAPON_LEVEL;i++){
      ctx.fillStyle=i<this.player.weaponLevel?'rgb(100,230,80)':'rgb(30,50,30)';
      this._rr(ctx,WIDTH-175+i*14,30,10,12,2,true,false);
    }

    // Bomb dots
    const _spCfg = SPECIALS_CONFIG.find(c=>c.id===this.specialType);
    ctx.fillStyle=(_spCfg?_spCfg.color:'rgb(255,140,0)'); ctx.font='bold 11px Courier New'; ctx.textAlign='left';
    ctx.fillText(_spCfg?_spCfg.name.slice(0,6):'SPEC',WIDTH-90,8);
    for(let i=0;i<Math.min(this.player.specials,9);i++){
      const cx=WIDTH-85+i*14;
      ctx.fillStyle='rgb(255,120,0)';
      ctx.beginPath(); ctx.arc(cx,36,5,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='rgb(255,220,80)';
      ctx.beginPath(); ctx.arc(cx-1,33,2,0,Math.PI*2); ctx.fill();
    }
  }

  _rr(ctx,x,y,w,h,r,fill,stroke){
    ctx.beginPath();
    ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.arcTo(x+w,y,x+w,y+r,r);
    ctx.lineTo(x+w,y+h-r); ctx.arcTo(x+w,y+h,x+w-r,y+h,r);
    ctx.lineTo(x+r,y+h); ctx.arcTo(x,y+h,x,y+h-r,r);
    ctx.lineTo(x,y+r); ctx.arcTo(x,y,x+r,y,r); ctx.closePath();
    if(fill) ctx.fill(); if(stroke) ctx.stroke();
  }

  _drawBossHP(){
    const ctx=this.ctx;
    const bw=12, bh=this.boss.h;
    const x=this.boss.right+8, y=this.boss.top;
    const ratio  = Math.max(0, this.boss.hp / this.boss.maxHp);
    const filled = Math.round(bh * ratio);
    // สีเปลี่ยนตาม HP: เขียว → เหลือง → แดง → rage สีแดงกระพริบ
    let barCol = ratio > 0.6 ? COL.PURPLE :
                 ratio > 0.4 ? 'rgb(255,200,50)' :
                                'rgb(255,40,40)';
    if (this.boss._rage && Math.floor(Date.now()/150)%2===0) barCol='rgb(255,120,0)';

    ctx.fillStyle='rgb(20,0,30)'; this._rr(ctx,x,y,bw,bh,4,true,false);
    if(filled){ ctx.fillStyle=barCol; this._rr(ctx,x,y+bh-filled,bw,filled,4,true,false); }
    ctx.strokeStyle='rgb(180,80,255)'; ctx.lineWidth=1; this._rr(ctx,x,y,bw,bh,4,false,true);

    // RAGE WARNING
    if (this.boss._rage) {
      ctx.save();
      ctx.fillStyle=`rgba(255,40,40,${0.6+0.4*Math.sin(Date.now()*0.01)})`;
      ctx.font='bold 11px Arial'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('RAGE', x+bw/2, y-12);
      ctx.restore();
    }
  }

  _drawIntroCaption(){
    const ctx=this.ctx;
    const caps=[
      'วันนี้อากาศสดใส ออกไปเล่นกับเพื่อนดีกว่า',   // phase 0: เพื่อนอยู่คนเดียว
      'เอ้ะ! นั่นใครน่ะ',                                  // phase 1: บอสลงมา
      'เจ้าสัตว์ประหลาดจับเพื่อนเราไปนี่!!!',        // phase 2: กรงครอบ
      'รีบไปช่วยเพื่อนกันเถอะ!',                               // phase 3: บอสหนี
    ];
    // const cols=['#ffffff','rgb(255,200,0)','rgb(229,255,0)','rgb(0,220,240)'];
    const cols=['#ffffff','#ffffff','#ffffff','rgb(0,220,240)'];
    const capY=HUD_H+GAME_H-42;
    ctx.fillStyle='rgba(0,0,0,0.55)'; ctx.fillRect(0,capY,WIDTH,34);
    ctx.fillStyle=cols[this.introPhase]; ctx.font='bold 20px Arial';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(caps[this.introPhase],WIDTH/2,capY+17);
  }

  _drawVictory(){
    const ctx = this.ctx;
    const midY = HUD_H + GAME_H / 2;

    // ── dark panel ──
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.beginPath();
    ctx.roundRect(20, midY - 115, WIDTH - 40, 265, 14);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,220,240,0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';

    // ── Title ──
    ctx.shadowColor = 'rgba(0,220,240,0.9)'; ctx.shadowBlur = 14;
    ctx.fillStyle   = COL.CYAN; ctx.font = 'bold 28px Arial';
    ctx.fillText('RESCUE SUCCESS!', WIDTH/2, midY - 82);
    ctx.shadowBlur = 0;

    // ── Bonus rows ──
    if (this.reachedFriend && this.bonusBreakdown) {
      const b = this.bonusBreakdown;

      // divider บน
      ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(40,midY-54); ctx.lineTo(WIDTH-40,midY-54); ctx.stroke();

      const rows = [
        { label:`TIME  (${b.secElapsed}s)`, val:b.timeBonus,  col:'rgb(100,220,255)' },
        { label:`HP BONUS`,                  val:b.hpBonus,   col:'rgb(255,110,110)' },
        { label:`SPECIAL BONUS`,             val:b.spBonus,   col:'rgb(255,185,60)'  },
      ];
      rows.forEach((r, i) => {
        const y = midY - 30 + i * 34;
        // label
        ctx.fillStyle = 'rgba(255,255,255,0.65)';
        ctx.font = '14px Courier New'; ctx.textAlign = 'left';
        ctx.fillText(r.label, 44, y);
        // value
        ctx.fillStyle = r.col;
        ctx.font = 'bold 16px Courier New'; ctx.textAlign = 'right';
        ctx.fillText(`+${String(r.val).padStart(5,'0')}`, WIDTH-44, y);
      });

      // divider ล่าง
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(40,midY+74); ctx.lineTo(WIDTH-40,midY+74); ctx.stroke();

      // TOTAL
      ctx.shadowColor='rgba(255,230,0,0.8)'; ctx.shadowBlur=10;
      ctx.fillStyle='rgba(255,255,255,0.6)'; ctx.font='bold 14px Courier New'; ctx.textAlign='left';
      ctx.fillText('TOTAL BONUS', 44, midY+92);
      ctx.fillStyle=COL.YELLOW; ctx.font='bold 22px Courier New'; ctx.textAlign='right';
      ctx.fillText(`+${String(b.totalBonus).padStart(5,'0')}`, WIDTH-44, midY+92);
      ctx.shadowBlur=0;
    }

    // ── Tap hint ──
    if (this.victoryCanExit) {
      ctx.fillStyle='rgba(255,255,255,0.8)'; ctx.font='16px Arial'; ctx.textAlign='center';
      ctx.fillText('Tap SHOOT to Play Again', WIDTH/2, midY+130);
    }
  }

  _drawGameOver(){
    const ctx = this.ctx;
    const t   = this.gameOverTimer;
    ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(0,0,WIDTH,HEIGHT);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

    // "GAME OVER" fade in ทันที
    if (t >= 10) {
      ctx.globalAlpha = Math.min(1, (t-10) / 20);
      ctx.fillStyle = 'rgb(220,40,60)'; ctx.font = 'bold 40px Arial';
      ctx.fillText('GAME OVER', WIDTH/2, HEIGHT/2 - 70);
      ctx.globalAlpha = 1;
    }

    // Score — โผล่หลัง 30 frames
    if (t >= 30) {
      ctx.globalAlpha = Math.min(1, (t-30) / 20);
      ctx.fillStyle = COL.YELLOW; ctx.font = 'bold 24px Courier New';
      ctx.fillText('SCORE: ' + String(this.player.score).padStart(6,'0'), WIDTH/2, HEIGHT/2 - 10);
      ctx.globalAlpha = 1;
    }

    // ปุ่ม — โผล่เมื่อ gameOverReady (2 วินาที) พร้อม pulse
    if (this.gameOverReady) {
      const pulse = 0.7 + 0.3 * Math.sin(Date.now() * 0.005);
      const bx = WIDTH/2-110, by = HEIGHT/2+30, bw = 220, bh = 50;
      ctx.globalAlpha = pulse;
      ctx.fillStyle = 'rgba(0,200,230,0.2)'; ctx.strokeStyle = COL.CYAN; ctx.lineWidth = 2;
      this._rr(ctx, bx, by, bw, bh, 10, true, true);
      ctx.fillStyle = COL.CYAN; ctx.font = 'bold 20px Arial';
      ctx.fillText('TAP TO PLAY AGAIN', WIDTH/2, by+bh/2);
      ctx.globalAlpha = 1;
    }
  }

  // ── Main loop ─────────────────────────────────────
  loop(timestamp){
    if(!this.running) return;
    const delta=timestamp-this.lastTime;
    this.lastTime=timestamp;
    this.accumulator+=Math.min(delta,100);
    while(this.accumulator>=this.stepMs){ this.update(); this.accumulator-=this.stepMs; }
    this.draw();
    requestAnimationFrame(ts=>this.loop(ts));
  }

  start(){
    requestAnimationFrame(ts=>{ this.lastTime=ts; this.loop(ts); });
  }
}
