import { useMap } from "react-leaflet"; 
import React, { useEffect, useRef } from 'react';
import L from "leaflet"; 

function RouteRenderer({ routes, limit }) {
    const map = useMap();
    const layerRef = useRef(L.layerGroup());

    useEffect(() => {
        layerRef.current.addTo(map);
        return () => { layerRef.current.remove(); }
    }, [map]);

    useEffect(() => {
        layerRef.current.clearLayers(); 
        
        routes.forEach(r => {
            const ok = r.dist <= limit;
            const color = ok ? r.color : '#ef4444';
            
            L.polyline(r.geo, {
                color: color,
                weight: ok ? 4 : 2,
                opacity: ok ? 0.7 : 0.4,
                dashArray: (!ok || r.type !== 'road') ? '5,5' : null
            }).addTo(layerRef.current);

            const lastPoint = r.geo[r.geo.length - 1];

            if (lastPoint) {
                L.circleMarker(lastPoint, {
                    radius: 0,      // Görünmez nokta
                    opacity: 0,
                    fillOpacity: 0
                }).bindTooltip(`${Math.round(r.dist)}m`, { 
                    permanent: true, 
                    className: 'dist-tooltip', 
                    direction: 'top', // Yolun tam üstünde dursun
                    offset: [0, -5]   // Biraz daha yukarı kaydırmak için
                }).addTo(layerRef.current);
            }
        });

    }, [routes, limit]);

    return null;
}

export default RouteRenderer; 
