/**
 * Obstacles and Power-up Generation Engine for "DON'T TOUCH THE RED"
 * Procedural hazard patterns, collision geometry, near-miss detectors, and PRNG seeding.
 */

// Seedable PRNG (Mulberry32) for reproducible daily runs & friend challenges
class SeededRNG {
  constructor(seed = 123456789) {
    this.seed = seed;
  }
  next() {
    let t = (this.seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  range(min, max) {
    return min + this.next() * (max - min);
  }
  choice(arr) {
    return arr[Math.floor(this.next() * arr.length)];
  }
}

class ObstacleManager {
  constructor() {
    this.obstacles = [];
    this.collectibles = [];
    this.spawnTimer = 0;
    this.waveTimer = 0;
    this.rng = new SeededRNG(Date.now());
    this.isSeeded = false;
    this.nearMissRadiusBuffer = 20; // grazing distance for near-miss rewards
  }

  reset(seed = null) {
    this.obstacles = [];
    this.collectibles = [];
    this.spawnTimer = 0;
    this.waveTimer = 0;
    if (seed !== null) {
      this.rng = new SeededRNG(seed);
      this.isSeeded = true;
    } else {
      this.rng = new SeededRNG(Math.floor(Math.random() * 1000000000));
      this.isSeeded = false;
    }
  }

  // --- SPAWN LOGIC ---

  update(dt, speedMultiplier, canvasWidth, canvasHeight, playerY) {
    this.spawnTimer += dt * speedMultiplier;
    this.waveTimer += dt;

    // Dynamic spawn interval: gets faster as speed multiplier rises
    const spawnThreshold = Math.max(38, 75 - (speedMultiplier - 1) * 18);

    if (this.spawnTimer >= spawnThreshold) {
      this.spawnTimer = 0;
      this.generateWave(canvasWidth, canvasHeight, speedMultiplier);
    }

    // Occasional blue power-ups/collectibles
    if (this.rng.next() < 0.025 * dt) {
      this.spawnCollectible(canvasWidth);
    }

    // Update obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.update(dt, speedMultiplier, canvasWidth, canvasHeight);
      if (obs.isOffscreen(canvasHeight, canvasWidth)) {
        this.obstacles.splice(i, 1);
      }
    }

    // Update collectibles
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const col = this.collectibles[i];
      col.update(dt, speedMultiplier);
      if (col.isOffscreen(canvasHeight)) {
        this.collectibles.splice(i, 1);
      }
    }
  }

  generateWave(width, height, speedMultiplier) {
    const roll = this.rng.next();

    // Stage progression based on speedMultiplier
    if (speedMultiplier < 1.3) {
      // Early stage: single orbs, simple bars, zigzags
      if (roll < 0.5) this.spawnRedOrbs(width, 1 + Math.floor(this.rng.next() * 2));
      else if (roll < 0.8) this.spawnRedBar(width);
      else this.spawnZigZag(width);
    } else if (speedMultiplier < 1.8) {
      // Mid stage: spinners, swept gates, moving bars
      if (roll < 0.35) this.spawnRedSpinner(width);
      else if (roll < 0.65) this.spawnRedBar(width);
      else if (roll < 0.85) this.spawnRedOrbs(width, 2 + Math.floor(this.rng.next() * 2));
      else this.spawnZigZag(width);
    } else {
      // High speed / Adrenaline stage: double spinners, laser gates, dense waves
      if (roll < 0.3) this.spawnRedSpinner(width);
      else if (roll < 0.55) this.spawnLaserGate(width);
      else if (roll < 0.8) this.spawnSweptBarPair(width);
      else this.spawnRedOrbs(width, 3);
    }
  }

  spawnRedOrbs(width, count = 2) {
    const spacing = width / (count + 1);
    for (let i = 0; i < count; i++) {
      const x = spacing * (i + 1) + this.rng.range(-spacing * 0.3, spacing * 0.3);
      const radius = this.rng.range(14, 24);
      const vy = this.rng.range(2.8, 4.2);
      const vx = this.rng.range(-0.8, 0.8);
      this.obstacles.push(new RedOrb(x, -radius - 10, radius, vx, vy));
    }
  }

