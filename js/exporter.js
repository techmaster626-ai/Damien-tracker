/**
 * Exporter Engine for Water Polo Stats Tracker
 * Features:
 * - 1-Click MaxPreps Formatted Report
 * - Official FINA/NCAA Printable Score Sheet / PDF
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
    text += `Date: ${state.match.date} | Tournament: ${state.match.tournament}\n`;
    text += `====================================================\n\n`;

    text += `QUARTER SCORES:\n`;
    text += `Team\tQ1\tQ2\tQ3\tQ4\tOT\tFinal\n`;
    text += `${home.name}\t${stats.home.quarters[0]}\t${stats.home.quarters[1]}\t${stats.home.quarters[2]}\t${stats.home.quarters[3]}\t${stats.home.quarters[4] || 0}\t${home.score}\n`;
    text += `${away.name}\t${stats.away.quarters[0]}\t${stats.away.quarters[1]}\t${stats.away.quarters[2]}\t${stats.away.quarters[3]}\t${stats.away.quarters[4] || 0}\t${away.score}\n\n`;

    text += `----------------------------------------------------\n`;
    text += `${home.name.toUpperCase()} INDIVIDUAL PLAYER STATS:\n`;
    text += `Cap\tPlayer\t\tGoals\tShots\tAssists\tSteals\tBlocks\tExclusions\tPenalties\n`;
    Object.values(stats.home.players).forEach(p => {
      text += `#${p.cap}\t${p.name.padEnd(16)}\t${p.goals}\t${p.shots}\t${p.assists}\t${p.steals}\t${p.blocks}\t${p.exclusionsCommitted}\t\t${p.penaltyCommitted}\n`;
    });

    text += `\n${home.name.toUpperCase()} GOALKEEPING:\n`;
    text += `Cap\tGoalkeeper\t\tSaves\tGoals Allowed\tSave %\n`;
    Object.values(stats.home.goalies).forEach(g => {
      text += `#${g.cap}\t${g.name.padEnd(16)}\t${g.saves}\t${g.goalsAllowed}\t\t${g.savePct}%\n`;
    });

    text += `\n----------------------------------------------------\n`;
    text += `${away.name.toUpperCase()} INDIVIDUAL PLAYER STATS:\n`;
    text += `Cap\tPlayer\t\tGoals\tShots\tAssists\tSteals\tBlocks\tExclusions\tPenalties\n`;
    Object.values(stats.away.players).forEach(p => {
      text += `#${p.cap}\t${p.name.padEnd(16)}\t${p.goals}\t${p.shots}\t${p.assists}\t${p.steals}\t${p.blocks}\t${p.exclusionsCommitted}\t\t${p.penaltyCommitted}\n`;
    });

    text += `\n${away.name.toUpperCase()} GOALKEEPING:\n`;
    text += `Cap\tGoalkeeper\t\tSaves\tGoals Allowed\tSave %\n`;
    Object.values(stats.away.goalies).forEach(g => {
      text += `#${g.cap}\t${g.name.padEnd(16)}\t${g.saves}\t${g.goalsAllowed}\t\t${g.savePct}%\n`;
    });

    text += `\n====================================================\n`;
    text += `ADVANCED METRICS:\n`;
    text += `${home.name} 6-on-5 Extra Player: ${stats.home.manUpGoals}/${stats.home.manUpAttempts} (${stats.home.manUpPct}%)\n`;
    text += `${away.name} 6-on-5 Extra Player: ${stats.away.manUpGoals}/${stats.away.manUpAttempts} (${stats.away.manUpPct}%)\n`;

    return text;
  }

  // 2. CSV Exporters
  exportPlayByPlayCSV() {
    if (!state.match) return;
    const events = state.match.events || [];
    let csv = 'Quarter,Clock,Team,Cap,Player,Event_Type,Description,Shot_Type,Target_Zone,Home_Score,Away_Score\n';

    events.forEach(ev => {
      const isHome = ev.team === 'home';
      const teamName = isHome ? state.match.homeTeam.name : state.match.awayTeam.name;
      csv += `"${ev.q}","${ev.timeStr}","${teamName}","${ev.cap || ''}","","${ev.type}","${(ev.desc || '').replace(/"/g, '""')}","${ev.shotType || ''}","${ev.targetZone || ''}","${ev.homeScore || 0}","${ev.awayScore || 0}"\n`;
    });

    this.downloadFile(csv, `waterpolo_pbp_${Date.now()}.csv`, 'text/csv');
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

    this.downloadFile(csv, `waterpolo_boxscore_${Date.now()}.csv`, 'text/csv');
  }

  // 3. JSON Export and Import
  exportMatchJSON() {
    if (!state.match) return;
    const jsonStr = JSON.stringify(state.match, null, 2);
    this.downloadFile(jsonStr, `waterpolo_match_${state.match.id || Date.now()}.json`, 'application/json');
  }

  importMatchJSON(file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const matchData = JSON.parse(e.target.result);
        state.loadCustomMatch(matchData);
        if (callback) callback(true);
      } catch (err) {
        alert('Invalid Match JSON file: ' + err.message);
        if (callback) callback(false);
      }
    };
    reader.readAsText(file);
  }

  // 4. Social Media Graphic Share Card (Canvas Generator)
  generateShareGraphicCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext('2d');
    const stats = state.calculateStats();
    const home = state.match.homeTeam;
    const away = state.match.awayTeam;

    // Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 1200, 630);
    bgGrad.addColorStop(0, '#061325');
    bgGrad.addColorStop(0.5, '#0b2440');
    bgGrad.addColorStop(1, '#05101f');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1200, 630);

    // Subtle water waves pattern
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.08)';
    ctx.lineWidth = 2;
    for (let y = 50; y < 630; y += 40) {
      ctx.beginPath();
      for (let x = 0; x < 1200; x += 30) {
        ctx.arc(x + 15, y, 15, 0, Math.PI);
      }
      ctx.stroke();
    }

    // Header Tournament Banner
    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText((state.match.tournament || 'WATER POLO CHAMPIONSHIP').toUpperCase(), 600, 50);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText(`${state.match.location || 'Aquatic Complex'} • FINAL SCORE`, 600, 80);

    // Scoreboard Central Box
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.3)';
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
    ctx.fillStyle = '#00e5ff';
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
    ctx.fillStyle = '#ffb300';
    ctx.fillText(away.score.toString(), 850, 270);

    // Quarter Box Scores Strip
    ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
    ctx.beginPath();
    ctx.roundRect(150, 355, 900, 80, 12);
    ctx.fill();

    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.textAlign = 'left';
    ctx.fillText('PERIODS', 180, 400);

    const qWidth = 120;
    ['Q1', 'Q2', 'Q3', 'Q4', 'OT'].forEach((qName, i) => {
      const qX = 340 + i * qWidth;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#64748b';
      ctx.fillText(qName, qX, 385);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${stats.home.quarters[i] || 0} - ${stats.away.quarters[i] || 0}`, qX, 415);
    });

    // Match Key Metrics (Bottom Grid)
    const renderMetricBox = (x, title, val1, val2) => {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.roundRect(x, 460, 280, 120, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(title, x + 140, 490);

      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.fillStyle = '#00e5ff';
      ctx.fillText(val1, x + 70, 540);

      ctx.fillStyle = '#64748b';
      ctx.font = '16px system-ui, sans-serif';
      ctx.fillText('vs', x + 140, 540);

      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.fillStyle = '#ffb300';
      ctx.fillText(val2, x + 210, 540);
    };

    renderMetricBox(150, '6-on-5 Extra Player', `${stats.home.manUpPct}%`, `${stats.away.manUpPct}%`);
    renderMetricBox(460, 'Shooting Accuracy', `${stats.home.shootingPct}%`, `${stats.away.shootingPct}%`);
    renderMetricBox(770, 'Goalie Saves', `${stats.home.goalies[1]?.saves || 0}`, `${stats.away.goalies[1]?.saves || 0}`);

    // Footer Branding
    ctx.fillStyle = '#64748b';
    ctx.font = '14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚡ Water Polo Stats Tracker • Official Game Report', 600, 610);

    return canvas;
  }

  downloadShareGraphic() {
    const canvas = this.generateShareGraphicCanvas();
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `waterpolo_final_${Date.now()}.png`;
    a.click();
  }

  // Print Official Score Sheet
  printScoreSheet() {
    window.print();
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
