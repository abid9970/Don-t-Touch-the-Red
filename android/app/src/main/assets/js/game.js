/**
 * Core Game Engine for "DON'T TOUCH THE RED"
 * 60 FPS requestAnimationFrame loop, player physics, responsive touch/keyboard inputs,
 * combo multiplier system, dynamic 10s speed progression, and game state transitions.
 */
class GameEngine {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.state = 'MENU'; // 'MENU', 'PLAYING', 'PAUSED', 'GAMEOVER'
    this.isDailyMode = false;
    this.friendChallenge = null;

    // Time & Framerate
    this.lastTime = 0;
    this.timeSurvived = 0;
    this.stage = 1;
    this.speedMultiplier = 1.0;
    this.baseSpeed = 1.0;
    this.speedLevelTimer = 0;

    // Scoring & Combo
    this.score = 0;
    this.combo = 1;
    this.maxCombo = 1;
    this.comboTimer = 0;
    this.comboMaxDuration = 3.5; // seconds before combo decays
    this.nearMissCount = 0;
    this.orbsCollected = 0;

    // Screen Shake & Slow-Mo
    this.screenShake = 0;
    this.timeDilation = 1.0;
    this.slowMoTimer = 0;

    // Player State
    this.player = {
      x: 200,
      y: 500,
      radius: 14,
      vx: 0,
      vy: 0,
      targetX: 200,
      targetY: 500,
      speed: 8.5,
      hasShield: false,
      shieldPulse: 0,
      chronoActive: false,
      chronoTimer: 0,
      skin: 'cyan'
    };