  spawnRedBar(width) {
    const gapWidth = this.rng.range(90, 130);
    const gapX = this.rng.range(20, width - gapWidth - 20);
    const height = this.rng.range(16, 24);
    const vy = this.rng.range(2.5, 3.8);
    const vx = (this.rng.next() > 0.6) ? this.rng.range(-1.2, 1.2) : 0;
    this.obstacles.push(new RedBarWithGap(gapX, gapWidth, -height - 10, height, width, vx, vy));
  }

  spawnSweptBarPair(width) {
    const height = 18;
    const vy = 3.5;
    // Left barrier & Right barrier moving inward
    this.obstacles.push(new RedBarWithGap(width * 0.5 - 50, 100, -height - 10, height, width, 0, vy));
  }

  spawnRedSpinner(width) {
    const x = this.rng.range(width * 0.25, width * 0.75);
    const armLength = this.rng.range(55, 80);
    const arms = this.rng.next() > 0.7 ? 4 : 2;
    const rotSpeed = (this.rng.next() > 0.5 ? 1 : -1) * this.rng.range(0.03, 0.055);
    const vy = this.rng.range(2.2, 3.4);
    this.obstacles.push(new RedSpinner(x, -armLength - 20, armLength, arms, rotSpeed, vy));
  }

  spawnZigZag(width) {
    const radius = this.rng.range(16, 22);
    const x = this.rng.choice([radius + 10, width - radius - 10]);
    const vx = (x < width / 2 ? 1 : -1) * this.rng.range(3.0, 4.5);
    const vy = this.rng.range(2.6, 3.8);
    this.obstacles.push(new RedZigZag(x, -radius - 10, radius, vx, vy));
  }

  spawnLaserGate(width) {
    const y = -30;
    const vy = 3.0;
    this.obstacles.push(new RedLaserGate(y, width, vy));
  }

  spawnCollectible(width) {
    const roll = this.rng.next();
    const x = this.rng.range(30, width - 30);
    const y = -25;
    const vy = this.rng.range(2.2, 3.2);

    if (roll < 0.65) {
      // Blue Energy Orb
      this.collectibles.push(new BlueEnergyOrb(x, y, vy));
    } else if (roll < 0.85) {
      // Blue Shield Powerup
      this.collectibles.push(new BlueShieldPowerup(x, y, vy));
    } else {
      // Blue Chrono Time Warp Gem
      this.collectibles.push(new BlueChronoGem(x, y, vy));
    }
  }

  // --- COLLISION & NEAR-MISS DETECTION ---

  checkCollisions(player) {
    const results = {
      hitRed: false,
      nearMissCount: 0,
      collected: []
    };

    const px = player.x;
    const py = player.y;
    const pr = player.radius;

    // Check Red Hazards
    for (const obs of this.obstacles) {
      // 1. Direct lethal collision
      if (obs.collidesWith(px, py, pr)) {
        results.hitRed = true;
        results.hitObstacle = obs;
        return results; // Lethal hit takes priority
      }

      // 2. Near-miss grazes
      if (!obs.nearMissTriggered && obs.isNearMiss(px, py, pr + this.nearMissRadiusBuffer)) {
        obs.nearMissTriggered = true;
        results.nearMissCount++;
      }
    }

    // Check Blue Collectibles
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const col = this.collectibles[i];
      const dx = px - col.x;
      const dy = py - col.y;
      const dist = Math.hypot(dx, dy);

      if (dist < pr + col.radius) {
        results.collected.push(col);
        this.collectibles.splice(i, 1);
      }
    }

    return results;
  }

  render(ctx) {
    // Render Blue Collectibles
    for (const col of this.collectibles) {
      col.render(ctx);
    }
    // Render Red Hazards
    for (const obs of this.obstacles) {
      obs.render(ctx);
    }
  }
}

// ================= RED HAZARDS =================

