export const CATEGORIES = { // ✨ Export ekliyoruz
  'Okul': { color: '#f97316', label: 'Okul' },
  'Hastane': { color: '#dc2626', label: 'Hastane' },
  'Park': { color: '#16a34a', label: 'Park' },
  'İbadet': { color: '#a855f7', label: 'İbadet' }
};
export const MAP_THEMES = [
    { 
        name: "Açık Tema (Varsayılan)", 
        url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" 
    },
    { 
        name: "Karanlık Tema", 
        url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" 
    },
    { 
        name: "Sokak Haritası (OSM)", 
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
    },
];