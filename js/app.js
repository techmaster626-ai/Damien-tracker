/**
 * Main Application Orchestrator for Water Polo Stats Tracker
 * Handles:
 * - Scoreboard HUD controls (Clock, Shot Clock, Timeouts, Period Advancement)
 * - Rapid-Tap Action Pad & Modal Workflows (Goal, Exclusion, Save, Block, Steal, Turnover)
 * - Roster substitutions & Cap selectors
 * - Audio controls & Keyboard hotkeys
 * - Firebase Firestore Cloud Sync & Live Spectator Rooms
 * - Multi-view tab routing
 */

import { state } from './state.js';
import { sound } from './audio.js';
import { PoolChartEngine } from './pool-chart.js';
import { BoxScoreRenderer } from './boxscore.js';
import { PlayByPlayRenderer } from './pbp.js';
import { BroadcastEngine } from './broadcast.js';
import { exporter } from './exporter.js';
import { cloudSync } from './cloud-sync.js';
import { firebaseService } from './firebase-config.js';
import { PRESET_MATCHES } from './presets.js';

class WaterPoloApp {
  constructor() {
    this.poolChart = null;
    this.boxScore = null;
    this.pbp = null;
    this.broadcast = null;
    this.activeTab = 'scoring'; // 'scoring' | 'boxscore' | 'pbp' | 'broadcast' | 'export'

    // Temporary action modal state
    this.pendingAction = {
      type: null,
      team: 'home',
      cap: null,
      assistCap: null,
      goalieCap: null,
      drawnByCap: null,
      foulCap: null,
      shotType: 'action',
      targetZone: 'top_right',
      poolX: 50,
      poolY: 50
    };

    this.init();
  }

