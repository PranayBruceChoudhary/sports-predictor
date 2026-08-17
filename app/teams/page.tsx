"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';

export default function TeamsPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  
  const [offenseRoster, setOffenseRoster] = useState<any[]>([]);
  const [defenseRoster, setDefenseRoster] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTeams() {
      const { data } = await supabase.from('teams').select('*').order('city');
      if (data) setTeams(data);
      setLoading(false);
    }
    fetchTeams();
  }, []);

  async function handleTeamClick(team: any) {
    setSelectedTeam(team);
    setOffenseRoster([]);
    setDefenseRoster([]);

    const { data } = await supabase
      .from('players')
      .select(`
        player_id, name, position,
        player_weekly_stats ( passing_yards, rushing_yards, receiving_yards, touchdowns_scored, touchdowns_thrown, tackles, interceptions, sacks, forced_fumbles )
      `)
      .eq('team_abv', team.team_abv); 

    if (data) {
      const offPlayers: any[] = [];
      const defPlayers: any[] = [];
      const defensePositions = ['DE', 'DT', 'NT', 'LB', 'ILB', 'OLB', 'CB', 'S', 'FS', 'SS', 'DB', 'EDGE'];

      data.forEach((player: any) => {
        let passYds = 0, rushYds = 0, recYds = 0, tdScored = 0, tdThrown = 0;
        let totTackles = 0, totInts = 0, totSacks = 0, totFF = 0;

        if (player.player_weekly_stats) {
          player.player_weekly_stats.forEach((week: any) => {
            passYds += week.passing_yards || 0;
            rushYds += week.rushing_yards || 0;
            recYds += week.receiving_yards || 0;
            tdScored += week.touchdowns_scored || 0;
            tdThrown += week.touchdowns_thrown || 0;
            totTackles += week.tackles || 0;
            totInts += week.interceptions || 0;
            totSacks += week.sacks || 0;
            totFF += week.forced_fumbles || 0;
          });
        }

        const calculatedPlayer = {
          ...player,
          totalPassYds: passYds, totalRushYds: rushYds, totalRecYds: recYds,
          totalTdScored: tdScored, totalTdThrown: tdThrown,
          totalTackles: totTackles, totalInts: totInts, totalSacks: totSacks, totalFF: totFF
        };

        if (defensePositions.includes(player.position) || (player.position === 'UNK' && totTackles > 0)) {
          defPlayers.push(calculatedPlayer);
        } else {
          offPlayers.push(calculatedPlayer);
        }
      });

      offPlayers.sort((a, b) => {
        const aYards = a.totalPassYds + a.totalRushYds + a.totalRecYds;
        const bYards = b.totalPassYds + b.totalRushYds + b.totalRecYds;
        if (bYards === aYards) return a.name.localeCompare(b.name);
        return bYards - aYards;
      });

      defPlayers.sort((a, b) => {
        if (b.totalTackles === a.totalTackles) return b.totalSacks - a.totalSacks;
        return b.totalTackles - a.totalTackles;
      });

      setOffenseRoster(offPlayers);
      setDefenseRoster(defPlayers);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-4xl font-bold text-center text-blue-900 mb-8">NFL Teams & Rosters</h1>

      {loading ? (
        <p className="text-center text-xl font-bold">Loading Teams...</p>
      ) : (
        <>
          {/* THE LOGO GRID */}
          <div className="grid grid-cols-4 md:grid-cols-8 gap-4 mb-10 max-w-6xl mx-auto">
            {teams.map((team) => (
              <button
                key={team.team_abv}
                onClick={() => handleTeamClick(team)}
                className={`flex items-center justify-center p-3 rounded-xl shadow-md transition hover:scale-105 ${
                  selectedTeam?.team_abv === team.team_abv
                    ? 'bg-blue-100 border-4 border-blue-600' // Highlight clicked team
                    : 'bg-white border-4 border-transparent hover:bg-gray-50'
                }`}
              >
                {/* THE MAGIC ESPN LOGO URL */}
                <img 
                  src={`https://a.espncdn.com/i/teamlogos/nfl/500/${team.team_abv.toLowerCase()}.png`} 
                  alt={team.team_abv} 
                  className="w-14 h-14 object-contain"
                />
              </button>
            ))}
          </div>

          {selectedTeam && (
            <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden mb-10">
              
              {/* THE NEW HEADER WITH BIG LOGO */}
              <div className="bg-blue-800 p-6 text-white flex items-center gap-6">
                <div className="bg-white p-3 rounded-full shadow-inner flex items-center justify-center w-24 h-24">
                  <img 
                    src={`https://a.espncdn.com/i/teamlogos/nfl/500/${selectedTeam.team_abv.toLowerCase()}.png`} 
                    alt="Team Logo" 
                    className="w-20 h-20 object-contain"
                  />
                </div>
                <div>
                  <h2 className="text-4xl font-bold">{selectedTeam.city} {selectedTeam.team_name}</h2>
                  <p className="text-blue-200 text-lg font-semibold mt-1">{selectedTeam.conference} {selectedTeam.division}</p>
                </div>
              </div>

              {/* OFFENSE TABLE */}
              <div className="bg-gray-200 p-3 font-bold text-xl text-gray-800 border-b-2 border-gray-300">
                Offense & Special Teams
              </div>
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-white z-10 shadow-sm border-b">
                    <tr className="text-gray-600 uppercase text-xs">
                      <th className="p-4">Player Name</th>
                      <th className="p-4">POS</th>
                      <th className="p-4">Pass Yds</th>
                      <th className="p-4">Pass TD</th>
                      <th className="p-4">Rush Yds</th>
                      <th className="p-4">Rec Yds</th>
                      <th className="p-4 text-red-600">Total TDs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {offenseRoster.map((player) => (
                      <tr key={player.player_id} className="hover:bg-blue-50 border-b border-gray-100">
                        <td className="p-4 font-semibold text-gray-800">{player.name}</td>
                        <td className="p-4 font-bold text-blue-600">{player.position}</td>
                        <td className="p-4 font-bold text-green-700">{player.totalPassYds}</td>
                        <td className="p-4 font-bold text-green-700">{player.totalTdThrown}</td>
                        <td className="p-4 font-bold text-green-700">{player.totalRushYds}</td>
                        <td className="p-4 font-bold text-green-700">{player.totalRecYds}</td>
                        <td className="p-4 font-bold text-red-600">{player.totalTdScored}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* DEFENSE TABLE */}
              <div className="bg-gray-800 p-3 font-bold text-xl text-white border-t-4 border-gray-900">
                Defense
              </div>
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-white z-10 shadow-sm border-b">
                    <tr className="text-gray-600 uppercase text-xs">
                      <th className="p-4">Player Name</th>
                      <th className="p-4">POS</th>
                      <th className="p-4">Tackles</th>
                      <th className="p-4">Sacks</th>
                      <th className="p-4">Interceptions</th>
                      <th className="p-4 text-orange-500">Forced Fumbles</th>
                    </tr>
                  </thead>
                  <tbody>
                    {defenseRoster.map((player) => (
                      <tr key={player.player_id} className="hover:bg-gray-100 border-b border-gray-100">
                        <td className="p-4 font-semibold text-gray-800">{player.name}</td>
                        <td className="p-4 font-bold text-blue-600">{player.position}</td>
                        <td className="p-4 font-bold text-green-700">{player.totalTackles}</td>
                        <td className="p-4 font-bold text-green-700">{player.totalSacks}</td>
                        <td className="p-4 font-bold text-green-700">{player.totalInts}</td>
                        <td className="p-4 font-bold text-orange-500">{player.totalFF}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}
        </>
      )}
    </div>
  );
}