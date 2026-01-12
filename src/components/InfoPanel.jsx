import React from 'react';
import { MAP_THEMES } from "../utils/constants"
import './InfoPanel.css';


function InfoPanel({ pointsData, routes, mode, setMode, limit, setLimit, categories, mapTileUrl, setMapTileUrl }) {
    
    // Tema değiştirme fonksiyonu
    const handleThemeChange = (event) => {
        const selectedUrl = event.target.value;
        setMapTileUrl(selectedUrl); // App.jsx'teki state'i günceller
    };

    // İstatistikler 
    const counts = { 'Okul': 0, 'Hastane': 0, 'Park': 0, 'İbadet': 0 };
    pointsData.forEach(p => { if(counts[p.cat] !== undefined) counts[p.cat]++ });

    return (
    
        <div className="info-panel">
            <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-lg text-gray-800">Yürüme Analizi</h3>
                <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded font-mono">{pointsData.length}</span>
            </div>

            {/* Mod Seçimi */}
            <div className="text-[10px] uppercase text-gray-400 font-bold mb-1">Analiz Modu</div>
            <div className="radio-group">
                {/* setMode'u kullanarak App.jsx'teki state'i güncelliyoruz */}
                <label><input type="radio" name="mode" checked={mode==='road'} onChange={()=>setMode('road')} /><span><i className="fa-solid fa-person-walking mr-1"></i>Yol Ağı</span></label>
                <label><input type="radio" name="mode" checked={mode==='air'} onChange={()=>setMode('air')} /><span><i className="fa-solid fa-plane mr-1"></i>Kuş Uçuşu</span></label>
            </div>

            {/* Mesafe Seçimi */}
            <div className="text-[10px] uppercase text-gray-400 font-bold mb-1">Mesafe Limiti</div>
            <div className="radio-group">
                {/* setLimit'i kullanarak App.jsx'teki state'i güncelliyoruz */}
                <label><input type="radio" name="dist" checked={limit===800} onChange={()=>setLimit(800)} /><span>10 dk (800m)</span></label>
                <label><input type="radio" name="dist" checked={limit===1200} onChange={()=>setLimit(1200)} /><span>15 dk (1200m)</span></label>
            </div>
<div className="text-[10px] uppercase text-gray-400 font-bold mb-1 mt-2">Harita Teması</div>
            <select 
                className="w-full p-2 border border-gray-300 rounded-lg text-sm mb-3"
                value={mapTileUrl} 
                onChange={handleThemeChange}
            >
                {MAP_THEMES.map((theme, index) => (
                    <option key={index} value={theme.url}>
                        {theme.name}
                    </option>
                ))}
            </select>

            {/* Lejant (CATEGORIES prop olarak geliyor) */}
            <div className="border-t pt-2 mb-2 bg-gray-50 p-2 rounded-lg">
                <div className="legend-item"><span className="dot bg-blue-600 border border-white"></span> Başlangıç</div>
                {Object.keys(counts).map(cat => (
                    <div key={cat} className="legend-item">
                        <span className="dot" style={{backgroundColor: categories[cat].color}}></span> {cat} 
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
    );
}

export default InfoPanel; 

