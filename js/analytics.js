/**
 * Player Analytics Engine & Interactive Dashboard
 * Features:
 * - Individual player radar breakdown and performance index
 * - Shot type efficiency analysis (Perimeter, 2m Hole Set, 5m Penalty, Counter, 6-on-5)
 * - Individual player goal face target heatmap
 * - Head-to-head player comparison module
 * - Goalkeeper save breakdown by period
 */

import { state } from './state.js';

export class PlayerAnalyticsEngine {
  constructor(containerEl) {
    this.container = containerEl;
    this.selectedPlayerKey = null; // 'home_2'
    this.comparePlayer1Key = null;
    this.comparePlayer2Key = null;

    this.init();
  }

  init() {
    state.subscribe(() => {
      this.render();
    });
    this.render();
  }

  render() {
    if (!this.container || !state.match) return;

    const stats = state.calculateStats();
    if (!stats) return;

    const home = state.match.homeTeam;
    const away = state.match.awayTeam;

    // Default selected player if not set
    if (!this.selectedPlayerKey) {
      const firstHomeCap = Object.keys(stats.home.players)[0];
      if (firstHomeCap) this.selectedPlayerKey = `home_${firstHomeCap}`;
      else {
        const firstAwayCap = Object.keys(stats.away.players)[0];
        if (firstAwayCap) this.selectedPlayerKey = `away_${firstAwayCap}`;
      }
    }

    this.container.innerHTML = `
      <div class="analytics-dashboard-container">
        <!-- Analytics Header Banner -->
        <div class="analytics-header-banner">
          <div class="analytics-title-block">
            <h2>📈 Advanced Player Analytics</h2>
            <p>In-depth individual shot charts, efficiency metrics, and head-to-head player comparisons.</p>
          </div>
          <div class="analytics-player-picker-wrap">
            <label>Select Player:</label>
            <select id="analytics-player-dropdown" class="chart-select player-select-large">
              <optgroup label="${home.name} (${home.shortName})">
                ${Object.values(stats.home.players).map(p => `
                  <option value="home_${p.cap}" ${this.selectedPlayerKey === `home_${p.cap}` ? 'selected' : ''}>
                    #${p.cap} ${p.name} (${p.pos || 'Player'}) - ${p.goals}G, ${p.assists}A
                  </option>
                `).join('')}
              </optgroup>
              <optgroup label="${away.name} (${away.shortName})">
                ${Object.values(stats.away.players).map(p => `
                  <option value="away_${p.cap}" ${this.selectedPlayerKey === `away_${p.cap}` ? 'selected' : ''}>
                    #${p.cap} ${p.name} (${p.pos || 'Player'}) - ${p.goals}G, ${p.assists}A
                  </option>
                `).join('')}
              </optgroup>
            </select>
          </div>
        </div>

        ${this.renderPlayerDeepDive(stats)}

        <!-- Head-to-Head Comparison Module -->
        <div class="h2h-comparison-card mt-4">
          <div class="h2h-header">
            <h3>⚔️ Head-to-Head Player Comparison</h3>
            <p class="text-muted">Compare shooting accuracy, defensive impact, and offensive production side-by-side.</p>
          </div>
          ${this.renderHeadToHead(stats)}
        </div>
      </div>
    `;

    this.bindEvents(stats);
  }

