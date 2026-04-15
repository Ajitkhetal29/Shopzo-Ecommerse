import axios from "axios";
import { Address } from "@/store/types/address";

export const getAddress = async ({ lat, lng }: { lat: number; lng: number }): Promise<Address | null> => {
  try {
    const response = await axios.get(`http://localhost:8000/api/reversegeocode/${lat}/${lng}`);
    const addressData = response.data.address;

    // Smart city extraction: prioritize actual city, fallback to district/suburb
    const city =
      addressData.city ||
      addressData.city_district ||
      addressData.suburb ||
      addressData.state_district ||
      "";

    // Area: neighbourhood or suburb for display only
    const area = addressData.neighbourhood || addressData.suburb || "";

    // Map Nominatim response to Address type
    const mappedAddress: Address = {
      formatted: response.data.display_name || "",
      state: addressData.state || "",
      city: city,
      pincode: addressData.postcode || "",
      area: area,
      country: addressData.country || "",
    };

    return mappedAddress;
  } catch (error) {
    console.error("Error fetching address:", error);
    return null;
  }
};
