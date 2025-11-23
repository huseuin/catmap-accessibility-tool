import { CATEGORIES } from "../utils/constants"; 

export const processData = (elements) => { 
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
    return newPoints; 
};