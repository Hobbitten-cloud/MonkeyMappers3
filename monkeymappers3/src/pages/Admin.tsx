import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { MapperTask, MapItem, MapLocation, MapChangelog } from '../types';

export const Admin: React.FC = () => {
    const [session, setSession] = useState<any>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [tab, setTab] = useState<'roster' | 'items' | 'locations' | 'changelogs'>('roster');

    // Roster state
    const [mappers, setMappers] = useState<MapperTask[]>([]);
    const [editingMapperId, setEditingMapperId] = useState<string | number | null>(null);
    const [mapperName, setMapperName] = useState('');
    const [steamId, setSteamId] = useState('');
    const [task, setTask] = useState('');

    // Items state
    const [items, setItems] = useState<MapItem[]>([]);
    const [editingItemId, setEditingItemId] = useState<number | null>(null);
    const [itemName, setItemName] = useState('');
    const [itemType, setItemType] = useState<'Human' | 'Zombie'>('Human');
    const [itemDesc, setItemDesc] = useState('');
    const [itemCooldown, setItemCooldown] = useState<number>(0);

    // Locations state
    const [locations, setLocations] = useState<MapLocation[]>([]);
    const [editingLocationId, setEditingLocationId] = useState<number | null>(null);
    const [locationName, setLocationName] = useState('');
    const [locationDesc, setLocationDesc] = useState('');
    const [locationImageUrl, setLocationImageUrl] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    // Changelogs state
    const [changelogs, setChangelogs] = useState<MapChangelog[]>([]);
    const [editingLogId, setEditingLogId] = useState<number | null>(null);
    const [logVersion, setLogVersion] = useState('');
    const [logTitle, setLogTitle] = useState('');
    const [logChanges, setLogChanges] = useState('');
    const [logStatus, setLogStatus] = useState<'In Progress' | 'Released' | 'Internal Testing' | 'Planned'>('Released');

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setSession(session));
        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (session) {
            fetchMappers();
            fetchItems();
            fetchLocations();
            fetchChangelogs();
        }
    }, [session]);

    const fetchMappers = async () => {
        const { data } = await supabase.from('mappers').select('*').order('player_name');
        if (data) setMappers(data as MapperTask[]);
    };

    const fetchItems = async () => {
        const { data } = await supabase.from('map_items').select('*').order('name');
        if (data) setItems(data as MapItem[]);
    };

    const fetchLocations = async () => {
        const { data } = await supabase.from('map_locations').select('*').order('name');
        if (data) setLocations(data as MapLocation[]);
    };

    const fetchChangelogs = async () => {
        const { data } = await supabase.from('map_changelogs').select('*').order('release_date', { ascending: false });
        if (data) setChangelogs(data as MapChangelog[]);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) alert(error.message);
    };

    // Mapper Save & Delete
    const handleSaveMapper = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingMapperId !== null) {
            await supabase.from('mappers').update({ player_name: mapperName, steam_id: steamId, assigned_task: task }).eq('id', editingMapperId);
        } else {
            await supabase.from('mappers').insert([{ player_name: mapperName, steam_id: steamId, assigned_task: task }]);
        }
        setEditingMapperId(null); setMapperName(''); setSteamId(''); setTask('');
        fetchMappers();
    };

    const handleDeleteMapper = async (id: string | number) => {
        if (window.confirm('Delete mapper?')) {
            await supabase.from('mappers').delete().eq('id', id);
            fetchMappers();
        }
    };

    // Item Save & Delete
    const handleSaveItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingItemId !== null) {
            await supabase.from('map_items').update({ name: itemName, type: itemType, description: itemDesc, cooldown: itemCooldown }).eq('id', editingItemId);
        } else {
            await supabase.from('map_items').insert([{ name: itemName, type: itemType, description: itemDesc, cooldown: itemCooldown }]);
        }
        setEditingItemId(null); setItemName(''); setItemDesc(''); setItemCooldown(0);
        fetchItems();
    };

    const handleDeleteItem = async (id: number) => {
        if (window.confirm('Delete item?')) {
            await supabase.from('map_items').delete().eq('id', id);
            fetchItems();
        }
    };

    // Location Save & Upload & Delete
    const handleSaveLocation = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);

        let finalUrl = locationImageUrl;

        if (selectedFile) {
            const fileExt = selectedFile.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('location-images')
                .upload(fileName, selectedFile);

            if (uploadError) {
                alert(`Upload failed: ${uploadError.message}`);
                setUploading(false);
                return;
            }

            const { data } = supabase.storage.from('location-images').getPublicUrl(fileName);
            finalUrl = data.publicUrl;
        }

        if (!finalUrl) {
            alert('Please select an image file or provide an image URL');
            setUploading(false);
            return;
        }

        if (editingLocationId !== null) {
            await supabase.from('map_locations').update({
                name: locationName,
                description: locationDesc,
                image_url: finalUrl
            }).eq('id', editingLocationId);
        } else {
            await supabase.from('map_locations').insert([{
                name: locationName,
                description: locationDesc,
                image_url: finalUrl
            }]);
        }

        setEditingLocationId(null); setLocationName(''); setLocationDesc(''); setLocationImageUrl(''); setSelectedFile(null);
        setUploading(false);
        fetchLocations();
    };

    const handleDeleteLocation = async (id: number) => {
        if (window.confirm('Delete location?')) {
            await supabase.from('map_locations').delete().eq('id', id);
            fetchLocations();
        }
    };

    // Changelog Save & Delete
    const handleSaveChangelog = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingLogId !== null) {
            await supabase.from('map_changelogs').update({
                version: logVersion,
                title: logTitle,
                changes: logChanges,
                status: logStatus
            }).eq('id', editingLogId);
        } else {
            await supabase.from('map_changelogs').insert([{
                version: logVersion,
                title: logTitle,
                changes: logChanges,
                status: logStatus
            }]);
        }
        setEditingLogId(null); setLogVersion(''); setLogTitle(''); setLogChanges(''); setLogStatus('Released');
        fetchChangelogs();
    };

    const handleDeleteChangelog = async (id: number) => {
        if (window.confirm('Delete changelog entry?')) {
            await supabase.from('map_changelogs').delete().eq('id', id);
            fetchChangelogs();
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'In Progress': return 'bg-warning text-dark';
            case 'Internal Testing': return 'bg-info text-dark';
            case 'Planned': return 'bg-secondary text-white';
            default: return 'bg-success text-white';
        }
    };

    if (!session) {
        return (
            <div className="container py-5" style={{ maxWidth: '420px' }}>
                <div className="card bg-black border-0 shadow-lg p-4 rounded-4">
                    <h3 className="text-warning fw-bold text-center mb-3">Admin</h3>
                    <form onSubmit={handleLogin}>
                        <div className="mb-3">
                            <label className="form-label small text-warning fw-bold">Admin Email</label>
                            <input type="email" className="form-control bg-dark text-warning border-0" placeholder="admin@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>
                        <div className="mb-3">
                            <label className="form-label small text-warning fw-bold">Password</label>
                            <input type="password" className="form-control bg-dark text-warning border-0" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </div>
                        <button type="submit" className="btn btn-warning w-100 fw-bold mt-2">Sign In</button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-2" style={{ maxWidth: '1000px' }}>
            <div className="card bg-black border-0 shadow-lg p-4 rounded-4 mb-4">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                    <div className="d-flex gap-2 flex-wrap">
                        <button className={`btn ${tab === 'roster' ? 'btn-warning fw-bold' : 'btn-dark text-white-50'}`} onClick={() => setTab('roster')}>
                            Participants
                        </button>
                        <button className={`btn ${tab === 'items' ? 'btn-warning fw-bold' : 'btn-dark text-white-50'}`} onClick={() => setTab('items')}>
                            Items
                        </button>
                        <button className={`btn ${tab === 'locations' ? 'btn-warning fw-bold' : 'btn-dark text-white-50'}`} onClick={() => setTab('locations')}>
                            Locations
                        </button>
                        <button className={`btn ${tab === 'changelogs' ? 'btn-warning fw-bold' : 'btn-dark text-white-50'}`} onClick={() => setTab('changelogs')}>
                            Changelogs
                        </button>
                    </div>
                    <button className="btn btn-outline-danger btn-sm rounded-pill" onClick={() => supabase.auth.signOut()}>Sign Out</button>
                </div>
            </div>

            {/* TAB 1: PARTICIPANTS */}
            {tab === 'roster' && (
                <div className="row g-4">
                    <div className="col-lg-5">
                        <div className="card bg-black border-0 shadow-lg p-4 rounded-4">
                            <h5 className="text-warning fw-bold mb-3">{editingMapperId ? 'Edit Contributor' : 'Add Contributor'}</h5>
                            <form onSubmit={handleSaveMapper}>
                                <div className="mb-3">
                                    <label className="form-label small text-warning fw-semibold">Player Name</label>
                                    <input type="text" className="form-control bg-dark text-warning border-0" placeholder="e.g. Hobbitten" value={mapperName} onChange={(e) => setMapperName(e.target.value)} required />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label small text-warning fw-semibold">Steam ID</label>
                                    <input type="text" className="form-control bg-dark text-warning border-0" placeholder="[U:1:XXXXXX]" value={steamId} onChange={(e) => setSteamId(e.target.value)} required />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label small text-warning fw-semibold">Assigned Task</label>
                                    <textarea className="form-control bg-dark text-warning border-0" placeholder="e.g. ZE Room geometry and boss stage" value={task} onChange={(e) => setTask(e.target.value)} rows={3} required />
                                </div>
                                <button type="submit" className="btn btn-warning w-100 fw-bold">Save Contributor</button>
                            </form>
                        </div>
                    </div>
                    <div className="col-lg-7">
                        <div className="card bg-black border-0 shadow-lg p-4 rounded-4">
                            <h5 className="text-warning fw-bold mb-3">Contributors List</h5>
                            <div className="table-responsive" style={{ maxHeight: '450px', overflowY: 'auto' }}>
                                <table className="table table-dark table-hover mb-0">
                                    <tbody>
                                        {mappers.map((m) => (
                                            <tr key={m.id}>
                                                <td><strong className="text-white">{m.player_name}</strong><br /><code className="text-warning small">{m.steam_id}</code></td>
                                                <td className="small text-white-50">{m.assigned_task}</td>
                                                <td className="text-end">
                                                    <button className="btn btn-sm btn-outline-warning border-0 me-1" onClick={() => { setEditingMapperId(m.id); setMapperName(m.player_name); setSteamId(m.steam_id); setTask(m.assigned_task); }}>Edit</button>
                                                    <button className="btn btn-sm btn-outline-danger border-0" onClick={() => handleDeleteMapper(m.id)}>Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: ITEMS */}
            {tab === 'items' && (
                <div className="row g-4">
                    <div className="col-lg-5">
                        <div className="card bg-black border-0 shadow-lg p-4 rounded-4">
                            <h5 className="text-warning fw-bold mb-3">{editingItemId ? 'Edit Item' : 'Add Map Item'}</h5>
                            <form onSubmit={handleSaveItem}>
                                <div className="mb-3">
                                    <label className="form-label small text-warning fw-semibold">Item Name</label>
                                    <input type="text" className="form-control bg-dark text-warning border-0" placeholder="Item Name" value={itemName} onChange={(e) => setItemName(e.target.value)} required />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label small text-warning fw-semibold">Item Type</label>
                                    <select className="form-select bg-dark text-warning border-0" value={itemType} onChange={(e) => setItemType(e.target.value as 'Human' | 'Zombie')}>
                                        <option value="Human">Human Item</option>
                                        <option value="Zombie">Zombie Item</option>
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label small text-warning fw-semibold">Description / How it works</label>
                                    <textarea className="form-control bg-dark text-warning border-0" placeholder="Description / How it works" value={itemDesc} onChange={(e) => setItemDesc(e.target.value)} rows={3} required />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label small text-warning fw-semibold">Cooldown in Seconds</label>
                                    <input type="number" className="form-control bg-dark text-warning border-0" placeholder="Cooldown in seconds" value={itemCooldown} onChange={(e) => setItemCooldown(Number(e.target.value))} required />
                                </div>
                                <button type="submit" className="btn btn-warning w-100 fw-bold">Save Map Item</button>
                            </form>
                        </div>
                    </div>
                    <div className="col-lg-7">
                        <div className="card bg-black border-0 shadow-lg p-4 rounded-4">
                            <h5 className="text-warning fw-bold mb-3">Map Items</h5>
                            <div className="table-responsive" style={{ maxHeight: '450px', overflowY: 'auto' }}>
                                <table className="table table-dark table-hover mb-0">
                                    <tbody>
                                        {items.map((item) => (
                                            <tr key={item.id}>
                                                <td>
                                                    <strong className="text-white">{item.name}</strong>
                                                    <span className={`badge ms-2 ${item.type === 'Human' ? 'bg-primary' : 'bg-danger'}`}>{item.type}</span>
                                                    <p className="small text-white-50 mb-0">{item.description}</p>
                                                </td>
                                                <td className="text-end">
                                                    <button className="btn btn-sm btn-outline-warning border-0 me-1" onClick={() => { setEditingItemId(item.id); setItemName(item.name); setItemType(item.type); setItemDesc(item.description); setItemCooldown(item.cooldown); }}>Edit</button>
                                                    <button className="btn btn-sm btn-outline-danger border-0" onClick={() => handleDeleteItem(item.id)}>Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 3: LOCATIONS */}
            {tab === 'locations' && (
                <div className="row g-4">
                    <div className="col-lg-5">
                        <div className="card bg-black border-0 shadow-lg p-4 rounded-4">
                            <h5 className="text-warning fw-bold mb-3">{editingLocationId ? 'Edit Location' : 'Add Location'}</h5>
                            <form onSubmit={handleSaveLocation}>
                                <div className="mb-3">
                                    <label className="form-label small text-warning fw-semibold">Location Name</label>
                                    <input type="text" className="form-control bg-dark text-warning border-0" placeholder="Location Name" value={locationName} onChange={(e) => setLocationName(e.target.value)} required />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label small text-warning fw-semibold">Description / Hold Details</label>
                                    <textarea className="form-control bg-dark text-warning border-0" placeholder="Description / Hold details" value={locationDesc} onChange={(e) => setLocationDesc(e.target.value)} rows={3} required />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label small text-warning fw-semibold">Upload Image File</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="form-control bg-dark text-warning border-0"
                                        onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label small text-warning fw-semibold">OR Image URL</label>
                                    <input
                                        type="url"
                                        className="form-control bg-dark text-warning border-0"
                                        placeholder="https://..."
                                        value={locationImageUrl}
                                        onChange={(e) => setLocationImageUrl(e.target.value)}
                                    />
                                </div>

                                <button type="submit" className="btn btn-warning w-100 fw-bold" disabled={uploading}>
                                    {uploading ? 'Uploading...' : 'Save Location'}
                                </button>
                            </form>
                        </div>
                    </div>
                    <div className="col-lg-7">
                        <div className="card bg-black border-0 shadow-lg p-4 rounded-4">
                            <h5 className="text-warning fw-bold mb-3">Map Locations</h5>
                            <div className="table-responsive" style={{ maxHeight: '450px', overflowY: 'auto' }}>
                                <table className="table table-dark table-hover align-middle mb-0">
                                    <tbody>
                                        {locations.map((loc) => (
                                            <tr key={loc.id}>
                                                <td style={{ width: '80px' }}>
                                                    <img src={loc.image_url} alt={loc.name} className="rounded" style={{ width: '60px', height: '40px', objectFit: 'cover' }} />
                                                </td>
                                                <td>
                                                    <strong className="text-white">{loc.name}</strong>
                                                    <p className="small text-white-50 mb-0">{loc.description}</p>
                                                </td>
                                                <td className="text-end">
                                                    <button className="btn btn-sm btn-outline-warning border-0 me-1" onClick={() => { setEditingLocationId(loc.id); setLocationName(loc.name); setLocationDesc(loc.description); setLocationImageUrl(loc.image_url); }}>Edit</button>
                                                    <button className="btn btn-sm btn-outline-danger border-0" onClick={() => handleDeleteLocation(loc.id)}>Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 4: CHANGELOGS */}
            {tab === 'changelogs' && (
                <div className="row g-4">
                    <div className="col-lg-5">
                        <div className="card bg-black border-0 shadow-lg p-4 rounded-4">
                            <h5 className="text-warning fw-bold mb-3">{editingLogId ? 'Edit Changelog' : 'Add Changelog'}</h5>
                            <form onSubmit={handleSaveChangelog}>
                                <div className="mb-3">
                                    <label className="form-label small text-warning fw-semibold">Version Tag</label>
                                    <input type="text" className="form-control bg-dark text-warning border-0" placeholder="e.g. v1.2.0 or b1" value={logVersion} onChange={(e) => setLogVersion(e.target.value)} required />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label small text-warning fw-semibold">Development Status / Flag</label>
                                    <select
                                        className="form-select bg-dark text-warning border-0"
                                        value={logStatus}
                                        onChange={(e) => setLogStatus(e.target.value as any)}
                                    >
                                        <option value="Released">Released</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Internal Testing">Internal Testing</option>
                                        <option value="Planned">Planned</option>
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label small text-warning fw-semibold">Title</label>
                                    <input type="text" className="form-control bg-dark text-warning border-0" placeholder="e.g. Stage 3 Release & Boss Balance" value={logTitle} onChange={(e) => setLogTitle(e.target.value)} required />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label small text-warning fw-semibold">Patch Notes / Changes</label>
                                    <textarea className="form-control bg-dark text-warning border-0" placeholder="List additions, removals, and bug fixes..." value={logChanges} onChange={(e) => setLogChanges(e.target.value)} rows={5} required />
                                </div>
                                <button type="submit" className="btn btn-warning w-100 fw-bold">Save Changelog</button>
                            </form>
                        </div>
                    </div>
                    <div className="col-lg-7">
                        <div className="card bg-black border-0 shadow-lg p-4 rounded-4">
                            <h5 className="text-warning fw-bold mb-3">Published Changelogs</h5>
                            <div className="table-responsive" style={{ maxHeight: '450px', overflowY: 'auto' }}>
                                <table className="table table-dark table-hover align-middle mb-0">
                                    <tbody>
                                        {changelogs.map((log) => (
                                            <tr key={log.id}>
                                                <td>
                                                    <div className="d-flex align-items-center gap-2 mb-1">
                                                        <span className="badge bg-warning text-dark">{log.version}</span>
                                                        <span className={`badge ${getStatusBadge(log.status)}`}>{log.status || 'Released'}</span>
                                                    </div>
                                                    <strong className="text-white">{log.title}</strong>
                                                    <p className="small text-white-50 mb-0 text-truncate">{log.changes}</p>
                                                </td>
                                                <td className="text-end">
                                                    <button className="btn btn-sm btn-outline-warning border-0 me-1" onClick={() => { setEditingLogId(log.id); setLogVersion(log.version); setLogTitle(log.title); setLogChanges(log.changes); setLogStatus(log.status || 'Released'); }}>Edit</button>
                                                    <button className="btn btn-sm btn-outline-danger border-0" onClick={() => handleDeleteChangelog(log.id)}>Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};