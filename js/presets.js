/**
 * Presets and Match Templates for Damien High School Water Polo Tracker
 * Official Colors: Damien Green (#0d3b2e, #13442a) and Spartan Gold (#FFB81C)
 * League: Baseline League / CIF Southern Section
 */

export const PRESET_MATCHES = {
  damien_cif_final: {
    id: 'match_damien_baseline_final',
    title: 'CIF-SS Division 1 Championship Final',
    tournament: 'CIF Southern Section - Boys Water Polo',
    location: 'Woollett Aquatic Center, Irvine CA',
    date: '2024-11-16',
    ruleSet: 'NFHS_CIF', // 4x7min, 30s shot clock, 20s exclusion
    quarterLengthSec: 420, // 7:00 CIF Varsity
    shotClockSec: 30,
    exclusionSec: 20,
    currentQuarter: 4,
    clockSec: 0,
    isFinal: true,
    homeTeam: {
      id: 'team_damien',
      name: 'Damien Spartans',
      shortName: 'DHS',
      mascot: 'Spartans',
      capColor: '#0e3d2f',
      capTextColor: '#ffb81c',
      score: 13,
      timeoutsRemaining: 1,
      roster: [
        { cap: 1, name: 'Chase Peterson', pos: 'GK', isStarter: true, isGk: true },
        { cap: 2, name: 'Brayden Taylor', pos: 'Driver', isStarter: true },
        { cap: 3, name: 'Lucas Hernandez', pos: 'Attacker', isStarter: true },
        { cap: 4, name: 'Cole Miller', pos: 'Center Defender', isStarter: true },
        { cap: 5, name: 'Mason Vance', pos: 'Attacker', isStarter: true },
        { cap: 6, name: 'Brody Reynolds', pos: 'Driver', isStarter: true },
        { cap: 7, name: 'Dominic Varese', pos: 'Center (C)', isStarter: true },
        { cap: 8, name: 'Gavin O\'Keefe', pos: 'Attacker', isStarter: false },
        { cap: 9, name: 'Christian Silva', pos: 'Defender', isStarter: false },
        { cap: 10, name: 'Austin Bradley', pos: 'Driver', isStarter: false },
        { cap: 11, name: 'Logan Chen', pos: 'Attacker', isStarter: false },
        { cap: 12, name: 'Wyatt Adams', pos: 'Center', isStarter: false },
        { cap: 13, name: 'Nate Gallagher', pos: 'GK', isStarter: false, isGk: true }
      ]
    },
    awayTeam: {
      id: 'team_los_osos',
      name: 'Los Osos Grizzlies',
      shortName: 'LOHS',
      mascot: 'Grizzlies',
      capColor: '#1e3a8a',
      capTextColor: '#ffffff',
      score: 11,
      timeoutsRemaining: 0,
      roster: [
        { cap: 1, name: 'Tyler Reed', pos: 'GK', isStarter: true, isGk: true },
        { cap: 2, name: 'Brandon Cole', pos: 'Attacker', isStarter: true },
        { cap: 3, name: 'Jackson Smith', pos: 'Driver', isStarter: true },
        { cap: 4, name: 'Kyle Davis', pos: 'Center', isStarter: true },
        { cap: 5, name: 'Ethan Morales', pos: 'Defender', isStarter: true },
        { cap: 6, name: 'Ryan Murphy', pos: 'Attacker', isStarter: true },
        { cap: 7, name: 'Justin Bell', pos: 'Driver (C)', isStarter: true },
        { cap: 8, name: 'Dylan Price', pos: 'Attacker', isStarter: false },
        { cap: 9, name: 'Sammy Cruz', pos: 'Center', isStarter: false },
        { cap: 10, name: 'Owen Ward', pos: 'Defender', isStarter: false },
        { cap: 11, name: 'Alex Foster', pos: 'Driver', isStarter: false },
        { cap: 13, name: 'Carter Ross', pos: 'GK', isStarter: false, isGk: true }
      ]
    },
    events: [
      { id: 'ev_d1', q: 1, timeSec: 412, timeStr: '6:52', team: 'home', cap: 2, type: 'sprint', desc: 'Sprint won by Damien #2 Brayden Taylor', isGoal: false },
      { id: 'ev_d2', q: 1, timeSec: 385, timeStr: '6:25', team: 'away', cap: 4, type: 'exclusion', desc: 'Exclusion on Los Osos #4 Kyle Davis (20s ejection)', drawnByCap: 7, isGoal: false },
      { id: 'ev_d3', q: 1, timeSec: 372, timeStr: '6:12', team: 'home', cap: 5, type: 'goal', desc: 'GOAL! Damien #5 Mason Vance (6-on-5 Spartan Power Play)', assistCap: 3, shotType: '6on5', poolX: 35, poolY: 55, targetZone: 'top_right', isGoal: true, homeScore: 1, awayScore: 0 },
      { id: 'ev_d4', q: 1, timeSec: 330, timeStr: '5:30', team: 'away', cap: 7, type: 'goal', desc: 'GOAL! Los Osos #7 Justin Bell (Perimeter Drive)', assistCap: 2, shotType: 'perimeter', poolX: 62, poolY: 48, targetZone: 'bottom_left', isGoal: true, homeScore: 1, awayScore: 1 },
      { id: 'ev_d5', q: 1, timeSec: 280, timeStr: '4:40', team: 'home', cap: 7, type: 'penalty_drawn', desc: '5m Penalty drawn by Damien #7 Dominic Varese', foulCap: 5, isGoal: false },
      { id: 'ev_d6', q: 1, timeSec: 278, timeStr: '4:38', team: 'home', cap: 7, type: 'goal', desc: 'GOAL! Damien #7 Dominic Varese (5m Penalty Rocket)', shotType: 'penalty', poolX: 50, poolY: 40, targetZone: 'top_left', isGoal: true, homeScore: 2, awayScore: 1 },
      { id: 'ev_d7', q: 1, timeSec: 210, timeStr: '3:30', team: 'away', cap: 2, type: 'save', desc: 'Shot by Los Osos SAVED by Damien #1 Chase Peterson', goalieCap: 1, poolX: 42, poolY: 58, targetZone: 'mid_center', isGoal: false },
      { id: 'ev_d8', q: 1, timeSec: 150, timeStr: '2:30', team: 'home', cap: 7, type: 'goal', desc: 'GOAL! Damien #7 Dominic Varese (2m Hole Set Backhand)', assistCap: 6, shotType: 'center', poolX: 50, poolY: 78, targetZone: 'bottom_right', isGoal: true, homeScore: 3, awayScore: 1 },
      { id: 'ev_d9', q: 1, timeSec: 45, timeStr: '0:45', team: 'home', cap: 3, type: 'goal', desc: 'GOAL! Damien #3 Lucas Hernandez (Counter Attack Fast Break)', assistCap: 2, shotType: 'counter', poolX: 30, poolY: 65, targetZone: 'bottom_left', isGoal: true, homeScore: 4, awayScore: 1 },

      { id: 'ev_d10', q: 2, timeSec: 412, timeStr: '6:52', team: 'home', cap: 2, type: 'sprint', desc: 'Sprint won by Damien #2 Brayden Taylor', isGoal: false },
      { id: 'ev_d11', q: 2, timeSec: 370, timeStr: '6:10', team: 'away', cap: 2, type: 'goal', desc: 'GOAL! Los Osos #2 Brandon Cole (Action Shot)', shotType: 'action', poolX: 68, poolY: 46, targetZone: 'top_right', isGoal: true, homeScore: 4, awayScore: 2 },
      { id: 'ev_d12', q: 2, timeSec: 310, timeStr: '5:10', team: 'home', cap: 2, type: 'goal', desc: 'GOAL! Damien #2 Brayden Taylor (Drive & Lob into Far Corner)', assistCap: 7, shotType: 'lob', poolX: 44, poolY: 66, targetZone: 'top_right', isGoal: true, homeScore: 5, awayScore: 2 },
      { id: 'ev_d13', q: 2, timeSec: 240, timeStr: '4:00', team: 'away', cap: 4, type: 'goal', desc: 'GOAL! Los Osos #4 Kyle Davis (6-on-5 Man Up)', assistCap: 7, shotType: '6on5', poolX: 52, poolY: 80, targetZone: 'bottom_center', isGoal: true, homeScore: 5, awayScore: 3 },
      { id: 'ev_d14', q: 2, timeSec: 180, timeStr: '3:00', team: 'home', cap: 5, type: 'goal', desc: 'GOAL! Damien #5 Mason Vance (Perimeter Skip)', assistCap: 4, shotType: 'perimeter', poolX: 32, poolY: 50, targetZone: 'top_left', isGoal: true, homeScore: 6, awayScore: 3 },
      { id: 'ev_d15', q: 2, timeSec: 60, timeStr: '1:00', team: 'away', cap: 6, type: 'goal', desc: 'GOAL! Los Osos #6 Ryan Murphy (6m Direct Shot)', shotType: 'perimeter', poolX: 72, poolY: 52, targetZone: 'bottom_left', isGoal: true, homeScore: 6, awayScore: 4 },

      { id: 'ev_d16', q: 3, timeSec: 412, timeStr: '6:52', team: 'home', cap: 6, type: 'sprint', desc: 'Sprint won by Damien #6 Brody Reynolds', isGoal: false },
      { id: 'ev_d17', q: 3, timeSec: 370, timeStr: '6:10', team: 'home', cap: 7, type: 'goal', desc: 'GOAL! Damien #7 Dominic Varese (Hole Set Turn & Finish)', assistCap: 5, shotType: 'center', poolX: 48, poolY: 82, targetZone: 'bottom_right', isGoal: true, homeScore: 7, awayScore: 4 },
      { id: 'ev_d18', q: 3, timeSec: 310, timeStr: '5:10', team: 'away', cap: 7, type: 'goal', desc: 'GOAL! Los Osos #7 Justin Bell (5m Penalty)', shotType: 'penalty', poolX: 50, poolY: 40, targetZone: 'bottom_right', isGoal: true, homeScore: 7, awayScore: 5 },
      { id: 'ev_d19', q: 3, timeSec: 250, timeStr: '4:10', team: 'home', cap: 8, type: 'goal', desc: 'GOAL! Damien #8 Gavin O\'Keefe (Corner Drive)', assistCap: 2, shotType: 'perimeter', poolX: 65, poolY: 48, targetZone: 'top_right', isGoal: true, homeScore: 8, awayScore: 5 },
      { id: 'ev_d20', q: 3, timeSec: 180, timeStr: '3:00', team: 'away', cap: 3, type: 'goal', desc: 'GOAL! Los Osos #3 Jackson Smith (Counter Attack)', assistCap: 1, shotType: 'counter', poolX: 40, poolY: 68, targetZone: 'bottom_center', isGoal: true, homeScore: 8, awayScore: 6 },
      { id: 'ev_d21', q: 3, timeSec: 90, timeStr: '1:30', team: 'home', cap: 3, type: 'goal', desc: 'GOAL! Damien #3 Lucas Hernandez (6-on-5 Post Tip)', assistCap: 7, shotType: '6on5', poolX: 38, poolY: 60, targetZone: 'top_left', isGoal: true, homeScore: 9, awayScore: 6 },

      { id: 'ev_d22', q: 4, timeSec: 412, timeStr: '6:52', team: 'away', cap: 7, type: 'sprint', desc: 'Sprint won by Los Osos #7 Justin Bell', isGoal: false },
      { id: 'ev_d23', q: 4, timeSec: 360, timeStr: '6:00', team: 'away', cap: 2, type: 'goal', desc: 'GOAL! Los Osos #2 Brandon Cole (Perimeter Shot)', assistCap: 7, shotType: 'perimeter', poolX: 68, poolY: 46, targetZone: 'top_right', isGoal: true, homeScore: 9, awayScore: 7 },
      { id: 'ev_d24', q: 4, timeSec: 310, timeStr: '5:10', team: 'home', cap: 5, type: 'goal', desc: 'GOAL! Damien #5 Mason Vance (Clutch Spartan 6m Bullet)', assistCap: 3, shotType: 'perimeter', poolX: 34, poolY: 52, targetZone: 'top_left', isGoal: true, homeScore: 10, awayScore: 7 },
      { id: 'ev_d25', q: 4, timeSec: 250, timeStr: '4:10', team: 'away', cap: 7, type: 'goal', desc: 'GOAL! Los Osos #7 Justin Bell (Action Shot)', shotType: 'action', poolX: 42, poolY: 56, targetZone: 'bottom_right', isGoal: true, homeScore: 10, awayScore: 8 },
      { id: 'ev_d26', q: 4, timeSec: 190, timeStr: '3:10', team: 'home', cap: 7, type: 'goal', desc: 'GOAL! Damien #7 Dominic Varese (Hat Trick+1: 2m Sweep)', assistCap: 2, shotType: 'center', poolX: 50, poolY: 78, targetZone: 'bottom_right', isGoal: true, homeScore: 11, awayScore: 8 },
      { id: 'ev_d27', q: 4, timeSec: 130, timeStr: '2:10', team: 'away', cap: 4, type: 'goal', desc: 'GOAL! Los Osos #4 Kyle Davis (6-on-5 Goal)', assistCap: 2, shotType: '6on5', poolX: 30, poolY: 58, targetZone: 'top_center', isGoal: true, homeScore: 11, awayScore: 9 },
      { id: 'ev_d28', q: 4, timeSec: 85, timeStr: '1:25', team: 'home', cap: 2, type: 'goal', desc: 'GOAL! Damien #2 Brayden Taylor (Game Sealing Drive)', assistCap: 4, shotType: 'action', poolX: 44, poolY: 66, targetZone: 'top_right', isGoal: true, homeScore: 12, awayScore: 9 },
      { id: 'ev_d29', q: 4, timeSec: 45, timeStr: '0:45', team: 'away', cap: 2, type: 'goal', desc: 'GOAL! Los Osos #2 Brandon Cole', shotType: 'perimeter', poolX: 65, poolY: 50, targetZone: 'top_right', isGoal: true, homeScore: 12, awayScore: 10 },
      { id: 'ev_d30', q: 4, timeSec: 15, timeStr: '0:15', team: 'home', cap: 6, type: 'goal', desc: 'GOAL! Damien #6 Brody Reynolds (Empty Net / Counter Finish)', shotType: 'counter', poolX: 30, poolY: 65, targetZone: 'bottom_left', isGoal: true, homeScore: 13, awayScore: 10 },
      { id: 'ev_d31', q: 4, timeSec: 3, timeStr: '0:03', team: 'away', cap: 7, type: 'goal', desc: 'GOAL! Los Osos #7 Justin Bell (Consolation Goal at Buzzer)', shotType: 'action', poolX: 50, poolY: 45, targetZone: 'top_center', isGoal: true, homeScore: 13, awayScore: 11 }
    ]
  },

  olympic_final: {
    id: 'match_olympic_final_2024',
    title: 'World Aquatics Championship Final',
    tournament: 'Olympic Games - Gold Medal Match',
    location: 'Paris Aquatic Center',
    date: '2024-08-11',
    ruleSet: 'WorldAquatics',
    quarterLengthSec: 480,
    shotClockSec: 30,
    exclusionSec: 20,
    currentQuarter: 4,
    clockSec: 0,
    isFinal: true,
    homeTeam: {
      id: 'team_usa',
      name: 'United States',
      shortName: 'USA',
      capColor: '#ffffff',
      capTextColor: '#002b66',
      score: 11,
      timeoutsRemaining: 1,
      roster: [
        { cap: 1, name: 'Adrian Weinberg', pos: 'GK', isStarter: true, isGk: true },
        { cap: 2, name: 'Johnny Hooper', pos: 'Driver', isStarter: true },
        { cap: 3, name: 'Marko Vavic', pos: 'Attacker', isStarter: true },
        { cap: 4, name: 'Alex Obert', pos: 'Center', isStarter: true },
        { cap: 5, name: 'Hannes Daube', pos: 'Attacker', isStarter: true },
        { cap: 6, name: 'Luca Cupido', pos: 'Driver', isStarter: true },
        { cap: 7, name: 'Ben Hallock', pos: 'Center (C)', isStarter: true },
        { cap: 8, name: 'Dylan Woodhead', pos: 'Defender', isStarter: false },
        { cap: 9, name: 'Alex Bowen', pos: 'Attacker', isStarter: false },
        { cap: 10, name: 'Chase Dodd', pos: 'Driver', isStarter: false },
        { cap: 11, name: 'Ryder Dodd', pos: 'Attacker', isStarter: false },
        { cap: 12, name: 'Max Irving', pos: 'Driver', isStarter: false },
        { cap: 13, name: 'Drew Holland', pos: 'GK', isStarter: false, isGk: true }
      ]
    },
    awayTeam: {
      id: 'team_hungary',
      name: 'Hungary',
      shortName: 'HUN',
      capColor: '#1b4d3e',
      capTextColor: '#ffffff',
      score: 10,
      timeoutsRemaining: 0,
      roster: [
        { cap: 1, name: 'Soma Vogel', pos: 'GK', isStarter: true, isGk: true },
        { cap: 2, name: 'Daniel Angyal', pos: 'Defender', isStarter: true },
        { cap: 3, name: 'Krisztian Manhercz', pos: 'Attacker', isStarter: true },
        { cap: 4, name: 'Erik Molnar', pos: 'Defender', isStarter: true },
        { cap: 5, name: 'Marton Vamos', pos: 'Attacker', isStarter: true },
        { cap: 6, name: 'Adam Nagy', pos: 'Driver', isStarter: true },
        { cap: 7, name: 'Gergo Zalanki', pos: 'Attacker (C)', isStarter: true },
        { cap: 8, name: 'Gergo Fekete', pos: 'Driver', isStarter: false },
        { cap: 9, name: 'Toni Nemet', pos: 'Center', isStarter: false },
        { cap: 10, name: 'Denes Varga', pos: 'Attacker', isStarter: false },
        { cap: 11, name: 'Szilard Jansik', pos: 'Defender', isStarter: false },
        { cap: 12, name: 'Vince Vigvari', pos: 'Driver', isStarter: false },
        { cap: 13, name: 'Mark Banyai', pos: 'GK', isStarter: false, isGk: true }
      ]
    },
    events: [
      { id: 'ev_1', q: 1, timeSec: 472, timeStr: '7:52', team: 'home', cap: 2, type: 'sprint', desc: 'Sprint won by USA #2 Johnny Hooper', isGoal: false },
      { id: 'ev_2', q: 1, timeSec: 445, timeStr: '7:25', team: 'away', cap: 4, type: 'exclusion', desc: 'Exclusion on HUN #4 Erik Molnar (20s ejection)', drawnByCap: 7, isGoal: false },
      { id: 'ev_3', q: 1, timeSec: 432, timeStr: '7:12', team: 'home', cap: 5, type: 'goal', desc: 'GOAL! USA #5 Hannes Daube (6-on-5 Man Up)', assistCap: 3, shotType: '6on5', poolX: 35, poolY: 55, targetZone: 'top_right', isGoal: true, homeScore: 1, awayScore: 0 },
      { id: 'ev_4', q: 1, timeSec: 400, timeStr: '6:40', team: 'away', cap: 7, type: 'goal', desc: 'GOAL! HUN #7 Gergo Zalanki (Perimeter Action Shot)', assistCap: 3, shotType: 'perimeter', poolX: 62, poolY: 48, targetZone: 'bottom_left', isGoal: true, homeScore: 1, awayScore: 1 }
    ]
  }
};

