import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface Player {
    id: number;
    name: string;
    steamid: string;
    stats: {
        playtime?: number;
        deaths?: number;
        wins?: number;
        attempts?: number;
        failures?: number;
    };
}

interface StageWin {
    id: number;
    stage_won: string;
    is_boss_stage: boolean;
    humans_count: number;
    zombies_count: number;
    stage_playtime: number;
    session_id?: number;
    round_id?: number;
    timestamp: string | number;
}

interface MapSession {
    id: number;
    timestamp: string | number;
}

export const MapStats: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [selectedSessionId, setSelectedSessionId] = useState<number | 'all'>('all');
    const [totals, setTotals] = useState({ attempts: 0, wins: 0, fails: 0, sessions: 0 });
    const [recentStageWins, setRecentStageWins] = useState<StageWin[]>([]);
    const [topPlayers, setTopPlayers] = useState<Player[]>([]);
    const [sessions, setSessions] = useState<MapSession[]>([]);

    const fetchTelemetry = async () => {
        try {
            const { data: sessionData, count: sessionsCount } = await supabase
                .from('map_sessions')
                .select('*', { count: 'exact' })
                .order('timestamp', { ascending: false });

            if (sessionData) setSessions(sessionData as MapSession[]);

            let roundsQuery = supabase.from('map_rounds').select('*', { count: 'exact', head: true });
            let winsQuery = supabase.from('map_wins').select('*', { count: 'exact', head: true });
            let failsQuery = supabase.from('map_fails').select('*', { count: 'exact', head: true });
            let stageWinsQuery = supabase.from('stages_wins').select('*').order('timestamp', { ascending: false });

            if (selectedSessionId !== 'all') {
                roundsQuery = roundsQuery.eq('session_id', selectedSessionId);
                winsQuery = winsQuery.eq('session_id', selectedSessionId);
                failsQuery = failsQuery.eq('session_id', selectedSessionId);
                stageWinsQuery = stageWinsQuery.eq('session_id', selectedSessionId);
            }

            const [{ count: attempts }, { count: wins }, { count: fails }] = await Promise.all([
                roundsQuery,
                winsQuery,
                failsQuery
            ]);

            setTotals({
                attempts: attempts || 0,
                wins: wins || 0,
                fails: fails || 0,
                sessions: sessionsCount || 0,
            });

            const { data: stageData } = await stageWinsQuery.limit(10);
            if (stageData) setRecentStageWins(stageData as StageWin[]);

            const { data: playerData } = await supabase
                .from('players')
                .select('*')
                .limit(50);

            if (playerData) {
                const sorted = (playerData as Player[]).sort((a, b) => {
                    const winsA = Number(a.stats?.wins || 0);
                    const winsB = Number(b.stats?.wins || 0);
                    if (winsB !== winsA) return winsB - winsA;

                    const timeA = Number(a.stats?.playtime || 0);
                    const timeB = Number(b.stats?.playtime || 0);
                    return timeB - timeA;
                }).slice(0, 10);

                setTopPlayers(sorted);
            }
        } catch (err) {
            console.error('Error fetching map telemetry:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTelemetry();

        const channel = supabase
            .channel('live_map_stats')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'map_sessions' }, () => fetchTelemetry())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'map_rounds' }, () => fetchTelemetry())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'map_wins' }, () => fetchTelemetry())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'map_fails' }, () => fetchTelemetry())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'stages_wins' }, () => fetchTelemetry())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'stages_attempts' }, () => fetchTelemetry())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => fetchTelemetry())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedSessionId]);

    const formatPlaytime = (seconds: number) => {
        if (!seconds) return '0m 0s';
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m ${secs}s`;
    };

    const formatTimestamp = (input: string | number, short = false) => {
        if (!input) return 'N/A';

        let date: Date;
        const strInput = String(input).trim();

        if (/^\d+$/.test(strInput)) {
            const num = Number(strInput);
            date = num < 1e11 ? new Date(num * 1000) : new Date(num);
        } else {
            date = new Date(strInput);
        }

        if (isNaN(date.getTime())) return 'Invalid Date';

        const dateString = date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

        if (short) return dateString;

        return `${dateString} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
    };

    return (
        <div className="container py-4" style={{ maxWidth: '1100px' }}>
            {/* Header Banner */}
            <div className="card bg-black bg-gradient border-0 shadow-lg p-4 rounded-4 mb-4">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                    <div>
                        <h2 className="text-warning fw-bold mb-1">ze_monkey_mappers3</h2>
                        <p className="text-white-50 mb-0 small">Live map telemetry & player statistics</p>
                    </div>

                    {/* Session Selector Dropdown */}
                    <div className="d-flex align-items-center gap-2">
                        <label className="text-white-50 small mb-0 fw-bold">Filter Session:</label>
                        <select
                            className="form-select form-select-sm bg-dark text-warning border-secondary"
                            style={{ minWidth: '220px' }}
                            value={selectedSessionId}
                            onChange={(e) => setSelectedSessionId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                        >
                            <option value="all">All Historical Sessions</option>
                            {sessions.map((sess, idx) => (
                                <option key={sess.id} value={sess.id}>
                                    Session #{sess.id} {idx === 0 ? '(Active)' : `(${formatTimestamp(sess.timestamp, true)})`}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* High-Level Stat Cards */}
                <div className="row g-3 mt-2">
                    <div className="col-md-3 col-6">
                        <div className="bg-dark p-3 rounded-3 border border-secondary border-opacity-25 text-center">
                            <span className="text-uppercase small text-white-50 fw-semibold">Total Sessions</span>
                            <h2 className="fw-bold text-warning mb-0 mt-1">{totals.sessions}</h2>
                        </div>
                    </div>
                    <div className="col-md-3 col-6">
                        <div className="bg-dark p-3 rounded-3 border border-secondary border-opacity-25 text-center">
                            <span className="text-uppercase small text-white-50 fw-semibold">Total rounds started</span>
                            <h2 className="fw-bold text-white mb-0 mt-1">{totals.attempts}</h2>
                        </div>
                    </div>
                    <div className="col-md-3 col-6">
                        <div className="bg-dark p-3 rounded-3 border border-success border-opacity-25 text-center">
                            <span className="text-uppercase small text-success fw-semibold">Map beaten</span>
                            <h2 className="fw-bold text-success mb-0 mt-1">{totals.wins}</h2>
                        </div>
                    </div>
                    <div className="col-md-3 col-6">
                        <div className="bg-dark p-3 rounded-3 border border-danger border-opacity-25 text-center">
                            <span className="text-uppercase small text-danger fw-semibold">Zombie Wins</span>
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
                    {/* Sessions History */}
                    <div className="col-lg-6">
                        <div className="card bg-black bg-gradient border-0 shadow-lg p-4 rounded-4 h-100">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 className="text-warning fw-bold mb-0">Play Sessions History</h5>
                                <span className="badge bg-secondary text-dark fw-bold">
                                    {selectedSessionId === 'all' ? 'Viewing: All Sessions' : `Viewing: Session #${selectedSessionId}`}
                                </span>
                            </div>
                            {sessions.length === 0 ? (
                                <div className="text-white-50 text-center py-3 small">No map sessions recorded yet.</div>
                            ) : (
                                <div className="table-responsive" style={{ maxHeight: '320px', overflowY: 'auto' }}>
                                    <table className="table table-dark table-hover align-middle mb-0">
                                        <thead className="bg-dark text-uppercase small text-warning border-bottom border-secondary border-opacity-25 sticky-top">
                                            <tr>
                                                <th className="py-2 px-3">Session</th>
                                                <th className="py-2 px-3">Date & Timestamp</th>
                                                <th className="py-2 px-3 text-end">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sessions.map((sess, idx) => (
                                                <tr
                                                    key={sess.id}
                                                    className={`border-bottom border-secondary border-opacity-10 ${selectedSessionId === sess.id ? 'table-active' : ''}`}
                                                >
                                                    <td className="py-2 px-3 fw-bold text-warning">
                                                        #Session {sess.id}
                                                        {idx === 0 && <span className="badge bg-success text-dark ms-2">Active</span>}
                                                    </td>
                                                    <td className="py-2 px-3 text-white small">{formatTimestamp(sess.timestamp)}</td>
                                                    <td className="py-2 px-3 text-end">
                                                        <button
                                                            className={`btn btn-xs btn-sm ${selectedSessionId === sess.id ? 'btn-warning' : 'btn-outline-warning'}`}
                                                            onClick={() => setSelectedSessionId(sess.id)}
                                                        >
                                                            {selectedSessionId === sess.id ? 'Viewing' : 'View'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Stage Clears */}
                    <div className="col-lg-6">
                        <div className="card bg-black bg-gradient border-0 shadow-lg p-4 rounded-4 h-100">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 className="text-warning fw-bold mb-0">Stage Clears</h5>
                                <span className="badge bg-secondary text-dark fw-bold">
                                    {selectedSessionId === 'all' ? 'All Sessions' : `Session #${selectedSessionId}`}
                                </span>
                            </div>
                            {recentStageWins.length === 0 ? (
                                <div className="text-white-50 text-center py-4 small">No stage victories recorded for this filter.</div>
                            ) : (
                                <div className="d-flex flex-column gap-2" style={{ maxHeight: '320px', overflowY: 'auto' }}>
                                    {recentStageWins.map((s) => (
                                        <div key={s.id} className="bg-dark p-3 rounded-3 border border-secondary border-opacity-10 d-flex justify-content-between align-items-center gap-2">
                                            <div className="overflow-hidden">
                                                <div className="d-flex align-items-center gap-2 mb-1">
                                                    <span className="fw-bold text-white text-truncate">
                                                        <span className="text-warning">Room / Part:</span> {s.stage_won}
                                                    </span>
                                                    {s.is_boss_stage && (
                                                        <span className="badge bg-danger text-white fw-bold small">BOSS</span>
                                                    )}
                                                </div>
                                                <small className="text-white-50 d-block">
                                                    Playtime: <strong className="text-light">{formatPlaytime(s.stage_playtime)}</strong>
                                                </small>
                                                {s.session_id && (
                                                    <small className="text-warning d-block">
                                                        Session #{s.session_id} {s.round_id ? `| Round #${s.round_id}` : ''}
                                                    </small>
                                                )}
                                            </div>
                                            <div className="text-end flex-shrink-0">
                                                <span className="badge bg-success text-dark fw-bold mb-1 d-block">
                                                    {s.humans_count} CTs Survived
                                                </span>
                                                <small className="text-white-50">{formatTimestamp(s.timestamp)}</small>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Leaderboard */}
                    <div className="col-12">
                        <div className="card bg-black bg-gradient border-0 shadow-lg p-4 rounded-4">
                            <h5 className="text-warning fw-bold mb-3">Overall Leaderboard</h5>
                            {topPlayers.length === 0 ? (
                                <div className="text-white-50 text-center py-4 small">No player statistics recorded yet.</div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-dark table-hover align-middle mb-0">
                                        <thead className="bg-dark text-uppercase small text-warning border-bottom border-secondary border-opacity-25">
                                            <tr>
                                                <th className="py-2 px-3">Player</th>
                                                <th className="py-2 px-3 text-center">Wins</th>
                                                <th className="py-2 px-3 text-center">Fails</th>
                                                <th className="py-2 px-3 text-center">Deaths / Attempts</th>
                                                <th className="py-2 px-3 text-end">Playtime</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {topPlayers.map((p, index) => (
                                                <tr key={p.id} className="border-bottom border-secondary border-opacity-10">
                                                    <td className="py-2 px-3">
                                                        <div className="fw-bold text-white text-nowrap">
                                                            #{index + 1} {p.name}
                                                        </div>
                                                        <code className="text-warning small">{p.steamid}</code>
                                                    </td>
                                                    <td className="py-2 px-3 text-center">
                                                        <span className="badge bg-success text-dark fw-bold px-3 py-2 fs-6">
                                                            {p.stats?.wins || 0}
                                                        </span>
                                                    </td>
                                                    <td className="py-2 px-3 text-center">
                                                        <span className="badge bg-danger text-white fw-bold px-3 py-2 fs-6">
                                                            {p.stats?.failures || 0}
                                                        </span>
                                                    </td>
                                                    <td className="py-2 px-3 text-center">
                                                        <span className="badge bg-secondary text-white me-1">
                                                            Deaths: {p.stats?.deaths || 0}
                                                        </span>
                                                        <span className="badge bg-dark text-white-50 border border-secondary border-opacity-25">
                                                            Attempts: {p.stats?.attempts || 0}
                                                        </span>
                                                    </td>
                                                    <td className="py-2 px-3 text-end fw-bold text-light text-nowrap">
                                                        {formatPlaytime(p.stats?.playtime || 0)}
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