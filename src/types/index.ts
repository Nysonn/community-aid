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

export interface CreateOfferInput {
  request_id: string;
  responder_name: string;
  responder_contact: string;
  offer_type: "transport" | "donation" | "expertise";
  latitude?: number;
  longitude?: number;
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
