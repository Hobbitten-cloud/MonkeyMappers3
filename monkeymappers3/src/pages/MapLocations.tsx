import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { MapLocation } from '../types';

export const MapLocations: React.FC = () => {
    const [locations, setLocations] = useState<MapLocation[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);

    // Form, Image File & Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [editingItem, setEditingItem] = useState<MapLocation | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [formData, setFormData] = useState({
        name: '',
        image_url: '',
        description: '',
    });

    const fetchLocations = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('map_locations').select('*').order('name');
        if (error) console.error(error.message);
        if (data) setLocations(data as MapLocation[]);
        setLoading(false);
    };

    const checkUserSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setIsAdmin(!!session);
    };

    useEffect(() => {
        checkUserSession();
        fetchLocations();
    }, []);

    const handleOpenAddModal = () => {
        setEditingItem(null);
        setSelectedFile(null);
        setFormData({ name: '', image_url: '', description: '' });
        setIsEditModalOpen(true);
    };

    const handleOpenEditModal = (loc: MapLocation, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setEditingItem(loc);
        setSelectedFile(null);
        setFormData({
            name: loc.name,
            image_url: loc.image_url || '',
            description: loc.description || '',
        });
        setIsEditModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) return;

        try {
            setIsUploading(true);
            let finalImageUrl = formData.image_url;

            // Handle local file upload to Supabase Storage Bucket
            if (selectedFile) {
                const fileExt = selectedFile.name.split('.').pop();
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
                const filePath = `locations/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('map_locations')
                    .upload(filePath, selectedFile, { upsert: true });

                if (uploadError) {
                    alert(`Failed to upload image: ${uploadError.message}`);
                    setIsUploading(false);
                    return;
                }

                const { data: publicUrlData } = supabase.storage
                    .from('map_locations')
                    .getPublicUrl(filePath);

                finalImageUrl = publicUrlData.publicUrl;
            }

            const payload = {
                name: formData.name,
                image_url: finalImageUrl,
                description: formData.description,
            };

            if (editingItem?.id) {
                await supabase
                    .from('map_locations')
                    .update(payload)
                    .eq('id', editingItem.id);
            } else {
                await supabase
                    .from('map_locations')
                    .insert([payload]);
            }

            setIsEditModalOpen(false);
            setEditingItem(null);
            setSelectedFile(null);
            fetchLocations();
        } catch (err) {
            console.error('Error saving location:', err);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (id: number, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (!window.confirm('Delete this map location?')) return;

        await supabase.from('map_locations').delete().eq('id', id);
        if (selectedLocation?.id === id) setSelectedLocation(null);
        fetchLocations();
    };

    return (
        <div className="container py-2" style={{ maxWidth: '1000px' }}>
            {/* Header Banner */}
            <div className="card bg-black bg-gradient border-0 shadow-lg p-4 rounded-4 mb-4">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                    <div>
                        <h2 className="text-warning fw-bold mb-1">Location list</h2>
                        <p className="text-white-50 mb-0 small">Explore key rooms, stages, and holds across the map.</p>
                    </div>
                    {isAdmin && (
                        <button className="btn btn-warning btn-sm fw-bold px-3 py-2" onClick={handleOpenAddModal}>
                            + Add Location
                        </button>
                    )}
                </div>
            </div>

            {/* Locations Grid */}
            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-warning" role="status"></div>
                </div>
            ) : locations.length === 0 ? (
                <div className="card bg-black border-0 p-5 text-center text-white-50 rounded-4 d-flex flex-column align-items-center gap-3">
                    <span>No map locations registered yet.</span>
                    {isAdmin && (
                        <button className="btn btn-outline-warning btn-sm fw-bold px-4" onClick={handleOpenAddModal}>
                            + Register First Location
                        </button>
                    )}
                </div>
            ) : (
                <div className="row g-4">
                    {locations.map((loc) => (
                        <div key={loc.id} className="col-md-6">
                            <div
                                className="card bg-black bg-gradient border-0 shadow-lg rounded-4 overflow-hidden h-100 position-relative"
                                style={{ cursor: 'pointer' }}
                                onClick={() => setSelectedLocation(loc)}
                            >
                                <div style={{ height: '220px', overflow: 'hidden' }} className="bg-dark position-relative">
                                    <img
                                        src={loc.image_url}
                                        alt={loc.name}
                                        className="w-100 h-100 object-fit-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x400?text=No+Image+Available';
                                        }}
                                    />
                                    {isAdmin && (
                                        <div className="position-absolute top-0 end-0 m-2 d-flex gap-1">
                                            <button
                                                className="btn btn-sm btn-dark bg-opacity-75 text-white border-secondary py-1 px-2"
                                                onClick={(e) => handleOpenEditModal(loc, e)}
                                                title="Edit Location"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className="btn btn-sm btn-dark bg-opacity-75 text-danger border-secondary py-1 px-2"
                                                onClick={(e) => handleDelete(loc.id, e)}
                                                title="Delete Location"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    )}
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
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h3 className="text-warning fw-bold mb-0">{selectedLocation.name}</h3>
                                    {isAdmin && (
                                        <div className="d-flex gap-2">
                                            <button
                                                className="btn btn-sm btn-outline-warning"
                                                onClick={() => {
                                                    const target = selectedLocation;
                                                    setSelectedLocation(null);
                                                    handleOpenEditModal(target);
                                                }}
                                            >
                                                Edit Location
                                            </button>
                                            <button
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => handleDelete(selectedLocation.id)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
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

            {/* Admin Add / Edit Modal */}
            {isEditModalOpen && (
                <div className="modal show d-block bg-black bg-opacity-75" tabIndex={-1}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content bg-dark text-white border border-secondary rounded-4">
                            <div className="modal-header border-secondary">
                                <h5 className="modal-title text-warning fw-bold">
                                    {editingItem ? 'Edit Location' : 'Add New Location'}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={() => setIsEditModalOpen(false)}
                                ></button>
                            </div>
                            <form onSubmit={handleSave}>
                                <div className="modal-body d-flex flex-column gap-3">
                                    <div>
                                        <label className="form-label small text-white-50">Location Name</label>
                                        <input
                                            type="text"
                                            className="form-control bg-black text-white border-secondary"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g. Stage 1 Spawn Room"
                                            required
                                        />
                                    </div>

                                    {/* Upload Local Image File */}
                                    <div>
                                        <label className="form-label small text-white-50">Upload Image File (from PC)</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="form-control bg-black text-white border-secondary"
                                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                        />
                                    </div>

                                    {/* Optional Direct URL Fallback */}
                                    <div>
                                        <label className="form-label small text-white-50">Or External Image URL</label>
                                        <input
                                            type="text"
                                            className="form-control bg-black text-white border-secondary"
                                            value={formData.image_url}
                                            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                            placeholder="https://i.imgur.com/example.jpg"
                                            disabled={!!selectedFile}
                                        />
                                        {selectedFile && (
                                            <small className="text-warning mt-1 d-block" style={{ fontSize: '0.72rem' }}>
                                                Selected file standard: <strong>{selectedFile.name}</strong> (URL input disabled)
                                            </small>
                                        )}
                                    </div>

                                    <div>
                                        <label className="form-label small text-white-50">Description</label>
                                        <textarea
                                            rows={4}
                                            className="form-control bg-black text-white border-secondary"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Overview of holds, triggers, or key items in this location..."
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer border-secondary">
                                    <button
                                        type="button"
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => setIsEditModalOpen(false)}
                                        disabled={isUploading}
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-warning btn-sm fw-bold" disabled={isUploading}>
                                        {isUploading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                Uploading...
                                            </>
                                        ) : (
                                            'Save Location'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};