export function createNewMatchTemplate(homeName = 'Damien Spartans', awayName = 'Opponent') {
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
      roster: [
        { cap: 1, name: 'Goalie (DHS)', pos: 'GK', isStarter: true, isGk: true },
        { cap: 2, name: 'Player 2', pos: 'Driver', isStarter: true },
        { cap: 3, name: 'Player 3', pos: 'Attacker', isStarter: true },
        { cap: 4, name: 'Player 4', pos: 'Defender', isStarter: true },
        { cap: 5, name: 'Player 5', pos: 'Attacker', isStarter: true },
        { cap: 6, name: 'Player 6', pos: 'Driver', isStarter: true },
        { cap: 7, name: 'Player 7', pos: 'Center', isStarter: true },
        { cap: 8, name: 'Player 8', pos: 'Driver', isStarter: false },
        { cap: 9, name: 'Player 9', pos: 'Attacker', isStarter: false },
        { cap: 10, name: 'Player 10', pos: 'Defender', isStarter: false },
        { cap: 11, name: 'Player 11', pos: 'Center', isStarter: false },
        { cap: 12, name: 'Player 12', pos: 'Driver', isStarter: false },
        { cap: 13, name: 'Backup Goalie', pos: 'GK', isStarter: false, isGk: true }
      ]
    },
    awayTeam: {
      id: 'team_away_' + Date.now(),
      name: awayName,
      shortName: awayName.substring(0, 4).toUpperCase(),
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
        { cap: 10, name: 'Player 10', pos: 'Defender', isStarter: false },
        { cap: 11, name: 'Player 11', pos: 'Center', isStarter: false },
        { cap: 12, name: 'Player 12', pos: 'Driver', isStarter: false },
        { cap: 13, name: 'Backup Goalie', pos: 'GK', isStarter: false, isGk: true }
      ]
    },
    events: []
  };
}
