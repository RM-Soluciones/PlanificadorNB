// GestionRecursos.js
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import './App.css';

const GestionRecursos = () => {
    const [choferes, setChoferes] = useState([]);
    const [moviles, setMoviles] = useState([]);
    const [showAddChofer, setShowAddChofer] = useState(false);
    const [showAddMovil, setShowAddMovil] = useState(false);
    const [newChofer, setNewChofer] = useState('');
    const [newMovil, setNewMovil] = useState('');
    const [editingChofer, setEditingChofer] = useState(null);
    const [editingMovil, setEditingMovil] = useState(null);

    // Cargar recursos desde Supabase
    useEffect(() => {
        fetchRecursos();
    }, []);

    const fetchRecursos = async () => {
        // Cargar choferes
        const { data: choferesData, error: choferesError } = await supabase
            .from('choferes')
            .select('*')
            .order('nombre', { ascending: true });

        if (choferesError) {
            console.error('Error al cargar choferes:', choferesError);
        } else {
            setChoferes(choferesData || []);
        }

        // Cargar móviles
        const { data: movilesData, error: movilesError } = await supabase
            .from('moviles')
            .select('*')
            .order('nombre', { ascending: true });

        if (movilesError) {
            console.error('Error al cargar móviles:', movilesError);
        } else {
            setMoviles(movilesData || []);
        }
    };

    // Funciones para Choferes
    const handleAddChofer = async (e) => {
        e.preventDefault();
        if (!newChofer.trim()) return;

        const { data, error } = await supabase
            .from('choferes')
            .insert([{ nombre: newChofer.trim() }])
            .select();

        if (error) {
            alert('Error al agregar chofer: ' + error.message);
        } else {
            setChoferes([...choferes, data[0]]);
            setNewChofer('');
            setShowAddChofer(false);
        }
    };

    const handleUpdateChofer = async (id, nuevoNombre) => {
        if (!nuevoNombre.trim()) return;

        const { error } = await supabase
            .from('choferes')
            .update({ nombre: nuevoNombre.trim() })
            .eq('id', id);

        if (error) {
            alert('Error al actualizar chofer: ' + error.message);
        } else {
            setChoferes(choferes.map(c => c.id === id ? { ...c, nombre: nuevoNombre.trim() } : c));
            setEditingChofer(null);
        }
    };

    const handleDeleteChofer = async (id) => {
        if (!window.confirm('¿Está seguro de eliminar este chofer?')) return;

        const { error } = await supabase
            .from('choferes')
            .delete()
            .eq('id', id);

        if (error) {
            alert('Error al eliminar chofer: ' + error.message);
        } else {
            setChoferes(choferes.filter(c => c.id !== id));
        }
    };

    // Funciones para Móviles
    const handleAddMovil = async (e) => {
        e.preventDefault();
        if (!newMovil.trim()) return;

        const { data, error } = await supabase
            .from('moviles')
            .insert([{ nombre: newMovil.trim() }])
            .select();

        if (error) {
            alert('Error al agregar móvil: ' + error.message);
        } else {
            setMoviles([...moviles, data[0]]);
            setNewMovil('');
            setShowAddMovil(false);
        }
    };

    const handleUpdateMovil = async (id, nuevoNombre) => {
        if (!nuevoNombre.trim()) return;

        const { error } = await supabase
            .from('moviles')
            .update({ nombre: nuevoNombre.trim() })
            .eq('id', id);

        if (error) {
            alert('Error al actualizar móvil: ' + error.message);
        } else {
            setMoviles(moviles.map(m => m.id === id ? { ...m, nombre: nuevoNombre.trim() } : m));
            setEditingMovil(null);
        }
    };

    const handleDeleteMovil = async (id) => {
        if (!window.confirm('¿Está seguro de eliminar este móvil?')) return;

        const { error } = await supabase
            .from('moviles')
            .delete()
            .eq('id', id);

        if (error) {
            alert('Error al eliminar móvil: ' + error.message);
        } else {
            setMoviles(moviles.filter(m => m.id !== id));
        }
    };

    return (
        <div className="gestion-recursos-container">
            <h1>Gestión de Recursos</h1>
            
            <div className="recursos-section">
                {/* SECCIÓN DE CHOFERES */}
                <div className="recursos-column">
                    <div className="recursos-header">
                        <h2>Choferes ({choferes.length})</h2>
                        <button 
                            className="button add-resource-btn"
                            onClick={() => setShowAddChofer(true)}
                        >
                            + Agregar Chofer
                        </button>
                    </div>

                    {showAddChofer && (
                        <form onSubmit={handleAddChofer} className="add-resource-form">
                            <input
                                type="text"
                                value={newChofer}
                                onChange={(e) => setNewChofer(e.target.value)}
                                placeholder="Nombre del chofer"
                                autoFocus
                            />
                            <div className="form-buttons">
                                <button type="submit" className="button save-btn">Guardar</button>
                                <button 
                                    type="button" 
                                    className="button cancel-btn"
                                    onClick={() => {
                                        setShowAddChofer(false);
                                        setNewChofer('');
                                    }}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    )}

                    <div className="recursos-list">
                        {choferes.map((chofer) => (
                            <div key={chofer.id} className="recurso-item">
                                {editingChofer === chofer.id ? (
                                    <form 
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            handleUpdateChofer(chofer.id, e.target.elements.nombre.value);
                                        }}
                                        className="edit-resource-form"
                                    >
                                        <input
                                            name="nombre"
                                            type="text"
                                            defaultValue={chofer.nombre}
                                            autoFocus
                                        />
                                        <div className="form-buttons">
                                            <button type="submit" className="button-small save-btn">✓</button>
                                            <button 
                                                type="button"
                                                className="button-small cancel-btn"
                                                onClick={() => setEditingChofer(null)}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <>
                                        <span className="recurso-nombre">{chofer.nombre}</span>
                                        <div className="recurso-actions">
                                            <button
                                                className="button-small edit-btn"
                                                onClick={() => setEditingChofer(chofer.id)}
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className="button-small delete-btn"
                                                onClick={() => handleDeleteChofer(chofer.id)}
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* SECCIÓN DE MÓVILES */}
                <div className="recursos-column">
                    <div className="recursos-header">
                        <h2>Móviles ({moviles.length})</h2>
                        <button 
                            className="button add-resource-btn"
                            onClick={() => setShowAddMovil(true)}
                        >
                            + Agregar Móvil
                        </button>
                    </div>

                    {showAddMovil && (
                        <form onSubmit={handleAddMovil} className="add-resource-form">
                            <input
                                type="text"
                                value={newMovil}
                                onChange={(e) => setNewMovil(e.target.value)}
                                placeholder="Nombre del móvil"
                                autoFocus
                            />
                            <div className="form-buttons">
                                <button type="submit" className="button save-btn">Guardar</button>
                                <button 
                                    type="button" 
                                    className="button cancel-btn"
                                    onClick={() => {
                                        setShowAddMovil(false);
                                        setNewMovil('');
                                    }}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    )}

                    <div className="recursos-list">
                        {moviles.map((movil) => (
                            <div key={movil.id} className="recurso-item">
                                {editingMovil === movil.id ? (
                                    <form 
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            handleUpdateMovil(movil.id, e.target.elements.nombre.value);
                                        }}
                                        className="edit-resource-form"
                                    >
                                        <input
                                            name="nombre"
                                            type="text"
                                            defaultValue={movil.nombre}
                                            autoFocus
                                        />
                                        <div className="form-buttons">
                                            <button type="submit" className="button-small save-btn">✓</button>
                                            <button 
                                                type="button"
                                                className="button-small cancel-btn"
                                                onClick={() => setEditingMovil(null)}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <>
                                        <span className="recurso-nombre">{movil.nombre}</span>
                                        <div className="recurso-actions">
                                            <button
                                                className="button-small edit-btn"
                                                onClick={() => setEditingMovil(movil.id)}
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className="button-small delete-btn"
                                                onClick={() => handleDeleteMovil(movil.id)}
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GestionRecursos;
