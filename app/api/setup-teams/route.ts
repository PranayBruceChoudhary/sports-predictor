import { NextResponse } from 'next/server';
import { getNFLTeams } from '../../../utils/nflApi';
import { supabase } from '../../../utils/supabase';

// This GET function runs whenever someone visits this specific URL
export async function GET() {
  try {
    // 1. Fetch the data from RapidAPI
    console.log("Fetching teams from RapidAPI...");
    const liveTeams = await getNFLTeams();

    // 2. Reformat the data so it perfectly matches your Supabase columns
    const formattedTeams = liveTeams.map((team: any) => ({
      team_abv: team.teamAbv,
      city: team.teamCity,
      conference: team.conferenceAbv,
      team_name: team.teamName,
      division: team.division
    }));

    // 3. Insert them into Supabase! (Upsert means Insert, or Update if they already exist)
    console.log("Saving to Supabase...");
    const { error } = await supabase
      .from('teams')
      .upsert(formattedTeams);

    // If Supabase yells at us, throw an error
    if (error) {
      throw error;
    }

    // 4. Tell the browser it worked!
    return NextResponse.json({ 
      success: true, 
      message: `Successfully saved ${formattedTeams.length} teams to Supabase!` 
    });

  } catch (error: any) {
    console.error("Error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}