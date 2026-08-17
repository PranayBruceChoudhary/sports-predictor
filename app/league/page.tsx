"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';

// --- NEW: A Reusable Component for a Searchable Dropdown ---
function PlayerSearchBox({ category, players, currentPick, onSave, getPlayerName }: any) {
  const [searchTerm, setSearchTerm] = useState('');

  // The Magic Filter: Only keep players whose name matches what you type!
  const filteredPlayers = players.filter((p: any) => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
      <label className="block text-sm font-bold text-gray-800 mb-2">{category} Leader</label>
      
      {/* THE SEARCH BAR */}
      <input 
        type="text" 
        placeholder="Search for a player..." 
        className="w-full p-2 mb-2 border border-gray-300 rounded text-sm text-black focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* THE DROPDOWN (Now only shows filtered players!) */}
      <select 
        value={currentPick}
        onChange={(e) => {
          onSave(category, e.target.value);
          setSearchTerm(''); // Clear the search bar after picking!
        }}
        className="w-full p-2 border border-gray-300 rounded bg-white text-black text-sm cursor-pointer"
      >
        <option value="">-- Select a Player --</option>
        {filteredPlayers.map((p: any) => (
          // Added their team abbreviation so you know exactly who they are!
          <option key={p.player_id} value={p.player_id}>
            {p.name} ({p.position} - {p.team_abv})
          </option>
        ))}
      </select>

      {/* SAVED CONFIRMATION */}
      {currentPick && (
        <div className="mt-2 inline-block bg-green-100 px-3 py-1 rounded-full border border-green-200">
          <p className="text-xs text-green-700 font-bold">✓ Saved: {getPlayerName(currentPick)}</p>
        </div>
      )}
    </div>
  );
}
// -------------------------------------------------------------

