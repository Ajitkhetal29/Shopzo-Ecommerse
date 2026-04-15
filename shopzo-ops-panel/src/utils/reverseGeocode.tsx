export const reverseGeocode = async (lat: number, lng: number) => {
  // Using Nominatim (OpenStreetMap) - FREE, no API key required
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Shopzo-Ops-Panel' // Nominatim requires a User-Agent
      }
    });
    const data = await response.json();

    if (!data || data.error) {
      throw new Error(data.error || "Reverse geocoding failed");
    }

    const addr = data.address;
    
    return {
      formatted: data.display_name,
      state: addr.state || addr.region || "",
      city: addr.city || addr.town || addr.village || addr.suburb || "",
      pincode: addr.postcode || "",
      landmark: addr.road || addr.amenity || addr.building || "",
    };
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    throw error;
  }
};
