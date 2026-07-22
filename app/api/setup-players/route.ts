import { NextResponse } from 'next/server';
import { getNFLRosters } from '../../../utils/nflApi';
import { supabase } from '../../../utils/supabase';

export async function GET() {
  try {
    console.log("Fetching all rosters from RapidAPI...");
    const teamsWithRosters = await getNFLRosters();

    const allPlayers: any[] = [];

    // 1. Loop through every team
    teamsWithRosters.forEach((team: any) => {
      
      // 2. Look at every single item inside the team
      Object.values(team).forEach((item: any) => {
        
        // 3. Is this item a box (an object)?
        if (item && typeof item === 'object') {
          
          // Case A: Is the item ITSELF a player?
          if (item.playerID) {
            allPlayers.push({
              player_id: item.playerID,
              name: item.longName || item.espnName,
              team_abv: item.team || team.teamAbv,
              position: item.pos
            });
          } 
          
          // Case B: Is the item a DICTIONARY holding a bunch of players? (This is what Tank01 did!)
          else {
            // Open the dictionary and look at the sub-items inside it
            Object.values(item).forEach((subItem: any) => {
              if (subItem && typeof subItem === 'object' && subItem.playerID) {
                // We found the players! Toss them in the bucket.
                allPlayers.push({
                  player_id: subItem.playerID,
                  name: subItem.longName || subItem.espnName,
                  team_abv: subItem.team || team.teamAbv,
                  position: subItem.pos
                });
              }
            });
          }

        }
      });
    });

    console.log(`Formatted ${allPlayers.length} players. Saving to Supabase...`);

    // Insert all players into Supabase!
    const { error } = await supabase
      .from('players')
      .upsert(allPlayers);

    if (error) {
      throw error;
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully saved ${allPlayers.length} players to Supabase!` 
    });

  } catch (error: any) {
    console.error("Error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}