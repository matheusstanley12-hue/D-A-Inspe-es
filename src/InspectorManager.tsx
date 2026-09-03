import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Folder, ChevronRight, ChevronDown, ChevronLeft, Map, User, Settings, CheckCircle, Clock, Maximize2, X } from 'react-feather';
import toast from 'react-hot-toast';

// Fix for default marker icon in react-leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const createPinIcon = (color: string) => L.divIcon({
  className: 'custom-pin-icon',
  html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="32px" height="32px" style="transform: translate(-16px, -32px); filter: drop-shadow(1px 1px 2px rgba(0,0,0,0.4));"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`,
  iconSize: [0, 0],
  iconAnchor: [0, 0],
  popupAnchor: [0, -32]
});

const startIcon = createPinIcon('#2563eb'); // Blue
const destIcon = createPinIcon('#f97316');  // Orange

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Initial Data
const INITIAL_DATA = [
  {
    id: 1,
    name: 'João Silva',
    status: 'disponivel',
    location: 'Sede (Belo Horizonte)',
    currentTask: null,
    trips: [
      {
        id: 't1',
        date: '29/08/2026',
        status: 'completed',
        waypoints: [
          'Praça da Liberdade, BH',
          'Av. Afonso Pena, 1000',
          'Mercado Central, BH'
        ],
        coords: [
          [-19.9320, -43.9380] as [number, number],
          [-19.9227, -43.9351] as [number, number],
          [-19.9219, -43.9436] as [number, number]
        ],
        distanceKm: 5.4,
        stops: 1,
        meals: [
          { type: 'Almoço', value: 45.00 },
          { type: 'Lanche', value: 15.00 }
        ],
        receipts: {
          fuel: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=150&q=80',
          food: ['https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=150&q=80']
        }
      }
    ]
  },
  {
    id: 2,
    name: 'Ana Costa',
    status: 'em_atendimento',
    location: 'CORACORTHE',
    currentTask: 'Inspeção NR-12',
    trips: [
      {
        id: 't2',
        date: '03/09/2026',
        status: 'in_progress',
        waypoints: [
          'Sede (Belo Horizonte)',
          'CORACORTHE (Contagem)'
        ],
        coords: [
          [-19.9320, -43.9380] as [number, number],
          [-19.9540, -44.0200] as [number, number]
        ],
        distanceKm: 15.2,
        stops: 0,
        meals: [],
        receipts: null
      }
    ]
  },
  {
    id: 3,
    name: 'Matheus Stanley',
    status: 'em_atendimento',
    location: 'Fábrica ABC',
    currentTask: 'Visita técnica',
    trips: [
      {
        id: 't3',
        date: '03/09/2026',
        status: 'in_progress',
        waypoints: [
          'Sede (Belo Horizonte)',
          'Fábrica ABC (Betim)'
        ],
        coords: [
          [-19.9320, -43.9380] as [number, number],
          [-19.9670, -44.1980] as [number, number]
        ],
        distanceKm: 28.5,
        stops: 0,
        meals: [],
        receipts: null
      }
    ]
  }
];

export default function InspectorManager() {
  const [fuelPrice, setFuelPrice] = useState(5.50);
  const [consumption, setConsumption] = useState(10.0);
  const [foodAllowance, setFoodAllowance] = useState(40.00); // Limite diário de alimentação
  
  const [inspectors, setInspectors] = useState(INITIAL_DATA);
  
  // Controle de expansão
  const [expandedInspectorId, setExpandedInspectorId] = useState<number | null>(null);
  const [expandedTripIndex, setExpandedTripIndex] = useState<string | null>(null);
  const [fullscreenMapTrip, setFullscreenMapTrip] = useState<any | null>(null);

  // Modais
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [showDemandModal, setShowDemandModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState<{inspId: number, tripId: string} | null>(null);
  
  // Form da Demanda (Nova)
  const [demandForm, setDemandForm] = useState({
    inspector: 'João Silva',
    client: 'CORACORTHE',
    date: '',
    time: '08:00',
    type: 'Visita técnica',
    address: ''
  });

  // Form da Rota (Agora com múltiplos destinos)
  const [routeForm, setRouteForm] = useState({
    date: '',
    waypoints: [''],
    distanceKm: 0
  });

  const calculateFuelCost = (distanceKm: number) => {
    const litersNeeded = distanceKm / consumption;
    return (litersNeeded * fuelPrice);
  };

  const calculateFoodTotal = (meals: {type: string, value: number}[]) => {
    return meals.reduce((acc, meal) => acc + meal.value, 0);
  };

  const calculateTotalCost = (distanceKm: number, meals: {type: string, value: number}[]) => {
    const fuel = calculateFuelCost(distanceKm);
    const food = calculateFoodTotal(meals);
    return (fuel + food).toFixed(2);
  };

  const toggleInspector = (id: number) => {
    if (expandedInspectorId === id) {
      setExpandedInspectorId(null);
      setExpandedTripIndex(null);
    } else {
      setExpandedInspectorId(id);
      
      // Auto expand the first trip if the inspector is "em_atendimento"
      const insp = INITIAL_DATA.find(i => i.id === id);
      if (insp && insp.status === 'em_atendimento' && insp.trips.length > 0) {
        setExpandedTripIndex(`${id}-${insp.trips[0].id}`);
      } else {
        setExpandedTripIndex(null);
      }
    }
  };

  const toggleTrip = (inspectorId: number, tripId: string) => {
    const key = `${inspectorId}-${tripId}`;
    if (expandedTripIndex === key) {
      setExpandedTripIndex(null);
    } else {
      setExpandedTripIndex(key);
    }
  };

  const handleOpenAddRoute = () => {
    // Começa com 2 campos (Partida e 1º Destino)
    setRouteForm({ date: '', waypoints: ['', ''], distanceKm: 0 });
    setEditingRoute(null);
    setShowRouteModal(true);
  };

  const handleOpenEditRoute = (inspId: number, trip: any) => {
    setRouteForm({ 
      date: trip.date, 
      waypoints: [...trip.waypoints], 
      distanceKm: trip.distanceKm 
    });
    setEditingRoute({inspId, tripId: trip.id});
    setShowRouteModal(true);
  };

  const handleDeleteRoute = (inspId: number, tripId: string) => {
    if(confirm('Tem certeza que deseja remover esta rota?')) {
      setInspectors(inspectors.map(insp => {
        if(insp.id === inspId) {
          return { ...insp, trips: insp.trips.filter(t => t.id !== tripId) };
        }
        return insp;
      }));
    }
  };

  const handleAddWaypointField = () => {
    setRouteForm({
      ...routeForm,
      waypoints: [...routeForm.waypoints, '']
    });
  };

  const handleRemoveWaypointField = (index: number) => {
    const newWaypoints = [...routeForm.waypoints];
    newWaypoints.splice(index, 1);
    setRouteForm({ ...routeForm, waypoints: newWaypoints });
  };

  const handleWaypointChange = (index: number, value: string) => {
    const newWaypoints = [...routeForm.waypoints];
    newWaypoints[index] = value;
    setRouteForm({ ...routeForm, waypoints: newWaypoints });
  };

  const handleSaveRoute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expandedInspectorId) return;

    // Filtra pontos em branco para salvar
    const validWaypoints = routeForm.waypoints.filter(w => w.trim() !== '');

    if(validWaypoints.length < 2) {
      toast.error("A rota precisa ter pelo menos um ponto de partida e um destino.");
      return;
    }

    // Função para calcular distância entre duas coordenadas (Fórmula de Haversine)
    const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371; 
      const dLat = (lat2 - lat1) * (Math.PI/180);
      const dLon = (lon2 - lon1) * (Math.PI/180); 
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * (Math.PI/180)) * Math.cos(lat2 * (Math.PI/180)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2); 
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
      return R * c;
    };

    const calculateTotalRouteDistance = (coords: [number, number][]) => {
      let total = 0;
      for (let i = 0; i < coords.length - 1; i++) {
        total += getDistanceFromLatLonInKm(coords[i][0], coords[i][1], coords[i+1][0], coords[i+1][1]);
      }
      return Number(total.toFixed(1));
    };

    setInspectors(inspectors.map(insp => {
      if (insp.id === expandedInspectorId) {
        if (editingRoute) {
          // Edit
          const existingTrip = insp.trips.find(t => t.id === editingRoute.tripId);
          let newCoords = [...(existingTrip?.coords || [])];
          
          // Se adicionou mais pontos, gera coordenadas falsas pra eles
          while(newCoords.length < validWaypoints.length) {
            newCoords.push([
              -19.9208 + (Math.random() * 0.04 - 0.02),
              -43.9378 + (Math.random() * 0.04 - 0.02)
            ]);
          }
          // Se removeu pontos
          if (newCoords.length > validWaypoints.length) {
            newCoords = newCoords.slice(0, validWaypoints.length);
          }

          const calculatedDistance = calculateTotalRouteDistance(newCoords);

          return {
            ...insp,
            trips: insp.trips.map(t => t.id === editingRoute.tripId ? {
              ...t,
              date: routeForm.date,
              waypoints: validWaypoints,
              coords: newCoords,
              distanceKm: calculatedDistance > 0 ? calculatedDistance : 1.5, // fallback
              stops: validWaypoints.length - 2 > 0 ? validWaypoints.length - 2 : 0,
            } : t)
          };
        } else {
          // Add - Gerando coordenadas fake baseadas no centro para visualização
          const fakeCoords = validWaypoints.map((_, i) => [
            -19.9208 + (Math.random() * 0.06 - 0.03),
            -43.9378 + (Math.random() * 0.06 - 0.03)
          ] as [number, number]);

          const calculatedDistance = calculateTotalRouteDistance(fakeCoords);

          const newTrip = {
            id: 't' + Math.random(),
            date: routeForm.date,
            status: 'completed',
            waypoints: validWaypoints,
            coords: fakeCoords,
            distanceKm: calculatedDistance > 0 ? calculatedDistance : (validWaypoints.length * 2.5),
            stops: validWaypoints.length - 2 > 0 ? validWaypoints.length - 2 : 0,
            meals: []
          };
          return { ...insp, trips: [newTrip, ...insp.trips] };
        }
      }
      return insp;
    }));
    
    setShowRouteModal(false);
  };

  return (
    <div className="h-full flex flex-col max-w-5xl mx-auto w-full pt-4 relative">
      
      {/* Header & Config */}
      <div className="mb-8 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Gestão de Inspetores</h1>
          <p className="text-sm text-gray-500 mt-1">Gestão de rotas, reembolsos e programação de demandas.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap items-center gap-4 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <span className="text-xs font-bold text-gray-500 mr-2">GASOLINA:</span>
              <input 
                type="number" step="0.01" value={fuelPrice} onChange={e => setFuelPrice(Number(e.target.value))}
                className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>
            <div className="flex items-center">
              <span className="text-xs font-bold text-gray-500 mr-2">CONSUMO:</span>
              <input 
                type="number" step="0.1" value={consumption} onChange={e => setConsumption(Number(e.target.value))}
                className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>
            <div className="flex items-center">
              <span className="text-xs font-bold text-gray-500 mr-2">ALIMENT.:</span>
              <input 
                type="number" step="1" value={foodAllowance} onChange={e => setFoodAllowance(Number(e.target.value))}
                className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <button 
            onClick={() => setShowDemandModal(true)}
            className="bg-[#0066cc] hover:bg-[#0052a3] text-white px-5 py-3 rounded-lg font-bold shadow-md transition-colors flex items-center"
          >
            + Programar Demanda
          </button>
        </div>
      </div>

      {/* Lista de Pastas */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-12">
        {expandedInspectorId === null ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
            {/* Disponíveis */}
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 shadow-sm">
              <h3 className="font-extrabold text-emerald-800 mb-4 flex items-center">
                <CheckCircle size={18} className="mr-2" /> Disponíveis e Sem Demanda
              </h3>
              <div className="space-y-3">
                {inspectors.filter(i => i.status === 'disponivel').map(insp => (
                  <div key={insp.id} onClick={() => toggleInspector(insp.id)} className="bg-white rounded-lg p-4 border border-emerald-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow group">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                          {insp.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">{insp.name}</p>
                          <p className="text-xs text-gray-500 flex items-center mt-0.5"><Map size={12} className="mr-1" /> {insp.location}</p>
                        </div>
                      </div>
                      <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-1 rounded font-bold">LIVRE</span>
                    </div>
                  </div>
                ))}
                {inspectors.filter(i => i.status === 'disponivel').length === 0 && (
                  <p className="text-sm text-emerald-600/70 italic text-center py-4">Nenhum inspetor disponível.</p>
                )}
              </div>
            </div>

            {/* Em Atendimento */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 shadow-sm">
              <h3 className="font-extrabold text-blue-800 mb-4 flex items-center">
                <Clock size={18} className="mr-2" /> Em Atendimento
              </h3>
              <div className="space-y-3">
                {inspectors.filter(i => i.status === 'em_atendimento').map(insp => (
                  <div key={insp.id} onClick={() => toggleInspector(insp.id)} className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow group">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                          {insp.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{insp.name}</p>
                          <p className="text-xs font-bold text-blue-600 mt-0.5">Demanda: {insp.currentTask}</p>
                          <p className="text-xs text-gray-500 flex items-center mt-0.5"><Map size={12} className="mr-1" /> {insp.location}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {inspectors.filter(i => i.status === 'em_atendimento').length === 0 && (
                  <p className="text-sm text-blue-600/70 italic text-center py-4">Nenhum inspetor em atendimento.</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          inspectors.filter(i => i.id === expandedInspectorId).map(inspector => (
            <div key={inspector.id} className="transition-all duration-200 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl ${inspector.status === 'disponivel' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                    {inspector.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="font-bold text-2xl text-gray-900">{inspector.name}</h3>
                    <p className={`text-sm font-bold ${inspector.status === 'disponivel' ? 'text-emerald-600' : 'text-blue-600'}`}>
                      {inspector.status === 'disponivel' ? 'Disponível e sem demanda' : `Em atendimento: ${inspector.currentTask}`}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setExpandedInspectorId(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded hover:bg-gray-200 transition-colors flex items-center"
                >
                  <ChevronLeft size={16} className="mr-1" /> Voltar ao Painel
                </button>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Histórico de Rotas e Reembolsos</h4>
                
                {/* Botão de Adicionar Nova Rota */}
                <button 
                  onClick={handleOpenAddRoute}
                  className="mb-4 text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors border border-blue-200 border-dashed w-full justify-center"
                >
                  + Adicionar Nova Rota / Atendimento
                </button>

                {inspector.trips.map((trip) => {
                  const tripKey = `${inspector.id}-${trip.id}`;
                  const isTripExpanded = expandedTripIndex === tripKey;
                  const totalFood = calculateFoodTotal(trip.meals);
                  const foodExcess = totalFood > foodAllowance ? totalFood - foodAllowance : 0;

                  return (
                    <div key={trip.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                      
                      {/* Linha da Data */}
                      <div className="flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-transparent">
                        <button 
                          onClick={() => toggleTrip(inspector.id, trip.id)}
                          className="flex-1 flex items-center p-4"
                        >
                          <div className={`p-2 rounded-full mr-3 ${trip.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                            {trip.status === 'completed' ? <CheckCircle size={16} /> : <Clock size={16} />}
                          </div>
                          <div className="text-left">
                            <h4 className="font-bold text-gray-800">{trip.date}</h4>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {trip.distanceKm} km • {trip.waypoints.length} paradas • Reembolso: R$ {calculateTotalCost(trip.distanceKm, trip.meals)}
                            </p>
                          </div>
                        </button>
                        
                        {/* Ações Rápidas (Editar/Remover) */}
                        <div className="flex items-center space-x-2 px-4">
                          <button onClick={() => handleOpenEditRoute(inspector.id, trip)} className="text-gray-400 hover:text-blue-600 text-xs font-bold px-2 py-1 bg-gray-100 rounded">Editar</button>
                          <button onClick={() => handleDeleteRoute(inspector.id, trip.id)} className="text-gray-400 hover:text-red-600 text-xs font-bold px-2 py-1 bg-gray-100 rounded">Remover</button>
                          <button onClick={() => toggleTrip(inspector.id, trip.id)} className="ml-2">
                            {isTripExpanded ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronRight size={18} className="text-gray-400" />}
                          </button>
                        </div>
                      </div>

                      {/* Detalhes da Viagem & MAPA */}
                      {isTripExpanded && (
                        <div className="border-t border-gray-100 bg-gray-50 p-5">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            
                            {/* Detalhes em Texto */}
                            <div className="space-y-4">
                              <div className="bg-white p-4 rounded border border-gray-200 shadow-sm">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 border-b border-gray-100 pb-2">Destinos ({trip.waypoints.length})</p>
                                <ul className="space-y-3 relative border-l-2 border-gray-200 ml-2 pl-4">
                                  {trip.waypoints.map((point, idx) => (
                                    <li key={idx} className="relative">
                                      <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 ${idx === 0 || idx === trip.waypoints.length-1 ? 'border-blue-600 bg-white' : 'bg-gray-400 border-white'}`}></div>
                                      <p className="text-xs text-gray-400 font-bold mb-0.5">{idx === 0 ? 'PARTIDA' : idx === trip.waypoints.length - 1 ? 'DESTINO FINAL' : `PARADA ${idx}`}</p>
                                      <p className="text-sm font-medium text-gray-800">{point}</p>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              
                              <div className="bg-white p-4 rounded border border-gray-200 shadow-sm">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 border-b border-gray-100 pb-2">Composição do Reembolso</p>
                                
                                <div className="space-y-2 mb-3">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Combustível ({trip.distanceKm} km)</span>
                                    <span className="font-medium">R$ {calculateFuelCost(trip.distanceKm).toFixed(2)}</span>
                                  </div>
                                  
                                  {trip.meals.map((meal, idx) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                      <span className="text-gray-600">Alimentação: {meal.type}</span>
                                      <span className="font-medium">R$ {meal.value.toFixed(2)}</span>
                                    </div>
                                  ))}

                                  {foodExcess > 0 && (
                                    <div className="flex justify-between text-sm bg-red-50 p-2 rounded border border-red-100 mt-2">
                                      <span className="text-red-700 font-medium text-xs">Excedeu limite de alimentação (R$ {foodAllowance.toFixed(2)})</span>
                                      <span className="font-bold text-red-700">+ R$ {foodExcess.toFixed(2)}</span>
                                    </div>
                                  )}
                                  
                                  {trip.meals.length === 0 && (
                                    <div className="flex justify-between text-sm text-gray-400 italic">
                                      <span>Nenhuma alimentação registrada</span>
                                      <span>R$ 0.00</span>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                                  <span className="text-sm font-bold text-gray-800">Total a Pagar</span>
                                  <span className="font-bold text-emerald-600 text-xl">R$ {calculateTotalCost(trip.distanceKm, trip.meals)}</span>
                                </div>
                              </div>

                              {/* Comprovantes (Fotos) */}
                              {trip.receipts && (
                                <div className="bg-white p-4 rounded border border-gray-200 shadow-sm">
                                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 border-b border-gray-100 pb-2">Comprovantes (Fotos)</p>
                                  <div className="flex gap-3 overflow-x-auto pb-2">
                                    {trip.receipts.fuel && (
                                      <div className="shrink-0 group cursor-pointer relative rounded-lg border border-gray-200 overflow-hidden w-24 h-24">
                                        <img src={trip.receipts.fuel} alt="Comprovante Combustível" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                          <span className="text-white text-[10px] font-bold text-center leading-tight px-1">Ver<br/>Combustível</span>
                                        </div>
                                      </div>
                                    )}
                                    {trip.receipts.food && trip.receipts.food.map((foodReceipt, idx) => (
                                      <div key={idx} className="shrink-0 group cursor-pointer relative rounded-lg border border-gray-200 overflow-hidden w-24 h-24">
                                        <img src={foodReceipt} alt={`Comprovante Alimentação ${idx+1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                          <span className="text-white text-[10px] font-bold text-center leading-tight px-1">Ver<br/>Alimentação {idx+1}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                            </div>

                            {/* Mapa Incorporado */}
                            <div className="h-64 lg:h-full rounded-lg overflow-hidden border border-gray-300 shadow-inner relative min-h-[300px]">
                              <MapContainer 
                                center={trip.coords[0] as [number, number]} 
                                zoom={13} 
                                className="w-full h-full z-0"
                              >
                                <TileLayer
                                  attribution='&copy; OSM'
                                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                {trip.coords.map((coord, idx) => (
                                  <Marker 
                                    key={idx} 
                                    position={coord as [number, number]}
                                    icon={idx === 0 ? startIcon : destIcon}
                                  >
                                    <Popup>{trip.waypoints[idx]}</Popup>
                                  </Marker>
                                ))}
                                <Polyline 
                                  positions={trip.coords as [number, number][]} 
                                  color={trip.status === 'completed' ? "#059669" : "#2563eb"} 
                                  weight={4}
                                  dashArray={trip.status === 'completed' ? "" : "10, 10"}
                                />
                              </MapContainer>
                              
                              <div className="absolute top-2 right-2 z-10 flex gap-2">
                                <div className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow border border-gray-200 flex items-center">
                                  <Map size={14} className="text-blue-600 mr-2" />
                                  <span className="text-xs font-bold text-gray-700">Rota Completa Registrada</span>
                                </div>
                                <button 
                                  onClick={() => setFullscreenMapTrip(trip)}
                                  className="bg-white/90 backdrop-blur p-1.5 rounded-full shadow border border-gray-200 text-gray-700 hover:text-blue-600 hover:bg-white transition-colors"
                                  title="Expandir Mapa"
                                >
                                  <Maximize2 size={16} />
                                </button>
                              </div>
                            </div>
                            
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Modal Adicionar/Editar Rota com Destinos Infinitos */}
      {showRouteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-bold text-gray-800">
                {editingRoute ? 'Editar Rota' : 'Adicionar Nova Rota'}
              </h3>
              <button onClick={() => setShowRouteModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
            </div>
            
            <div className="overflow-y-auto p-6">
              <form id="route-form" onSubmit={handleSaveRoute} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">DATA DA ROTA</label>
                  <input 
                    type="text" required value={routeForm.date} onChange={e => setRouteForm({...routeForm, date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:ring-1 focus:ring-blue-500" 
                    placeholder="Ex: 30/08/2026"
                  />
                </div>

                <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold text-gray-500">DESTINOS DA ROTA</label>
                  </div>
                  
                  {routeForm.waypoints.map((point, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="flex-1">
                        <input 
                          type="text" 
                          required 
                          value={point} 
                          onChange={e => handleWaypointChange(index, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:ring-1 focus:ring-blue-500" 
                          placeholder={index === 0 ? "Ponto de Partida..." : index === routeForm.waypoints.length - 1 ? "Destino Final..." : `Parada ${index}...`}
                        />
                      </div>
                      {routeForm.waypoints.length > 2 && (
                        <button 
                          type="button"
                          onClick={() => handleRemoveWaypointField(index)}
                          className="text-red-500 hover:text-red-700 p-2"
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  ))}
                  
                  <button 
                    type="button" 
                    onClick={handleAddWaypointField}
                    className="text-blue-600 text-sm font-bold mt-2 hover:underline flex items-center"
                  >
                    + Adicionar mais um destino
                  </button>
                </div>
              </form>
            </div>

            <div className="p-4 border-t border-gray-100 shrink-0 flex justify-end space-x-3 bg-white">
              <button 
                type="button" onClick={() => setShowRouteModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >Cancelar</button>
              <button 
                type="submit" form="route-form"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors"
              >Salvar Rota</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Nova Demanda */}
      {showDemandModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-[scaleIn_0.2s_ease-out]">
            <div className="bg-[#0066cc] px-6 py-4 flex justify-between items-center text-white">
              <h2 className="text-xl font-bold">Programar Nova Demanda</h2>
              <button onClick={() => setShowDemandModal(false)} className="text-white hover:text-gray-200">
                &times;
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Responsável (Inspetor)</label>
                <select 
                  className="w-full border border-gray-300 rounded p-2 focus:ring-1 focus:ring-blue-500"
                  value={demandForm.inspector}
                  onChange={(e) => setDemandForm({...demandForm, inspector: e.target.value})}
                >
                  <option>João Silva</option>
                  <option>Matheus Stanley</option>
                  <option>Ana Costa</option>
                  <option>Todos</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Cliente</label>
                <select 
                  className="w-full border border-gray-300 rounded p-2 focus:ring-1 focus:ring-blue-500 bg-white"
                  value={demandForm.client}
                  onChange={(e) => {
                    const MOCK_CLIENTS_LIST = [
                      { name: '', address: '' },
                      { name: 'CORACORTHE', address: 'Rua das Indústrias, 500, Campinas - SP' },
                      { name: 'Galpão Weir', address: 'Avenida José Alves de Oliveira, 128, Novo Horizonte, Jundiaí - SP' },
                      { name: 'Fábrica ABC', address: 'Rodovia BR-101, Km 42, São Paulo - SP' },
                      { name: 'Mercado Central', address: 'Rua do Mercado, 120, Centro - BH' }
                    ];
                    const selectedClient = MOCK_CLIENTS_LIST.find(c => c.name === e.target.value);
                    setDemandForm({
                      ...demandForm, 
                      client: e.target.value,
                      address: selectedClient ? selectedClient.address : ''
                    });
                  }}
                >
                  <option value="" disabled>Selecione um cliente...</option>
                  <option value="CORACORTHE">CORACORTHE</option>
                  <option value="Galpão Weir">Galpão Weir</option>
                  <option value="Fábrica ABC">Fábrica ABC</option>
                  <option value="Mercado Central">Mercado Central</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Endereço da Demanda</label>
                <input 
                  type="text"
                  className="w-full border border-gray-300 rounded p-2 bg-gray-50 text-gray-500 cursor-not-allowed"
                  placeholder="Endereço preenchido automaticamente"
                  value={demandForm.address}
                  readOnly
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Data</label>
                  <input 
                    type="date"
                    className="w-full border border-gray-300 rounded p-2 focus:ring-1 focus:ring-blue-500"
                    value={demandForm.date}
                    onChange={(e) => setDemandForm({...demandForm, date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Horário</label>
                  <input 
                    type="time"
                    className="w-full border border-gray-300 rounded p-2 focus:ring-1 focus:ring-blue-500"
                    value={demandForm.time}
                    onChange={(e) => setDemandForm({...demandForm, time: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo de Tarefa</label>
                <select 
                  className="w-full border border-gray-300 rounded p-2 focus:ring-1 focus:ring-blue-500 bg-white"
                  value={demandForm.type}
                  onChange={(e) => setDemandForm({...demandForm, type: e.target.value})}
                >
                  <option>Visita técnica</option>
                  <option>Inspeção</option>
                </select>
              </div>
            </div>
            
            <div className="border-t border-gray-100 p-4 bg-gray-50 flex justify-end gap-3">
              <button 
                onClick={() => setShowDemandModal(false)}
                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  if(!demandForm.date || !demandForm.client) {
                    toast.error('Preencha os campos obrigatórios (Cliente e Data).');
                    return;
                  }
                  toast.success('Demanda programada com sucesso! (Sincronizado no App e Calendário)');
                  setShowDemandModal(false);
                }}
                className="bg-[#0066cc] text-white px-6 py-2 rounded font-bold hover:bg-[#0052a3]"
              >
                Programar Demanda
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DO MAPA FULLSCREEN */}
      {fullscreenMapTrip && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex flex-col animate-[fadeIn_0.2s_ease-out]">
          <div className="p-4 flex justify-between items-center bg-white shadow-sm z-[101]">
            <div>
              <h2 className="font-bold text-xl text-gray-900">Mapa de Rota - Visão Expandida</h2>
              <p className="text-sm text-gray-500">{fullscreenMapTrip.waypoints.join(' ➔ ')}</p>
            </div>
            <button 
              onClick={() => setFullscreenMapTrip(null)}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X size={24} className="text-gray-700" />
            </button>
          </div>
          
          <div className="flex-1 w-full relative z-[100]">
            <MapContainer 
              center={fullscreenMapTrip.coords[0] as [number, number]} 
              zoom={13} 
              className="w-full h-full"
            >
              <TileLayer
                attribution='&copy; OSM'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {fullscreenMapTrip.coords.map((coord: any, idx: number) => (
                <Marker 
                  key={idx} 
                  position={coord as [number, number]}
                  icon={idx === 0 ? startIcon : destIcon}
                >
                  <Popup>{fullscreenMapTrip.waypoints[idx]}</Popup>
                </Marker>
              ))}
              <Polyline 
                positions={fullscreenMapTrip.coords as [number, number][]} 
                color={fullscreenMapTrip.status === 'completed' ? "#059669" : "#2563eb"} 
                weight={4}
                dashArray={fullscreenMapTrip.status === 'completed' ? "" : "10, 10"}
              />
            </MapContainer>
          </div>
        </div>
      )}
    </div>
  );
}