class RedOrb {
  constructor(x, y, radius, vx, vy) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.vx = vx;
    this.vy = vy;
    this.pulse = Math.random() * Math.PI * 2;
    this.nearMissTriggered = false;
  }

  update(dt, speedMultiplier, canvasWidth) {
    this.y += this.vy * speedMultiplier * dt;
    this.x += this.vx * speedMultiplier * dt;
    this.pulse += 0.08 * dt;

    // Bounce off side walls
    if (this.x - this.radius < 0) {
      this.x = this.radius;
      this.vx = Math.abs(this.vx);
    } else if (this.x + this.radius > canvasWidth) {
      this.x = canvasWidth - this.radius;
      this.vx = -Math.abs(this.vx);
    }
  }

  isOffscreen(canvasHeight) {
    return this.y - this.radius > canvasHeight + 20;
  }

  collidesWith(px, py, pr) {
    const dist = Math.hypot(px - this.x, py - this.y);
    return dist < pr + this.radius * 0.88;
  }

  isNearMiss(px, py, bufferDist) {
    const dist = Math.hypot(px - this.x, py - this.y);
    return dist < bufferDist + this.radius;
  }

  render(ctx) {
    ctx.save();
    const glow = Math.sin(this.pulse) * 4 + 14;
    ctx.shadowColor = '#ff0055';
    ctx.shadowBlur = glow;

    // Outer hazard aura
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(this.x, this.y, this.radius * 0.2, this.x, this.y, this.radius);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.35, '#ff1744');
    grad.addColorStop(1, '#b7002e');
    ctx.fillStyle = grad;
    ctx.fill();

    // Spiky cyber ring
    ctx.strokeStyle = '#ff80ab';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }
}

class RedBarWithGap {
  constructor(gapX, gapWidth, y, height, screenWidth, vx, vy) {
    this.gapX = gapX;
    this.gapWidth = gapWidth;
    this.y = y;
    this.height = height;
    this.screenWidth = screenWidth;
    this.vx = vx;
    this.vy = vy;
    this.nearMissTriggered = false;
  }

  update(dt, speedMultiplier, canvasWidth) {
    this.y += this.vy * speedMultiplier * dt;
    this.gapX += this.vx * speedMultiplier * dt;

    if (this.gapX < 15) {
      this.gapX = 15;
      this.vx = Math.abs(this.vx);
    } else if (this.gapX + this.gapWidth > canvasWidth - 15) {
      this.gapX = canvasWidth - 15 - this.gapWidth;
      this.vx = -Math.abs(this.vx);
    }
  }

  isOffscreen(canvasHeight) {
    return this.y > canvasHeight + 20;
  }

  collidesWith(px, py, pr) {
    // Check if player's Y overlaps with the bar
    if (py + pr > this.y && py - pr < this.y + this.height) {
      // Safe inside the gap
      const inGap = (px - pr > this.gapX && px + pr < this.gapX + this.gapWidth);
      return !inGap;
    }
    return false;
  }

  isNearMiss(px, py, bufferDist) {
    if (Math.abs(py - (this.y + this.height / 2)) < bufferDist) {
      // Check proximity to left or right edge of the gap
      const distLeft = Math.abs(px - this.gapX);
      const distRight = Math.abs(px - (this.gapX + this.gapWidth));
      return (distLeft < bufferDist || distRight < bufferDist);
    }
    return false;
  }

