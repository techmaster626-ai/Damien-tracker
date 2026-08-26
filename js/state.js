/**
 * Reactive Match State and Stat Computation Engine
 * Manages game clock, 30s/20s shot clock, 20s exclusions penalty box,
 * events play-by-play, active lineups, undo/redo stack, and FINA/NCAA stat calculations.
 */

import { PRESET_MATCHES, createNewMatchTemplate } from './presets.js';
import { sound } from './audio.js';

class MatchState {
  constructor() {
    this.listeners = new Set();
    this.match = null;
    this.activeLineups = {
      home: new Set([1, 2, 3, 4, 5, 6, 7]),
      away: new Set([1, 2, 3, 4, 5, 6, 7])
    };
    this.activeExclusions = []; // { id, team: 'home'|'away', cap, name, remainingSec, startClockSec, quarter }
    this.shotClock = 30;
    this.isClockRunning = false;
    this.possession = 'home'; // 'home' | 'away'
    this.undoStack = [];
    this.redoStack = [];
    this.clockInterval = null;

    this.init();
  }

  init() {
    // Load last saved match or default to Olympic Final demo
    const saved = localStorage.getItem('wps_current_match');
    if (saved) {
      try {
        this.match = JSON.parse(saved);
      } catch (e) {
        this.match = JSON.parse(JSON.stringify(PRESET_MATCHES.olympic_final));
      }
    } else {
      this.match = JSON.parse(JSON.stringify(PRESET_MATCHES.olympic_final));
    }
    this.shotClock = this.match.shotClockSec || 30;
    this.rebuildActiveLineup();
    this.startTicker();
  }

