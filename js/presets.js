/**
 * Presets and Official Roster Templates for Damien High School Water Polo Tracker
 * Source: Official Damien Varsity WaterPolo Stats Sheet (Google Sheets: 1TFs_XI1Zpe2S5x8X_VXk0SlU1ZXXIMTsWMzhej8PYe4)
 */

export const DAMIEN_VARSITY_ROSTER = [
  { cap: 1, name: 'Brennan Dallas', pos: 'GK', isStarter: true, isGk: true },
  { cap: 2, name: 'Diego Negrete', pos: 'Driver', isStarter: true },
  { cap: 3, name: 'Jacob Hong', pos: 'Attacker', isStarter: true },
  { cap: 4, name: 'Jorge Solis', pos: 'Defender', isStarter: true },
  { cap: 5, name: 'Colin Ferrer', pos: 'Attacker', isStarter: true },
  { cap: 6, name: 'Christian Chacon', pos: 'Driver', isStarter: true },
  { cap: 7, name: 'Maddox Redfearn', pos: 'Center (C)', isStarter: true },
  { cap: 8, name: 'Jonathan Jimenez', pos: 'Attacker', isStarter: false },
  { cap: 9, name: 'Kiki Gore', pos: 'Defender', isStarter: false },
  { cap: 10, name: 'Niko Echieverria', pos: 'Driver', isStarter: false },
  { cap: 11, name: 'Luke German', pos: 'Attacker', isStarter: false },
  { cap: 12, name: 'David Vicario', pos: 'Center', isStarter: false },
  { cap: 13, name: 'Joseph Summers', pos: 'GK', isStarter: false, isGk: true },
  { cap: 14, name: 'Landen Garcia', pos: 'Attacker', isStarter: false },
  { cap: 15, name: 'Logan Diaz', pos: 'Defender', isStarter: false },
  { cap: 16, name: 'Aaron Fulmer', pos: 'Defender', isStarter: false },
  { cap: 19, name: 'Diego Solis', pos: 'Center', isStarter: false }
];

export function createBlankMatch(homeName = 'Damien Spartans', awayName = 'Opponent') {
  return {
    id: 'match_' + Date.now(),
    title: `${homeName} vs ${awayName}`,
    tournament: 'CIF Baseline League Match',
    location: 'Damien Aquatic Complex, La Verne CA',
    date: new Date().toISOString().split('T')[0],
    ruleSet: 'NFHS_CIF',
    quarterLengthSec: 420, // 7:00 CIF Varsity
    shotClockSec: 30,
    exclusionSec: 20,
    currentQuarter: 1,
    clockSec: 420,
    isFinal: false,
    homeTeam: {
      id: 'team_home_' + Date.now(),
      name: homeName,
      shortName: 'DHS',
      mascot: 'Spartans',
      capColor: '#0e3d2f',
      capTextColor: '#ffb81c',
      score: 0,
      timeoutsRemaining: 2,
      roster: JSON.parse(JSON.stringify(DAMIEN_VARSITY_ROSTER))
    },
    awayTeam: {
      id: 'team_away_' + Date.now(),
      name: awayName,
      shortName: awayName.substring(0, 4).toUpperCase(),
      mascot: 'Opponent',
      capColor: '#1e3a8a',
      capTextColor: '#ffffff',
      score: 0,
      timeoutsRemaining: 2,
      roster: [
        { cap: 1, name: 'Goalie Away', pos: 'GK', isStarter: true, isGk: true },
        { cap: 2, name: 'Player 2', pos: 'Driver', isStarter: true },
        { cap: 3, name: 'Player 3', pos: 'Attacker', isStarter: true },
        { cap: 4, name: 'Player 4', pos: 'Defender', isStarter: true },
        { cap: 5, name: 'Player 5', pos: 'Attacker', isStarter: true },
        { cap: 6, name: 'Player 6', pos: 'Driver', isStarter: true },
        { cap: 7, name: 'Player 7', pos: 'Center', isStarter: true },
        { cap: 8, name: 'Player 8', pos: 'Driver', isStarter: false },
        { cap: 9, name: 'Player 9', pos: 'Attacker', isStarter: false },
        { cap: 13, name: 'Backup GK', pos: 'GK', isStarter: false, isGk: true }
      ]
    },
    events: []
  };
}

