export async function fetchHotspotSummary() {
    const response = await fetch('https://geospacial-crime-backend.onrender.com/explain-hotspot/');
    if (!response.ok) throw new Error('Failed to fetch hotspot summary');
    return await response.json();
} 