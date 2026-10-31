/**
 * Viral Growth, Daily Challenge & Social Sharing Engine for "DON'T TOUCH THE RED"
 * Scorecard canvas generator, friend challenge link creator, daily modifier seeds, and Web Share API.
 */
class ViralEngine {
  constructor() {
    this.dailyModifiers = [
      { id: 'hyperspeed', name: 'HYPER ACCELERATION', desc: 'Game speed ramps up 50% faster! Extreme reflexes required.', speedScale: 1.5 },
      { id: 'lasermania', name: 'LASER STORM', desc: 'Dense rotating lasers and laser gates fill the arena.', speedScale: 1.1 },
      { id: 'bullethell', name: 'METEOR FRENZY', desc: 'Swarming red orbs and bouncing diamonds!', speedScale: 1.2 },
      { id: 'chronoshift', name: 'CHRONO WARP', desc: 'Frequent blue chrono gems appear. Master the slow-mo!', speedScale: 1.0 },
      { id: 'shieldrush', name: 'SHIELD OVERLOAD', desc: 'Collect shields to survive the relentless red onslaught.', speedScale: 1.25 }
    ];
  }

  // --- DAILY CHALLENGE SEED & CONFIG ---

  getDailySeed() {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const num = parseInt(today.replace(/-/g, ''), 10);
    return {
      dateStr: today,
      seed: num,
      modifier: this.dailyModifiers[num % this.dailyModifiers.length]
    };
  }