export const PRESET_MATCHES = {
  getting_started_demo: {
    id: 'match_getting_started_demo',
    title: 'Damien Spartans vs Los Osos (CIF Match)',
    tournament: 'CIF Baseline League Varsity',
    location: 'Damien Aquatic Complex, La Verne CA',
    date: new Date().toISOString().split('T')[0],
    ruleSet: 'NFHS_CIF',
    quarterLengthSec: 420,
    shotClockSec: 30,
    exclusionSec: 20,
    currentQuarter: 2,
    clockSec: 240,
    isFinal: false,
    homeTeam: {
      id: 'team_damien_demo',
      name: 'Damien Spartans',
      shortName: 'DHS',
      mascot: 'Spartans',
      capColor: '#0e3d2f',
      capTextColor: '#ffb81c',
      score: 6,
      timeoutsRemaining: 2,
      roster: JSON.parse(JSON.stringify(DAMIEN_VARSITY_ROSTER))
    },
    awayTeam: {
      id: 'team_los_osos_demo',
      name: 'Los Osos Grizzlies',
      shortName: 'LOHS',
      mascot: 'Grizzlies',
      capColor: '#1e3a8a',
      capTextColor: '#ffffff',
      score: 4,
      timeoutsRemaining: 1,
      roster: [
        { cap: 1, name: 'Tyler Reed', pos: 'GK', isStarter: true, isGk: true },
        { cap: 2, name: 'Brandon Cole', pos: 'Attacker', isStarter: true },
        { cap: 3, name: 'Jackson Smith', pos: 'Driver', isStarter: true },
        { cap: 4, name: 'Kyle Davis', pos: 'Center', isStarter: true },
        { cap: 5, name: 'Ethan Morales', pos: 'Defender', isStarter: true },
        { cap: 6, name: 'Ryan Murphy', pos: 'Attacker', isStarter: true },
        { cap: 7, name: 'Justin Bell', pos: 'Driver (C)', isStarter: true },
        { cap: 8, name: 'Dylan Price', pos: 'Attacker', isStarter: false },
        { cap: 13, name: 'Carter Ross', pos: 'GK', isStarter: false, isGk: true }
      ]
    },
    events: [
      { id: 'demo_1', q: 1, timeSec: 412, timeStr: '6:52', team: 'home', cap: 2, type: 'sprint', desc: 'Sprint won by Damien #2 Diego Negrete', isGoal: false },
      { id: 'demo_2', q: 1, timeSec: 372, timeStr: '6:12', team: 'home', cap: 5, type: 'goal', desc: 'GOAL! Damien #5 Colin Ferrer (6-on-5 Man Up)', assistCap: 3, shotType: '6on5', poolX: 35, poolY: 55, targetZone: 'top_right', isGoal: true, homeScore: 1, awayScore: 0 },
      { id: 'demo_3', q: 1, timeSec: 320, timeStr: '5:20', team: 'away', cap: 7, type: 'goal', desc: 'GOAL! Los Osos #7 Justin Bell (Perimeter Shot)', shotType: 'perimeter', poolX: 62, poolY: 48, targetZone: 'bottom_left', isGoal: true, homeScore: 1, awayScore: 1 },
      { id: 'demo_4', q: 1, timeSec: 240, timeStr: '4:00', team: 'home', cap: 7, type: 'goal', desc: 'GOAL! Damien #7 Maddox Redfearn (2m Center Hole Set)', assistCap: 6, shotType: 'center', poolX: 50, poolY: 78, targetZone: 'bottom_right', isGoal: true, homeScore: 2, awayScore: 1 },
      { id: 'demo_5', q: 1, timeSec: 150, timeStr: '2:30', team: 'away', cap: 4, type: 'exclusion', desc: 'Exclusion on Los Osos #4 Kyle Davis (20s ejection)', drawnByCap: 7, isGoal: false },
      { id: 'demo_6', q: 1, timeSec: 138, timeStr: '2:18', team: 'home', cap: 3, type: 'goal', desc: 'GOAL! Damien #3 Jacob Hong (6-on-5 Power Play)', assistCap: 2, shotType: '6on5', poolX: 30, poolY: 65, targetZone: 'bottom_left', isGoal: true, homeScore: 3, awayScore: 1 },
      { id: 'demo_7', q: 2, timeSec: 412, timeStr: '6:52', team: 'home', cap: 2, type: 'sprint', desc: 'Sprint won by Damien #2 Diego Negrete', isGoal: false },
      { id: 'demo_8', q: 2, timeSec: 360, timeStr: '6:00', team: 'away', cap: 2, type: 'goal', desc: 'GOAL! Los Osos #2 Brandon Cole (Action Shot)', shotType: 'action', poolX: 68, poolY: 46, targetZone: 'top_right', isGoal: true, homeScore: 3, awayScore: 2 },
      { id: 'demo_9', q: 2, timeSec: 300, timeStr: '5:00', team: 'home', cap: 7, type: 'goal', desc: 'GOAL! Damien #7 Maddox Redfearn (5m Penalty)', shotType: 'penalty', poolX: 50, poolY: 40, targetZone: 'top_left', isGoal: true, homeScore: 4, awayScore: 2 },
      { id: 'demo_10', q: 2, timeSec: 280, timeStr: '4:40', team: 'away', cap: 4, type: 'goal', desc: 'GOAL! Los Osos #4 Kyle Davis (2m Center Set)', assistCap: 7, shotType: 'center', poolX: 52, poolY: 80, targetZone: 'bottom_center', isGoal: true, homeScore: 4, awayScore: 3 },
      { id: 'demo_11', q: 2, timeSec: 250, timeStr: '4:10', team: 'home', cap: 2, type: 'goal', desc: 'GOAL! Damien #2 Diego Negrete (Drive & Lob Shot)', assistCap: 5, shotType: 'lob', poolX: 44, poolY: 66, targetZone: 'top_right', isGoal: true, homeScore: 5, awayScore: 3 },
      { id: 'demo_12', q: 2, timeSec: 180, timeStr: '3:00', team: 'home', cap: 11, type: 'goal', desc: 'GOAL! Damien #11 Luke German (Perimeter Bullet)', assistCap: 4, shotType: 'action', poolX: 38, poolY: 50, targetZone: 'top_left', isGoal: true, homeScore: 6, awayScore: 3 },
      { id: 'demo_13', q: 2, timeSec: 120, timeStr: '2:00', team: 'away', cap: 6, type: 'goal', desc: 'GOAL! Los Osos #6 Ryan Murphy', shotType: 'action', poolX: 65, poolY: 48, targetZone: 'bottom_right', isGoal: true, homeScore: 6, awayScore: 4 }
    ]
  }
};
