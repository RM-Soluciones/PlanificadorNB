// App.js
import React, { useState, useRef, useEffect, useMemo } from "react";
import { supabase } from './supabaseClient';
import "./App.css";
import Select from 'react-select';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Listas de choferes y móvil
const choferesList = [
    "SARAPURA", "MENDOZA", "ROJAS", "VELEZ", "MAMANI.P",
    "CRUZ", "CALA", "SALVATIERRA", "GUZMAN", "CORONEL",
    "SOLIS", "RIOS", "SANCHEZ", "FLORES", "MAMANI.F",
    "SERRUDO", "YAGO", "DE ZUANI", "AVENDAÑO", "ARJONA",
    "RAVAZA", "MARTINEZ", "ARRATIA", "DIAZ", "SALAS", "GALLARDO", "APARICIO", "GVH", "MASTERBUS",
    "FENIX", "MAGNO", "MAR ANDINO", "MARCELO COPA",
    "OTRO", "VILAPLANA", "FLORES.J", "SOLIZ.A", "ALVAREZ"
];

const movilesList = [
    "M32", "M33", "M09", "M18", "M20", "M21", "M22",
    "M24", "M25", "M26", "M28", "M30", "M34", "M35",
    "M36", "M37", "M38", "M39", "M40", "M41", "M42",
    "M46", "GVH", "MASTERBUS", "FENIX", "MAGNO",
    "MAR ANDINO", "MARCELO COPA", "OTRO", "M43", "M44", "M45"
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

// Arrays de días de la semana y meses en español
const daysOfWeek = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const monthsOfYear = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

// Componentes separados

const DayCard = ({ dayData, dateKey, servicesForDay, addService, setExpandedService, filters, services, isAuthenticated }) => {
    const { day, month, year } = dayData;

    // Crear un objeto Date
    const date = new Date(year, month - 1, day);

    // Obtener el día de la semana y formatear la fecha
    const dayOfWeek = daysOfWeek[date.getDay()];
    const formattedDate = `${dayOfWeek} ${day}/${month}`;

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
                <h3>{formattedDate}</h3>

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

    // Función para eliminar una unidad
    const removeUnidad = (index) => {
        setFormData((prevData) => {
            const updatedUnidades = [...prevData.unidades];
            updatedUnidades.splice(index, 1);
            return {
                ...prevData,
                unidades: updatedUnidades
            };
        });
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
                    {/* Botón para eliminar unidad */}
                    <button onClick={() => removeUnidad(index)} className="button delete-btn">Eliminar Unidad</button>
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

const ServiceModal = ({ expandedService, setExpandedService, editService, isAuthenticated, deleteService }) => {
    // Obtener el color asociado al tipo de servicio
    const serviceOption = servicioOptions.find(option => option.value === expandedService.servicio);
    const serviceColor = serviceOption ? serviceOption.color : '#FFFFFF';

    // Definir dateKey aquí
    const dateKey = `${expandedService.year}-${expandedService.month}-${expandedService.day}`;

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
                    <>
                        <button
                            className="button edit-btn"
                            onClick={() => {
                                editService(expandedService);
                                setExpandedService(null);
                            }}
                        >
                            Editar
                        </button>
                        <button
                            className="button delete-btn"
                            onClick={() => deleteService(expandedService.id, dateKey)}
                        >
                            Eliminar
                        </button>
                    </>
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

    const [reportFilterType, setReportFilterType] = useState('cliente');
    const [reportFilterValue, setReportFilterValue] = useState(null);
    const [reportStartDate, setReportStartDate] = useState(null);
    const [reportEndDate, setReportEndDate] = useState(null);

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [showLoginForm, setShowLoginForm] = useState(false);

    const daysInYear = useMemo(() => {
        let days = [];
        for (let month = 1; month <= 12; month++) {
            const daysInMonth = new Date(currentYear, month, 0).getDate();
            for (let day = 1; day <= daysInMonth; day++) {
                days.push({ day, month, year: currentYear });
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
                            // Eliminar de todos los dateKeys posibles
                            Object.keys(updatedServices).forEach(key => {
                                updatedServices[key] = updatedServices[key].filter(service => service.id !== newServiceData.id);
                                if (updatedServices[key].length === 0) {
                                    delete updatedServices[key];
                                }
                            });
                            // Agregar al nuevo dateKey
                            if (!updatedServices[newDateKey]) {
                                updatedServices[newDateKey] = [];
                            }
                            updatedServices[newDateKey].push(newServiceData);
                            break;
                        case 'DELETE':
                            if (updatedServices[oldDateKey]) {
                                updatedServices[oldDateKey] = updatedServices[oldDateKey].filter(service => service.id !== oldServiceData.id);
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

    // Estados para el arrastre
    const [isDragging, setIsDragging] = useState(false);
    const [startXDrag, setStartXDrag] = useState(0);
    const [scrollLeftDrag, setScrollLeftDrag] = useState(0);

    useEffect(() => {
        const scrollContainer = scrollContainerRef.current;
        if (!scrollContainer) return;

        let isDown = false;
        let startX;
        let scrollLeftPos;

        const mouseDownHandler = (e) => {
            isDown = true;
            scrollContainer.classList.add('active');
            startX = e.pageX - scrollContainer.offsetLeft;
            scrollLeftPos = scrollContainer.scrollLeft;
        };

        const mouseLeaveHandler = () => {
            isDown = false;
            scrollContainer.classList.remove('active');
        };

        const mouseUpHandler = () => {
            isDown = false;
            scrollContainer.classList.remove('active');
        };

        const mouseMoveHandler = (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - scrollContainer.offsetLeft;
            const walk = (x - startX) * 1; // Ajusta el multiplicador según la velocidad que desees
            scrollContainer.scrollLeft = scrollLeftPos - walk;
        };

        // Manejadores para dispositivos táctiles
        const touchStartHandler = (e) => {
            isDown = true;
            scrollContainer.classList.add('active');
            startX = e.touches[0].pageX - scrollContainer.offsetLeft;
            scrollLeftPos = scrollContainer.scrollLeft;
        };

        const touchEndHandler = () => {
            isDown = false;
            scrollContainer.classList.remove('active');
        };

        const touchMoveHandler = (e) => {
            if (!isDown) return;
            const x = e.touches[0].pageX - scrollContainer.offsetLeft;
            const walk = (x - startX) * 1; // Ajusta el multiplicador según la velocidad que desees
            scrollContainer.scrollLeft = scrollLeftPos - walk;
        };

        scrollContainer.addEventListener('mousedown', mouseDownHandler);
        scrollContainer.addEventListener('mouseleave', mouseLeaveHandler);
        scrollContainer.addEventListener('mouseup', mouseUpHandler);
        scrollContainer.addEventListener('mousemove', mouseMoveHandler);

        scrollContainer.addEventListener('touchstart', touchStartHandler);
        scrollContainer.addEventListener('touchend', touchEndHandler);
        scrollContainer.addEventListener('touchmove', touchMoveHandler);

        return () => {
            scrollContainer.removeEventListener('mousedown', mouseDownHandler);
            scrollContainer.removeEventListener('mouseleave', mouseLeaveHandler);
            scrollContainer.removeEventListener('mouseup', mouseUpHandler);
            scrollContainer.removeEventListener('mousemove', mouseMoveHandler);

            scrollContainer.removeEventListener('touchstart', touchStartHandler);
            scrollContainer.removeEventListener('touchend', touchEndHandler);
            scrollContainer.removeEventListener('touchmove', touchMoveHandler);
        };
    }, []);

    const saveServiceToDatabase = async (serviceData) => {
        const dataToSave = {
            ...serviceData,
        };

        const { error } = await supabase
            .from('services')
            .insert([dataToSave]);

        if (error) {
            console.error('Error al guardar el servicio:', error);
            alert(`Error al guardar el servicio: ${error.message}`);
        } else {
            alert('Servicio guardado exitosamente.');
        }
    };

    const updateServiceInDatabase = async (serviceData) => {
        const { id, ...rest } = serviceData;

        const { data, error } = await supabase
            .from('services')
            .update(rest)
            .eq('id', id);

        if (error) {
            console.error('Error al actualizar el servicio:', error);
            alert(`Error al actualizar el servicio: ${error.message}`);
        } else {
            alert('Servicio actualizado exitosamente.');
            // Actualizar el estado local
            setServices(prevServices => {
                const updatedServices = { ...prevServices };
                const dateKey = `${rest.year}-${rest.month}-${rest.day}`;

                // Remover el servicio de su ubicación anterior si cambió de fecha
                Object.keys(updatedServices).forEach(key => {
                    updatedServices[key] = updatedServices[key].filter(service => service.id !== id);
                    if (updatedServices[key].length === 0) {
                        delete updatedServices[key];
                    }
                });

                // Añadir el servicio actualizado a la nueva fecha
                if (!updatedServices[dateKey]) {
                    updatedServices[dateKey] = [];
                }
                updatedServices[dateKey].push({ ...rest, id });

                return updatedServices;
            });
        }
    };

    const deleteService = async (serviceId, dateKey) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar este servicio?')) {
            return;
        }

        const { error } = await supabase
            .from('services')
            .delete()
            .eq('id', serviceId);

        if (error) {
            console.error('Error al eliminar el servicio:', error);
            alert(`Error al eliminar el servicio: ${error.message}`);
        } else {
            alert('Servicio eliminado exitosamente.');
            // Actualizar el estado local
            setServices(prevServices => {
                const updatedServices = { ...prevServices };
                if (updatedServices[dateKey]) {
                    updatedServices[dateKey] = updatedServices[dateKey].filter(service => service.id !== serviceId);
                    if (updatedServices[dateKey].length === 0) {
                        delete updatedServices[dateKey];
                    }
                }
                return updatedServices;
            });
            setExpandedService(null); // Cerrar el modal después de eliminar
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
        if (width >= 1200) return 7; // Pantallas grandes
        if (width >= 768) return 5;  // Pantallas medianas
        return 2;                    // Pantallas pequeñas
    };

    // Obtener el nombre del mes actual
    const displayedMonthName = monthsOfYear[viewedMonthIndex];

    const addService = (dateKey) => {
        setFormData(initialFormData);
        setEditingService(null);
        setShowForm(dateKey);
    };

    // Funciones para los botones de navegación
    const scrollLeftFunc = () => {
        const scrollContainer = scrollContainerRef.current;
        if (scrollContainer) {
            const dayCardWidth = scrollContainer.clientWidth / getDaysPerView();
            scrollContainer.scrollBy({
                left: -dayCardWidth,
                behavior: 'smooth',
            });
        }
    };

    const scrollRightFunc = () => {
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
                const movil = `Móvil: ${unidad.movil}`;
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
                                {monthsOfYear.map((monthName, i) => (
                                    <option key={i} value={i}>
                                        {monthName}
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
                        <button className="nav-button left-button" onClick={scrollLeftFunc}>
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

                        <button className="nav-button right-button" onClick={scrollRightFunc}>
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
                    deleteService={deleteService}
                />
            )}
        </div>
    );
}

export default App;
