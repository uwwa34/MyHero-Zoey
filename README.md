# 🎮 MyHero — Zoey (Mobile Shooting Game)

เกม Shooting แนวตั้งสำหรับมือถือ สร้างด้วย HTML5 Canvas + Vanilla JavaScript  
ออกแบบสำหรับหน้าจอ **390 × 720px** (iPhone / Android Portrait)  
Asset ทั้งหมดวาดด้วยมือ — ตัวละครและพื้นหลังเป็นภาพจริงของเด็ก

---

## 📁 โครงสร้างไฟล์

```
/
├── index.html
├── assets/
│   ├── images/
│   │   ├── player.png          (80×100)
│   │   ├── enemy.png           (56×56)
│   │   ├── boss.png            (170×110)
│   │   ├── friend.png          (60×60)
│   │   ├── background.jpg      (390×1500px+ แนะนำ)
│   │   ├── bullet.png          (36×44)
│   │   ├── items/
│   │   │   ├── item_life.png
│   │   │   ├── item_shield.png
│   │   │   ├── item_special.png
│   │   │   └── item_weapon.png
│   │   └── specials/
│   │       ├── special_flame.png
│   │       ├── special_thunder.png
│   │       ├── special_tornado.png
│   │       ├── special_bigbomb.png
│   │       ├── special_starrain.png
│   │       ├── special_barrier.png
│   │       ├── special_laser.png
│   │       └── special_wave.png
│   └── sounds/
│       ├── bgm.mp3
│       ├── shoot.wav
│       ├── player_hit.wav
│       ├── pickup.wav
│       ├── boss_shoot.wav
│       ├── explosion.wav
│       └── victory.wav
└── js/
    ├── settings.js          ← ค่า config ทั้งหมด แก้ที่นี่
    ├── game.js              ← Main game loop & logic
    ├── joypad.js            ← Virtual joypad (touch + mouse)
    ├── ranking.js           ← Ranking screen
    └── Character/
        ├── player.js
        ├── enemy.js
        ├── boss.js
        ├── items.js
        └── specials.js
```

---

## ⚙️ การตั้งค่า (`js/settings.js`)

ค่าทุกตัวอยู่ใน `CFG` namespace — `Object.freeze()` ป้องกันการแก้ไขโดยไม่ตั้งใจ

### เลือก Special Weapon
```js
ACTIVE_SPECIAL : 'starrain',
```

| ค่า | อาวุธ | ดีล % HP บอส | คำอธิบาย |
|-----|-------|------------|----------|
| `flame` | 🔥 Flame Burst | 25% (÷12 นัด) | ยิง 12 นัดกระจาย 180° ทะลุบอสได้ |
| `thunder` | ⚡ Thunder Strike | 20% | สายฟ้า homing ล็อคเป้าอัตโนมัติ |
| `tornado` | 🌀 Tornado | 25% (÷6 นัด) | วนรอบตัวแล้วพุ่งออก 6 นัด ทะลุบอสได้ |
| `bigbomb` | 💣 Big Bomb | 22% | ระเบิดพื้นที่วงกว้าง |
| `starrain` | 🌟 Star Rain | 20% (÷8 นัด) | ดาวตก 8 ดวงจากด้านบน |
| `barrier` | 🛡️ Barrier | 0% | กำแพงดูดซับกระสุนบอส |
| `laser` | 🎯 Laser | 20% | เลเซอร์ทะลุตลอดจอ 120 frame |
| `wave` | 🌊 Wave Bomb | 20% | คลื่นระเบิดแผ่รอบตัว |

### Enemy Spawn
```js
SPAWN_INTERVAL : 80,   // frames ระหว่าง wave (~1.3 วิ)
SPAWN_PER_WAVE : 3,    // enemy โผล่พร้อมกันต่อ wave
SPAWN_TOTAL    : 65,   // enemy ทั้งหมดก่อนเจอบอส
```

### Background Scroll
```js
BG_SCROLL_SPEED : 0.6,  // px/frame @60fps
```
| ค่า | ความเร็ว | ใน 50 วิเลื่อน | ความสูงรูปที่แนะนำ |
|-----|---------|--------------|------------------|
| 0.6 | ช้า ⭐ | ~1,800px | 2,500px+ |
| 1 | ปานกลาง | 3,000px | 3,500px+ |
| 2 | เร็ว | 6,000px | 6,500px+ |

---

## 🎮 Game States & Flow

```
INTRO (phase 0–3) → phase 4 รอกด A → PLAYING → BOSS_FIGHT → VICTORY → RANKING → INTRO
                                                             ↘ GAME_OVER ↗
```

| State | คำอธิบาย |
|-------|----------|
| `INTRO` phase 0–3 | Animation บอสลงมาจับเพื่อนแล้วหนีไป |
| `INTRO` phase 4 | หยุดรอ — ข้อความกระพริบ + ผู้เล่น wiggle, timeout 30 วิ → loop ใหม่ |
| `PLAYING` | เล่นปกติ spawn enemy, background เลื่อนขึ้น |
| `BOSS_FIGHT` | บอสเข้ามาหลัง enemy ครบ, background หยุด |
| `VICTORY` | ชนะ → แสดง Bonus Tally → Ranking |
| `GAME_OVER` | แพ้ → แสดงปุ่มเริ่มใหม่ |

