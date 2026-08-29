import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface Contributor {
    id?: number;
    project_version: string;
    stage_name?: string;
    name: string;
    role: string;
}

export const MonkeyHistory: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'mm1' | 'mm2'>('mm1');
    const [contributors, setContributors] = useState<Contributor[]>([]);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);

    const [editingItem, setEditingItem] = useState<Contributor | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        role: '',
        project_version: 'mm1_core',
        stage_name: '',
    });

    useEffect(() => {
        checkUserSession();
        fetchContributors(true);
    }, []);

    const checkUserSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setIsAdmin(!!session);
    };

    const fetchContributors = async (isInitialLoad = false) => {
        if (isInitialLoad) setLoading(true);
        const { data, error } = await supabase
            .from('history_contributors')
            .select('*')
            .order('id', { ascending: true });

        if (!error && data) {
            setContributors(data as Contributor[]);
        }
        if (isInitialLoad) setLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.role) return;

        const scrollY = window.scrollY;

        if (editingItem?.id) {
            await supabase
                .from('history_contributors')
                .update(formData)
                .eq('id', editingItem.id);
        } else {
            await supabase
                .from('history_contributors')
                .insert([formData]);
        }

        setEditingItem(null);
        setFormData({ name: '', role: '', project_version: 'mm1_core', stage_name: '' });
        await fetchContributors(false);

        // Restore scroll position
        window.scrollTo({ top: scrollY });
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Delete this contributor entry?')) return;
        const scrollY = window.scrollY;
        await supabase.from('history_contributors').delete().eq('id', id);
        await fetchContributors(false);
        window.scrollTo({ top: scrollY });
    };

    const startEdit = (item: Contributor) => {
        setEditingItem(item);
        setFormData({
            name: item.name,
            role: item.role,
            project_version: item.project_version,
            stage_name: item.stage_name || '',
        });
    };

    const startAdd = (version: string, stage: string = '') => {
        setEditingItem({
            project_version: version,
            stage_name: stage,
            name: '',
            role: ''
        });
        setFormData({
            name: '',
            role: '',
            project_version: version,
            stage_name: stage,
        });
    };

    const mm1Generic = contributors.filter(c => c.project_version === 'mm1_core');
    const mm2General = contributors.filter(c => c.project_version === 'mm2_core');
    const mm2Participants = contributors.filter(c => c.project_version === 'mm2_participant');

    const mm1StagesList = ['Prologue', 'Stage 1', 'Stage 2'];
    const mm2StagesList = Array.from(
        new Set(
            contributors
                .filter(c => c.project_version === 'mm2_stage')
                .map(c => c.stage_name || 'General')
        )
    );

    return (
        <div className="container py-3" style={{ maxWidth: '1200px' }}>
            {/* Page Header */}
            <div className="card bg-black bg-gradient border-0 shadow-lg p-4 rounded-4 mb-4">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                    <div>
                        <h2 className="text-warning fw-bold mb-1">Monkey Mappers History</h2>
                        <p className="text-white-50 mb-0 small">
                            Archive of the Monkey Mappers project, showcasing the original team and stage layouts.
                        </p>
                    </div>
                    <div className="btn-group" role="group">
                        <button
                            className={`btn btn-sm ${activeTab === 'mm1' ? 'btn-warning fw-bold' : 'btn-dark text-white-50'}`}
                            onClick={() => setActiveTab('mm1')}
                        >
                            Monkey Mappers 1
                        </button>
                        <button
                            className={`btn btn-sm ${activeTab === 'mm2' ? 'btn-warning fw-bold' : 'btn-dark text-white-50'}`}
                            onClick={() => setActiveTab('mm2')}
                        >
                            Monkey Mappers 2
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-warning" role="status"></div>
                </div>
            ) : (
                <>
                    {/* MONKEY MAPPERS 1 CONTENT */}
                    {activeTab === 'mm1' && (
                        <div className="d-flex flex-column gap-4">
                            <div className="bg-dark p-3 rounded-3 border border-warning border-opacity-25 d-flex align-items-center justify-content-between flex-wrap gap-2">
                                <div>
                                    <span className="text-warning fw-bold d-block">Project Challenge Format</span>
                                    <span className="text-white-50 small">
                                        Every section was strictly limited to <strong>2 hours</strong> of hammer time per mapper!
                                    </span>
                                </div>
                                <span className="badge bg-warning text-dark fs-6 px-3 py-2">22 Mappers Total</span>
                            </div>

                            <div className="card bg-black border-0 shadow-lg p-3 p-md-4 rounded-4">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h5 className="text-warning fw-bold mb-0">Core & Systems Crew</h5>
                                    {isAdmin && (
                                        <button className="btn btn-outline-warning btn-sm" onClick={() => startAdd('mm1_core')}>
                                            + Add Core Member
                                        </button>
                                    )}
                                </div>
                                <div className="row g-2">
                                    {mm1Generic.map((item) => (
                                        <div key={item.id} className="col-lg-3 col-md-4 col-sm-6">
                                            <div className="bg-dark p-2 px-3 rounded-3 border border-secondary border-opacity-10 h-100">
                                                <strong className="text-white d-block small">{item.name}</strong>
                                                <small className="text-warning" style={{ fontSize: '0.75rem' }}>{item.role}</small>
                                                {isAdmin && (
                                                    <div className="mt-1 d-flex gap-1">
                                                        <button className="btn btn-xs btn-outline-light py-0 px-1" style={{ fontSize: '0.65rem' }} onClick={() => startEdit(item)}>Edit</button>
                                                        <button className="btn btn-xs btn-outline-danger py-0 px-1" style={{ fontSize: '0.65rem' }} onClick={() => handleDelete(item.id!)}>Delete</button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="row g-3">
                                {mm1StagesList.map((stageName) => {
                                    const stageMappers = contributors.filter(c => c.project_version === 'mm1_stage' && c.stage_name === stageName);
                                    return (
                                        <div key={stageName} className="col-lg-4 col-md-6">
                                            <div className="card bg-black border-0 shadow-lg p-3 rounded-4 h-100 d-flex flex-column justify-content-between">
                                                <div>
                                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                                        <h6 className="text-warning fw-bold mb-0">{stageName}</h6>
                                                        <span className="badge bg-secondary" style={{ fontSize: '0.68rem' }}>{stageMappers.length} Sections</span>
                                                    </div>
                                                    <div className="d-flex flex-column gap-1.5 mb-2">
                                                        {stageMappers.map((m) => (
                                                            <div
                                                                key={m.id}
                                                                className="bg-dark p-2 px-2.5 rounded-3 border border-secondary border-opacity-10 d-flex justify-content-between align-items-center"
                                                            >
                                                                <div className="text-truncate me-2">
                                                                    <strong className="text-white small d-block text-truncate" style={{ fontSize: '0.82rem' }}>{m.name}</strong>
                                                                    <span className="badge bg-black text-white-50 fw-normal" style={{ fontSize: '0.65rem' }}>{m.role}</span>
                                                                </div>
                                                                {isAdmin && (
                                                                    <div className="d-flex gap-1 flex-shrink-0">
                                                                        <button className="btn btn-xs btn-outline-light py-0 px-1" style={{ fontSize: '0.65rem' }} onClick={() => startEdit(m)}>✏️</button>
                                                                        <button className="btn btn-xs btn-outline-danger py-0 px-1" style={{ fontSize: '0.65rem' }} onClick={() => handleDelete(m.id!)}>🗑️</button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                {isAdmin && (
                                                    <button className="btn btn-outline-warning btn-sm w-100 mt-2 py-1 small" onClick={() => startAdd('mm1_stage', stageName)}>
                                                        + Add to {stageName}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* MONKEY MAPPERS 2 CONTENT */}
                    {activeTab === 'mm2' && (
                        <div className="d-flex flex-column gap-3">
                            <div className="bg-dark p-3 rounded-3 border border-warning border-opacity-25 d-flex align-items-center justify-content-between flex-wrap gap-2">
                                <div>
                                    <span className="text-warning fw-bold d-block">Monkey Mappers 2 Layout Breakdown</span>
                                    <span className="text-white-50 small">
                                        Full list of mapper assignments grouped by map stages and layout progression.
                                    </span>
                                </div>
                            </div>

                            <div className="card bg-black border-0 shadow-lg p-3 p-md-4 rounded-4">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <h6 className="text-warning fw-bold mb-0">Core Infrastructure</h6>
                                    {isAdmin && (
                                        <button className="btn btn-outline-warning btn-sm py-0 px-2" style={{ fontSize: '0.75rem' }} onClick={() => startAdd('mm2_core')}>
                                            + Add Lead
                                        </button>
                                    )}
                                </div>
                                <div className="row g-2">
                                    {mm2General.map((item) => (
                                        <div key={item.id} className="col-lg-3 col-md-4 col-sm-6">
                                            <div className="bg-dark p-2 px-3 rounded-3 border border-secondary border-opacity-10 h-100">
                                                <strong className="text-white d-block small">{item.name}</strong>
                                                <small className="text-warning" style={{ fontSize: '0.72rem' }}>{item.role}</small>
                                                {isAdmin && (
                                                    <div className="mt-1 d-flex gap-1">
                                                        <button className="btn btn-xs btn-outline-light py-0 px-1" style={{ fontSize: '0.65rem' }} onClick={() => startEdit(item)}>Edit</button>
                                                        <button className="btn btn-xs btn-outline-danger py-0 px-1" style={{ fontSize: '0.65rem' }} onClick={() => handleDelete(item.id!)}>Delete</button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* MM2 Stage Layout Header */}
                            <div className="d-flex justify-content-between align-items-center mt-2">
                                <h6 className="text-warning fw-bold mb-0">Stage Breakdown & Layout</h6>
                                {isAdmin && (
                                    <button className="btn btn-outline-warning btn-sm py-0 px-2" style={{ fontSize: '0.75rem' }} onClick={() => startAdd('mm2_stage', 'Stage 1')}>
                                        + Add Stage Mapper
                                    </button>
                                )}
                            </div>

                            {/* Featured Prologue Banner */}
                            {mm2StagesList.filter(s => s.toLowerCase().includes('prologue')).map((stageName) => {
                                const stageMappers = contributors.filter(c => c.project_version === 'mm2_stage' && c.stage_name === stageName);
                                return (
                                    <div key={stageName} className="card bg-black border border-warning border-opacity-25 shadow-lg p-3 rounded-4">
                                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                                            <div className="d-flex align-items-center flex-wrap gap-2">
                                                <span className="badge bg-warning text-dark fw-bold px-2.5 py-1.5" style={{ fontSize: '0.78rem' }}>Prologue</span>
                                                {stageMappers.map((m) => (
                                                    <div key={m.id} className="bg-dark px-2.5 py-1 rounded-3 border border-secondary border-opacity-10 d-flex align-items-center gap-2">
                                                        <strong className="text-white small">{m.name}</strong>
                                                        <span className="badge bg-black text-warning fw-normal" style={{ fontSize: '0.65rem' }}>{m.role}</span>
                                                        {isAdmin && (
                                                            <div className="d-flex gap-1 ms-1">
                                                                <button className="btn btn-xs btn-outline-light py-0 px-1" style={{ fontSize: '0.65rem' }} onClick={() => startEdit(m)}>✏️</button>
                                                                <button className="btn btn-xs btn-outline-danger py-0 px-1" style={{ fontSize: '0.65rem' }} onClick={() => handleDelete(m.id!)}>🗑️</button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                                {isAdmin && (
                                                    <button className="btn btn-xs btn-outline-warning py-1 px-2 small" onClick={() => startAdd('mm2_stage', stageName)}>
                                                        + Add Mapper
                                                    </button>
                                                )}
                                            </div>
                                            <span className="badge bg-secondary" style={{ fontSize: '0.7rem' }}>{stageMappers.length} Contributor{stageMappers.length !== 1 ? 's' : ''}</span>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Compact 3-Column Grid for Stages (Stage 1, Stage 2, Stage 3, etc.) */}
                            <div className="row g-3">
                                {mm2StagesList.filter(s => !s.toLowerCase().includes('prologue')).map((stageName) => {
                                    const stageMappers = contributors.filter(c => c.project_version === 'mm2_stage' && c.stage_name === stageName);
                                    return (
                                        <div key={stageName} className="col-lg-4 col-md-6">
                                            <div className="card bg-black border-0 shadow-lg p-3 rounded-4 h-100 d-flex flex-column justify-content-between">
                                                <div>
                                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                                        <h6 className="text-warning fw-bold mb-0">{stageName}</h6>
                                                        <span className="badge bg-secondary" style={{ fontSize: '0.68rem' }}>{stageMappers.length} Contributors</span>
                                                    </div>
                                                    <div className="d-flex flex-column gap-1.5 mb-2">
                                                        {stageMappers.map((m) => (
                                                            <div
                                                                key={m.id}
                                                                className="bg-dark p-2 px-2.5 rounded-3 border border-secondary border-opacity-10 d-flex justify-content-between align-items-center"
                                                            >
                                                                <div className="text-truncate me-2">
                                                                    <strong className="text-white small d-block text-truncate" style={{ fontSize: '0.82rem' }}>{m.name}</strong>
                                                                    <span className="badge bg-black text-white-50 fw-normal" style={{ fontSize: '0.65rem' }}>{m.role}</span>
                                                                </div>
                                                                {isAdmin && (
                                                                    <div className="d-flex gap-1 flex-shrink-0">
                                                                        <button className="btn btn-xs btn-outline-light py-0 px-1" style={{ fontSize: '0.65rem' }} onClick={() => startEdit(m)}>✏️</button>
                                                                        <button className="btn btn-xs btn-outline-danger py-0 px-1" style={{ fontSize: '0.65rem' }} onClick={() => handleDelete(m.id!)}>🗑️</button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                {isAdmin && (
                                                    <button className="btn btn-outline-warning btn-sm w-100 mt-2 py-1 small" onClick={() => startAdd('mm2_stage', stageName)}>
                                                        + Add to {stageName}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Additional MM2 Roster */}
                            {mm2Participants.length > 0 && (
                                <div className="card bg-black border-0 shadow-lg p-3 p-md-4 rounded-4 mt-2">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <h6 className="text-warning fw-bold mb-0">Other Roster Contributors</h6>
                                        {isAdmin && (
                                            <button className="btn btn-outline-warning btn-sm py-0 px-2" style={{ fontSize: '0.75rem' }} onClick={() => startAdd('mm2_participant')}>
                                                + Add Participant
                                            </button>
                                        )}
                                    </div>
                                    <div className="row g-2">
                                        {mm2Participants.map((p) => (
                                            <div key={p.id} className="col-lg-3 col-md-4 col-sm-6">
                                                <div className="bg-dark p-2 px-3 rounded-3 border border-secondary border-opacity-10 d-flex justify-content-between align-items-center">
                                                    <div>
                                                        <strong className="text-white d-block small">{p.name}</strong>
                                                        <small className="text-warning" style={{ fontSize: '0.72rem' }}>{p.role}</small>
                                                    </div>
                                                    {isAdmin && (
                                                        <div className="d-flex gap-1">
                                                            <button className="btn btn-xs btn-outline-light py-0 px-1" style={{ fontSize: '0.65rem' }} onClick={() => startEdit(p)}>✏️</button>
                                                            <button className="btn btn-xs btn-outline-danger py-0 px-1" style={{ fontSize: '0.65rem' }} onClick={() => handleDelete(p.id!)}>🗑️</button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Admin Add / Edit Modal */}
            {editingItem && (
                <div className="modal show d-block bg-black bg-opacity-75" tabIndex={-1}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content bg-dark text-white border border-secondary">
                            <div className="modal-header border-secondary">
                                <h5 className="modal-title text-warning fw-bold">
                                    {editingItem.id ? 'Edit Entry' : 'Add Entry'}
                                </h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setEditingItem(null)}></button>
                            </div>
                            <form onSubmit={handleSave}>
                                <div className="modal-body d-flex flex-column gap-3">
                                    <div>
                                        <label className="form-label small text-white-50">Project Category</label>
                                        <select
                                            className="form-select bg-black text-warning border-secondary"
                                            value={formData.project_version}
                                            onChange={(e) => setFormData({ ...formData, project_version: e.target.value })}
                                        >
                                            <option value="mm1_core">MM1 Core</option>
                                            <option value="mm1_stage">MM1 Stage</option>
                                            <option value="mm2_core">MM2 Core</option>
                                            <option value="mm2_stage">MM2 Stage</option>
                                            <option value="mm2_participant">MM2 Participant</option>
                                        </select>
                                    </div>
                                    {(formData.project_version === 'mm1_stage' || formData.project_version === 'mm2_stage') && (
                                        <div>
                                            <label className="form-label small text-white-50">Stage / Section Name</label>
                                            <input
                                                type="text"
                                                className="form-control bg-black text-white border-secondary"
                                                value={formData.stage_name}
                                                onChange={(e) => setFormData({ ...formData, stage_name: e.target.value })}
                                                placeholder="e.g. Stage 1, Stage 2, Prologue"
                                                required
                                            />
                                        </div>
                                    )}
                                    <div>
                                        <label className="form-label small text-white-50">Mapper Name</label>
                                        <input
                                            type="text"
                                            className="form-control bg-black text-white border-secondary"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label small text-white-50">Role / Task</label>
                                        <input
                                            type="text"
                                            className="form-control bg-black text-white border-secondary"
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer border-secondary">
                                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditingItem(null)}>Cancel</button>
                                    <button type="submit" className="btn btn-warning btn-sm fw-bold">Save</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};