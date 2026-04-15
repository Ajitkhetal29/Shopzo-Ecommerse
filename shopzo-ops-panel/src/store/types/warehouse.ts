export type Warehouse = {
  _id: string;
  name: string;
  contactNumber: string;
  location: {
    lat: number;
    lng: number;
  };
  address: {
    formatted: string;
    city?: string;
    state?: string;
    pincode?: string;
    area?: string;
    country?: string;
    landmark?: string;
  };
  isActive: boolean;
};