import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface Player {
    id: number;
    name: string;
    steamid: string;
    stats: {
        kills?: number;
        deaths?: number;
        wins?: number;
        attempts?: number;
        failures?: number;
    };
}

interface StageWin {
    id: number;
    stage_won: string;
    humans_count: number;
    zombies_count: number;
    stage_playtime: number;
    timestamp: string;
}

export const MapStats: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [totals, setTotals] = useState({ attempts: 0, wins: 0, fails: 0 });
    const [recentStageWins, setRecentStageWins] = useState<StageWin[]>([]);
    const [topPlayers, setTopPlayers] = useState<Player[]>([]);

    useEffect(() => {
        async function fetchTelemetry() {
            try {
                // 1. Fetch exact row counts
                const [{ count: attempts }, { count: wins }, { count: fails }] = await Promise.all([
                    supabase.from('map_attempts').select('*', { count: 'exact', head: true }),
                    supabase.from('maps_wins').select('*', { count: 'exact', head: true }),
                    supabase.from('map_fails').select('*', { count: 'exact', head: true }),
                ]);

                setTotals({
                    attempts: attempts || 0,
                    wins: wins || 0,
                    fails: fails || 0,
                });

                // 2. Fetch recent stage victories
                const { data: stageData } = await supabase
                    .from('stages_wins')
                    .select('*')
                    .order('timestamp', { ascending: false })
                    .limit(6);

                if (stageData) setRecentStageWins(stageData as StageWin[]);

                // 3. Fetch players and sort in-memory by stats->wins
                const { data: playerData } = await supabase
                    .from('players')
                    .select('*')
                    .limit(50);

                if (playerData) {
                    const sorted = (playerData as Player[]).sort((a, b) => {
                        const winsA = Number(a.stats?.wins || 0);
                        const winsB = Number(b.stats?.wins || 0);
                        if (winsB !== winsA) return winsB - winsA;

                        const killsA = Number(a.stats?.kills || 0);
                        const killsB = Number(b.stats?.kills || 0);
                        return killsB - killsA;
                    }).slice(0, 8);

                    setTopPlayers(sorted);
                }
            } catch (err) {
                console.error('Error fetching map telemetry:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchTelemetry();

        // Auto-refresh telemetry every 15 seconds
        const interval = setInterval(fetchTelemetry, 15000);
        return () => clearInterval(interval);
    }, []);

    const formatPlaytime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    return (
        <div className="container py-2" style={{ maxWidth: '1000px' }}>
            {/* Header Banner */}
            <div className="card bg-black bg-gradient border-0 shadow-lg p-4 rounded-4 mb-4">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div>
                        <h2 className="text-warning fw-bold mb-1">ze_monkey_mappers3</h2>
                        <p className="text-white-50 mb-0 small">Live map telemetry & player statistics</p>
                    </div>
                </div>

                {/* High-Level Stat Cards */}
                <div className="row g-3 mt-2">
                    <div className="col-md-4">
                        <div className="bg-dark p-3 rounded-3 border border-secondary border-opacity-25 text-center">
                            <span className="text-uppercase small text-white-50 fw-semibold">Total Runs Started</span>
                            <h2 className="fw-bold text-white mb-0 mt-1">{totals.attempts}</h2>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="bg-dark p-3 rounded-3 border border-success border-opacity-25 text-center">
                            <span className="text-uppercase small text-success fw-semibold">Human Victories</span>
                            <h2 className="fw-bold text-success mb-0 mt-1">{totals.wins}</h2>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="bg-dark p-3 rounded-3 border border-danger border-opacity-25 text-center">
                            <span className="text-uppercase small text-danger fw-semibold">Zombie Infections (Fails)</span>
                            <h2 className="fw-bold text-danger mb-0 mt-1">{totals.fails}</h2>
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-warning" role="status"></div>
                </div>
            ) : (
                <div className="row g-4">
                    {/* Recent Stage Victories */}
                    <div className="col-lg-6">
                        <div className="card bg-black bg-gradient border-0 shadow-lg p-4 rounded-4 h-100">
                            <h5 className="text-warning fw-bold mb-3 d-flex align-items-center gap-2">
                                <span>🏆</span> Recent Stage Clears
                            </h5>
                            {recentStageWins.length === 0 ? (
                                <div className="text-white-50 text-center py-4 small">No stage victories recorded yet.</div>
                            ) : (
                                <div className="d-flex flex-column gap-2">
                                    {recentStageWins.map((s) => (
                                        <div key={s.id} className="bg-dark p-3 rounded-3 border border-secondary border-opacity-10 d-flex justify-content-between align-items-center gap-2">
                                            <div className="overflow-hidden">
                                                <div className="fw-bold text-white mb-1 text-truncate">{s.stage_won}</div>
                                                <small className="text-white-50">
                                                    Playtime: <strong className="text-light">{formatPlaytime(s.stage_playtime)}</strong>
                                                </small>
                                            </div>
                                            <div className="text-end flex-shrink-0">
                                                <span className="badge bg-success text-dark fw-bold mb-1 d-block">
                                                    {s.humans_count} CTs Survived
                                                </span>
                                                <small className="text-white-50">{new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Top Players Leaderboard */}
                    <div className="col-lg-6">
                        <div className="card bg-black bg-gradient border-0 shadow-lg p-4 rounded-4 h-100">
                            <h5 className="text-warning fw-bold mb-3 d-flex align-items-center gap-2">
                                <span>🥇</span> Leaderboard
                            </h5>
                            {topPlayers.length === 0 ? (
                                <div className="text-white-50 text-center py-4 small">No player statistics recorded yet.</div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-dark table-hover align-middle mb-0">
                                        <thead className="bg-dark text-uppercase small text-warning border-bottom border-secondary border-opacity-25">
                                            <tr>
                                                <th className="py-2 px-3">Player</th>
                                                <th className="py-2 px-3 text-center">Wins</th>
                                                <th className="py-2 px-3 text-end">Kills</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {topPlayers.map((p, index) => (
                                                <tr key={p.id} className="border-bottom border-secondary border-opacity-10">
                                                    <td className="py-2 px-3">
                                                        <div className="fw-bold text-white">
                                                            {index === 0 && '👑 '}
                                                            {index === 1 && '🥈 '}
                                                            {index === 2 && '🥉 '}
                                                            {p.name}
                                                        </div>
                                                        <code className="text-warning small">{p.steamid}</code>
                                                    </td>
                                                    <td className="py-2 px-3 text-center fw-bold text-success">
                                                        {p.stats?.wins || 0}
                                                    </td>
                                                    <td className="py-2 px-3 text-end fw-bold text-light">
                                                        {p.stats?.kills || 0}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};