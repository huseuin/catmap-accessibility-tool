import L from "leaflet";
import iconMarker from 'leaflet/dist/images/marker-icon.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;

// Bu fonksiyonu App.jsx'te çağırabilmek için export ediyoruz
export const fixLeafletIcons = () => { 
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: iconRetina,
      iconUrl: iconMarker,
      shadowUrl: iconShadow,
    });
};

