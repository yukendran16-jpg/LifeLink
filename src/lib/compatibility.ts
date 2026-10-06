import { BloodGroup } from '../types';

/**
 * Preliminary Red-Cell ABO/Rh Compatibility Rules (Section 9)
 * Recipient -> Allowed Donor Blood Groups
 */
export const RECIPIENT_COMPATIBILITY_MAP: Record<BloodGroup, BloodGroup[]> = {
  'O-': ['O-'],
  'O+': ['O-', 'O+'],
  'A-': ['O-', 'A-'],
  'A+': ['O-', 'O+', 'A-', 'A+'],
  'B-': ['O-', 'B-'],
  'B+': ['O-', 'O+', 'B-', 'B+'],
  'AB-': ['O-', 'A-', 'B-', 'AB-'],
  'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+']
};

/**
 * Donor -> Recipient Compatibility (Who can this donor give blood to?)
 */
export const DONOR_CAN_GIVE_TO: Record<BloodGroup, BloodGroup[]> = {
  'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'], // Universal donor for red cells
  'O+': ['O+', 'A+', 'B+', 'AB+'],
  'A-': ['A-', 'A+', 'AB-', 'AB+'],
  'A+': ['A+', 'AB+'],
  'B-': ['B-', 'B+', 'AB-', 'AB+'],
  'B+': ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+'] // Universal recipient for red cells
};

/**
 * Checks if donor blood group is compatible with recipient blood group
 */
export function isDonorCompatible(donorBlood: BloodGroup, recipientBlood: BloodGroup): boolean {
  const allowedDonors = RECIPIENT_COMPATIBILITY_MAP[recipientBlood];
  return allowedDonors ? allowedDonors.includes(donorBlood) : false;
}

/**
 * Returns whether donor is an exact ABO/Rh match, universal match, or alternative compatible
 */
export function getCompatibilityType(donorBlood: BloodGroup, recipientBlood: BloodGroup): 'EXACT' | 'UNIVERSAL' | 'COMPATIBLE' | 'INCOMPATIBLE' {
  if (donorBlood === recipientBlood) return 'EXACT';
  if (donorBlood === 'O-') return 'UNIVERSAL';
  if (isDonorCompatible(donorBlood, recipientBlood)) return 'COMPATIBLE';
  return 'INCOMPATIBLE';
}

export const ALL_BLOOD_GROUPS: BloodGroup[] = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];

export const MEDICAL_DISCLAIMER_TEXT = 
  "Operational Recommendation Only: LifeLink's matching engine utilizes preliminary ABO/Rh compatibility filters and proximity calculation. It does not replace clinical laboratory cross-matching, blood-bank antibody screening, or qualified healthcare professional confirmation.";
