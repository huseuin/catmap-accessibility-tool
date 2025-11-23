import { useMap } from "react-leaflet";
import React, { useEffect, useRef } from "react";
import L from "leaflet"; 
import './MapFeatures.css';

function CatAnimator({ route, mode }) {
    const map = useMap();
    const markerRef = useRef(null);
    const start = useRef(performance.now());
    const animationFrameId = useRef(null);

    useEffect(() => {
        if (!route.geo || route.geo.length < 2) return;

        const latlngs = route.geo; 
        const color = route.color;
        const dist = route.dist;
        const id = 'c' + Math.random().toString(36).substr(2, 5);

        const icon = L.divIcon({
            className: 'cat-runner', iconSize: [30, 30], iconAnchor: [15, 28],
            html: `<div id="${id}"><i class="fa-solid fa-cat cat-bounce" style="color:${color};font-size:24px;filter:drop-shadow(0 0 1px white)"></i></div>`
        });

        const marker = L.marker(latlngs[0], { icon, zIndexOffset: 1000 }).addTo(map);
        markerRef.current = marker;
        
        const moveTime = Math.max(3000, dist * (mode === 'road' ? 20 : 12));
        const waitTime = 1500; 
        const totalDuration = moveTime + waitTime;

        function frame(now) {
            if (!map.hasLayer(marker)) return;

            const elapsed = now - start.current;
            const cycleTime = elapsed % totalDuration;

            if (cycleTime < moveTime) {
                const p = Math.min(Math.max(cycleTime / moveTime, 0), 1);
                
                if(p * moveTime < 50) { 
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
                const timeInWait = cycleTime - moveTime;
                const fadeDuration = 500;
                
                marker.setLatLng(latlngs[latlngs.length - 1]);
                
                if (timeInWait > (waitTime - fadeDuration)) {
                    marker.setOpacity(0);
                } else {
                    marker.setOpacity(1); 
                }
            }

            animationFrameId.current = requestAnimationFrame(frame);
        }

        animationFrameId.current = requestAnimationFrame(frame);

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

export default CatAnimator;
