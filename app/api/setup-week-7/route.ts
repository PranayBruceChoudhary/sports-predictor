import { NextResponse } from 'next/server';
import { getHistoricalSchedule, getLiveGameStats } from '../../../utils/nflApi';
import { supabase } from '../../../utils/supabase';

export async function GET() {
  try {
    const WEEK = 7;
    const SEASON = "2025";

    console.log(`Fetching schedule for Week ${WEEK} of ${SEASON}...`);
    const schedule = await getHistoricalSchedule(WEEK, SEASON);

    // --- THE FIX: We added .limit(5000) so Supabase doesn't chop off half the players! ---
    console.log("Fetching player positions from our own database...");
    const { data: dbPlayers, error: dbError } = await supabase
      .from('players')
      .select('player_id, position')
      .limit(5000); 

    if (dbError) throw dbError;
    
    // Create a fast dictionary (Forcing strings so the IDs match perfectly)
    const positionMap = new Map();
    if (dbPlayers) {
      dbPlayers.forEach((p: any) => positionMap.set(String(p.player_id), p.position));
    }

    const scheduleData: any[] = [];
    const teamStatsData: any[] = [];
    const playerStatsData: any[] = [];
    
    const uniquePlayersMap = new Map();

    for (const game of schedule) {
      console.log(`Fetching box score for game: ${game.home} vs ${game.away}...`);
      const boxScore = await getLiveGameStats(game.gameID);

      if (!boxScore) continue;

      // 1. THE SCHEDULE DATA
      const homeScore = parseInt(boxScore.homePts || "0");
      const awayScore = parseInt(boxScore.awayPts || "0");

      scheduleData.push({
        game_id: game.gameID,
        week_number: WEEK,
        home_team: game.home,
        away_team: game.away,
        home_score: homeScore,
        away_score: awayScore,
        game_status: "Completed"
      });

      // 2. THE TEAM STATS
      const homeTurnoversForced = parseInt(boxScore.teamStats?.away?.turnovers || "0");
      const awayTurnoversForced = parseInt(boxScore.teamStats?.home?.turnovers || "0");
      const homeSacks = parseInt(boxScore.DST?.home?.sacks || "0");
      const awaySacks = parseInt(boxScore.DST?.away?.sacks || "0");

      teamStatsData.push({
        stat_id: `${game.home}-Wk${WEEK}-${SEASON}`,
        team_abv: game.home,
        week_number: WEEK,
        points_scored: homeScore,
        points_allowed: awayScore,
        sacks: homeSacks,
        turnovers_forced: homeTurnoversForced
      });

      teamStatsData.push({
        stat_id: `${game.away}-Wk${WEEK}-${SEASON}`,
        team_abv: game.away,
        week_number: WEEK,
        points_scored: awayScore,
        points_allowed: homeScore,
        sacks: awaySacks,
        turnovers_forced: awayTurnoversForced
      });

      // 3. THE PLAYER STATS
      if (boxScore.playerStats) {
        Object.values(boxScore.playerStats).forEach((player: any) => {
          
          const playerName = player.longName || player.espnName || "Unknown Player";
          const playerIDStr = String(player.playerID);
          
          // Look up the position in our map
          const playerPosition = positionMap.get(playerIDStr) || "UNK";

          // --- THE SAFETY LOCK --- 
          // ONLY add to uniquePlayersMap if they are completely missing from the DB!
          if (player.playerID && !positionMap.has(playerIDStr)) {
            uniquePlayersMap.set(playerIDStr, {
              player_id: player.playerID,
              name: playerName,
              team_abv: player.teamAbv || player.team || game.home, 
              position: "UNK" // We only do this for retired/missing players
            });
          }

          const passYds = parseInt(player.Passing?.passYds || "0");
          const passTD = parseInt(player.Passing?.passTD || "0");
          const rushYds = parseInt(player.Rushing?.rushYds || "0");
          const recYds = parseInt(player.Receiving?.recYds || "0");
          const recTD = parseInt(player.Receiving?.recTD || "0");

          if (passYds > 0 || rushYds > 0 || recYds > 0 || passTD > 0 || recTD > 0) {
            playerStatsData.push({
              stat_id: `${player.playerID}-Wk${WEEK}-${SEASON}`,
              player_id: player.playerID,
              week_number: WEEK,
              player_name: playerName,
              position: playerPosition,
              passing_yards: passYds,
              rushing_yards: rushYds,
              receiving_yards: recYds,
              touchdowns_caught: recTD,
              touchdowns_thrown: passTD
            });
          }
        });
      }
    }

    console.log("All data parsed! Saving to Supabase...");

    // Only upsert the completely missing players (This stops the DB from being overwritten!)
    const newPlayersToSave = Array.from(uniquePlayersMap.values());
    if (newPlayersToSave.length > 0) {
      const { error: newPlayersError } = await supabase.from('players').upsert(newPlayersToSave);
      if (newPlayersError) throw newPlayersError;
    }

    const { error: scheduleError } = await supabase.from('weekly_schedule').upsert(scheduleData);
    if (scheduleError) throw scheduleError;

    const { error: teamError } = await supabase.from('team_weekly_stats').upsert(teamStatsData);
    if (teamError) throw teamError;

    const { error: playerError } = await supabase.from('player_weekly_stats').upsert(playerStatsData);
    if (playerError) throw playerError;

    return NextResponse.json({ 
      success: true, 
      message: `Successfully saved ${scheduleData.length} games, ${teamStatsData.length} team stats, and ${playerStatsData.length} player stats for Week ${WEEK}!` 
    });

  } catch (error: any) {
    console.error("Error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}