  getTimeUntilDailyReset() {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const diffMs = tomorrow - now;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diffMs % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // --- FRIEND CHALLENGE PARSING ---

  parseChallengeFromURL() {
    try {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      if (params.has('challenge')) {
        return {
          targetScore: parseInt(params.get('challenge'), 10) || 0,
          challengerName: params.get('challenger') || 'A rival player',
          seed: params.get('seed') ? parseInt(params.get('seed'), 10) : null
        };
      }
    } catch (e) {
      console.warn('Error parsing challenge url', e);
    }
    return null;
  }

  generateChallengeURL(score, challengerName) {
    const base = window.location.origin + window.location.pathname;
    const cleanName = encodeURIComponent(challengerName);
    return `${base}#challenge=${score}&challenger=${cleanName}`;
  }

  // --- SHARE FUNCTIONALITY ---

  async shareScore(score, timeSurvived, maxCombo, gamerTag) {
    const shareUrl = this.generateChallengeURL(score, gamerTag);
    const text = `🔴⚡ I just survived ${timeSurvived.toFixed(1)}s and scored ${score.toLocaleString()} in DON'T TOUCH THE RED! (${maxCombo}x Combo!)\n\nCan you beat my score? Play free: ${shareUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "DON'T TOUCH THE RED - Arcade Challenge",
          text: text,
          url: shareUrl
        });
        window.storageManager.unlockAchievement('social_butterfly');
        return { success: true, method: 'native' };
      } catch (err) {
        // User cancelled or fallback needed
        if (err.name !== 'AbortError') {
          return this.copyToClipboard(text);
        }
        return { success: false, method: 'cancelled' };
      }
    } else {
      return this.copyToClipboard(text);
    }
  }

  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      window.storageManager.unlockAchievement('social_butterfly');
      return { success: true, method: 'clipboard' };
    } catch (e) {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      window.storageManager.unlockAchievement('social_butterfly');
      return { success: true, method: 'clipboard' };
    }
  }

  // --- VIRAL SCORECARD GRAPHIC GENERATOR ---

  generateScoreCardImage(score, time, nearMisses, maxCombo, gamerTag, rankInfo) {
    return new Promise((resolve) => {
      const width = 800;
      const height = 1000;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      // 1. Cyber Dark Background
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#0a0b12');
      bgGrad.addColorStop(0.5, '#05060a');
      bgGrad.addColorStop(1, '#110d18');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Grid lines
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.06)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Neon frame border
      ctx.strokeStyle = '#ff0055';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = 20;
      ctx.strokeRect(20, 20, width - 40, height - 40);

      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 10;
      ctx.strokeRect(28, 28, width - 56, height - 56);

      // 2. Title & Game Logo
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ff0055';
      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = 25;
      ctx.font = '900 44px "Orbitron", "Inter", sans-serif';
      ctx.fillText("DON'T TOUCH THE RED", width / 2, 110);

      ctx.font = '600 16px "Orbitron", sans-serif';
      ctx.fillStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 12;
      ctx.fillText("NEON ARCADE SURVIVAL", width / 2, 145);

      // 3. Player Identity Badge
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(150, 180, width - 300, 60);
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 1;
      ctx.strokeRect(150, 180, width - 300, 60);

      ctx.font = 'bold 22px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 0;
      ctx.fillText(`PILOT: ${gamerTag.toUpperCase()}`, width / 2, 218);

      // 4. Giant Glow Score
      ctx.font = 'bold 20px "Orbitron", sans-serif';
      ctx.fillStyle = '#8e9aaf';
      ctx.fillText("FINAL SURVIVAL SCORE", width / 2, 310);

      ctx.font = '900 96px "Orbitron", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 30;
      ctx.fillText(score.toLocaleString(), width / 2, 405);

      // 5. Global Rank Tier Banner
      const rankBadgeGrad = ctx.createLinearGradient(width / 2 - 180, 0, width / 2 + 180, 0);
      rankBadgeGrad.addColorStop(0, '#ff0055');
      rankBadgeGrad.addColorStop(1, '#00f0ff');
      ctx.fillStyle = rankBadgeGrad;
      ctx.fillRect(width / 2 - 200, 440, 400, 45);

      ctx.fillStyle = '#000000';
      ctx.font = '900 20px "Orbitron", sans-serif';
      ctx.shadowBlur = 0;
      ctx.fillText(`🏆 RANK: ${rankInfo.percentile.toUpperCase()}`, width / 2, 470);

      // 6. Stats Grid
      const statY = 560;
      const stats = [
        { label: 'TIME SURVIVED', val: `${time.toFixed(1)}s`, icon: '⏱️' },
        { label: 'MAX COMBO', val: `${maxCombo}x`, icon: '⚡' },
        { label: 'NEAR MISSES', val: `${nearMisses}`, icon: '🎯' }
      ];

      stats.forEach((st, idx) => {
        const sx = 140 + idx * 260;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.fillRect(sx - 110, statY, 220, 100);
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
        ctx.strokeRect(sx - 110, statY, 220, 100);

        ctx.font = '24px sans-serif';
        ctx.fillText(st.icon, sx, statY + 32);

        ctx.font = 'bold 13px "Orbitron", sans-serif';
        ctx.fillStyle = '#8e9aaf';
        ctx.fillText(st.label, sx, statY + 58);

        ctx.font = '900 26px "Orbitron", sans-serif';
        ctx.fillStyle = '#00f0ff';
        ctx.fillText(st.val, sx, statY + 88);
      });

      // 7. Call To Action Tagline
      ctx.font = '900 32px "Orbitron", sans-serif';
      ctx.fillStyle = '#ff0055';
      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = 20;
      ctx.fillText("CAN YOU BEAT MY SCORE?", width / 2, 750);

      ctx.font = '16px "Orbitron", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 5;
      ctx.fillText("🔴 Touch nothing red • 🔵 Blue is safe • Reflexes only", width / 2, 800);

      // 8. Bottom Footer with Branding & URL
      ctx.fillStyle = '#8e9aaf';
      ctx.font = 'bold 15px sans-serif';
      ctx.shadowBlur = 0;
      ctx.fillText("Play instantly in your browser: #DontTouchTheRed", width / 2, 920);

      canvas.toBlob((blob) => {
        resolve({ blob, dataUrl: canvas.toDataURL('image/png') });
      }, 'image/png');
    });
  }
}

window.viralEngine = new ViralEngine();
