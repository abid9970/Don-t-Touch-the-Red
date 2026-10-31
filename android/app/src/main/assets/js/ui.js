/**
 * User Interface & Navigation Controller for "DON'T TOUCH THE RED"
 * Screen transitions, modal management, HUD updates, leaderboard rendering,
 * skins customizer, and viral scorecard preview.
 */
class UIManager {
  constructor() {
    this.currentScreen = 'welcome-screen';
    this.hudScoreEl = null;
    this.hudComboEl = null;
    this.hudComboBarEl = null;
    this.hudStageEl = null;
    this.hudTimeEl = null;
    this.hudShieldEl = null;
    this.hudFriendEl = null;
    this.activeFriendChallenge = null;
  }

  init() {
    // Cache HUD DOM Elements
    this.hudScoreEl = document.getElementById('hud-score');
    this.hudComboEl = document.getElementById('hud-combo');
    this.hudComboBarEl = document.getElementById('hud-combo-bar');
    this.hudStageEl = document.getElementById('hud-stage');
    this.hudTimeEl = document.getElementById('hud-time');
    this.hudShieldEl = document.getElementById('hud-shield-indicator');
    this.hudFriendEl = document.getElementById('hud-friend-challenge');

    this.bindEvents();
    this.refreshUserDisplay();
    this.checkURLParams();
    this.startDailyCountdownTimer();
  }

  checkURLParams() {
    const friendChallenge = window.viralEngine.parseChallengeFromURL();
    if (friendChallenge && friendChallenge.targetScore > 0) {
      this.activeFriendChallenge = friendChallenge;
      this.showToast(`⚔️ Challenge from ${friendChallenge.challengerName}! Beat ${friendChallenge.targetScore.toLocaleString()}!`, 4000);
      const challengeBanner = document.getElementById('welcome-challenge-banner');
      if (challengeBanner) {
        challengeBanner.classList.remove('hidden');
        document.getElementById('challenge-banner-text').textContent = 
          `⚔️ ${friendChallenge.challengerName} challenged you to beat ${friendChallenge.targetScore.toLocaleString()}!`;
      }
    }
  }

