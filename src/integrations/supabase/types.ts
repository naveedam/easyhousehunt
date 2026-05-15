export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export interface Database {
  public: {
    Tables: {
      properties: {
        Row: {
          id: string;
          title: string;
          address: string;
          landlord_id: string;
          bhk: number;
          rent: number;
          deposit: number;
          area_sqft: number;
          furnishing: string;
          amenities: string[];
          description: string;
          latitude: number;
          longitude: number;
          media_urls: string[] | null;
          created_at: string;
          market: string;
          gender_preference: string | null;
          meals_included: boolean | null;
          bathroom_type: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          address: string;
          landlord_id: string;
          bhk: number;
          rent: number;
          deposit: number;
          area_sqft: number;
          furnishing: string;
          amenities?: string[];
          description?: string;
          market?: string;
          gender_preference?: string | null;
          meals_included?: boolean | null;
          bathroom_type?: string | null;
          latitude?: number;
          longitude?: number;
          media_urls?: string[] | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["properties"]["Insert"]>;
      };

      messages: {
        Row: {
          id: string;
          property_id: string;
          sender_id: string;
          receiver_id: string;
          message: string;
          created_at: string;
          market: string;
          gender_preference: string | null;
          meals_included: boolean | null;
          bathroom_type: string | null;
        };
        Insert: {
          id?: string;
          property_id: string;
          sender_id: string;
          receiver_id: string;
          message: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>;
      };
    };
  };
}