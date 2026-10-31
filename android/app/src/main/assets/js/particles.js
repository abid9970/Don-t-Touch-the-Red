/**
 * Particle and Visual Effects Engine for "DON'T TOUCH THE RED"
 * High-performance 60FPS particle pool, shockwaves, floating combat text, and screen shake.
 */
class ParticleEngine {
  constructor() {
    this.particles = [];
    this.floatingTexts = [];
    this.shockwaves = [];
    this.maxParticles = 350;
  }

  reset() {
    this.particles = [];
    this.floatingTexts = [];
    this.shockwaves = [];
  }

  // --- PARTICLE CREATION ---

  emitTrail(x, y, color = '#00f0ff', radius = 6) {
    if (this.particles.length >= this.maxParticles) return;
    this.particles.push({
      x: x + (Math.random() - 0.5) * 4,
      y: y + (Math.random() - 0.5) * 4,
      vx: (Math.random() - 0.5) * 0.8,
      vy: Math.random() * 1.5 + 0.5,
      radius: radius * (0.5 + Math.random() * 0.5),
      color: color,
      alpha: 0.8,
      decay: 0.04 + Math.random() * 0.02,
      shape: 'circle'
    });
  }

  emitNearMissSparks(x, y) {
    const count = 16;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 3 + 1.5,
        color: Math.random() > 0.5 ? '#00f0ff' : '#ffffff',
        alpha: 1,
        decay: 0.035,
        shape: 'spark'
      });
    }
  }

  emitOrbCollect(x, y, color = '#00f0ff') {
    const count = 22;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() * 0.3);
      const speed = Math.random() * 4 + 2;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 4 + 2,
        color: color,
        alpha: 1,
        decay: 0.03,
        shape: 'star'
      });
    }

    this.shockwaves.push({
      x: x,
      y: y,
      radius: 5,
      maxRadius: 60,
      color: color,
      lineWidth: 3,
      alpha: 0.9,
      speed: 4
    });
  }

  emitDeathExplosion(x, y) {
    // Red and glowing shards burst
    const count = 75;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 1.5;
      const isRed = Math.random() > 0.35;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 6 + 2,
        color: isRed ? '#ff0055' : '#00f0ff',
        alpha: 1,
        decay: Math.random() * 0.02 + 0.015,
        shape: 'shard',
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.3
      });
    }

    // Heavy red shockwave
    this.shockwaves.push({
      x: x,
      y: y,
      radius: 10,
      maxRadius: 180,
      color: '#ff0055',
      lineWidth: 6,
      alpha: 1,
      speed: 7
    });
    this.shockwaves.push({
      x: x,
      y: y,
      radius: 5,
      maxRadius: 120,
      color: '#ffffff',
      lineWidth: 3,
      alpha: 1,
      speed: 9
    });
  }

  emitFloatingText(text, x, y, color = '#ffffff', fontSize = 16, bold = true) {
    this.floatingTexts.push({
      text: text,
      x: x,
      y: y,
      vy: -1.6,
      color: color,
      alpha: 1.0,
      decay: 0.02,
      scale: 1.2,
      fontSize: fontSize,
      bold: bold
    });
  }

  // --- UPDATE & RENDER LOOP ---

  update(dt = 1) {
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha -= p.decay * dt;
      if (p.rotation !== undefined) {
        p.rotation += (p.rotSpeed || 0) * dt;
      }
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += sw.speed * dt;
      sw.alpha -= (sw.speed / sw.maxRadius) * dt;
      if (sw.radius >= sw.maxRadius || sw.alpha <= 0) {
        this.shockwaves.splice(i, 1);
      }
    }

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.alpha -= ft.decay * dt;
      if (ft.scale > 1.0) {
        ft.scale -= 0.03 * dt;
      }
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  render(ctx) {
    ctx.save();

    // Render shockwaves
    for (const sw of this.shockwaves) {
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.strokeStyle = sw.color;
      ctx.globalAlpha = Math.max(0, sw.alpha);
      ctx.lineWidth = sw.lineWidth;
      ctx.shadowColor = sw.color;
      ctx.shadowBlur = 12;
      ctx.stroke();
    }

    // Render particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;

      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'spark') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'shard') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation || 0);
        ctx.fillRect(-p.radius, -p.radius * 0.5, p.radius * 2, p.radius);
      } else if (p.shape === 'star') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    // Render floating combat texts
    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.font = `${ft.bold ? 'bold ' : ''}${Math.round(ft.fontSize * ft.scale)}px "Orbitron", "Inter", sans-serif`;
      ctx.fillStyle = ft.color;
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 10;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }

    ctx.restore();
  }
}

window.particleEngine = new ParticleEngine();
