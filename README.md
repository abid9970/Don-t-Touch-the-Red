# DON'T TOUCH THE RED 🔴⚡

> A mobile-first, reflex-driven cyber arcade mini-game built with vanilla HTML5, CSS3, JavaScript, and Canvas API.

---

## 🎮 Game Concept & Rules

- **Player:** You pilot a glowing cyber orb navigating an adrenaline-fueled obstacle gauntlet.
- **Red Objects = LETHAL 🔴:** Any contact with red hazard orbs, rotating laser spinners, sweeping bars, or laser gates ends your run immediately.
- **Blue Objects = SAFE & REWARDING 🔵:** 
  - **Blue Energy Orbs:** Grant points and step up your combo multiplier.
  - **Blue Kinetic Shields 🛡️:** Absorb one lethal red hit!
  - **Blue Chrono Gems ⏳:** Warp time into slow-motion for 3.5 seconds.
- **Near-Miss Graze Mechanic ⚡:** Graze within millimeters of lethal red obstacles without colliding to trigger "NEAR MISS!" bonuses and charge your Combo Multiplier up to **10x**!
- **Dynamic Speed Escalation 🚀:** Every 10 seconds of survival, the game accelerates into higher adrenaline speed tiers with dynamic procedural music tempo ramping.

---

## 🚀 Key Features

### 1. Controls
- **Mobile (Touch & Drag):** Touch anywhere on screen to guide the orb. Integrated touch offset automatically floats the ball ~45px above your finger so your thumb never obscures oncoming obstacles.
- **Desktop (Keyboard):** Arrow Keys or `W` / `A` / `S` / `D` for precise directional control.
- **Desktop (Mouse):** Click and drag anywhere.
- **Quick Controls:** `Spacebar` to Pause / Resume; `R` to instantly Restart after Game Over.

### 2. Audio Engine (Procedural Web Audio API)
- **100% Zero-latency audio synthesis:** No external mp3 or wav files required; starts instantly and works completely offline.
- Dynamic 16-step synthwave bassline & arpeggio that scales tempo and pitch as the game accelerates.
- Procedural sound effects for near misses, blue pickups, shield shatter, explosions, speed alerts, and achievements.

### 3. Viral Growth & Social Architecture
- **Daily Challenge Mode:** Seeded with today's date (`YYYY-MM-DD`). Every player around the world experiences the exact same hazard sequence with unique daily modifiers (*Hyper Acceleration, Laser Storm, Meteor Frenzy, Chrono Warp, Shield Rush*).
- **Challenge a Friend:** Generates a personalized challenge link (e.g. `#challenge=15420&challenger=NeonRider`). When a friend opens the link, a custom target banner tracks whether they can beat your score!
- **Viral Scorecard Generator:** Generates a high-resolution, cyber-styled PNG scorecard in real time using an off-screen HTML5 Canvas. Includes score, global percentile, time survived, max combo, and gamer tag. One-click image download or native sharing.
- **Simulated Global Leaderboard:** Pre-populated with realistic global competitive scores. Automatically slots player's personal best into the worldwide ladder and calculates global percentile (e.g., *Top 0.8% Worldwide*).
- **Daily Streak System:** Tracks consecutive days played with a 7-day flame calendar 🔥, granting cosmetic skin rewards.
- **Funny Achievement Badges:** 11 unlockable badges (*Red Magnet, Adrenaline Junkie, Combo Master, Time Bender, Cyber Legend...*) that pop up live in-game.
- **Customizable Ball Skins:** Unlock Neon Cyan, Pulse Violet, Solar Gold, Matrix Emerald, and Rainbow Supernova skins through score milestones and streaks.

---

## 🛠️ Technology Stack
- **HTML5:** Semantic markup, mobile viewport meta tags, safe-area-inset support.
- **CSS3:** Custom cyberpunk arcade theme, responsive portrait cabinet layout, neon glow filters, glassmorphic blur modals, CSS animations.
- **JavaScript (ES6+):** Pure vanilla modular architecture with zero external runtime dependencies.
- **Canvas API:** 60 FPS requestAnimationFrame delta-time loop, particle pooling, radial gradients, screen shake, and collision mathematics.
- **LocalStorage:** Persistent high scores, settings, daily streaks, gamer tag, and achievement progress.

---

## 📂 Project Directory Structure

```
dont-touch-the-red/
├── index.html          # Main HTML5 entry point & UI screens
├── style.css           # Mobile-first cyber arcade stylesheet
├── README.md           # Documentation & guides
└── js/
    ├── audio.js        # Web Audio API sound & music synthesizer
    ├── storage.js      # LocalStorage, streaks & achievements
    ├── particles.js    # 60 FPS particle pool & visual effects
    ├── obstacles.js    # Procedural hazards, blue items & collision math
    ├── viral.js        # Daily seed, friend challenge & scorecard export
    ├── game.js         # Core physics, input handling & game loop
    └── ui.js           # Screen navigation, modals & HUD controllers
```

---

## 🕹️ How to Run & Play

1. Open `index.html` directly in any modern web browser (Google Chrome, Apple Safari, Mozilla Firefox, Microsoft Edge).
2. Or serve via any local HTTP server:
   ```bash
   npx serve .
   # or
   python -m http.server 8000
   ```
3. Tap or click **START SURVIVAL** to begin!
