import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface Server {
    server_id: number;
    server_name: string;
    server_ip: string;
    server_port: number;
}

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
    round_id?: number;
    timestamp: string | number;
}

interface MapSession {
    id: number;
    server_id?: number;
    timestamp: string | number;
}

interface MapRound {
    id: number;
    session_id: number;
}

export const MapStats: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [servers, setServers] = useState<Server[]>([]);
    const [selectedServerId, setSelectedServerId] = useState<number | 'all'>('all');
    const [selectedSessionId, setSelectedSessionId] = useState<number | 'all'>('all');
    const [stageSearch, setStageSearch] = useState<string>('');

    const [totals, setTotals] = useState({ attempts: 0, wins: 0, fails: 0, sessions: 0, highestScore: 0 });
    const [recentStageWins, setRecentStageWins] = useState<StageWin[]>([]);
    const [topPlayers, setTopPlayers] = useState<Player[]>([]);
    const [sessions, setSessions] = useState<MapSession[]>([]);

    const fetchTelemetry = async () => {
        try {
            // 1. Fetch Servers
            const { data: serverData } = await supabase.from('servers').select('*');
            let activeServers: Server[] = [];
            if (serverData) {
                activeServers = Array.from(
                    new Map((serverData as Server[]).map(srv => [`${srv.server_ip}:${srv.server_port}`, srv])).values()
                );
                setServers(activeServers);
            }

            // 2. Fetch Sessions (Globally if 'all', or filtered by server)
            let sessionQuery = supabase.from('map_sessions').select('*', { count: 'exact' }).order('timestamp', { ascending: false });
            if (selectedServerId !== 'all') {
                sessionQuery = sessionQuery.eq('server_id', Number(selectedServerId));
            }
            const { data: sessionData, count: sessionsCount } = await sessionQuery;

            let activeSessions = sessionData || [];
            if (activeSessions.length === 0 && selectedServerId !== 'all') {
                const { data: fallbackData } = await supabase.from('map_sessions').select('*');
                activeSessions = (fallbackData || []).filter(s => Number(s.server_id) === Number(selectedServerId) || !s.server_id);
            }
            setSessions(activeSessions as MapSession[]);

            const validSessionIds = activeSessions.map(s => Number(s.id));

            // 3. Fetch Rounds silently behind-the-scenes for relation filtering (attempts count, round_ids)
            let roundsQuery = supabase.from('map_rounds').select('id, session_id');
            if (selectedSessionId !== 'all') {
                roundsQuery = roundsQuery.eq('session_id', Number(selectedSessionId));
            } else if (selectedServerId !== 'all') {
                if (validSessionIds.length > 0) {
                    roundsQuery = roundsQuery.in('session_id', validSessionIds);
                } else {
                    roundsQuery = roundsQuery.eq('session_id', -999);
                }
            }
            const { data: roundsData } = await roundsQuery;
            const validRoundIds = (roundsData || []).map((r: MapRound) => Number(r.id));

            // 4. Query global or scoped metrics
            let winsQuery = supabase.from('map_wins').select('*', { count: 'exact', head: true });
            let failsQuery = supabase.from('map_fails').select('*', { count: 'exact', head: true });
            let stageWinsQuery = supabase.from('stages_wins').select('*').order('timestamp', { ascending: false });

            if (selectedServerId !== 'all' || selectedSessionId !== 'all') {
                if (validRoundIds.length > 0) {
                    winsQuery = winsQuery.in('round_id', validRoundIds);
                    failsQuery = failsQuery.in('round_id', validRoundIds);
                    stageWinsQuery = stageWinsQuery.in('round_id', validRoundIds);
                } else {
                    winsQuery = winsQuery.eq('round_id', -999);
                    failsQuery = failsQuery.eq('round_id', -999);
                    stageWinsQuery = stageWinsQuery.eq('round_id', -999);
                }
            }

            // 5. Query map_stats for highest score (Global max if 'all')
            let statsQuery = supabase.from('map_stats').select('highest_score, server_id');
            if (selectedServerId !== 'all') {
                statsQuery = statsQuery.eq('server_id', Number(selectedServerId));
            }

            const [{ count: wins }, { count: fails }, { data: statsData }] = await Promise.all([
                winsQuery,
                failsQuery,
                statsQuery
            ]);

            let maxScore = 0;
            if (statsData && statsData.length > 0) {
                maxScore = Math.max(...statsData.map(s => Number(s.highest_score || 0)));
            }

            let totalSessionsCount = sessionsCount || activeSessions.length;
            if (selectedServerId === 'all') {
                const { count: globalSessCount } = await supabase.from('map_sessions').select('*', { count: 'exact', head: true });
                if (globalSessCount !== null) totalSessionsCount = globalSessCount;
            }

            setTotals({
                attempts: roundsData ? roundsData.length : 0,
                wins: wins || 0,
                fails: fails || 0,
                sessions: totalSessionsCount,
                highestScore: maxScore
            });

            const { data: stageData } = await stageWinsQuery;
            if (stageData) {
                const uniqueStages = Array.from(
                    new Map((stageData as StageWin[]).map(item => [item.stage_won, item])).values()
                );
                setRecentStageWins(uniqueStages);
            }

            // 6. Fetch Players Leaderboard (Global top players if 'all')
            const { data: playerData } = await supabase.from('players').select('*');
            if (playerData) {
                const sorted = (playerData as Player[]).sort((a, b) => {
                    const winsA = Number(a.stats?.wins || 0);
                    const winsB = Number(b.stats?.wins || 0);
                    if (winsB !== winsA) return winsB - winsA;
                    return Number(b.stats?.playtime || 0) - Number(a.stats?.playtime || 0);
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
    }, [selectedServerId, selectedSessionId]);

    const handleViewSession = (sess: MapSession) => {
        if (sess.server_id) {
            setSelectedServerId(sess.server_id);
        }
        setSelectedSessionId(sess.id);
    };

    const getServerName = (serverId?: number) => {
        if (!serverId) return 'Default Server';
        const s = servers.find(srv => srv.server_id === serverId);
        return s ? s.server_name : `Server #${serverId}`;
    };

    const formatPlaytime = (seconds: number) => {
        if (!seconds) return '0m 0s';
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m ${seconds % 60}s`;
    };

    const formatTimestamp = (input: string | number) => {
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
        return `${dateString} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
    };

    const filteredStages = recentStageWins.filter(s =>
        s.stage_won.toLowerCase().includes(stageSearch.toLowerCase())
    );

    return (
        <div className="container py-4" style={{ maxWidth: '1200px' }}>
            {/* Server Navigation Navbar */}
            <ul className="nav nav-pills bg-dark p-2 rounded-4 mb-4 shadow-sm gap-2">
                <li className="nav-item">
                    <button
                        className={`nav-link px-4 fw-bold ${selectedServerId === 'all' ? 'active bg-warning text-dark' : 'text-light'}`}
                        onClick={() => {
                            setSelectedServerId('all');
                            setSelectedSessionId('all');
                        }}
                    >
                        All Servers
                    </button>
                </li>
                {servers.map((srv) => (
                    <li className="nav-item" key={srv.server_id}>
                        <button
                            className={`nav-link px-4 fw-bold ${selectedServerId === srv.server_id ? 'active bg-warning text-dark' : 'text-light'}`}
                            onClick={() => {
                                setSelectedServerId(srv.server_id);
                                setSelectedSessionId('all');
                            }}
                        >
                            {srv.server_name}
                        </button>
                    </li>
                ))}
            </ul>

            {/* Header Banner */}
            <div className="card bg-black bg-gradient border-0 shadow-lg p-4 rounded-4 mb-4">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                    <div>
                        <h2 className="text-warning fw-bold mb-1">ze_monkey_mappers3</h2>
                        <p className="text-white-50 mb-0 small">
                            {selectedServerId === 'all' ? 'Global Multi-Server Telemetry' : `Server Telemetry View`}
                        </p>
                    </div>

                    {/* Session Filter */}
                    <div className="d-flex align-items-center gap-2">
                        <label className="text-white-50 small mb-0 fw-bold">Session:</label>
                        <select
                            className="form-select form-select-sm bg-dark text-warning border-secondary"
                            style={{ minWidth: '180px' }}
                            value={selectedSessionId}
                            onChange={(e) => setSelectedSessionId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                        >
                            <option value="all">All Sessions</option>
                            {sessions.map((sess, idx) => (
                                <option key={sess.id} value={sess.id}>
                                    Session #{sess.id} {idx === 0 ? '(Active)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* High-Level Stat Cards */}
                <div className="row g-3 mt-2">
                    <div className="col-lg col-md-4 col-6">
                        <div className="bg-dark p-3 rounded-3 border border-secondary border-opacity-25 text-center">
                            <span className="text-uppercase small text-white-50 fw-semibold">Total Sessions</span>
                            <h3 className="fw-bold text-warning mb-0 mt-1">{totals.sessions}</h3>
                        </div>
                    </div>
                    <div className="col-lg col-md-4 col-6">
                        <div className="bg-dark p-3 rounded-3 border border-secondary border-opacity-25 text-center">
                            <span className="text-uppercase small text-white-50 fw-semibold">Rounds Started</span>
                            <h3 className="fw-bold text-white mb-0 mt-1">{totals.attempts}</h3>
                        </div>
                    </div>
                    <div className="col-lg col-md-4 col-6">
                        <div className="bg-dark p-3 rounded-3 border border-success border-opacity-25 text-center">
                            <span className="text-uppercase small text-success fw-semibold">Map Beaten</span>
                            <h3 className="fw-bold text-success mb-0 mt-1">{totals.wins}</h3>
                        </div>
                    </div>
                    <div className="col-lg col-md-4 col-6">
                        <div className="bg-dark p-3 rounded-3 border border-danger border-opacity-25 text-center">
                            <span className="text-uppercase small text-danger fw-semibold">Zombie Wins</span>
                            <h3 className="fw-bold text-danger mb-0 mt-1">{totals.fails}</h3>
                        </div>
                    </div>
                    <div className="col-lg col-md-4 col-12">
                        <div className="bg-dark p-3 rounded-3 border border-warning border-opacity-25 text-center">
                            <span className="text-uppercase small text-warning fw-semibold">Highest Score</span>
                            <h3 className="fw-bold text-warning mb-0 mt-1">{totals.highestScore}</h3>
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
                    {/* Expanded Play Sessions History */}
                    <div className="col-lg-12">
                        <div className="card bg-black bg-gradient border-0 shadow-lg p-4 rounded-4">
                            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                                <h5 className="text-warning fw-bold mb-0">Play Sessions History</h5>
                                <span className="badge bg-secondary text-dark fw-bold">
                                    {selectedSessionId === 'all' ? 'All Sessions' : `Session #${selectedSessionId}`}
                                </span>
                            </div>

                            <div className="table-responsive bg-dark rounded-3 border border-secondary border-opacity-25" style={{ maxHeight: '320px', overflowY: 'auto' }}>
                                <table className="table table-dark table-hover align-middle mb-0 small">
                                    <thead className="sticky-top bg-dark">
                                        <tr>
                                            <th className="px-3 py-2">Session ID</th>
                                            <th className="px-3 py-2">Server</th>
                                            <th className="px-3 py-2">Timestamp</th>
                                            <th className="px-3 py-2 text-end">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sessions.map((sess) => (
                                            <tr key={sess.id} className={selectedSessionId === sess.id ? 'table-active' : ''}>
                                                <td className="px-3 py-2 text-warning fw-bold">#Session {sess.id}</td>
                                                <td className="px-3 py-2 text-white-50">{getServerName(sess.server_id)}</td>
                                                <td className="px-3 py-2 text-light">{formatTimestamp(sess.timestamp)}</td>
                                                <td className="px-3 py-2 text-end">
                                                    <button
                                                        className={`btn btn-xs py-0 px-2 ${selectedSessionId === sess.id ? 'btn-warning fw-bold' : 'btn-outline-warning'}`}
                                                        onClick={() => handleViewSession(sess)}
                                                        style={{ fontSize: '0.75rem' }}
                                                    >
                                                        {selectedSessionId === sess.id ? 'Viewing' : 'View'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Stage Clears 4-Column Grid */}
                    <div className="col-lg-12">
                        <div className="card bg-black bg-gradient border-0 shadow-lg p-4 rounded-4">
                            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                                <h5 className="text-warning fw-bold mb-0">Stage Clears ({filteredStages.length})</h5>
                                <input
                                    type="text"
                                    className="form-control form-control-sm bg-dark text-warning border-secondary"
                                    style={{ maxWidth: '240px' }}
                                    placeholder="Search stage / room..."
                                    value={stageSearch}
                                    onChange={(e) => setStageSearch(e.target.value)}
                                />
                            </div>

                            {filteredStages.length === 0 ? (
                                <div className="text-white-50 text-center py-5 small">No stage victories match your search or filter.</div>
                            ) : (
                                <div className="pe-2" style={{ maxHeight: '520px', overflowY: 'auto' }}>
                                    <div className="row g-3">
                                        {filteredStages.map((s) => (
                                            <div key={s.id} className="col-xl-3 col-lg-4 col-md-6">
                                                <div className="bg-dark p-3 rounded-3 border border-secondary border-opacity-15 h-100 d-flex flex-column justify-content-between">
                                                    <div>
                                                        <div className="d-flex justify-content-between align-items-start mb-1 gap-1">
                                                            <span className="fw-bold text-white text-truncate" style={{ maxWidth: '65%' }}>
                                                                {s.stage_won}
                                                            </span>
                                                            {s.is_boss_stage ? (
                                                                <span className="badge bg-danger text-white fw-bold" style={{ fontSize: '0.55rem' }}>BOSS STAGE</span>
                                                            ) : (
                                                                <span className="badge bg-secondary text-light fw-normal" style={{ fontSize: '0.55rem' }}>STANDARD</span>
                                                            )}
                                                        </div>
                                                        <small className="text-white-50 d-block">Time: <strong className="text-light">{formatPlaytime(s.stage_playtime)}</strong></small>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Leaderboard */}
                    <div className="col-12">
                        <div className="card bg-black bg-gradient border-0 shadow-lg p-4 rounded-4">
                            <h5 className="text-warning fw-bold mb-3">
                                {selectedServerId === 'all' ? 'Global Player Leaderboard' : 'Server Player Leaderboard'}
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
                                                <th className="py-2 px-3 text-center">Fails</th>
                                                <th className="py-2 px-3 text-center">Deaths / Attempts</th>
                                                <th className="py-2 px-3 text-end">Playtime</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {topPlayers.map((p, index) => (
                                                <tr key={p.id} className="border-bottom border-secondary border-opacity-10">
                                                    <td className="py-2 px-3">
                                                        <div className="fw-bold text-white text-nowrap">#{index + 1} {p.name}</div>
                                                        <code className="text-warning small">{p.steamid}</code>
                                                    </td>
                                                    <td className="py-2 px-3 text-center">
                                                        <span className="badge bg-success text-dark fw-bold px-3 py-2">{p.stats?.wins || 0}</span>
                                                    </td>
                                                    <td className="py-2 px-3 text-center">
                                                        <span className="badge bg-danger text-white fw-bold px-3 py-2">{p.stats?.failures || 0}</span>
                                                    </td>
                                                    <td className="py-2 px-3 text-center text-white-50 small">
                                                        Deaths: <strong className="text-white">{p.stats?.deaths || 0}</strong> | Attempts: <strong className="text-white">{p.stats?.attempts || 0}</strong>
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