import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { 
  Navigation, MapPin, Compass, Maximize2, Minimize2, 
  Play
} from 'react-feather';

// Fix padrão de ícones do Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export interface MapPoint {
  id: string;
  name: string;
  address?: string;
  coords: [number, number];
  type?: 'sede' | 'cliente' | 'obra' | 'inspetor';
  status?: 'Agendada' | 'Em Andamento' | 'Concluída' | 'Pendente' | string;
  orderCode?: string;
  orderType?: string;
  contact?: string;
  time?: string;
}

export interface ModernGpsMapProps {
  points?: MapPoint[];
  routeCoords?: [number, number][];
  center?: [number, number];
  zoom?: number;
  height?: string;
  className?: string;
  enableLiveGps?: boolean;
  selectedPointId?: string | null;
  onSelectPoint?: (point: MapPoint) => void;
  onStartInspection?: (point: MapPoint) => void;
  showHud?: boolean;
  showLayerToggle?: boolean;
  showNavigationControls?: boolean;
  title?: string;
  subtitle?: string;
}

// Provedores de Camadas (Estilo Google Maps Oficial)
type MapLayerType = 'google-streets' | 'google-hybrid' | 'google-terrain';

const MAP_LAYERS: Record<MapLayerType, { name: string; url: string; subdomains?: string[]; maxZoom: number }> = {
  'google-streets': {
    name: 'Google Ruas',
    url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    maxZoom: 20
  },
  'google-hybrid': {
    name: 'Google Satélite',
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    maxZoom: 20
  },
  'google-terrain': {
    name: 'Google Relevo',
    url: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    maxZoom: 20
  }
};

// Ícone Customizado: Inspetor ao Vivo (GPS Pulsante Google Maps / Uber)
const createGpsLiveIcon = (heading?: number) => {
  return L.divIcon({
    className: 'gps-live-beacon',
    html: `
      <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; transform: translate(-22px, -22px);">
        <!-- Pulso de radar exterior -->
        <div style="position: absolute; width: 44px; height: 44px; border-radius: 9999px; background: rgba(37, 99, 235, 0.25); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: absolute; width: 30px; height: 30px; border-radius: 9999px; background: rgba(59, 130, 246, 0.4);"></div>
        <!-- Ponto central de alta visibilidade -->
        <div style="position: relative; width: 18px; height: 18px; border-radius: 9999px; background: #1d4ed8; border: 3px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center;">
          <div style="width: 5px; height: 5px; border-radius: 9999px; background: #ffffff;"></div>
        </div>
        ${heading !== undefined && heading !== null ? `
          <div style="position: absolute; top: -4px; width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-bottom: 9px solid #1d4ed8; transform: rotate(${heading}deg); transform-origin: 50% 26px;"></div>
        ` : ''}
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -22]
  });
};

// Ícone Customizado: Sede Corporativa
const createSedeIcon = () => {
  return L.divIcon({
    className: 'sede-pin-icon',
    html: `
      <div style="position: relative; transform: translate(-18px, -36px); filter: drop-shadow(0 4px 8px rgba(0,0,0,0.35));">
        <svg width="36" height="42" viewBox="0 0 36 42" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 0C8.05887 0 0 8.05887 0 18C0 28.5 18 42 18 42C18 42 36 28.5 36 18C36 8.05887 27.9411 0 18 0Z" fill="#0f172a"/>
          <path d="M18 2C9.16344 2 2 9.16344 2 18C2 27 18 39.5 18 39.5C18 39.5 34 27 34 18C34 9.16344 26.8366 2 18 2Z" fill="#1e293b"/>
          <circle cx="18" cy="18" r="10" fill="#3b82f6"/>
        </svg>
        <div style="position: absolute; top: 10px; left: 10px; color: white; font-size: 11px; font-weight: 900; line-height: 1; text-align: center; width: 16px;">
          🏢
        </div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -38]
  });
};

