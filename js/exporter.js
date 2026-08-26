/**
 * Exporter Engine for Damien High School Varsity Water Polo
 * Features:
 * - Official Damien Varsity WaterPolo Stats Sheet (High-Resolution Printable PDF Layout)
 * - 1-Click MaxPreps Formatted Report
 * - CSV Play-by-Play & Box Score File Export
 * - JSON Match Backup & Restore
 * - Social Media Graphic Match Summary Card (Canvas Rendered)
 */

import { state } from './state.js';

export class ExporterEngine {
  constructor() {}

  // 1. MaxPreps Water Polo Formatter
  generateMaxPrepsReport() {
    if (!state.match) return '';
    const stats = state.calculateStats();
    const home = state.match.homeTeam;
    const away = state.match.awayTeam;

    let text = `====================================================\n`;
    text += `MAXPREPS WATER POLO OFFICIAL GAME STATS REPORT\n`;
    text += `Match: ${home.name} (${home.score}) vs ${away.name} (${away.score})\n`;
    text += `Date: ${state.match.date} | Location: ${state.match.location || 'Damien Aquatic Complex'}\n`;
    text += `====================================================\n\n`;

    text += `QUARTER SCORES:\n`;
    text += `Team\tQ1\tQ2\tQ3\tQ4\tOT\tFinal\n`;
    text += `${home.name}\t${stats.home.quarters[0]}\t${stats.home.quarters[1]}\t${stats.home.quarters[2]}\t${stats.home.quarters[3]}\t${stats.home.quarters[4] || 0}\t${home.score}\n`;
    text += `${away.name}\t${stats.away.quarters[0]}\t${stats.away.quarters[1]}\t${stats.away.quarters[2]}\t${stats.away.quarters[3]}\t${stats.away.quarters[4] || 0}\t${away.score}\n\n`;

    text += `----------------------------------------------------\n`;
    text += `${home.name.toUpperCase()} INDIVIDUAL PLAYER STATS:\n`;
    text += `Cap\tPlayer\t\tGoals\tShots\tAssists\tSteals\tBlocks\tExclusions\tPenalties\n`;
    Object.values(stats.home.players).forEach(p => {
      text += `#${p.cap}\t${p.name.padEnd(18)}\t${p.goals}\t${p.shots}\t${p.assists}\t${p.steals}\t${p.blocks}\t${p.exclusionsCommitted}\t\t${p.penaltyCommitted}\n`;
    });

    text += `\n${home.name.toUpperCase()} GOALKEEPING:\n`;
    text += `Cap\tGoalkeeper\t\tSaves\tGoals Allowed\tSave %\n`;
    Object.values(stats.home.goalies).forEach(g => {
      text += `#${g.cap}\t${g.name.padEnd(18)}\t${g.saves}\t${g.goalsAllowed}\t\t${g.savePct}%\n`;
    });

    text += `\n----------------------------------------------------\n`;
    text += `${away.name.toUpperCase()} INDIVIDUAL PLAYER STATS:\n`;
    text += `Cap\tPlayer\t\tGoals\tShots\tAssists\tSteals\tBlocks\tExclusions\tPenalties\n`;
    Object.values(stats.away.players).forEach(p => {
      text += `#${p.cap}\t${p.name.padEnd(18)}\t${p.goals}\t${p.shots}\t${p.assists}\t${p.steals}\t${p.blocks}\t${p.exclusionsCommitted}\t\t${p.penaltyCommitted}\n`;
    });

    return text;
  }

