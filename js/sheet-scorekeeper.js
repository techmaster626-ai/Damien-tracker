/**
 * Live Damien Varsity Stats Sheet Interactive Scorekeeper Engine
 * Allows coaches and table officials to score the live match directly using the
 * exact Damien Varsity Stats Sheet matrix with weighted +/- point calculations.
 */

import { state } from './state.js';
import { sound } from './audio.js';

export class DamienSheetScorekeeper {
  constructor(containerEl) {
    this.container = containerEl;
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
    const home = state.match.homeTeam;
    const away = state.match.awayTeam;
    const events = state.match.events || [];

    const damienPlayers = home.roster || [];
    const fieldPlayers = damienPlayers.filter(p => !p.isGk);
    const goalies = damienPlayers.filter(p => p.isGk);

    // Calculate action counts per player
    const playerDetails = {};
    damienPlayers.forEach(p => {
      playerDetails[p.cap] = {
        goals5m: 0,
        goals6on5: 0,
        goals2m: 0,
        goalsAction: 0,
        missOffCage: 0,
        missReg: 0,
        turnovers: 0,
        steals: 0,
        toForced: 0,
        excl5m: 0,
        exclReg: 0,
        fieldBlocks: 0,
        oneOnOne: 0,
        plusTotal: 0,
        minusTotal: 0,
        netTotal: 0
      };
    });

    events.forEach(e => {
      if (e.team === 'home' && e.cap && playerDetails[e.cap]) {
        const pd = playerDetails[e.cap];
        if (e.isGoal) {
          if (e.shotType === 'penalty') pd.goals5m++;
          else if (e.shotType === '6on5') pd.goals6on5++;
          else if (e.shotType === 'center') pd.goals2m++;
          else pd.goalsAction++;
        } else if (e.type === 'miss') {
          if (e.targetZone === 'wide' || e.targetZone === 'crossbar') pd.missOffCage++;
          else pd.missReg++;
        } else if (e.type === 'turnover') {
          pd.turnovers++;
        } else if (e.type === 'steal') {
          pd.steals++;
        } else if (e.type === 'block') {
          pd.fieldBlocks++;
        } else if (e.type === 'exclusion') {
          pd.exclReg++;
        }
      }
    });

    // Compute +/- weights
    let totals = {
      missOffCage: 0, missReg: 0, goals5m: 0, goals6on5: 0, goals2m: 0, goalsAction: 0,
      turnovers: 0, steals: 0, toForced: 0, excl5m: 0, exclReg: 0, fieldBlocks: 0,
      oneOnOne: 0, plusTotal: 0, minusTotal: 0, netTotal: 0
    };

    damienPlayers.forEach(p => {
      const pd = playerDetails[p.cap];
      const pStats = stats.home.players[p.cap] || { goals: 0, steals: 0, blocks: 0, exclusionsCommitted: 0, turnovers: 0 };
      
      const plus = (pd.goals5m * 3) + (pd.goals6on5 * 3) + (pd.goals2m * 2) + (pd.goalsAction * 2) + 
                   (pStats.steals * 2) + (pd.toForced * 3) + (pStats.blocks * 2) + (pd.oneOnOne * 1);
      const minus = (pd.missOffCage * 2) + (pd.missReg * 1) + (pStats.turnovers * 3) + 
                    (pStats.exclusionsCommitted * 2);

      pd.plusTotal = plus;
      pd.minusTotal = minus;
      pd.netTotal = plus - minus;

      totals.missOffCage += pd.missOffCage;
      totals.missReg += pd.missReg;
      totals.goals5m += pd.goals5m;
      totals.goals6on5 += pd.goals6on5;
      totals.goals2m += pd.goals2m;
      totals.goalsAction += pd.goalsAction;
      totals.turnovers += pStats.turnovers;
      totals.steals += pStats.steals;
      totals.toForced += pd.toForced;
      totals.fieldBlocks += pStats.blocks;
      totals.exclReg += pStats.exclusionsCommitted;
      totals.plusTotal += plus;
      totals.minusTotal += minus;
      totals.netTotal += (plus - minus);
    });

    this.container.innerHTML = `
      <div class="sheet-scoring-container">
        <!-- Live Form Top HUD Banner -->
        <div class="sheet-scoring-header-card">
          <div class="ssh-left">
            <div class="ssh-brand">
              <span class="ssh-title">📋 Live Stats Sheet • Damien Varsity WaterPolo</span>
              <span class="ssh-sub">Tap any stat cell to log an event live with instant +/- calculations</span>
            </div>
            <div class="ssh-score-banner">
              <div class="ssh-team home">
                <span class="ssh-team-name">${home.name}</span>
                <span class="ssh-team-score">${home.score}</span>
              </div>
              <span class="ssh-vs">vs</span>
              <div class="ssh-team away">
                <span class="ssh-team-score">${away.score}</span>
                <span class="ssh-team-name">${away.name}</span>
              </div>
            </div>
          </div>
          <div class="ssh-right">
            <div class="ssh-clock-badge ${state.isClockRunning ? 'running' : ''}">
              <span>Q${state.match.currentQuarter}</span> • <strong>${state.formatTime(state.match.clockSec)}</strong>
            </div>
            <button class="clock-btn primary-play" id="btn-sheet-toggle-clock">
              ${state.isClockRunning ? '⏸ Pause' : '▶ Start'}
            </button>
            <button class="clock-btn reset-shot" id="btn-sheet-reset-30">⚡ 30s</button>
            <button class="clock-btn reset-shot" id="btn-sheet-reset-20">⏱️ 20s</button>
          </div>
        </div>

        <!-- Interactive Main Matrix Table -->
        <div class="sheet-table-scroll-wrapper">
          <table class="interactive-damien-sheet-table">
            <thead>
              <tr class="tier-1">
                <th rowspan="3" class="col-cap">#</th>
                <th rowspan="3" class="col-name">Name</th>
                <th colspan="8" class="hdr-offense">OFFENSE</th>
                <th colspan="6" class="hdr-defense">DEFENSE</th>
                <th colspan="3" class="hdr-pm">TOTAL +/-</th>
                <th rowspan="3" class="col-opp-exc">OPP Exclusions (1-20)</th>
              </tr>
              <tr class="tier-2">
                <th colspan="2">MISS</th>
                <th colspan="4">GOALS</th>
                <th colspan="2">TURNOVER</th>
                <th colspan="2">STEAL</th>
                <th colspan="2">EXCLUSION</th>
                <th rowspan="2">FB<br><span class="weight-tag pos">+2</span></th>
                <th rowspan="2">1ON1<br><span class="weight-tag pos">+1</span></th>
                <th rowspan="2">PLUS<br>(+)</th>
                <th rowspan="2">MINUS<br>(-)</th>
                <th rowspan="2">TOTAL<br>(+/-)</th>
              </tr>
              <tr class="tier-3">
                <th>OFF CAGE<br><span class="weight-tag neg">-2</span></th>
                <th>MISS<br><span class="weight-tag neg">-1</span></th>
                <th>5M<br><span class="weight-tag pos">+3</span></th>
                <th>6on5<br><span class="weight-tag pos">+3</span></th>
                <th>2M<br><span class="weight-tag pos">+2</span></th>
                <th>ACT<br><span class="weight-tag pos">+2</span></th>
                <th>TO<br><span class="weight-tag neg">-3</span></th>
                <th>BAD PASS<br><span class="weight-tag neg">-2</span></th>
                <th>STEAL<br><span class="weight-tag pos">+2</span></th>
                <th>FORCED<br><span class="weight-tag pos">+3</span></th>
                <th>5M<br><span class="weight-tag neg">-3</span></th>
                <th>REG<br><span class="weight-tag neg">-2</span></th>
              </tr>
            </thead>
            <tbody>
              ${fieldPlayers.map(p => {
                const pd = playerDetails[p.cap];
                const pStat = stats.home.players[p.cap] || { goals: 0, steals: 0, blocks: 0, exclusionsCommitted: 0, turnovers: 0 };
                return `
                  <tr data-cap="${p.cap}" data-name="${p.name}">
                    <td class="cell-cap"><strong>#${p.cap}</strong></td>
                    <td class="cell-player-name">${p.name}</td>

                    <!-- Offense Tap Cells -->
                    <td class="cell-tap act-offcage" data-action="miss_offcage" data-cap="${p.cap}" title="+1 Miss Off Cage (-2 pts)">
                      <button class="sheet-tap-btn">${pd.missOffCage || '-'}</button>
                    </td>
                    <td class="cell-tap act-miss" data-action="miss_reg" data-cap="${p.cap}" title="+1 Miss Regular (-1 pt)">
                      <button class="sheet-tap-btn">${pd.missReg || '-'}</button>
                    </td>
                    <td class="cell-tap act-goal goal-5m" data-action="goal_5m" data-cap="${p.cap}" title="+1 5M Penalty Goal (+3 pts)">
                      <button class="sheet-tap-btn goal">${pd.goals5m || '-'}</button>
                    </td>
                    <td class="cell-tap act-goal goal-6on5" data-action="goal_6on5" data-cap="${p.cap}" title="+1 6on5 Goal (+3 pts)">
                      <button class="sheet-tap-btn goal">${pd.goals6on5 || '-'}</button>
                    </td>
                    <td class="cell-tap act-goal goal-2m" data-action="goal_2m" data-cap="${p.cap}" title="+1 2M Hole Set Goal (+2 pts)">
                      <button class="sheet-tap-btn goal">${pd.goals2m || '-'}</button>
                    </td>
                    <td class="cell-tap act-goal goal-act" data-action="goal_action" data-cap="${p.cap}" title="+1 Action Goal (+2 pts)">
                      <button class="sheet-tap-btn goal">${pd.goalsAction || '-'}</button>
                    </td>
                    <td class="cell-tap act-to" data-action="turnover" data-cap="${p.cap}" title="+1 Turnover (-3 pts)">
                      <button class="sheet-tap-btn bad">${pStat.turnovers || '-'}</button>
                    </td>
                    <td class="cell-tap act-to" data-action="bad_pass" data-cap="${p.cap}" title="+1 Bad Pass (-2 pts)">
                      <button class="sheet-tap-btn bad">-</button>
                    </td>

                    <!-- Defense Tap Cells -->
                    <td class="cell-tap act-steal" data-action="steal" data-cap="${p.cap}" title="+1 Steal (+2 pts)">
                      <button class="sheet-tap-btn good">${pStat.steals || '-'}</button>
                    </td>
                    <td class="cell-tap act-toforced" data-action="to_forced" data-cap="${p.cap}" title="+1 TO Forced (+3 pts)">
                      <button class="sheet-tap-btn good">${pd.toForced || '-'}</button>
                    </td>
                    <td class="cell-tap act-excl" data-action="excl_5m" data-cap="${p.cap}" title="+1 5M Penalty Committed (-3 pts)">
                      <button class="sheet-tap-btn bad">-</button>
                    </td>
                    <td class="cell-tap act-excl" data-action="excl_reg" data-cap="${p.cap}" title="+1 20s Exclusion Foul (-2 pts)">
                      <button class="sheet-tap-btn bad ${pStat.exclusionsCommitted >= 3 ? 'foulout' : ''}">${pStat.exclusionsCommitted || '-'}</button>
                    </td>
                    <td class="cell-tap act-fb" data-action="field_block" data-cap="${p.cap}" title="+1 Field Block (+2 pts)">
                      <button class="sheet-tap-btn good">${pStat.blocks || '-'}</button>
                    </td>
                    <td class="cell-tap act-1on1" data-action="one_on_one" data-cap="${p.cap}" title="+1 1-on-1 Stop (+1 pt)">
                      <button class="sheet-tap-btn good">${pd.oneOnOne || '-'}</button>
                    </td>

                    <!-- Plus / Minus Dynamic Score Cells -->
                    <td class="cell-pm plus-cell"><strong>+${pd.plusTotal}</strong></td>
                    <td class="cell-pm minus-cell"><strong>-${pd.minusTotal}</strong></td>
                    <td class="cell-pm total-cell ${pd.netTotal >= 0 ? 'pos' : 'neg'}">
                      <span class="pm-badge">${pd.netTotal >= 0 ? '+' + pd.netTotal : pd.netTotal}</span>
                    </td>

                    <!-- Opponent Exclusions Checkboxes -->
                    <td class="cell-opp-excl-col">
                      <div class="opp-exc-interactive-grid">
                        ${[...Array(12)].map((_, i) => `
                          <button class="opp-exc-btn" data-exclnum="${i + 1}" title="Trigger Opponent 20s Exclusion #${i + 1}">
                            ${i + 1}
                          </button>
                        `).join('')}
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}

