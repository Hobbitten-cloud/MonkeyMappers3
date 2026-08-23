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
    server_name?: string;
    server_id?: number;
}

interface MapSession {
    id: number;
    server_id?: number;
    timestamp: string | number;
    wins?: number;
    fails?: number;
    total_rounds?: number;
}

interface MapRound {
    id: number;
    session_id: number;
    started_players_num: number;
    max_players_num: number;
    timestamp: string | number;
    session_round_number?: number;
}

export const MapStats: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [servers, setServers] = useState<Server[]>([]);
    const [selectedServerId, setSelectedServerId] = useState<number | 'all'>('all');
    const [selectedSessionId, setSelectedSessionId] = useState<number | 'all'>('all');
    const [activeSubTab, setActiveSubTab] = useState<'sessions' | 'rounds'>('sessions');

    // Stage Filters & Sorting State
    const [stageSearch, setStageSearch] = useState<string>('');
    const [stageTypeFilter, setStageTypeFilter] = useState<'all' | 'boss' | 'standard'>('all');
    const [stageSortBy, setStageSortBy] = useState<'time_asc' | 'time_desc' | 'name_asc' | 'name_desc' | 'cts_desc' | 'recent'>('time_asc');

    const [totals, setTotals] = useState({ attempts: 0, wins: 0, fails: 0, sessions: 0, highestScore: 0 });
    const [recentStageWins, setRecentStageWins] = useState<StageWin[]>([]);
    const [topPlayers, setTopPlayers] = useState<Player[]>([]);
    const [sessions, setSessions] = useState<MapSession[]>([]);
    const [rounds, setRounds] = useState<MapRound[]>([]);

    const fetchTelemetry = async () => {
        try {
            // 1. Fetch Servers & map IP:Port duplicates
            const { data: serverData } = await supabase.from('servers').select('*');
            let rawServers: Server[] = serverData || [];

            const ipPortMap = new Map<string, Server>();
            const serverIdToCanonicalId = new Map<number, number>();

            rawServers.forEach(srv => {
                const key = `${srv.server_ip}:${srv.server_port}`;
                if (!ipPortMap.has(key)) {
                    ipPortMap.set(key, srv);
                }
                const canonical = ipPortMap.get(key)!;
                serverIdToCanonicalId.set(srv.server_id, canonical.server_id);
            });

            const uniqueServers = Array.from(ipPortMap.values());
            setServers(uniqueServers);

            let allowedRawServerIds: number[] = [];
            if (selectedServerId !== 'all') {
                const selectedSrv = uniqueServers.find(s => s.server_id === selectedServerId);
                if (selectedSrv) {
                    const targetKey = `${selectedSrv.server_ip}:${selectedSrv.server_port}`;
                    allowedRawServerIds = rawServers
                        .filter(s => `${s.server_ip}:${s.server_port}` === targetKey)
                        .map(s => s.server_id);
                } else {
                    allowedRawServerIds = [Number(selectedServerId)];
                }
            } else {
                allowedRawServerIds = rawServers.map(s => s.server_id);
            }

            // 2. Fetch Sessions & Rounds
            const { data: allSessionsData } = await supabase.from('map_sessions').select('*').order('timestamp', { ascending: false });
            const { data: allRoundsData } = await supabase.from('map_rounds').select('*').order('timestamp', { ascending: true });

            // 3. Fetch Map Wins & Map Fails
            const [{ data: winsData }, { data: failsData }, { data: statsData }] = await Promise.all([
                supabase.from('map_wins').select('id, round_id, session_id'),
                supabase.from('map_fails').select('id, round_id, session_id'),
                supabase.from('map_stats').select('highest_score, server_id')
            ]);

            const winsList = winsData || [];
            const failsList = failsData || [];

            let allSessions = (allSessionsData || []).map(s => {
                const rawSrvId = s.server_id ? Number(s.server_id) : rawServers[0]?.server_id || 1;
                return {
                    ...s,
                    raw_server_id: rawSrvId,
                    server_id: serverIdToCanonicalId.get(rawSrvId) || rawSrvId
                };
            });

            let activeSessions = allSessions;
            if (selectedServerId !== 'all') {
                activeSessions = allSessions.filter(s => allowedRawServerIds.includes(s.raw_server_id));
            }

            const validSessionIds = activeSessions.map(s => Number(s.id));

            // 4. Process Rounds & calculate Session-Relative Round Numbers
            const sessionRoundGroups = new Map<number, MapRound[]>();
            (allRoundsData || []).forEach(r => {
                const sid = Number(r.session_id);
                if (!sessionRoundGroups.has(sid)) {
                    sessionRoundGroups.set(sid, []);
                }
                sessionRoundGroups.get(sid)!.push(r as MapRound);
            });

            const processedAllRounds: MapRound[] = [];
            sessionRoundGroups.forEach((sessionRounds) => {
                sessionRounds.sort((a, b) => Number(a.id) - Number(b.id));
                sessionRounds.forEach((r, idx) => {
                    processedAllRounds.push({
                        ...r,
                        session_round_number: idx + 1
                    });
                });
            });

            const enrichedSessions: MapSession[] = activeSessions.map(s => {
                const sRounds = processedAllRounds.filter(r => Number(r.session_id) === Number(s.id));
                const sRoundIds = sRounds.map(r => Number(r.id));

                const sWins = winsList.filter(w =>
                    Number(w.session_id) === Number(s.id) || (w.round_id && sRoundIds.includes(Number(w.round_id)))
                ).length;

                const sFails = failsList.filter(f =>
                    Number(f.session_id) === Number(s.id) || (f.round_id && sRoundIds.includes(Number(f.round_id)))
                ).length;

                return {
                    ...s,
                    total_rounds: sRounds.length,
                    wins: sWins,
                    fails: sFails
                };
            });
            setSessions(enrichedSessions);

            let scopedRounds = processedAllRounds;
            if (selectedSessionId !== 'all') {
                scopedRounds = processedAllRounds.filter(r => Number(r.session_id) === Number(selectedSessionId));
            } else if (selectedServerId !== 'all') {
                scopedRounds = processedAllRounds.filter(r => validSessionIds.includes(Number(r.session_id)));
            }

            scopedRounds.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
            setRounds(scopedRounds);

            let totalWins = 0;
            let totalFails = 0;

            if (selectedSessionId !== 'all') {
                const selectedSessObj = enrichedSessions.find(s => Number(s.id) === Number(selectedSessionId));
                totalWins = selectedSessObj?.wins || 0;
                totalFails = selectedSessObj?.fails || 0;
            } else {
                totalWins = enrichedSessions.reduce((sum, s) => sum + (s.wins || 0), 0);
                totalFails = enrichedSessions.reduce((sum, s) => sum + (s.fails || 0), 0);
            }

            let filteredStats = statsData || [];
            if (selectedServerId !== 'all' && allowedRawServerIds.length > 0) {
                filteredStats = filteredStats.filter(s => allowedRawServerIds.includes(Number(s.server_id)));
            }
            let maxScore = 0;
            if (filteredStats.length > 0) {
                maxScore = Math.max(...filteredStats.map(s => Number(s.highest_score || 0)));
            }

            setTotals({
                attempts: scopedRounds.length,
                wins: totalWins,
                fails: totalFails,
                sessions: enrichedSessions.length,
                highestScore: maxScore
            });

            // 5. Fetch Stage Wins
            const { data: stageData } = await supabase.from('stages_wins').select('*').order('timestamp', { ascending: false });
            if (stageData) {
                const roundToSessionMap = new Map((allRoundsData || []).map(r => [r.id, r.session_id]));
                const sessionToRawSrvMap = new Map(allSessions.map(s => [s.id, s.raw_server_id]));

                let enrichedStages: StageWin[] = (stageData as StageWin[]).map(st => {
                    const sessId = st.round_id ? roundToSessionMap.get(st.round_id) : null;
                    const rawSrvId = sessId ? sessionToRawSrvMap.get(sessId) : rawServers[0]?.server_id || 1;
                    const canonicalId = serverIdToCanonicalId.get(rawSrvId) || rawSrvId;
                    const srv = uniqueServers.find(s => s.server_id === canonicalId);
                    return {
                        ...st,
                        raw_server_id: rawSrvId,
                        server_id: canonicalId,
                        server_name: srv ? srv.server_name : uniqueServers[0]?.server_name || 'Server'
                    };
                });

                if (selectedServerId !== 'all') {
                    enrichedStages = enrichedStages.filter(st => allowedRawServerIds.includes((st as any).raw_server_id));
                }

                const fastestStagesMap = new Map<string, StageWin>();
                enrichedStages.forEach(st => {
                    const existing = fastestStagesMap.get(st.stage_won);
                    if (!existing || Number(st.stage_playtime) < Number(existing.stage_playtime)) {
                        fastestStagesMap.set(st.stage_won, st);
                    }
                });

                setRecentStageWins(Array.from(fastestStagesMap.values()));
            }

            // 6. Fetch Players Leaderboard
            let playerQuery = supabase.from('players').select('*');
            if (selectedServerId !== 'all' && allowedRawServerIds.length > 0) {
                playerQuery = playerQuery.in('server_id', allowedRawServerIds);
            }
            const { data: playerData } = await playerQuery;
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

        const channel = supabase
            .channel('public-db-changes')
            .on('postgres_changes', { event: '*', schema: 'public' }, () => {
                fetchTelemetry();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedServerId, selectedSessionId]);

    const handleViewSession = (sess: MapSession) => {
        if (sess.server_id) {
            setSelectedServerId(sess.server_id);
        }
        setSelectedSessionId(sess.id);
        setActiveSubTab('rounds');
    };

    const getServerName = (serverId?: number) => {
        const s = servers.find(srv => srv.server_id === serverId);
        return s ? s.server_name : servers[0]?.server_name || 'Server';
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

    // Filter & Sort Logic for Stages Grid
    const filteredStages = recentStageWins
        .filter(s => {
            const matchesSearch = s.stage_won.toLowerCase().includes(stageSearch.toLowerCase());
            const matchesType =
                stageTypeFilter === 'all' ? true :
                    stageTypeFilter === 'boss' ? s.is_boss_stage :
                        !s.is_boss_stage;
            return matchesSearch && matchesType;
        })
        .sort((a, b) => {
            if (stageSortBy === 'time_asc') return Number(a.stage_playtime) - Number(b.stage_playtime);
            if (stageSortBy === 'time_desc') return Number(b.stage_playtime) - Number(a.stage_playtime);
            if (stageSortBy === 'name_asc') return a.stage_won.localeCompare(b.stage_won);
            if (stageSortBy === 'name_desc') return b.stage_won.localeCompare(a.stage_won);
            if (stageSortBy === 'cts_desc') return Number(b.humans_count) - Number(a.humans_count);
            if (stageSortBy === 'recent') return Number(b.timestamp) - Number(a.timestamp);
            return 0;
        });

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
                            setActiveSubTab('sessions');
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
                                setActiveSubTab('sessions');
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

                    {selectedServerId !== 'all' && (
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
                                        Session #{sess.id} {idx === 0 ? '(Latest)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
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
                    {/* Telemetry Log / Sub-Tabs */}
                    {selectedServerId !== 'all' && (
                        <div className="col-lg-12">
                            <div className="card bg-black bg-gradient border-0 shadow-lg p-4 rounded-4">
                                <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                                    <div className="d-flex align-items-center gap-3">
                                        <h5 className="text-warning fw-bold mb-0">Telemetry Log</h5>
                                        <div className="btn-group btn-group-sm bg-dark border border-secondary border-opacity-25 rounded-3 p-1">
                                            <button
                                                className={`btn btn-sm px-3 rounded-2 ${activeSubTab === 'sessions' ? 'btn-warning fw-bold text-dark' : 'text-light border-0'}`}
                                                onClick={() => setActiveSubTab('sessions')}
                                            >
                                                Sessions ({sessions.length})
                                            </button>
                                            <button
                                                className={`btn btn-sm px-3 rounded-2 ${activeSubTab === 'rounds' ? 'btn-warning fw-bold text-dark' : 'text-light border-0'}`}
                                                onClick={() => setActiveSubTab('rounds')}
                                            >
                                                Rounds ({rounds.length})
                                            </button>
                                        </div>
                                    </div>
                                    <span className="badge bg-secondary text-dark fw-bold">
                                        {selectedSessionId === 'all' ? 'All Sessions' : `Session #${selectedSessionId}`}
                                    </span>
                                </div>

                                {activeSubTab === 'sessions' ? (
                                    <div className="table-responsive bg-dark rounded-3 border border-secondary border-opacity-25" style={{ maxHeight: '320px', overflowY: 'auto' }}>
                                        <table className="table table-dark table-hover align-middle mb-0 small">
                                            <thead className="sticky-top bg-dark">
                                                <tr>
                                                    <th className="px-3 py-2">Session ID</th>
                                                    <th className="px-3 py-2">Server</th>
                                                    <th className="px-3 py-2 text-center">Rounds</th>
                                                    <th className="px-3 py-2 text-center">Human Wins</th>
                                                    <th className="px-3 py-2 text-center">Zombie Wins</th>
                                                    <th className="px-3 py-2">Timestamp</th>
                                                    <th className="px-3 py-2 text-end">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sessions.map((sess) => (
                                                    <tr key={sess.id} className={selectedSessionId === sess.id ? 'table-active' : ''}>
                                                        <td className="px-3 py-2 text-warning fw-bold">#Session {sess.id}</td>
                                                        <td className="px-3 py-2 text-white-50">{getServerName(sess.server_id)}</td>
                                                        <td className="px-3 py-2 text-center text-white fw-bold">{sess.total_rounds || 0}</td>
                                                        <td className="px-3 py-2 text-center">
                                                            <span className="badge bg-success text-dark fw-bold px-2 py-1">{sess.wins || 0}</span>
                                                        </td>
                                                        <td className="px-3 py-2 text-center">
                                                            <span className="badge bg-danger text-white fw-bold px-2 py-1">{sess.fails || 0}</span>
                                                        </td>
                                                        <td className="px-3 py-2 text-light">{formatTimestamp(sess.timestamp)}</td>
                                                        <td className="px-3 py-2 text-end">
                                                            <button
                                                                className={`btn btn-xs py-0 px-2 ${selectedSessionId === sess.id ? 'btn-warning fw-bold' : 'btn-outline-warning'}`}
                                                                onClick={() => handleViewSession(sess)}
                                                                style={{ fontSize: '0.75rem' }}
                                                            >
                                                                {selectedSessionId === sess.id ? 'Viewing' : 'View Rounds'}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="table-responsive bg-dark rounded-3 border border-secondary border-opacity-25" style={{ maxHeight: '320px', overflowY: 'auto' }}>
                                        <table className="table table-dark table-hover align-middle mb-0 small">
                                            <thead className="sticky-top bg-dark">
                                                <tr>
                                                    <th className="px-3 py-2">Round Number</th>
                                                    <th className="px-3 py-2">Session</th>
                                                    <th className="px-3 py-2">Players (Start / Max)</th>
                                                    <th className="px-3 py-2">Timestamp</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {rounds.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={4} className="text-center text-white-50 py-4">No rounds recorded for this scope.</td>
                                                    </tr>
                                                ) : (
                                                    rounds.map((rnd) => (
                                                        <tr key={rnd.id} className="align-middle">
                                                            <td className="px-3 py-2 text-info fw-bold">
                                                                #Round {rnd.session_round_number || rnd.id}
                                                            </td>
                                                            <td className="px-3 py-2 text-warning">Session #{rnd.session_id}</td>
                                                            <td className="px-3 py-2 text-white">{rnd.started_players_num} / {rnd.max_players_num}</td>
                                                            <td className="px-3 py-2 text-light">{formatTimestamp(rnd.timestamp)}</td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Fastest Stage Clears Grid with Cleaned Filter Bar */}
                    <div className="col-lg-12">
                        <div className="card bg-black bg-gradient border-0 shadow-lg p-4 rounded-4">
                            {/* Card Header Title */}
                            <div className="mb-3">
                                <h5 className="text-warning fw-bold mb-0">
                                    Fastest Stage Clears ({filteredStages.length})
                                </h5>
                                <small className="text-white-50">
                                    Showing {filteredStages.length} of {recentStageWins.length} stages recorded
                                </small>
                            </div>

                            {/* Clean Toolbar Bar */}
                            <div className="row g-3 mb-4 bg-dark bg-opacity-75 p-3 rounded-3 border border-secondary border-opacity-25 align-items-end">
                                {/* Search Field */}
                                <div className="col-md-5 col-12">
                                    <label className="form-label text-white-50 small mb-1 fw-semibold">Search Stage</label>
                                    <div className="position-relative">
                                        <input
                                            type="text"
                                            className="form-control form-control-sm bg-dark text-light border-secondary shadow-none pe-4"
                                            placeholder="e.g. Hobbitten, Lord Death..."
                                            value={stageSearch}
                                            onChange={(e) => setStageSearch(e.target.value)}
                                        />
                                        {stageSearch && (
                                            <button
                                                type="button"
                                                className="btn btn-sm text-white-50 position-absolute end-0 top-50 translate-middle-y border-0 bg-transparent py-0 px-2"
                                                onClick={() => setStageSearch('')}
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Filter by Type */}
                                <div className="col-md-4 col-sm-6 col-12">
                                    <label className="form-label text-white-50 small mb-1 fw-semibold">Stage Type</label>
                                    <div className="btn-group btn-group-sm w-100 bg-dark border border-secondary border-opacity-25 rounded-2 p-1">
                                        <button
                                            type="button"
                                            className={`btn btn-sm rounded-2 ${stageTypeFilter === 'all' ? 'btn-warning fw-bold text-dark' : 'text-light border-0'}`}
                                            onClick={() => setStageTypeFilter('all')}
                                        >
                                            All
                                        </button>
                                        <button
                                            type="button"
                                            className={`btn btn-sm rounded-2 ${stageTypeFilter === 'boss' ? 'btn-danger fw-bold text-white' : 'text-light border-0'}`}
                                            onClick={() => setStageTypeFilter('boss')}
                                        >
                                            Boss Only
                                        </button>
                                        <button
                                            type="button"
                                            className={`btn btn-sm rounded-2 ${stageTypeFilter === 'standard' ? 'btn-secondary fw-bold text-white' : 'text-light border-0'}`}
                                            onClick={() => setStageTypeFilter('standard')}
                                        >
                                            Standard
                                        </button>
                                    </div>
                                </div>

                                {/* Sort Control */}
                                <div className="col-md-3 col-sm-6 col-12">
                                    <label className="form-label text-white-50 small mb-1 fw-semibold">Sort By</label>
                                    <select
                                        className="form-select form-select-sm bg-dark text-light border-secondary shadow-none"
                                        value={stageSortBy}
                                        onChange={(e) => setStageSortBy(e.target.value as any)}
                                    >
                                        <option value="time_asc">Fastest Time</option>
                                        <option value="time_desc">Slowest Time</option>
                                        <option value="name_asc">Stage Name (A-Z)</option>
                                        <option value="name_desc">Stage Name (Z-A)</option>
                                        <option value="cts_desc">Most CTs Survived</option>
                                        <option value="recent">Recently Cleared</option>
                                    </select>
                                </div>
                            </div>

                            {/* Stage Grid */}
                            {filteredStages.length === 0 ? (
                                <div className="text-white-50 text-center py-5 small border border-secondary border-opacity-25 rounded-3 bg-dark">
                                    No stage victories match your active filters or search string.
                                </div>
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
                                                        <small className="text-warning d-block mb-1 text-truncate" style={{ fontSize: '0.75rem' }}>
                                                            Server: <strong>{s.server_name}</strong>
                                                        </small>
                                                        <small className="text-white-50 d-block">Fastest Time: <strong className="text-light">{formatPlaytime(s.stage_playtime)}</strong></small>
                                                    </div>
                                                    <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top border-secondary border-opacity-10 small">
                                                        <span className="text-success fw-bold" style={{ fontSize: '0.75rem' }}>{s.humans_count} CTs Survived</span>
                                                        <span className="text-white-50" style={{ fontSize: '0.7rem' }}>{formatTimestamp(s.timestamp)}</span>
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