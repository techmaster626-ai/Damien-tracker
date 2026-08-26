/**
 * Roster and Full Match Importer Engine for Damien High School Water Polo
 * Handles:
 * - Direct Google Sheets CSV integration (Single & Multiple Game Tabs)
 * - Dynamic column detection across ANY Google Sheet layout (Offense, Defense, Goalkeeping)
 * - Flexible cell tally parsing (integers, tallies: I, II, III, ///, X, ✓, 1,1)
 * - Direct Copy-Paste TSV/CSV from Google Sheets (bypasses CORS & private link restrictions)
 * - Direct .CSV File Upload (from Google Sheets > File > Download > CSV)
 * - Saved Offline Match Archive (Local & Firestore synced)
 */

import { state } from './state.js';
import { DAMIEN_VARSITY_ROSTER } from './presets.js';

export class ImporterEngine {
  constructor() {
    this.defaultGoogleSheetUrl = 'https://docs.google.com/spreadsheets/d/1TFs_XI1Zpe2S5x8X_VXk0SlU1ZXXIMTsWMzhej8PYe4/edit?gid=0#gid=0';
    this.archivedMatches = this.loadArchivedMatches();
  }

  loadArchivedMatches() {
    try {
      const saved = localStorage.getItem('wps_archived_matches');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }

  saveArchivedMatches() {
    localStorage.setItem('wps_archived_matches', JSON.stringify(this.archivedMatches));
  }

  // 1. Build Proper Google Sheet CSV Export URL
  buildGoogleSheetCsvUrl(urlOrId, gid = '0') {
    let input = (urlOrId || this.defaultGoogleSheetUrl).trim();
    if (!input) input = this.defaultGoogleSheetUrl;

    // Check if GID is in URL (#gid=123 or ?gid=123)
    const gidMatch = input.match(/gid=([0-9]+)/i);
    const actualGid = gidMatch ? gidMatch[1] : (gid || '0');

    // Handle "Published to Web" links: /pub?output=csv or /pubhtml
    if (input.includes('/pub') || input.includes('/pubhtml')) {
      return input.replace(/\/pubhtml.*$/, '/pub?output=csv&gid=' + actualGid);
    }

    // Handle Standard Google Docs URLs: /d/SPREADSHEET_ID/...
    const match = input.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      const sheetId = match[1];
      return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${actualGid}`;
    }

    // If plain Spreadsheet ID provided
    if (!input.startsWith('http')) {
      return `https://docs.google.com/spreadsheets/d/${input}/gviz/tq?tqx=out:csv&gid=${actualGid}`;
    }

    return input;
  }

  // 2. Fetch Full Game & Stats from Google Sheet URL
  async fetchFullGameFromGoogleSheet(urlOrId, gid = '0', opponentName = 'Opponent') {
    const csvUrl = this.buildGoogleSheetCsvUrl(urlOrId, gid);

    try {
      const response = await fetch(csvUrl);
      if (!response.ok) {
        throw new Error(`Google Sheets responded with HTTP status ${response.status}. Please make sure the sheet is shared as "Anyone with the link can view".`);
      }
      const csvText = await response.text();
      return this.parseFullGameCSV(csvText, opponentName);
    } catch (err) {
      throw new Error(`Google Sheet import error: ${err.message}\n\nTIP: If the sheet is private, you can simply copy and paste your spreadsheet cells into the "📋 Paste Table" tab or upload the downloaded .csv file!`);
    }
  }

  // 3. Fetch Roster Only from Google Sheet
  async fetchFromGoogleSheetUrl(urlOrId, gid = '0') {
    const csvUrl = this.buildGoogleSheetCsvUrl(urlOrId, gid);

    try {
      const response = await fetch(csvUrl);
      if (!response.ok) {
        throw new Error(`Google Sheets responded with status ${response.status}. Ensure the sheet is shared as "Anyone with the link can view".`);
      }
      const csvText = await response.text();
      return this.parseRosterCSV(csvText);
    } catch (err) {
      throw new Error(`Failed to pull Google Sheet roster: ${err.message}`);
    }
  }