---

## 🧩 ระบบตัวละคร

### Player
- HP: 100 (แถบสีชมพู HUD)
- Weapon Level: 1–4 (Lv1=1นัด, Lv2=3นัด, Lv3=6นัด, Lv4=9-way spread)
- Shield: ดูดซับความเสียหายแทน HP ไม่กระพริบขณะมี shield
- Invincibility: กระพริบ 1 วิ (60 frame) หลังโดนโดยไม่มี shield
- Special: เริ่ม 2 ชาร์จ สูงสุด 9

### Enemy
- ตกลงมาจากด้านบน ยิงกระสุนใส่ผู้เล่น
- Drop item เมื่อตาย: HP / Shield / Special / Weapon

### Boss
- HP: 2,500
- Normal mode: speed 4, fire rate ทุก 65 frame, 3 attack patterns
- Rage mode (HP < 40%): speed 7, fire rate ทุก 45 frame, 5 attack patterns
- Boss Barrier: เปิด 300 frame ตอนโผล่ครั้งแรก — กระสุนปกติผ่านไม่ได้, Special สลายได้ทันที

---

## 🏆 คะแนน & Bonus

| แหล่งคะแนน | ค่า |
|------------|-----|
| ยิง enemy ตาย | +15 |
| Time Bonus | สูงสุด 5,000 (ลด 30/วิ) |
| HP Bonus | HP ที่เหลือ × 20 |
| Special Bonus | Special ที่เหลือ × 300 |

---

## 🕹️ การควบคุม

| Action | Virtual Joypad | Keyboard |
|--------|---------------|----------|
| เดิน ซ้าย/ขวา | ◀ ▶ | ← → |
| ยิงกระสุน (กดค้าง) | ปุ่ม A | `t` |
| ยิง Special | ปุ่ม B | `b` |

### การข้ามหน้าต่างๆ (ทุกวิธีทำงานเหมือนกัน)

| หน้าจอ | Joypad A | Keyboard | แตะหน้าจอ |
|--------|----------|---------|-----------|
| Intro phase 4 (รอเริ่ม) | ✅ | `t` / Space / Enter | ✅ |
| Victory Tally | ✅ | `t` / Space / Enter | ✅ |
| Game Over | ✅ | `t` / Space / Enter | ✅ แตะปุ่ม |
| Ranking board | ✅ | `t` / Space / Enter | ✅ แตะปุ่ม |

---

## 🔊 ระบบเสียง

- **BGM**: `HTMLAudioElement` loop — หยุดอัตโนมัติเมื่อ page ไม่ active (สลับ app / กด Home / ล็อคหน้าจอ)
- **SFX**: Web Audio API — `XMLHttpRequest` + `decodeAudioData` รองรับทุก platform
  - Fallback ชั้นที่ 1: HTMLAudioElement ถ้า decode ล้มเหลว
  - Fallback ชั้นที่ 2: HTMLAudioElement direct ถ้ายังไม่ init

---

## 📱 Platform Support

| Platform | สถานะ |
|----------|-------|
| iOS Safari (iPhone 12–16) | ✅ |
| iOS Chrome | ✅ |
| Android Chrome / Firefox | ✅ |
| Chrome Windows / macOS | ✅ |
| iPad | ✅ |
| Desktop Firefox / Safari | ✅ |

---

## 🛠️ Deploy

ไม่ต้อง build — static files ทั้งหมด

```bash
python3 -m http.server 8000
# เปิด http://localhost:8000
```

อัปโหลดขึ้น GitHub Pages, Netlify, Vercel หรือ static hosting ใดก็ได้

---

## 📝 Bug Fix Log

| ปัญหา | แก้ที่ |
|-------|-------|
| SFX ไม่มีเสียงบน Chrome Windows | `game.js` — เปลี่ยน fetch → XMLHttpRequest |
| BGM เล่นตอน page ไม่ active | `game.js` + `index.html` — `_pageActive` flag |
| Intro phase 4 กรงค้างหน้าจอ | `game.js` — `cage.alive = false` หลัง phase 3 |
| Intro phase 4 loop กลับ phase 0 crash | `game.js` — new Friend/Boss ก่อน reset |
| Boss fight กรงหายไป | `game.js` — `_addBossScene()` set `cage.alive = true` |
| Animation รอบ 2 ค้าง | `game.js` — reset `reachedFriend`, `victoryTimer`, `victoryCanExit` ใน restart() |
| Victory tap ข้ามไม่ได้ | `game.js` — เพิ่ม Victory case ใน handleTap() |
| Victory Total ซ้อนกัน / มองไม่เห็น | `game.js` — แยก 2 บรรทัด + เปลี่ยนสีเป็นเหลือง |
| Game Over / Ranking ปุ่มสั้นกว่า text | `game.js`, `ranking.js` — ขยาย `bw = WIDTH-40` |
| Ranking "A" key ชนกับ entry mode | `ranking.js` — เช็ค `mode === 'board'` ก่อนเท่านั้น |
