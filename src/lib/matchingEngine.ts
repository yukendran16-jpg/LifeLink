import { DonorProfile, BloodRequest, MatchingScoreBreakdown } from '../types';
import { isDonorCompatible, getCompatibilityType } from './compatibility';

/**
 * Calculates Great-Circle distance using Haversine Formula (km)
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10; // 1 decimal place
}

/**
 * Computes 100-Point Transparent Operational Score (Section 9)
 */
export function calculateDonorScore(
  donor: DonorProfile,
  request: BloodRequest
): MatchingScoreBreakdown {
  const warnings: string[] = [];

  // 1. Compatibility (max 40 pts)
  let compatibilityScore = 0;
  if (isDonorCompatible(donor.bloodGroup, request.bloodGroup)) {
    const compType = getCompatibilityType(donor.bloodGroup, request.bloodGroup);
    if (compType === 'EXACT') {
      compatibilityScore = 40;
    } else if (compType === 'UNIVERSAL') {
      compatibilityScore = 38;
    } else {
      compatibilityScore = 35;
    }
  } else {
    compatibilityScore = 0;
    warnings.push(`Blood group ${donor.bloodGroup} is not preliminary compatible with ${request.bloodGroup}.`);
  }

  // 2. Availability (max 20 pts)
  let availabilityScore = 0;
  if (donor.availabilityStatus === 'AVAILABLE') {
    availabilityScore = 20;
  } else if (donor.availabilityStatus === 'TEMPORARILY_UNAVAILABLE') {
    availabilityScore = 0;
    warnings.push('Donor marked status as temporarily unavailable.');
  } else if (donor.availabilityStatus === 'UNAVAILABLE_UNTIL_DATE') {
    availabilityScore = 0;
    warnings.push(`Donor unavailable until ${donor.unavailableUntil || 'specified date'}.`);
  }

  // 3. Distance (max 20 pts)
  let distanceScore = 0;
  let distanceKm: number | null = null;

  if (
    typeof donor.latitude === 'number' &&
    typeof donor.longitude === 'number' &&
    typeof request.latitude === 'number' &&
    typeof request.longitude === 'number'
  ) {
    distanceKm = calculateHaversineDistance(
      request.latitude,
      request.longitude,
      donor.latitude,
      donor.longitude
    );

    if (distanceKm <= 5) {
      distanceScore = 20;
    } else if (distanceKm <= 10) {
      distanceScore = 16;
    } else if (distanceKm <= 20) {
      distanceScore = 12;
    } else if (distanceKm <= 50) {
      distanceScore = 8;
    } else if (distanceKm <= 100) {
      distanceScore = 4;
    } else {
      distanceScore = 0;
      warnings.push(`Donor is over 100km away (${distanceKm} km).`);
    }
  } else {
    // Missing coordinates: clearly documented without inventing data
    distanceScore = 0;
    distanceKm = null;
    warnings.push('Missing coordinates: proximity scoring component unavailable (0/20 pts).');
  }

  // 4. Preliminary eligibility information (max 10 pts)
  let eligibilityScore = 0;
  if (donor.lastDonationDate) {
    const lastDate = new Date(donor.lastDonationDate).getTime();
    const now = Date.now();
    const daysSince = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
    if (daysSince >= 90) {
      eligibilityScore = 10;
    } else {
      eligibilityScore = 2;
      warnings.push(`Donor donated ${daysSince} days ago (< 90-day recommended deferral period).`);
    }
  } else {
    eligibilityScore = 6; // No recent donation recorded
    warnings.push('No prior donation date recorded.');
  }

  // 5. Reliability / history (max 10 pts)
  let reliabilityScore = 0;
  const donations = donor.totalDonations || 0;
  if (donations >= 5) {
    reliabilityScore = 10;
  } else if (donations >= 3) {
    reliabilityScore = 8;
  } else if (donations >= 1) {
    reliabilityScore = 6;
  } else {
    reliabilityScore = 4; // First-time or new donor
  }

  const totalScore =
    compatibilityScore +
    availabilityScore +
    distanceScore +
    eligibilityScore +
    reliabilityScore;

  return {
    compatibility: compatibilityScore,
    availability: availabilityScore,
    distance: distanceScore,
    eligibility: eligibilityScore,
    reliability: reliabilityScore,
    totalScore,
    distanceKm,
    warnings
  };
}

export interface ScoredDonor {
  donor: DonorProfile;
  scoreBreakdown: MatchingScoreBreakdown;
  alreadyContacted: boolean;
}

/**
 * Filter and Rank Donors for a Blood Request
 */
export function rankEligibleDonors(
  donors: DonorProfile[],
  request: BloodRequest,
  contactedDonorIds: Set<string> = new Set()
): ScoredDonor[] {
  // Step 1: Hard filter for preliminary compatibility & availability
  const eligible = donors.filter(donor => {
    // Must be preliminary compatible
    if (!isDonorCompatible(donor.bloodGroup, request.bloodGroup)) return false;
    // Must be marked AVAILABLE
    if (donor.availabilityStatus !== 'AVAILABLE') return false;
    return true;
  });

  // Step 2: Calculate operational scores
  const scored: ScoredDonor[] = eligible.map(donor => ({
    donor,
    scoreBreakdown: calculateDonorScore(donor, request),
    alreadyContacted: contactedDonorIds.has(donor.userId || donor.id)
  }));

  // Step 3: Sort descending by total score, then by distance
  scored.sort((a, b) => {
    if (b.scoreBreakdown.totalScore !== a.scoreBreakdown.totalScore) {
      return b.scoreBreakdown.totalScore - a.scoreBreakdown.totalScore;
    }
    const distA = a.scoreBreakdown.distanceKm ?? 9999;
    const distB = b.scoreBreakdown.distanceKm ?? 9999;
    return distA - distB;
  });

  return scored;
}

/**
 * Configurable Outreach Wave Partitioner (Section 13)
 * Wave 1: Top 5 suitable donors
 * Wave 2: Next 10 suitable donors
 * Wave 3: Remaining suitable donors
 */
export function partitionOutreachWaves(scoredDonors: ScoredDonor[]): {
  wave1: ScoredDonor[];
  wave2: ScoredDonor[];
  wave3: ScoredDonor[];
} {
  const uncontacted = scoredDonors.filter(d => !d.alreadyContacted);
  return {
    wave1: uncontacted.slice(0, 5),
    wave2: uncontacted.slice(5, 15),
    wave3: uncontacted.slice(15)
  };
}
