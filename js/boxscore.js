/**
 * Box Score and Advanced Analytics Renderer (NCAA / World Aquatics Standards)
 * Computes and renders:
 * - Match overview with quarter-by-quarter breakdown
 * - Situational efficiency (6-on-5 extra-man advantage, 5-on-6 penalty kill, 5m penalty shots)
 * - Sortable Player Box Scores for Home & Away
 * - Goalkeepers Analysis
 * - Top Performers & MVP Badges
 */

import { state } from './state.js';

export class BoxScoreRenderer {
  constructor(containerEl) {
    this.container = containerEl;
    this.currentTab = 'home'; // 'home' | 'away' | 'comparison' | 'goalies'
    this.sortColumn = 'goals';
    this.sortAsc = false;

    this.init();
  }

  init() {
    state.subscribe(() => {
      this.render();
    });
    this.render();
  }

  setTab(tabName) {
    this.currentTab = tabName;
    this.render();
  }

  render() {
    if (!this.container || !state.match) return;

    const stats = state.calculateStats();
    if (!stats) return;

    const home = state.match.homeTeam;
    const away = state.match.awayTeam;

    this.container.innerHTML = `
      <div class="boxscore-card">
        <!-- Quarter Scoring & Match Summary Banner -->
        <div class="boxscore-header">
          <div class="match-meta-pill">
            <span class="meta-icon">🏆</span>
            <span class="meta-tourn">${state.match.tournament || 'Championship Match'}</span>
            <span class="meta-dot">•</span>
            <span class="meta-loc">${state.match.location || 'Aquatic Center'}</span>
          </div>
          
          <div class="quarter-table-wrapper">
            <table class="quarter-score-table">
              <thead>
                <tr>
                  <th class="team-col">Team</th>
                  <th>Q1</th>
                  <th>Q2</th>
                  <th>Q3</th>
                  <th>Q4</th>
                  <th>OT</th>
                  <th class="final-col">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr class="home-row">
                  <td class="team-name-cell">
                    <span class="cap-indicator" style="background-color: ${home.capColor}; border: 1px solid #94a3b8;"></span>
                    <strong>${home.name}</strong>
                  </td>
                  <td>${stats.home.quarters[0]}</td>
                  <td>${stats.home.quarters[1]}</td>
                  <td>${stats.home.quarters[2]}</td>
                  <td>${stats.home.quarters[3]}</td>
                  <td>${stats.home.quarters[4] > 0 ? stats.home.quarters[4] : '-'}</td>
                  <td class="final-score">${home.score}</td>
                </tr>
                <tr class="away-row">
                  <td class="team-name-cell">
                    <span class="cap-indicator" style="background-color: ${away.capColor}; border: 1px solid #94a3b8;"></span>
                    <strong>${away.name}</strong>
                  </td>
                  <td>${stats.away.quarters[0]}</td>
                  <td>${stats.away.quarters[1]}</td>
                  <td>${stats.away.quarters[2]}</td>
                  <td>${stats.away.quarters[3]}</td>
                  <td>${stats.away.quarters[4] > 0 ? stats.away.quarters[4] : '-'}</td>
                  <td class="final-score">${away.score}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Key Situational Statistics Grid -->
        <div class="situational-stats-grid">
          <div class="stat-gauge-card">
            <div class="gauge-title">6-on-5 Man Up Advantage</div>
            <div class="gauge-comparison">
              <div class="gauge-side">
                <span class="gauge-team">${home.shortName}</span>
                <span class="gauge-val highlight-blue">${stats.home.manUpGoals}/${stats.home.manUpAttempts}</span>
                <span class="gauge-pct">(${stats.home.manUpPct}%)</span>
              </div>
              <div class="gauge-divider">vs</div>
              <div class="gauge-side">
                <span class="gauge-team">${away.shortName}</span>
                <span class="gauge-val highlight-amber">${stats.away.manUpGoals}/${stats.away.manUpAttempts}</span>
                <span class="gauge-pct">(${stats.away.manUpPct}%)</span>
              </div>
            </div>
            <div class="progress-bar-dual">
              <div class="bar-fill home-fill" style="width: ${stats.home.manUpPct}%;"></div>
            </div>
          </div>

          <div class="stat-gauge-card">
            <div class="gauge-title">5-on-6 Penalty Kill (Defense)</div>
            <div class="gauge-comparison">
              <div class="gauge-side">
                <span class="gauge-team">${home.shortName}</span>
                <span class="gauge-val highlight-green">${stats.home.manDownPct}%</span>
              </div>
              <div class="gauge-divider">vs</div>
              <div class="gauge-side">
                <span class="gauge-team">${away.shortName}</span>
                <span class="gauge-val highlight-green">${stats.away.manDownPct}%</span>
              </div>
            </div>
            <div class="progress-bar-dual">
              <div class="bar-fill home-fill" style="width: ${stats.home.manDownPct}%;"></div>
            </div>
          </div>

          <div class="stat-gauge-card">
            <div class="gauge-title">5-Meter Penalties</div>
            <div class="gauge-comparison">
              <div class="gauge-side">
                <span class="gauge-team">${home.shortName}</span>
                <span class="gauge-val">${stats.home.penaltyGoals}/${stats.home.penaltyAttempts}</span>
                <span class="gauge-pct">(${stats.home.penaltyPct}%)</span>
              </div>
              <div class="gauge-divider">vs</div>
              <div class="gauge-side">
                <span class="gauge-team">${away.shortName}</span>
                <span class="gauge-val">${stats.away.penaltyGoals}/${stats.away.penaltyAttempts}</span>
                <span class="gauge-pct">(${stats.away.penaltyPct}%)</span>
              </div>
            </div>
          </div>

          <div class="stat-gauge-card">
            <div class="gauge-title">Shooting Efficiency</div>
            <div class="gauge-comparison">
              <div class="gauge-side">
                <span class="gauge-team">${home.shortName}</span>
                <span class="gauge-val">${stats.home.goals}/${stats.home.totalShots}</span>
                <span class="gauge-pct">(${stats.home.shootingPct}%)</span>
              </div>
              <div class="gauge-divider">vs</div>
              <div class="gauge-side">
                <span class="gauge-team">${away.shortName}</span>
                <span class="gauge-val">${stats.away.goals}/${stats.away.totalShots}</span>
                <span class="gauge-pct">(${stats.away.shootingPct}%)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Box Score Navigation Tabs -->
        <div class="boxscore-tab-bar">
          <button class="bs-tab-btn ${this.currentTab === 'home' ? 'active' : ''}" data-tab="home">
            ${home.name} Roster (${home.score})
          </button>
          <button class="bs-tab-btn ${this.currentTab === 'away' ? 'active' : ''}" data-tab="away">
            ${away.name} Roster (${away.score})
          </button>
          <button class="bs-tab-btn ${this.currentTab === 'goalies' ? 'active' : ''}" data-tab="goalies">
            Goalkeepers Analysis
          </button>
        </div>

        <!-- Tab Content Area -->
        <div class="boxscore-tab-content">
          ${this.renderTabContent(stats)}
        </div>
      </div>
    `;

    this.bindTabEvents();
  }

