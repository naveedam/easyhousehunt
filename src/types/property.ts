export type Property = {
  id: string;
  title: string;
  rent: number;
  bhk?: number | null;
  address?: string;
  latitude: number | null;
  longitude: number | null;
  deposit?: number | null;
  furnishing?: string | null;
  area_sqft?: number | null;
  description?: string | null;
  amenities?: string[];
  media_urls?: string[];
  image_url?: string | null;
};
