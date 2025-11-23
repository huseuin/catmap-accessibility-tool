import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer,Marker, Popup, Circle, ScaleControl, useMap, useMapEvents, LayerGroup } from "react-leaflet";
import L from "leaflet";
import axios from "axios";
import "./App.css";
import "leaflet/dist/leaflet.css";

// --- İKON DÜZELTMELERİ (Leaflet React'te bazen ikonları bulamaz) ---
import iconMarker from 'leaflet/dist/images/marker-icon.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetina,
  iconUrl: iconMarker,
  shadowUrl: iconShadow,
});

// --- SABİTLER ---
const CATEGORIES = {
  'Okul': { color: '#f97316', label: 'Okul' },
  'Hastane': { color: '#dc2626', label: 'Hastane' },
  'Park': { color: '#16a34a', label: 'Park' },
  'İbadet': { color: '#a855f7', label: 'İbadet' }
};

export default function App() {
  // --- STATE (DURUM) YÖNETİMİ ---
  const [pointsData, setPointsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [mode, setMode] = useState("road"); // road veya air
  const [limit, setLimit] = useState(800); // Mesafe limiti
  const [routes, setRoutes] = useState([]); // Hesaplanan rotalar
  const [selectedLoc, setSelectedLoc] = useState(null); // Tıklanan yer
  
  // İstatistikler
  const counts = { 'Okul': 0, 'Hastane': 0, 'Park': 0, 'İbadet': 0 };
  pointsData.forEach(p => { if(counts[p.cat] !== undefined) counts[p.cat]++ });

  // --- HARİTA OLAYLARI BİLEŞENİ ---
  const MapEvents = () => {
    const map = useMap();
    
    useMapEvents({
      click(e) {
        handleMapClick(e.latlng);
      }
    });

    // "Bu Alanda Ara" butonu için fonksiyonu dışarı açıyoruz
    useEffect(() => {
      window.fetchOSMData = async () => {
        setLoading(true);
        setStatusText("Veriler Çekiliyor...");
        const b = map.getBounds();
        
        const q = `[out:json][timeout:25];(
          nwr["amenity"~"school|hospital|clinic|place_of_worship"](${b.getSouth()},${b.getWest()},${b.getNorth()},${b.getEast()});
          nwr["leisure"="park"](${b.getSouth()},${b.getWest()},${b.getNorth()},${b.getEast()});
        );out center;`;

        try {
            const res = await axios.post('https://overpass-api.de/api/interpreter', q);
            processData(res.data.elements);
        } catch (err) {
            alert("Veri hatası oluştu.");
        } finally {
            setLoading(false);
        }
      };
    }, [map]);

    return null;
  };

  // --- VERİ İŞLEME ---
  const processData = (elements) => {
    const newPoints = [];
    elements.forEach(el => {
        const lat = el.lat || el.center?.lat;
        const lng = el.lon || el.center?.lon;
        if(!lat || !lng) return;

        let c = null, t = el.tags || {};
        if(t.amenity === 'school') c = 'Okul';
        else if(['hospital','clinic'].includes(t.amenity)) c = 'Hastane';
        else if(t.leisure === 'park') c = 'Park';
        else if(t.amenity === 'place_of_worship') c = 'İbadet';
        
        if(c) {
            newPoints.push({ lat, lng, cat: c, name: t.name || c, color: CATEGORIES[c].color, id: el.id });
        }
    });
    setPointsData(newPoints);
  };

  // --- ROTA HESAPLAMA ---
  const handleMapClick = async (latlng) => {
    if (pointsData.length === 0) {
        alert("Önce 'Bu Alanda Ara' butonuna basınız.");
        return;
    }

    setSelectedLoc(latlng);
    setRoutes([]); // Eskileri temizle
    setLoading(true);
    setStatusText("Hesaplanıyor...");

    const isRoad = mode === 'road';
    const searchR = isRoad ? limit * 2.5 : limit;

    // Mesafe hesabı (Kuş uçuşu ön eleme)
    const candidates = pointsData
        .map(p => ({ ...p, air: L.latLng(latlng).distanceTo([p.lat, p.lng]) }))
        .filter(p => p.air <= searchR)
        .sort((a,b) => a.air - b.air)
        .slice(0, 8);

    if (candidates.length === 0) {
        setLoading(false);
        return;
    }

    const newRoutes = [];

    if (!isRoad) {
        // Kuş Uçuşu
        candidates.forEach(p => {
            if(p.air <= limit) {
                newRoutes.push({ ...p, dist: p.air, type: 'air', geo: [[latlng.lat, latlng.lng], [p.lat, p.lng]] });
            }
        });
    } else {
        // OSRM Yol Ağı
        for (let i = 0; i < candidates.length; i++) {
            const pt = candidates[i];
            setStatusText(`Rota: ${i+1}/${candidates.length}`);
            try {
                const url = `https://router.project-osrm.org/route/v1/driving/${latlng.lng},${latlng.lat};${pt.lng},${pt.lat}?overview=full&geometries=geojson`;
                const res = await axios.get(url);
                if (res.data.routes.length) {
                    const r = res.data.routes[0];
                    // GeoJSON koordinatlarını Leaflet formatına çevir (lng,lat -> lat,lng)
                    const geo = r.geometry.coordinates.map(c => [c[1], c[0]]);
                    newRoutes.push({ ...pt, dist: r.distance, geo: geo, type: 'road' });
                }
            } catch (err) {
                console.log("Rota hatası", err);
            }
            // OSRM'i bombalamamak için küçük gecikme
            await new Promise(r => setTimeout(r, 100));
        }
    }
    
    newRoutes.sort((a,b) => a.dist - b.dist);
    setRoutes(newRoutes);
    setLoading(false);
  };

  // --- KEDİ ANİMASYONU ---
  // React içinde DOM manipülasyonu yerine bu işi useEffect ile yapıyoruz
  useEffect(() => {
    if(routes.length > 0) {
        // Kedileri buraya React dışında manuel ekleyebiliriz veya React state ile yönetebiliriz.
        // Şimdilik basitlik adına sadece rotaları çiziyoruz.
        // Kedi animasyonu React'te biraz daha karmaşık, önce sistemi çalıştıralım :)
    }
  }, [routes]);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      
      {/* Üst Buton */}
      <div className="absolute top-5 right-20 z-[1000]">
        <button 
            onClick={() => window.fetchOSMData && window.fetchOSMData()}
            className="bg-white px-5 py-2 rounded-full shadow-lg font-semibold text-gray-700 hover:scale-105 transition flex items-center">
            <i className="fa-solid fa-magnifying-glass mr-2"></i> Bu Alanda Ara
        </button>
      </div>

      {/* Yükleniyor Ekranı */}
      {loading && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[2000] bg-violet-600/90 text-white px-6 py-3 rounded-full flex items-center gap-3 shadow-xl">
           <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
           <span>{statusText}</span>
        </div>
      )}

      {/* Sol Panel */}
      <div className="info-panel">
        <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-lg text-gray-800">Yürüme Analizi</h3>
            <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded font-mono">{pointsData.length}</span>
        </div>

        {/* Mod Seçimi */}
        <div className="text-[10px] uppercase text-gray-400 font-bold mb-1">Analiz Modu</div>
        <div className="radio-group">
            <label><input type="radio" name="mode" checked={mode==='road'} onChange={()=>setMode('road')} /><span><i className="fa-solid fa-person-walking mr-1"></i>Yol Ağı</span></label>
            <label><input type="radio" name="mode" checked={mode==='air'} onChange={()=>setMode('air')} /><span><i className="fa-solid fa-plane mr-1"></i>Kuş Uçuşu</span></label>
        </div>

        {/* Mesafe Seçimi */}
        <div className="text-[10px] uppercase text-gray-400 font-bold mb-1">Mesafe Limiti</div>
        <div className="radio-group">
            <label><input type="radio" name="dist" checked={limit===800} onChange={()=>setLimit(800)} /><span>10 dk (800m)</span></label>
            <label><input type="radio" name="dist" checked={limit===1200} onChange={()=>setLimit(1200)} /><span>15 dk (1200m)</span></label>
        </div>

        {/* Lejant */}
        <div className="border-t pt-2 mb-2 bg-gray-50 p-2 rounded-lg">
            <div className="legend-item"><span className="dot bg-blue-600 border border-white"></span> Başlangıç</div>
            {Object.keys(counts).map(cat => (
                <div key={cat} className="legend-item">
                    <span className="dot" style={{backgroundColor: CATEGORIES[cat].color}}></span> {cat} 
                    <span className="badge">{counts[cat]}</span>
                </div>
            ))}
        </div>

        {/* Sonuçlar Listesi */}
        {routes.length > 0 && (
            <div className="mt-2 text-sm border-t pt-2">
                <strong className='text-gray-700 block mb-2'>Analiz Sonucu ({routes.length}):</strong>
                {routes.map((r, i) => {
                    const ok = r.dist <= limit;
                    return (
                        <div key={i} className="flex justify-between items-center mb-1 pb-1 border-b border-gray-50 text-xs">
                            <div className="truncate w-32"><span style={{color: r.color}}>●</span> {r.name}</div>
                            <div className="text-right">
                                <div className={`font-bold ${ok ? 'text-green-600' : 'text-red-500'}`}>{Math.round(r.dist)}m</div>
                                <div className="text-[10px] text-gray-400">{ok ? 'Yürünür' : 'Limit Dışı'}</div>
                            </div>
                        </div>
                    )
                })}
            </div>
        )}
      </div>

      {/* HARİTA */}
      <MapContainer center={[36.758, 34.555]} zoom={14} scrollWheelZoom={true} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        {/* -- CETVEL BURAYA -- */}
        <ScaleControl position="bottomright" metric={true} imperial={false} />
        {/* Olayları Dinleyen Bileşen */}
        <MapEvents />

        {/* Bulunan Noktalar (Okul, Park vs) */}
        {pointsData.map((p, i) => (
            <Marker 
                key={i} 
                position={[p.lat, p.lng]} 
                icon={L.divIcon({
                    className: 'custom-div-icon',
                    html: `<div style="background-color:${p.color}; width:10px; height:10px; border-radius:50%; border:1px solid white;"></div>`,
                    iconSize: [10,10]
                })}>
                <Popup>{p.name} <br/> {p.cat}</Popup>
            </Marker>
        ))}

        {/* Tıklanan Merkez Nokta */}
        {selectedLoc && (
          <>
      <Circle 
        center={selectedLoc} 
        radius={limit} 
        pathOptions={{ 
            color: mode === 'road' ? '#9ca3af' : '#3b82f6', 
            fillOpacity: 0.1, 
            dashArray: mode === 'road' ? '10,10' : null 
        }} 
      />
             <Marker position={selectedLoc} icon={L.divIcon({
                className: 'center-icon',
                html: `<div style="background-color:#2563eb; width:16px; height:16px; border-radius:50%; border:3px solid white; box-shadow:0 0 5px rgba(0,0,0,0.3)"></div>`,
                iconSize: [16,16]
             })} />
             </>
        )}

        {/* Rota Çizgileri (Polyline) */}
        {routes.map((r, i) => {
            const ok = r.dist <= limit;
            return (
               <React.Fragment key={i}>
                    {/* Leaflet Polyline */}
                    <LayerGroup>
                        {/* React Leaflet'te Polyline çizmek için import {Polyline} from 'react-leaflet' eklemeyi unutma. 
                            Ama burada native L.geoJSON yerine React bileşeni kullanıyoruz. 
                            Basitlik için L.polyline mantığını React-Leaflet Polyline'a çeviriyorum: */}
                         {/* Not: Polyline importu yukarıda eksikti, en tepeye ekleyebilirsin veya aşağıda dinamik yapalım. */}
                    </LayerGroup>
               </React.Fragment>
            )
        })}
        
        {/* Rotaları çizmek için en temizi map nesnesine erişip native Leaflet kullanmak (React içinde karmaşık geometriler için daha performanslı) */}
        <RouteRenderer routes={routes} limit={limit} />
{/* KEDİ ANİMASYONU (Yeni Eklendi) */}
        {routes.filter(r => r.dist <= limit).map((r, i) => (
             <CatAnimator key={i} route={r} mode={mode} />
        ))}
        {/* Sadece menzil içindeki rotalara kedi ekliyoruz */}

      </MapContainer>
    </div>
  );
}