  renderTabContent(stats) {
    if (this.currentTab === 'home') {
      return this.renderPlayerTable(stats.home.players, state.match.homeTeam);
    } else if (this.currentTab === 'away') {
      return this.renderPlayerTable(stats.away.players, state.match.awayTeam);
    } else if (this.currentTab === 'goalies') {
      return this.renderGoaliesView(stats);
    }
    return '';
  }

  renderPlayerTable(playersObj, team) {
    let players = Object.values(playersObj);

    // Sort
    players.sort((a, b) => {
      let valA = a[this.sortColumn] ?? 0;
      let valB = b[this.sortColumn] ?? 0;
      if (typeof valA === 'string') return this.sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      return this.sortAsc ? valA - valB : valB - valA;
    });

    const rowsHtml = players.map(p => {
      const isFoulOut = p.exclusionsCommitted >= 3;
      const isWarning = p.exclusionsCommitted === 2;

      return `
        <tr class="${isFoulOut ? 'foul-out-row' : ''}">
          <td class="cap-col">
            <span class="cap-badge ${isFoulOut ? 'foul-out' : ''}">#${p.cap}</span>
          </td>
          <td class="player-name-col">
            <strong>${p.name}</strong>
            ${p.pos ? `<span class="pos-tag">${p.pos}</span>` : ''}
            ${isFoulOut ? '<span class="status-badge red">ROLLED (3 Fouls)</span>' : ''}
            ${isWarning ? '<span class="status-badge amber">2 Fouls</span>' : ''}
          </td>
          <td class="stat-highlight"><strong>${p.goals}</strong></td>
          <td>${p.shots}</td>
          <td>${p.shotAccuracy}%</td>
          <td>${p.assists}</td>
          <td class="stat-highlight-pts">${p.points}</td>
          <td>${p.steals}</td>
          <td>${p.blocks}</td>
          <td class="${isFoulOut ? 'text-red font-bold' : isWarning ? 'text-amber' : ''}">${p.exclusionsCommitted}</td>
          <td>${p.exclusionsDrawn}</td>
          <td>${p.penaltyCommitted}</td>
          <td>${p.penaltyDrawn}</td>
          <td>${p.turnovers}</td>
          <td>${p.sprintsWon}</td>
        </tr>
      `;
    }).join('');

    return `
      <div class="player-table-container">
        <table class="official-boxscore-table">
          <thead>
            <tr>
              <th class="sortable" data-col="cap">Cap</th>
              <th class="sortable" data-col="name">Player</th>
              <th class="sortable" data-col="goals">G</th>
              <th class="sortable" data-col="shots">SH</th>
              <th class="sortable" data-col="shotAccuracy">SH%</th>
              <th class="sortable" data-col="assists">A</th>
              <th class="sortable" data-col="points">PTS</th>
              <th class="sortable" data-col="steals">ST</th>
              <th class="sortable" data-col="blocks">BLK</th>
              <th class="sortable" data-col="exclusionsCommitted" title="Exclusions Committed (3 = Foul Out)">EXC</th>
              <th class="sortable" data-col="exclusionsDrawn" title="Exclusions Drawn / Earned">EXD</th>
              <th class="sortable" data-col="penaltyCommitted" title="Penalty Fouls Committed">PFC</th>
              <th class="sortable" data-col="penaltyDrawn" title="Penalty Fouls Drawn">PFD</th>
              <th class="sortable" data-col="turnovers">TO</th>
              <th class="sortable" data-col="sprintsWon">SPR</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    `;
  }

