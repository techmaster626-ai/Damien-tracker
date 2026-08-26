/**
 * Presets and Demo Matches for Water Polo Stats Tracker
 * Includes realistic match rosters, historical play-by-play, and template generators.
 */

export const PRESET_MATCHES = {
  olympic_final: {
    id: 'match_olympic_final_2024',
    title: 'World Aquatics Championship Final',
    tournament: 'Olympic Games - Gold Medal Match',
    location: 'Paris Aquatic Center',
    date: '2024-08-11',
    ruleSet: 'WorldAquatics', // 4x8min, 30s shot clock, 20s exclusion
    quarterLengthSec: 480, // 8:00
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
      { id: 'ev_4', q: 1, timeSec: 400, timeStr: '6:40', team: 'away', cap: 7, type: 'goal', desc: 'GOAL! HUN #7 Gergo Zalanki (Perimeter Action Shot)', assistCap: 3, shotType: 'perimeter', poolX: 62, poolY: 48, targetZone: 'bottom_left', isGoal: true, homeScore: 1, awayScore: 1 },
      { id: 'ev_5', q: 1, timeSec: 360, timeStr: '6:00', team: 'home', cap: 7, type: 'penalty_drawn', desc: 'Penalty 5m drawn by USA #7 Ben Hallock', foulCap: 2, isGoal: false },
      { id: 'ev_6', q: 1, timeSec: 358, timeStr: '5:58', team: 'home', cap: 9, type: 'goal', desc: 'GOAL! USA #9 Alex Bowen (5-meter Penalty)', shotType: 'penalty', poolX: 50, poolY: 40, targetZone: 'top_left', isGoal: true, homeScore: 2, awayScore: 1 },
      { id: 'ev_7', q: 1, timeSec: 310, timeStr: '5:10', team: 'away', cap: 3, type: 'save', desc: 'Shot by HUN #3 Krisztian Manhercz SAVED by USA #1 Adrian Weinberg', goalieCap: 1, poolX: 42, poolY: 58, targetZone: 'mid_center', isGoal: false },
      { id: 'ev_8', q: 1, timeSec: 250, timeStr: '4:10', team: 'home', cap: 7, type: 'goal', desc: 'GOAL! USA #7 Ben Hallock (2m Center Hole Set Turn & Backhand)', assistCap: 2, shotType: 'center', poolX: 50, poolY: 78, targetZone: 'bottom_right', isGoal: true, homeScore: 3, awayScore: 1 },
      { id: 'ev_9', q: 1, timeSec: 180, timeStr: '3:00', team: 'away', cap: 10, type: 'goal', desc: 'GOAL! HUN #10 Denes Varga (Lob Shot over Goalie)', assistCap: 7, shotType: 'lob', poolX: 70, poolY: 52, targetZone: 'top_center', isGoal: true, homeScore: 3, awayScore: 2 },
      { id: 'ev_10', q: 1, timeSec: 45, timeStr: '0:45', team: 'home', cap: 11, type: 'goal', desc: 'GOAL! USA #11 Ryder Dodd (Counter Attack Fast Break)', assistCap: 6, shotType: 'counter', poolX: 30, poolY: 65, targetZone: 'bottom_left', isGoal: true, homeScore: 4, awayScore: 2 },
      
      { id: 'ev_11', q: 2, timeSec: 472, timeStr: '7:52', team: 'away', cap: 5, type: 'sprint', desc: 'Sprint won by HUN #5 Marton Vamos', isGoal: false },
      { id: 'ev_12', q: 2, timeSec: 440, timeStr: '7:20', team: 'home', cap: 8, type: 'exclusion', desc: 'Exclusion on USA #8 Dylan Woodhead (20s ejection)', drawnByCap: 9, isGoal: false },
      { id: 'ev_13', q: 2, timeSec: 425, timeStr: '7:05', team: 'away', cap: 5, type: 'goal', desc: 'GOAL! HUN #5 Marton Vamos (6-on-5 Man Up Quick Skip)', assistCap: 7, shotType: '6on5', poolX: 75, poolY: 56, targetZone: 'bottom_right', isGoal: true, homeScore: 4, awayScore: 3 },
      { id: 'ev_14', q: 2, timeSec: 380, timeStr: '6:20', team: 'home', cap: 3, type: 'goal', desc: 'GOAL! USA #3 Marko Vavic (Direct 6m Shot after Foul)', shotType: 'perimeter', poolX: 45, poolY: 46, targetZone: 'top_right', isGoal: true, homeScore: 5, awayScore: 3 },
      { id: 'ev_15', q: 2, timeSec: 310, timeStr: '5:10', team: 'away', cap: 9, type: 'goal', desc: 'GOAL! HUN #9 Toni Nemet (2m Hole Set Power Push)', assistCap: 6, shotType: 'center', poolX: 52, poolY: 80, targetZone: 'bottom_center', isGoal: true, homeScore: 5, awayScore: 4 },
      { id: 'ev_16', q: 2, timeSec: 220, timeStr: '3:40', team: 'home', cap: 2, type: 'steal', desc: 'Steal by USA #2 Johnny Hooper on entry pass', isGoal: false },
      { id: 'ev_17', q: 2, timeSec: 190, timeStr: '3:10', team: 'home', cap: 5, type: 'goal', desc: 'GOAL! USA #5 Hannes Daube (Perimeter Power Blast)', assistCap: 2, shotType: 'perimeter', poolX: 32, poolY: 50, targetZone: 'top_left', isGoal: true, homeScore: 6, awayScore: 4 },
      { id: 'ev_18', q: 2, timeSec: 60, timeStr: '1:00', team: 'away', cap: 7, type: 'goal', desc: 'GOAL! HUN #7 Gergo Zalanki (Cross-Cage Skip Shot)', assistCap: 5, shotType: 'perimeter', poolX: 72, poolY: 52, targetZone: 'bottom_left', isGoal: true, homeScore: 6, awayScore: 5 },

      { id: 'ev_19', q: 3, timeSec: 472, timeStr: '7:52', team: 'home', cap: 6, type: 'sprint', desc: 'Sprint won by USA #6 Luca Cupido', isGoal: false },
      { id: 'ev_20', q: 3, timeSec: 430, timeStr: '7:10', team: 'away', cap: 11, type: 'exclusion', desc: 'Exclusion on HUN #11 Szilard Jansik', drawnByCap: 7, isGoal: false },
      { id: 'ev_21', q: 3, timeSec: 415, timeStr: '6:55', team: 'home', cap: 7, type: 'goal', desc: 'GOAL! USA #7 Ben Hallock (6-on-5 Center Tip-In)', assistCap: 5, shotType: '6on5', poolX: 48, poolY: 82, targetZone: 'bottom_right', isGoal: true, homeScore: 7, awayScore: 5 },
      { id: 'ev_22', q: 3, timeSec: 350, timeStr: '5:50', team: 'away', cap: 3, type: 'goal', desc: 'GOAL! HUN #3 Krisztian Manhercz (Perimeter Drive)', shotType: 'action', poolX: 38, poolY: 60, targetZone: 'top_left', isGoal: true, homeScore: 7, awayScore: 6 },
      { id: 'ev_23', q: 3, timeSec: 280, timeStr: '4:40', team: 'home', cap: 11, type: 'goal', desc: 'GOAL! USA #11 Ryder Dodd (Perimeter Rocket)', assistCap: 9, shotType: 'perimeter', poolX: 65, poolY: 48, targetZone: 'top_right', isGoal: true, homeScore: 8, awayScore: 6 },
      { id: 'ev_24', q: 3, timeSec: 200, timeStr: '3:20', team: 'away', cap: 12, type: 'goal', desc: 'GOAL! HUN #12 Vince Vigvari (Counter Attack Quick Finish)', assistCap: 1, shotType: 'counter', poolX: 40, poolY: 68, targetZone: 'bottom_center', isGoal: true, homeScore: 8, awayScore: 7 },
      { id: 'ev_25', q: 3, timeSec: 110, timeStr: '1:50', team: 'away', cap: 7, type: 'goal', desc: 'GOAL! HUN #7 Gergo Zalanki (5-meter Penalty)', shotType: 'penalty', poolX: 50, poolY: 40, targetZone: 'bottom_right', isGoal: true, homeScore: 8, awayScore: 8 },

      { id: 'ev_26', q: 4, timeSec: 472, timeStr: '7:52', team: 'away', cap: 5, type: 'sprint', desc: 'Sprint won by HUN #5 Marton Vamos', isGoal: false },
      { id: 'ev_27', q: 4, timeSec: 430, timeStr: '7:10', team: 'away', cap: 10, type: 'goal', desc: 'GOAL! HUN #10 Denes Varga (6-on-5 Man Up)', assistCap: 7, shotType: '6on5', poolX: 30, poolY: 58, targetZone: 'top_center', isGoal: true, homeScore: 8, awayScore: 9 },
      { id: 'ev_28', q: 4, timeSec: 360, timeStr: '6:00', team: 'home', cap: 9, type: 'goal', desc: 'GOAL! USA #9 Alex Bowen (Equalizer Perimeter Shot)', assistCap: 2, shotType: 'perimeter', poolX: 68, poolY: 46, targetZone: 'top_right', isGoal: true, homeScore: 9, awayScore: 9 },
      { id: 'ev_29', q: 4, timeSec: 290, timeStr: '4:50', team: 'home', cap: 1, type: 'save', desc: 'Clutch 1-on-1 Save by USA #1 Adrian Weinberg against HUN #5 Vamos', goalieCap: 1, poolX: 68, poolY: 68, targetZone: 'bottom_left', isGoal: false },
      { id: 'ev_30', q: 4, timeSec: 210, timeStr: '3:30', team: 'home', cap: 5, type: 'goal', desc: 'GOAL! USA #5 Hannes Daube (Go-Ahead 6-on-5 Goal)', assistCap: 3, shotType: '6on5', poolX: 34, poolY: 52, targetZone: 'top_left', isGoal: true, homeScore: 10, awayScore: 9 },
      { id: 'ev_31', q: 4, timeSec: 130, timeStr: '2:10', team: 'away', cap: 3, type: 'goal', desc: 'GOAL! HUN #3 Krisztian Manhercz (Equalizer at 2:10)', assistCap: 10, shotType: 'action', poolX: 42, poolY: 56, targetZone: 'bottom_right', isGoal: true, homeScore: 10, awayScore: 10 },
      { id: 'ev_32', q: 4, timeSec: 48, timeStr: '0:48', team: 'home', cap: 2, type: 'goal', desc: 'GOAL! USA #2 Johnny Hooper (Game Winning Drive & Lob into Corner)', assistCap: 7, shotType: 'lob', poolX: 44, poolY: 66, targetZone: 'top_right', isGoal: true, homeScore: 11, awayScore: 10 },
      { id: 'ev_33', q: 4, timeSec: 12, timeStr: '0:12', team: 'home', cap: 1, type: 'save', desc: 'BUZZER BEATING SAVE! USA #1 Adrian Weinberg tips HUN #7 Zalanki shot over crossbar!', goalieCap: 1, poolX: 65, poolY: 50, targetZone: 'top_right', isGoal: false }
    ]
  },

  ncaa_championship: {
    id: 'match_ncaa_final_2024',
    title: 'NCAA Men\'s Water Polo Championship',
    tournament: 'NCAA Division I National Championship',
    location: 'Avery Aquatic Center, Stanford CA',
    date: '2024-12-08',
    ruleSet: 'NCAA',
    quarterLengthSec: 480,
    shotClockSec: 30,
    exclusionSec: 20,
    currentQuarter: 4,
    clockSec: 0,
    isFinal: true,
    homeTeam: {
      id: 'team_stanford',
      name: 'Stanford Cardinal',
      shortName: 'STAN',
      capColor: '#8c1515',
      capTextColor: '#ffffff',
      score: 13,
      timeoutsRemaining: 2,
      roster: [
        { cap: 1, name: 'Liam Harrison', pos: 'GK', isStarter: true, isGk: true },
        { cap: 2, name: 'Soren Jensen', pos: 'Driver', isStarter: true },
        { cap: 3, name: 'Ethan Parrish', pos: 'Attacker', isStarter: true },
        { cap: 4, name: 'Riley Pittman', pos: 'Attacker', isStarter: true },
        { cap: 5, name: 'Jack Martin', pos: 'Center', isStarter: true },
        { cap: 6, name: 'CJ Indart', pos: 'Defender', isStarter: true },
        { cap: 7, name: 'Jackson Painter', pos: 'Attacker (C)', isStarter: true },
        { cap: 8, name: 'Daniel Mnatsakanian', pos: 'Driver', isStarter: false },
        { cap: 9, name: 'Grant Watson', pos: 'Defender', isStarter: false },
        { cap: 10, name: 'Alex Gheorghe', pos: 'Attacker', isStarter: false },
        { cap: 11, name: 'Ben Forer', pos: 'Center', isStarter: false },
        { cap: 13, name: 'West Temkin', pos: 'GK', isStarter: false, isGk: true }
      ]
    },
    awayTeam: {
      id: 'team_ucla',
      name: 'UCLA Bruins',
      shortName: 'UCLA',
      capColor: '#2774ae',
      capTextColor: '#ffd100',
      score: 12,
      timeoutsRemaining: 1,
      roster: [
        { cap: 1, name: 'Garret Griggs', pos: 'GK', isStarter: true, isGk: true },
        { cap: 2, name: 'Makoto Kenney', pos: 'Attacker', isStarter: true },
        { cap: 3, name: 'Frederico Jucá Carsalade', pos: 'Driver', isStarter: true },
        { cap: 4, name: 'Marcell Szécsi', pos: 'Center', isStarter: true },
        { cap: 5, name: 'Chase Dodd', pos: 'Defender', isStarter: true },
        { cap: 6, name: 'Noah Rowe', pos: 'Driver', isStarter: true },
        { cap: 7, name: 'Rafael Real Vergara', pos: 'Attacker (C)', isStarter: true },
        { cap: 8, name: 'Jack Larsen', pos: 'Attacker', isStarter: false },
        { cap: 9, name: 'Gray Carson', pos: 'Defender', isStarter: false },
        { cap: 10, name: 'Ben Liechty', pos: 'Attacker', isStarter: false },
        { cap: 11, name: 'Trey Doten', pos: 'Center', isStarter: false },
        { cap: 13, name: 'Bernardo Maurizi', pos: 'GK', isStarter: false, isGk: true }
      ]
    },
    events: [
      { id: 'ev_ncaa_1', q: 1, timeSec: 472, timeStr: '7:52', team: 'home', cap: 4, type: 'sprint', desc: 'Sprint won by STAN #4 Riley Pittman', isGoal: false },
      { id: 'ev_ncaa_2', q: 1, timeSec: 435, timeStr: '7:15', team: 'home', cap: 7, type: 'goal', desc: 'GOAL! STAN #7 Jackson Painter (6-on-5 Man Up)', assistCap: 4, shotType: '6on5', poolX: 38, poolY: 52, targetZone: 'top_left', isGoal: true, homeScore: 1, awayScore: 0 },
      { id: 'ev_ncaa_3', q: 1, timeSec: 390, timeStr: '6:30', team: 'away', cap: 7, type: 'goal', desc: 'GOAL! UCLA #7 Rafael Real Vergara (5m Penalty)', shotType: 'penalty', poolX: 50, poolY: 40, targetZone: 'bottom_left', isGoal: true, homeScore: 1, awayScore: 1 },
      { id: 'ev_ncaa_4', q: 1, timeSec: 310, timeStr: '5:10', team: 'home', cap: 5, type: 'goal', desc: 'GOAL! STAN #5 Jack Martin (2m Hole Set Sweep)', assistCap: 2, shotType: 'center', poolX: 50, poolY: 80, targetZone: 'bottom_right', isGoal: true, homeScore: 2, awayScore: 1 },
      { id: 'ev_ncaa_5', q: 1, timeSec: 180, timeStr: '3:00', team: 'away', cap: 2, type: 'goal', desc: 'GOAL! UCLA #2 Makoto Kenney (Perimeter Shot)', assistCap: 3, shotType: 'perimeter', poolX: 65, poolY: 48, targetZone: 'top_right', isGoal: true, homeScore: 2, awayScore: 2 }
    ]
  }
};

export function createNewMatchTemplate(homeName = 'Home White', awayName = 'Away Blue') {
  return {
    id: 'match_' + Date.now(),
    title: `${homeName} vs ${awayName}`,
    tournament: 'Match Day',
    location: 'Aquatic Complex',
    date: new Date().toISOString().split('T')[0],
    ruleSet: 'WorldAquatics',
    quarterLengthSec: 480, // 8:00
    shotClockSec: 30,
    exclusionSec: 20,
    currentQuarter: 1,
    clockSec: 480,
    isFinal: false,
    homeTeam: {
      id: 'team_home_' + Date.now(),
      name: homeName,
      shortName: homeName.substring(0, 4).toUpperCase(),
      capColor: '#f8fafc',
      capTextColor: '#0f172a',
      score: 0,
      timeoutsRemaining: 2,
      roster: [
        { cap: 1, name: 'Goalie Home', pos: 'GK', isStarter: true, isGk: true },
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
      capColor: '#0284c7',
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
