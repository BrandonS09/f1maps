export const decodePolyline = (t: string, e = 5) => {
    let points: { latitude: number; longitude: number }[] = [];
    let lat = 0,
      lon = 0;
    for (let step = 0; step < t.length; ) {
      let b,
        shift = 0,
        result = 0;
      do {
        b = t.charCodeAt(step++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += dlat;
  
      shift = result = 0;
      do {
        b = t.charCodeAt(step++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlng = result & 1 ? ~(result >> 1) : result >> 1;
      lon += dlng;
  
      points.push({ latitude: lat / 1e5, longitude: lon / 1e5 });
    }
    return points;
  };
  