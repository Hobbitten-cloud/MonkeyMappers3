import React, { useState } from 'react';

interface Contributor {
    name: string;
    role: string;
}

interface StageSection {
    stageName: string;
    mappers: Contributor[];
}

export const MonkeyHistory: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'mm1' | 'mm2'>('mm1');

    // Monkey Mappers 1 Data
    const mm1Generic: Contributor[] = [
        { name: 'm4dara', role: 'Spawn Geometry' },
        { name: 'Berke', role: 'Human Items' },
        { name: 'Iszaar', role: 'Zombie Items' },
        { name: 'Jaek', role: 'NPC Systems' },
    ];

    const mm1Stages: StageSection[] = [
        {
            stageName: 'Prologue',
            mappers: [
                { name: 'Maradox', role: 'ZE Path Geometry' },
                { name: 'Mike Wazoski', role: 'ZE Path Geometry' },
                { name: 'Uverin', role: 'Stage Ending' },
            ],
        },
        {
            stageName: 'Stage 1',
            mappers: [
                { name: 'Vanya', role: 'ZE Path Geometry' },
                { name: 'Hobgoblin', role: 'ZE Path Geometry' },
                { name: '4echo', role: 'ZE Path Geometry' },
                { name: 'Pasas1345', role: 'ZE Path Geometry' },
                { name: 'Heavy', role: 'ZE Path Geometry' },
                { name: 'Malgo', role: 'ZE Path Geometry' },
                { name: 'Charta', role: 'Boss Fight' },
                { name: 'Rix', role: 'Stage Ending' },
            ],
        },
        {
            stageName: 'Stage 2',
            mappers: [
                { name: 'Lardy', role: 'ZE Path Geometry' },
                { name: 'Fz$cKxy', role: 'ZE Path Geometry' },
                { name: 'dsvdsvd', role: 'ZE Path Geometry' },
                { name: 'Xehanort', role: 'ZE Path Geometry' },
                { name: 'Vndrew', role: 'ZE Path Geometry' },
                { name: 'Hobbitten', role: 'Boss Fight' },
                { name: 'Nutwoomy', role: 'Stage Ending' },
            ],
        },
    ];

    // Monkey Mappers 2 Reference Breakdown Data
    const mm2General: Contributor[] = [
        { name: 'Hobbitten', role: 'Project Lead / Map Integration' },
        { name: 'Berke', role: 'Items' },
        { name: 'Pasas', role: 'Npcs' },
        { name: 'dsvdsvd', role: 'Major contributor' },
    ];

    return (
        <div className="container py-3" style={{ maxWidth: '1000px' }}>
            {/* Page Header */}
            <div className="card bg-black bg-gradient border-0 shadow-lg p-4 rounded-4 mb-4">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                    <div>
                        <h2 className="text-warning fw-bold mb-1">Monkey Mappers History</h2>
                        <p className="text-white-50 mb-0 small">
                            Archive of the Monkey Mappers project, showcasing the original team and contributors from both iterations of the map.
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

            {/* MONKEY MAPPERS 1 CONTENT */}
            {activeTab === 'mm1' && (
                <div className="d-flex flex-column gap-4">
                    {/* Rules / Concept Banner */}
                    <div className="bg-dark p-3 rounded-3 border border-warning border-opacity-25 d-flex align-items-center justify-content-between flex-wrap gap-2">
                        <div>
                            <span className="text-warning fw-bold d-block">Project Challenge Format</span>
                            <span className="text-white-50 small">
                                Every section was strictly limited to <strong>2 hours</strong> of hammer time per mapper!
                            </span>
                        </div>
                        <span className="badge bg-warning text-dark fs-6 px-3 py-2">22 Mappers Total</span>
                    </div>

                    {/* System & Core Features */}
                    <div className="card bg-black border-0 shadow-lg p-4 rounded-4">
                        <h5 className="text-warning fw-bold mb-3">Core & Systems Crew</h5>
                        <div className="row g-3">
                            {mm1Generic.map((item, idx) => (
                                <div key={idx} className="col-md-3 col-sm-6">
                                    <div className="bg-dark p-3 rounded-3 border border-secondary border-opacity-10 h-100">
                                        <strong className="text-white d-block">{item.name}</strong>
                                        <small className="text-warning">{item.role}</small>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Stages Breakdown */}
                    <div className="row g-4">
                        {mm1Stages.map((stage, idx) => (
                            <div key={idx} className="col-lg-4 col-md-6">
                                <div className="card bg-black border-0 shadow-lg p-4 rounded-4 h-100">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h5 className="text-warning fw-bold mb-0">{stage.stageName}</h5>
                                        <span className="badge bg-secondary">{stage.mappers.length} Sections</span>
                                    </div>
                                    <div className="d-flex flex-column gap-2">
                                        {stage.mappers.map((m, mIdx) => (
                                            <div
                                                key={mIdx}
                                                className="bg-dark p-2 px-3 rounded-3 border border-secondary border-opacity-10 d-flex justify-content-between align-items-center"
                                            >
                                                <strong className="text-white small">{m.name}</strong>
                                                <span className="badge bg-black text-white-50 fw-normal small">{m.role}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* MONKEY MAPPERS 2 CONTENT */}
            {activeTab === 'mm2' && (
                <div className="d-flex flex-column gap-4">
                    <div className="bg-dark p-3 rounded-3 border border-warning border-opacity-25 d-flex align-items-center justify-content-between flex-wrap gap-2">
                        <div>
                            <span className="text-warning fw-bold d-block">Monkey Mappers 2 Expansion</span>
                            <span className="text-white-50 small">
                                Expanded iteration featuring updated mechanics, boss fights, and community tracks. While still keeping the 2 hour limit per mapper, the project was more open-ended and allowed for more creative freedom.
                            </span>
                        </div>
                    </div>

                    <div className="card bg-black border-0 shadow-lg p-4 rounded-4">
                        <h5 className="text-warning fw-bold mb-3">Core Infrastructure</h5>
                        <div className="row g-3 mb-4">
                            {mm2General.map((item, idx) => (
                                <div key={idx} className="col-md-4">
                                    <div className="bg-dark p-3 rounded-3 border border-secondary border-opacity-10">
                                        <strong className="text-white d-block">{item.name}</strong>
                                        <small className="text-warning">{item.role}</small>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Title and Button inline */}
                        <div className="d-flex align-items-center gap-3 mb-3">
                            <h5 className="text-warning fw-bold mb-0">Monkey mappers 2 - Participants</h5>
                            <a
                                href="https://docs.google.com/spreadsheets/d/1bN4sGWGfqCLGzt20cpANH9xv5qz1YI6x7glKxSeaG48/edit?usp=sharing"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-warning btn-sm fw-bold px-3"
                            >
                                Open spreadsheet ↗
                            </a>
                        </div>

                        <div className="ratio ratio-16x9 rounded-4 overflow-hidden border border-secondary border-opacity-25">
                            <iframe
                                src="https://docs.google.com/spreadsheets/d/1bN4sGWGfqCLGzt20cpANH9xv5qz1YI6x7glKxSeaG48/preview"
                                title="Monkey Mappers 2 Spreadsheet"
                                allow="autoplay"
                            ></iframe>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};