  // Helper: Parse versatile cell content (integers, tallies, marks)
  parseCellCount(val) {
    if (val === null || val === undefined) return 0;
    const str = String(val).trim();
    if (!str || str === '0' || str === '-') return 0;

    // Direct Integer
    const intVal = parseInt(str);
    if (!isNaN(intVal) && intVal > 0) return intVal;

    // Tally marks (e.g. "III", "///", "1,1", "X", "✓")
    if (/^[I|/]+$/i.test(str)) return str.length;
    if (str.toLowerCase() === 'x' || str === '✓' || str === '✔') return 1;

    // Comma or space-separated list of numbers/tallies: "1, 1, 1"
    if (str.includes(',') || str.includes(' ')) {
      const parts = str.split(/[, ]+/).filter(p => p.trim() !== '');
      let sum = 0;
      parts.forEach(p => {
        const n = parseInt(p);
        if (!isNaN(n)) sum += n;
        else if (p.length > 0) sum += 1;
      });
      if (sum > 0) return sum;
    }

    return 0;
  }

  // 4. Dynamic Column Mapper for Any Google Sheet
  detectColumnIndices(rows) {
    // Default indices based on Damien official sheet
    const colMap = {
      cap: 0,
      name: 1,
      offCage: 2,
      miss: 3,
      goals5m: 4,
      goals6on5: 5,
      goals2m: 6,
      goalsAct: 7,
      turnovers: 8,
      badPass: 9,
      steals: 10,
      toForced: 11,
      excl5m: 14,
      exclReg: 15,
      blocks: 16,
      scoredOn: 17,
      missFb: 18,
      oneOnOne: 19,
      saves: 3,
      goalsAg: 2
    };

    // Scan the first 7 header rows to dynamically detect any custom column arrangement
    for (let r = 0; r < Math.min(7, rows.length); r++) {
      const row = rows[r];
      if (!row) continue;

      row.forEach((cell, idx) => {
        const c = String(cell || '').toLowerCase().trim();
        if (!c) return;

        if (c === 'cap' || c === 'cap #' || c === '#') colMap.cap = idx;
        if (c === 'name' || c === 'player name' || c === 'player') colMap.name = idx;
        if (c.includes('off cage') || c.includes('off-cage')) colMap.offCage = idx;
        if (c === 'miss' || c.includes('missed')) colMap.miss = idx;
        if (c.includes('5m') && (c.includes('goal') || r <= 5)) colMap.goals5m = idx;
        if (c.includes('6on5') || c.includes('6 on 5') || c.includes('man up')) colMap.goals6on5 = idx;
        if (c.includes('2m') || c.includes('center') || c.includes('hole')) colMap.goals2m = idx;
        if (c.includes('action') || c.includes('act') || c.includes('perimeter')) colMap.goalsAct = idx;
        if (c === 'to' || c.includes('turnover')) colMap.turnovers = idx;
        if (c.includes('bad pass')) colMap.badPass = idx;
        if (c === 'steal' || c.includes('steals') || c === 'stl') colMap.steals = idx;
        if (c.includes('to forced') || c.includes('forced')) colMap.toForced = idx;
        if (c.includes('reg') && (c.includes('excl') || r <= 5)) colMap.exclReg = idx;
        if (c.includes('fb') || c.includes('block') || c.includes('field block')) colMap.blocks = idx;
        if (c.includes('1on1') || c.includes('1-on-1')) colMap.oneOnOne = idx;
      });
    }

    return colMap;
  }

