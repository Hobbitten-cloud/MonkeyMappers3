import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { MapItem } from '../types';

export const MapItems: React.FC = () => {
    const [items, setItems] = useState<MapItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [filter, setFilter] = useState<'All' | 'Human' | 'Zombie'>('All');
    const [selectedItem, setSelectedItem] = useState<MapItem | null>(null);

    useEffect(() => {
        async function fetchItems() {
            setLoading(true);
            const { data, error } = await supabase.from('map_items').select('*').order('name');
            if (error) console.error(error.message);
            if (data) setItems(data as MapItem[]);
            setLoading(false);
        }
        fetchItems();
    }, []);

    const filteredItems = items.filter((item) => filter === 'All' || item.type === filter);

    return (
        <div className="container py-2" style={{ maxWidth: '1000px' }}>
            {/* Header Banner */}
            <div className="card bg-black bg-gradient border-0 shadow-lg p-4 rounded-4 mb-4">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                    <div>
                        <h2 className="text-warning fw-bold mb-1">Item list</h2>
                        <p className="text-white-50 mb-0 small">Special items, abilities, and weapons available on the map.</p>
                    </div>
                    <div className="btn-group" role="group">
                        <button
                            className={`btn btn-sm ${filter === 'All' ? 'btn-warning fw-bold' : 'btn-dark text-white-50'}`}
                            onClick={() => setFilter('All')}
                        >
                            All
                        </button>
                        <button
                            className={`btn btn-sm ${filter === 'Human' ? 'btn-warning fw-bold' : 'btn-dark text-white-50'}`}
                            onClick={() => setFilter('Human')}
                        >
                            Human
                        </button>
                        <button
                            className={`btn btn-sm ${filter === 'Zombie' ? 'btn-warning fw-bold' : 'btn-dark text-white-50'}`}
                            onClick={() => setFilter('Zombie')}
                        >
                            Zombie
                        </button>
                    </div>
                </div>
            </div>

            {/* Items List */}
            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-warning" role="status"></div>
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="card bg-black border-0 p-5 text-center text-white-50 rounded-4">
                    No map items registered yet.
                </div>
            ) : (
                <div className="row g-3">
                    {filteredItems.map((item) => (
                        <div key={item.id} className="col-md-6">
                            <div
                                className="card bg-black bg-gradient border-0 shadow-lg p-4 rounded-4 h-100"
                                style={{ cursor: 'pointer' }}
                                onClick={() => setSelectedItem(item)}
                            >
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                    <h5 className="text-white fw-bold mb-0">{item.name}</h5>
                                    <span className={`badge ${item.type === 'Human' ? 'bg-primary text-white' : 'bg-danger text-white'} fw-bold`}>
                                        {item.type} Item
                                    </span>
                                </div>
                                <p className="text-white-50 small mb-3 flex-grow-1 text-truncate">{item.description}</p>
                                <div className="d-flex justify-content-between align-items-center pt-2 border-top border-secondary border-opacity-10">
                                    <small className="text-white-50">Cooldown:</small>
                                    <span className="text-warning fw-bold small">
                                        {item.cooldown > 0 ? `${item.cooldown}s` : 'Passive / Single Use'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Detailed Item Modal */}
            {selectedItem && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }} onClick={() => setSelectedItem(null)}>
                    <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-content bg-black text-white border-0 shadow-lg rounded-4 p-4">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h3 className="text-warning fw-bold mb-0">{selectedItem.name}</h3>
                                <span className={`badge ${selectedItem.type === 'Human' ? 'bg-primary' : 'bg-danger'} fs-6 px-3 py-2`}>
                                    {selectedItem.type} Item
                                </span>
                            </div>
                            <div className="bg-dark p-3 rounded-3 mb-3 border border-secondary border-opacity-10">
                                <span className="text-white-50 small d-block mb-1">Cooldown / Usage</span>
                                <strong className="text-warning">
                                    {selectedItem.cooldown > 0 ? `${selectedItem.cooldown} seconds` : 'Passive / Single Use'}
                                </strong>
                            </div>
                            <div className="mb-4">
                                <span className="text-white-50 small d-block mb-1">Item Mechanics & Overview</span>
                                <p className="text-light lh-lg mb-0" style={{ whiteSpace: 'pre-line' }}>
                                    {selectedItem.description}
                                </p>
                            </div>
                            <div className="text-end">
                                <button type="button" className="btn btn-warning fw-bold px-4" onClick={() => setSelectedItem(null)}>
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