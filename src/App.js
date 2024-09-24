// App.js

import React, { useState, useRef, useEffect, useMemo } from "react";
import { supabase } from './supabaseClient';
import "./App.css";
import Select from 'react-select';

// Listas de choferes y móviles
const choferesList = [
    "CARLOS SARAPURA",
    "MAXIMILIANO MENDOZA",
    "MORALES COPA",
    "ROJAS JORGE",
    "VELEZ JORGE",
    "MAMANI FEDERICO",
    "CRUZ DARDO",
    "CALA ISMAEL GABRIEL",
    "GUZMAN EMANUEL",
    "CORONEL CARLOS",
    "SOLIS OMAR",
    "RIOS LEONARDO",
    "SANCHEZ ADRIAN",
    "FLORES DIEGO",
    "FRANCISCO MAMANI",
    "HOYOS SERRUDO ARMANDO",
    "PEGINI YAGO",
    "DE ZUANI HERNAN",
    "AVENDAÑO NAHUEL",
    "ARJONA CRISTIAN",
    "RAVAZA CARLOS",
    "MARTINEZ SIMÓN",
    "ARRATIA ROJAS FRANCISCO",
    "DIAZ MARCOS GABRIEL",
    "SALVATIERRA DARIO RAUL",
    "SALAS LUIS",
    "APARICIO LEONEL",
    "GALLARDO LUIS"
];

const movilesList = [
    "M33",
    "M09",
    "M14",
    "M16",
    "M18",
    "M19",
    "M20",
    "M21",
    "M22",
    "M24",
    "M25",
    "M26",
    "M28",
    "M30",
    "M34",
    "M35",
    "M36",
    "M37",
    "M38"
];

// Crear opciones para react-select
const choferesOptions = choferesList.map((chofer) => ({ value: chofer, label: chofer }));
const movilesOptions = movilesList.map((movil) => ({ value: movil, label: movil }));

// Opciones de servicio con colores
const servicioOptions = [
    { value: 'IN OUT', label: 'IN OUT', color: '#7FC6E7' },     // CELESTE
    { value: 'SUBIDA', label: 'SUBIDA', color: '#27AE60' },     // VERDE
    { value: 'BAJADA', label: 'BAJADA', color: '#EB5757' },     // ROJO
    { value: 'STAND BY', label: 'STAND BY', color: '#F2C94C' }  // AMARILLO
];

// Funciones auxiliares
const getDaysInMonth = (month, year) => {
    return new Date(year, month, 0).getDate();
};

const getDayOfWeek = (day, month, year) => {
    const date = new Date(year, month - 1, day);
    const options = { weekday: 'long' };
    return new Intl.DateTimeFormat('es-ES', options).format(date);
};

const getMonthName = (month) => {
    const date = new Date(0, month - 1);
    const options = { month: 'long' };
    return new Intl.DateTimeFormat('es-ES', options).format(date);
};

// Datos iniciales para el formulario
const initialFormData = {
    cliente: '',
    servicio: null,
    unidades: [{ movil: '', choferes: ['', '', ''] }],
    origen: '',
    destino: '',
    horario: '',
    observaciones: ''
};

