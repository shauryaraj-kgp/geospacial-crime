import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import '../styles/HomePage.css';
import mapData from '../data/scores.json'
import { useState } from 'react';

// Optional: Fix for default marker icon issue in Leaflet + React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

function HomePage() {

    const [scoreType, setScoreType] = useState('crimeScore');

    const redIcon = new L.Icon({
        iconUrl: require('../assets/marker-icon-red.png'), // custom red marker
        shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    const greenIcon = new L.Icon({
        iconUrl: require('../assets/marker-icon-green.png'), // custom green marker
        shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });


    return (
        <div className="Map">

            <div className="score-toggle">
                <div className="header">
                    <p>Scores</p>
                </div>
                <button
                    className={scoreType === 'crimeScore' ? 'red' : ''}
                    onClick={() => setScoreType('crimeScore')}
                >
                    Crime Scores
                </button>
                <button
                    className={scoreType === 'sentimentScore' ? 'green' : ''}
                    onClick={() => setScoreType('sentimentScore')}
                >
                    Sentiment Scores
                </button>
            </div>

            <MapContainer
                center={[56.4907, -4.2026]}
                zoom={6}
                style={{ height: "100vh", width: "100%" }}
                minZoom={3}
            >
                <TileLayer
                    attribution='&copy; OpenStreetMap'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {mapData.map((city, index) => (
                    <Marker
                        key={index}
                        position={[city.lat, city.lng]}
                        icon={scoreType === 'crimeScore' ? redIcon : greenIcon}
                    >

                        {/* <Tooltip
                            direction="top"
                            offset={[0, -10]}
                            opacity={1}
                            sticky
                        >
                            <b>{city.name}</b><br />
                            {scoreType === 'crimeScore'
                                ? `Crime Score: ${city.crimeScore}`
                                : `Sentiment Score: ${city.sentimentScore}`}
                        </Tooltip> */}

                        <Popup>
                            <b>{city.name}</b><br />
                            {scoreType === 'crimeScore'
                                ? `Crime Score: ${city.crimeScore}`
                                : `Sentiment Score: ${city.sentimentScore}`}
                        </Popup>

                    </Marker>
                ))}

            </MapContainer>
        </div>
    );
}

export default HomePage;