  render(ctx) {
    ctx.save();
    ctx.shadowColor = '#ff003c';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#ff003c';

    // Left block
    if (this.gapX > 0) {
      ctx.fillRect(0, this.y, this.gapX, this.height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, this.y + 2, this.gapX, 2);
    }

    // Right block
    ctx.fillStyle = '#ff003c';
    const rightX = this.gapX + this.gapWidth;
    if (rightX < this.screenWidth) {
      ctx.fillRect(rightX, this.y, this.screenWidth - rightX, this.height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(rightX, this.y + 2, this.screenWidth - rightX, 2);
    }

    // Gap edge warning indicators
    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.arc(this.gapX, this.y + this.height / 2, 3, 0, Math.PI * 2);
    ctx.arc(this.gapX + this.gapWidth, this.y + this.height / 2, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

class RedSpinner {
  constructor(x, y, armLength, arms = 2, rotSpeed = 0.04, vy = 2.8) {
    this.x = x;
    this.y = y;
    this.armLength = armLength;
    this.arms = arms;
    this.angle = 0;
    this.rotSpeed = rotSpeed;
    this.vy = vy;
    this.nearMissTriggered = false;
  }

  update(dt, speedMultiplier) {
    this.y += this.vy * speedMultiplier * dt;
    this.angle += this.rotSpeed * speedMultiplier * dt;
  }

  isOffscreen(canvasHeight) {
    return this.y - this.armLength > canvasHeight + 20;
  }

  collidesWith(px, py, pr) {
    for (let i = 0; i < this.arms; i++) {
      const armAngle = this.angle + (i * (Math.PI * 2 / this.arms));
      const endX = this.x + Math.cos(armAngle) * this.armLength;
      const endY = this.y + Math.sin(armAngle) * this.armLength;

      // Distance from player center to line segment (x, y) -> (endX, endY)
      const dist = distToSegment({ x: px, y: py }, { x: this.x, y: this.y }, { x: endX, y: endY });
      if (dist < pr + 7) return true;
    }
    return false;
  }

  isNearMiss(px, py, bufferDist) {
    for (let i = 0; i < this.arms; i++) {
      const armAngle = this.angle + (i * (Math.PI * 2 / this.arms));
      const endX = this.x + Math.cos(armAngle) * this.armLength;
      const endY = this.y + Math.sin(armAngle) * this.armLength;
      const dist = distToSegment({ x: px, y: py }, { x: this.x, y: this.y }, { x: endX, y: endY });
      if (dist < bufferDist + 8) return true;
    }
    return false;
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.shadowColor = '#ff0044';
    ctx.shadowBlur = 15;

    // Center hub
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#ff1744';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Arms
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#ff003c';
    ctx.lineCap = 'round';

    for (let i = 0; i < this.arms; i++) {
      const armAngle = this.angle + (i * (Math.PI * 2 / this.arms));
      ctx.beginPath();
      ctx.moveTo(0, 0);
      const ex = Math.cos(armAngle) * this.armLength;
      const ey = Math.sin(armAngle) * this.armLength;
      ctx.lineTo(ex, ey);
      ctx.stroke();

      // Blade tip
      ctx.beginPath();
      ctx.arc(ex, ey, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }

    ctx.restore();
  }
}

class RedZigZag {
  constructor(x, y, radius, vx, vy) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.vx = vx;
    this.vy = vy;
    this.nearMissTriggered = false;
  }

  update(dt, speedMultiplier, canvasWidth) {
    this.y += this.vy * speedMultiplier * dt;
    this.x += this.vx * speedMultiplier * dt;

    if (this.x - this.radius <= 0) {
      this.x = this.radius;
      this.vx = Math.abs(this.vx);
    } else if (this.x + this.radius >= canvasWidth) {
      this.x = canvasWidth - this.radius;
      this.vx = -Math.abs(this.vx);
    }
  }

  isOffscreen(canvasHeight) {
    return this.y - this.radius > canvasHeight + 20;
  }

  collidesWith(px, py, pr) {
    return Math.hypot(px - this.x, py - this.y) < pr + this.radius;
  }

  isNearMiss(px, py, bufferDist) {
    return Math.hypot(px - this.x, py - this.y) < bufferDist + this.radius;
  }

  render(ctx) {
    ctx.save();
    ctx.shadowColor = '#ff1744';
    ctx.shadowBlur = 14;

    // Diamond shaped kinetic bouncer
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = '#ff0055';
    ctx.fillRect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);
    ctx.restore();

    ctx.restore();
  }
}

class RedLaserGate {
  constructor(y, screenWidth, vy) {
    this.y = y;
    this.screenWidth = screenWidth;
    this.vy = vy;
    this.timer = 0;
    this.state = 'warning'; // 'warning' -> 'firing'
    this.nearMissTriggered = false;
  }

  update(dt, speedMultiplier) {
    this.y += this.vy * speedMultiplier * dt;
    this.timer += dt;
    if (this.timer > 45 && this.state === 'warning') {
      this.state = 'firing';
    }
  }

  isOffscreen(canvasHeight) {
    return this.y > canvasHeight + 30;
  }

  collidesWith(px, py, pr) {
    if (this.state === 'firing') {
      return (py + pr > this.y - 10 && py - pr < this.y + 10);
    }
    return false;
  }

  isNearMiss(px, py, bufferDist) {
    if (this.state === 'firing') {
      return Math.abs(py - this.y) < bufferDist + 10;
    }
    return false;
  }

  render(ctx) {
    ctx.save();
    if (this.state === 'warning') {
      // Dotted blinking warning line
      ctx.strokeStyle = 'rgba(255, 0, 85, 0.4)';
      ctx.setLineDash([8, 8]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, this.y);
      ctx.lineTo(this.screenWidth, this.y);
      ctx.stroke();

      ctx.fillStyle = '#ff0055';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('⚠ WARNING: LASER ARMED ⚠', this.screenWidth / 2 - 80, this.y - 5);
    } else {
      // Blazing lethal laser
      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = 20;
      ctx.strokeStyle = '#ff0055';
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(0, this.y);
      ctx.lineTo(this.screenWidth, this.y);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.stroke();
    }
    ctx.restore();
  }
}

// ================= BLUE OBJECTS (SAFE & COLLECTIBLE) =================

class BlueEnergyOrb {
  constructor(x, y, vy) {
    this.x = x;
    this.y = y;
    this.radius = 12;
    this.vy = vy;
    this.pulse = Math.random() * Math.PI * 2;
    this.type = 'orb';
    this.points = 150;
  }

  update(dt, speedMultiplier) {
    this.y += this.vy * speedMultiplier * dt;
    this.pulse += 0.1 * dt;
  }

  isOffscreen(canvasHeight) {
    return this.y - this.radius > canvasHeight + 20;
  }

  render(ctx) {
    ctx.save();
    const glow = Math.sin(this.pulse) * 4 + 12;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = glow;

    // Glowing cyan sphere with sparkling core
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(this.x, this.y, 2, this.x, this.y, this.radius);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.4, '#00f0ff');
    grad.addColorStop(1, '#0066ff');
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }
}

class BlueShieldPowerup {
  constructor(x, y, vy) {
    this.x = x;
    this.y = y;
    this.radius = 16;
    this.vy = vy;
    this.pulse = 0;
    this.type = 'shield';
  }

  update(dt, speedMultiplier) {
    this.y += this.vy * speedMultiplier * dt;
    this.pulse += 0.08 * dt;
  }

  isOffscreen(canvasHeight) {
    return this.y - this.radius > canvasHeight + 20;
  }

  render(ctx) {
    ctx.save();
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 16;

    // Outer shield badge
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius + Math.sin(this.pulse) * 2, 0, Math.PI * 2);
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = 'rgba(0, 240, 255, 0.25)';
    ctx.fill();

    // Shield icon in center
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🛡️', this.x, this.y);
    ctx.restore();
  }
}

class BlueChronoGem {
  constructor(x, y, vy) {
    this.x = x;
    this.y = y;
    this.radius = 14;
    this.vy = vy;
    this.pulse = 0;
    this.type = 'chrono';
  }

  update(dt, speedMultiplier) {
    this.y += this.vy * speedMultiplier * dt;
    this.pulse += 0.12 * dt;
  }

  isOffscreen(canvasHeight) {
    return this.y - this.radius > canvasHeight + 20;
  }

  render(ctx) {
    ctx.save();
    ctx.shadowColor = '#00d2ff';
    ctx.shadowBlur = 15;

    // Hexagonal chrono crystal
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.pulse);
    ctx.fillStyle = '#00e5ff';
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const hx = Math.cos(angle) * this.radius;
      const hy = Math.sin(angle) * this.radius;
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // Hourglass icon
    ctx.fillStyle = '#ffffff';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⏳', this.x, this.y);

    ctx.restore();
  }
}

// Distance helper from point P to line segment AB
function distToSegment(p, a, b) {
  const l2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
  if (l2 === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * (b.x - a.x)), p.y - (a.y + t * (b.y - a.y)));
}

window.obstacleManager = new ObstacleManager();
