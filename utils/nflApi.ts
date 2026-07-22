// utils/nflApi.ts

// 1. YOUR API BADGE
// This attaches your secret RapidAPI key to every request.
const options = {
  method: 'GET',
  headers: {
    'X-RapidAPI-Key': '37671a795dmsh9ef5497d0c35606p1d311ejsn770aa979fe9f',
    'X-RapidAPI-Host': 'tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com'
  }
};

// ---------------------------------------------------------
// FETCH 1: GET ALL 32 NFL TEAMS
// ---------------------------------------------------------
export async function getNFLTeams() {
  const response = await fetch('https://tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com/getNFLTeams?rosters=false&schedules=false', options);
  const data = await response.json();
  return data.body;
}

// ---------------------------------------------------------
// FETCH 2: GET ROSTER FOR A SPECIFIC TEAM (Players)
// e.g., You pass in "KC" to get all Chiefs players
// ---------------------------------------------------------
export async function getTeamRoster(teamAbv: string) {
  const url = `https://tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com/getNFLTeamRoster?teamAbv=${teamAbv}`;
  const response = await fetch(url, options);
  const data = await response.json();
  return data.body;
}

// ---------------------------------------------------------
// FETCH 3: GET THE NFL SCHEDULE
// You pass in the week number to get all the games this week (1-18)
// ---------------------------------------------------------
export async function getNFLSchedule(weekNumber: number) {
  const response = await fetch(`https://tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com/getNFLGamesForWeek?week=${weekNumber}`, options);
  const data = await response.json();
  return data.body;
}

// ---------------------------------------------------------
// FETCH 4: GET PLAYER INJURIES
// ---------------------------------------------------------
export async function getNFLInjuries() {
  const response = await fetch('https://tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com/getNFLInjuries', options);
  const data = await response.json();
  return data.body;
}

// ---------------------------------------------------------
// FETCH 5: GET GAME STATS (Passing yards, touchdowns, etc.)
// ---------------------------------------------------------
export async function getLiveGameStats(gameID: string) {
  const url = `https://tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com/getNFLBoxScore?gameID=${gameID}&fantasyPoints=true`;
  const response = await fetch(url, options);
  const data = await response.json();
  return data.body;
}

// ---------------------------------------------------------
// FETCH 6: GET LIVE NEWS
// ---------------------------------------------------------
export async function getNFLNews() {
  const response = await fetch('https://tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com/getNFLNews', options);
  const data = await response.json();
  return data.body; 
}

// ---------------------------------------------------------
// FETCH 7: GET ALL TEAMS + ALL ROSTERS AT ONCE
// ---------------------------------------------------------
export async function getNFLRosters() {
  // Notice the URL says "rosters=true" here!
  const response = await fetch('https://tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com/getNFLTeams?rosters=true&schedules=false', options);
  const data = await response.json();
  return data.body;
}

// ---------------------------------------------------------
// FETCH 8: GET HISTORICAL SCHEDULE
// ---------------------------------------------------------
export async function getHistoricalSchedule(week: number, season: string) {
  const url = `https://tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com/getNFLGamesForWeek?week=${week}&season=${season}&seasonType=reg`;
  const response = await fetch(url, options);
  const data = await response.json();
  return data.body;
}
