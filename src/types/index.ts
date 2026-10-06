export type UserRole = 'DONOR' | 'HOSPITAL' | 'ADMIN';

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type UrgencyLevel = 'NORMAL' | 'URGENT' | 'CRITICAL';

export type RequestStatus = 
  | 'OPEN' 
  | 'MATCHING' 
  | 'PARTIALLY_FULFILLED' 
  | 'FULFILLED' 
  | 'ESCALATED' 
  | 'EXPIRED' 
  | 'CANCELLED';

export type MatchStatus = 
  | 'PENDING' 
  | 'ACCEPTED' 
  | 'DECLINED' 
  | 'EXPIRED' 
  | 'CANCELLED';

export type DonationStatus = 
  | 'SCHEDULED' 
  | 'COMPLETED' 
  | 'CANCELLED';

export type AvailabilityStatus = 
  | 'AVAILABLE' 
  | 'TEMPORARILY_UNAVAILABLE' 
  | 'UNAVAILABLE_UNTIL_DATE';

export type HospitalVerificationStatus = 
  | 'PENDING' 
  | 'VERIFIED' 
  | 'REJECTED';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface DonorProfile {
  id: string; // Document ID (usually same as userId)
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  bloodGroup: BloodGroup;
  city: string;
  latitude?: number;
  longitude?: number;
  dateOfBirth?: string;
  availabilityStatus: AvailabilityStatus;
  unavailableUntil?: string;
  lastDonationDate?: string;
  totalDonations: number;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HospitalProfile {
  id: string; // Document ID (usually same as userId)
  userId: string;
  hospitalName: string;
  licenseNumber: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
  verificationStatus: HospitalVerificationStatus;
  verifiedAt?: string;
  verifiedBy?: string;
  verificationNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BloodRequest {
  id: string;
  hospitalId: string;
  hospitalName: string;
  bloodGroup: BloodGroup;
  unitsRequired: number;
  unitsFulfilled: number;
  urgency: UrgencyLevel;
  status: RequestStatus;
  requiredBy: string; // ISO string
  hospitalCity: string;
  hospitalAddress: string;
  latitude?: number;
  longitude?: number;
  contactPhone: string;
  notes?: string;
  outreachWave: number;
  escalatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MatchingScoreBreakdown {
  compatibility: number; // max 40
  availability: number;  // max 20
  distance: number;      // max 20
  eligibility: number;   // max 10
  reliability: number;   // max 10
  totalScore: number;    // max 100
  distanceKm: number | null;
  warnings: string[];
}

export interface MatchRecord {
  id: string;
  requestId: string;
  hospitalId: string;
  hospitalName: string;
  donorId: string;
  donorName: string;
  donorPhone?: string;
  requestedBloodGroup: BloodGroup;
  donorBloodGroup: BloodGroup;
  urgency: UrgencyLevel;
  compatibilityScore: number;
  scoreBreakdown: MatchingScoreBreakdown;
  distanceKm: number | null;
  status: MatchStatus;
  waveNumber: number;
  deadline: string; // ISO string
  respondedAt?: string;
  declineReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DonationRecord {
  id: string;
  requestId: string;
  hospitalId: string;
  hospitalName: string;
  donorId: string;
  donorName: string;
  donorEmail?: string;
  bloodGroup: BloodGroup;
  unitsDonated: number;
  status: DonationStatus;
  scheduledDate: string;
  completedDate?: string;
  confirmedByStaff?: string;
  inventoryCredited: boolean;
  certificateId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: string; // hospitalId_bloodGroup
  hospitalId: string;
  bloodGroup: BloodGroup;
  availableUnits: number;
  reservedUnits: number;
  status: 'NORMAL' | 'LOW' | 'CRITICAL';
  lastUpdated: string;
  updatedBy?: string;
}

export type InventoryTransactionType = 
  | 'DONATION_CREDIT' 
  | 'DISPATCH_USE' 
  | 'RESERVATION' 
  | 'RESERVATION_RELEASE' 
  | 'MANUAL_ADJUSTMENT' 
  | 'EXPIRED_DISCARD';

export interface InventoryTransaction {
  id: string;
  hospitalId: string;
  bloodGroup: BloodGroup;
  type: InventoryTransactionType;
  quantity: number;
  previousAvailable: number;
  newAvailable: number;
  reason: string;
  referenceId?: string;
  performedBy: string;
  timestamp: string;
}

export type NotificationType = 
  | 'MATCH_REQUEST' 
  | 'MATCH_ACCEPTED' 
  | 'MATCH_DECLINED' 
  | 'MATCH_EXPIRED' 
  | 'REQUEST_ESCALATED' 
  | 'DONATION_SCHEDULED' 
  | 'DONATION_COMPLETED' 
  | 'INVENTORY_LOW' 
  | 'HOSPITAL_VERIFIED';

export interface NotificationItem {
  id: string;
  recipientId: string;
  recipientRole: UserRole;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  referenceId?: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  actorId: string;
  actorEmail: string;
  actorRole: string;
  targetEntity: string;
  targetId: string;
  details: string;
  severity: 'INFO' | 'WARN' | 'CRITICAL';
  timestamp: string;
}
