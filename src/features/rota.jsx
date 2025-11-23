// Gerekli import'lar: useMap, useRef, useEffect ve L (Leaflet)
import { useMap } from "react-leaflet"; 
import React, { useEffect, useRef } from 'react';
import L from "leaflet"; 

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
        });

    }, [routes, limit]);

    return null;
}

export default RouteRenderer; 