  // 2. Official Damien Varsity WaterPolo Printable Score Sheet (Exact Google Sheet Layout)
  generateDamienOfficialScoreSheetHTML() {
    if (!state.match) return '';
    const stats = state.calculateStats();
    const home = state.match.homeTeam;
    const away = state.match.awayTeam;
    const events = state.match.events || [];

    // Filter Damien players
    const damienPlayers = home.roster || [];
    const fieldPlayers = damienPlayers.filter(p => !p.isGk);
    const goalies = damienPlayers.filter(p => p.isGk);

    // Calculate detailed offensive & defensive actions per player
    const playerDetails = {};
    damienPlayers.forEach(p => {
      playerDetails[p.cap] = {
        goals5m: 0,
        goals6on5: 0,
        goals2m: 0,
        goalsAction: 0,
        goalsCounter: 0,
        goalsLob: 0,
        missOffCage: 0,
        missReg: 0,
        turnovers: 0,
        steals: 0,
        toForced: 0,
        excl5m: 0,
        exclReg: 0,
        fieldBlocks: 0,
        scoredOn: 0,
        missFb: 0,
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
          else if (e.shotType === 'counter') pd.goalsCounter++;
          else if (e.shotType === 'lob') pd.goalsLob++;
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

    // Calculate +/- weights based on Damien Sheet:
    // Plus: Goals5M(+3), Goals6on5(+3), Goals2M(+2), GoalsAction(+2), Steals(+2), TO Forced(+3), FB(+2), 1on1(+1)
    // Minus: MissOffCage(-2), MissReg(-1), Turnovers(-3), Excl5M(-3), ExclReg(-2), ScoredOn(-2), MissFB(-3)
    let totals = {
      missOffCage: 0, missReg: 0, goals5m: 0, goals6on5: 0, goals2m: 0, goalsAction: 0,
      turnovers: 0, steals: 0, toForced: 0, excl5m: 0, exclReg: 0, fieldBlocks: 0,
      scoredOn: 0, missFb: 0, oneOnOne: 0, plusTotal: 0, minusTotal: 0, netTotal: 0
    };

    damienPlayers.forEach(p => {
      const pd = playerDetails[p.cap];
      const pStats = stats.home.players[p.cap] || { goals: 0, steals: 0, blocks: 0, exclusionsCommitted: 0, turnovers: 0 };
      
      const plus = (pd.goals5m * 3) + (pd.goals6on5 * 3) + (pd.goals2m * 2) + (pd.goalsAction * 2) + 
                   (pStats.steals * 2) + (pStats.blocks * 2) + (pd.oneOnOne * 1);
      const minus = (pd.missOffCage * 2) + (pd.missReg * 1) + (pStats.turnovers * 3) + 
                    (pStats.exclusionsCommitted * 2) + (pd.scoredOn * 2) + (pd.missFb * 3);

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
      totals.fieldBlocks += pStats.blocks;
      totals.exclReg += pStats.exclusionsCommitted;
      totals.plusTotal += plus;
      totals.minusTotal += minus;
      totals.netTotal += (plus - minus);
    });

    return `
      <div class="damien-sheet-document">
        <!-- Sheet Header -->
        <div class="ds-header-grid">
          <div class="ds-title-area">
            <div style="display: flex; align-items: center; gap: 8px;">
              <img src="assets/damien-logo.png" alt="Damien Spartans" style="height: 28px; width: auto; object-fit: contain;">
              <h2 class="ds-main-title" style="margin: 0;">Stats Sheet - Damien Varsity WaterPolo</h2>
            </div>
            <div class="ds-meta-row" style="margin-top: 4px;">
              <span><strong>Date:</strong> ${state.match.date || '____________'}</span>
              <span><strong>Location:</strong> ${state.match.location || 'Damien Aquatic Complex'}</span>
              <span><strong>Official 1:</strong> ____________</span>
              <span><strong>Official 2:</strong> ____________</span>
            </div>
          </div>

          <!-- Top Subtables -->
          <div class="ds-subtables-row">
            <!-- Timeouts -->
            <table class="ds-subtable">
              <thead>
                <tr>
                  <th>Timeouts</th>
                  <th>Full</th>
                  <th>Full</th>
                  <th>Full</th>
                  <th>:30</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>DM</strong></td>
                  <td>${home.timeoutsRemaining < 3 ? '✓' : ''}</td>
                  <td>${home.timeoutsRemaining < 2 ? '✓' : ''}</td>
                  <td>${home.timeoutsRemaining < 1 ? '✓' : ''}</td>
                  <td></td>
                </tr>
                <tr>
                  <td><strong>OPP</strong></td>
                  <td>${away.timeoutsRemaining < 3 ? '✓' : ''}</td>
                  <td>${away.timeoutsRemaining < 2 ? '✓' : ''}</td>
                  <td>${away.timeoutsRemaining < 1 ? '✓' : ''}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>

            <!-- Quarter Scores -->
            <table class="ds-subtable">
              <thead>
                <tr>
                  <th>Quarter Score</th>
                  <th>1ST</th>
                  <th>2ND</th>
                  <th>3RD</th>
                  <th>4TH</th>
                  <th>OT</th>
                  <th>FINAL</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Damien</strong></td>
                  <td>${stats.home.quarters[0] || 0}</td>
                  <td>${stats.home.quarters[1] || 0}</td>
                  <td>${stats.home.quarters[2] || 0}</td>
                  <td>${stats.home.quarters[3] || 0}</td>
                  <td>${stats.home.quarters[4] || 0}</td>
                  <td><strong>${home.score}</strong></td>
                </tr>
                <tr>
                  <td><strong>OPP</strong></td>
                  <td>${stats.away.quarters[0] || 0}</td>
                  <td>${stats.away.quarters[1] || 0}</td>
                  <td>${stats.away.quarters[2] || 0}</td>
                  <td>${stats.away.quarters[3] || 0}</td>
                  <td>${stats.away.quarters[4] || 0}</td>
                  <td><strong>${away.score}</strong></td>
                </tr>
              </tbody>
            </table>

            <!-- Situational Extra Player Conversion -->
            <table class="ds-subtable">
              <thead>
                <tr>
                  <th colspan="2">EXCLUSIONS (6on5)</th>
                  <th colspan="2">PENALTY (5M)</th>
                </tr>
                <tr>
                  <th>MADE</th>
                  <th>MISS</th>
                  <th>MADE</th>
                  <th>MISS</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${stats.home.manUpGoals || 0}</td>
                  <td>${Math.max(0, (stats.home.manUpAttempts || 0) - (stats.home.manUpGoals || 0))}</td>
                  <td>${stats.home.penaltyGoals || 0}</td>
                  <td>${Math.max(0, (stats.home.penaltyAttempts || 0) - (stats.home.penaltyGoals || 0))}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Main Player Stats Table -->
        <div class="ds-table-wrapper">
          <table class="ds-main-table">
            <thead>
              <tr class="header-tier-1">
                <th rowspan="3" class="col-cap">#</th>
                <th rowspan="3" class="col-name">Name</th>
                <th colspan="8" class="hdr-offense">OFFENSE</th>
                <th colspan="6" class="hdr-defense">DEFENSE</th>
                <th colspan="3" class="hdr-pm">TOTAL +/-</th>
                <th rowspan="3" class="col-opp-exc">OPP Exclusions<br>(1 - 25)</th>
              </tr>
              <tr class="header-tier-2">
                <th colspan="2">MISS</th>
                <th colspan="4">GOALS / SHOTS</th>
                <th colspan="2">TURNOVER</th>
                <th colspan="2">STEALS</th>
                <th colspan="2">EXCLUSIONS</th>
                <th rowspan="2">FB<br>(+2)</th>
                <th rowspan="2">1ON1<br>(+1)</th>
                <th rowspan="2">PLUS<br>(+)</th>
                <th rowspan="2">MINUS<br>(-)</th>
                <th rowspan="2">TOTAL<br>(+/-)</th>
              </tr>
              <tr class="header-tier-3">
                <th>OFF CAGE<br>(-2)</th>
                <th>MISS<br>(-1)</th>
                <th>5M<br>(+3)</th>
                <th>6on5<br>(+3)</th>
                <th>2M<br>(+2)</th>
                <th>ACT<br>(+2)</th>
                <th>TO<br>(-3)</th>
                <th>BAD PASS<br>(-2)</th>
                <th>STEAL<br>(+2)</th>
                <th>TO FORCED<br>(+3)</th>
                <th>5M<br>(-3)</th>
                <th>REG<br>(-2)</th>
              </tr>
            </thead>
            <tbody>
              ${fieldPlayers.map(p => {
                const pd = playerDetails[p.cap];
                const pStat = stats.home.players[p.cap] || { goals: 0, steals: 0, blocks: 0, exclusionsCommitted: 0, turnovers: 0 };
                return `
                  <tr>
                    <td class="cell-center"><strong>${p.cap}</strong></td>
                    <td class="cell-name">${p.name}</td>
                    <td class="cell-center">${pd.missOffCage || ''}</td>
                    <td class="cell-center">${pd.missReg || ''}</td>
                    <td class="cell-center">${pd.goals5m || ''}</td>
                    <td class="cell-center">${pd.goals6on5 || ''}</td>
                    <td class="cell-center">${pd.goals2m || ''}</td>
                    <td class="cell-center">${pd.goalsAction || ''}</td>
                    <td class="cell-center">${pStat.turnovers || ''}</td>
                    <td class="cell-center"></td>
                    <td class="cell-center">${pStat.steals || ''}</td>
                    <td class="cell-center">${pd.toForced || ''}</td>
                    <td class="cell-center"></td>
                    <td class="cell-center">${pStat.exclusionsCommitted || ''}</td>
                    <td class="cell-center">${pStat.blocks || ''}</td>
                    <td class="cell-center">${pd.oneOnOne || ''}</td>
                    <td class="cell-center plus-val"><strong>${pd.plusTotal || '0'}</strong></td>
                    <td class="cell-center minus-val"><strong>${pd.minusTotal || '0'}</strong></td>
                    <td class="cell-center net-val ${pd.netTotal >= 0 ? 'pos' : 'neg'}"><strong>${pd.netTotal >= 0 ? '+' + pd.netTotal : pd.netTotal}</strong></td>
                    <td class="cell-opp-grid">
                      <div class="opp-exc-dots">
                        ${[...Array(20)].map((_, i) => `<span class="exc-box-num">${i + 1}</span>`).join('')}
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
              <!-- Totals Row -->
              <tr class="ds-totals-row">
                <td></td>
                <td><strong>TOTALS</strong></td>
                <td class="cell-center">${totals.missOffCage}</td>
                <td class="cell-center">${totals.missReg}</td>
                <td class="cell-center">${totals.goals5m}</td>
                <td class="cell-center">${totals.goals6on5}</td>
                <td class="cell-center">${totals.goals2m}</td>
                <td class="cell-center">${totals.goalsAction}</td>
                <td class="cell-center">${totals.turnovers}</td>
                <td class="cell-center">0</td>
                <td class="cell-center">${totals.steals}</td>
                <td class="cell-center">${totals.toForced}</td>
                <td class="cell-center">0</td>
                <td class="cell-center">${totals.exclReg}</td>
                <td class="cell-center">${totals.fieldBlocks}</td>
                <td class="cell-center">${totals.oneOnOne}</td>
                <td class="cell-center plus-val"><strong>+${totals.plusTotal}</strong></td>
                <td class="cell-center minus-val"><strong>-${totals.minusTotal}</strong></td>
                <td class="cell-center net-val ${totals.netTotal >= 0 ? 'pos' : 'neg'}"><strong>${totals.netTotal >= 0 ? '+' + totals.netTotal : totals.netTotal}</strong></td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Goalkeeping Section -->
        <div class="ds-gk-wrapper mt-3">
          <table class="ds-gk-table">
            <thead>
              <tr>
                <th class="col-cap">#</th>
                <th class="col-name">Goalkeeper</th>
                <th>GOAL AG (-3)</th>
                <th>SAVES (+3)</th>
                <th>5M SAVE (+2)</th>
                <th>1ON1 SAVE (+2)</th>
                <th>STEALS (+2)</th>
                <th>ASSISTS (+1)</th>
                <th>SAVE %</th>
              </tr>
            </thead>
            <tbody>
              ${goalies.map(g => {
                const gStat = stats.home.goalies[g.cap] || { saves: 0, goalsAllowed: 0, savePct: 0 };
                return `
                  <tr>
                    <td class="cell-center"><strong>${g.cap}</strong></td>
                    <td class="cell-name">${g.name}</td>
                    <td class="cell-center">${gStat.goalsAllowed || 0}</td>
                    <td class="cell-center"><strong>${gStat.saves || 0}</strong></td>
                    <td class="cell-center">0</td>
                    <td class="cell-center">0</td>
                    <td class="cell-center">0</td>
                    <td class="cell-center">0</td>
                    <td class="cell-center"><strong>${gStat.savePct}%</strong></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <!-- Signature Verification Block -->
        <div class="ds-signature-block">
          <div class="sig-line"><span>Head Coach Signature:</span> ___________________________</div>
          <div class="sig-line"><span>Referee Signature:</span> ___________________________</div>
          <div class="sig-line"><span>Table Official / Scorekeeper:</span> ___________________________</div>
        </div>
      </div>
    `;
  }

  // 3. Trigger Print of Official Damien Sheet
  printScoreSheet() {
    let printMount = document.getElementById('damien-print-mount');
    if (!printMount) {
      printMount = document.createElement('div');
      printMount.id = 'damien-print-mount';
      printMount.className = 'damien-print-container';
      document.body.appendChild(printMount);
    }

    printMount.innerHTML = this.generateDamienOfficialScoreSheetHTML();
    window.print();
  }

  // 4. CSV Exporters
  exportPlayByPlayCSV() {
    if (!state.match) return;
    const events = state.match.events || [];
    let csv = 'Quarter,Clock,Team,Cap,Player,Event_Type,Description,Shot_Type,Target_Zone,Home_Score,Away_Score\n';

    events.forEach(ev => {
      const isHome = ev.team === 'home';
      const teamName = isHome ? state.match.homeTeam.name : state.match.awayTeam.name;
      csv += `"${ev.q}","${ev.timeStr}","${teamName}","${ev.cap || ''}","","${ev.type}","${(ev.desc || '').replace(/"/g, '""')}","${ev.shotType || ''}","${ev.targetZone || ''}","${ev.homeScore || 0}","${ev.awayScore || 0}"\n`;
    });

    this.downloadFile(csv, `damien_waterpolo_pbp_${Date.now()}.csv`, 'text/csv');
  }

  exportBoxScoreCSV() {
    if (!state.match) return;
    const stats = state.calculateStats();
    let csv = 'Team,Cap,Player_Name,Position,Goals,Shots,Shot_Pct,Assists,Points,Steals,Blocks,Exclusions_Committed,Exclusions_Drawn,Penalty_Fouls,Turnovers,Sprints_Won\n';

    const addRows = (players, teamName) => {
      Object.values(players).forEach(p => {
        csv += `"${teamName}","${p.cap}","${p.name}","${p.pos || ''}","${p.goals}","${p.shots}","${p.shotAccuracy}%","${p.assists}","${p.points}","${p.steals}","${p.blocks}","${p.exclusionsCommitted}","${p.exclusionsDrawn}","${p.penaltyCommitted}","${p.turnovers}","${p.sprintsWon}"\n`;
      });
    };

    addRows(stats.home.players, state.match.homeTeam.name);
    addRows(stats.away.players, state.match.awayTeam.name);

    this.downloadFile(csv, `damien_waterpolo_boxscore_${Date.now()}.csv`, 'text/csv');
  }

  // 5. Social Media Graphic Share Card
  generateShareGraphicCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext('2d');
    const stats = state.calculateStats();
    const home = state.match.homeTeam;
    const away = state.match.awayTeam;

    // Background Gradient (Damien Green to Dark Emerald)
    const bgGrad = ctx.createLinearGradient(0, 0, 1200, 630);
    bgGrad.addColorStop(0, '#051610');
    bgGrad.addColorStop(0.5, '#0e3d2f');
    bgGrad.addColorStop(1, '#051610');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1200, 630);

    // Header Tournament Banner
    ctx.fillStyle = '#ffb81c';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('DAMIEN SPARTANS WATER POLO • CIF-SS', 600, 50);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText(`${state.match.location || 'Damien Aquatic Complex'} • FINAL SCORE`, 600, 80);

    // Scoreboard Central Box
    ctx.fillStyle = 'rgba(7, 28, 20, 0.9)';
    ctx.strokeStyle = '#ffb81c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(150, 110, 900, 220, 16);
    ctx.fill();
    ctx.stroke();

    // Home Team Score (Left)
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px system-ui, sans-serif';
    ctx.fillText(home.name, 350, 175);

    ctx.font = 'bold 84px system-ui, sans-serif';
    ctx.fillStyle = '#ffb81c';
    ctx.fillText(home.score.toString(), 350, 270);

    // VS Divider
    ctx.font = 'bold 28px system-ui, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('VS', 600, 225);

    // Away Team Score (Right)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px system-ui, sans-serif';
    ctx.fillText(away.name, 850, 175);

    ctx.font = 'bold 84px system-ui, sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(away.score.toString(), 850, 270);

    // Quarter Box Scores Strip
    ctx.fillStyle = 'rgba(14, 61, 47, 0.9)';
    ctx.beginPath();
    ctx.roundRect(150, 355, 900, 80, 12);
    ctx.fill();

    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillStyle = '#ffb81c';
    ctx.textAlign = 'left';
    ctx.fillText('PERIODS', 180, 400);

    const qWidth = 120;
    ['Q1', 'Q2', 'Q3', 'Q4', 'OT'].forEach((qName, i) => {
      const qX = 340 + i * qWidth;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(qName, qX, 385);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${stats.home.quarters[i] || 0} - ${stats.away.quarters[i] || 0}`, qX, 415);
    });

    return canvas;
  }

  downloadShareGraphic() {
    const canvas = this.generateShareGraphicCanvas();
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `damien_waterpolo_final_${Date.now()}.png`;
    a.click();
  }

  downloadFile(content, fileName, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const exporter = new ExporterEngine();
