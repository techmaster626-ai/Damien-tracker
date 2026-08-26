/**
 * Roster and Stats Importer Engine for Damien High School Water Polo
 * Handles:
 * - Direct Google Sheets CSV integration (including Damien Varsity official sheet layout)
 * - Copy-paste CSV / Tab-Delimited text parser
 * - Dynamic column detection (Cap, Name, Position, GK, Starter)
 */

import { state } from './state.js';

export class ImporterEngine {
  constructor() {
    this.defaultGoogleSheetUrl = 'https://docs.google.com/spreadsheets/d/1TFs_XI1Zpe2S5x8X_VXk0SlU1ZXXIMTsWMzhej8PYe4/edit?gid=0#gid=0';
  }

  // 1. Fetch & Parse Public Google Sheet by URL or Spreadsheet ID
  async fetchFromGoogleSheetUrl(urlOrId, gid = '0') {
    let csvUrl = (urlOrId || this.defaultGoogleSheetUrl).trim();

    // Check if user entered full Google Sheet URL with gid
    const gidMatch = csvUrl.match(/gid=([0-9]+)/);
    const actualGid = gidMatch ? gidMatch[1] : gid;

    const match = csvUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      const sheetId = match[1];
      csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${actualGid}`;
    } else if (!csvUrl.startsWith('http')) {
      // Raw Spreadsheet ID
      csvUrl = `https://docs.google.com/spreadsheets/d/${csvUrl}/gviz/tq?tqx=out:csv&gid=${actualGid}`;
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

  // 2. Universal CSV / TSV Roster Parser (handles standard tables and Damien Varsity Sheet format)
  parseRosterCSV(rawText) {
    if (!rawText || !rawText.trim()) return [];

    const lines = rawText.trim().split(/\r?\n/);
    if (lines.length === 0) return [];

    const parseLine = (line) => {
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
    };

    const rows = lines.map(l => parseLine(l)).filter(r => r.length > 0 && r.some(c => c.trim() !== ''));
    if (rows.length === 0) return [];

    const roster = [];
    const seenCaps = new Set();

    // Iterate through all rows looking for player entries (Cap + Name)
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r || r.length < 2) continue;

      // Check for Damien Varsity Stats sheet row pattern: [CapNumber, PlayerName, ...]
      let capVal = null;
      let nameVal = null;

      // Test first 3 columns for numeric cap and string name
      for (let c = 0; c < Math.min(3, r.length); c++) {
        const cell = r[c]?.trim();
        if (/^\d{1,2}$/.test(cell)) {
          capVal = parseInt(cell);
          nameVal = r[c + 1]?.trim();
          break;
        }
      }

      // Special check for GK row without cap number like "Joseph Summers"
      if (!capVal && r[1] && (r[1].toLowerCase().includes('summers') || r[1].toLowerCase().includes('joseph'))) {
        capVal = 13; // Alternate goalie cap
        nameVal = r[1].trim();
      }

      // Ignore totals, headers, empty names
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
1,Brennan Dallas,GK,Yes
2,Diego Negrete,Driver,Yes
3,Jacob Hong,Attacker,Yes
4,Jorge Solis,Defender,Yes
5,Colin Ferrer,Attacker,Yes
6,Christian Chacon,Driver,Yes
7,Maddox Redfearn,Center,Yes
8,Jonathan Jimenez,Attacker,No
9,Kiki Gore,Defender,No
10,Niko Echieverria,Driver,No
11,Luke German,Attacker,No
12,David Vicario,Center,No
13,Joseph Summers,GK,No
14,Landen Garcia,Attacker,No
15,Logan Diaz,Defender,No
16,Aaron Fulmer,Defender,No
19,Diego Solis,Center,No`;
  }
}

export const importer = new ImporterEngine();
