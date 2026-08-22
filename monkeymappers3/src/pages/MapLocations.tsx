import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { MapLocation } from '../types';

export const MapLocations: React.FC = () => {
    const [locations, setLocations] = useState<MapLocation[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);

    useEffect(() => {
        async function fetchLocations() {
            setLoading(true);
            const { data, error } = await supabase.from('map_locations').select('*').order('name');
            if (error) console.error(error.message);
            if (data) setLocations(data as MapLocation[]);
            setLoading(false);
        }
        fetchLocations();
    }, []);

    return (
        <div className="container py-2" style={{ maxWidth: '1000px' }}>
            {/* Header Banner */}
            <div className="card bg-black bg-gradient border-0 shadow-lg p-4 rounded-4 mb-4">
                <h2 className="text-warning fw-bold mb-1">Location list</h2>
                <p className="text-white-50 mb-0 small">Explore key rooms, stages, and holds across the map.</p>
            </div>

            {/* Locations Grid */}
            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-warning" role="status"></div>
                </div>
            ) : locations.length === 0 ? (
                <div className="card bg-black border-0 p-5 text-center text-white-50 rounded-4">
                    No map locations registered yet.
                </div>
            ) : (
                <div className="row g-4">
                    {locations.map((loc) => (
                        <div key={loc.id} className="col-md-6">
                            <div
                                className="card bg-black bg-gradient border-0 shadow-lg rounded-4 overflow-hidden h-100"
                                style={{ cursor: 'pointer' }}
                                onClick={() => setSelectedLocation(loc)}
                            >
                                <div style={{ height: '220px', overflow: 'hidden' }} className="bg-dark">
                                    <img
                                        src={loc.image_url}
                                        alt={loc.name}
                                        className="w-100 h-100 object-fit-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x400?text=No+Image+Available';
                                        }}
                                    />
                                </div>
                                <div className="p-4 d-flex flex-column justify-content-between flex-grow-1">
                                    <div>
                                        <h5 className="text-warning fw-bold mb-2">{loc.name}</h5>
                                        <p className="text-white-50 small mb-0 text-truncate">{loc.description}</p>
                                    </div>
                                    <div className="pt-3">
                                        <span className="text-warning small fw-bold">Click to enlarge & read →</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Detailed Inspection Modal */}
            {selectedLocation && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }} onClick={() => setSelectedLocation(null)}>
                    <div className="modal-dialog modal-lg modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-content bg-black text-white border-0 shadow-lg rounded-4 overflow-hidden">
                            <div className="position-relative" style={{ maxHeight: '450px', overflow: 'hidden' }}>
                                <img
                                    src={selectedLocation.image_url}
                                    alt={selectedLocation.name}
                                    className="w-100 h-100 object-fit-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x500?text=No+Image+Available';
                                    }}
                                />
                                <button
                                    type="button"
                                    className="btn-close btn-close-white position-absolute top-0 end-0 m-3 p-2 bg-dark rounded-circle"
                                    onClick={() => setSelectedLocation(null)}
                                ></button>
                            </div>
                            <div className="p-4">
                                <h3 className="text-warning fw-bold mb-3">{selectedLocation.name}</h3>
                                <p className="text-light lh-lg mb-0" style={{ whiteSpace: 'pre-line' }}>
                                    {selectedLocation.description}
                                </p>
                            </div>
                            <div className="modal-footer border-0 pt-0">
                                <button type="button" className="btn btn-dark text-white-50" onClick={() => setSelectedLocation(null)}>
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