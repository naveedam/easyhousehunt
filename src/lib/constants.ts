export const PROPERTY_TYPES = ['apartment', 'house', 'villa', 'pg', 'studio'] as const;
export const BHK_OPTIONS = [1, 2, 3, 4, 5] as const;
export const FURNISHING_OPTIONS = ['unfurnished', 'semi-furnished', 'fully-furnished'] as const;
export const AMENITIES_LIST = [
  'WiFi', 'AC', 'Parking', 'Gym', 'Swimming Pool', 'Power Backup',
  'Security', 'Lift', 'Gas Pipeline', 'Water Supply', 'Garden',
  'Clubhouse', 'Intercom', 'CCTV', 'Laundry'
] as const;

export const PROPERTY_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;