  renderPlayerDeepDive(stats) {
    if (!this.selectedPlayerKey) {
      return `
        <div class="analytics-empty-state">
          <span class="empty-icon">🤽‍♂️</span>
          <p>No players in active match. Add or import players in the Live Scoring tab!</p>
        </div>
      `;
    }

    const [teamKey, capStr] = this.selectedPlayerKey.split('_');
    const cap = parseInt(capStr);
    const teamObj = teamKey === 'home' ? state.match.homeTeam : state.match.awayTeam;
    const teamStats = teamKey === 'home' ? stats.home : stats.away;
    const player = teamStats.players[cap];

    if (!player) {
      return `<div class="analytics-empty-state"><p>Player not found.</p></div>`;
    }

    // Filter player's shots and target quadrants
    const playerEvents = (state.match.events || []).filter(e => e.team === teamKey && e.cap === cap);
    const shotTypesCount = { action: 0, '6on5': 0, penalty: 0, center: 0, counter: 0, lob: 0 };
    const shotTypesGoals = { action: 0, '6on5': 0, penalty: 0, center: 0, counter: 0, lob: 0 };
    const goalZoneCounts = {
      top_left: 0, top_center: 0, top_right: 0,
      mid_left: 0, mid_center: 0, mid_right: 0,
      bottom_left: 0, bottom_center: 0, bottom_right: 0
    };

    playerEvents.forEach(e => {
      if (e.isGoal || e.type === 'miss' || e.type === 'save' || e.type === 'block') {
        const type = e.shotType || 'action';
        if (shotTypesCount[type] !== undefined) shotTypesCount[type]++;
        if (e.isGoal && shotTypesGoals[type] !== undefined) shotTypesGoals[type]++;
      }
      if (e.isGoal && e.targetZone && goalZoneCounts[e.targetZone] !== undefined) {
        goalZoneCounts[e.targetZone]++;
      }
    });

    // Rating Score calculation (Efficiency Index)
    const ratingIndex = Math.max(0, (
      (player.goals * 3) + 
      (player.assists * 2) + 
      (player.steals * 2) + 
      (player.blocks * 2) + 
      (player.exclusionsDrawn * 1.5) +
      (player.sprintsWon * 1) - 
      (player.exclusionsCommitted * 1.5) - 
      (player.turnovers * 1.5)
    )).toFixed(1);

    const isFoulOut = player.exclusionsCommitted >= 3;
    const isWarning = player.exclusionsCommitted === 2;

    return `
      <div class="player-profile-grid">
        <!-- Player Identity & Key Metrics Card -->
        <div class="profile-hero-card">
          <div class="profile-cap-badge" style="background-color: ${teamObj.capColor}; color: ${teamObj.capTextColor}; border: 2px solid #ffb81c;">
            #${player.cap}
          </div>
          <div class="profile-info-block">
            <div class="profile-name-row">
              <h3>${player.name}</h3>
              <span class="profile-team-badge">${teamObj.name}</span>
            </div>
            <div class="profile-meta-tags">
              <span class="profile-pos-pill">${player.pos || 'Player'}</span>
              <span class="profile-starter-pill">${player.isStarter ? 'Starter' : 'Bench'}</span>
              ${isFoulOut ? '<span class="status-badge red">FOUL OUT (3 Exclusions)</span>' : ''}
              ${isWarning ? '<span class="status-badge amber">2 Exclusions Warning</span>' : ''}
            </div>
          </div>
          <div class="profile-rating-box">
            <span class="rating-num">${ratingIndex}</span>
            <span class="rating-label">IMPACT SCORE</span>
          </div>
        </div>

        <!-- Primary Stat Cards Grid -->
        <div class="player-stat-cards-grid">
          <div class="pstat-card">
            <span class="pstat-title">Goals / Shots</span>
            <span class="pstat-value">${player.goals} / ${player.shots}</span>
            <span class="pstat-sub">${player.shotAccuracy}% Shooting Accuracy</span>
          </div>

          <div class="pstat-card">
            <span class="pstat-title">Total Points</span>
            <span class="pstat-value highlight-gold">${player.points}</span>
            <span class="pstat-sub">${player.goals} Goals • ${player.assists} Assists</span>
          </div>

          <div class="pstat-card">
            <span class="pstat-title">Defense (Stops)</span>
            <span class="pstat-value highlight-green">${player.steals + player.blocks}</span>
            <span class="pstat-sub">${player.steals} Steals • ${player.blocks} Field Blocks</span>
          </div>

          <div class="pstat-card">
            <span class="pstat-title">Exclusions (Earned vs Foul)</span>
            <span class="pstat-value ${isFoulOut ? 'text-red' : ''}">${player.exclusionsDrawn} / ${player.exclusionsCommitted}</span>
            <span class="pstat-sub">${player.exclusionsDrawn} Drawn • ${player.exclusionsCommitted} Committed</span>
          </div>
        </div>

        <!-- Deep Dive 2-Column: Shot Type Breakdown & Goal Face Heatmap -->
        <div class="player-charts-grid">
          <!-- Shot Type Efficiency -->
          <div class="chart-panel-card">
            <h4>Shot Type Distribution & Conversion</h4>
            <div class="shot-types-bars">
              ${this.renderShotTypeBar('6-on-5 Man Up', shotTypesGoals['6on5'], shotTypesCount['6on5'])}
              ${this.renderShotTypeBar('Perimeter / Action', shotTypesGoals['action'], shotTypesCount['action'])}
              ${this.renderShotTypeBar('2m Center Hole Set', shotTypesGoals['center'], shotTypesCount['center'])}
              ${this.renderShotTypeBar('5m Penalty Shots', shotTypesGoals['penalty'], shotTypesCount['penalty'])}
              ${this.renderShotTypeBar('Counter Attack', shotTypesGoals['counter'], shotTypesCount['counter'])}
              ${this.renderShotTypeBar('Lob / Skip Shots', shotTypesGoals['lob'], shotTypesCount['lob'])}
            </div>
          </div>

          <!-- Player Goal Mouth Target Heatmap -->
          <div class="chart-panel-card">
            <h4>Scoring Target Distribution</h4>
            <p class="text-muted" style="font-size: 11px; margin-bottom: 8px;">Goals scored by cage quadrant</p>
            <div class="player-goal-mouth-grid">
              <div class="pg-quad ${goalZoneCounts.top_left > 0 ? 'scored' : ''}">
                <span class="pg-label">Top L</span>
                <span class="pg-val">${goalZoneCounts.top_left}</span>
              </div>
              <div class="pg-quad ${goalZoneCounts.top_center > 0 ? 'scored' : ''}">
                <span class="pg-label">Top C</span>
                <span class="pg-val">${goalZoneCounts.top_center}</span>
              </div>
              <div class="pg-quad ${goalZoneCounts.top_right > 0 ? 'scored' : ''}">
                <span class="pg-label">Top R</span>
                <span class="pg-val">${goalZoneCounts.top_right}</span>
              </div>

              <div class="pg-quad ${goalZoneCounts.mid_left > 0 ? 'scored' : ''}">
                <span class="pg-label">Mid L</span>
                <span class="pg-val">${goalZoneCounts.mid_left}</span>
              </div>
              <div class="pg-quad ${goalZoneCounts.mid_center > 0 ? 'scored' : ''}">
                <span class="pg-label">Center</span>
                <span class="pg-val">${goalZoneCounts.mid_center}</span>
              </div>
              <div class="pg-quad ${goalZoneCounts.mid_right > 0 ? 'scored' : ''}">
                <span class="pg-label">Mid R</span>
                <span class="pg-val">${goalZoneCounts.mid_right}</span>
              </div>

              <div class="pg-quad ${goalZoneCounts.bottom_left > 0 ? 'scored' : ''}">
                <span class="pg-label">Low L</span>
                <span class="pg-val">${goalZoneCounts.bottom_left}</span>
              </div>
              <div class="pg-quad ${goalZoneCounts.bottom_center > 0 ? 'scored' : ''}">
                <span class="pg-label">Low C</span>
                <span class="pg-val">${goalZoneCounts.bottom_center}</span>
              </div>
              <div class="pg-quad ${goalZoneCounts.bottom_right > 0 ? 'scored' : ''}">
                <span class="pg-label">Low R</span>
                <span class="pg-val">${goalZoneCounts.bottom_right}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderShotTypeBar(label, goals, total) {
    const pct = total > 0 ? Math.round((goals / total) * 100) : 0;
    return `
      <div class="shot-bar-item">
        <div class="shot-bar-meta">
          <span class="sbar-label">${label}</span>
          <span class="sbar-nums">${goals} / ${total} (${pct}%)</span>
        </div>
        <div class="sbar-track">
          <div class="sbar-fill" style="width: ${pct}%;"></div>
        </div>
      </div>
    `;
  }

  renderHeadToHead(stats) {
    const allPlayers = [
      ...Object.values(stats.home.players).map(p => ({ ...p, teamKey: 'home', teamName: state.match.homeTeam.name })),
      ...Object.values(stats.away.players).map(p => ({ ...p, teamKey: 'away', teamName: state.match.awayTeam.name }))
    ];

    if (allPlayers.length < 2) {
      return `<p class="text-muted" style="padding: 16px;">Add at least 2 players to enable comparison.</p>`;
    }

    if (!this.comparePlayer1Key) this.comparePlayer1Key = `${allPlayers[0].teamKey}_${allPlayers[0].cap}`;
    if (!this.comparePlayer2Key) this.comparePlayer2Key = `${allPlayers[1].teamKey}_${allPlayers[1].cap}`;

    const [t1, c1] = this.comparePlayer1Key.split('_');
    const [t2, c2] = this.comparePlayer2Key.split('_');

    const p1 = (t1 === 'home' ? stats.home.players : stats.away.players)[parseInt(c1)] || allPlayers[0];
    const p2 = (t2 === 'home' ? stats.home.players : stats.away.players)[parseInt(c2)] || allPlayers[1];

    const renderCompRow = (metricTitle, val1, val2, higherIsBetter = true) => {
      const v1 = parseFloat(val1) || 0;
      const v2 = parseFloat(val2) || 0;
      const p1Wins = higherIsBetter ? v1 > v2 : v1 < v2;
      const p2Wins = higherIsBetter ? v2 > v1 : v2 < v1;
      const total = (v1 + v2) || 1;
      const w1 = Math.round((v1 / total) * 100);
      const w2 = 100 - w1;

      return `
        <div class="h2h-row">
          <span class="h2h-val-left ${p1Wins ? 'winner' : ''}">${val1}</span>
          <div class="h2h-bar-center">
            <span class="h2h-metric-label">${metricTitle}</span>
            <div class="h2h-dual-bar">
              <div class="h2h-bar-p1" style="width: ${w1}%;"></div>
              <div class="h2h-bar-p2" style="width: ${w2}%;"></div>
            </div>
          </div>
          <span class="h2h-val-right ${p2Wins ? 'winner' : ''}">${val2}</span>
        </div>
      `;
    };

    return `
      <div class="h2h-module">
        <div class="h2h-selectors-row">
          <select id="h2h-select-p1" class="chart-select">
            ${allPlayers.map(p => `
              <option value="${p.teamKey}_${p.cap}" ${this.comparePlayer1Key === `${p.teamKey}_${p.cap}` ? 'selected' : ''}>
                ${p.teamName} #${p.cap} ${p.name}
              </option>
            `).join('')}
          </select>
          <span class="h2h-vs-badge">VS</span>
          <select id="h2h-select-p2" class="chart-select">
            ${allPlayers.map(p => `
              <option value="${p.teamKey}_${p.cap}" ${this.comparePlayer2Key === `${p.teamKey}_${p.cap}` ? 'selected' : ''}>
                ${p.teamName} #${p.cap} ${p.name}
              </option>
            `).join('')}
          </select>
        </div>

        <div class="h2h-comparison-table">
          ${renderCompRow('Goals', p1.goals, p2.goals)}
          ${renderCompRow('Shooting %', `${p1.shotAccuracy}%`, `${p2.shotAccuracy}%`)}
          ${renderCompRow('Assists', p1.assists, p2.assists)}
          ${renderCompRow('Total Points', p1.points, p2.points)}
          ${renderCompRow('Steals', p1.steals, p2.steals)}
          ${renderCompRow('Field Blocks', p1.blocks, p2.blocks)}
          ${renderCompRow('Exclusions Drawn', p1.exclusionsDrawn, p2.exclusionsDrawn)}
          ${renderCompRow('Exclusions Committed', p1.exclusionsCommitted, p2.exclusionsCommitted, false)}
          ${renderCompRow('Sprints Won', p1.sprintsWon, p2.sprintsWon)}
        </div>
      </div>
    `;
  }

  bindEvents(stats) {
    const playerDropdown = this.container.querySelector('#analytics-player-dropdown');
    if (playerDropdown) {
      playerDropdown.addEventListener('change', (e) => {
        this.selectedPlayerKey = e.target.value;
        this.render();
      });
    }

    const h2hP1 = this.container.querySelector('#h2h-select-p1');
    const h2hP2 = this.container.querySelector('#h2h-select-p2');
    if (h2hP1) {
      h2hP1.addEventListener('change', (e) => {
        this.comparePlayer1Key = e.target.value;
        this.render();
      });
    }
    if (h2hP2) {
      h2hP2.addEventListener('change', (e) => {
        this.comparePlayer2Key = e.target.value;
        this.render();
      });
    }
  }
}
