export interface User {
  id: string;
  clerk_id: string;
  full_name: string;
  email: string;
  phone_number: string;
  bio?: string | null;
  profile_image_url?: string | null;
  role: "admin" | "community_member";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmergencyRequest {
  id: string;
  user_id: string;
  title: string;
  description: string;
  type: "medical" | "food" | "rescue" | "shelter";
  status: "pending" | "approved" | "rejected" | "closed";
  location_name: string;
  latitude?: number;
  longitude?: number;
  media_urls?: string[];
  created_at: string;
  updated_at: string;
}

export interface Offer {
  id: string;
  request_id: string;
  responder_name: string;
  responder_contact: string;
  offer_type: "transport" | "donation" | "expertise";
  status: "pending" | "accepted" | "fulfilled";
  latitude?: number;
  longitude?: number;
  // expertise
  expertise_details?: string;
  // transport
  vehicle_type?: string;
  // donation
  donation_amount?: number;
  payment_method?: "mobile_money" | "visa";
  mobile_money_provider?: string;
  mobile_money_masked?: string;
  card_last4?: string;
  card_expiry_month?: number;
  card_expiry_year?: number;
  cardholder_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Donation {
  id: string;
  request_id: string;
  donor_name: string;
  amount: number;
  date: string;
}

export interface RegisterUserInput {
  clerk_id: string;
  full_name: string;
  email: string;
  phone_number: string;
  role?: "community_member" | "admin";
  profile_image_url?: string | null;
}

export interface UpdateUserInput {
  full_name?: string;
  phone_number?: string;
  bio?: string;
}

export interface UpdateRequestInput {
  title?: string;
  description?: string;
  type?: "medical" | "food" | "rescue" | "shelter";
  status?: "pending" | "approved" | "rejected" | "closed";
  location_name?: string;
  latitude?: number;
  longitude?: number;
}

export interface CreateRequestInput {
  title: string;
  description: string;
  type: "medical" | "food" | "rescue" | "shelter";
  location_name: string;
  latitude?: number | string;
  longitude?: number | string;
  media?: File[];
}

export interface CreateOfferInput {
  request_id: string;
  responder_name: string;
  responder_contact: string;
  offer_type: "transport" | "donation" | "expertise";
  latitude?: number;
  longitude?: number;
  // expertise
  expertise_details?: string;
  // transport
  vehicle_type?: string;
  // donation (all methods)
  donation_amount?: number;
  payment_method?: "mobile_money" | "visa";
  // mobile money
  mobile_money_provider?: "airtel_money" | "mtn_momo";
  mobile_money_number?: string;
  // visa
  card_number?: string;
  card_cvc?: string;
  card_expiry_month?: number;
  card_expiry_year?: number;
  cardholder_name?: string;
}

export interface UpdateOfferStatusInput {
  status: "pending" | "accepted" | "fulfilled";
}

export interface DashboardStats {
  total_users: number;
  active_users: number;
  total_requests: number;
  pending_requests: number;
  approved_requests: number;
  rejected_requests: number;
  closed_requests: number;
  total_offers: number;
  pending_offers: number;
  accepted_offers: number;
  fulfilled_offers: number;
  total_donations: number;
  total_donation_amount: number;
}

export interface CreateDonationInput {
  request_id: string;
  donor_name: string;
  amount: number;
  date: string;
}
