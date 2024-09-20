import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { supabase } from './supabaseClient';
import "./App.css";

// Definir la función que devuelve la cantidad de días de un mes en un año específico
const getDaysInMonth = (month, year) => {
    return new Date(year, month, 0).getDate();
};

function App() {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const currentDay = new Date().getDate();

    const [currentIndex, setCurrentIndex] = useState(0);
    const [viewedMonthIndex, setViewedMonthIndex] = useState(currentMonth - 1);
    const [services, setServices] = useState({});
    const [showForm, setShowForm] = useState(null);
    const [editingService, setEditingService] = useState(null); // Estado para manejar la edición
    const [expandedService, setExpandedService] = useState(null);
    const [formData, setFormData] = useState({
        cliente: '',
        servicio: '',
        unidades: [
            { movil: '', choferes: ['', '', ''] }
        ],
        origen: '',
        destino: '',
        horario: '',
        observaciones: ''
    });

    const sliderRef = useRef(null);

    const getDayOfWeek = useCallback((day, month, year) => {
        const date = new Date(year, month - 1, day);
        const options = { weekday: 'long' };
        return new Intl.DateTimeFormat('es-ES', options).format(date);
    }, []);

    const getMonthName = useCallback((month) => {
        const date = new Date(0, month - 1);
        const options = { month: 'long' };
        return new Intl.DateTimeFormat('es-ES', options).format(date);
    }, []);

    // Generar días del año con useMemo
    const daysInYear = useMemo(() => {
        let days = [];
        for (let month = 1; month <= 12; month++) {
            const daysInMonth = getDaysInMonth(month, currentYear);
            for (let day = 1; day <= daysInMonth; day++) {
                days.push({ day, dayOfWeek: getDayOfWeek(day, month, currentYear), month, year: currentYear });
            }
        }
        return days;
    }, [currentYear, getDayOfWeek]);

    const settings = useMemo(() => ({
        dots: false,
        infinite: false,
        speed: 500,
        slidesToShow: window.innerWidth <= 768 ? 2 : window.innerWidth <= 1024 ? 4 : 6, // 2 días en móviles, 4 en tablets, 6 en pantallas grandes
        slidesToScroll: 1,
        initialSlide: currentIndex,
        afterChange: (current) => {
            setCurrentIndex(current);
            const viewedMonth = daysInYear[current].month;
            setViewedMonthIndex(viewedMonth - 1);
        },
    }), [currentIndex, daysInYear]);

    useEffect(() => {
        const fetchServices = async () => {
            const { data: services, error } = await supabase
                .from('services')
                .select('*');
            if (error) {
                console.error('Error al obtener los servicios:', error);
            } else {
                const formattedServices = services.reduce((acc, service) => {
                    const dateKey = `${service.year}-${service.month}-${service.day}`;
                    if (!acc[dateKey]) {
                        acc[dateKey] = [];
                    }
                    acc[dateKey].push(service);
                    return acc;
                }, {});
                setServices(formattedServices);
            }
        };

        fetchServices();

        const subscription = supabase
            .channel('public:services')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, (payload) => {
                console.log('Cambio en tiempo real:', payload);
                fetchServices();
            })
            .subscribe();

        const todayIndex = daysInYear.findIndex(
            (day) => day.day === currentDay && day.month === currentMonth
        );
        setCurrentIndex(todayIndex);

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [currentDay, currentMonth, daysInYear]);

    const saveServiceToDatabase = async (serviceData) => {
        const { error } = await supabase
            .from('services')
            .insert([serviceData]);

        if (error) {
            console.error('Error al guardar el servicio:', error);
        } else {
            const dateKey = `${serviceData.year}-${serviceData.month}-${serviceData.day}`;
            setServices((prevServices) => ({
                ...prevServices,
                [dateKey]: [...(prevServices[dateKey] || []), serviceData]
            }));
        }
    };

    const updateServiceInDatabase = async (serviceData) => {
        const { error } = await supabase
            .from('services')
            .update(serviceData)
            .eq('id', serviceData.id);

        if (error) {
            console.error('Error al actualizar el servicio:', error);
        } else {
            const dateKey = `${serviceData.year}-${serviceData.month}-${serviceData.day}`;
            setServices((prevServices) => {
                const updatedServices = { ...prevServices };
                updatedServices[dateKey] = updatedServices[dateKey].map((s) =>
                    s.id === serviceData.id ? serviceData : s
                );
                return updatedServices;
            });
        }
    };

    const addUnidad = () => {
        setFormData((prevData) => ({
            ...prevData,
            unidades: [
                ...prevData.unidades,
                { movil: '', choferes: ['', '', ''] }
            ]
        }));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleArrayInputChange = (e, index, field, type) => {
        const updatedData = formData[type].map((item, i) =>
            i === index ? { ...item, [field]: e.target.value } : item
        );
        setFormData((prevData) => ({
            ...prevData,
            [type]: updatedData,
        }));
    };

    const handleChoferInputChange = (e, unidadIndex, choferIndex) => {
        const updatedChoferes = [...formData.unidades[unidadIndex].choferes];
        updatedChoferes[choferIndex] = e.target.value;
        const updatedUnidades = [...formData.unidades];
        updatedUnidades[unidadIndex].choferes = updatedChoferes;
        setFormData((prevData) => ({
            ...prevData,
            unidades: updatedUnidades
        }));
    };

    const saveService = (dateKey) => {
        const [year, month, day] = dateKey.split('-');
        const serviceData = {
            ...formData,
            year: parseInt(year),
            month: parseInt(month),
            day: parseInt(day),
            completed: false
        };
        saveServiceToDatabase(serviceData);
        setShowForm(null);
        setFormData({
            cliente: '',
            servicio: '',
            unidades: [{ movil: '', choferes: ['', '', ''] }],
            origen: '',
            destino: '',
            horario: '',
            observaciones: ''
        });
    };

    const updateService = () => {
        const serviceData = {
            ...formData,
            id: editingService.id, // ID del servicio que estamos editando
        };
        updateServiceInDatabase(serviceData);
        setShowForm(null);
        setEditingService(null);
    };

    const editService = (service) => {
        setFormData(service); // Cargar datos existentes en el formulario
        setEditingService(service); // Guardar el servicio que se está editando
        setShowForm(true);
    };

    const markAsCompleted = async (dateKey, index) => {
        const service = services[dateKey][index];
        const { error } = await supabase
            .from('services')
            .update({ completed: true })
            .eq('id', service.id);

        if (error) {
            console.error('Error al marcar como completado:', error);
        } else {
            const updatedServices = { ...services };
            updatedServices[dateKey][index].completed = true;
            setServices(updatedServices);
        }
    };

    const next = () => {
        if (sliderRef.current) {
            sliderRef.current.slickNext();
        }
    };

    const previous = () => {
        if (sliderRef.current) {
            sliderRef.current.slickPrev();
        }
    };

    const jumpToMonth = (event) => {
        const selectedMonth = parseInt(event.target.value, 10) + 1;
        const firstDayOfMonth = daysInYear.findIndex((day) => day.month === selectedMonth);
        if (sliderRef.current && firstDayOfMonth !== -1) {
            sliderRef.current.slickGoTo(firstDayOfMonth);
        }
    };

    const displayedMonthName = getMonthName(viewedMonthIndex + 1);

    const addService = (dateKey) => {
        setShowForm(dateKey);
    };

    return (
        <div className="app-container">
            <header className="header">
                <h1>Planificación de Servicios</h1>
            </header>

            {!showForm && (
                <>
                    <h2 className="month-viewing">Visualizando: {displayedMonthName}</h2>

                    <div className="month-selector">
                        <label htmlFor="monthSelector">Ir al mes: </label>
                        <select id="monthSelector" onChange={jumpToMonth}>
                            {[...Array(12)].map((_, i) => (
                                <option key={i + 1} value={i}>
                                    {getMonthName(i + 1)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="slider-controls">
                        <button className="button" onClick={previous} disabled={currentIndex === 0}>
                            Anterior
                        </button>
                        <button
                            className="button"
                            onClick={next}
                            disabled={currentIndex >= daysInYear.length - 7}
                        >
                            Siguiente
                        </button>
                    </div>
                </>
            )}

            <div className="slider-container">
                {!showForm && (
                    <Slider ref={sliderRef} {...settings}>
                        {daysInYear.map(({ day, dayOfWeek, month, year }) => {
                            const dateKey = `${year}-${month}-${day}`;
                            return (
                                <div key={dateKey} className="day-card">
                                    <div className="day-card-content">
                                        <h3>{`${dayOfWeek} ${day}`}</h3>

                                        <button className="add-service-btn" onClick={() => addService(dateKey)}>
                                            + Servicio
                                        </button>

                                        <div className="service-list">
                                            {services[dateKey] && services[dateKey].length > 0 && (
                                                <div className="service-list-items">
                                                    {services[dateKey].map((service, index) => (
                                                        <div key={index} className="service-card">
                                                            <p><strong>Cliente:</strong> {service.cliente}</p>
                                                            <p><strong>Servicio:</strong> {service.servicio}</p>
                                                            {service.unidades?.map((unidad, idx) => (
                                                                <div key={idx}>
                                                                    <p><strong>Móvil:</strong> {unidad.movil}</p>
                                                                    {unidad.choferes
                                                                        .filter((chofer) => chofer) // Filtrar los choferes vacíos
                                                                        .map((chofer, choferIdx) => (
                                                                            <p key={choferIdx}><strong>Chofer {choferIdx + 1}:</strong> {chofer}</p>
                                                                        ))}
                                                                </div>
                                                            ))}

                                                            <button
                                                                className="button"
                                                                onClick={() => setExpandedService(service)}
                                                            >
                                                                Ver detalles
                                                            </button>

                                                            <button
                                                                className="button"
                                                                onClick={() => editService(service)} // Botón para editar
                                                            >
                                                                Editar
                                                            </button>

                                                            <button
                                                                className="button completed-btn"
                                                                onClick={() => markAsCompleted(dateKey, index)}
                                                            >
                                                                {service.completed ? "Finalizado" : "Marcar como Finalizado"}
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </Slider>
                )}

                {showForm && (
                    <div className="form-container">
                        <h4>{editingService ? "Editar servicio" : "Añadir servicio"}</h4>
                        <label>Cliente:</label>
                        <input
                            type="text"
                            name="cliente"
                            value={formData.cliente}
                            onChange={handleInputChange}
                        />
                        <label>Servicio:</label>
                        <input
                            type="text"
                            name="servicio"
                            value={formData.servicio}
                            onChange={handleInputChange}
                        />

                        {formData.unidades.map((unidad, index) => (
                            <div key={index} className="unidad-box">
                                <label>Movil:</label>
                                <input
                                    type="text"
                                    value={unidad.movil}
                                    onChange={(e) => handleArrayInputChange(e, index, 'movil', 'unidades')}
                                />
                                {unidad.choferes.map((chofer, choferIndex) => (
                                    <div key={choferIndex}>
                                        <label>{`Chofer ${choferIndex + 1}:`}</label>
                                        <input
                                            type="text"
                                            value={chofer}
                                            onChange={(e) => handleChoferInputChange(e, index, choferIndex)}
                                        />
                                    </div>
                                ))}
                            </div>
                        ))}

                        <button onClick={addUnidad} className="button add-more-btn">+ Añadir otra unidad</button>

                        <label>Origen:</label>
                        <input
                            type="text"
                            name="origen"
                            value={formData.origen}
                            onChange={handleInputChange}
                        />
                        <label>Destino:</label>
                        <input
                            type="text"
                            name="destino"
                            value={formData.destino}
                            onChange={handleInputChange}
                        />
                        <label>Horario:</label>
                        <input
                            type="time"
                            name="horario"
                            value={formData.horario}
                            onChange={handleInputChange}
                        />
                        <label>Observaciones:</label>
                        <input
                            type="text"
                            name="observaciones"
                            value={formData.observaciones}
                            onChange={handleInputChange}
                        />

                        {editingService ? (
                            <button onClick={updateService} className="button save-btn">Actualizar Servicio</button>
                        ) : (
                            <button onClick={() => saveService(showForm)} className="button save-btn">Guardar Servicio</button>
                        )}
                        <button onClick={() => setShowForm(null)} className="button cancel-btn">Cerrar</button>
                    </div>
                )}

                {expandedService && (
                    <div className="modal-backdrop" onClick={() => setExpandedService(null)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <h2>Detalles del Servicio</h2>
                            <p><strong>Cliente:</strong> {expandedService.cliente}</p>
                            <p><strong>Servicio:</strong> {expandedService.servicio}</p>
                            {expandedService.unidades?.map((unidad, index) => (
                                <div key={index}>
                                    <p><strong>Móvil:</strong> {unidad.movil}</p>
                                    {unidad.choferes.map((chofer, choferIndex) => (
                                        <p key={choferIndex}><strong>Chofer {choferIndex + 1}:</strong> {chofer}</p>
                                    ))}
                                </div>
                            ))}
                            <p><strong>Origen:</strong> {expandedService.origen}</p>
                            <p><strong>Destino:</strong> {expandedService.destino}</p>
                            <p><strong>Horario:</strong> {expandedService.horario}</p>
                            <p><strong>Observaciones:</strong> {expandedService.observaciones}</p>
                            <button className="button close-btn" onClick={() => setExpandedService(null)}>
                                Cerrar
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;