  bindEvents() {
    // Start / Restart Buttons
    document.getElementById('btn-play-normal').addEventListener('click', () => {
      window.soundEngine.playClick();
      window.gameEngine.startGame(false);
    });

    document.getElementById('btn-play-daily').addEventListener('click', () => {
      window.soundEngine.playClick();
      window.gameEngine.startGame(true);
    });

    document.getElementById('btn-gameover-restart').addEventListener('click', () => {
      window.soundEngine.playClick();
      window.gameEngine.startGame(window.gameEngine.isDailyMode);
    });

    // Pause / Resume Buttons
    document.getElementById('btn-hud-pause').addEventListener('click', () => {
      window.soundEngine.playClick();
      window.gameEngine.pauseGame();
    });

    document.getElementById('btn-pause-resume').addEventListener('click', () => {
      window.soundEngine.playClick();
      window.gameEngine.resumeGame();
    });

    document.getElementById('btn-pause-restart').addEventListener('click', () => {
      window.soundEngine.playClick();
      this.hidePauseModal();
      window.gameEngine.startGame(window.gameEngine.isDailyMode);
    });

    document.getElementById('btn-pause-quit').addEventListener('click', () => {
      window.soundEngine.playClick();
      this.hidePauseModal();
      window.gameEngine.state = 'MENU';
      window.soundEngine.stopBGM();
      this.showScreen('welcome-screen');
      this.refreshUserDisplay();
    });

    // Audio & Sound Toggles
    const toggleSfxButtons = document.querySelectorAll('.btn-toggle-sfx');
    toggleSfxButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        window.soundEngine.playClick();
        const active = window.soundEngine.toggleSFX();
        window.storageManager.data.settings.sfx = active;
        window.storageManager.saveData();
        this.updateAudioIcons();
      });
    });

    const toggleBgmButtons = document.querySelectorAll('.btn-toggle-bgm');
    toggleBgmButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        window.soundEngine.playClick();
        const active = window.soundEngine.toggleBGM();
        window.storageManager.data.settings.bgm = active;
        window.storageManager.saveData();
        this.updateAudioIcons();
      });
    });

    // Screen Navigations
    document.getElementById('btn-open-instructions').addEventListener('click', () => {
      window.soundEngine.playClick();
      this.showModal('modal-instructions');
    });

    document.getElementById('btn-open-leaderboard').addEventListener('click', () => {
      window.soundEngine.playClick();
      this.renderLeaderboardTable('global');
      this.showModal('modal-leaderboard');
    });

    document.getElementById('btn-open-daily').addEventListener('click', () => {
      window.soundEngine.playClick();
      this.renderDailyChallengeModal();
      this.showModal('modal-daily');
    });

    document.getElementById('btn-open-achievements').addEventListener('click', () => {
      window.soundEngine.playClick();
      this.renderAchievementsGrid();
      this.showModal('modal-achievements');
    });

    document.getElementById('btn-open-skins').addEventListener('click', () => {
      window.soundEngine.playClick();
      this.renderSkinsGrid();
      this.showModal('modal-skins');
    });

    // Close Modals
    document.querySelectorAll('.btn-close-modal').forEach(btn => {
      btn.addEventListener('click', () => {
        window.soundEngine.playClick();
        const modal = btn.closest('.modal-overlay');
        if (modal) modal.classList.add('hidden');
      });
    });

    // GamerTag Edit
    const editTagBtn = document.getElementById('btn-edit-gamertag');
    if (editTagBtn) {
      editTagBtn.addEventListener('click', () => {
        const current = window.storageManager.data.gamerTag;
        const newTag = prompt('Enter your Cyber GamerTag (max 15 chars):', current);
        if (newTag && newTag.trim()) {
          window.storageManager.setGamerTag(newTag);
          this.refreshUserDisplay();
          this.showToast(`GamerTag updated to: ${window.storageManager.data.gamerTag}`);
        }
      });
    }

    // Leaderboard Tabs
    document.querySelectorAll('.lb-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        window.soundEngine.playClick();
        document.querySelectorAll('.lb-tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        this.renderLeaderboardTable(e.target.dataset.tab);
      });
    });

    // Viral Action Buttons on Game Over Screen
    document.getElementById('btn-gameover-share').addEventListener('click', async () => {
      window.soundEngine.playClick();
      const score = window.gameEngine.score;
      const time = window.gameEngine.timeSurvived;
      const combo = window.gameEngine.maxCombo;
      const tag = window.storageManager.data.gamerTag;
      const res = await window.viralEngine.shareScore(score, time, combo, tag);
      if (res.success) {
        this.showToast(res.method === 'native' ? 'Shared successfully!' : 'Score challenge copied to clipboard! 📋');
      }
    });

    document.getElementById('btn-gameover-challenge').addEventListener('click', async () => {
      window.soundEngine.playClick();
      const score = Math.round(window.gameEngine.score);
      const tag = window.storageManager.data.gamerTag;
      const url = window.viralEngine.generateChallengeURL(score, tag);
      const challengeText = `⚔️ CHALLENGE FROM ${tag.toUpperCase()}!\nI scored ${score.toLocaleString()} in DON'T TOUCH THE RED!\nCan you beat my score? Play here: ${url}`;
      const res = await window.viralEngine.copyToClipboard(challengeText);
      if (res.success) {
        this.showToast('⚔️ Friend challenge link copied to clipboard!');
      }
    });

    document.getElementById('btn-gameover-card').addEventListener('click', async () => {
      window.soundEngine.playClick();
      this.showToast('Generating HD Cyber Scorecard...');
      const score = Math.round(window.gameEngine.score);
      const time = window.gameEngine.timeSurvived;
      const nearMisses = window.gameEngine.nearMissCount;
      const combo = window.gameEngine.maxCombo;
      const tag = window.storageManager.data.gamerTag;
      const rankInfo = window.storageManager.getUserRank();

      const card = await window.viralEngine.generateScoreCardImage(score, time, nearMisses, combo, tag, rankInfo);
      
      // Auto download scorecard image
      const link = document.createElement('a');
      link.download = `DontTouchTheRed_${score}pts.png`;
      link.href = card.dataUrl;
      link.click();
      this.showToast('📸 Scorecard downloaded! Share it on social media!');
    });

    document.getElementById('btn-gameover-menu').addEventListener('click', () => {
      window.soundEngine.playClick();
      window.gameEngine.state = 'MENU';
      this.showScreen('welcome-screen');
      this.refreshUserDisplay();
    });

    // Touch Offset Toggle Setting
    const touchOffsetCheckbox = document.getElementById('setting-touch-offset');
    if (touchOffsetCheckbox) {
      touchOffsetCheckbox.checked = window.storageManager.data.settings.touchOffset;
      touchOffsetCheckbox.addEventListener('change', (e) => {
        window.storageManager.data.settings.touchOffset = e.target.checked;
        window.storageManager.saveData();
      });
    }
  }

  // --- SCREEN & MODAL MANAGEMENT ---

  showScreen(screenId) {
    document.querySelectorAll('.game-screen').forEach(s => s.classList.add('hidden'));
    const target = document.getElementById(screenId);
    if (target) target.classList.remove('hidden');
    this.currentScreen = screenId;
  }

  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('hidden');
  }

  hidePauseModal() {
    const modal = document.getElementById('modal-pause');
    if (modal) modal.classList.add('hidden');
  }

  showPauseModal() {
    const modal = document.getElementById('modal-pause');
    if (modal) modal.classList.remove('hidden');
  }

  // --- GAME LIFECYCLE EVENTS ---

  onGameStart(isDaily, friendChallenge) {
    this.showScreen('game-screen');
    
    // Check friend challenge banner in HUD
    if (friendChallenge && friendChallenge.targetScore > 0) {
      this.hudFriendEl.classList.remove('hidden');
      this.hudFriendEl.textContent = `🎯 TARGET: ${friendChallenge.targetScore.toLocaleString()} (${friendChallenge.challengerName})`;
    } else {
      this.hudFriendEl.classList.add('hidden');
    }

    if (isDaily) {
      const daily = window.viralEngine.getDailySeed();
      this.showToast(`DAILY CHALLENGE: ${daily.modifier.name}!`, 3000);
    }
  }

  updateHUD({ score, combo, comboRatio, stage, speedMultiplier, timeSurvived, hasShield }) {
    if (this.hudScoreEl) this.hudScoreEl.textContent = score.toLocaleString();
    if (this.hudComboEl) {
      if (combo > 1) {
        this.hudComboEl.classList.remove('hidden');
        this.hudComboEl.textContent = `x${combo} COMBO`;
      } else {
        this.hudComboEl.classList.add('hidden');
      }
    }
    if (this.hudComboBarEl) {
      this.hudComboBarEl.style.width = `${Math.round(comboRatio * 100)}%`;
    }
    if (this.hudStageEl) {
      this.hudStageEl.textContent = `SPEED LVL ${stage} (${speedMultiplier.toFixed(1)}x)`;
    }
    if (this.hudTimeEl) {
      const mins = Math.floor(timeSurvived / 60);
      const secs = (timeSurvived % 60).toFixed(1);
      this.hudTimeEl.textContent = `${mins.toString().padStart(2, '0')}:${secs.padStart(4, '0')}`;
    }
    if (this.hudShieldEl) {
      if (hasShield) this.hudShieldEl.classList.remove('hidden');
      else this.hudShieldEl.classList.add('hidden');
    }
  }

  showGameOverScreen({ score, isNewBest, highScore, timeSurvived, nearMissCount, orbsCollected, maxCombo, rankInfo, friendChallenge }) {
    this.showScreen('gameover-screen');

    // Score count up animation
    const scoreValEl = document.getElementById('go-final-score');
    this.animateScoreCounter(scoreValEl, score);

    // New Best badge
    const newBestEl = document.getElementById('go-new-best-badge');
    if (isNewBest && score > 0) {
      newBestEl.classList.remove('hidden');
      window.soundEngine.playAchievement();
    } else {
      newBestEl.classList.add('hidden');
    }

    // Stats
    document.getElementById('go-stat-time').textContent = `${timeSurvived.toFixed(1)}s`;
    document.getElementById('go-stat-combo').textContent = `${maxCombo}x`;
    document.getElementById('go-stat-nearmisses').textContent = `${nearMissCount}`;
    document.getElementById('go-stat-orbs').textContent = `${orbsCollected}`;
    document.getElementById('go-rank-percentile').textContent = rankInfo.percentile;

    // Friend Challenge Result
    const friendResultEl = document.getElementById('go-friend-result');
    if (friendChallenge && friendChallenge.targetScore > 0) {
      friendResultEl.classList.remove('hidden');
      if (score >= friendChallenge.targetScore) {
        friendResultEl.className = 'go-banner win';
        friendResultEl.textContent = `🎉 VICTORY! You defeated ${friendChallenge.challengerName}'s score of ${friendChallenge.targetScore.toLocaleString()}!`;
      } else {
        const diff = friendChallenge.targetScore - score;
        friendResultEl.className = 'go-banner loss';
        friendResultEl.textContent = `💀 Defeated! You missed ${friendChallenge.challengerName}'s target by ${diff.toLocaleString()} pts.`;
      }
    } else {
      friendResultEl.classList.add('hidden');
    }
  }

  animateScoreCounter(element, targetScore) {
    let current = 0;
    const duration = 1200;
    const start = performance.now();

    const step = (now) => {
      const elapsed = now - start;
      const progress = Math.min(1.0, elapsed / duration);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      current = Math.round(eased * targetScore);
      element.textContent = current.toLocaleString();

      if (progress < 1.0) {
        requestAnimationFrame(step);
      } else {
        element.textContent = targetScore.toLocaleString();
      }
    };
    requestAnimationFrame(step);
  }

  // --- REFRESH DISPLAY & STREAKS ---

  refreshUserDisplay() {
    const streak = window.storageManager.checkAndUpdateStreak();
    const data = window.storageManager.data;

    const streakCountEl = document.getElementById('welcome-streak-count');
    if (streakCountEl) streakCountEl.textContent = streak.count;

    const highScoreEl = document.getElementById('welcome-high-score');
    if (highScoreEl) highScoreEl.textContent = data.highScore.toLocaleString();

    const tagEl = document.getElementById('welcome-gamer-tag');
    if (tagEl) tagEl.textContent = data.gamerTag;

    this.updateAudioIcons();
  }

  updateAudioIcons() {
    const sfxMuted = window.soundEngine.sfxMuted || window.soundEngine.isMuted;
    const bgmMuted = window.soundEngine.bgmMuted || window.soundEngine.isMuted;

    document.querySelectorAll('.btn-toggle-sfx').forEach(btn => {
      btn.textContent = sfxMuted ? '🔇 SFX OFF' : '🔊 SFX ON';
    });
    document.querySelectorAll('.btn-toggle-bgm').forEach(btn => {
      btn.textContent = bgmMuted ? '🎵 BGM OFF' : '🎶 BGM ON';
    });
  }

  // --- LEADERBOARDS RENDERING ---

  renderLeaderboardTable(tab = 'global') {
    const tbody = document.getElementById('leaderboard-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    let list = [];
    if (tab === 'daily') {
      const today = window.viralEngine.getDailySeed().dateStr;
      const userDailyBest = window.storageManager.data.dailyHistory[today] || 0;
      list = [
        { rank: 1, name: 'NovaStrike', country: '🇰🇷', score: 26420, isUser: false },
        { rank: 2, name: 'GlitchHop', country: '🇯🇵', score: 22150, isUser: false },
        { rank: 3, name: 'ArcadePro', country: '🇺🇸', score: 19800, isUser: false },
        { rank: 4, name: 'Zenith', country: '🇬🇧', score: 17400, isUser: false },
        { rank: 5, name: 'ChronoMax', country: '🇩🇪', score: 15300, isUser: false },
        { rank: 6, name: 'PulseRider', country: '🇨🇦', score: 13950, isUser: false },
        { rank: 7, name: 'PixelGhost', country: '🇫🇷', score: 11200, isUser: false }
      ];
      if (userDailyBest > 0) {
        list.push({
          rank: 0,
          name: window.storageManager.data.gamerTag,
          country: '🌐',
          score: userDailyBest,
          isUser: true
        });
        list.sort((a, b) => b.score - a.score);
        list.forEach((entry, idx) => { entry.rank = idx + 1; });
      }
    } else {
      list = window.storageManager.leaderboard;
    }

    list.slice(0, 15).forEach((entry, idx) => {
      const tr = document.createElement('tr');
      if (entry.isUser) tr.className = 'user-row';

      const rankBadge = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${entry.rank}`;
      tr.innerHTML = `
        <td class="col-rank">${rankBadge}</td>
        <td class="col-name">${entry.country || '🌐'} ${escapeHTML(entry.name)} ${entry.isUser ? '<span class="you-badge">(YOU)</span>' : ''}</td>
        <td class="col-score">${entry.score.toLocaleString()}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // --- DAILY CHALLENGE MODAL ---

  renderDailyChallengeModal() {
    const daily = window.viralEngine.getDailySeed();
    document.getElementById('daily-modifier-title').textContent = daily.modifier.name;
    document.getElementById('daily-modifier-desc').textContent = daily.modifier.desc;
    document.getElementById('daily-date-display').textContent = daily.dateStr;

    // Daily best score
    const bestToday = window.storageManager.data.dailyHistory[daily.dateStr] || 0;
    document.getElementById('daily-best-today').textContent = bestToday > 0 ? `${bestToday.toLocaleString()} pts` : 'Not played yet';

    // 7-day flame calendar
    const calendarContainer = document.getElementById('daily-streak-calendar');
    calendarContainer.innerHTML = '';
    const currentStreak = window.storageManager.data.streak.count;

    for (let day = 1; day <= 7; day++) {
      const dayEl = document.createElement('div');
      dayEl.className = `streak-day ${day <= currentStreak ? 'active' : ''}`;
      dayEl.innerHTML = `
        <span class="flame">${day <= currentStreak ? '🔥' : '⚪'}</span>
        <span class="day-num">Day ${day}</span>
      `;
      calendarContainer.appendChild(dayEl);
    }
  }

  startDailyCountdownTimer() {
    setInterval(() => {
      const countdownEl = document.getElementById('daily-countdown');
      if (countdownEl) {
        countdownEl.textContent = window.viralEngine.getTimeUntilDailyReset();
      }
    }, 1000);
  }

  // --- ACHIEVEMENTS GRID ---

  renderAchievementsGrid() {
    const container = document.getElementById('achievements-container');
    if (!container) return;
    container.innerHTML = '';

    const achs = Object.values(window.storageManager.data.achievements);
    achs.forEach(ach => {
      const card = document.createElement('div');
      card.className = `achievement-card ${ach.unlocked ? 'unlocked' : 'locked'}`;
      card.innerHTML = `
        <div class="ach-icon">${ach.unlocked ? ach.icon : '🔒'}</div>
        <div class="ach-info">
          <h4>${escapeHTML(ach.name)}</h4>
          <p>${escapeHTML(ach.desc)}</p>
          ${ach.unlocked ? `<span class="ach-date">Unlocked ${ach.date}</span>` : '<span class="ach-lock-label">LOCKED</span>'}
        </div>
      `;
      container.appendChild(card);
    });
  }

  // --- SKINS GRID ---

  renderSkinsGrid() {
    const container = document.getElementById('skins-container');
    if (!container) return;
    container.innerHTML = '';

    const skins = [
      { id: 'cyan', name: 'Cyber Neon Cyan', color: '#00f0ff', req: 'Default Pilot' },
      { id: 'purple', name: 'Pulse Violet', color: '#d946ef', req: 'Score 5,000+ points' },
      { id: 'gold', name: 'Solar Gold', color: '#f59e0b', req: 'Score 12,000+ points' },
      { id: 'emerald', name: 'Matrix Emerald', color: '#10b981', req: '3-Day Daily Streak' },
      { id: 'rainbow', name: 'Rainbow Supernova', color: 'linear-gradient(45deg, #ff0055, #00f0ff)', req: 'Score 20,000+ points' }
    ];

    const currentSkin = window.storageManager.data.selectedSkin;
    const unlocked = window.storageManager.data.unlockedSkins;

    skins.forEach(skin => {
      const isUnlocked = unlocked.includes(skin.id);
      const isSelected = currentSkin === skin.id;

      const card = document.createElement('div');
      card.className = `skin-card ${isUnlocked ? 'unlocked' : 'locked'} ${isSelected ? 'selected' : ''}`;
      card.innerHTML = `
        <div class="skin-ball-preview" style="background: ${skin.color}"></div>
        <div class="skin-details">
          <h4>${skin.name}</h4>
          <p class="skin-req">${isUnlocked ? 'AVAILABLE' : skin.req}</p>
        </div>
        <button class="btn-skin-action ${isSelected ? 'btn-equipped' : ''}" ${!isUnlocked ? 'disabled' : ''}>
          ${isSelected ? 'EQUIPPED' : isUnlocked ? 'EQUIP' : 'LOCKED'}
        </button>
      `;

      if (isUnlocked && !isSelected) {
        card.querySelector('.btn-skin-action').addEventListener('click', () => {
          window.soundEngine.playClick();
          window.storageManager.setSkin(skin.id);
          this.renderSkinsGrid();
          this.showToast(`Equipped ${skin.name}!`);
        });
      }

      container.appendChild(card);
    });
  }

  // --- TOAST NOTIFICATIONS ---

  showToast(message, duration = 3000) {
    const toast = document.getElementById('toast-notification');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.remove('hidden');
    toast.classList.add('visible');

    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.classList.add('hidden'), 300);
    }, duration);
  }
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}

window.uiManager = new UIManager();
