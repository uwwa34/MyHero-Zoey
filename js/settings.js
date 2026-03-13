// ═══════════════════════════════════════════════════
//  settings.js  —  Game configuration (namespace: CFG)
//  ── แก้ค่าเกมทั้งหมดที่นี่ ──
// ═══════════════════════════════════════════════════

const CFG = Object.freeze({

  // ── Canvas ──────────────────────────────────────
  WIDTH  : 390,
  HEIGHT : 720,
  HUD_H  : 52,
  PAD_H  : 160,
  get GAME_H() { return this.HEIGHT - this.HUD_H - this.PAD_H; }, // 508

  FPS    : 60,

  // ── Colors ──────────────────────────────────────
  COL : {
    WHITE  : '#f0f8ff',
    BLACK  : '#1a3a5c',
    RED    : 'rgb(224,122,138)',
    GREEN  : 'rgb(116,198,157)',
    CYAN   : 'rgb(91,163,201)',
    YELLOW : 'rgb(249,199,79)',
    PURPLE : 'rgb(162,155,206)',
    DARK   : 'rgb(208,234,245)',
    HP_COL : 'rgb(224,122,138)',
  },

  // ── Player / Bullet ─────────────────────────────
  PLAYER_SPEED     : 4,
  BULLET_SPEED_VAL : 6,
  SPECIAL_SPEED    : 9,
  ITEM_SPEED       : 3,
  START_SPECIALS   : 2,
  MAX_SPECIALS     : 9,
  MAX_WEAPON_LEVEL : 4,   // Lv1=1shot Lv2=3shot Lv3=6shot Lv4=spread

  // ── 🎮 Special Weapon ────────────────────────────
  // 'flame' | 'thunder' | 'tornado' | 'bigbomb'
  // 'starrain' | 'barrier' | 'laser' | 'wave'
  ACTIVE_SPECIAL : 'starrain',

  // ── Enemy Spawn ──────────────────────────────────
  SPAWN_INTERVAL : 80,   // frames ระหว่าง wave
  SPAWN_PER_WAVE : 3,    // enemy ต่อ wave
  SPAWN_TOTAL    : 65,   // enemy ทั้งหมดก่อนบอส

  // ── Boss Barrier ─────────────────────────────────
  BOSS_BARRIER_DURATION : 300,  // frames (5 วิ)

  // ── Background Scroll ────────────────────────────
  // ใช้รูป background.jpg สูงกว่า GAME_H (508px)
  // 0.6=ช้า | 1=ปานกลาง | 2=เร็ว  (px/frame @60fps)
  BG_SCROLL_SPEED : 0.6,

  // ── States ───────────────────────────────────────
  STATE : {
    INTRO      : 'intro',
    PLAYING    : 'playing',
    BOSS_FIGHT : 'boss_fight',
    VICTORY    : 'victory',
    GAME_OVER  : 'game_over',
  },

  // ── Asset Paths ───────────────────────────────────
  IMG : {
    PLAYER : 'assets/images/player.png',
    ENEMY  : 'assets/images/enemy.png',
    BOSS   : 'assets/images/boss.png',
    FRIEND : 'assets/images/friend.png',
    BG     : 'assets/images/background.jpg',
    BULLET : 'assets/images/bullet.png',
    ITEM_LIFE    : 'assets/images/items/item_life.png',
    ITEM_SHIELD  : 'assets/images/items/item_shield.png',
    ITEM_SPECIAL : 'assets/images/items/item_special.png',
    ITEM_WEAPON  : 'assets/images/items/item_weapon.png',
    SPECIAL_FLAME    : 'assets/images/specials/special_flame.png',
    SPECIAL_THUNDER  : 'assets/images/specials/special_thunder.png',
    SPECIAL_TORNADO  : 'assets/images/specials/special_tornado.png',
    SPECIAL_BIGBOMB  : 'assets/images/specials/special_bigbomb.png',
    SPECIAL_STARRAIN : 'assets/images/specials/special_starrain.png',
    SPECIAL_BARRIER  : 'assets/images/specials/special_barrier.png',
    SPECIAL_LASER    : 'assets/images/specials/special_laser.png',
    SPECIAL_WAVE     : 'assets/images/specials/special_wave.png',
  },

  SND : {
    BGM     : 'assets/sounds/bgm.mp3',
    SHOOT   : 'assets/sounds/shoot.wav',
    HIT     : 'assets/sounds/player_hit.wav',
    ITEM    : 'assets/sounds/pickup.wav',
    B_SHOOT : 'assets/sounds/boss_shoot.wav',
    EXPLODE : 'assets/sounds/explosion.wav',
    WIN     : 'assets/sounds/victory.wav',
  },
});

// ── Destructure สำหรับ backward-compat กับ code ที่ยังใช้ชื่อเดิม ──
// (ลบ block นี้ได้เมื่อ refactor ครบทุกไฟล์แล้ว)
const { WIDTH, HEIGHT, HUD_H, PAD_H, FPS,
        PLAYER_SPEED, BULLET_SPEED_VAL, SPECIAL_SPEED, ITEM_SPEED,
        START_SPECIALS, MAX_SPECIALS, MAX_WEAPON_LEVEL,
        ACTIVE_SPECIAL, SPAWN_INTERVAL, SPAWN_PER_WAVE, SPAWN_TOTAL,
        BOSS_BARRIER_DURATION, BG_SCROLL_SPEED } = CFG;
const GAME_H = CFG.GAME_H;
const COL    = CFG.COL;
const STATE  = CFG.STATE;
const IMG    = CFG.IMG;
const SND    = CFG.SND;

// ── Sprite util ──────────────────────────────────────────────────────
/** Remove white/near-white background from an image element.
 *  Returns an offscreen canvas with those pixels set to alpha=0. */
function removeBackground(img, tolerance = 30) {
  const oc  = document.createElement('canvas');
  oc.width  = img.naturalWidth  || img.width;
  oc.height = img.naturalHeight || img.height;
  const c   = oc.getContext('2d');
  c.drawImage(img, 0, 0);
  try {
    const id  = c.getImageData(0, 0, oc.width, oc.height);
    const d   = id.data;
    const thr = 255 - tolerance;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i] >= thr && d[i+1] >= thr && d[i+2] >= thr) d[i+3] = 0;
    }
    c.putImageData(id, 0, 0);
  } catch (e) {
    console.warn('removeBackground skipped (CORS):', e.message);
  }
  return oc;
}
