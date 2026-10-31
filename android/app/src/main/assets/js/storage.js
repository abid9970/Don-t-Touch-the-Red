/**
 * Storage & State Manager for "DON'T TOUCH THE RED"
 * LocalStorage persistence, streaks, simulated global leaderboard, and achievement tracking.
 */
class StorageManager {
  constructor() {
    this.STORAGE_KEY = 'dont_touch_the_red_v1';
    this.LEADERBOARD_KEY = 'dont_touch_the_red_lb_v1';
    this.data = this.loadData();
    this.leaderboard = this.loadLeaderboard();
  }

  getDefaultData() {
    return {
      highScore: 0,
      gamesPlayed: 0,
      totalNearMisses: 0,
      totalOrbsCollected: 0,
      maxComboEver: 0,
      totalTimeSurvived: 0,
      gamerTag: 'NeonRider_' + Math.floor(100 + Math.random() * 900),
      selectedSkin: 'cyan',
      unlockedSkins: ['cyan'],
      streak: {
        count: 1,
        lastDate: null,
        highestStreak: 1
      },
      settings: {
        bgm: true,
        sfx: true,
        screenShake: true,
        touchOffset: true // lifts ball slightly above finger so thumb doesn't block view
      },
      achievements: {
        first_blood: { id: 'first_blood', name: 'First Contact', desc: 'Survive your first 5 seconds', icon: '🐣', unlocked: false, date: null },
        red_lover: { id: 'red_lover', name: 'Red Magnet', desc: 'Crash in under 3 seconds', icon: '🧲', unlocked: false, date: null },
        close_shave: { id: 'close_shave', name: 'Adrenaline Junkie', desc: 'Trigger 5 near-misses in a single game', icon: '⚡', unlocked: false, date: null },
        combo_king: { id: 'combo_king', name: 'Combo Master', desc: 'Reach a 5x Combo multiplier', icon: '🔥', unlocked: false, date: null },
        shield_hero: { id: 'shield_hero', name: 'Invincible Force', desc: 'Absorb a lethal red hit with a Blue Shield', icon: '🛡️', unlocked: false, date: null },
        speed_demon: { id: 'speed_demon', name: 'Speed Demon', desc: 'Survive to Speed Level 3 (30s)', icon: '🚀', unlocked: false, date: null },
        centurion: { id: 'centurion', name: 'Time Bender', desc: 'Survive for over 60 seconds in one run', icon: '⏳', unlocked: false, date: null },
        high_roller: { id: 'high_roller', name: 'Cyber Legend', desc: 'Score over 15,000 points', icon: '👑', unlocked: false, date: null },
        daily_hero: { id: 'daily_hero', name: 'Daily Champion', desc: 'Complete a Daily Challenge run', icon: '📅', unlocked: false, date: null },
        streak_master: { id: 'streak_master', name: 'Streak Flame', desc: 'Reach a 3-day play streak', icon: '🔥', unlocked: false, date: null },
        social_butterfly: { id: 'social_butterfly', name: 'Viral Legend', desc: 'Share your scorecard or challenge a friend', icon: '📢', unlocked: false, date: null }
      },
      dailyHistory: {} // YYYY-MM-DD: score
    };
  }