// Rotaları Çizen Özel Alt Bileşen
function RouteRenderer({ routes, limit }) {
    const map = useMap();
    const layerRef = useRef(L.layerGroup());

    useEffect(() => {
        layerRef.current.addTo(map);
        return () => { layerRef.current.remove(); } // Temizlik
    }, [map]);

    useEffect(() => {
        layerRef.current.clearLayers(); // Eskileri sil
        
        routes.forEach(r => {
            const ok = r.dist <= limit;
            const color = ok ? r.color : '#ef4444';
            
            // Çizgi
            L.polyline(r.geo, {
                color: color,
                weight: ok ? 4 : 2,
                opacity: ok ? 0.7 : 0.4,
                dashArray: (!ok || r.type !== 'road') ? '5,5' : null
            }).bindTooltip(`${Math.round(r.dist)}m`, { 
                permanent: true, 
                className: 'dist-tooltip', 
                direction: 'center' 
            }).addTo(layerRef.current);

            // KEDİ ANİMASYONU (Basitleştirilmiş)
            if(ok) {
            
            }
        });

    }, [routes, limit]);

    return null;
}
// --- CatAnimator Fonksiyonunun Yeni Versiyonu ---
function CatAnimator({ route, mode }) {
    const map = useMap();
    const markerRef = useRef(null);
    const start = useRef(performance.now());
    const animationFrameId = useRef(null);

    useEffect(() => {
        if (!route.geo || route.geo.length < 2) return;

        const latlngs = route.geo; // [[lat, lng], [lat, lng], ...]
        const color = route.color;
        const dist = route.dist;
        const id = 'c' + Math.random().toString(36).substr(2, 5);

        // Kedi İkonu
        const icon = L.divIcon({
            className: 'cat-runner', iconSize: [30, 30], iconAnchor: [15, 28],
            html: `<div id="${id}"><i class="fa-solid fa-cat cat-bounce" style="color:${color};font-size:24px;filter:drop-shadow(0 0 1px white)"></i></div>`
        });

        const marker = L.marker(latlngs[0], { icon, zIndexOffset: 1000 }).addTo(map);
        markerRef.current = marker;
        
        const moveTime = Math.max(3000, dist * (mode === 'road' ? 20 : 12));
        const waitTime = 1500; // 1.5 saniye bekleme süresi
        const totalDuration = moveTime + waitTime;

        function frame(now) {
            if (!map.hasLayer(marker)) return;

            const elapsed = now - start.current;
            const cycleTime = elapsed % totalDuration;

            if (cycleTime < moveTime) {
                // --- HAREKET FAZI ---
                const p = Math.min(Math.max(cycleTime / moveTime, 0), 1);
                
                // Opaklık (Görünmezlik): Eğer hareket fazının başıysa (0-50ms), marker'ı sıfırla
                if(p * moveTime < 50) { // Yeni hareket başlamadan önce tamamen görünmez ve başta olmalı
                     marker.setOpacity(0);
                     marker.setLatLng(latlngs[0]);
                } else {
                     marker.setOpacity(1);
                }

                const total = latlngs.length - 1;
                const idx = Math.floor(p * total);
                const next = Math.min(idx + 1, total);
                const c1 = latlngs[idx]; 
                const c2 = latlngs[next]; 

                if (c1 && c2) {
                    const r = (p * total) - idx;
                    const lat = c1[0] + (c2[0] - c1[0]) * r;
                    const lng = c1[1] + (c2[1] - c1[1]) * r;
                    
                    marker.setLatLng([lat, lng]);

                    const el = document.getElementById(id);
                    if (el) el.style.transform = `scaleX(${c2[1] > c1[1] ? -1 : 1})`;
                }

            } else {
                // --- BEKLEME FAZI (GÖRÜNMEZ IŞINLANMA) ---
                const timeInWait = cycleTime - moveTime;
                const fadeDuration = 500;
                
                // Marker'ı yolun sonunda tut
                marker.setLatLng(latlngs[latlngs.length - 1]);
                
                if (timeInWait > (waitTime - fadeDuration)) {
                    // Son 500ms'te fade out yap (Görünmezlik)
                    marker.setOpacity(0);
                } else {
                    // Beklemenin ilk aşaması (Görünür kal)
                    marker.setOpacity(1); 
                }
            }

            animationFrameId.current = requestAnimationFrame(frame);
        }

        animationFrameId.current = requestAnimationFrame(frame);

        // Temizlik
        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
            if (markerRef.current) {
                map.removeLayer(markerRef.current);
            }
        };
    }, [route, mode, map]); 

    return null;
}