  // 5. Parse Full Damien Varsity Game Stats Sheet CSV
  parseFullGameCSV(rawText, fallbackOpponent = 'Opponent') {
    const rows = this.parseCSVGrid(rawText);
    if (rows.length === 0) throw new Error('Empty spreadsheet data received.');

    // Extract Metadata from Header
    let matchDate = new Date().toISOString().split('T')[0];
    let location = 'Damien Aquatic Complex';
    let official1 = '';
    let official2 = '';

    // Search header rows for Date, Location, Officials
    rows.slice(0, 8).forEach(r => {
      const rowStr = r.join(' ');
      const dateMatch = rowStr.match(/Date:\s*([^\s,"]+)/i) || rowStr.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/);
      if (dateMatch) matchDate = dateMatch[1];

      const locMatch = rowStr.match(/Location:?\s*([^\s,"]+)/i);
      if (locMatch) location = locMatch[1];

      const offMatch = rowStr.match(/Official\s*1:?\s*([^\s,"]+)/i);
      if (offMatch) official1 = offMatch[1];
    });

    const colMap = this.detectColumnIndices(rows);
    const homePlayers = [];
    const events = [];
    const playerStatsSummary = [];
    let homeTotalGoals = 0;
    let awayTotalGoals = 0;

    // Parse Field Players
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r || r.length < 2) continue;

      let capVal = null;
      let nameVal = null;

      // Check first 3 columns for numeric cap and player name
      for (let c = 0; c < Math.min(3, r.length); c++) {
        const cell = r[c]?.trim();
        if (/^\d{1,2}$/.test(cell)) {
          capVal = parseInt(cell);
          nameVal = r[c + 1]?.trim();
          break;
        }
      }

      // Check for GK rows like "Joseph Summers" without cap number
      if (!capVal && r[1] && (r[1].toLowerCase().includes('summers') || r[1].toLowerCase().includes('joseph'))) {
        capVal = 13;
        nameVal = r[1].trim();
      }

      if (!nameVal || nameVal.toLowerCase() === 'name' || nameVal.toLowerCase() === 'totals' || nameVal.toLowerCase().includes('stats sheet')) {
        continue;
      }

      if (capVal !== null && nameVal) {
        const isGk = capVal === 1 || capVal === 13 || nameVal.toLowerCase().includes('dallas') || nameVal.toLowerCase().includes('summers');
        
        let pos = 'Attacker';
        if (isGk) pos = 'GK';
        else if (capVal === 2 || capVal === 6 || capVal === 10) pos = 'Driver';
        else if (capVal === 4 || capVal === 9 || capVal === 16) pos = 'Defender';
        else if (capVal === 7 || capVal === 12 || capVal === 19) pos = 'Center';

        const playerObj = {
          cap: capVal,
          name: nameVal,
          pos,
          isStarter: capVal <= 7 || capVal === 1,
          isGk
        };
        homePlayers.push(playerObj);

        // Parse individual player stats using dynamic column mapping
        const missOffCage = this.parseCellCount(r[colMap.offCage]);
        const missReg = this.parseCellCount(r[colMap.miss]);
        const goals5m = this.parseCellCount(r[colMap.goals5m]);
        const goals6on5 = this.parseCellCount(r[colMap.goals6on5]);
        const goals2m = this.parseCellCount(r[colMap.goals2m]);
        const goalsAct = this.parseCellCount(r[colMap.goalsAct]);
        const turnovers = this.parseCellCount(r[colMap.turnovers]) + this.parseCellCount(r[colMap.badPass]);
        const steals = this.parseCellCount(r[colMap.steals]);
        const toForced = this.parseCellCount(r[colMap.toForced]);
        const excl5m = this.parseCellCount(r[colMap.excl5m]);
        const exclReg = this.parseCellCount(r[colMap.exclReg]);
        const exclusions = excl5m + exclReg;
        const blocks = this.parseCellCount(r[colMap.blocks]);
        const oneOnOne = this.parseCellCount(r[colMap.oneOnOne]);

        const totalPlayerGoals = goals5m + goals6on5 + goals2m + goalsAct;

        playerStatsSummary.push({
          cap: capVal,
          name: nameVal,
          goals: totalPlayerGoals,
          misses: missOffCage + missReg,
          steals,
          blocks,
          turnovers,
          exclusions
        });

        // Generate synthetic timeline events
        const addEvents = (count, type, shotType, isGoal, desc) => {
          for (let k = 0; k < count; k++) {
            const q = Math.min(4, Math.floor((events.length / 6)) + 1);
            events.push({
              id: 'ev_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
              team: 'home',
              cap: capVal,
              type,
              shotType: shotType || 'action',
              targetZone: 'top_right',
              poolX: 75,
              poolY: 50,
              desc: `${desc} by Damien #${capVal} ${nameVal}`,
              isGoal,
              q,
              clockSec: Math.max(10, 420 - (events.length * 20)),
              timeStr: state.formatTime(Math.max(10, 420 - (events.length * 20)))
            });
            if (isGoal) homeTotalGoals++;
          }
        };

        if (goals5m > 0) addEvents(goals5m, 'goal', 'penalty', true, 'GOAL (5M Penalty)');
        if (goals6on5 > 0) addEvents(goals6on5, 'goal', '6on5', true, 'GOAL (6-on-5 Man Up)');
        if (goals2m > 0) addEvents(goals2m, 'goal', 'center', true, 'GOAL (2M Center Set)');
        if (goalsAct > 0) addEvents(goalsAct, 'goal', 'action', true, 'GOAL (Action Shot)');
        if (missOffCage > 0) addEvents(missOffCage, 'miss', 'action', false, 'Miss Off Cage');
        if (missReg > 0) addEvents(missReg, 'miss', 'action', false, 'Missed Shot');
        if (steals > 0) addEvents(steals, 'steal', null, false, 'Steal');
        if (blocks > 0) addEvents(blocks, 'block', null, false, 'Field Block');
        if (turnovers > 0) addEvents(turnovers, 'turnover', null, false, 'Turnover');
        if (exclusions > 0) addEvents(exclusions, 'exclusion', null, false, '20s Exclusion Foul');
      }
    }

    // Check Quarter Scores rows (Rows 25 to 30)
    let parsedQuarterDamien = [0, 0, 0, 0, 0];
    let parsedQuarterOpp = [0, 0, 0, 0, 0];

    rows.forEach(r => {
      const rowStr = r.join(' ').toLowerCase();
      if (rowStr.includes('damien') && r.length >= 18) {
        for (let q = 0; q < 5; q++) {
          const val = this.parseCellCount(r[13 + q]);
          if (val > 0) parsedQuarterDamien[q] = val;
        }
      } else if (rowStr.includes('opp') && r.length >= 18) {
        for (let q = 0; q < 5; q++) {
          const val = this.parseCellCount(r[13 + q]);
          if (val > 0) parsedQuarterOpp[q] = val;
        }
      }
    });

    const sumQDamien = parsedQuarterDamien.reduce((a, b) => a + b, 0);
    const sumQOpp = parsedQuarterOpp.reduce((a, b) => a + b, 0);

    if (sumQDamien > 0 && homeTotalGoals === 0) {
      homeTotalGoals = sumQDamien;
    }
    if (sumQOpp > 0) {
      awayTotalGoals = sumQOpp;
    } else {
      awayTotalGoals = Math.max(0, Math.round(homeTotalGoals * 0.75));
    }

    // Default Opponent Roster
    const awayPlayers = [
      { cap: 1, name: 'Opponent Goalie', pos: 'GK', isStarter: true, isGk: true },
      { cap: 2, name: 'Opponent Player 2', pos: 'Driver', isStarter: true, isGk: false },
      { cap: 3, name: 'Opponent Player 3', pos: 'Attacker', isStarter: true, isGk: false },
      { cap: 4, name: 'Opponent Player 4', pos: 'Center', isStarter: true, isGk: false },
      { cap: 5, name: 'Opponent Player 5', pos: 'Defender', isStarter: true, isGk: false },
      { cap: 6, name: 'Opponent Player 6', pos: 'Attacker', isStarter: true, isGk: false },
      { cap: 7, name: 'Opponent Player 7', pos: 'Driver', isStarter: true, isGk: false }
    ];

    // Build Match Object
    const matchObj = {
      id: 'damien_game_' + Date.now(),
      date: matchDate,
      location,
      tournament: 'Damien Varsity Match',
      currentQuarter: 4,
      clockSec: 0,
      shotClockSec: 30,
      isFinal: true,
      homeTeam: {
        name: 'Damien Spartans',
        shortName: 'DMS',
        capColor: '#0E3D2F',
        capTextColor: '#FFB81C',
        score: homeTotalGoals,
        timeoutsRemaining: 2,
        roster: homePlayers.length > 0 ? homePlayers : [...DAMIEN_VARSITY_ROSTER]
      },
      awayTeam: {
        name: fallbackOpponent,
        shortName: fallbackOpponent.substring(0, 3).toUpperCase(),
        capColor: '#1e3a8a',
        capTextColor: '#ffffff',
        score: awayTotalGoals,
        timeoutsRemaining: 2,
        roster: awayPlayers
      },
      events,
      playerStatsSummary
    };

    return matchObj;
  }

  // 6. Parse CSV text into a 2D Array
  parseCSVGrid(rawText) {
    if (!rawText || !rawText.trim()) return [];
    const lines = rawText.trim().split(/\r?\n/);
    return lines.map(line => {
      const values = [];
      let current = '';
      let insideQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          insideQuotes = !insideQuotes;
        } else if ((char === ',' || char === '\t' || char === ';') && !insideQuotes) {
          values.push(current.trim().replace(/^["']|["']$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim().replace(/^["']|["']$/g, ''));
      return values;
    }).filter(r => r.length > 0 && r.some(c => c.trim() !== ''));
  }

  // 7. Universal CSV / TSV Roster Parser
  parseRosterCSV(rawText) {
    const rows = this.parseCSVGrid(rawText);
    if (rows.length === 0) return [];

    const roster = [];
    const seenCaps = new Set();

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r || r.length < 2) continue;

      let capVal = null;
      let nameVal = null;

      for (let c = 0; c < Math.min(3, r.length); c++) {
        const cell = r[c]?.trim();
        if (/^\d{1,2}$/.test(cell)) {
          capVal = parseInt(cell);
          nameVal = r[c + 1]?.trim();
          break;
        }
      }

      if (!capVal && r[1] && (r[1].toLowerCase().includes('summers') || r[1].toLowerCase().includes('joseph'))) {
        capVal = 13;
        nameVal = r[1].trim();
      }

      if (!nameVal || nameVal.toLowerCase() === 'name' || nameVal.toLowerCase() === 'totals' || nameVal.toLowerCase().includes('stats sheet')) {
        continue;
      }

      if (capVal !== null && nameVal && !seenCaps.has(capVal)) {
        seenCaps.add(capVal);
        const isGk = capVal === 1 || capVal === 13 || nameVal.toLowerCase().includes('dallas') || nameVal.toLowerCase().includes('summers');
        const isStarter = capVal <= 7 || capVal === 1;

        let pos = 'Attacker';
        if (isGk) pos = 'GK';
        else if (capVal === 2 || capVal === 6 || capVal === 10) pos = 'Driver';
        else if (capVal === 4 || capVal === 9 || capVal === 16) pos = 'Defender';
        else if (capVal === 7 || capVal === 12 || capVal === 19) pos = 'Center';

        roster.push({
          cap: capVal,
          name: nameVal,
          pos,
          isStarter,
          isGk
        });
      }
    }

    roster.sort((a, b) => a.cap - b.cap);
    return roster;
  }

  // 8. Apply Imported Match to Active Session
  loadMatchIntoState(matchObj) {
    if (!matchObj) return false;
    state.match = matchObj;
    state.rebuildActiveLineup();
    state.notify('match_loaded', { matchId: matchObj.id });
    return true;
  }

  // 9. Save Imported Match to Archive
  archiveMatch(matchObj) {
    if (!matchObj) return;
    const existingIdx = this.archivedMatches.findIndex(m => m.id === matchObj.id);
    if (existingIdx >= 0) {
      this.archivedMatches[existingIdx] = matchObj;
    } else {
      this.archivedMatches.unshift(matchObj);
    }
    this.saveArchivedMatches();
  }

  // 10. Apply Imported Roster to Active Team
  applyRosterToTeam(teamKey, roster) {
    if (!state.match || !roster || roster.length === 0) return false;
    const team = teamKey === 'home' ? state.match.homeTeam : state.match.awayTeam;
    team.roster = roster;
    state.rebuildActiveLineup();
    state.notify('roster_updated', { team: teamKey });
    return true;
  }

  // 11. Generate Populated Sample Stats for Testing
  generateSampleDamienStatsMatch(opponentName = 'Los Osos Grizzlies') {
    const players = [...DAMIEN_VARSITY_ROSTER];
    const events = [];

    const statsPlan = [
      { cap: 2, goals: 2, steals: 3, blocks: 1, turnovers: 1, excl: 1 },
      { cap: 3, goals: 3, steals: 1, blocks: 0, turnovers: 0, excl: 0 },
      { cap: 4, goals: 1, steals: 2, blocks: 2, turnovers: 1, excl: 1 },
      { cap: 6, goals: 2, steals: 1, blocks: 0, turnovers: 0, excl: 0 },
      { cap: 7, goals: 3, steals: 0, blocks: 1, turnovers: 2, excl: 2 },
      { cap: 10, goals: 1, steals: 1, blocks: 0, turnovers: 0, excl: 0 },
      { cap: 12, goals: 2, steals: 1, blocks: 1, turnovers: 0, excl: 0 }
    ];

    let totalGoals = 0;
    statsPlan.forEach(p => {
      const pl = players.find(x => x.cap === p.cap);
      const name = pl ? pl.name : `Player #${p.cap}`;

      for (let g = 0; g < p.goals; g++) {
        events.push({
          id: 'ev_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          team: 'home',
          cap: p.cap,
          type: 'goal',
          shotType: g === 0 ? '6on5' : (g === 1 ? 'center' : 'action'),
          desc: `GOAL! Damien #${p.cap} ${name}`,
          isGoal: true,
          q: Math.min(4, Math.floor(events.length / 5) + 1),
          clockSec: 360 - (events.length * 15),
          timeStr: state.formatTime(360 - (events.length * 15))
        });
        totalGoals++;
      }

      for (let s = 0; s < p.steals; s++) {
        events.push({
          id: 'ev_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          team: 'home',
          cap: p.cap,
          type: 'steal',
          desc: `Steal by Damien #${p.cap} ${name}`,
          isGoal: false,
          q: Math.min(4, Math.floor(events.length / 5) + 1),
          clockSec: 320 - (events.length * 15),
          timeStr: state.formatTime(320 - (events.length * 15))
        });
      }
    });

    const matchObj = {
      id: 'damien_sample_' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      location: 'Damien Aquatic Complex',
      tournament: 'Baseline League Championship',
      currentQuarter: 4,
      clockSec: 0,
      shotClockSec: 30,
      isFinal: true,
      homeTeam: {
        name: 'Damien Spartans',
        shortName: 'DMS',
        capColor: '#0E3D2F',
        capTextColor: '#FFB81C',
        score: totalGoals,
        timeoutsRemaining: 2,
        roster: players
      },
      awayTeam: {
        name: opponentName,
        shortName: opponentName.substring(0, 3).toUpperCase(),
        capColor: '#1e3a8a',
        capTextColor: '#ffffff',
        score: 9,
        timeoutsRemaining: 1,
        roster: [
          { cap: 1, name: 'Opponent Goalie', pos: 'GK', isStarter: true, isGk: true },
          { cap: 2, name: 'Opponent Player 2', pos: 'Driver', isStarter: true, isGk: false },
          { cap: 3, name: 'Opponent Player 3', pos: 'Attacker', isStarter: true, isGk: false },
          { cap: 4, name: 'Opponent Player 4', pos: 'Center', isStarter: true, isGk: false },
          { cap: 5, name: 'Opponent Player 5', pos: 'Defender', isStarter: true, isGk: false }
        ]
      },
      events,
      playerStatsSummary: statsPlan.map(p => {
        const pl = players.find(x => x.cap === p.cap);
        return {
          cap: p.cap,
          name: pl ? pl.name : `Player #${p.cap}`,
          goals: p.goals,
          misses: 1,
          steals: p.steals,
          blocks: p.blocks,
          turnovers: p.turnovers,
          exclusions: p.excl
        };
      })
    };

    return matchObj;
  }
}

export const importer = new ImporterEngine();
