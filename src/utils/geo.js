/**
 * Fetches routing geometry between two points using OSRM.
 * Returns an array of [lat, lng] coordinates.
 */
export async function getRoute(startLat, startLng, endLat, endLng) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.code !== 'Ok') {
      console.warn("OSRM Routing failed:", data.code);
      return [[startLat, startLng], [endLat, endLng]]; // Fallback to straight line
    }

    // OSRM returns [lng, lat], we need [lat, lng] for Leaflet
    const coordinates = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
    return coordinates;
  } catch (err) {
    console.error("Error fetching route:", err);
    return [[startLat, startLng], [endLat, endLng]];
  }
}
