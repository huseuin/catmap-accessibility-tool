import React, { useEffect } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import axios from "axios";
import { processData } from "../services/dataProcessors"; 

// App.jsx'ten gelen props'ları tanımlıyoruz
function MapEvents({ onMapClick, setPointsData, setLoading, setStatusText }) { 
    const map = useMap();
    
    useMapEvents({
      click(e) {
        onMapClick(e.latlng); // Tıklama olayını App.jsx'e iletiyoruz
      }
    });

    // "Bu Alanda Ara" butonu 
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
            const newPoints = processData(res.data.elements); 
            setPointsData(newPoints); 
        } catch (err) {
            alert("Veri hatası oluştu.");
        } finally {
            setLoading(false);
        }
      };
    }, [map, setPointsData, setLoading, setStatusText]); 

    return null;
}

export default MapEvents;
