import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { MapChangelog } from '../types';

export const Changelogs: React.FC = () => {
    const [changelogs, setChangelogs] = useState<MapChangelog[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [selectedLog, setSelectedLog] = useState<MapChangelog | null>(null);

    useEffect(() => {
        async function fetchChangelogs() {
            setLoading(true);
            const { data, error } = await supabase
                .from('map_changelogs')
                .select('*')
                .order('release_date', { ascending: false });

            if (error) console.error(error.message);
            if (data) setChangelogs(data as MapChangelog[]);
            setLoading(false);
        }
        fetchChangelogs();
    }, []);

    return (
        <div className="container py-2" style={{ maxWidth: '1000px' }}>
            {/* Header Banner */}
            <div className="card bg-black bg-gradient border-0 shadow-lg p-4 rounded-4 mb-4">
                <h2 className="text-warning fw-bold mb-1">Changelog list</h2>
                <p className="text-white-50 mb-0 small">Version history, updates, bug fixes, and patch notes for ze_monkeymappers3.</p>
            </div>

            {/* Changelogs List */}
            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-warning" role="status"></div>
                </div>
            ) : changelogs.length === 0 ? (
                <div className="card bg-black border-0 p-5 text-center text-white-50 rounded-4">
                    No changelogs posted yet.
                </div>
            ) : (
                <div className="d-flex flex-column gap-3">
                    {changelogs.map((log) => (
                        <div
                            key={log.id}
                            className="card bg-black bg-gradient border-0 shadow-lg p-4 rounded-4"
                            style={{ cursor: 'pointer' }}
                            onClick={() => setSelectedLog(log)}
                        >
                            <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                                <div className="d-flex align-items-center gap-2">
                                    <span className="badge bg-warning text-dark fw-bold px-3 py-2 fs-6">
                                        {log.version}
                                    </span>
                                    <h4 className="text-white fw-bold mb-0">{log.title}</h4>
                                </div>
                                <small className="text-white-50">
                                    {log.release_date ? new Date(log.release_date).toLocaleDateString() : ''}
                                </small>
                            </div>

                            <p className="text-white-50 small mb-0 lh-base text-truncate" style={{ maxHeight: '48px' }}>
                                {log.changes}
                            </p>

                            <div className="pt-2 mt-2 border-top border-secondary border-opacity-10">
                                <span className="text-warning small fw-bold">Click to view full patch notes →</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Full Patch Notes Modal */}
            {selectedLog && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }} onClick={() => setSelectedLog(null)}>
                    <div className="modal-dialog modal-lg modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-content bg-black text-white border-0 shadow-lg rounded-4 p-4">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <div className="d-flex align-items-center gap-2">
                                    <span className="badge bg-warning text-dark fw-bold fs-5 px-3 py-2">
                                        {selectedLog.version}
                                    </span>
                                    <h3 className="text-warning fw-bold mb-0">{selectedLog.title}</h3>
                                </div>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={() => setSelectedLog(null)}
                                ></button>
                            </div>

                            <small className="text-white-50 d-block mb-3">
                                Released on: {selectedLog.release_date ? new Date(selectedLog.release_date).toLocaleString() : 'N/A'}
                            </small>

                            <div className="bg-dark p-4 rounded-3 mb-4 border border-secondary border-opacity-10">
                                <h6 className="text-warning fw-bold mb-3">Changes & Modifications</h6>
                                <div className="text-light lh-lg" style={{ whiteSpace: 'pre-line' }}>
                                    {selectedLog.changes}
                                </div>
                            </div>

                            <div className="text-end">
                                <button type="button" className="btn btn-warning fw-bold px-4" onClick={() => setSelectedLog(null)}>
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};