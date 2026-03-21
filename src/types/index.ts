export interface User {
  id: string;
  clerkId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  bio?: string;
  profileImageUrl?: string;
  role: "admin" | "community_member";
  isActive: boolean;
  createdAt: string;
}

export interface EmergencyRequest {
  id: string;
  userId: string;
  title: string;
  description: string;
  type: "medical" | "food" | "rescue" | "shelter";
  status: "pending" | "approved" | "rejected" | "closed";
  locationName: string;
  latitude?: number;
  longitude?: number;
  mediaUrls?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Offer {
  id: string;
  requestId: string;
  responderName: string;
  responderContact: string;
  offerType: "transport" | "donation" | "expertise";
  status: "pending" | "accepted" | "fulfilled";
  latitude?: number;
  longitude?: number;
  createdAt: string;
}

export interface Donation {
  id: string;
  requestId: string;
  donorName: string;
  amount: number;
  date: string;
}

export interface CreateOfferInput {
  requestId: string;
  responderName: string;
  responderContact: string;
  offerType: "transport" | "donation" | "expertise";
  latitude?: number;
  longitude?: number;
}

export interface UpdateUserInput {
  fullName?: string;
  phoneNumber?: string;
  bio?: string;
  profileImageUrl?: string;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  closedRequests: number;
  totalOffers: number;
  pendingOffers: number;
  acceptedOffers: number;
  fulfilledOffers: number;
  totalDonations: number;
  totalDonationAmount: number;
}

export interface CreateDonationInput {
  requestId: string;
  donorName: string;
  amount: number;
  date: string;
}
