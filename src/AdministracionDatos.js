// AdministracionDatos.js
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import './App.css';

const AdministracionDatos = () => {
    const [servicios, setServicios] = useState([]);
    const [estadisticas, setEstadisticas] = useState({
        totalServicios: 0,
        serviciosPorMes: {},
        espacioEstimado: '0 KB'
    });
    const [filtroFecha, setFiltroFecha] = useState('');
    const [serviciosSeleccionados, setServiciosSeleccionados] = useState(new Set());
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        cargarServicios();
        cargarEstadisticas();
    }, []);

    const cargarServicios = async () => {
        const { data, error } = await supabase
            .from('services')
            .select('*')
            .order('year', { ascending: false })
            .order('month', { ascending: false })
            .order('day', { ascending: false });

        if (error) {
            console.error('Error al cargar servicios:', error);
        } else {
            setServicios(data || []);
        }
    };

    const cargarEstadisticas = async () => {
        const { data, error } = await supabase
            .from('services')
            .select('*');

        if (error) {
            console.error('Error al cargar estadísticas:', error);
            return;
        }

        // Calcular estadísticas
        const total = data.length;
        const porMes = {};

        data.forEach(servicio => {
            const mesKey = `${servicio.year}-${String(servicio.month).padStart(2, '0')}`;
            porMes[mesKey] = (porMes[mesKey] || 0) + 1;
        });

        // Estimar espacio (aproximado: 1KB por servicio)
        const espacioKB = total * 1;
        let espacioTexto = '';
        if (espacioKB < 1024) {
            espacioTexto = `${espacioKB} KB`;
        } else {
            espacioTexto = `${(espacioKB / 1024).toFixed(2)} MB`;
        }

        setEstadisticas({
            totalServicios: total,
            serviciosPorMes: porMes,
            espacioEstimado: espacioTexto
        });
    };

    const serviciosFiltrados = filtroFecha
        ? servicios.filter(s => {
            const [year, month] = filtroFecha.split('-');
            return s.year === parseInt(year) && s.month === parseInt(month);
        })
        : servicios;

    const toggleSeleccion = (id) => {
        const nuevaSeleccion = new Set(serviciosSeleccionados);
        if (nuevaSeleccion.has(id)) {
            nuevaSeleccion.delete(id);
        } else {
            nuevaSeleccion.add(id);
        }
        setServiciosSeleccionados(nuevaSeleccion);
    };

    const seleccionarTodos = () => {
        if (serviciosSeleccionados.size === serviciosFiltrados.length) {
            setServiciosSeleccionados(new Set());
        } else {
            setServiciosSeleccionados(new Set(serviciosFiltrados.map(s => s.id)));
        }
    };

    const eliminarSeleccionados = async () => {
        if (serviciosSeleccionados.size === 0) {
            alert('No hay servicios seleccionados');
            return;
        }

        const confirmacion = window.confirm(
            `¿Está seguro de eliminar ${serviciosSeleccionados.size} servicio(s)? Esta acción no se puede deshacer.`
        );

        if (!confirmacion) return;

        setLoading(true);

        const ids = Array.from(serviciosSeleccionados);
        const { error } = await supabase
            .from('services')
            .delete()
            .in('id', ids);

        if (error) {
            alert('Error al eliminar servicios: ' + error.message);
        } else {
            alert(`${ids.length} servicio(s) eliminado(s) exitosamente`);
            setServiciosSeleccionados(new Set());
            await cargarServicios();
            await cargarEstadisticas();
        }

        setLoading(false);
    };

    const eliminarPorFecha = async () => {
        if (!filtroFecha) {
            alert('Seleccione un mes para filtrar');
            return;
        }

        const [year, month] = filtroFecha.split('-');
        const serviciosDelMes = servicios.filter(
            s => s.year === parseInt(year) && s.month === parseInt(month)
        );

        if (serviciosDelMes.length === 0) {
            alert('No hay servicios en este mes');
            return;
        }

        const confirmacion = window.confirm(
            `¿Está seguro de eliminar TODOS los ${serviciosDelMes.length} servicio(s) del mes ${month}/${year}? Esta acción no se puede deshacer.`
        );

        if (!confirmacion) return;

        setLoading(true);

        const ids = serviciosDelMes.map(s => s.id);
        const { error } = await supabase
            .from('services')
            .delete()
            .in('id', ids);

        if (error) {
            alert('Error al eliminar servicios: ' + error.message);
        } else {
            alert(`${ids.length} servicio(s) eliminado(s) exitosamente`);
            setServiciosSeleccionados(new Set());
            setFiltroFecha('');
            await cargarServicios();
            await cargarEstadisticas();
        }

        setLoading(false);
    };

    return (
        <div className="admin-datos-container">
            <h1>Administración de Datos</h1>

            {/* ESTADÍSTICAS */}
            <div className="estadisticas-section">
                <div className="stat-card">
                    <h3>Total de Servicios</h3>
                    <p className="stat-number">{estadisticas.totalServicios}</p>
                </div>
                <div className="stat-card">
                    <h3>Espacio Estimado</h3>
                    <p className="stat-number">{estadisticas.espacioEstimado}</p>
                </div>
                <div className="stat-card">
                    <h3>Seleccionados</h3>
                    <p className="stat-number">{serviciosSeleccionados.size}</p>
                </div>
            </div>

            {/* SERVICIOS POR MES */}
            <div className="meses-section">
                <h2>Servicios por Mes</h2>
                <div className="meses-grid">
                    {Object.entries(estadisticas.serviciosPorMes)
                        .sort((a, b) => b[0].localeCompare(a[0]))
                        .map(([mes, cantidad]) => (
                            <div key={mes} className="mes-card">
                                <span className="mes-nombre">{mes}</span>
                                <span className="mes-cantidad">{cantidad} servicios</span>
                            </div>
                        ))}
                </div>
            </div>

            {/* FILTROS Y ACCIONES */}
            <div className="acciones-section">
                <div className="filtros">
                    <label>
                        Filtrar por mes:
                        <input
                            type="month"
                            value={filtroFecha}
                            onChange={(e) => setFiltroFecha(e.target.value)}
                        />
                    </label>
                    {filtroFecha && (
                        <button 
                            className="button clear-filter-btn"
                            onClick={() => setFiltroFecha('')}
                        >
                            Limpiar Filtro
                        </button>
                    )}
                </div>

                <div className="acciones-botones">
                    <button
                        className="button select-all-btn"
                        onClick={seleccionarTodos}
                    >
                        {serviciosSeleccionados.size === serviciosFiltrados.length && serviciosFiltrados.length > 0
                            ? 'Deseleccionar Todos'
                            : 'Seleccionar Todos'}
                    </button>

                    {filtroFecha && (
                        <button
                            className="button delete-month-btn"
                            onClick={eliminarPorFecha}
                            disabled={loading}
                        >
                            {loading ? 'Eliminando...' : 'Eliminar Mes Completo'}
                        </button>
                    )}

                    <button
                        className="button delete-selected-btn"
                        onClick={eliminarSeleccionados}
                        disabled={serviciosSeleccionados.size === 0 || loading}
                    >
                        {loading ? 'Eliminando...' : `Eliminar Seleccionados (${serviciosSeleccionados.size})`}
                    </button>
                </div>
            </div>

            {/* LISTA DE SERVICIOS */}
            <div className="servicios-list-section">
                <h2>Lista de Servicios ({serviciosFiltrados.length})</h2>
                <div className="servicios-table">
                    <div className="table-header">
                        <div className="th-check"></div>
                        <div className="th-fecha">Fecha</div>
                        <div className="th-cliente">Cliente</div>
                        <div className="th-servicio">Servicio</div>
                        <div className="th-movil">Móvil</div>
                        <div className="th-ruta">Ruta</div>
                    </div>
                    <div className="table-body">
                        {serviciosFiltrados.map((servicio) => (
                            <div 
                                key={servicio.id} 
                                className={`table-row ${serviciosSeleccionados.has(servicio.id) ? 'selected' : ''}`}
                            >
                                <div className="td-check">
                                    <input
                                        type="checkbox"
                                        checked={serviciosSeleccionados.has(servicio.id)}
                                        onChange={() => toggleSeleccion(servicio.id)}
                                    />
                                </div>
                                <div className="td-fecha">
                                    {`${servicio.day}/${servicio.month}/${servicio.year}`}
                                </div>
                                <div className="td-cliente">{servicio.cliente}</div>
                                <div className="td-servicio">{servicio.servicio}</div>
                                <div className="td-movil">
                                    {servicio.unidades?.map((u, idx) => u.movil).join(', ')}
                                </div>
                                <div className="td-ruta">
                                    {servicio.origen} → {servicio.destino}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdministracionDatos;
