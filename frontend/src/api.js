const API_URL = 'https://geospacial-crime-backend.onrender.com';
const MODEL_URL = 'https://geospacial-model-backend.onrender.com';
// const API_URL = 'http://127.0.0.1:8000';
// const MODEL_URL = 'http://127.0.0.1:10000';

// export async function pingBackend() {
//     try {
//         const response = await fetch(`${BASE_URL}/`);
//         return response.ok;
//     } catch (error) {
//         console.warn('Failed to ping backend:', error);
//         return false;
//     }
// }

export async function fetchHotspotSummary() {
    const response = await fetch(`${MODEL_URL}/explain-hotspot/`);
    if (!response.ok) throw new Error('Failed to fetch hotspot summary');
    return await response.json();
}

// NOTE: This is a hack. There is no dedicated endpoint for all regions. This fetches all regions for June 2023.
export async function fetchAllRegions() {
    const response = await fetch(`${API_URL}/crime/2023/6`);
    if (!response.ok) throw new Error('Failed to fetch regions');
    return Object.keys((await response.json()).data);
}

export async function fetchRegionMetadata(ward_code) {
    const response = await fetch(`${API_URL}/ward/metadata/${encodeURIComponent(ward_code)}`);
    if (!response.ok) throw new Error('Failed to fetch region metadata');
    return await response.json();
}

export async function fetchMonthlyCrime(year, ward_code) {
    const response = await fetch(`${API_URL}/crime-location/${year}/${encodeURIComponent(ward_code)}`);
    if (!response.ok) throw new Error('Failed to fetch monthly crime');
    return (await response.json()).data;
}

export async function fetchMonthlySentiment(year, ward_code) {
    const response = await fetch(`${API_URL}/sentiment-location/${year}/${encodeURIComponent(ward_code)}`);
    if (!response.ok) throw new Error('Failed to fetch monthly sentiment');
    return (await response.json()).data;
}

export async function fetchWeeklyCrime(year, month, ward_code) {
    const response = await fetch(`${API_URL}/crime/${year}/${month}/${encodeURIComponent(ward_code)}/weekly`);
    if (!response.ok) throw new Error('Failed to fetch weekly crime');
    return (await response.json()).data;
}

export async function fetchWeeklySentiment(year, month, ward_code) {
    const response = await fetch(`${API_URL}/sentiment/${year}/${month}/${encodeURIComponent(ward_code)}/weekly`);
    if (!response.ok) throw new Error('Failed to fetch weekly sentiment');
    return (await response.json()).data;
}

export async function fetchCrimeRank(year, month, ward_code) {
    const response = await fetch(`${API_URL}/rank/crime/${year}/${month}/${encodeURIComponent(ward_code)}`);
    if (!response.ok) throw new Error('Failed to fetch crime rank');
    return await response.json();
}

export async function fetchSentimentRank(year, month, ward_code) {
    const response = await fetch(`${API_URL}/rank/sentiment/${year}/${month}/${encodeURIComponent(ward_code)}`);
    if (!response.ok) throw new Error('Failed to fetch sentiment rank');
    return await response.json();
}

export async function fetchCrimeTotals(year, month) {
    const response = await fetch(`${API_URL}/crime/${year}/${month}`);
    if (!response.ok) throw new Error('Failed to fetch crime totals');
    return (await response.json()).data;
}

export async function fetchSentimentTotals(year, month) {
    const response = await fetch(`${API_URL}/sentiment/${year}/${month}`);
    if (!response.ok) throw new Error('Failed to fetch sentiment totals');
    return (await response.json()).data;
}

export async function fetchCrimeTotal(year, month, ward_code) {
    const response = await fetch(`${API_URL}/crime/${year}/${month}/${encodeURIComponent(ward_code)}`);
    if (!response.ok) throw new Error('Failed to fetch crime total');
    return await response.json();
}

export async function fetchSentimentTotal(year, month, ward_code) {
    const response = await fetch(`${API_URL}/sentiment/${year}/${month}/${encodeURIComponent(ward_code)}`);
    if (!response.ok) throw new Error('Failed to fetch sentiment total');
    return await response.json();
}

export async function fetchCrimeReasons(year, month, ward_code) {
    const response = await fetch(`${API_URL}/crime-reasons/${year}/${month}/${encodeURIComponent(ward_code)}`);
    if (!response.ok) throw new Error('Failed to fetch crime reasons');
    return await response.json();
}

export async function fetchWardMappings() {
    const response = await fetch(`${API_URL}/wards`);
    if (!response.ok) throw new Error('Failed to fetch ward mappings');
    return await response.json();
}

export async function fetchWardLatLon(ward_code) {
    const response = await fetch(`${API_URL}/ward/latlon/${encodeURIComponent(ward_code)}`);
    if (!response.ok) throw new Error('Failed to fetch ward lat/lon');
    return await response.json();
} 