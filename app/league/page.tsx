"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import Link from 'next/link'; // --- NEW: Next.js fast navigation! ---

// --- PLAYER SEARCH BOX COMPONENT ---
function PlayerSearchBox({ category, players, currentPick, onSave, getPlayerName }: any) {
  const [searchTerm, setSearchTerm] = useState('');

  const categoryFilteredPlayers = players.filter((p: any) => {
    if (category === 'Passing Yards') return p.position === 'QB';
    if (category === 'Rushing Yards') return ['RB', 'WR', 'QB'].includes(p.position);
    if (category === 'Receiving Yards' || category === 'Touchdowns') return ['WR', 'RB', 'TE'].includes(p.position);
    return true;
  });

  const finalFilteredPlayers = categoryFilteredPlayers.filter((p: any) => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
      <label className="block text-sm font-bold text-gray-800 mb-2">{category} Leader</label>
      <input 
        type="text" 
        placeholder={`🔍 Search for a ${category === 'Passing Yards' ? 'QB' : 'Player'}...`} 
        className="w-full p-2 mb-2 border border-gray-300 rounded text-sm text-black focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <select 
        value={currentPick}
        onChange={(e) => { onSave(category, e.target.value); setSearchTerm(''); }}
        className="w-full p-2 border border-gray-300 rounded bg-white text-black text-sm cursor-pointer"
      >
        <option value="">-- Select a Player --</option>
        {finalFilteredPlayers.map((p: any) => (
          <option key={p.player_id} value={p.player_id}>{p.name} ({p.position} - {p.team_abv})</option>
        ))}
      </select>
      {currentPick && (
        <div className="mt-2 inline-block bg-green-100 px-3 py-1 rounded-full border border-green-200">
          <p className="text-xs text-green-700 font-bold">✓ Saved: {getPlayerName(currentPick)}</p>
        </div>
      )}
    </div>
  );
}

