// App.js

import React, { useState, useRef, useEffect, useMemo } from "react";
import { supabase } from './supabaseClient';
import "./App.css";
import Select from 'react-select';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Listas de choferes y móviles
const choferesList = [
    "CARLOS SARAPURA",
    "MAXIMILIANO MENDOZA",
    "DANIEL LOBATO",
    "FELIPE BIANCHINI",
    "IGNACIO FARFALETTA",
    "LUCAS ORTIZ",
    "LEANDRO GONZALEZ",
    "NATALIA BELLACASA",
    "MARCOS MONTI",
    "GONZALO DE LA CRUZ",
    "ALFONSO MENENDEZ",
    "FABIAN PALAZZO",
    "FRANCISCO REYNA",
    "MARTIN MANZA",
    "RODRIGO BERTONA",
    "FERNANDO SCHMITZ",
    "ROGER MORA",
    "NICOLAS SAN FELIPE",
    "NICOLAS ARRIETA",
    "PAULA CARABALLO",
    "ANTONIO VIDAL",
    "JULIAN REYNA",
    "MARTIN REYNA"
];

const movilesList = [
    "M33",
    "M09",
    "M01",
    "M05",
    "M02",
    "M06",
    "M19",
    "M07",
    "M18",
    "M12",
    "M15",
    "M16",
    "M17",
    "M20",
    "M14",
    "M21",
    "M22",
    "M13",
    "M23",
    "M24",
    "M25",
    "M26",
    "M10",
    "M11",
    "M03",
    "M04"
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

// Función para formatear la fecha en YYYY-MM-DD
const formatDateForInput = (date) => {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString().split('T')[0];
};

// Componentes separados

const DayCard = ({ dayData, dateKey, servicesForDay, addService, setExpandedService, filters, services, isAuthenticated }) => {
    const { day, dayOfWeek, month, year } = dayData;

    // Filtrar los servicios según los filtros seleccionados
    const filteredServices = servicesForDay?.filter(service => {
        // Filtrar por chofer
        const matchesChofer = filters.chofer ? service.unidades.some(unidad => unidad.choferes.includes(filters.chofer)) : true;
        // Filtrar por móvil
        const matchesMovil = filters.movil ? service.unidades.some(unidad => unidad.movil === filters.movil) : true;
        return matchesChofer && matchesMovil;
    });

    return (
        <div className="day-card">
            <div className="day-card-content">
                <h3>{`${dayOfWeek} ${day}`}</h3>

                {isAuthenticated && (
                    <button className="add-service-btn" onClick={() => addService(dateKey)}>
                        + Servicio
                    </button>
                )}

                <div className="service-list">
                    {filteredServices && filteredServices.length > 0 && (
                        <div className="service-list-items">
                            {filteredServices.map((service, index) => (
                                <ServiceCard
                                    key={service.id}
                                    service={service}
                                    index={index}
                                    dateKey={dateKey}
                                    setExpandedService={setExpandedService}
                                    services={services}
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
            {/* Cliente, Tipo de Servicio */}
            <p>{service.cliente}, {serviceOption?.label}</p>

            {/* Móvil (en negritas y destacado), Choferes */}
            {service.unidades?.map((unidad, idx) => (
                <p key={idx}>
                    <strong className="movil-highlight">{unidad.movil}</strong>, {unidad.choferes.filter(Boolean).join(', ')}
                </p>
            ))}

            {/* Origen - Destino */}
            <p>{service.origen} - {service.destino}</p>

            {/* Horario */}
            <p>{service.horario}</p>
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
            if (editingService && service.id === editingService.id) return; // Ignorar el servicio que se está editando
            service.unidades.forEach((unidad) => {
                if (type === 'chofer') {
                    unidad.choferes.forEach((chofer) => {
                        if (chofer === name) {
                            isOccupied = true;
                        }
                    });
                } else if (type === 'movil') {
                    if (unidad.movil === name) {
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
                        onChange={(selectedOption) => handleArrayInputChange(selectedOption.value, index, 'movil', 'unidades')}
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
                                onChange={(selectedOption) => handleChoferInputChange(selectedOption.value, index, choferIndex)}
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

const ServiceModal = ({ expandedService, setExpandedService, editService, isAuthenticated }) => {
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
                        <p><strong>Móvil:</strong> <span className="movil-highlight-modal">{unidad.movil}</span></p>
                        {unidad.choferes.map((chofer, choferIndex) => (
                            <p key={choferIndex}><strong>Chofer {choferIndex + 1}:</strong> {chofer}</p>
                        ))}
                    </div>
                ))}
                <p><strong>Origen:</strong> {expandedService.origen} - <strong>Destino:</strong> {expandedService.destino}</p>
                <p><strong>Horario:</strong> {expandedService.horario}</p>
                <p><strong>Observaciones:</strong> {expandedService.observaciones}</p>

                {isAuthenticated && (
                    <button
                        className="button edit-btn"
                        onClick={() => {
                            editService(expandedService);
                            setExpandedService(null);
                        }}
                    >
                        Editar
                    </button>
                )}
                <button className="button close-btn" onClick={() => setExpandedService(null)}>
                    Cerrar
                </button>
            </div>
        </div>
    );
};

const Semaforo = ({ selectedDate, choferesList, movilesList, services }) => {
    // Formatear la fecha seleccionada
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1; // Los meses en JavaScript van de 0 a 11
    const day = selectedDate.getDate();
    const dateKey = `${year}-${month}-${day}`;

    const servicesForDay = services[dateKey] || [];

    // Obtener listas de choferes y móviles ocupados
    const choferesOcupados = new Set();
    const movilesOcupados = new Set();

    servicesForDay.forEach(service => {
        service.unidades.forEach(unidad => {
            if (unidad.movil) {
                movilesOcupados.add(unidad.movil);
            }
            unidad.choferes.forEach(chofer => {
                if (chofer) {
                    choferesOcupados.add(chofer);
                }
            });
        });
    });

    // Opciones para los selectores
    const choferesSemaforoOptions = choferesList.map(chofer => ({
        value: chofer,
        label: chofer,
        isOccupied: choferesOcupados.has(chofer)
    }));

    const movilesSemaforoOptions = movilesList.map(movil => ({
        value: movil,
        label: movil,
        isOccupied: movilesOcupados.has(movil)
    }));

    // Estilos para react-select
    const customStyles = {
        option: (provided, { data }) => ({
            ...provided,
            color: data.isOccupied ? 'red' : 'green',
        }),
        multiValueLabel: (provided, { data }) => ({
            ...provided,
            color: data.isOccupied ? 'red' : 'green',
        }),
    };

    return (
        <div className="semaforo-dropdowns">
            <h2>Disponibilidad para {day}/{month}/{year}</h2>
            <div className="semaforo-dropdown">
                <label>Choferes:</label>
                <Select
                    options={choferesSemaforoOptions}
                    styles={customStyles}
                    isMulti
                    isClearable
                    placeholder="Seleccione choferes..."
                />
            </div>
            <div className="semaforo-dropdown">
                <label>Móviles:</label>
                <Select
                    options={movilesSemaforoOptions}
                    styles={customStyles}
                    isMulti
                    isClearable
                    placeholder="Seleccione móviles..."
                />
            </div>
        </div>
    );
};

const LoginForm = ({ handleLogin, setShowLoginForm }) => {
    const [password, setPassword] = useState('');

    const onSubmit = (e) => {
        e.preventDefault();
        handleLogin(password);
    };

    return (
        <div className="modal-backdrop" onClick={() => setShowLoginForm(false)}>
            <div className="modal-content login-modal" onClick={(e) => e.stopPropagation()}>
                <h2>Iniciar Sesión</h2>
                <form onSubmit={onSubmit} className="login-form">
                    <label>Contraseña:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button type="submit" className="button login-submit-btn">Entrar</button>
                </form>
                <button className="button close-btn" onClick={() => setShowLoginForm(false)}>
                    Cerrar
                </button>
            </div>
        </div>
    );
};

function App() {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const currentDay = new Date().getDate();

    const [viewedMonthIndex, setViewedMonthIndex] = useState(currentMonth - 1);
    const [services, setServices] = useState({});
    const [showForm, setShowForm] = useState(null);
    const [editingService, setEditingService] = useState(null);
    const [expandedService, setExpandedService] = useState(null);
    const [formData, setFormData] = useState(initialFormData);
    const [filters, setFilters] = useState({ chofer: null, movil: null });
    const [selectedSemaforoDate, setSelectedSemaforoDate] = useState(new Date());

    const [reportType, setReportType] = useState('custom');
    const [reportFilterType, setReportFilterType] = useState('cliente');
    const [reportFilterValue, setReportFilterValue] = useState(null);
    const [reportStartDate, setReportStartDate] = useState(null);
    const [reportEndDate, setReportEndDate] = useState(null);

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [showLoginForm, setShowLoginForm] = useState(false);

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

                const updatedService = {
                    ...service,
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
                const oldServiceData = payload.old || {};
                const newServiceData = payload.new || {};
                const oldDateKey = `${oldServiceData.year}-${oldServiceData.month}-${oldServiceData.day}`;
                const newDateKey = `${newServiceData.year}-${newServiceData.month}-${newServiceData.day}`;

                setServices((prevServices) => {
                    const updatedServices = { ...prevServices };
                    switch (payload.eventType) {
                        case 'INSERT':
                            if (!updatedServices[newDateKey]) {
                                updatedServices[newDateKey] = [];
                            }
                            updatedServices[newDateKey].push(newServiceData);
                            break;
                        case 'UPDATE':
                            // Eliminar del dateKey antiguo
                            if (updatedServices[oldDateKey]) {
                                updatedServices[oldDateKey] = updatedServices[oldDateKey].filter(
                                    (service) => service.id !== oldServiceData.id
                                );
                                if (updatedServices[oldDateKey].length === 0) {
                                    delete updatedServices[oldDateKey];
                                }
                            }
                            // Agregar al nuevo dateKey
                            if (!updatedServices[newDateKey]) {
                                updatedServices[newDateKey] = [];
                            }
                            updatedServices[newDateKey].push(newServiceData);
                            break;
                        case 'DELETE':
                            if (updatedServices[oldDateKey]) {
                                updatedServices[oldDateKey] = updatedServices[oldDateKey].filter(
                                    (service) => service.id !== oldServiceData.id
                                );
                                if (updatedServices[oldDateKey].length === 0) {
                                    delete updatedServices[oldDateKey];
                                }
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

    useEffect(() => {
        // Desplazar al día actual solo al cargar la aplicación
        const scrollContainer = scrollContainerRef.current;
        if (scrollContainer && !showForm && !editingService && !expandedService) {
            const currentDayIndex = daysInYear.findIndex(day => day.month === currentMonth && day.day === currentDay);
            if (currentDayIndex !== -1) {
                const dayCardWidth = scrollContainer.scrollWidth / daysInYear.length;
                scrollContainer.scrollTo({
                    left: currentDayIndex * dayCardWidth,
                    behavior: 'smooth',
                });
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [daysInYear, currentMonth, currentDay, showForm, editingService, expandedService]);

    const saveServiceToDatabase = async (serviceData) => {
        const dataToSave = {
            ...serviceData,
        };

        const { error } = await supabase
            .from('services')
            .insert([dataToSave]);

        if (error) {
            console.error('Error al guardar el servicio:', error);
        }
    };

    const updateServiceInDatabase = async (serviceData) => {
        const dataToUpdate = {
            cliente: serviceData.cliente,
            servicio: serviceData.servicio,
            unidades: serviceData.unidades,
            origen: serviceData.origen,
            destino: serviceData.destino,
            horario: serviceData.horario,
            observaciones: serviceData.observaciones,
            year: serviceData.year,
            month: serviceData.month,
            day: serviceData.day,
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

    const handleArrayInputChange = (value, index, field, type) => {
        const updatedData = formData[type].map((item, i) =>
            i === index ? { ...item, [field]: value } : item
        );
        setFormData((prevData) => ({
            ...prevData,
            [type]: updatedData,
        }));
    };

    const handleChoferInputChange = (value, unidadIndex, choferIndex) => {
        const updatedChoferes = [...formData.unidades[unidadIndex].choferes];
        updatedChoferes[choferIndex] = value;
        const updatedUnidades = [...formData.unidades];
        updatedUnidades[unidadIndex].choferes = updatedChoferes;
        setFormData((prevData) => ({
            ...prevData,
            unidades: updatedUnidades
        }));
    };

    const saveService = () => {
        if (!showForm) return; // Prevent if no dateKey

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
        setFormData({
            cliente: service.cliente,
            servicio: service.servicio,
            unidades: service.unidades,
            origen: service.origen,
            destino: service.destino,
            horario: service.horario,
            observaciones: service.observaciones,
            year: service.year,
            month: service.month,
            day: service.day,
        });
        setEditingService(service);
        setShowForm(`${service.year}-${service.month}-${service.day}`);
    };

    const jumpToMonth = (event) => {
        const selectedMonth = parseInt(event.target.value, 10) + 1; // +1 porque los meses en JavaScript son 0-based
        setViewedMonthIndex(selectedMonth - 1);
        const firstDayOfMonthIndex = daysInYear.findIndex(day => day.month === selectedMonth && day.day === 1);
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
        if (width <= 1200) return 5;
        if (width >= 1600) return 8;
        return 7;
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

    // Manejo de filtros
    const handleFilterChange = (selectedOption, filterType) => {
        setFilters(prevFilters => ({
            ...prevFilters,
            [filterType]: selectedOption ? selectedOption.value : null
        }));
    };

    // Manejo del cambio de fecha en el semáforo
    const handleSemaforoDateChange = (e) => {
        const selectedDate = new Date(e.target.value + 'T00:00:00');
        setSelectedSemaforoDate(selectedDate);
    };

    // Función para generar informes en PDF
    const generatePDFReport = () => {
        if (!reportStartDate || !reportEndDate) {
            alert('Por favor, seleccione una fecha de inicio y una fecha de fin para el informe.');
            return;
        }

        let filteredServices = [];

        // Filtrar servicios dentro del rango de fechas seleccionado
        for (let dateKey in services) {
            const [year, month, day] = dateKey.split('-').map(Number);
            const serviceDate = new Date(year, month - 1, day);
            if (serviceDate >= reportStartDate && serviceDate <= reportEndDate) {
                filteredServices = filteredServices.concat(services[dateKey]);
            }
        }

        // Aplicar filtro adicional (cliente, chofer o móvil)
        if (reportFilterValue) {
            filteredServices = filteredServices.filter(service => {
                if (reportFilterType === 'cliente') {
                    return service.cliente === reportFilterValue;
                } else if (reportFilterType === 'chofer') {
                    return service.unidades.some(unidad => unidad.choferes.includes(reportFilterValue));
                } else if (reportFilterType === 'movil') {
                    return service.unidades.some(unidad => unidad.movil === reportFilterValue);
                }
                return true;
            });
        }

        if (filteredServices.length === 0) {
            alert('No se encontraron servicios en el rango de fechas seleccionado.');
            return;
        }

        // Generar el PDF
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text(`Informe desde ${reportStartDate.toLocaleDateString()} hasta ${reportEndDate.toLocaleDateString()}`, 14, 22);

        const tableColumn = ["Fecha", "Cliente", "Servicio", "Unidades", "Origen", "Destino", "Horario", "Observaciones"];
        const tableRows = [];

        filteredServices.forEach(service => {
            const serviceDate = `${service.day}/${service.month}/${service.year}`;
            const unidades = service.unidades.map(unidad => {
                const movil = `<span style="font-weight:bold; color:#1E90FF;">Móvil: ${unidad.movil}</span>`;
                const choferes = unidad.choferes.filter(Boolean).map(chofer => `Chofer: ${chofer}`).join(", ");
                return `${movil}, ${choferes}`;
            }).join(" | ");

            const rowData = [
                serviceDate,
                service.cliente,
                service.servicio,
                unidades,
                service.origen,
                service.destino,
                service.horario,
                service.observaciones
            ];
            tableRows.push(rowData);
        });

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 30,
            styles: { fontSize: 10 },
            columnStyles: {
                3: { cellWidth: 'auto' } // "Unidades" column
            },
            didParseCell: function (data) {
                if (data.column.index === 3) { // "Unidades" column
                    data.cell.styles.fontStyle = 'bold';
                }
            }
        });
        doc.save(`informe_${reportStartDate.toLocaleDateString()}_al_${reportEndDate.toLocaleDateString()}.pdf`);
    };

    const handleLogin = (password) => {
        const correctPassword = 'admin123'; // Reemplaza con la contraseña deseada
        if (password === correctPassword) {
            setIsAuthenticated(true);
            setShowLoginForm(false);
        } else {
            alert('Contraseña incorrecta');
        }
    };

    return (
        <div className="app-container">
            <header className="header">
                <h1>Planificación de Servicios</h1>
                {!isAuthenticated && (
                    <button className="button login-btn" onClick={() => setShowLoginForm(true)}>
                        Iniciar Sesión
                    </button>
                )}
                {isAuthenticated && (
                    <button className="button logout-btn" onClick={() => setIsAuthenticated(false)}>
                        Cerrar Sesión
                    </button>
                )}
            </header>

            {showLoginForm && (
                <LoginForm
                    handleLogin={handleLogin}
                    setShowLoginForm={setShowLoginForm}
                />
            )}

            {!showForm && (
                <>
                    <h2 className="month-viewing">Visualizando: {displayedMonthName}</h2>

                    <div className="controls-container">
                        {/* Selector de mes */}
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

                        {/* Filtros */}
                        <div className="filters">
                            <div className="filter">
                                <label>Filtrar por Chofer:</label>
                                <Select
                                    options={choferesOptions}
                                    onChange={(option) => handleFilterChange(option, 'chofer')}
                                    isClearable
                                    placeholder="Seleccione un chofer..."
                                />
                            </div>
                            <div className="filter">
                                <label>Filtrar por Móvil:</label>
                                <Select
                                    options={movilesOptions}
                                    onChange={(option) => handleFilterChange(option, 'movil')}
                                    isClearable
                                    placeholder="Seleccione un móvil..."
                                />
                            </div>
                        </div>

                        {isAuthenticated && (
                            <>
                                {/* Semáforo y selector de fecha */}
                                <div className="semaforo-section">
                                    <div className="semaforo-date-selector">
                                        <label>Seleccionar fecha para disponibilidad:</label>
                                        <input
                                            type="date"
                                            value={formatDateForInput(selectedSemaforoDate)}
                                            onChange={handleSemaforoDateChange}
                                        />
                                    </div>
                                    <Semaforo
                                        selectedDate={selectedSemaforoDate}
                                        choferesList={choferesList}
                                        movilesList={movilesList}
                                        services={services}
                                    />
                                </div>

                                {/* Generación de informes */}
                                <div className="report-section">
                                    <label>Generar informe:</label>
                                    <div className="report-date-selectors">
                                        <label>Fecha de inicio:</label>
                                        <input
                                            type="date"
                                            value={reportStartDate ? formatDateForInput(reportStartDate) : ''}
                                            onChange={(e) => setReportStartDate(new Date(e.target.value + 'T00:00:00'))}
                                        />
                                        <label>Fecha de fin:</label>
                                        <input
                                            type="date"
                                            value={reportEndDate ? formatDateForInput(reportEndDate) : ''}
                                            onChange={(e) => setReportEndDate(new Date(e.target.value + 'T23:59:59'))}
                                        />
                                    </div>

                                    <select value={reportFilterType} onChange={(e) => { setReportFilterType(e.target.value); setReportFilterValue(null); }}>
                                        <option value="cliente">Por Cliente</option>
                                        <option value="chofer">Por Chofer</option>
                                        <option value="movil">Por Móvil</option>
                                    </select>

                                    {reportFilterType === 'cliente' && (
                                        <Select
                                            options={[...new Set(Object.values(services).flat().map(s => s.cliente))].map(cliente => ({ value: cliente, label: cliente }))}
                                            onChange={(option) => setReportFilterValue(option ? option.value : null)}
                                            isClearable
                                            placeholder="Seleccione un cliente..."
                                            className="report-filter-select"
                                        />
                                    )}

                                    {reportFilterType === 'chofer' && (
                                        <Select
                                            options={choferesOptions}
                                            onChange={(option) => setReportFilterValue(option ? option.value : null)}
                                            isClearable
                                            placeholder="Seleccione un chofer..."
                                            className="report-filter-select"
                                        />
                                    )}

                                    {reportFilterType === 'movil' && (
                                        <Select
                                            options={movilesOptions}
                                            onChange={(option) => setReportFilterValue(option ? option.value : null)}
                                            isClearable
                                            placeholder="Seleccione un móvil..."
                                            className="report-filter-select"
                                        />
                                    )}

                                    <button onClick={generatePDFReport} className="button report-btn">Generar Informe PDF</button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Botones de navegación en los extremos */}
                    <div className="slider-container">
                        <button className="nav-button left-button" onClick={scrollLeft}>
                            Anterior
                        </button>

                        <div id="days-scroll-container" className="days-scroll-container" ref={scrollContainerRef}>
                            {daysInYear.map((dayData) => {
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
                                        filters={filters}
                                        services={services}
                                        isAuthenticated={isAuthenticated}
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
                    isAuthenticated={isAuthenticated}
                />
            )}
        </div>
    );
}
export default App;