// Componentes separados
const DayCard = ({ dayData, dateKey, servicesForDay, addService, setExpandedService }) => {
    const { day, dayOfWeek } = dayData;
    return (
        <div className="day-card">
            <div className="day-card-content">
                <h3>{`${dayOfWeek} ${day}`}</h3>

                <button className="add-service-btn" onClick={() => addService(dateKey)}>
                    + Servicio
                </button>

                <div className="service-list">
                    {servicesForDay && servicesForDay.length > 0 && (
                        <div className="service-list-items">
                            {servicesForDay.map((service, index) => (
                                <ServiceCard
                                    key={service.id}
                                    service={service}
                                    index={index}
                                    dateKey={dateKey}
                                    setExpandedService={setExpandedService}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ServiceCard = ({ service, setExpandedService }) => {
    // Obtener el color asociado al tipo de servicio
    const serviceOption = servicioOptions.find(option => option.value === service.servicio);
    const serviceColor = serviceOption ? serviceOption.color : '#FFFFFF';

    // Manejar el clic en la tarjeta
    const handleCardClick = () => {
        setExpandedService(service);
    };

    return (
        <div
            className="service-card clickable"
            style={{ backgroundColor: serviceColor }}
            onClick={handleCardClick}
        >
            <p>
                <strong>{service.cliente}</strong> - {serviceOption?.label}
            </p>
            {service.unidades?.map((unidad, idx) => (
                <div key={idx}>
                    <p>
                        <strong>Móvil:</strong> <strong>{unidad.movil}</strong> - {unidad.choferes.filter(Boolean).join(', ')}
                    </p>
                </div>
            ))}
            <p>
                <strong>Origen y Destino:</strong> {service.origen} - {service.destino}
            </p>
        </div>
    );
};

const ServiceForm = ({
                         editingService,
                         formData,
                         setFormData,
                         addUnidad,
                         handleInputChange,
                         handleArrayInputChange,
                         handleChoferInputChange,
                         saveService,
                         updateService,
                         setShowForm,
                         setEditingService,
                         services,
                         showForm
                     }) => {
    // Obtener la fecha actual del formulario
    const [year, month, day] = showForm.split('-');

    // Función para obtener el estado de disponibilidad
    const getAvailability = (type, name) => {
        let isOccupied = false;
        const dateKey = `${year}-${month}-${day}`;
        const servicesForDay = services[dateKey] || [];
        servicesForDay.forEach((service) => {
            service.unidades.forEach((unidad) => {
                if (type === 'chofer') {
                    unidad.choferes.forEach((chofer) => {
                        if (chofer === name && (editingService ? service.id !== editingService.id : true)) {
                            isOccupied = true;
                        }
                    });
                } else if (type === 'movil') {
                    if (unidad.movil === name && (editingService ? service.id !== editingService.id : true)) {
                        isOccupied = true;
                    }
                }
            });
        });
        return isOccupied;
    };

    // Estilos para react-select
    const customStyles = {
        option: (provided, { data }) => ({
            ...provided,
            color: data.isOccupied ? 'red' : 'green',
        }),
        singleValue: (provided, { data }) => ({
            ...provided,
            color: data.isOccupied ? 'red' : 'green',
        }),
    };

    return (
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
            <Select
                options={servicioOptions}
                onChange={(selectedOption) => setFormData({ ...formData, servicio: selectedOption.value })}
                value={servicioOptions.find(option => option.value === formData.servicio)}
                placeholder="Seleccione un servicio..."
            />

            {formData.unidades.map((unidad, index) => (
                <div key={index} className="unidad-box">
                    <label>Movil:</label>
                    <Select
                        options={movilesOptions.map((movil) => ({
                            value: movil.value,
                            label: movil.label,
                            isOccupied: getAvailability('movil', movil.value),
                        }))}
                        styles={customStyles}
                        onChange={(selectedOption) => handleArrayInputChange({ target: { value: selectedOption.value } }, index, 'movil', 'unidades')}
                        value={movilesOptions.find((movil) => movil.value === unidad.movil)}
                        placeholder="Seleccione un móvil..."
                    />
                    {unidad.choferes.map((choferValue, choferIndex) => (
                        <div key={choferIndex}>
                            <label>{`Chofer ${choferIndex + 1}:`}</label>
                            <Select
                                options={choferesOptions.map((choferOption) => ({
                                    value: choferOption.value,
                                    label: choferOption.label,
                                    isOccupied: getAvailability('chofer', choferOption.value),
                                }))}
                                styles={customStyles}
                                onChange={(selectedOption) => handleChoferInputChange({ target: { value: selectedOption.value } }, index, choferIndex)}
                                value={choferesOptions.find((c) => c.value === choferValue)}
                                placeholder="Seleccione un chofer..."
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
                <button onClick={saveService} className="button save-btn">Guardar Servicio</button>
            )}
            <button onClick={() => {
                setShowForm(null);
                setEditingService(null);
                setFormData(initialFormData);
            }} className="button cancel-btn">Cerrar</button>
        </div>
    );
};

const ServiceModal = ({ expandedService, setExpandedService, editService }) => {
    // Obtener el color asociado al tipo de servicio
    const serviceOption = servicioOptions.find(option => option.value === expandedService.servicio);
    const serviceColor = serviceOption ? serviceOption.color : '#FFFFFF';

    return (
        <div className="modal-backdrop" onClick={() => setExpandedService(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ backgroundColor: serviceColor }}>
                <h2>Detalles del Servicio</h2>
                <p><strong>Cliente:</strong> {expandedService.cliente}</p>
                <p><strong>Servicio:</strong> {serviceOption?.label}</p>
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

                <button
                    className="button edit-btn"
                    onClick={() => {
                        editService(expandedService);
                        setExpandedService(null);
                    }}
                >
                    Editar
                </button>
                <button className="button close-btn" onClick={() => setExpandedService(null)}>
                    Cerrar
                </button>
            </div>
        </div>
    );
};

function App() {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const [viewedMonthIndex, setViewedMonthIndex] = useState(currentMonth - 1);
    const [services, setServices] = useState({});
    const [showForm, setShowForm] = useState(null);
    const [editingService, setEditingService] = useState(null);
    const [expandedService, setExpandedService] = useState(null);
    const [formData, setFormData] = useState(initialFormData);

    const daysInYear = useMemo(() => {
        let days = [];
        for (let month = 1; month <= 12; month++) {
            const daysInMonth = getDaysInMonth(month, currentYear);
            for (let day = 1; day <= daysInMonth; day++) {
                days.push({ day, dayOfWeek: getDayOfWeek(day, month, currentYear), month, year: currentYear });
            }
        }
        return days;
    }, [currentYear]);

    const scrollContainerRef = useRef(null);

    const fetchServices = async () => {
        const { data: servicesData, error } = await supabase
            .from('services')
            .select('*');
        if (error) {
            console.error('Error al obtener los servicios:', error);
        } else {
            const formattedServices = servicesData.reduce((acc, service) => {
                const dateKey = `${service.year}-${service.month}-${service.day}`;

                // Reconstruir el objeto servicio
                const serviceOption = servicioOptions.find(option => option.value === service.servicio);
                const servicio = serviceOption ? serviceOption.value : service.servicio;

                const updatedService = {
                    ...service,
                    servicio,
                };

                if (!acc[dateKey]) {
                    acc[dateKey] = [];
                }
                acc[dateKey].push(updatedService);
                return acc;
            }, {});
            setServices(formattedServices);
        }
    };

    useEffect(() => {
        fetchServices();

        const subscription = supabase
            .channel('public:services')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, (payload) => {
                console.log('Cambio en tiempo real:', payload);
                const serviceData = payload.new;
                const dateKey = `${serviceData.year}-${serviceData.month}-${serviceData.day}`;

                // Reconstruir el objeto servicio
                const serviceOption = servicioOptions.find(option => option.value === serviceData.servicio);
                const servicio = serviceOption ? serviceOption.value : serviceData.servicio;

                const updatedServiceData = {
                    ...serviceData,
                    servicio,
                };

                setServices((prevServices) => {
                    const updatedServices = { ...prevServices };
                    switch (payload.eventType) {
                        case 'INSERT':
                            if (!updatedServices[dateKey]) {
                                updatedServices[dateKey] = [];
                            }
                            updatedServices[dateKey].push(updatedServiceData);
                            break;
                        case 'UPDATE':
                            if (updatedServices[dateKey]) {
                                updatedServices[dateKey] = updatedServices[dateKey].map((service) =>
                                    service.id === updatedServiceData.id ? updatedServiceData : service
                                );
                            }
                            break;
                        case 'DELETE':
                            const oldServiceData = payload.old;
                            const oldDateKey = `${oldServiceData.year}-${oldServiceData.month}-${oldServiceData.day}`;
                            if (updatedServices[oldDateKey]) {
                                updatedServices[oldDateKey] = updatedServices[oldDateKey].filter(
                                    (service) => service.id !== oldServiceData.id
                                );
                            }
                            break;
                        default:
                            break;
                    }
                    return updatedServices;
                });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, []);

    const saveServiceToDatabase = async (serviceData) => {
        // Extraer solo el valor de servicio para almacenar
        const dataToSave = {
            ...serviceData,
            servicio: serviceData.servicio,
        };

        const { error } = await supabase
            .from('services')
            .insert([dataToSave]);

        if (error) {
            console.error('Error al guardar el servicio:', error);
        }
        // No actualizamos el estado local aquí
    };

    const updateServiceInDatabase = async (serviceData) => {
        // Extraer solo el valor de servicio para almacenar
        const dataToUpdate = {
            ...serviceData,
            servicio: serviceData.servicio,
        };

        const { error } = await supabase
            .from('services')
            .update(dataToUpdate)
            .eq('id', serviceData.id);

        if (error) {
            console.error('Error al actualizar el servicio:', error);
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

    const saveService = () => {
        const [year, month, day] = showForm.split('-');
        const serviceData = {
            ...formData,
            year: parseInt(year),
            month: parseInt(month),
            day: parseInt(day),
        };
        saveServiceToDatabase(serviceData);
        setShowForm(null);
        setFormData(initialFormData);
        // No actualizamos el estado local aquí
    };

    const updateService = () => {
        const serviceData = {
            ...formData,
            id: editingService.id,
        };
        updateServiceInDatabase(serviceData);
        setShowForm(null);
        setEditingService(null);
        setFormData(initialFormData);
    };

    const editService = (service) => {
        // Configurar formData correctamente al editar
        const serviceOption = servicioOptions.find(option => option.value === service.servicio);

        setFormData({
            ...service,
            servicio: serviceOption ? serviceOption.value : null,
        });
        setEditingService(service);
        setShowForm(`${service.year}-${service.month}-${service.day}`);
    };

    const jumpToMonth = (event) => {
        const selectedMonth = parseInt(event.target.value, 10);
        setViewedMonthIndex(selectedMonth);
        const firstDayOfMonthIndex = daysInYear.findIndex(day => day.month === selectedMonth + 1 && day.day === 1);
        const scrollContainer = scrollContainerRef.current;
        if (scrollContainer) {
            const dayCardWidth = scrollContainer.clientWidth / getDaysPerView();
            scrollContainer.scrollTo({
                left: firstDayOfMonthIndex * dayCardWidth,
                behavior: 'smooth'
            });
        }
    };

    const getDaysPerView = () => {
        const width = window.innerWidth;
        if (width <= 480) return 1;
        if (width <= 768) return 2;
        if (width <= 1200) return 4;
        return 6;
    };

    const displayedMonthName = getMonthName(viewedMonthIndex + 1);

    const addService = (dateKey) => {
        setFormData(initialFormData);
        setEditingService(null);
        setShowForm(dateKey);
    };

    // Funciones para los botones de navegación
    const scrollLeft = () => {
        const scrollContainer = scrollContainerRef.current;
        if (scrollContainer) {
            const dayCardWidth = scrollContainer.clientWidth / getDaysPerView();
            scrollContainer.scrollBy({
                left: -dayCardWidth,
                behavior: 'smooth',
            });
        }
    };

    const scrollRight = () => {
        const scrollContainer = scrollContainerRef.current;
        if (scrollContainer) {
            const dayCardWidth = scrollContainer.clientWidth / getDaysPerView();
            scrollContainer.scrollBy({
                left: dayCardWidth,
                behavior: 'smooth',
            });
        }
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
                        <select id="monthSelector" onChange={jumpToMonth} value={viewedMonthIndex}>
                            {[...Array(12)].map((_, i) => (
                                <option key={i} value={i}>
                                    {getMonthName(i + 1)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Botones de navegación en los extremos */}
                    <div className="slider-container">
                        <button className="nav-button left-button" onClick={scrollLeft}>
                            Anterior
                        </button>

                        <div id="days-scroll-container" className="days-scroll-container" ref={scrollContainerRef}>
                            {daysInYear.map((dayData, index) => {
                                const dateKey = `${dayData.year}-${dayData.month}-${dayData.day}`;
                                const servicesForDay = services[dateKey];
                                return (
                                    <DayCard
                                        key={dateKey}
                                        dayData={dayData}
                                        dateKey={dateKey}
                                        servicesForDay={servicesForDay}
                                        addService={addService}
                                        setExpandedService={setExpandedService}
                                    />
                                );
                            })}
                        </div>

                        <button className="nav-button right-button" onClick={scrollRight}>
                            Siguiente
                        </button>
                    </div>
                </>
            )}

            {showForm && (
                <ServiceForm
                    editingService={editingService}
                    formData={formData}
                    setFormData={setFormData}
                    addUnidad={addUnidad}
                    handleInputChange={handleInputChange}
                    handleArrayInputChange={handleArrayInputChange}
                    handleChoferInputChange={handleChoferInputChange}
                    saveService={saveService}
                    updateService={updateService}
                    setShowForm={setShowForm}
                    setEditingService={setEditingService}
                    services={services}
                    showForm={showForm}
                />
            )}

            {expandedService && (
                <ServiceModal
                    expandedService={expandedService}
                    setExpandedService={setExpandedService}
                    editService={editService}
                />
            )}
        </div>
    );
}

export default App;