// --- MAIN PAGE ---
export default function LeaguePage() {
  const [activeUser, setActiveUser] = useState(1);
  const [loading, setLoading] = useState(true);

  const [teams, setTeams] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [games, setGames] = useState<any[]>([]);

  const [playerPicks, setPlayerPicks] = useState<any[]>([]);
  const [teamPicks, setTeamPicks] = useState<any[]>([]);
  const [gamePicks, setGamePicks] = useState<any[]>([]);

  const [leaderboard, setLeaderboard] = useState<any[] | null>(null);

  useEffect(() => {
    async function loadLeagueData() {
      const { data: teamData } = await supabase.from('teams').select('*').order('city');
      if (teamData) setTeams(teamData);

      const { data: playerData } = await supabase.from('players').select('*').in('position', ['QB', 'RB', 'WR', 'TE']).order('name');
      if (playerData) setPlayers(playerData);

      const { data: gameData } = await supabase.from('weekly_schedule').select('*').eq('week_number', 7);
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

  // --- SAVE FUNCTIONS ---
  async function savePlayerPick(category: string, playerId: string) {
    await supabase.from('predictions_player').upsert({ prediction_id: `${activeUser}-${category}`, user_id: activeUser, category, player_id: playerId });
    setPlayerPicks(prev => [...prev.filter(p => p.category !== category), { category, player_id: playerId }]);
  }

  async function saveTeamPick(category: string, teamAbv: string) {
    await supabase.from('predictions_team').upsert({ prediction_id: `${activeUser}-${category}`, user_id: activeUser, category, team_abv: teamAbv });
    setTeamPicks(prev => [...prev.filter(p => p.category !== category), { category, team_abv: teamAbv }]);
  }

  async function saveGamePick(gameId: string, winnerAbv: string) {
    await supabase.from('predictions_game').upsert({ prediction_id: `${activeUser}-${gameId}`, user_id: activeUser, game_id: gameId, predicted_winner: winnerAbv });
    setGamePicks(prev => [...prev.filter(p => p.game_id !== gameId), { game_id: gameId, predicted_winner: winnerAbv }]);
  }

  // --- NEW: CLEAR PICKS FUNCTION ---
  async function clearActiveUserPicks() {
    // 1. Pop up a confirmation box so they don't do it by accident
    const confirmed = window.confirm(`Are you sure you want to delete ALL picks for Player ${activeUser}?`);
    if (!confirmed) return;

    // 2. Delete them permanently from Supabase
    await supabase.from('predictions_player').delete().eq('user_id', activeUser);
    await supabase.from('predictions_team').delete().eq('user_id', activeUser);
    await supabase.from('predictions_game').delete().eq('user_id', activeUser);

    // 3. Clear the screen instantly
    setPlayerPicks([]);
    setTeamPicks([]);
    setGamePicks([]);
  }

  const getPlayerName = (id: string) => players.find(p => p.player_id === id)?.name || "Not Selected";
  const getTeamName = (abv: string) => teams.find(t => t.team_abv === abv)?.team_name || "Not Selected";

  // --- SCORING ENGINE ---
  async function calculateLeagueScores() {
    const { data: allPPicks } = await supabase.from('predictions_player').select('*');
    const { data: allTPicks } = await supabase.from('predictions_team').select('*');
    const { data: allGPicks } = await supabase.from('predictions_game').select('*');

    const { data: pStats } = await supabase.from('player_weekly_stats').select('*').eq('week_number', 7);
    const { data: tStats } = await supabase.from('team_weekly_stats').select('*').eq('week_number', 7);
    const { data: gStats } = await supabase.from('weekly_schedule').select('*').eq('week_number', 7);

    let scores = { 1: 0, 2: 0, 3: 0, 4: 0 };

    // A. PLAYER PICKS
    const pCategories = ['Passing Yards', 'Rushing Yards', 'Receiving Yards', 'Touchdowns'];
    const pDbMap: any = { 'Passing Yards': 'passing_yards', 'Rushing Yards': 'rushing_yards', 'Receiving Yards': 'receiving_yards', 'Touchdowns': 'touchdowns_scored' };

    pCategories.forEach(cat => {
      const picksInCat = allPPicks?.filter(p => p.category === cat) || [];
      let maxStat = -1, maxFormula = -1000;

      const evaluated = picksInCat.map(pick => {
        const actualStats = pStats?.find(s => s.player_id === pick.player_id) || {};
        const statValue = actualStats[pDbMap[cat]] || 0;
        const formulaScore = (actualStats.passing_yards || 0) + (actualStats.rushing_yards || 0) + (actualStats.receiving_yards || 0) + ((actualStats.touchdowns_scored || 0) * 50);

        if (statValue > maxStat) maxStat = statValue;
        if (formulaScore > maxFormula) maxFormula = formulaScore;

        return { ...pick, statValue, formulaScore };
      });

      evaluated.forEach(e => {
        if (e.statValue === maxStat && maxStat > 0) scores[e.user_id as keyof typeof scores] += 3;
        if (e.formulaScore === maxFormula && maxFormula > 0) scores[e.user_id as keyof typeof scores] += 3;
      });
    });

    // B. TEAM PICKS
    const tCategories = ['Points Scored', 'Points Allowed', 'Sacks', 'Turnovers Forced'];
    const tDbMap: any = { 'Points Scored': 'points_scored', 'Points Allowed': 'points_allowed', 'Sacks': 'sacks', 'Turnovers Forced': 'turnovers_forced' };

    tCategories.forEach(cat => {
      const picksInCat = allTPicks?.filter(p => p.category === cat) || [];
      let bestStat = cat === 'Points Allowed' ? 1000 : -1; 
      let maxFormula = -1000;

      const evaluated = picksInCat.map(pick => {
        const actualStats = tStats?.find(s => s.team_abv === pick.team_abv) || {};
        const statValue = actualStats[tDbMap[cat]] || 0;
        const formulaScore = (actualStats.points_scored || 0) - (actualStats.points_allowed || 0) + (actualStats.sacks || 0) + ((actualStats.turnovers_forced || 0) * 3);

        if (cat === 'Points Allowed') {
          if (statValue < bestStat) bestStat = statValue;
        } else {
          if (statValue > bestStat) bestStat = statValue;
        }
        if (formulaScore > maxFormula) maxFormula = formulaScore;

        return { ...pick, statValue, formulaScore };
      });

      evaluated.forEach(e => {
        if (e.statValue === bestStat && (cat === 'Points Allowed' ? bestStat < 1000 : bestStat > 0)) scores[e.user_id as keyof typeof scores] += 3;
        if (e.formulaScore === maxFormula && maxFormula > -1000) scores[e.user_id as keyof typeof scores] += 3;
      });
    });

    // C. GAME WINNERS
    allGPicks?.forEach(pick => {
      const game = gStats?.find(g => g.game_id === pick.game_id);
      if (game) {
        const actualWinner = game.home_score > game.away_score ? game.home_team : (game.away_score > game.home_score ? game.away_team : 'TIE');
        if (pick.predicted_winner === actualWinner) {
          scores[pick.user_id as keyof typeof scores] += 1; 
        }
      }
    });

    const finalLeaderboard = [1, 2, 3, 4].map(id => ({ user_id: id, score: scores[id as keyof typeof scores] })).sort((a, b) => b.score - a.score);
    setLeaderboard(finalLeaderboard);
  }

  if (loading) return <div className="p-10 text-center text-2xl font-bold mt-20">Loading League Settings...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8 pb-32">
      
      {/* --- NEW: NAVIGATION BAR --- */}
      <div className="max-w-7xl mx-auto flex justify-end mb-4">
        <Link 
          href="/teams" 
          className="bg-blue-800 text-white px-6 py-2 rounded-lg font-bold shadow hover:bg-blue-700 transition flex items-center gap-2"
        >
          📊 View Rosters & Stats ↗
        </Link>
      </div>

      <h1 className="text-4xl font-bold text-center text-blue-900 mb-6">Hot-Seat Prediction League</h1>

      <div className="flex justify-center gap-4 mb-4">
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

      {/* --- NEW: CLEAR PICKS BUTTON --- */}
      <div className="flex justify-center mb-10">
        <button 
          onClick={clearActiveUserPicks}
          className="text-red-500 hover:text-red-700 hover:bg-red-50 px-4 py-1 rounded transition font-bold text-sm flex items-center gap-2"
        >
          🗑️ Clear all picks for Player {activeUser}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">Player Stat Leaders</h2>
          {['Passing Yards', 'Rushing Yards', 'Receiving Yards', 'Touchdowns'].map(cat => {
            const currentPick = playerPicks.find(p => p.category === cat)?.player_id || "";
            return <PlayerSearchBox key={cat} category={cat} players={players} currentPick={currentPick} onSave={savePlayerPick} getPlayerName={getPlayerName} />
          })}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">Team Stat Leaders</h2>
          {['Points Scored', 'Points Allowed', 'Sacks', 'Turnovers Forced'].map(cat => {
            const currentPick = teamPicks.find(p => p.category === cat)?.team_abv || "";
            return (
              <div key={cat} className="mb-4 bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
                <label className="block text-sm font-bold text-gray-800 mb-2">{cat} Leader</label>
                <select value={currentPick} onChange={(e) => saveTeamPick(cat, e.target.value)} className="w-full p-2 border border-gray-300 rounded bg-white text-black text-sm cursor-pointer">
                  <option value="">-- Select a Team --</option>
                  {teams.map(t => <option key={t.team_abv} value={t.team_abv}>{t.city} {t.team_name}</option>)}
                </select>
                {currentPick && <div className="mt-2 inline-block bg-green-100 px-3 py-1 rounded-full border border-green-200"><p className="text-xs text-green-700 font-bold">✓ Saved: {getTeamName(currentPick)}</p></div>}
              </div>
            )
          })}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">Week 7 Winners</h2>
          <div className="max-h-[600px] overflow-y-auto pr-2">
            {games.map(game => {
              const currentPick = gamePicks.find(p => p.game_id === game.game_id)?.predicted_winner || "";
              return (
                <div key={game.game_id} className="mb-4 bg-gray-50 p-3 rounded border shadow-sm">
                  <p className="text-center text-xs font-bold text-gray-500 mb-2">{game.away_team} @ {game.home_team}</p>
                  <div className="flex gap-2">
                    <button onClick={() => saveGamePick(game.game_id, game.away_team)} className={`flex-1 flex flex-col items-center justify-center p-2 rounded font-bold text-sm transition ${currentPick === game.away_team ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border hover:bg-blue-50'}`}>
                      <img src={`https://a.espncdn.com/i/teamlogos/nfl/500/${game.away_team.toLowerCase()}.png`} className="w-8 h-8 mb-1" />{game.away_team}
                    </button>
                    <button onClick={() => saveGamePick(game.game_id, game.home_team)} className={`flex-1 flex flex-col items-center justify-center p-2 rounded font-bold text-sm transition ${currentPick === game.home_team ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border hover:bg-blue-50'}`}>
                      <img src={`https://a.espncdn.com/i/teamlogos/nfl/500/${game.home_team.toLowerCase()}.png`} className="w-8 h-8 mb-1" />{game.home_team}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="mt-12 flex justify-center">
        <button onClick={calculateLeagueScores} className="px-12 py-4 bg-green-600 text-white text-2xl font-black rounded-full shadow-2xl hover:bg-green-700 transition transform hover:scale-105 animate-bounce">
          CALCULATE LEAGUE SCORES!
        </button>
      </div>

      {leaderboard && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-10 max-w-2xl w-full text-center shadow-2xl transform transition-all scale-100">
            <h2 className="text-5xl font-black text-blue-900 mb-8">🏆 Official Results 🏆</h2>
            <div className="space-y-4">
              {leaderboard.map((lb, index) => (
                <div key={lb.user_id} className={`p-6 rounded-2xl flex justify-between items-center text-3xl font-black shadow-md ${
                  index === 0 ? 'bg-yellow-300 border-4 border-yellow-500 text-yellow-900' : 
                  index === 1 ? 'bg-gray-200 border-2 border-gray-400 text-gray-700' : 
                  index === 2 ? 'bg-orange-200 border-2 border-orange-400 text-orange-900' : 
                  'bg-red-50 border border-red-200 text-red-900'
                }`}>
                  <span className="flex items-center gap-4">
                    {index === 0 && '🥇'} {index === 1 && '🥈'} {index === 2 && '🥉'} {index === 3 && '😭'} 
                    Player {lb.user_id}
                  </span>
                  <span>{lb.score} <span className="text-xl">PTS</span></span>
                </div>
              ))}
            </div>
            <button onClick={() => setLeaderboard(null)} className="mt-10 px-8 py-3 bg-red-600 text-white text-xl font-bold rounded-full hover:bg-red-700 transition shadow-lg">
              Close Leaderboard
            </button>
          </div>
        </div>
      )}

    </div>
  );
}