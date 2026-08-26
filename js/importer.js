/**
 * Roster and Stats Importer Engine
 * Supports:
 * - Direct Google Sheets CSV integration (via Google Sheets URL or ID)
 * - Copy-paste CSV / Tab-Delimited text parser
 * - File upload (.csv)
 * - Dynamic column mapping (Cap, Name, Position, Starter, GK)
 */

import { state } from './state.js';

export class ImporterEngine {
  constructor() {}

  // 1. Fetch & Parse Public Google Sheet by URL or Spreadsheet ID
  async fetchFromGoogleSheetUrl(urlOrId, sheetName = 'Sheet1') {
    let csvUrl = urlOrId.trim();

    // Check if user entered full Google Sheet URL
    const match = csvUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      const sheetId = match[1];
      csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
    } else if (!csvUrl.startsWith('http')) {
      // Raw Spreadsheet ID
      csvUrl = `https://docs.google.com/spreadsheets/d/${csvUrl}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
    }

    try {
      const response = await fetch(csvUrl);
      if (!response.ok) {
        throw new Error(`Google Sheets responded with status ${response.status}. Ensure the sheet is shared as "Anyone with the link can view".`);
      }
      const csvText = await response.text();
      return this.parseRosterCSV(csvText);
    } catch (err) {
      throw new Error(`Failed to pull Google Sheet: ${err.message}`);
    }
  }

  // 2. Universal CSV / TSV Roster Parser
  parseRosterCSV(rawText) {
    if (!rawText || !rawText.trim()) return [];

    const lines = rawText.trim().split(/\r?\n/);
    if (lines.length === 0) return [];

    // Detect delimiter (, or \t or ;)
    const firstLine = lines[0];
    let delimiter = ',';
    if (firstLine.includes('\t')) delimiter = '\t';
    else if (firstLine.includes(';') && !firstLine.includes(',')) delimiter = ';';

    const parseLine = (line) => {
      // Basic CSV field parser handling quotes
      const values = [];
      let current = '';
      let insideQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          insideQuotes = !insideQuotes;
        } else if (char === delimiter && !insideQuotes) {
          values.push(current.trim().replace(/^["']|["']$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim().replace(/^["']|["']$/g, ''));
      return values;
    };

    const rows = lines.map(l => parseLine(l)).filter(r => r.length > 0 && r[0] !== '');
    if (rows.length === 0) return [];

    // Check if first row is header
    const headerRow = rows[0].map(h => h.toLowerCase());
    let startIndex = 0;
    let capIdx = 0;
    let nameIdx = 1;
    let posIdx = 2;
    let starterIdx = -1;

    const hasHeader = headerRow.some(h => h.includes('cap') || h.includes('player') || h.includes('name') || h.includes('number') || h.includes('pos'));
    if (hasHeader) {
      startIndex = 1;
      headerRow.forEach((col, idx) => {
        if (col.includes('cap') || col.includes('number') || col === '#' || col.includes('num')) capIdx = idx;
        else if (col.includes('name') || col.includes('player')) nameIdx = idx;
        else if (col.includes('pos') || col.includes('role')) posIdx = idx;
        else if (col.includes('starter') || col.includes('lineup')) starterIdx = idx;
      });
    }

    const roster = [];
    for (let i = startIndex; i < rows.length; i++) {
      const r = rows[i];
      if (!r || r.length < 2) continue;

      const rawCap = r[capIdx] ? parseInt(r[capIdx].replace(/\D/g, '')) : (i + 1);
      const name = r[nameIdx] ? r[nameIdx].trim() : `Player ${rawCap}`;
      const pos = r[posIdx] ? r[posIdx].trim() : 'Player';
      const rawStarter = starterIdx !== -1 && r[starterIdx] ? r[starterIdx].toLowerCase() : '';
      const isStarter = rawStarter === 'yes' || rawStarter === 'true' || rawStarter === '1' || (i < 8);
      const isGk = pos.toUpperCase().includes('GK') || pos.toLowerCase().includes('goalie') || rawCap === 1 || rawCap === 13;

      if (!isNaN(rawCap)) {
        roster.push({
          cap: rawCap,
          name,
          pos,
          isStarter,
          isGk
        });
      }
    }

    // Sort by cap number
    roster.sort((a, b) => a.cap - b.cap);
    return roster;
  }

  // 3. Apply Imported Roster to Active Team
  applyRosterToTeam(teamKey, roster) {
    if (!state.match || !roster || roster.length === 0) return false;
    const team = teamKey === 'home' ? state.match.homeTeam : state.match.awayTeam;
    team.roster = roster;
    state.rebuildActiveLineup();
    state.notify('roster_updated', { team: teamKey });
    return true;
  }

  // 4. Generate Sample CSV Template for Google Sheets
  getSampleRosterCSV() {
    return `Cap Number,Player Name,Position,Starter
1,Chase Peterson,GK,Yes
2,Brayden Taylor,Driver,Yes
3,Lucas Hernandez,Attacker,Yes
4,Cole Miller,Defender,Yes
5,Mason Vance,Attacker,Yes
6,Brody Reynolds,Driver,Yes
7,Dominic Varese,Center,Yes
8,Gavin O'Keefe,Attacker,No
9,Christian Silva,Defender,No
10,Austin Bradley,Driver,No
11,Logan Chen,Attacker,No
12,Wyatt Adams,Center,No
13,Nate Gallagher,GK,No`;
  }
}

export const importer = new ImporterEngine();
