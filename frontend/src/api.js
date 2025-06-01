export async function fetchHotspotSummary() {
    const response = await fetch('http://localhost:8000/explain-hotspot/');
    if (!response.ok) throw new Error('Failed to fetch hotspot summary');
    return await response.json();
} 