// Ícone Customizado: Cliente / Obra (Modern Google Pin com Cores de Status)
const createClientPinIcon = (status?: string, isSelected?: boolean) => {
  const isDone = status === 'Concluída';
  const isStarted = status === 'Em Andamento';
  const fillColor = isDone ? '#059669' : isStarted ? '#d97706' : '#2563eb';
  const badgeColor = isDone ? '#10b981' : isStarted ? '#f59e0b' : '#3b82f6';

  return L.divIcon({
    className: 'client-pin-icon',
    html: `
      <div style="position: relative; transform: translate(-18px, -40px) ${isSelected ? 'scale(1.2)' : 'scale(1)'}; transition: transform 0.2s ease; filter: drop-shadow(0 6px 12px rgba(0,0,0,0.35)); cursor: pointer;">
        <svg width="36" height="44" viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 0C8.05887 0 0 8.05887 0 18C0 29.5 18 44 18 44C18 44 36 29.5 36 18C36 8.05887 27.9411 0 18 0Z" fill="${fillColor}"/>
          <path d="M18 2C9.16344 2 2 9.16344 2 18C2 28 18 41.5 18 41.5C18 41.5 34 28 34 18C34 9.16344 26.8366 2 18 2Z" fill="${badgeColor}"/>
          <circle cx="18" cy="18" r="9" fill="#ffffff"/>
        </svg>
        <div style="position: absolute; top: 11px; left: 11px; color: ${fillColor}; font-size: 11px; font-weight: 900; line-height: 1; text-align: center; width: 14px;">
          ${isDone ? '✓' : isStarted ? '⚡' : '📍'}
        </div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -42]
  });
};

// Cálculo de Distância Real (Fórmula de Haversine)
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round((R * c) * 10) / 10;
}

// Estimativa de Tempo de Deslocamento Automotivo
function estimateTravelTime(distanceKm: number): string {
  const avgSpeedKmh = 40; // Velocidade média urbana / rodoviária realista
  const minutes = Math.round((distanceKm / avgSpeedKmh) * 60);
  if (minutes < 60) return `${Math.max(3, minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  return `${hours}h ${remMinutes}m`;
}

// Resolução Inteligente de Coordenadas para Cidades e Polos Industriais
export function resolveOrderCoordinates(locationOrClient?: string, index: number = 0): [number, number] {
  if (!locationOrClient) return [-19.9208, -43.9378];
  const q = locationOrClient.toLowerCase();
  if (q.includes('betim')) return [-19.9678, -44.1983];
  if (q.includes('contagem')) return [-19.9387, -44.0298];
  if (q.includes('nova lima')) return [-19.9858, -43.8469];
  if (q.includes('santa luzia')) return [-19.7698, -43.8514];
  if (q.includes('sabará') || q.includes('sabara')) return [-19.8898, -43.8058];
  if (q.includes('sete lagoas')) return [-19.4608, -44.2468];
  if (q.includes('ipatinga')) return [-19.4688, -42.5367];
  if (q.includes('ouro branco')) return [-20.5218, -43.6914];
  if (q.includes('congonhas')) return [-20.4997, -43.8569];
  if (q.includes('são paulo') || q.includes('sao paulo') || q.includes(' sp')) return [-23.5505, -46.6333];
  if (q.includes('rio de janeiro') || q.includes(' rj')) return [-22.9068, -43.1729];
  if (q.includes('macaé') || q.includes('macae')) return [-22.3768, -41.7869];
  if (q.includes('santos')) return [-23.9618, -46.3322];
  if (q.includes('vitória') || q.includes('vitoria') || q.includes('tubarão') || q.includes('tubarao')) return [-20.3155, -40.3128];
  
  // Variação determinística no anel metropolitano da Sede (BH)
  const angle = (index * 65 * Math.PI) / 180;
  const radius = 0.035 + (index * 0.015);
  return [
    -19.9320 + Math.sin(angle) * radius,
    -43.9380 + Math.cos(angle) * radius
  ];
}

// Abrir Navegação GPS Oficial no Google Maps
export function openGoogleMapsTurnByTurn(target: string | [number, number]) {
  const destination = Array.isArray(target)
    ? `${target[0]},${target[1]}`
    : encodeURIComponent(target);
  window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`, '_blank');
}

// Abrir Navegação no Waze
export function openWazeTurnByTurn(target: string | [number, number]) {
  const q = Array.isArray(target)
    ? `${target[0]},${target[1]}`
    : encodeURIComponent(target);
  window.open(`https://waze.com/ul?q=${q}&navigate=yes`, '_blank');
}

// Controlador de Zoom e Centralização Dinâmica do Leaflet
function MapController({ 
  center, 
  zoom, 
  flyTrigger 
}: { 
  center: [number, number]; 
  zoom: number; 
  flyTrigger: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2, easeLinearity: 0.25 });
  }, [flyTrigger, center, zoom, map]);
  return null;
}

export default function ModernGpsMap({
  points = [],
  routeCoords,
  center: initialCenter = [-19.9320, -43.9380], // Sede D&A Inspeções (Belo Horizonte - MG)
  zoom: initialZoom = 13,
  height = '420px',
  className = '',
  enableLiveGps = true,
  selectedPointId = null,
  onSelectPoint,
  onStartInspection,
  showHud = true,
  showLayerToggle = true,
  showNavigationControls = true,
  title = 'Navegação & Rota GPS',
  subtitle = 'Acompanhamento dinâmico estilo Google Maps'
}: ModernGpsMapProps) {
  const [activeLayer, setActiveLayer] = useState<MapLayerType>('google-streets');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Coordenadas Live do GPS do Inspetor
  const [gpsLocation, setGpsLocation] = useState<[number, number] | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsSpeed, setGpsSpeed] = useState<number | null>(null);
  const [gpsHeading, setGpsHeading] = useState<number | null>(null);
  const [gpsActive, setGpsActive] = useState<boolean>(false);

  // Controle de Visualização no Mapa
  const [mapCenter, setMapCenter] = useState<[number, number]>(initialCenter);
  const [mapZoom, setMapZoom] = useState<number>(initialZoom);
  const [flyTrigger, setFlyTrigger] = useState<number>(0);

  // Ponto Selecionado Atualmente
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Efeito de Rastreamento GPS ao Vivo (Nativo do Dispositivo)
  useEffect(() => {
    if (!enableLiveGps || typeof window === 'undefined' || !navigator.geolocation) {
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy, speed, heading } = pos.coords;
        const newCoords: [number, number] = [latitude, longitude];
        setGpsLocation(newCoords);
        setGpsAccuracy(Math.round(accuracy));
        setGpsSpeed(speed ? Math.round(speed * 3.6) : 0); // m/s para km/h
        setGpsHeading(heading);
        setGpsActive(true);
      },
      (err) => {
        console.warn('GPS não obtido ou sem permissão:', err.message);
        setGpsActive(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [enableLiveGps]);

  // Sincronizar ponto selecionado de fora
  useEffect(() => {
    if (selectedPointId && points.length > 0) {
      const found = points.find(p => p.id === selectedPointId);
      if (found) {
        setSelectedPoint(found);
        setMapCenter(found.coords);
        setMapZoom(15);
        setFlyTrigger(prev => prev + 1);
      }
    }
  }, [selectedPointId, points]);

  // Centralizar na Posição do Inspetor (GPS)
  const handleRecenterGps = () => {
    if (gpsLocation) {
      setMapCenter(gpsLocation);
      setMapZoom(16);
      setFlyTrigger(prev => prev + 1);
    } else {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setGpsLocation(coords);
          setMapCenter(coords);
          setMapZoom(16);
          setFlyTrigger(prev => prev + 1);
          setGpsActive(true);
        },
        () => {
          // Fallback para a sede se GPS não estiver liberado
          setMapCenter(initialCenter);
          setMapZoom(14);
          setFlyTrigger(prev => prev + 1);
        },
        { enableHighAccuracy: true }
      );
    }
  };

  // Ponto de Origem para Cálculos de Rota: Posição do Inspetor ou Sede
  const originCoords = gpsLocation || initialCenter;

  // Cálculo da Distância até o Ponto Selecionado
  const selectedDistanceKm = selectedPoint
    ? calculateDistanceKm(originCoords[0], originCoords[1], selectedPoint.coords[0], selectedPoint.coords[1])
    : null;

  const selectedEta = selectedDistanceKm !== null ? estimateTravelTime(selectedDistanceKm) : null;

  // Coordenadas da Linha de Rota (se não fornecidas externamente, liga o GPS ou a Sede aos pontos)
  const computedRoute: [number, number][] = routeCoords && routeCoords.length > 0
    ? routeCoords
    : selectedPoint
    ? [originCoords, selectedPoint.coords]
    : points.length > 0
    ? [originCoords, ...points.map(p => p.coords)]
    : [];

  return (
    <div 
      ref={containerRef}
      className={`relative w-full rounded-3xl overflow-hidden border border-slate-200/90 shadow-xl bg-slate-900 transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen w-screen border-none' : className
      }`}
      style={{ height: isFullscreen ? '100vh' : height }}
    >
      {/* MAPA LEAFLET COM CAMADAS GOOGLE MAPS */}
      <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        zoomControl={false}
        className="w-full h-full z-0"
      >
        <TileLayer
          key={activeLayer}
          url={MAP_LAYERS[activeLayer].url}
          maxZoom={MAP_LAYERS[activeLayer].maxZoom}
          attribution='&copy; <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer">Google Maps</a>'
        />

        <MapController 
          center={mapCenter} 
          zoom={mapZoom} 
          flyTrigger={flyTrigger} 
        />

        {/* Linha da Rota Estilo Google Maps (Glow azul e núcleo vibrante) */}
        {computedRoute.length >= 2 && (
          <>
            {/* Sombra / Glow exterior */}
            <Polyline
              positions={computedRoute}
              color="#0284c7"
              weight={8}
              opacity={0.35}
              lineCap="round"
              lineJoin="round"
            />
            {/* Linha principal sólida Google Navigation */}
            <Polyline
              positions={computedRoute}
              color="#1a73e8"
              weight={5}
              opacity={0.95}
              lineCap="round"
              lineJoin="round"
            />
          </>
        )}

        {/* Marcador do Inspetor / GPS ao Vivo */}
        {enableLiveGps && originCoords && (
          <Marker 
            position={originCoords} 
            icon={createGpsLiveIcon(gpsHeading ?? undefined)}
          >
            <Popup className="modern-map-popup">
              <div className="p-2 space-y-1">
                <div className="flex items-center gap-1.5 text-blue-600 font-extrabold text-xs">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                  Sua Posição GPS
                </div>
                <p className="text-[11px] text-slate-600">
                  {gpsLocation ? 'Sinal GPS ativo em tempo real' : 'Localização base (Sede D&A)'}
                </p>
                {gpsAccuracy && (
                  <p className="text-[10px] text-slate-400 font-mono">
                    Precisão: ±{gpsAccuracy}m {gpsSpeed ? `• ${gpsSpeed} km/h` : ''}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Marcador da Sede D&A */}
        <Marker position={initialCenter} icon={createSedeIcon()}>
          <Popup className="modern-map-popup">
            <div className="p-2 space-y-1">
              <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">Base Operacional</span>
              <h4 className="font-extrabold text-xs text-slate-900 leading-tight">Sede D&A Inspeções</h4>
              <p className="text-[11px] text-slate-500">Ponto de partida e controle de frota</p>
            </div>
          </Popup>
        </Marker>

        {/* Marcadores dos Clientes / Demandas da Rota */}
        {points.map((pt) => {
          const isSelected = selectedPoint?.id === pt.id;
          return (
            <Marker
              key={pt.id}
              position={pt.coords}
              icon={createClientPinIcon(pt.status, isSelected)}
              eventHandlers={{
                click: () => {
                  setSelectedPoint(pt);
                  onSelectPoint?.(pt);
                }
              }}
            >
              <Popup className="modern-map-popup">
                <div className="p-2 space-y-2 max-w-[220px]">
                  <div>
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
                      {pt.orderCode || 'Demanda'}
                    </span>
                    <h4 className="font-extrabold text-sm text-slate-900 leading-tight mt-1">
                      {pt.name}
                    </h4>
                    {pt.address && (
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                        {pt.address}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                    <span className="font-bold text-slate-700">Status:</span>
                    <span className={`font-black ${
                      pt.status === 'Concluída' ? 'text-emerald-600' :
                      pt.status === 'Em Andamento' ? 'text-amber-600' : 'text-blue-600'
                    }`}>
                      {pt.status || 'Agendada'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => openGoogleMapsTurnByTurn(pt.address || pt.coords)}
                      className="py-1 px-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10px] flex items-center justify-center gap-1 shadow-sm"
                    >
                      <Navigation size={10} /> Maps
                    </button>
                    <button
                      type="button"
                      onClick={() => openWazeTurnByTurn(pt.address || pt.coords)}
                      className="py-1 px-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-[10px] flex items-center justify-center gap-1 shadow-sm"
                    >
                      <Compass size={10} /> Waze
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* TOP HEADER / BARRA DE CONTROLE MODERNA (Glassmorphism) */}
      {showHud && (
        <div className="absolute top-3 inset-x-3 z-10 flex items-center justify-between gap-2 pointer-events-none">
          {/* Card de Status do GPS e Rota */}
          <div className="bg-slate-950/80 backdrop-blur-md border border-white/15 px-3 py-2 rounded-2xl shadow-xl flex items-center gap-2.5 text-white pointer-events-auto">
            <div className="w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400 shrink-0">
              <Navigation size={15} className={gpsActive ? 'animate-pulse text-blue-400' : 'text-slate-400'} />
            </div>
            <div className="leading-tight">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${gpsActive ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-amber-400'}`}></span>
                <span className="text-xs font-black tracking-wide text-white">
                  {title}
                </span>
              </div>
              <p className="text-[10px] text-slate-300 font-medium">
                {gpsActive 
                  ? `GPS Ativo • Precisão ±${gpsAccuracy || 8}m ${gpsSpeed ? `• ${gpsSpeed} km/h` : ''}` 
                  : subtitle}
              </p>
            </div>
          </div>

          {/* Botões do Topo Direito (Alternar Camadas Google / Tela Cheia) */}
          <div className="flex items-center gap-1.5 pointer-events-auto">
            {showLayerToggle && (
              <div className="bg-slate-950/80 backdrop-blur-md border border-white/15 p-1 rounded-2xl shadow-xl flex items-center gap-1">
                {(['google-streets', 'google-hybrid', 'google-terrain'] as MapLayerType[]).map((type) => {
                  const isActive = activeLayer === type;
                  const label = type === 'google-streets' ? 'Ruas' : type === 'google-hybrid' ? 'Satélite' : 'Relevo';
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setActiveLayer(type)}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer ${
                        isActive 
                          ? 'bg-blue-600 text-white shadow-sm' 
                          : 'text-slate-300 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="w-9 h-9 rounded-2xl bg-slate-950/80 backdrop-blur-md border border-white/15 text-white flex items-center justify-center hover:bg-white/20 transition-all shadow-xl cursor-pointer"
              title={isFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia'}
            >
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
          </div>
        </div>
      )}

      {/* BOTÃO FLUTUANTE DE RECENTRALIZAR NO GPS (Estilo Google Maps) */}
      {enableLiveGps && (
        <button
          type="button"
          onClick={handleRecenterGps}
          className="absolute right-3 bottom-24 z-10 w-11 h-11 rounded-2xl bg-white text-slate-800 shadow-2xl border border-slate-200/80 hover:bg-slate-50 flex items-center justify-center transition-all cursor-pointer group active:scale-95"
          title="Minha Localização GPS"
        >
          <Compass size={18} className="text-blue-600 group-hover:rotate-45 transition-transform" />
        </button>
      )}

      {/* BOTTOM ACTION CARD: NAVEGADOR GPS DINÂMICO PARA O INSPETOR */}
      {selectedPoint && showNavigationControls && (
        <div className="absolute bottom-3 inset-x-3 z-10 animate-[slideUp_0.3s_ease-out]">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3.5 shadow-2xl border border-slate-200/90 text-slate-800 flex flex-col gap-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                  <MapPin size={18} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">
                      {selectedPoint.orderCode || 'Destino'}
                    </span>
                    {selectedDistanceKm !== null && (
                      <span className="text-[10px] font-extrabold bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded-full">
                        {selectedDistanceKm} km • {selectedEta}
                      </span>
                    )}
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-900 leading-tight truncate">
                    {selectedPoint.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 truncate">
                    {selectedPoint.address || 'Endereço registrado na ordem'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPoint(null)}
                className="text-slate-400 hover:text-slate-600 p-1 text-xs"
              >
                ✕
              </button>
            </div>

            {/* Ações de GPS: Abrir Google Maps, Waze ou Iniciar Inspeção */}
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={() => openGoogleMapsTurnByTurn(selectedPoint.address || selectedPoint.coords)}
                className="py-2.5 px-2 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <Navigation size={13} />
                <span>Google Maps</span>
              </button>

              <button
                type="button"
                onClick={() => openWazeTurnByTurn(selectedPoint.address || selectedPoint.coords)}
                className="py-2.5 px-2 rounded-xl bg-[#33ccff] hover:bg-[#20b8eb] text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <Compass size={13} />
                <span>Waze</span>
              </button>

              <button
                type="button"
                onClick={() => onStartInspection?.(selectedPoint)}
                className="py-2.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <Play size={12} />
                <span>Atender</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
