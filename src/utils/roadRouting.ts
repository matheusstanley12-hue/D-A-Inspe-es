// Serviço de Roteamento Rodoviário e Urbano Real (Curvas e Vias reais - Estilo Google Maps)
// Utiliza o motor OSRM com cache inteligente em memória e fallback seguro offline

const routeCache = new Map<string, { coords: [number, number][]; distanceKm: number; durationMin: number }>();

/**
 * Calcula a distância em KM entre dois pontos de coordenadas (Haversine)
 */
export function calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Raio da Terra em km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

/**
 * Busca a geometria real do trajeto que segue ruas, avenidas e rodovias reais
 * @param waypoints Array de coordenadas [latitude, longitude]
 */
export async function fetchRoadRoute(
  waypoints: [number, number][]
): Promise<{ coords: [number, number][]; distanceKm: number; durationMin: number }> {
  if (!waypoints || waypoints.length < 2) {
    return { coords: waypoints || [], distanceKm: 0, durationMin: 0 };
  }

  // Chave de cache baseada nas coordenadas com 4 casas decimais (~11 metros de precisão)
  const cacheKey = waypoints.map(pt => `${pt[0].toFixed(4)},${pt[1].toFixed(4)}`).join(';');
  const cached = routeCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // OSRM espera formato longitude,latitude separados por ponto-e-vírgula
    const coordinatesQuery = waypoints.map(pt => `${pt[1]},${pt[0]}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coordinatesQuery}?overview=full&geometries=geojson`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        // OSRM retorna geojson [longitude, latitude]. Inverte para Leaflet [latitude, longitude]
        const roadCoords: [number, number][] = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
        const distanceKm = Math.round((route.distance / 1000) * 10) / 10;
        const durationMin = Math.round(route.duration / 60);

        const result = { coords: roadCoords, distanceKm, durationMin };
        routeCache.set(cacheKey, result);
        return result;
      }
    }
  } catch (err) {
    console.warn('Roteador rodoviário offline ou demorou. Utilizando interpolação suave.', err);
  }

  // Fallback: cálculo Haversine ponto a ponto se serviço de rota estiver inacessível
  let totalKm = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    totalKm += calculateHaversineKm(waypoints[i][0], waypoints[i][1], waypoints[i + 1][0], waypoints[i + 1][1]);
  }

  const fallbackResult = {
    coords: waypoints,
    distanceKm: Math.round(totalKm * 10) / 10,
    durationMin: Math.round((totalKm / 40) * 60)
  };
  return fallbackResult;
}
