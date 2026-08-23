import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { MapItem } from '../types';

export const MapItems: React.FC = () => {
    const [items, setItems] = useState<MapItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
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

    const humanItems = items.filter((item) => item.type === 'Human');
    const zombieItems = items.filter((item) => item.type === 'Zombie');

    const renderItemCard = (item: MapItem) => (
        <div key={item.id} className="col-md-6">
            <div
                className="card bg-black bg-gradient border-0 shadow-lg rounded-4 overflow-hidden h-100"
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedItem(item)}
            >
                {item.image_url && (
                    <div style={{ height: '220px' }} className="bg-dark d-flex align-items-center justify-content-center p-2">
                        <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-100 h-100 object-fit-contain rounded-3"
                            onError={(e) => {
                                (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                            }}
                        />
                    </div>
                )}
                <div className="p-4 d-flex flex-column flex-grow-1">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                        <h5 className="text-white fw-bold mb-0">{item.name}</h5>
                        <span className={`badge ${item.type === 'Human' ? 'bg-primary text-white' : 'bg-danger text-white'} fw-bold`}>
                            {item.type} Item
                        </span>
                    </div>
                    <p className="text-white-50 small mb-3 flex-grow-1 text-truncate">{item.description}</p>

                    {/* Primary Ability Timings */}
                    <div className="d-flex justify-content-between align-items-center pt-2 border-top border-secondary border-opacity-10 text-white-50 small">
                        {item.activation_delay && item.activation_delay > 0 ? (
                            <span>Delay: <strong className="text-warning">{item.activation_delay}s</strong></span>
                        ) : null}
                        {item.duration && item.duration > 0 ? (
                            <span>Duration: <strong className="text-warning">{item.duration}s</strong></span>
                        ) : null}
                        <span>Cooldown: <strong className="text-warning">{item.cooldown > 0 ? `${item.cooldown}s` : 'None'}</strong></span>
                    </div>

                    {item.abilities && item.abilities.length > 0 && (
                        <div className="mt-2 text-warning small fw-bold">
                            + {item.abilities.length} additional {item.abilities.length === 1 ? 'ability' : 'abilities'}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="container py-4" style={{ maxWidth: '1000px' }}>
            {/* Main Header Banner */}
            <div className="card bg-black bg-gradient border-0 shadow-lg p-4 rounded-4 mb-5">
                <div>
                    <h2 className="text-warning fw-bold mb-1">Item list</h2>
                    <p className="text-white-50 mb-0 small">Special items, abilities, and weapons available on the map.</p>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-warning" role="status"></div>
                </div>
            ) : items.length === 0 ? (
                <div className="card bg-black border-0 p-5 text-center text-white-50 rounded-4">
                    No map items registered yet.
                </div>
            ) : (
                <div className="d-flex flex-column gap-5">
                    {/* Human Items Section */}
                    <div>
                        <div className="d-flex align-items-center justify-content-between mb-3 border-bottom border-secondary border-opacity-25 pb-2">
                            <h4 className="text-primary fw-bold mb-0">Human Items</h4>
                            <span className="badge bg-dark text-white-50 border border-secondary border-opacity-25">
                                {humanItems.length} {humanItems.length === 1 ? 'Item' : 'Items'}
                            </span>
                        </div>
                        {humanItems.length === 0 ? (
                            <div className="text-white-50 small bg-black bg-opacity-25 p-3 rounded-3">No human items registered yet.</div>
                        ) : (
                            <div className="row g-3">
                                {humanItems.map(renderItemCard)}
                            </div>
                        )}
                    </div>

                    {/* Zombie Items Section */}
                    <div>
                        <div className="d-flex align-items-center justify-content-between mb-3 border-bottom border-secondary border-opacity-25 pb-2">
                            <h4 className="text-danger fw-bold mb-0">Zombie Items</h4>
                            <span className="badge bg-dark text-white-50 border border-secondary border-opacity-25">
                                {zombieItems.length} {zombieItems.length === 1 ? 'Item' : 'Items'}
                            </span>
                        </div>
                        {zombieItems.length === 0 ? (
                            <div className="text-white-50 small bg-black bg-opacity-25 p-3 rounded-3">No zombie items registered yet.</div>
                        ) : (
                            <div className="row g-3">
                                {zombieItems.map(renderItemCard)}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Detailed Item Modal */}
            {selectedItem && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }} onClick={() => setSelectedItem(null)}>
                    <div className="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-content bg-black text-white border-0 shadow-lg rounded-4 overflow-hidden">
                            {selectedItem.image_url && (
                                <div className="position-relative bg-dark d-flex align-items-center justify-content-center p-3" style={{ maxHeight: '400px' }}>
                                    <img
                                        src={selectedItem.image_url}
                                        alt={selectedItem.name}
                                        className="w-100 h-100 object-fit-contain rounded-3"
                                        style={{ maxHeight: '380px' }}
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                                        }}
                                    />
                                    <button
                                        type="button"
                                        className="btn-close btn-close-white position-absolute top-0 end-0 m-3 p-2 bg-dark rounded-circle border border-secondary"
                                        onClick={() => setSelectedItem(null)}
                                    ></button>
                                </div>
                            )}
                            <div className="p-4">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h3 className="text-warning fw-bold mb-0">{selectedItem.name}</h3>
                                    <span className={`badge ${selectedItem.type === 'Human' ? 'bg-primary' : 'bg-danger'} fs-6 px-3 py-2`}>
                                        {selectedItem.type} Item
                                    </span>
                                </div>

                                {/* Primary Ability Overview */}
                                <div className="mb-4">
                                    <span className="text-white-50 small d-block mb-1">Item Overview</span>
                                    <p className="text-light lh-lg mb-2" style={{ whiteSpace: 'pre-line' }}>{selectedItem.description}</p>

                                    <div className="row g-2">
                                        {selectedItem.activation_delay && selectedItem.activation_delay > 0 ? (
                                            <div className="col">
                                                <div className="bg-dark p-2 rounded-3 text-center border border-secondary border-opacity-10">
                                                    <span className="text-white-50 small d-block">Delay</span>
                                                    <strong className="text-warning">{selectedItem.activation_delay}s</strong>
                                                </div>
                                            </div>
                                        ) : null}
                                        {selectedItem.duration && selectedItem.duration > 0 ? (
                                            <div className="col">
                                                <div className="bg-dark p-2 rounded-3 text-center border border-secondary border-opacity-10">
                                                    <span className="text-white-50 small d-block">Duration</span>
                                                    <strong className="text-warning">{selectedItem.duration}s</strong>
                                                </div>
                                            </div>
                                        ) : null}
                                        <div className="col">
                                            <div className="bg-dark p-2 rounded-3 text-center border border-secondary border-opacity-10">
                                                <span className="text-white-50 small d-block">Cooldown</span>
                                                <strong className="text-warning">{selectedItem.cooldown > 0 ? `${selectedItem.cooldown}s` : 'Passive'}</strong>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Multiple Abilities Section */}
                                {selectedItem.abilities && selectedItem.abilities.length > 0 && (
                                    <div className="mb-4 border-top border-secondary border-opacity-25 pt-3">
                                        <h5 className="text-warning fw-bold mb-3">Abilities Breakdown</h5>
                                        <div className="d-flex flex-column gap-3">
                                            {selectedItem.abilities.map((ab, idx) => (
                                                <div key={idx} className="bg-dark p-3 rounded-3 border border-secondary border-opacity-20">
                                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                                        <strong className="text-white">{ab.name}</strong>
                                                    </div>
                                                    {ab.description && ab.description.trim() !== '' && (
                                                        <p className="text-white-50 small mb-2">{ab.description}</p>
                                                    )}
                                                    <div className="d-flex gap-3 text-white-50 small border-top border-secondary border-opacity-10 pt-2">
                                                        {ab.activation_delay && ab.activation_delay > 0 ? (
                                                            <span>Delay: <strong className="text-warning">{ab.activation_delay}s</strong></span>
                                                        ) : null}
                                                        {ab.duration && ab.duration > 0 ? (
                                                            <span>Duration: <strong className="text-warning">{ab.duration}s</strong></span>
                                                        ) : null}
                                                        <span>Cooldown: <strong className="text-warning">{ab.cooldown > 0 ? `${ab.cooldown}s` : 'Passive'}</strong></span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="text-end">
                                    <button type="button" className="btn btn-warning fw-bold px-4" onClick={() => setSelectedItem(null)}>
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};