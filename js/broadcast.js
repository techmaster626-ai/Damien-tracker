/**
 * Broadcast Engine & Live Stream Scorebug Overlay
 * Features:
 * - Transparent / Chroma-key ready Stream Scorebug HUD for OBS/vMix/YouTube streaming.
 * - Real-time active 20s exclusion badges embedded in stream overlay.
 * - Highlight Reel bookmark generator with clip timestamps.
 * - Fullscreen Arena Scoreboard mode for poolside monitors.
 */

import { state } from './state.js';

export class BroadcastEngine {
  constructor(overlayContainerEl) {
    this.container = overlayContainerEl;
    this.isBroadcastActive = false;
    this.chromaMode = 'transparent'; // 'transparent' | 'green' | 'blue'

    this.init();
  }

  init() {
    state.subscribe(() => {
      if (this.isBroadcastActive) {
        this.renderScorebug();
      }
    });
  }

  openBroadcastWindow() {
    this.isBroadcastActive = true;
    this.renderScorebug();
    if (this.container) {
      this.container.classList.add('active');
    }
  }

  closeBroadcastWindow() {
    this.isBroadcastActive = false;
    if (this.container) {
      this.container.classList.remove('active');
    }
  }

  setChromaMode(mode) {
    this.chromaMode = mode;
    this.renderScorebug();
  }

  renderScorebug() {
    if (!this.container || !state.match) return;

    const home = state.match.homeTeam;
    const away = state.match.awayTeam;
    const timeStr = state.formatTime(state.match.clockSec);
    const manUp = state.getManUpState();

    let chromaBg = 'transparent';
    if (this.chromaMode === 'green') chromaBg = '#00b140';
    if (this.chromaMode === 'blue') chromaBg = '#0047bb';

    this.container.style.backgroundColor = chromaBg;

    this.container.innerHTML = `
      <div class="scorebug-backdrop">
        <!-- Floating Broadcast Scorebug HUD (Top Left or Center) -->
        <div class="scorebug-hud">
          <!-- Home Team Block -->
          <div class="scorebug-team home-side" style="border-left: 6px solid ${home.capColor};">
            <img src="assets/damien-logo.png" alt="Damien Helmet" style="height: 28px; width: 28px; object-fit: contain; margin-right: 6px;">
            <div class="team-cap-box" style="background-color: ${home.capColor}; color: ${home.capTextColor};">
              <span class="cap-label">HOME</span>
            </div>
            <div class="team-meta">
              <span class="team-code">${home.shortName}</span>
              ${manUp.homeManUp ? '<span class="man-power-pill man-up">6 ON 5</span>' : ''}
            </div>
            <div class="team-score-box">${home.score}</div>
          </div>

          <!-- Clock & Period Center Pillar -->
          <div class="scorebug-center">
            <div class="scorebug-period">Q${state.match.currentQuarter}</div>
            <div class="scorebug-clock">${timeStr}</div>
            <div class="scorebug-shotclock ${state.shotClock <= 5 ? 'critical' : ''}">
              <span class="sc-label">SHOT</span>
              <span class="sc-val">${state.shotClock}</span>
            </div>
          </div>

          <!-- Away Team Block -->
          <div class="scorebug-team away-side" style="border-right: 6px solid ${away.capColor};">
            <div class="team-score-box">${away.score}</div>
            <div class="team-meta">
              <span class="team-code">${away.shortName}</span>
              ${manUp.awayManUp ? '<span class="man-power-pill man-up">6 ON 5</span>' : ''}
            </div>
            <div class="team-cap-box" style="background-color: ${away.capColor}; color: ${away.capTextColor};">
              <span class="cap-label">AWAY</span>
            </div>
          </div>
        </div>

        <!-- Active Exclusions Overlay Strip (If any) -->
        ${state.activeExclusions.length > 0 ? `
          <div class="scorebug-exclusions-bar">
            ${state.activeExclusions.map(exc => `
              <div class="scorebug-exc-tag team-${exc.team}">
                <span class="exc-icon">⚠️</span>
                <span class="exc-name">${exc.name} (#${exc.cap})</span>
                <span class="exc-sec">${exc.remainingSec}s</span>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <!-- Broadcast Control Bar (Hidden during capture) -->
        <div class="broadcast-controls-bar">
          <div class="bc-title">🎥 Live Stream Overlay Mode (OBS / vMix Ready)</div>
          <div class="bc-btns">
            <button class="bc-btn ${this.chromaMode === 'transparent' ? 'active' : ''}" id="btn-chroma-trans">Transparent</button>
            <button class="bc-btn ${this.chromaMode === 'green' ? 'active' : ''}" id="btn-chroma-green">Green Screen</button>
            <button class="bc-btn" id="btn-fullscreen-scorebug">⛶ Fullscreen</button>
            <button class="bc-btn close-btn" id="btn-close-broadcast">✕ Exit Stream Mode</button>
          </div>
        </div>
      </div>
    `;

    this.bindControls();
  }

  bindControls() {
    const btnTrans = this.container.querySelector('#btn-chroma-trans');
    const btnGreen = this.container.querySelector('#btn-chroma-green');
    const btnClose = this.container.querySelector('#btn-close-broadcast');
    const btnFull = this.container.querySelector('#btn-fullscreen-scorebug');

    if (btnTrans) btnTrans.addEventListener('click', () => this.setChromaMode('transparent'));
    if (btnGreen) btnGreen.addEventListener('click', () => this.setChromaMode('green'));
    if (btnClose) btnClose.addEventListener('click', () => this.closeBroadcastWindow());
    if (btnFull) {
      btnFull.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          this.container.requestFullscreen().catch(err => alert(err.message));
        } else {
          document.exitFullscreen();
        }
      });
    }
  }

  // Generate Highlight Reel Clip Bookmarks (water-polo-stats.com signature feature)
  generateHighlightReel() {
    if (!state.match) return [];
    const events = state.match.events || [];

    const highlights = events.filter(e => e.isGoal || e.type === 'save' || (e.type === 'exclusion' && e.q === 4));
    return highlights.map((h, i) => ({
      clipId: `clip_${i + 1}`,
      title: h.desc,
      quarter: `Q${h.q}`,
      clock: h.timeStr,
      type: h.isGoal ? 'Goal' : h.type === 'save' ? 'Save' : 'Exclusion',
      shooter: h.cap,
      team: h.team === 'home' ? state.match.homeTeam.name : state.match.awayTeam.name
    }));
  }
}