  async init() {
    this.renderHeaderAndScoreboard();
    this.setupViewContainers();
    this.bindScoreboardEvents();
    this.bindRapidActionPad();
    this.bindModals();
    this.bindCloudSyncModal();
    this.bindKeyboardHotkeys();

    // Subscribe to state changes for UI refreshes
    state.subscribe((eventType, detail) => {
      this.updateScoreboardHUD();
      this.updateExclusionBox();
      this.updateRosterButtons();
    });

    this.updateScoreboardHUD();
    this.updateExclusionBox();
    this.updateRosterButtons();

    // Initialize Firebase in background
    await firebaseService.init();

    // Check URL parameters for Live Room Spectator link (e.g. ?room=xyz)
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) {
      this.showToast(`Connecting to live match room: ${roomParam}...`);
      await cloudSync.connectToLiveRoom(roomParam, (updatedMatch) => {
        state.loadCustomMatch(updatedMatch);
        this.showToast(`⚡ Live match update received!`);
      });
    }
  }

  showToast(message, duration = 3000) {
    const container = document.getElementById('app-toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.innerHTML = `<span>🤽‍♂️</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, duration);
  }

  // --- TOP BAR & SCOREBOARD HUD ---

  renderHeaderAndScoreboard() {
    const topBar = document.getElementById('app-top-header');
    if (!topBar) return;

    topBar.innerHTML = `
      <div class="top-nav-container">
        <div class="brand-block">
          <div class="brand-icon">🤽‍♂️</div>
          <div class="brand-text">
            <h1 class="brand-title">Water Polo Stats Tracker</h1>
            <span class="brand-badge">PRO EDITION • FINA & NCAA</span>
          </div>
        </div>

        <div class="nav-tabs-wrapper">
          <button class="nav-tab-btn active" data-tab="scoring">⚡ Live Scoring & Pool</button>
          <button class="nav-tab-btn" data-tab="boxscore">📊 Box Score & Analytics</button>
          <button class="nav-tab-btn" data-tab="pbp">📜 Play-by-Play</button>
          <button class="nav-tab-btn" data-tab="broadcast">🎥 Broadcast Scorebug</button>
          <button class="nav-tab-btn" data-tab="export">💾 Export & Reports</button>
        </div>

        <div class="top-actions-wrapper">
          <button class="action-btn-header secondary" id="btn-open-cloud-sync" title="Firebase Cloud Sync & Live Match Sharing">
            ☁️ Cloud Sync
          </button>
          <select id="select-preset-match" class="preset-dropdown">
            <option value="olympic_final">Demo: USA vs Hungary (Olympic Final)</option>
            <option value="ncaa_championship">Demo: Stanford vs UCLA (NCAA Final)</option>
          </select>
          <button class="action-btn-header secondary" id="btn-new-match-modal">+ New Match</button>
          <button class="action-btn-header icon-only" id="btn-toggle-sound" title="Toggle Whistle/Buzzer Audio">
            ${sound.isMuted() ? '🔇' : '🔊'}
          </button>
        </div>
      </div>
    `;

    this.bindNavTabs();
  }

  bindNavTabs() {
    const navBtns = document.querySelectorAll('.nav-tab-btn');
    navBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        navBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.switchTab(btn.dataset.tab);
      });
    });

    const presetSelect = document.getElementById('select-preset-match');
    if (presetSelect) {
      presetSelect.addEventListener('change', (e) => {
        state.loadMatchPreset(e.target.value);
        this.showToast(`Loaded ${e.target.options[e.target.selectedIndex].text}`);
      });
    }

    const soundBtn = document.getElementById('btn-toggle-sound');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        const isMuted = sound.toggleMute();
        soundBtn.textContent = isMuted ? '🔇' : '🔊';
      });
    }

    const newMatchBtn = document.getElementById('btn-new-match-modal');
    if (newMatchBtn) {
      newMatchBtn.addEventListener('click', () => {
        this.openNewMatchModal();
      });
    }

    const cloudBtn = document.getElementById('btn-open-cloud-sync');
    if (cloudBtn) {
      cloudBtn.addEventListener('click', () => {
        this.openCloudSyncModal();
      });
    }
  }

  switchTab(tabName) {
    this.activeTab = tabName;
    const views = document.querySelectorAll('.app-view-section');
    views.forEach(v => v.classList.remove('active'));

    const target = document.getElementById(`view-${tabName}`);
    if (target) target.classList.add('active');

    if (tabName === 'broadcast' && this.broadcast) {
      this.broadcast.openBroadcastWindow();
    }
  }

  setupViewContainers() {
    const poolContainer = document.getElementById('pool-diagram-mount');
    const goalContainer = document.getElementById('goal-face-mount');
    if (poolContainer && goalContainer) {
      this.poolChart = new PoolChartEngine(poolContainer, goalContainer, {
        onLocationSelect: (coords) => {
          this.pendingAction.poolX = coords.x;
          this.pendingAction.poolY = coords.y;
        }
      });
    }

    const boxscoreMount = document.getElementById('boxscore-view-mount');
    if (boxscoreMount) {
      this.boxScore = new BoxScoreRenderer(boxscoreMount);
    }

    const pbpMount = document.getElementById('pbp-view-mount');
    if (pbpMount) {
      this.pbp = new PlayByPlayRenderer(pbpMount);
    }

    const broadcastMount = document.getElementById('broadcast-overlay-mount');
    if (broadcastMount) {
      this.broadcast = new BroadcastEngine(broadcastMount);
    }

    this.renderExportView();
  }

  // --- SCOREBOARD HUD UPDATES ---

  updateScoreboardHUD() {
    if (!state.match) return;

    const home = state.match.homeTeam;
    const away = state.match.awayTeam;

    // Team Names & Scores
    const homeNameEl = document.getElementById('hud-home-name');
    const awayNameEl = document.getElementById('hud-away-name');
    const homeScoreEl = document.getElementById('hud-home-score');
    const awayScoreEl = document.getElementById('hud-away-score');

    if (homeNameEl) homeNameEl.textContent = home.name;
    if (awayNameEl) awayNameEl.textContent = away.name;
    if (homeScoreEl) homeScoreEl.textContent = home.score;
    if (awayScoreEl) awayScoreEl.textContent = away.score;

    // Game Clock
    const clockEl = document.getElementById('hud-game-clock');
    if (clockEl) {
      clockEl.textContent = state.formatTime(state.match.clockSec);
      clockEl.classList.toggle('running', state.isClockRunning);
      clockEl.classList.toggle('stopped', !state.isClockRunning);
    }

    // Play/Pause button text & icon
    const playBtn = document.getElementById('btn-toggle-clock');
    if (playBtn) {
      playBtn.innerHTML = state.isClockRunning 
        ? '<span class="icon">⏸</span> Pause Clock' 
        : '<span class="icon">▶</span> Start Clock';
      playBtn.classList.toggle('is-running', state.isClockRunning);
    }

    // Period / Quarter
    const periodEl = document.getElementById('hud-period-badge');
    if (periodEl) {
      const q = state.match.currentQuarter;
      periodEl.textContent = q <= 4 ? `Quarter ${q}` : `Overtime ${q - 4}`;
    }

    // 30s Shot Clock
    const shotClockEl = document.getElementById('hud-shot-clock');
    const shotRingEl = document.getElementById('shot-clock-ring-circle');
    if (shotClockEl) {
      shotClockEl.textContent = state.shotClock;
      shotClockEl.classList.toggle('warning', state.shotClock <= 10 && state.shotClock > 5);
      shotClockEl.classList.toggle('critical', state.shotClock <= 5);
    }
    if (shotRingEl) {
      const maxSec = 30;
      const circumference = 2 * Math.PI * 36; // r=36
      const offset = circumference - (state.shotClock / maxSec) * circumference;
      shotRingEl.style.strokeDashoffset = offset;
    }

    // Possession Indicators
    const homePoss = document.getElementById('poss-indicator-home');
    const awayPoss = document.getElementById('poss-indicator-away');
    if (homePoss) homePoss.classList.toggle('active', state.possession === 'home');
    if (awayPoss) awayPoss.classList.toggle('active', state.possession === 'away');

    // Timeouts Remaining
    const homeToEl = document.getElementById('hud-home-timeouts');
    const awayToEl = document.getElementById('hud-away-timeouts');
    if (homeToEl) homeToEl.textContent = `TO: ${home.timeoutsRemaining}`;
    if (awayToEl) awayToEl.textContent = `TO: ${away.timeoutsRemaining}`;

    // Man Up / Man Down Badges
    const manUp = state.getManUpState();
    const homePower = document.getElementById('power-play-badge-home');
    const awayPower = document.getElementById('power-play-badge-away');
    if (homePower) homePower.classList.toggle('visible', manUp.homeManUp);
    if (awayPower) awayPower.classList.toggle('visible', manUp.awayManUp);
  }

  updateExclusionBox() {
    const boxContainer = document.getElementById('exclusion-penalty-box');
    if (!boxContainer) return;

    if (state.activeExclusions.length === 0) {
      boxContainer.innerHTML = `
        <div class="exclusion-empty-state">
          <span class="pulse-dot-green"></span>
          <span>Even Strength (6 on 6 + Goalkeepers)</span>
        </div>
      `;
      return;
    }

    boxContainer.innerHTML = state.activeExclusions.map(exc => `
      <div class="active-exclusion-card team-${exc.team}">
        <div class="exc-left">
          <span class="exc-badge-cap">#${exc.cap}</span>
          <div class="exc-info">
            <span class="exc-player-name">${exc.name}</span>
            <span class="exc-team-label">${exc.team === 'home' ? state.match.homeTeam.name : state.match.awayTeam.name}</span>
          </div>
        </div>
        <div class="exc-right">
          <span class="exc-timer-count">${exc.remainingSec}s</span>
          <button class="exc-wave-in-btn" data-id="${exc.id}" title="Wave in player early on goal or turnover">
            Wave In ↵
          </button>
        </div>
      </div>
    `).join('');

    const waveBtns = boxContainer.querySelectorAll('.exc-wave-in-btn');
    waveBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        state.waveInPlayer(btn.dataset.id);
      });
    });
  }

  updateRosterButtons() {
    if (!state.match) return;

    const renderRosterGrid = (teamKey, containerId) => {
      const container = document.getElementById(containerId);
      if (!container) return;

      const team = teamKey === 'home' ? state.match.homeTeam : state.match.awayTeam;
      const stats = state.calculateStats();
      const teamStats = teamKey === 'home' ? stats.home : stats.away;

      container.innerHTML = team.roster.map(player => {
        const playerStat = teamStats.players[player.cap] || { goals: 0, exclusionsCommitted: 0 };
        const isFoulOut = playerStat.exclusionsCommitted >= 3;
        const isWarning = playerStat.exclusionsCommitted === 2;
        const isSelected = this.pendingAction.team === teamKey && this.pendingAction.cap === player.cap;
        const isStarter = state.activeLineups[teamKey]?.has(player.cap);

        return `
          <button type="button" class="roster-cap-btn ${isSelected ? 'selected' : ''} ${isFoulOut ? 'foul-out' : ''} ${!isStarter ? 'on-bench' : ''}" 
                  data-team="${teamKey}" data-cap="${player.cap}">
            <div class="cap-number-badge" style="background-color: ${team.capColor}; color: ${team.capTextColor}; border: 1.5px solid #64748b;">
              #${player.cap}
            </div>
            <div class="cap-meta-details">
              <span class="cap-player-name">${player.name}</span>
              <div class="cap-stat-badges">
                ${player.isGk ? '<span class="gk-tag">GK</span>' : ''}
                ${playerStat.goals > 0 ? `<span class="stat-bubble goal">${playerStat.goals}G</span>` : ''}
                ${playerStat.exclusionsCommitted > 0 ? `<span class="stat-bubble foul ${isFoulOut ? 'red' : isWarning ? 'amber' : ''}">${playerStat.exclusionsCommitted}E</span>` : ''}
              </div>
            </div>
          </button>
        `;
      }).join('');

      // Bind click on player cap button
      const btns = container.querySelectorAll('.roster-cap-btn');
      btns.forEach(btn => {
        btn.addEventListener('click', () => {
          this.pendingAction.team = btn.dataset.team;
          this.pendingAction.cap = parseInt(btn.dataset.cap);
          this.updateRosterButtons();
          sound.playClick();
        });
      });
    };

    renderRosterGrid('home', 'home-roster-selector-grid');
    renderRosterGrid('away', 'away-roster-selector-grid');
  }

  // --- SCOREBOARD EVENTS & CLOCKS ---

  bindScoreboardEvents() {
    // Clock Play/Pause
    const toggleClockBtn = document.getElementById('btn-toggle-clock');
    if (toggleClockBtn) {
      toggleClockBtn.addEventListener('click', () => {
        state.toggleClock();
      });
    }

    // Shot Clock 30s & 20s Resets
    const sc30Btn = document.getElementById('btn-reset-30');
    const sc20Btn = document.getElementById('btn-reset-20');
    if (sc30Btn) sc30Btn.addEventListener('click', () => state.resetShotClock(30));
    if (sc20Btn) sc20Btn.addEventListener('click', () => state.resetShotClock(20));

    // Clock adjustments (+10s, -10s)
    const add10Btn = document.getElementById('btn-clock-plus10');
    const sub10Btn = document.getElementById('btn-clock-minus10');
    if (add10Btn) add10Btn.addEventListener('click', () => state.adjustClockSec(10));
    if (sub10Btn) sub10Btn.addEventListener('click', () => state.adjustClockSec(-10));

    // Quarter advance
    const advanceQBtn = document.getElementById('btn-advance-quarter');
    if (advanceQBtn) {
      advanceQBtn.addEventListener('click', () => {
        if (confirm(`Advance to Quarter ${state.match.currentQuarter + 1}?`)) {
          state.advanceQuarter();
        }
      });
    }

    // Possession switches
    const possHomeBtn = document.getElementById('poss-indicator-home');
    const possAwayBtn = document.getElementById('poss-indicator-away');
    if (possHomeBtn) possHomeBtn.addEventListener('click', () => state.setPossession('home'));
    if (possAwayBtn) possAwayBtn.addEventListener('click', () => state.setPossession('away'));

    // Edit clock modal
    const editClockBtn = document.getElementById('btn-edit-clock-time');
    if (editClockBtn) {
      editClockBtn.addEventListener('click', () => this.openEditClockModal());
    }

    // Quick Undo
    const undoBtn = document.getElementById('btn-quick-undo');
    if (undoBtn) {
      undoBtn.addEventListener('click', () => {
        state.undoLastEvent();
        sound.playClick();
      });
    }
  }

  // --- RAPID ACTION PAD & LOGGING ---

  bindRapidActionPad() {
    const actionButtons = document.querySelectorAll('.quick-act-btn');
    actionButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const actionType = btn.dataset.action;
        this.triggerAction(actionType);
      });
    });
  }

  triggerAction(actionType) {
    sound.playClick();
    const team = this.pendingAction.team || 'home';
    const cap = this.pendingAction.cap;

    if (actionType === 'goal') {
      this.openGoalModal(team, cap);
    } else if (actionType === 'exclusion') {
      this.openExclusionModal(team, cap);
    } else if (actionType === 'penalty_drawn') {
      this.openPenaltyModal(team, cap);
    } else if (actionType === 'miss') {
      this.openMissModal(team, cap);
    } else if (actionType === 'save') {
      this.logSaveDirect(team, cap);
    } else if (actionType === 'steal') {
      this.logStealDirect(team, cap);
    } else if (actionType === 'block') {
      this.logBlockDirect(team, cap);
    } else if (actionType === 'turnover') {
      this.openTurnoverModal(team, cap);
    } else if (actionType === 'sprint') {
      this.logSprintDirect(team, cap);
    } else if (actionType === 'timeout') {
      this.logTimeoutDirect(team);
    }
  }

  // Direct fast actions (1-tap)
  logSaveDirect(team, cap) {
    const oppTeam = team === 'home' ? 'away' : 'home';
    const oppGk = 1;
    const teamObj = team === 'home' ? state.match.homeTeam : state.match.awayTeam;
    const playerName = teamObj.roster.find(p => p.cap === cap)?.name || `Cap #${cap || '?'}`;

    state.logEvent({
      team: oppTeam,
      type: 'save',
      cap: cap || 2,
      goalieCap: oppGk,
      desc: `Save by ${oppTeam.toUpperCase()} GK on shot from ${teamObj.name} #${cap || '?'} ${playerName}`,
      poolX: this.pendingAction.poolX,
      poolY: this.pendingAction.poolY,
      isGoal: false
    });
    state.resetShotClock(20);
  }

  logStealDirect(team, cap) {
    const teamObj = team === 'home' ? state.match.homeTeam : state.match.awayTeam;
    const playerName = teamObj.roster.find(p => p.cap === cap)?.name || `Cap #${cap || '?'}`;

    state.logEvent({
      team,
      type: 'steal',
      cap: cap || 2,
      desc: `Steal by ${teamObj.name} #${cap || '?'} ${playerName}`,
      isGoal: false
    });
  }

  logBlockDirect(team, cap) {
    const teamObj = team === 'home' ? state.match.homeTeam : state.match.awayTeam;
    const playerName = teamObj.roster.find(p => p.cap === cap)?.name || `Cap #${cap || '?'}`;

    state.logEvent({
      team,
      type: 'block',
      cap: cap || 4,
      desc: `Field Block by ${teamObj.name} #${cap || '?'} ${playerName}`,
      isGoal: false
    });
  }

  logSprintDirect(team, cap) {
    const teamObj = team === 'home' ? state.match.homeTeam : state.match.awayTeam;
    const playerName = teamObj.roster.find(p => p.cap === cap)?.name || `Cap #${cap || '?'}`;

    state.logEvent({
      team,
      type: 'sprint',
      cap: cap || 2,
      desc: `Quarter Sprint swim-off won by ${teamObj.name} #${cap || '?'} ${playerName}`,
      isGoal: false
    });
    state.setPossession(team);
  }

  logTimeoutDirect(team) {
    const teamObj = team === 'home' ? state.match.homeTeam : state.match.awayTeam;
    if (teamObj.timeoutsRemaining <= 0) {
      alert(`${teamObj.name} has no timeouts remaining!`);
      return;
    }

    state.logEvent({
      team,
      type: 'timeout',
      desc: `Timeout called by ${teamObj.name} (Remaining: ${teamObj.timeoutsRemaining - 1})`,
      isGoal: false
    });
  }

  // --- MODALS ---

  bindModals() {
    const closeBtns = document.querySelectorAll('.modal-close-btn, .modal-cancel-btn');
    closeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
      });
    });
  }

  openGoalModal(team, cap) {
    const modal = document.getElementById('modal-log-goal');
    if (!modal) return;

    const teamObj = team === 'home' ? state.match.homeTeam : state.match.awayTeam;
    const scorerSelect = document.getElementById('goal-scorer-select');
    const assistSelect = document.getElementById('goal-assist-select');

    if (scorerSelect) {
      scorerSelect.innerHTML = teamObj.roster.map(p => `
        <option value="${p.cap}" ${p.cap === cap ? 'selected' : ''}>#${p.cap} ${p.name} (${p.pos || 'Player'})</option>
      `).join('');
    }

    if (assistSelect) {
      assistSelect.innerHTML = `<option value="">-- Unassisted Goal --</option>` + teamObj.roster.map(p => `
        <option value="${p.cap}">#${p.cap} ${p.name}</option>
      `).join('');
    }

    // Shot type selector
    const shotBtns = modal.querySelectorAll('.shot-type-pill');
    shotBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        shotBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.pendingAction.shotType = btn.dataset.type;
      });
    });

    const submitBtn = document.getElementById('btn-submit-goal-log');
    submitBtn.onclick = () => {
      const scorerCap = parseInt(scorerSelect.value);
      const assistCap = assistSelect.value ? parseInt(assistSelect.value) : null;
      const shotType = this.pendingAction.shotType || 'action';
      const targetZone = this.poolChart ? this.poolChart.selectedGoalZone : 'top_right';
      const poolX = this.pendingAction.poolX || 50;
      const poolY = this.pendingAction.poolY || 55;

      const scorerName = teamObj.roster.find(p => p.cap === scorerCap)?.name || `Cap #${scorerCap}`;
      const assistName = assistCap ? teamObj.roster.find(p => p.cap === assistCap)?.name : null;

      let desc = `GOAL! ${teamObj.name} #${scorerCap} ${scorerName} (${shotType.toUpperCase()})`;
      if (assistName) desc += ` [Assist: #${assistCap} ${assistName}]`;

      state.logEvent({
        team,
        type: 'goal',
        cap: scorerCap,
        assistCap,
        shotType,
        targetZone,
        poolX,
        poolY,
        desc,
        isGoal: true
      });

      modal.classList.remove('active');
    };

    modal.classList.add('active');
  }

  openExclusionModal(team, cap) {
    const modal = document.getElementById('modal-log-exclusion');
    if (!modal) return;

    const oppTeamKey = team === 'home' ? 'away' : 'home';
    const teamObj = team === 'home' ? state.match.homeTeam : state.match.awayTeam;
    const oppTeamObj = oppTeamKey === 'home' ? state.match.homeTeam : state.match.awayTeam;

    const offenderSelect = document.getElementById('exclusion-offender-select');
    const drawnSelect = document.getElementById('exclusion-drawn-select');

    if (offenderSelect) {
      offenderSelect.innerHTML = teamObj.roster.map(p => `
        <option value="${p.cap}" ${p.cap === cap ? 'selected' : ''}>#${p.cap} ${p.name}</option>
      `).join('');
    }

    if (drawnSelect) {
      drawnSelect.innerHTML = `<option value="">-- None / Loose Ball --</option>` + oppTeamObj.roster.map(p => `
        <option value="${p.cap}">#${p.cap} ${p.name}</option>
      `).join('');
    }

    const submitBtn = document.getElementById('btn-submit-exclusion-log');
    submitBtn.onclick = () => {
      const offenderCap = parseInt(offenderSelect.value);
      const drawnCap = drawnSelect.value ? parseInt(drawnSelect.value) : null;
      const offenderName = teamObj.roster.find(p => p.cap === offenderCap)?.name || `Cap #${offenderCap}`;

      let desc = `Exclusion Foul on ${teamObj.name} #${offenderCap} ${offenderName} (20s Ejection)`;
      if (drawnCap) {
        const drawnName = oppTeamObj.roster.find(p => p.cap === drawnCap)?.name;
        desc += ` [Drawn by #${drawnCap} ${drawnName}]`;
      }

      state.logEvent({
        team,
        type: 'exclusion',
        cap: offenderCap,
        drawnByCap: drawnCap,
        desc,
        isGoal: false
      });

      modal.classList.remove('active');
    };

    modal.classList.add('active');
  }

  openPenaltyModal(team, cap) {
    const teamObj = team === 'home' ? state.match.homeTeam : state.match.awayTeam;
    const playerName = teamObj.roster.find(p => p.cap === cap)?.name || `Cap #${cap || '?'}`;

    state.logEvent({
      team,
      type: 'penalty_drawn',
      cap: cap || 7,
      desc: `5-Meter Penalty Drawn by ${teamObj.name} #${cap || 7} ${playerName}`,
      isGoal: false
    });

    state.resetShotClock(30);
  }

  openMissModal(team, cap) {
    const teamObj = team === 'home' ? state.match.homeTeam : state.match.awayTeam;
    const playerName = teamObj.roster.find(p => p.cap === cap)?.name || `Cap #${cap || '?'}`;

    state.logEvent({
      team,
      type: 'miss',
      cap: cap || 2,
      desc: `Missed shot by ${teamObj.name} #${cap || '?'} ${playerName}`,
      poolX: this.pendingAction.poolX,
      poolY: this.pendingAction.poolY,
      targetZone: this.poolChart ? this.poolChart.selectedGoalZone : 'wide',
      isGoal: false
    });
    state.resetShotClock(20);
  }

  openTurnoverModal(team, cap) {
    const teamObj = team === 'home' ? state.match.homeTeam : state.match.awayTeam;
    const playerName = teamObj.roster.find(p => p.cap === cap)?.name || `Cap #${cap || '?'}`;

    state.logEvent({
      team,
      type: 'turnover',
      cap: cap || 2,
      desc: `Turnover / Bad Pass by ${teamObj.name} #${cap || '?'} ${playerName}`,
      isGoal: false
    });
  }

  openEditClockModal() {
    const modal = document.getElementById('modal-edit-clock');
    if (!modal) return;

    const minInput = document.getElementById('input-clock-min');
    const secInput = document.getElementById('input-clock-sec');
    const qSelect = document.getElementById('input-clock-quarter');

    const totalSec = state.match.clockSec;
    if (minInput) minInput.value = Math.floor(totalSec / 60);
    if (secInput) secInput.value = totalSec % 60;
    if (qSelect) qSelect.value = state.match.currentQuarter;

    const submitBtn = document.getElementById('btn-submit-clock-edit');
    submitBtn.onclick = () => {
      const m = parseInt(minInput.value) || 0;
      const s = parseInt(secInput.value) || 0;
      const q = parseInt(qSelect.value) || 1;

      state.match.currentQuarter = q;
      state.setClock(m, s);
      modal.classList.remove('active');
    };

    modal.classList.add('active');
  }

  openNewMatchModal() {
    const modal = document.getElementById('modal-new-match');
    if (!modal) return;

    const submitBtn = document.getElementById('btn-submit-new-match');
    submitBtn.onclick = () => {
      const homeName = document.getElementById('input-new-home-name')?.value || 'Home White';
      const awayName = document.getElementById('input-new-away-name')?.value || 'Away Blue';
      const qMin = parseInt(document.getElementById('input-new-quarter-min')?.value) || 8;

      state.createNewGame(homeName, awayName, qMin);
      modal.classList.remove('active');
      this.switchTab('scoring');
      this.showToast(`Created new game: ${homeName} vs ${awayName}`);
    };

    modal.classList.add('active');
  }

  // --- CLOUD SYNC MODAL ---

  openCloudSyncModal() {
    const modal = document.getElementById('modal-cloud-sync');
    if (!modal) return;

    const tabBtns = modal.querySelectorAll('.cloud-tab-btn');
    tabBtns.forEach(btn => {
      btn.onclick = () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        modal.querySelectorAll('.cloud-tab-content').forEach(c => c.classList.remove('active'));
        const target = modal.querySelector(`#cloudtab-${btn.dataset.cloudtab}`);
        if (target) target.classList.add('active');

        if (btn.dataset.cloudtab === 'list') {
          this.refreshCloudMatchesList();
        }
      };
    });

    modal.classList.add('active');
  }

  bindCloudSyncModal() {
    const saveBtn = document.getElementById('btn-cloud-save-match');
    const liveBtn = document.getElementById('btn-cloud-toggle-live');
    const liveBox = document.getElementById('live-broadcast-room-box');
    const roomCodeText = document.getElementById('live-room-code-text');
    const copyLiveBtn = document.getElementById('btn-copy-live-link');
    const joinBtn = document.getElementById('btn-join-live-room');
    const saveCfgBtn = document.getElementById('btn-save-firebase-config');

    if (saveBtn) {
      saveBtn.onclick = async () => {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';
        const res = await cloudSync.saveMatchToCloud();
        saveBtn.disabled = false;
        saveBtn.textContent = '☁️ Save Active Match to Cloud';
        if (res.success) {
          this.showToast('✅ Match saved to Firebase Cloud!');
        }
      };
    }

    if (liveBtn) {
      liveBtn.onclick = async () => {
        if (!cloudSync.isLiveHosting) {
          const roomId = await cloudSync.startLiveBroadcast();
          liveBtn.textContent = '🛑 Stop Live Broadcast';
          liveBtn.classList.remove('secondary-btn');
          if (liveBox && roomCodeText) {
            roomCodeText.textContent = roomId;
            liveBox.style.display = 'flex';
          }
          this.showToast(`📡 Live broadcasting started! Room: ${roomId}`);
        } else {
          cloudSync.stopLiveBroadcast();
          liveBtn.textContent = '📡 Start Live Broadcast Sync';
          liveBtn.classList.add('secondary-btn');
          if (liveBox) liveBox.style.display = 'none';
          this.showToast('Live broadcast stopped.');
        }
      };
    }

    if (copyLiveBtn) {
      copyLiveBtn.onclick = () => {
        const liveUrl = `${window.location.origin}${window.location.pathname}?room=${state.match.id}`;
        navigator.clipboard.writeText(liveUrl);
        copyLiveBtn.textContent = '✅ Copied URL to Clipboard!';
        setTimeout(() => copyLiveBtn.textContent = '📋 Copy Spectator Live Link', 2000);
      };
    }

    if (joinBtn) {
      joinBtn.onclick = async () => {
        const roomId = document.getElementById('input-join-room-id')?.value?.trim();
        if (!roomId) return alert('Please enter a room ID');
        this.showToast(`Connecting to live match: ${roomId}...`);
        await cloudSync.connectToLiveRoom(roomId, (matchData) => {
          state.loadCustomMatch(matchData);
          this.showToast('⚡ Live match synced!');
        });
        document.getElementById('modal-cloud-sync').classList.remove('active');
      };
    }

    if (saveCfgBtn) {
      saveCfgBtn.onclick = async () => {
        const customConfig = {
          projectId: document.getElementById('cfg-project-id')?.value,
          apiKey: document.getElementById('cfg-api-key')?.value,
          authDomain: document.getElementById('cfg-auth-domain')?.value
        };
        firebaseService.saveConfig(customConfig);
        await firebaseService.init(customConfig);
        this.showToast('Firebase settings updated!');
      };
    }
  }

  async refreshCloudMatchesList() {
    const listContainer = document.getElementById('cloud-matches-list-container');
    if (!listContainer) return;

    listContainer.innerHTML = '<p class="text-muted">Loading matches...</p>';
    const matches = await cloudSync.listCloudMatches();

    if (!matches || matches.length === 0) {
      listContainer.innerHTML = '<p class="text-muted">No cloud matches found yet. Save your first match in the Save tab!</p>';
      return;
    }

    listContainer.innerHTML = matches.map(m => `
      <div class="cloud-match-item">
        <div class="cloud-match-info">
          <strong>${m.title || (m.homeTeam?.name + ' vs ' + m.awayTeam?.name)} (${m.homeTeam?.score || 0} - ${m.awayTeam?.score || 0})</strong>
          <span>${m.tournament || 'Match'} • ${m.date || 'Recent'} • ID: ${m.id}</span>
        </div>
        <button class="cloud-item-btn" data-loadid="${m.id}">Load Game</button>
      </div>
    `).join('');

    const loadBtns = listContainer.querySelectorAll('.cloud-item-btn');
    loadBtns.forEach(btn => {
      btn.onclick = async () => {
        const matchId = btn.dataset.loadid;
        const res = await cloudSync.loadMatchFromCloud(matchId);
        if (res.success) {
          this.showToast(`Loaded ${res.match.title || 'match'} from cloud!`);
          document.getElementById('modal-cloud-sync').classList.remove('active');
        }
      };
    });
  }

  // --- EXPORT VIEW ---

  renderExportView() {
    const exportView = document.getElementById('view-export');
    if (!exportView) return;

    exportView.innerHTML = `
      <div class="export-view-container">
        <div class="export-hero-banner">
          <h2>Match Reports & Data Integrations</h2>
          <p>Export official water polo statistics formatted for MaxPreps, NCAA scorebooks, PDF printing, and spreadsheet analysis.</p>
        </div>

        <div class="export-cards-grid">
          <!-- Firebase Cloud Sync Card -->
          <div class="export-action-card highlight-card">
            <div class="card-icon">☁️</div>
            <h3>Firebase Cloud Sync & Live Stream</h3>
            <p>Sync live game scores and shot charts in real-time across poolside tablets, spectator phones, and stream overlays.</p>
            <button class="export-btn primary" id="btn-export-cloud-modal">Open Cloud Sync</button>
          </div>

          <!-- MaxPreps Card -->
          <div class="export-action-card">
            <div class="card-icon">⚡</div>
            <h3>MaxPreps 1-Click Export</h3>
            <p>Formatted plain-text & table report ready for copy-pasting directly into MaxPreps water polo scorekeeper.</p>
            <button class="export-btn secondary" id="btn-export-maxpreps">View MaxPreps Format</button>
          </div>

          <!-- Printable PDF Scoresheet -->
          <div class="export-action-card">
            <div class="card-icon">🖨️</div>
            <h3>Official Printable Score Sheet</h3>
            <p>High-contrast, formatted official score sheet with quarter-by-quarter grids, referee signatures, and full rosters.</p>
            <button class="export-btn secondary" id="btn-export-print">Print / Save as PDF</button>
          </div>

          <!-- CSV Downloads -->
          <div class="export-action-card">
            <div class="card-icon">📊</div>
            <h3>CSV Spreadsheet Export</h3>
            <p>Download structured .CSV files for Microsoft Excel, Google Sheets, or custom statistical models.</p>
            <div class="dual-btn-row">
              <button class="export-btn secondary" id="btn-export-boxscore-csv">Box Score CSV</button>
              <button class="export-btn secondary" id="btn-export-pbp-csv">Play-by-Play CSV</button>
            </div>
          </div>

          <!-- Social Graphic Card -->
          <div class="export-action-card">
            <div class="card-icon">🖼️</div>
            <h3>Social Media Share Graphic</h3>
            <p>Generate a high-res 1200x630 match summary card with team badges, final score, top stats, and branding.</p>
            <button class="export-btn accent" id="btn-export-graphic">Download Graphic (PNG)</button>
          </div>

          <!-- JSON Backup & Restore -->
          <div class="export-action-card">
            <div class="card-icon">💾</div>
            <h3>Backup & Restore (JSON)</h3>
            <p>Save match file to your computer or load previously recorded matches.</p>
            <div class="dual-btn-row">
              <button class="export-btn secondary" id="btn-export-json">Save JSON</button>
              <label class="export-btn secondary file-upload-btn">
                Import JSON
                <input type="file" id="input-import-json" accept=".json" style="display:none;">
              </label>
            </div>
          </div>
        </div>

        <!-- MaxPreps Output Modal / Box -->
        <div class="maxpreps-preview-box" id="maxpreps-preview-area" style="display: none;">
          <div class="maxpreps-preview-header">
            <h4>MaxPreps Formatted Output</h4>
            <button class="copy-btn" id="btn-copy-maxpreps">📋 Copy to Clipboard</button>
          </div>
          <textarea id="maxpreps-text-content" readonly rows="14"></textarea>
        </div>
      </div>
    `;

    this.bindExportEvents();
  }

  bindExportEvents() {
    const cloudBtn = document.getElementById('btn-export-cloud-modal');
    if (cloudBtn) cloudBtn.onclick = () => this.openCloudSyncModal();

    const maxprepsBtn = document.getElementById('btn-export-maxpreps');
    const previewArea = document.getElementById('maxpreps-preview-area');
    const textArea = document.getElementById('maxpreps-text-content');
    const copyBtn = document.getElementById('btn-copy-maxpreps');

    if (maxprepsBtn && previewArea && textArea) {
      maxprepsBtn.addEventListener('click', () => {
        textArea.value = exporter.generateMaxPrepsReport();
        previewArea.style.display = 'block';
        previewArea.scrollIntoView({ behavior: 'smooth' });
      });
    }

    if (copyBtn && textArea) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(textArea.value);
        copyBtn.textContent = '✅ Copied!';
        setTimeout(() => copyBtn.textContent = '📋 Copy to Clipboard', 2000);
      });
    }

    const printBtn = document.getElementById('btn-export-print');
    if (printBtn) printBtn.addEventListener('click', () => exporter.printScoreSheet());

    const boxCsvBtn = document.getElementById('btn-export-boxscore-csv');
    if (boxCsvBtn) boxCsvBtn.addEventListener('click', () => exporter.exportBoxScoreCSV());

    const pbpCsvBtn = document.getElementById('btn-export-pbp-csv');
    if (pbpCsvBtn) pbpCsvBtn.addEventListener('click', () => exporter.exportPlayByPlayCSV());

    const graphicBtn = document.getElementById('btn-export-graphic');
    if (graphicBtn) graphicBtn.addEventListener('click', () => exporter.downloadShareGraphic());

    const saveJsonBtn = document.getElementById('btn-export-json');
    if (saveJsonBtn) saveJsonBtn.addEventListener('click', () => exporter.exportMatchJSON());

    const importInput = document.getElementById('input-import-json');
    if (importInput) {
      importInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          exporter.importMatchJSON(e.target.files[0], (success) => {
            if (success) {
              this.showToast('Match loaded successfully!');
              this.switchTab('scoring');
            }
          });
        }
      });
    }
  }

  // --- KEYBOARD SHORTCUTS ---

  bindKeyboardHotkeys() {
    window.addEventListener('keydown', (e) => {
      // Ignore if user typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        state.toggleClock();
      } else if (e.key === 's' || e.key === 'S') {
        state.resetShotClock(30);
      } else if (e.key === 'e' || e.key === 'E') {
        state.resetShotClock(20);
      } else if (e.key === 'g' || e.key === 'G') {
        this.triggerAction('goal');
      } else if (e.key === 'f' || e.key === 'F') {
        this.triggerAction('exclusion');
      } else if (e.key === 'm' || e.key === 'M') {
        this.triggerAction('miss');
      } else if (e.key === 'v' || e.key === 'V') {
        this.triggerAction('save');
      } else if (e.key === 'z' || e.key === 'Z') {
        state.undoLastEvent();
      }
    });
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new WaterPoloApp();
});
