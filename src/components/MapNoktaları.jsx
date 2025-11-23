import React from 'react';
import { Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet"; 

function MapMarkers({ pointsData, selectedLoc, limit, mode }) {
    
    return (
        <>
            {/* Bulunan Noktalar (Okul, Park vs) - Kestiğin ilk blok */}
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

            {/* Tıklanan Merkez Nokta ve Dairesi - Kestiğin ikinci blok */}
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
        </>
    );
}

export default MapMarkers; 