export default function LeaguePage() {
  const [activeUser, setActiveUser] = useState(1);
  const [loading, setLoading] = useState(true);

  const [teams, setTeams] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [games, setGames] = useState<any[]>([]);

  const [playerPicks, setPlayerPicks] = useState<any[]>([]);
  const [teamPicks, setTeamPicks] = useState<any[]>([]);
  const [gamePicks, setGamePicks] = useState<any[]>([]);

  useEffect(() => {
    async function loadLeagueData() {
      const { data: teamData } = await supabase.from('teams').select('*').order('city');
      if (teamData) setTeams(teamData);

      const { data: playerData } = await supabase
        .from('players')
        .select('*')
        .in('position', ['QB', 'RB', 'WR', 'TE'])
        .order('name');
      if (playerData) setPlayers(playerData);

      const { data: gameData } = await supabase
        .from('weekly_schedule')
        .select('*')
        .eq('week_number', 7);
      if (gameData) setGames(gameData);

      setLoading(false);
    }
    loadLeagueData();
  }, []);

  useEffect(() => {
    async function loadUserPicks() {
      const { data: pPicks } = await supabase.from('predictions_player').select('*').eq('user_id', activeUser);
      if (pPicks) setPlayerPicks(pPicks);

      const { data: tPicks } = await supabase.from('predictions_team').select('*').eq('user_id', activeUser);
      if (tPicks) setTeamPicks(tPicks);

      const { data: gPicks } = await supabase.from('predictions_game').select('*').eq('user_id', activeUser);
      if (gPicks) setGamePicks(gPicks);
    }
    loadUserPicks();
  }, [activeUser]);

  async function savePlayerPick(category: string, playerId: string) {
    const predictionId = `${activeUser}-${category}`;
    await supabase.from('predictions_player').upsert({
      prediction_id: predictionId, user_id: activeUser, category: category, player_id: playerId
    });
    setPlayerPicks(prev => [...prev.filter(p => p.category !== category), { category, player_id: playerId }]);
  }

  async function saveTeamPick(category: string, teamAbv: string) {
    const predictionId = `${activeUser}-${category}`;
    await supabase.from('predictions_team').upsert({
      prediction_id: predictionId, user_id: activeUser, category: category, team_abv: teamAbv
    });
    setTeamPicks(prev => [...prev.filter(p => p.category !== category), { category, team_abv: teamAbv }]);
  }

  async function saveGamePick(gameId: string, winnerAbv: string) {
    const predictionId = `${activeUser}-${gameId}`;
    await supabase.from('predictions_game').upsert({
      prediction_id: predictionId, user_id: activeUser, game_id: gameId, predicted_winner: winnerAbv
    });
    setGamePicks(prev => [...prev.filter(p => p.game_id !== gameId), { game_id: gameId, predicted_winner: winnerAbv }]);
  }

  const getPlayerName = (id: string) => players.find(p => p.player_id === id)?.name || "Not Selected";
  const getTeamName = (abv: string) => teams.find(t => t.team_abv === abv)?.team_name || "Not Selected";

  if (loading) return <div className="p-10 text-center text-2xl font-bold mt-20">Loading League Settings...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-4xl font-bold text-center text-blue-900 mb-6">Hot-Seat Prediction League</h1>

      <div className="flex justify-center gap-4 mb-10">
        {[1, 2, 3, 4].map(userNum => (
          <button
            key={userNum}
            onClick={() => setActiveUser(userNum)}
            className={`px-8 py-3 rounded-full font-bold text-lg shadow-md transition ${
              activeUser === userNum ? 'bg-blue-600 text-white scale-110' : 'bg-white text-gray-600 hover:bg-gray-200'
            }`}
          >
            Player {userNum}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
        
        {/* COLUMN 1: PLAYER LEADERS (Now using the Searchable Component!) */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">Player Stat Leaders</h2>
          {['Passing Yards', 'Rushing Yards', 'Receiving Yards', 'Touchdowns'].map(cat => {
            const currentPick = playerPicks.find(p => p.category === cat)?.player_id || "";
            return (
              <PlayerSearchBox 
                key={cat}
                category={cat}
                players={players}
                currentPick={currentPick}
                onSave={savePlayerPick}
                getPlayerName={getPlayerName}
              />
            )
          })}
        </div>

        {/* COLUMN 2: TEAM LEADERS */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">Team Stat Leaders</h2>
          {['Points Scored', 'Points Allowed', 'Sacks', 'Turnovers Forced'].map(cat => {
            const currentPick = teamPicks.find(p => p.category === cat)?.team_abv || "";
            return (
              <div key={cat} className="mb-4">
                <label className="block text-sm font-bold text-gray-600 mb-1">{cat} Leader</label>
                <select 
                  value={currentPick}
                  onChange={(e) => saveTeamPick(cat, e.target.value)}
                  className="w-full p-2 border rounded bg-gray-50 text-black cursor-pointer"
                >
                  <option value="">-- Select a Team --</option>
                  {teams.map(t => (
                    <option key={t.team_abv} value={t.team_abv}>{t.city} {t.team_name}</option>
                  ))}
                </select>
                {currentPick && (
                  <div className="mt-2 inline-block bg-green-100 px-3 py-1 rounded-full border border-green-200">
                    <p className="text-xs text-green-700 font-bold">✓ Saved: {getTeamName(currentPick)}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* COLUMN 3: GAME WINNERS */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">Week 7 Winners</h2>
          <div className="max-h-[600px] overflow-y-auto pr-2">
            {games.map(game => {
              const currentPick = gamePicks.find(p => p.game_id === game.game_id)?.predicted_winner || "";
              return (
                <div key={game.game_id} className="mb-4 bg-gray-50 p-3 rounded border">
                  <p className="text-center text-xs font-bold text-gray-500 mb-2">{game.away_team} @ {game.home_team}</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => saveGamePick(game.game_id, game.away_team)}
                      className={`flex-1 flex flex-col items-center justify-center p-2 rounded shadow-sm font-bold text-sm transition ${currentPick === game.away_team ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border hover:bg-blue-50'}`}
                    >
                      <img src={`https://a.espncdn.com/i/teamlogos/nfl/500/${game.away_team.toLowerCase()}.png`} className="w-8 h-8 mb-1" />
                      {game.away_team}
                    </button>
                    <button 
                      onClick={() => saveGamePick(game.game_id, game.home_team)}
                      className={`flex-1 flex flex-col items-center justify-center p-2 rounded shadow-sm font-bold text-sm transition ${currentPick === game.home_team ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border hover:bg-blue-50'}`}
                    >
                      <img src={`https://a.espncdn.com/i/teamlogos/nfl/500/${game.home_team.toLowerCase()}.png`} className="w-8 h-8 mb-1" />
                      {game.home_team}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  );
}