  renderGoaliesView(stats) {
    const homeGoalies = Object.values(stats.home.goalies);
    const awayGoalies = Object.values(stats.away.goalies);

    const renderRows = (list, team) => list.map(g => `
      <tr>
        <td><span class="cap-badge">#${g.cap}</span></td>
        <td><strong>${g.name}</strong> <span class="pos-tag">GK</span></td>
        <td class="stat-highlight-blue"><strong>${g.saves}</strong></td>
        <td>${g.goalsAllowed}</td>
        <td>${g.shotsFaced}</td>
        <td class="stat-highlight-green"><strong>${g.savePct}%</strong></td>
        <td>${g.penaltySaves}</td>
        <td>${g.steals}</td>
        <td>${g.assists}</td>
      </tr>
    `).join('');

    return `
      <div class="goalies-table-container">
        <h4 class="goalie-sec-title">
          <span class="cap-indicator" style="background-color: ${state.match.homeTeam.capColor}; border: 1px solid #94a3b8;"></span>
          ${state.match.homeTeam.name} Goalkeepers
        </h4>
        <table class="official-boxscore-table goalie-table">
          <thead>
            <tr>
              <th>Cap</th>
              <th>Goalkeeper</th>
              <th>Saves (SV)</th>
              <th>Goals Allowed (GA)</th>
              <th>Shots Faced (SF)</th>
              <th>Save % (SV%)</th>
              <th>Penalty Saves (PSV)</th>
              <th>Steals (ST)</th>
              <th>Assists (A)</th>
            </tr>
          </thead>
          <tbody>
            ${renderRows(homeGoalies, state.match.homeTeam)}
          </tbody>
        </table>

        <h4 class="goalie-sec-title mt-4">
          <span class="cap-indicator" style="background-color: ${state.match.awayTeam.capColor}; border: 1px solid #94a3b8;"></span>
          ${state.match.awayTeam.name} Goalkeepers
        </h4>
        <table class="official-boxscore-table goalie-table">
          <thead>
            <tr>
              <th>Cap</th>
              <th>Goalkeeper</th>
              <th>Saves (SV)</th>
              <th>Goals Allowed (GA)</th>
              <th>Shots Faced (SF)</th>
              <th>Save % (SV%)</th>
              <th>Penalty Saves (PSV)</th>
              <th>Steals (ST)</th>
              <th>Assists (A)</th>
            </tr>
          </thead>
          <tbody>
            ${renderRows(awayGoalies, state.match.awayTeam)}
          </tbody>
        </table>
      </div>
    `;
  }

  bindTabEvents() {
    const tabBtns = this.container.querySelectorAll('.bs-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = btn.dataset.tab;
        this.setTab(tab);
      });
    });

    const sortHeaders = this.container.querySelectorAll('.sortable');
    sortHeaders.forEach(th => {
      th.addEventListener('click', () => {
        const col = th.dataset.col;
        if (this.sortColumn === col) {
          this.sortAsc = !this.sortAsc;
        } else {
          this.sortColumn = col;
          this.sortAsc = false;
        }
        this.render();
      });
    });
  }
}