  loadData() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return this.getDefaultData();
      const parsed = JSON.parse(raw);
      // Merge with defaults to ensure any new keys exist
      const defaults = this.getDefaultData();
      return {
        ...defaults,
        ...parsed,
        settings: { ...defaults.settings, ...(parsed.settings || {}) },
        streak: { ...defaults.streak, ...(parsed.streak || {}) },
        achievements: { ...defaults.achievements, ...(parsed.achievements || {}) },
        unlockedSkins: parsed.unlockedSkins || defaults.unlockedSkins
      };
    } catch (e) {
      console.warn('Failed to load localStorage data', e);
      return this.getDefaultData();
    }
  }

  saveData() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Failed to save data', e);
    }
  }

  // --- STREAK MANAGEMENT ---

  checkAndUpdateStreak() {
    const today = new Date().toISOString().split('T')[0];
    const streak = this.data.streak;

    if (!streak.lastDate) {
      streak.count = 1;
      streak.lastDate = today;
      streak.highestStreak = 1;
    } else if (streak.lastDate === today) {
      // Already logged today
    } else {
      const last = new Date(streak.lastDate);
      const curr = new Date(today);
      const diffDays = Math.round((curr - last) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        streak.count += 1;
        if (streak.count > (streak.highestStreak || 1)) {
          streak.highestStreak = streak.count;
        }
      } else {
        streak.count = 1; // streak broken
      }
      streak.lastDate = today;
    }

    if (streak.count >= 3) {
      this.unlockAchievement('streak_master');
      this.unlockSkin('emerald');
    }

    this.saveData();
    return streak;
  }

  // --- SCORE & STATS ---

  saveRun(score, time, nearMisses, orbs, maxCombo) {
    this.data.gamesPlayed++;
    this.data.totalNearMisses += nearMisses;
    this.data.totalOrbsCollected += orbs;
    this.data.totalTimeSurvived += time;
    if (maxCombo > this.data.maxComboEver) {
      this.data.maxComboEver = maxCombo;
    }

    let isNewBest = false;
    if (score > this.data.highScore) {
      this.data.highScore = score;
      isNewBest = true;
    }

    // Check unlocks based on score
    if (this.data.highScore >= 5000) this.unlockSkin('purple');
    if (this.data.highScore >= 12000) this.unlockSkin('gold');
    if (this.data.highScore >= 20000) this.unlockSkin('rainbow');

    // Update leaderboard
    this.updateLeaderboard(score);

    this.saveData();
    return { isNewBest, highScore: this.data.highScore };
  }

  saveDailyRun(dateStr, score) {
    if (!this.data.dailyHistory[dateStr] || score > this.data.dailyHistory[dateStr]) {
      this.data.dailyHistory[dateStr] = score;
    }
    this.unlockAchievement('daily_hero');
    this.saveData();
  }

  // --- SKINS ---

  unlockSkin(skinId) {
    if (!this.data.unlockedSkins.includes(skinId)) {
      this.data.unlockedSkins.push(skinId);
      this.saveData();
    }
  }

  setSkin(skinId) {
    if (this.data.unlockedSkins.includes(skinId)) {
      this.data.selectedSkin = skinId;
      this.saveData();
      return true;
    }
    return false;
  }

  // --- ACHIEVEMENTS ---

  unlockAchievement(id, onUnlock) {
    const ach = this.data.achievements[id];
    if (ach && !ach.unlocked) {
      ach.unlocked = true;
      ach.date = new Date().toLocaleDateString();
      this.saveData();
      if (typeof onUnlock === 'function') {
        onUnlock(ach);
      }
      return ach;
    }
    return null;
  }

  // --- SIMULATED GLOBAL LEADERBOARD ARCHITECTURE ---

  getDefaultLeaderboard() {
    return [
      { rank: 1, name: 'Viper_X', country: '🇯🇵', score: 38450, isUser: false },
      { rank: 2, name: 'KiraZen', country: '🇰🇷', score: 32180, isUser: false },
      { rank: 3, name: 'Phantom99', country: '🇺🇸', score: 28940, isUser: false },
      { rank: 4, name: 'CyberGlitch', country: '🇩🇪', score: 24710, isUser: false },
      { rank: 5, name: 'NeonPulse', country: '🇬🇧', score: 21600, isUser: false },
      { rank: 6, name: 'AeroZero', country: '🇧🇷', score: 18450, isUser: false },
      { rank: 7, name: 'ShadowByte', country: '🇨🇦', score: 16200, isUser: false },
      { rank: 8, name: 'ApexRider', country: '🇫🇷', score: 14190, isUser: false },
      { rank: 9, name: 'CosmicRay', country: '🇦🇺', score: 12050, isUser: false },
      { rank: 10, name: 'VoltStrike', country: '🇸🇬', score: 10420, isUser: false },
      { rank: 11, name: 'HyperNova', country: '🇳🇱', score: 8900, isUser: false },
      { rank: 12, name: 'ByteMaster', country: '🇸🇪', score: 7650, isUser: false }
    ];
  }

  loadLeaderboard() {
    try {
      const raw = localStorage.getItem(this.LEADERBOARD_KEY);
      if (!raw) return this.getDefaultLeaderboard();
      return JSON.parse(raw);
    } catch (e) {
      return this.getDefaultLeaderboard();
    }
  }

  saveLeaderboard() {
    try {
      localStorage.setItem(this.LEADERBOARD_KEY, JSON.stringify(this.leaderboard));
    } catch (e) {}
  }

  updateLeaderboard(userScore) {
    if (userScore <= 0) return;
    
    // Remove existing user entry
    this.leaderboard = this.leaderboard.filter(e => !e.isUser);

    // Add current user
    this.leaderboard.push({
      rank: 0,
      name: this.data.gamerTag,
      country: '🌐',
      score: Math.max(userScore, this.data.highScore),
      isUser: true
    });

    // Sort descending
    this.leaderboard.sort((a, b) => b.score - a.score);

    // Re-assign ranks
    this.leaderboard.forEach((entry, idx) => {
      entry.rank = idx + 1;
    });

    this.saveLeaderboard();
  }

  getUserRank() {
    const userEntry = this.leaderboard.find(e => e.isUser);
    if (!userEntry) {
      return { rank: 100, percentile: 'Top 99%' };
    }
    const totalSimulatedPlayers = 10000;
    const rank = userEntry.rank;
    // Calculate realistic viral percentile
    const pct = Math.max(0.1, ((rank / 100) * 1.5)).toFixed(1);
    return {
      rank,
      percentile: `Top ${pct}% Global`
    };
  }

  setGamerTag(newName) {
    if (!newName || !newName.trim()) return;
    this.data.gamerTag = newName.trim().substring(0, 15);
    this.saveData();
    // Also update leaderboard entry name
    this.leaderboard.forEach(e => {
      if (e.isUser) e.name = this.data.gamerTag;
    });
    this.saveLeaderboard();
  }
}

window.storageManager = new StorageManager();