  rebuildActiveLineup() {
    if (!this.match) return;
    this.activeLineups.home = new Set(
      this.match.homeTeam.roster.filter(p => p.isStarter).map(p => p.cap)
    );
    this.activeLineups.away = new Set(
      this.match.awayTeam.roster.filter(p => p.isStarter).map(p => p.cap)
    );
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(eventType = 'update', detail = {}) {
    this.saveToStorage();
    this.listeners.forEach(fn => fn(eventType, detail, this));
  }

  saveToStorage() {
    if (this.match) {
      localStorage.setItem('wps_current_match', JSON.stringify(this.match));
    }
  }

  loadMatchPreset(presetKey) {
    if (PRESET_MATCHES[presetKey]) {
      this.pauseClock();
      this.match = JSON.parse(JSON.stringify(PRESET_MATCHES[presetKey]));
      this.shotClock = this.match.shotClockSec || 30;
      this.activeExclusions = [];
      this.undoStack = [];
      this.redoStack = [];
      this.rebuildActiveLineup();
      this.notify('match_loaded');
    }
  }

  loadCustomMatch(matchData) {
    this.pauseClock();
    this.match = JSON.parse(JSON.stringify(matchData));
    this.shotClock = this.match.shotClockSec || 30;
    this.activeExclusions = [];
    this.undoStack = [];
    this.redoStack = [];
    this.rebuildActiveLineup();
    this.notify('match_loaded');
  }

  createNewGame(homeName = 'Home White', awayName = 'Away Blue', quarterMin = 8) {
    this.pauseClock();
    const newMatch = createNewMatchTemplate(homeName, awayName);
    newMatch.quarterLengthSec = quarterMin * 60;
    newMatch.clockSec = quarterMin * 60;
    this.match = newMatch;
    this.shotClock = 30;
    this.activeExclusions = [];
    this.undoStack = [];
    this.redoStack = [];
    this.rebuildActiveLineup();
    this.notify('match_created');
  }

  // --- CLOCK MANAGEMENT ---

  startTicker() {
    if (this.clockInterval) clearInterval(this.clockInterval);
    this.clockInterval = setInterval(() => {
      if (this.isClockRunning && this.match && this.match.clockSec > 0) {
        this.tick();
      }
    }, 1000);
  }

  tick() {
    if (!this.isClockRunning) return;

    if (this.match.clockSec > 0) {
      this.match.clockSec -= 1;
    }

    // Shot clock
    if (this.shotClock > 0) {
      this.shotClock -= 1;
      if (this.shotClock === 0) {
        sound.playBuzzer(0.8);
        this.notify('shot_clock_expired');
      }
    }

    // Update active exclusions (20s)
    for (let i = this.activeExclusions.length - 1; i >= 0; i--) {
      const exc = this.activeExclusions[i];
      exc.remainingSec -= 1;
      if (exc.remainingSec <= 0) {
        sound.playWhistle(false);
        this.activeExclusions.splice(i, 1);
        this.notify('exclusion_expired', { exclusion: exc });
      }
    }

    // Quarter end check
    if (this.match.clockSec === 0) {
      this.pauseClock();
      sound.playBuzzer(1.4);
      this.notify('quarter_ended', { quarter: this.match.currentQuarter });
    } else {
      this.notify('clock_tick');
    }
  }

  toggleClock() {
    if (this.isClockRunning) {
      this.pauseClock();
    } else {
      this.startClock();
    }
  }

  startClock() {
    if (this.match.clockSec <= 0) return;
    this.isClockRunning = true;
    sound.playWhistle(false);
    this.notify('clock_started');
  }

  pauseClock() {
    this.isClockRunning = false;
    this.notify('clock_paused');
  }

  adjustClockSec(delta) {
    this.match.clockSec = Math.max(0, Math.min(this.match.quarterLengthSec, this.match.clockSec + delta));
    this.notify('clock_adjusted');
  }

  setClock(min, sec) {
    const total = min * 60 + sec;
    this.match.clockSec = Math.max(0, Math.min(this.match.quarterLengthSec, total));
    this.notify('clock_set');
  }

  resetShotClock(seconds = 30) {
    sound.playClick();
    this.shotClock = seconds;
    this.notify('shot_clock_reset', { seconds });
  }

  adjustShotClock(delta) {
    this.shotClock = Math.max(0, Math.min(30, this.shotClock + delta));
    this.notify('shot_clock_adjusted');
  }

  setPossession(team) {
    this.possession = team;
    this.notify('possession_changed', { team });
  }

  advanceQuarter() {
    this.pauseClock();
    if (this.match.currentQuarter < 4) {
      this.match.currentQuarter += 1;
    } else {
      // Overtime or Shootout
      this.match.currentQuarter += 1;
    }
    this.match.clockSec = this.match.quarterLengthSec;
    this.shotClock = this.match.shotClockSec || 30;
    this.activeExclusions = [];
    sound.playWhistle(true);
    this.notify('quarter_advanced', { quarter: this.match.currentQuarter });
  }

  formatTime(totalSec) {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  // --- EXCLUSION MANAGEMENT ---

  addExclusion(team, cap, name, drawnByCap = null) {
    const exc = {
      id: 'exc_' + Date.now() + '_' + cap,
      team,
      cap,
      name,
      drawnByCap,
      remainingSec: this.match.exclusionSec || 20,
      startClockSec: this.match.clockSec,
      quarter: this.match.currentQuarter
    };

    // Remove any existing exclusion for same cap
    this.activeExclusions = this.activeExclusions.filter(e => !(e.team === team && e.cap === cap));
    this.activeExclusions.push(exc);

    // Reset shot clock to 20s if defending team was excluded and remaining > 20s
    if (this.shotClock < 20) {
      this.resetShotClock(20);
    }

    sound.playWhistle(false);
    return exc;
  }

  waveInPlayer(exclusionId) {
    this.activeExclusions = this.activeExclusions.filter(e => e.id !== exclusionId);
    sound.playWhistle(false);
    this.notify('exclusion_waived', { id: exclusionId });
  }

  clearAllExclusions() {
    this.activeExclusions = [];
    this.notify('exclusions_cleared');
  }

  // Check if team is currently in man-up situation
  getManUpState() {
    const homeExclusions = this.activeExclusions.filter(e => e.team === 'home');
    const awayExclusions = this.activeExclusions.filter(e => e.team === 'away');

    return {
      homeManUp: awayExclusions.length > homeExclusions.length,
      awayManUp: homeExclusions.length > awayExclusions.length,
      homeCount: 7 - homeExclusions.length,
      awayCount: 7 - awayExclusions.length
    };
  }

  // --- ROSTER & LINEUP SUBSTITUTIONS ---

  togglePlayerActive(team, cap) {
    const lineup = this.activeLineups[team];
    if (lineup.has(cap)) {
      lineup.delete(cap);
    } else {
      lineup.add(cap);
    }
    this.notify('lineup_changed', { team, cap });
  }

  // --- EVENT LOGGING ENGINE ---

  logEvent(eventData) {
    const timeSec = this.match.clockSec;
    const timeStr = this.formatTime(timeSec);
    const q = this.match.currentQuarter;

    const event = {
      id: 'ev_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      q,
      timeSec,
      timeStr,
      ...eventData
    };

    // Automatically adjust scores if goal
    if (event.isGoal) {
      if (event.team === 'home') {
        this.match.homeTeam.score += 1;
      } else {
        this.match.awayTeam.score += 1;
      }
      sound.playGoalHorn();

      // On a goal, all excluded players from opposing team are released (wave in)
      const defendingTeam = event.team === 'home' ? 'away' : 'home';
      this.activeExclusions = this.activeExclusions.filter(e => e.team !== defendingTeam);

      // Reset shot clock to 30 for restart
      this.resetShotClock(30);
      this.setPossession(defendingTeam);
    } else if (event.type === 'exclusion') {
      const teamObj = event.team === 'home' ? this.match.homeTeam : this.match.awayTeam;
      const player = teamObj.roster.find(p => p.cap === event.cap);
      const playerName = player ? player.name : `Cap #${event.cap}`;
      this.addExclusion(event.team, event.cap, playerName, event.drawnByCap);
    } else if (event.type === 'timeout') {
      const teamObj = event.team === 'home' ? this.match.homeTeam : this.match.awayTeam;
      if (teamObj.timeoutsRemaining > 0) {
        teamObj.timeoutsRemaining -= 1;
      }
      this.pauseClock();
      this.resetShotClock(30);
      sound.playWhistle(true);
    } else if (event.type === 'steal' || event.type === 'turnover') {
      const oppTeam = event.team === 'home' ? 'away' : 'home';
      this.setPossession(event.type === 'steal' ? event.team : oppTeam);
      this.resetShotClock(30);
    }

    event.homeScore = this.match.homeTeam.score;
    event.awayScore = this.match.awayTeam.score;

    this.undoStack.push(JSON.parse(JSON.stringify(this.match)));
    this.redoStack = [];

    this.match.events.push(event);
    this.notify('event_logged', { event });
    return event;
  }

  undoLastEvent() {
    if (this.match.events.length === 0) return;
    const lastEvent = this.match.events.pop();

    // Recompute scores and state
    this.recomputeMatchScores();
    this.notify('event_undone', { event: lastEvent });
  }

  deleteEvent(eventId) {
    const idx = this.match.events.findIndex(e => e.id === eventId);
    if (idx !== -1) {
      const removed = this.match.events.splice(idx, 1)[0];
      this.recomputeMatchScores();
      this.notify('event_deleted', { event: removed });
    }
  }

  recomputeMatchScores() {
    let homeScore = 0;
    let awayScore = 0;

    for (const ev of this.match.events) {
      if (ev.isGoal) {
        if (ev.team === 'home') homeScore++;
        else if (ev.team === 'away') awayScore++;
      }
      ev.homeScore = homeScore;
      ev.awayScore = awayScore;
    }

    this.match.homeTeam.score = homeScore;
    this.match.awayTeam.score = awayScore;
  }

  // --- STATS COMPUTATION (NCAA / FINA / WORLD AQUATICS STANDARDS) ---

  calculateStats() {
    if (!this.match) return null;

    const stats = {
      home: {
        score: this.match.homeTeam.score,
        quarters: [0, 0, 0, 0, 0], // Q1, Q2, Q3, Q4, OT
        totalShots: 0,
        goals: 0,
        assists: 0,
        steals: 0,
        blocks: 0,
        turnovers: 0,
        exclusionsCommitted: 0,
        exclusionsDrawn: 0,
        penaltyCommitted: 0,
        penaltyDrawn: 0,
        manUpGoals: 0,
        manUpAttempts: 0,
        penaltyGoals: 0,
        penaltyAttempts: 0,
        counterGoals: 0,
        sprintsWon: 0,
        sprintsTotal: 0,
        players: {},
        goalies: {}
      },
      away: {
        score: this.match.awayTeam.score,
        quarters: [0, 0, 0, 0, 0],
        totalShots: 0,
        goals: 0,
        assists: 0,
        steals: 0,
        blocks: 0,
        turnovers: 0,
        exclusionsCommitted: 0,
        exclusionsDrawn: 0,
        penaltyCommitted: 0,
        penaltyDrawn: 0,
        manUpGoals: 0,
        manUpAttempts: 0,
        penaltyGoals: 0,
        penaltyAttempts: 0,
        counterGoals: 0,
        sprintsWon: 0,
        sprintsTotal: 0,
        players: {},
        goalies: {}
      }
    };

    // Initialize all roster players
    const initPlayerStat = (p) => ({
      cap: p.cap,
      name: p.name,
      pos: p.pos,
      isStarter: p.isStarter,
      goals: 0,
      shots: 0,
      assists: 0,
      points: 0,
      steals: 0,
      blocks: 0,
      turnovers: 0,
      exclusionsCommitted: 0,
      exclusionsDrawn: 0,
      penaltyCommitted: 0,
      penaltyDrawn: 0,
      sprintsWon: 0,
      plusMinus: 0,
      shotAccuracy: 0
    });

    const initGoalieStat = (g) => ({
      cap: g.cap,
      name: g.name,
      saves: 0,
      goalsAllowed: 0,
      shotsFaced: 0,
      savePct: 0,
      penaltySaves: 0,
      steals: 0,
      assists: 0
    });

    this.match.homeTeam.roster.forEach(p => {
      stats.home.players[p.cap] = initPlayerStat(p);
      if (p.isGk) stats.home.goalies[p.cap] = initGoalieStat(p);
    });

    this.match.awayTeam.roster.forEach(p => {
      stats.away.players[p.cap] = initPlayerStat(p);
      if (p.isGk) stats.away.goalies[p.cap] = initGoalieStat(p);
    });

    // Default primary goalies if empty
    if (Object.keys(stats.home.goalies).length === 0) stats.home.goalies[1] = initGoalieStat({ cap: 1, name: 'Goalie' });
    if (Object.keys(stats.away.goalies).length === 0) stats.away.goalies[1] = initGoalieStat({ cap: 1, name: 'Goalie' });

    // Process all chronological events
    this.match.events.forEach(ev => {
      const isHome = ev.team === 'home';
      const teamStats = isHome ? stats.home : stats.away;
      const oppStats = isHome ? stats.away : stats.home;
      const qIdx = Math.min(4, Math.max(0, (ev.q || 1) - 1));

      // 1. GOAL
      if (ev.isGoal) {
        teamStats.goals++;
        teamStats.totalShots++;
        teamStats.quarters[qIdx]++;

        if (ev.cap && teamStats.players[ev.cap]) {
          teamStats.players[ev.cap].goals++;
          teamStats.players[ev.cap].shots++;
          teamStats.players[ev.cap].points++;
        }

        // Assist
        if (ev.assistCap && teamStats.players[ev.assistCap]) {
          teamStats.players[ev.assistCap].assists++;
          teamStats.players[ev.assistCap].points++;
          teamStats.assists++;
        }

        // Shot types
        if (ev.shotType === '6on5') {
          teamStats.manUpGoals++;
        } else if (ev.shotType === 'penalty') {
          teamStats.penaltyGoals++;
          teamStats.penaltyAttempts++;
        } else if (ev.shotType === 'counter') {
          teamStats.counterGoals++;
        }

        // Opponent Goalie Allowed
        const oppGkCap = ev.goalieCap || 1;
        if (oppStats.goalies[oppGkCap]) {
          oppStats.goalies[oppGkCap].goalsAllowed++;
          oppStats.goalies[oppGkCap].shotsFaced++;
        }
      }

      // 2. MISS OR SAVE
      else if (ev.type === 'miss') {
        teamStats.totalShots++;
        if (ev.cap && teamStats.players[ev.cap]) {
          teamStats.players[ev.cap].shots++;
        }
      } else if (ev.type === 'save') {
        oppStats.totalShots++;
        if (ev.cap && oppStats.players[ev.cap]) {
          oppStats.players[ev.cap].shots++;
        }
        const gkCap = ev.goalieCap || 1;
        if (teamStats.goalies[gkCap]) {
          teamStats.goalies[gkCap].saves++;
          teamStats.goalies[gkCap].shotsFaced++;
        }
      }

      // 3. EXCLUSION / FOULS
      else if (ev.type === 'exclusion') {
        teamStats.exclusionsCommitted++;
        oppStats.manUpAttempts++;
        if (ev.cap && teamStats.players[ev.cap]) {
          teamStats.players[ev.cap].exclusionsCommitted++;
        }
        if (ev.drawnByCap && oppStats.players[ev.drawnByCap]) {
          oppStats.players[ev.drawnByCap].exclusionsDrawn++;
          oppStats.exclusionsDrawn++;
        }
      } else if (ev.type === 'penalty_drawn' || ev.type === 'penalty_foul') {
        if (ev.foulCap && teamStats.players[ev.foulCap]) {
          teamStats.players[ev.foulCap].penaltyCommitted++;
          teamStats.penaltyCommitted++;
        }
        if (ev.cap && oppStats.players[ev.cap]) {
          oppStats.players[ev.cap].penaltyDrawn++;
          oppStats.penaltyDrawn++;
        }
      }

      // 4. STEALS / TURNOVERS / BLOCKS
      else if (ev.type === 'steal') {
        teamStats.steals++;
        if (ev.cap && teamStats.players[ev.cap]) {
          teamStats.players[ev.cap].steals++;
        }
      } else if (ev.type === 'turnover') {
        teamStats.turnovers++;
        if (ev.cap && teamStats.players[ev.cap]) {
          teamStats.players[ev.cap].turnovers++;
        }
      } else if (ev.type === 'block') {
        teamStats.blocks++;
        if (ev.cap && teamStats.players[ev.cap]) {
          teamStats.players[ev.cap].blocks++;
        }
      } else if (ev.type === 'sprint') {
        teamStats.sprintsWon++;
        teamStats.sprintsTotal++;
        oppStats.sprintsTotal++;
        if (ev.cap && teamStats.players[ev.cap]) {
          teamStats.players[ev.cap].sprintsWon++;
        }
      }
    });

    // Compute percentages
    const computePercentages = (t) => {
      // Shooting %
      t.shootingPct = t.totalShots > 0 ? ((t.goals / t.totalShots) * 100).toFixed(1) : '0.0';
      // Man-Up Conversion
      t.manUpPct = t.manUpAttempts > 0 ? ((t.manUpGoals / t.manUpAttempts) * 100).toFixed(1) : '0.0';
      // Penalty Conversion
      t.penaltyPct = t.penaltyAttempts > 0 ? ((t.penaltyGoals / t.penaltyAttempts) * 100).toFixed(1) : '0.0';

      // Player shooting accuracy
      Object.values(t.players).forEach(p => {
        p.shotAccuracy = p.shots > 0 ? Math.round((p.goals / p.shots) * 100) : 0;
      });

      // Goalie save percentage
      Object.values(t.goalies).forEach(g => {
        g.savePct = g.shotsFaced > 0 ? ((g.saves / g.shotsFaced) * 100).toFixed(1) : '0.0';
      });
    };

    computePercentages(stats.home);
    computePercentages(stats.away);

    // Calculate Man-Down Penalty Kill % (100% - Opponent Man-Up %)
    stats.home.manDownPct = stats.away.manUpAttempts > 0 
      ? (((stats.away.manUpAttempts - stats.away.manUpGoals) / stats.away.manUpAttempts) * 100).toFixed(1)
      : '100.0';
    stats.away.manDownPct = stats.home.manUpAttempts > 0 
      ? (((stats.home.manUpAttempts - stats.home.manUpGoals) / stats.home.manUpAttempts) * 100).toFixed(1)
      : '100.0';

    return stats;
  }
}

export const state = new MatchState();
