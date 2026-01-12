import React, { useState } from "react";
import { MapContainer, TileLayer, ScaleControl } from "react-leaflet";
import L from "leaflet";
import axios from "axios";
import "./App.css";
import "leaflet/dist/leaflet.css";

import { CATEGORIES, MAP_THEMES } from "./utils/constants";
import { fixLeafletIcons } from "./utils/leafletUtils";
import MapEvents from "./components/MapEvents"; 
import InfoPanel from "./components/InfoPanel"; 
import MapMarkers from "./components/MapNoktaları"; 
import RouteRenderer from "./features/rota"; 
import CatAnimator from "./features/cat";

function SignatureControl({ limit }) {
  const map = useMap();

  useEffect(() => {
    // Sol alt köşeye bir kontrol 
    const info = L.control({ position: "bottomleft" });

    info.onAdd = function () {
      const div = L.DomUtil.create("div", "custom-signature-panel");
      div.innerHTML = `
        <div class="limit-indicator">Mesafe Sınırı: <b>${limit} m</b></div>
        <div class="signature-text">Developed by <b>Hüseyin</b></div>
      `;
      return div;
    };

    info.addTo(map);
    return () => info.remove(); 
  }, [map, limit]);

  return null;
}

fixLeafletIcons(); 
const DEFAULT_TILE_URL = MAP_THEMES[0].url;
export default function App() {
  
  const [pointsData, setPointsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [mode, setMode] = useState("road"); 
  const [limit, setLimit] = useState(800); 
  const [routes, setRoutes] = useState([]); 
  const [selectedLoc, setSelectedLoc] = useState(null); 
const [mapTileUrl, setMapTileUrl] = useState(DEFAULT_TILE_URL);
  const handleMapClick = async (latlng) => {
    if (pointsData.length === 0) {
        alert("Önce 'Bu Alanda Ara' butonuna basınız.");
        return;
    }

    setSelectedLoc(latlng);
    setRoutes([]); 
    setLoading(true);
    setStatusText("Hesaplanıyor...");

    const isRoad = mode === 'road';
    const searchR = limit;

    const candidates = pointsData
        .map(p => ({ ...p, air: L.latLng(latlng).distanceTo([p.lat, p.lng]) }))
        .filter(p => p.air <= searchR)
        .sort((a,b) => a.air - b.air);

    if (candidates.length === 0) {
        setLoading(false);
        return;
    }

    const newRoutes = [];

    if (!isRoad) {
        candidates.forEach(p => {
            if(p.air <= limit) {
                newRoutes.push({ ...p, dist: p.air, type: 'air', geo: [[latlng.lat, latlng.lng], [p.lat, p.lng]] });
            }
        });
    } else {
        for (let i = 0; i < candidates.length; i++) {
            const pt = candidates[i];
            setStatusText(`Rota: ${i+1}/${candidates.length}`);
            try {
                const url = `https://router.project-osrm.org/route/v1/driving/${latlng.lng},${latlng.lat};${pt.lng},${pt.lat}?overview=full&geometries=geojson`;
                const res = await axios.get(url);
                if (res.data.routes.length) {
                    const r = res.data.routes[0];
                    const geo = r.geometry.coordinates.map(c => [c[1], c[0]]);
                    newRoutes.push({ ...pt, dist: r.distance, geo: geo, type: 'road' });
                }
            } catch (err) {
                console.log("Rota hatası", err);
            }
            await new Promise(r => setTimeout(r, 10));
        }
    }
    
    newRoutes.sort((a,b) => a.dist - b.dist);
    setRoutes(newRoutes);
    setLoading(false);
  };
  
  return (
    <div className="relative w-full h-screen overflow-hidden">
        
        <div className="absolute top-5 right-20 z-[1000]">
            <button 
                onClick={() => window.fetchOSMData && window.fetchOSMData()}
                className="bg-white px-5 py-2 rounded-full shadow-lg font-semibold text-gray-700 hover:scale-105 transition flex items-center">
                <i className="fa-solid fa-magnifying-glass mr-2"></i> Bu Alanda Ara
            </button>
        </div>

        {loading && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[2000] bg-violet-600/90 text-white px-6 py-3 rounded-full flex items-center gap-3 shadow-xl">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span>{statusText}</span>
            </div>
        )}

        <InfoPanel 
            pointsData={pointsData} 
            routes={routes} 
            mode={mode} 
            setMode={setMode} 
            limit={limit} 
            setLimit={setLimit} 
            categories={CATEGORIES} 
        />

        <MapContainer center={[36.758, 34.555]} zoom={14} scrollWheelZoom={true} className="h-full w-full">
   <TileLayer
    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> |  by <a href="https://www.linkedin.com/in/huseyinnmutlu/" target="_blank">Hüseyin Mutlu</a>'
    key={mapTileUrl} 
    url={mapTileUrl} 
/>
    
    <ScaleControl position="bottomright" metric={true} imperial={false} />
            
            <ScaleControl position="bottomright" metric={true} imperial={false} />
            
            <MapEvents 
                onMapClick={handleMapClick} 
                setPointsData={setPointsData} 
                setLoading={setLoading}
                setStatusText={setStatusText}
            />

            <MapMarkers pointsData={pointsData} selectedLoc={selectedLoc} limit={limit} mode={mode} />

            <RouteRenderer routes={routes} limit={limit} />

            {routes.filter(r => r.dist <= limit).map((r, i) => (
                <CatAnimator key={i} route={r} mode={mode} />
            ))}
        </MapContainer>
    </div>
  );
}
