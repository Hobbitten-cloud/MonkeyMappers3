import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { MapperTask } from '../types';

export const Participants: React.FC = () => {
    const [mappers, setMappers] = useState<MapperTask[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [search, setSearch] = useState<string>('');
    const [viewMode, setViewMode] = useState<'table' | 'cards' | 'compact'>('table');

    useEffect(() => {
        async function fetchMappers() {
            setLoading(true);
            const { data, error } = await supabase
                .from('mappers')
                .select('*')
                .order('player_name');

            if (error) console.error(error.message);
            if (data) setMappers(data as MapperTask[]);
            setLoading(false);
        }

        fetchMappers();
    }, []);

    const filteredMappers = mappers.filter((m) =>
        m.player_name.toLowerCase().includes(search.toLowerCase()) ||
        m.assigned_task.toLowerCase().includes(search.toLowerCase()) ||
        m.steam_id.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="container py-2" style={{ maxWidth: '1000px' }}>
            {/* Header Banner */}
            <div className="card bg-black bg-gradient border-0 shadow-lg mb-4 p-4 rounded-4">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
                    <div>
                        <h2 className="text-warning fw-bold mb-1">Participant list</h2>
                        <p className="text-white-50 mb-0 small">Official list of contributors and mappers for ze_monkeymappers3</p>
                    </div>

                    {/* View Switcher Controls */}
                    <div className="d-flex align-items-center gap-2">
                        <div className="btn-group bg-dark p-1 rounded-pill border border-secondary border-opacity-25" role="group">
                            <button
                                type="button"
                                className={`btn btn-sm rounded-pill px-3 fw-bold ${viewMode === 'table' ? 'btn-warning text-dark' : 'btn-dark text-white-50 border-0'}`}
                                onClick={() => setViewMode('table')}
                            >
                                📋 Table
                            </button>
                            <button
                                type="button"
                                className={`btn btn-sm rounded-pill px-3 fw-bold ${viewMode === 'cards' ? 'btn-warning text-dark' : 'btn-dark text-white-50 border-0'}`}
                                onClick={() => setViewMode('cards')}
                            >
                                🎴 Cards
                            </button>
                            <button
                                type="button"
                                className={`btn btn-sm rounded-pill px-3 fw-bold ${viewMode === 'compact' ? 'btn-warning text-dark' : 'btn-dark text-white-50 border-0'}`}
                                onClick={() => setViewMode('compact')}
                            >
                                🏷️ Compact
                            </button>
                        </div>
                        <div className="bg-dark px-3 py-2 rounded-pill border border-secondary border-opacity-25 text-warning fw-bold">
                            {mappers.length} Mappers
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="input-group">
                    <span className="input-group-text bg-dark border-0 text-white-50">🔍</span>
                    <input
                        type="text"
                        className="form-control bg-dark text-white border-0 shadow-none py-2"
                        placeholder="Search by mapper name, Steam ID, or assigned task..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    {search && (
                        <button className="btn btn-dark text-white-50 border-0" onClick={() => setSearch('')}>✕</button>
                    )}
                </div>
            </div>

            {/* Content Section */}
            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-warning" role="status"></div>
                </div>
            ) : filteredMappers.length === 0 ? (
                <div className="card bg-black border-0 p-5 text-center text-white-50 rounded-4">
                    No mappers found matching "{search}".
                </div>
            ) : viewMode === 'table' ? (
                /* 1. TABLE VIEW */
                <div className="card bg-black bg-gradient border-0 shadow-lg rounded-4 overflow-hidden">
                    <div className="table-responsive">
                        <table className="table table-dark table-hover align-middle mb-0">
                            <thead className="bg-dark text-uppercase small text-warning fw-semibold border-bottom border-secondary border-opacity-25">
                                <tr>
                                    <th className="py-3 px-4">Mapper</th>
                                    <th className="py-3 px-4">Steam ID</th>
                                    <th className="py-3 px-4">Task / Contribution</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMappers.map((m) => (
                                    <tr key={m.id} className="border-bottom border-secondary border-opacity-10">
                                        <td className="py-3 px-4 fw-bold text-white">{m.player_name}</td>
                                        <td className="py-3 px-4"><code className="text-warning bg-dark px-2 py-1 rounded small">{m.steam_id}</code></td>
                                        <td className="py-3 px-4 text-white-50">{m.assigned_task}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : viewMode === 'cards' ? (
                /* 2. GRID CARDS VIEW */
                <div className="row g-3">
                    {filteredMappers.map((m) => (
                        <div key={m.id} className="col-md-6 col-lg-4">
                            <div className="card bg-black bg-gradient border-0 shadow-lg p-4 rounded-4 h-100 d-flex flex-column justify-content-between">
                                <div>
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        <h5 className="text-warning fw-bold mb-0 text-truncate">{m.player_name}</h5>
                                    </div>
                                    <code className="text-white-50 bg-dark px-2 py-1 rounded small d-inline-block mb-3">
                                        {m.steam_id}
                                    </code>
                                    <p className="text-light small mb-0 lh-base">
                                        {m.assigned_task}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* 3. COMPACT BADGES VIEW */
                <div className="card bg-black bg-gradient border-0 shadow-lg p-4 rounded-4">
                    <div className="d-flex flex-wrap gap-2">
                        {filteredMappers.map((m) => (
                            <div key={m.id} className="bg-dark p-3 rounded-3 border border-secondary border-opacity-10 d-flex flex-column gap-1 flex-grow-1" style={{ minWidth: '220px', maxWidth: '310px' }}>
                                <div className="d-flex justify-content-between align-items-center">
                                    <strong className="text-warning">{m.player_name}</strong>
                                    <code className="text-white-50 small">{m.steam_id}</code>
                                </div>
                                <span className="text-white-50 small text-truncate">{m.assigned_task}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};