    // Input States
    this.keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, w: false, a: false, s: false, d: false };
    this.touchActive = false;
    this.touchOffsetY = -45; // Default touch offset so finger doesn't block player ball
    this.touchCurrentX = 200;
    this.touchCurrentY = 500;
  }

  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.resizeCanvas();
    this.bindInputs();
  }

  resizeCanvas() {
    if (!this.canvas) return;
    const container = this.canvas.parentElement;
    const rect = container.getBoundingClientRect();
    
    // Set actual canvas size matching container dimensions (pixel-perfect)
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);

    this.width = rect.width;
    this.height = rect.height;

    // Keep player in bounds if already initialized
    if (this.player) {
      this.player.x = Math.max(this.player.radius, Math.min(this.width - this.player.radius, this.player.x));
      this.player.y = Math.max(this.player.radius, Math.min(this.height - this.player.radius, this.player.y));
    }
  }

  // --- INPUT HANDLING ---

  bindInputs() {
    window.addEventListener('resize', () => this.resizeCanvas());

    // Keyboard controls
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(key)) {
        this.keys[e.key] = true;
        this.keys[key] = true;
      }
      if (e.code === 'Space') {
        if (this.state === 'PLAYING') this.pauseGame();
        else if (this.state === 'PAUSED') this.resumeGame();
      }
      if (e.key === 'r' || e.key === 'R') {
        if (this.state === 'GAMEOVER') {
          this.startGame(this.isDailyMode);
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      this.keys[e.key] = false;
      this.keys[key] = false;
    });

    // Touch controls (Mobile-first, buttery smooth touch & drag)
    const handleTouchStart = (e) => {
      if (this.state !== 'PLAYING') return;
      e.preventDefault();
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      const touchX = touch.clientX - rect.left;
      const touchY = touch.clientY - rect.top;
      
      this.touchActive = true;
      const useOffset = window.storageManager.data.settings.touchOffset;
      this.player.targetX = touchX;
      this.player.targetY = useOffset ? touchY + this.touchOffsetY : touchY;
    };

    const handleTouchMove = (e) => {
      if (this.state !== 'PLAYING' || !this.touchActive) return;
      e.preventDefault();
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      const touchX = touch.clientX - rect.left;
      const touchY = touch.clientY - rect.top;

      const useOffset = window.storageManager.data.settings.touchOffset;
      this.player.targetX = touchX;
      this.player.targetY = useOffset ? touchY + this.touchOffsetY : touchY;
    };

    const handleTouchEnd = (e) => {
      if (e.touches.length === 0) {
        this.touchActive = false;
      }
    };

    this.canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    this.canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    this.canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    this.canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    // Mouse drag controls for desktop
    let isMouseDown = false;
    this.canvas.addEventListener('mousedown', (e) => {
      if (this.state !== 'PLAYING') return;
      isMouseDown = true;
      const rect = this.canvas.getBoundingClientRect();
      this.player.targetX = e.clientX - rect.left;
      this.player.targetY = e.clientY - rect.top;
    });

    this.canvas.addEventListener('mousemove', (e) => {
      if (this.state !== 'PLAYING' || !isMouseDown) return;
      const rect = this.canvas.getBoundingClientRect();
      this.player.targetX = e.clientX - rect.left;
      this.player.targetY = e.clientY - rect.top;
    });

    window.addEventListener('mouseup', () => {
      isMouseDown = false;
    });
  }

  // --- GAME LIFECYCLE ---

  startGame(isDaily = false) {
    this.resizeCanvas();
    this.state = 'PLAYING';
    this.isDailyMode = isDaily;
    this.lastTime = performance.now();
    this.timeSurvived = 0;
    this.score = 0;
    this.combo = 1;
    this.maxCombo = 1;
    this.comboTimer = 0;
    this.nearMissCount = 0;
    this.orbsCollected = 0;
    this.stage = 1;
    this.speedLevelTimer = 0;
    this.speedMultiplier = 1.0;
    this.timeDilation = 1.0;
    this.slowMoTimer = 0;
    this.screenShake = 0;

    // Reset Player
    this.player.x = this.width / 2;
    this.player.y = this.height * 0.78;
    this.player.targetX = this.player.x;
    this.player.targetY = this.player.y;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.hasShield = false;
    this.player.chronoActive = false;
    this.player.skin = window.storageManager.data.selectedSkin || 'cyan';

    // Check Daily Challenge Seed or Seeded RNG
    if (this.isDailyMode) {
      const daily = window.viralEngine.getDailySeed();
      window.obstacleManager.reset(daily.seed);
      if (daily.modifier.speedScale) {
        this.baseSpeed = daily.modifier.speedScale;
        this.speedMultiplier = this.baseSpeed;
      }
    } else {
      this.baseSpeed = 1.0;
      this.speedMultiplier = 1.0;
      window.obstacleManager.reset();
    }

    // Reset particles & Audio
    window.particleEngine.reset();
    window.soundEngine.startBGM(124);
    window.soundEngine.setBGMSpeed(this.speedMultiplier);

    // Friend challenge check
    this.friendChallenge = window.viralEngine.parseChallengeFromURL();

    // Trigger UI updates
    if (window.uiManager) {
      window.uiManager.onGameStart(this.isDailyMode, this.friendChallenge);
    }

    // Ensure loop is running
    requestAnimationFrame((t) => this.loop(t));
  }

  pauseGame() {
    if (this.state !== 'PLAYING') return;
    this.state = 'PAUSED';
    if (window.uiManager) window.uiManager.showPauseModal();
  }

  resumeGame() {
    if (this.state !== 'PAUSED') return;
    this.state = 'PLAYING';
    this.lastTime = performance.now();
    if (window.uiManager) window.uiManager.hidePauseModal();
  }

  gameOver() {
    this.state = 'GAMEOVER';
    window.soundEngine.stopBGM();
    window.soundEngine.playExplosion();

    // Screen shake & death particles
    this.screenShake = 25;
    window.particleEngine.emitDeathExplosion(this.player.x, this.player.y);

    // Save stats to LocalStorage
    const finalScore = Math.round(this.score);
    const { isNewBest, highScore } = window.storageManager.saveRun(
      finalScore,
      this.timeSurvived,
      this.nearMissCount,
      this.orbsCollected,
      this.maxCombo
    );

    if (this.isDailyMode) {
      const today = window.viralEngine.getDailySeed().dateStr;
      window.storageManager.saveDailyRun(today, finalScore);
    }

    // Check Funny Achievements
    if (this.timeSurvived < 3.0) {
      window.storageManager.unlockAchievement('red_lover', (ach) => this.showAchievement(ach));
    }
    if (this.timeSurvived >= 5.0) {
      window.storageManager.unlockAchievement('first_blood', (ach) => this.showAchievement(ach));
    }
    if (this.nearMissCount >= 5) {
      window.storageManager.unlockAchievement('close_shave', (ach) => this.showAchievement(ach));
    }
    if (this.maxCombo >= 5) {
      window.storageManager.unlockAchievement('combo_king', (ach) => this.showAchievement(ach));
    }
    if (this.stage >= 3) {
      window.storageManager.unlockAchievement('speed_demon', (ach) => this.showAchievement(ach));
    }
    if (this.timeSurvived >= 60.0) {
      window.storageManager.unlockAchievement('centurion', (ach) => this.showAchievement(ach));
    }
    if (finalScore >= 15000) {
      window.storageManager.unlockAchievement('high_roller', (ach) => this.showAchievement(ach));
    }

    // Pass to UI after brief dramatic death beat
    setTimeout(() => {
      if (window.uiManager) {
        window.uiManager.showGameOverScreen({
          score: finalScore,
          isNewBest: isNewBest,
          highScore: highScore,
          timeSurvived: this.timeSurvived,
          nearMissCount: this.nearMissCount,
          orbsCollected: this.orbsCollected,
          maxCombo: this.maxCombo,
          rankInfo: window.storageManager.getUserRank(),
          friendChallenge: this.friendChallenge
        });
      }
    }, 600);
  }

  showAchievement(ach) {
    window.soundEngine.playAchievement();
    window.particleEngine.emitFloatingText(`🎖️ UNLOCKED: ${ach.name}!`, this.width / 2, 180, '#ffd700', 18);
  }

  // --- CORE GAME LOOP ---

  loop(currentTime) {
    if (this.state === 'PLAYING') {
      const rawDt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
      this.lastTime = currentTime;

      // Handle Slow-Motion Chrono Warp
      if (this.player.chronoActive) {
        this.player.chronoTimer -= rawDt;
        this.timeDilation = 0.55;
        if (this.player.chronoTimer <= 0) {
          this.player.chronoActive = false;
          this.timeDilation = 1.0;
        }
      } else {
        this.timeDilation = 1.0;
      }

      const dt = rawDt * this.timeDilation;
      this.update(dt, rawDt);
      this.render();
      requestAnimationFrame((t) => this.loop(t));
    } else if (this.state === 'GAMEOVER') {
      // Keep rendering fading particles
      const rawDt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
      this.lastTime = currentTime;
      window.particleEngine.update(rawDt * 60);
      this.render();
      requestAnimationFrame((t) => this.loop(t));
    }
  }

  // --- UPDATE ENGINE ---

  update(dt, realDt) {
    this.timeSurvived += dt;
    this.speedLevelTimer += dt;

    // Dynamic Speed Escalation every 10 seconds!
    if (this.speedLevelTimer >= 10.0) {
      this.speedLevelTimer -= 10.0;
      this.stage++;
      this.speedMultiplier += 0.22;
      window.soundEngine.playSpeedUp();
      window.soundEngine.setBGMSpeed(this.speedMultiplier);
      window.particleEngine.emitFloatingText(`SPEED UP! ⚡ LVL ${this.stage}`, this.width / 2, this.height * 0.35, '#ff0055', 24);
      this.screenShake = 12;
    }

    // Base score accumulation
    this.score += 35 * dt * this.combo;

    // Combo Decay Logic
    if (this.combo > 1) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 1;
        this.comboTimer = 0;
      }
    }

    // Update Player Movement
    this.updatePlayer(dt);

    // Update Obstacles & Hazards
    window.obstacleManager.update(dt * 60, this.speedMultiplier, this.width, this.height, this.player.y);

    // Collision & Near-Miss Checks
    const collisionResults = window.obstacleManager.checkCollisions(this.player);

    // 1. Red Hazard Collision
    if (collisionResults.hitRed) {
      if (this.player.hasShield) {
        // Shield absorbs lethal hit!
        this.player.hasShield = false;
        window.soundEngine.playShieldBreak();
        this.screenShake = 18;
        window.particleEngine.emitOrbCollect(this.player.x, this.player.y, '#00f0ff');
        window.particleEngine.emitFloatingText('SHIELD SAVED YOU! 🛡️', this.player.x, this.player.y - 25, '#00f0ff', 16);
        window.storageManager.unlockAchievement('shield_hero', (ach) => this.showAchievement(ach));
        // Remove the offending obstacle so it doesn't immediately re-hit
        if (collisionResults.hitObstacle) {
          const idx = window.obstacleManager.obstacles.indexOf(collisionResults.hitObstacle);
          if (idx !== -1) window.obstacleManager.obstacles.splice(idx, 1);
        }
      } else {
        // Lethal instant game over!
        this.gameOver();
        return;
      }
    }

    // 2. Near-Miss Grazes
    if (collisionResults.nearMissCount > 0) {
      for (let i = 0; i < collisionResults.nearMissCount; i++) {
        this.nearMissCount++;
        this.combo = Math.min(10, this.combo + 1);
        if (this.combo > this.maxCombo) this.maxCombo = this.combo;
        this.comboTimer = this.comboMaxDuration;

        const bonus = 100 * this.combo;
        this.score += bonus;
        window.soundEngine.playNearMiss();
        window.particleEngine.emitNearMissSparks(this.player.x, this.player.y);
        window.particleEngine.emitFloatingText(`NEAR MISS! +${bonus} (x${this.combo})`, this.player.x, this.player.y - 30, '#00f0ff', 14);
      }
    }

    // 3. Blue Collectibles
    for (const item of collisionResults.collected) {
      if (item.type === 'orb') {
        this.orbsCollected++;
        this.combo = Math.min(10, this.combo + 1);
        if (this.combo > this.maxCombo) this.maxCombo = this.combo;
        this.comboTimer = this.comboMaxDuration;

        const pts = item.points * this.combo;
        this.score += pts;
        window.soundEngine.playPickup(this.combo);
        window.particleEngine.emitOrbCollect(item.x, item.y, '#00f0ff');
        window.particleEngine.emitFloatingText(`+${pts} (x${this.combo})`, item.x, item.y - 15, '#00f0ff', 16);
      } else if (item.type === 'shield') {
        this.player.hasShield = true;
        window.soundEngine.playShieldPickup();
        window.particleEngine.emitOrbCollect(item.x, item.y, '#00f0ff');
        window.particleEngine.emitFloatingText('SHIELD ONLINE! 🛡️', this.player.x, this.player.y - 25, '#00f0ff', 16);
      } else if (item.type === 'chrono') {
        this.player.chronoActive = true;
        this.player.chronoTimer = 3.5;
        window.soundEngine.playPickup(5);
        window.particleEngine.emitOrbCollect(item.x, item.y, '#00ffff');
        window.particleEngine.emitFloatingText('CHRONO WARP! ⏳', this.player.x, this.player.y - 25, '#00ffff', 16);
      }
    }

    // Update Particles
    window.particleEngine.update(dt * 60);

    // Screen Shake Decay
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - realDt * 40);
    }

    // Emit player trail particles
    const skinColor = this.getSkinColor();
    window.particleEngine.emitTrail(this.player.x, this.player.y, skinColor, this.player.radius);

    // Update UI HUD
    if (window.uiManager) {
      window.uiManager.updateHUD({
        score: Math.round(this.score),
        combo: this.combo,
        comboRatio: this.combo > 1 ? (this.comboTimer / this.comboMaxDuration) : 0,
        stage: this.stage,
        speedMultiplier: this.speedMultiplier,
        timeSurvived: this.timeSurvived,
        hasShield: this.player.hasShield
      });
    }
  }

  updatePlayer(dt) {
    const p = this.player;

    // Keyboard movement
    let kx = 0;
    let ky = 0;
    if (this.keys.ArrowLeft || this.keys.a) kx -= 1;
    if (this.keys.ArrowRight || this.keys.d) kx += 1;
    if (this.keys.ArrowUp || this.keys.w) ky -= 1;
    if (this.keys.ArrowDown || this.keys.s) ky += 1;

    if (kx !== 0 || ky !== 0) {
      const len = Math.hypot(kx, ky);
      const moveSpeed = p.speed * 60 * dt;
      p.x += (kx / len) * moveSpeed;
      p.y += (ky / len) * moveSpeed;
      p.targetX = p.x;
      p.targetY = p.y;
    } else {
      // Touch / Mouse smooth tracking lerp
      const dx = p.targetX - p.x;
      const dy = p.targetY - p.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 1.0) {
        // Snappy responsive lerp
        const lerpFactor = Math.min(1.0, 18 * dt);
        p.x += dx * lerpFactor;
        p.y += dy * lerpFactor;
      }
    }

    // Screen boundary clamping
    p.x = Math.max(p.radius, Math.min(this.width - p.radius, p.x));
    p.y = Math.max(p.radius, Math.min(this.height - p.radius, p.y));

    // Shield animation pulse
    if (p.hasShield) {
      p.shieldPulse += 0.1;
    }
  }

  getSkinColor() {
    switch (this.player.skin) {
      case 'purple': return '#d946ef';
      case 'gold': return '#f59e0b';
      case 'emerald': return '#10b981';
      case 'rainbow': {
        const hue = (performance.now() * 0.15) % 360;
        return `hsl(${hue}, 100%, 60%)`;
      }
      case 'cyan':
      default: return '#00f0ff';
    }
  }

  // --- RENDER ENGINE ---

  render() {
    const ctx = this.ctx;
    ctx.save();

    // Screen Shake Offset
    if (this.screenShake > 0 && window.storageManager.data.settings.screenShake) {
      const ox = (Math.random() - 0.5) * this.screenShake;
      const oy = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(ox, oy);
    }

    // Clear Canvas with subtle motion blur dark trail
    ctx.fillStyle = 'rgba(10, 11, 16, 0.45)';
    ctx.fillRect(0, 0, this.width, this.height);

    // Render Cyber Grid Background
    this.renderBackgroundGrid(ctx);

    // Render Obstacles and Collectibles
    window.obstacleManager.render(ctx);

    // Render Particles & Shockwaves
    window.particleEngine.render(ctx);

    // Render Player Ball
    if (this.state === 'PLAYING' || this.state === 'PAUSED') {
      this.renderPlayer(ctx);
    }

    ctx.restore();
  }

  renderBackgroundGrid(ctx) {
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.04)';
    ctx.lineWidth = 1;

    // Moving vertical & horizontal grid lines giving sense of forward velocity
    const gridSpacing = 40;
    const yOffset = (this.timeSurvived * 60 * this.speedMultiplier) % gridSpacing;

    for (let x = 0; x < this.width; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }

    for (let y = yOffset; y < this.height; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }

    ctx.restore();
  }

  renderPlayer(ctx) {
    const p = this.player;
    const color = this.getSkinColor();

    ctx.save();

    // 1. Kinetic Blue Shield Ring (if active)
    if (p.hasShield) {
      ctx.save();
      const shieldR = p.radius + 10 + Math.sin(p.shieldPulse) * 2;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 18;
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, shieldR, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(0, 240, 255, 0.2)';
      ctx.fill();
      ctx.restore();
    }

    // 2. Glowing Player Orb
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(p.x, p.y, p.radius * 0.15, p.x, p.y, p.radius);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.5, color);
    grad.addColorStop(1, '#050811');
    ctx.fillStyle = grad;
    ctx.fill();

    // Inner bright core
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius * 0.45, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Subtle neon outline
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }
}

window.gameEngine = new GameEngine();