              <!-- Sheet Totals Summary Row -->
              <tr class="sheet-totals-summary-row">
                <td colspan="2"><strong>TEAM TOTALS</strong></td>
                <td>${totals.missOffCage}</td>
                <td>${totals.missReg}</td>
                <td><strong>${totals.goals5m}</strong></td>
                <td><strong>${totals.goals6on5}</strong></td>
                <td><strong>${totals.goals2m}</strong></td>
                <td><strong>${totals.goalsAction}</strong></td>
                <td>${totals.turnovers}</td>
                <td>0</td>
                <td><strong>${totals.steals}</strong></td>
                <td><strong>${totals.toForced}</strong></td>
                <td>0</td>
                <td><strong>${totals.exclReg}</strong></td>
                <td><strong>${totals.fieldBlocks}</strong></td>
                <td>${totals.oneOnOne}</td>
                <td class="plus-cell"><strong>+${totals.plusTotal}</strong></td>
                <td class="minus-cell"><strong>-${totals.minusTotal}</strong></td>
                <td class="total-cell ${totals.netTotal >= 0 ? 'pos' : 'neg'}">
                  <span class="pm-badge">${totals.netTotal >= 0 ? '+' + totals.netTotal : totals.netTotal}</span>
                </td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Interactive Goalkeepers Table -->
        <div class="sheet-gk-interactive-card mt-3">
          <div class="gk-card-header">
            <h4>🧤 Damien Goalkeepers Live Scoring</h4>
          </div>
          <table class="interactive-damien-sheet-table gk-table">
            <thead>
              <tr>
                <th>Cap</th>
                <th>Goalkeeper Name</th>
                <th>GOAL AG (-3)</th>
                <th>SAVES (+3)</th>
                <th>5M SAVE (+2)</th>
                <th>1ON1 SAVE (+2)</th>
                <th>STEAL (+2)</th>
                <th>SAVE %</th>
              </tr>
            </thead>
            <tbody>
              ${goalies.map(g => {
                const gStat = stats.home.goalies[g.cap] || { saves: 0, goalsAllowed: 0, savePct: 0 };
                return `
                  <tr>
                    <td class="cell-cap"><strong>#${g.cap}</strong></td>
                    <td class="cell-player-name"><strong>${g.name}</strong></td>
                    <td class="cell-tap" data-action="gk_goal_ag" data-cap="${g.cap}" title="+1 Goal Allowed">
                      <button class="sheet-tap-btn bad">${gStat.goalsAllowed || 0}</button>
                    </td>
                    <td class="cell-tap" data-action="gk_save" data-cap="${g.cap}" title="+1 Goalie Save">
                      <button class="sheet-tap-btn good"><strong>${gStat.saves || 0}</strong></button>
                    </td>
                    <td class="cell-tap" data-action="gk_5m_save" data-cap="${g.cap}" title="+1 5M Penalty Save">
                      <button class="sheet-tap-btn good">-</button>
                    </td>
                    <td class="cell-tap" data-action="gk_1on1_save" data-cap="${g.cap}" title="+1 1-on-1 Save">
                      <button class="sheet-tap-btn good">-</button>
                    </td>
                    <td class="cell-tap" data-action="steal" data-cap="${g.cap}" title="+1 Goalie Steal">
                      <button class="sheet-tap-btn good">-</button>
                    </td>
                    <td class="cell-pm"><strong>${gStat.savePct}%</strong></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    this.bindTapEvents();
  }

  bindTapEvents() {
    // Clock controls in form
    const toggleClock = this.container.querySelector('#btn-sheet-toggle-clock');
    const reset30 = this.container.querySelector('#btn-sheet-reset-30');
    const reset20 = this.container.querySelector('#btn-sheet-reset-20');

    if (toggleClock) toggleClock.onclick = () => state.toggleClock();
    if (reset30) reset30.onclick = () => state.resetShotClock(30);
    if (reset20) reset20.onclick = () => state.resetShotClock(20);

    // Matrix Cell Tap Handlers
    const tapCells = this.container.querySelectorAll('.cell-tap');
    tapCells.forEach(cell => {
      cell.onclick = (e) => {
        e.stopPropagation();
        const action = cell.dataset.action;
        const cap = parseInt(cell.dataset.cap);
        this.handleSheetAction(action, cap);
      };
    });

    // Opponent Exclusion Checkbox buttons
    const oppExcBtns = this.container.querySelectorAll('.opp-exc-btn');
    oppExcBtns.forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        btn.classList.toggle('active');
        state.logEvent({
          team: 'away',
          type: 'exclusion',
          cap: 4,
          desc: `Exclusion Foul on Opponent (20s Ejection)`,
          isGoal: false
        });
        sound.playWhistle();
      };
    });
  }

  handleSheetAction(action, cap) {
    sound.playClick();
    const home = state.match.homeTeam;
    const player = (home.roster || []).find(p => p.cap === cap);
    const pName = player ? player.name : `Cap #${cap}`;

    switch (action) {
      case 'goal_5m':
        state.logEvent({
          team: 'home',
          type: 'goal',
          cap,
          shotType: 'penalty',
          desc: `GOAL! Damien #${cap} ${pName} (5M Penalty)`,
          isGoal: true
        });
        break;

      case 'goal_6on5':
        state.logEvent({
          team: 'home',
          type: 'goal',
          cap,
          shotType: '6on5',
          desc: `GOAL! Damien #${cap} ${pName} (6-on-5 Man Up)`,
          isGoal: true
        });
        break;

      case 'goal_2m':
        state.logEvent({
          team: 'home',
          type: 'goal',
          cap,
          shotType: 'center',
          desc: `GOAL! Damien #${cap} ${pName} (2M Center Hole Set)`,
          isGoal: true
        });
        break;

      case 'goal_action':
        state.logEvent({
          team: 'home',
          type: 'goal',
          cap,
          shotType: 'action',
          desc: `GOAL! Damien #${cap} ${pName} (Action Shot)`,
          isGoal: true
        });
        break;

      case 'miss_offcage':
        state.logEvent({
          team: 'home',
          type: 'miss',
          cap,
          targetZone: 'wide',
          desc: `Miss Off Cage by Damien #${cap} ${pName}`,
          isGoal: false
        });
        state.resetShotClock(20);
        break;

      case 'miss_reg':
        state.logEvent({
          team: 'home',
          type: 'miss',
          cap,
          targetZone: 'top_left',
          desc: `Missed Shot by Damien #${cap} ${pName}`,
          isGoal: false
        });
        state.resetShotClock(20);
        break;

      case 'turnover':
      case 'bad_pass':
        state.logEvent({
          team: 'home',
          type: 'turnover',
          cap,
          desc: `Turnover by Damien #${cap} ${pName}`,
          isGoal: false
        });
        break;

      case 'steal':
        state.logEvent({
          team: 'home',
          type: 'steal',
          cap,
          desc: `Steal by Damien #${cap} ${pName}`,
          isGoal: false
        });
        break;

      case 'to_forced':
        state.logEvent({
          team: 'home',
          type: 'steal',
          cap,
          desc: `Turnover Forced by Damien #${cap} ${pName}`,
          isGoal: false
        });
        break;

      case 'excl_reg':
      case 'excl_5m':
        state.logEvent({
          team: 'home',
          type: 'exclusion',
          cap,
          desc: `20s Exclusion Foul on Damien #${cap} ${pName}`,
          isGoal: false
        });
        break;

      case 'field_block':
        state.logEvent({
          team: 'home',
          type: 'block',
          cap,
          desc: `Field Block by Damien #${cap} ${pName}`,
          isGoal: false
        });
        break;

      case 'one_on_one':
        state.logEvent({
          team: 'home',
          type: 'block',
          cap,
          desc: `1-on-1 Defensive Stop by Damien #${cap} ${pName}`,
          isGoal: false
        });
        break;

      case 'gk_save':
        state.logEvent({
          team: 'away',
          type: 'save',
          cap: 2,
          goalieCap: cap,
          desc: `Save by Damien GK #${cap} ${pName}`,
          isGoal: false
        });
        state.resetShotClock(20);
        break;

      case 'gk_goal_ag':
        state.logEvent({
          team: 'away',
          type: 'goal',
          cap: 2,
          desc: `Goal Allowed by Damien GK #${cap} ${pName}`,
          isGoal: true
        });
        break;
    }
  }
}
