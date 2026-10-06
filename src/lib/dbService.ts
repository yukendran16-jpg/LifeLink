import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  UserProfile,
  DonorProfile,
  HospitalProfile,
  BloodRequest,
  MatchRecord,
  DonationRecord,
  InventoryItem,
  InventoryTransaction,
  NotificationItem,
  AuditLogEntry,
  BloodGroup,
  RequestStatus,
  MatchStatus,
  HospitalVerificationStatus,
  AvailabilityStatus
} from '../types';
import { ALL_BLOOD_GROUPS } from './compatibility';

// ---------------- USER PROFILES ----------------
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

export async function setUserProfile(profile: UserProfile): Promise<void> {
  const path = `users/${profile.uid}`;
  try {
    await setDoc(doc(db, 'users', profile.uid), profile, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// ---------------- DONOR PROFILES ----------------
export async function getDonorProfile(userId: string): Promise<DonorProfile | null> {
  const path = `donors/${userId}`;
  try {
    const snap = await getDoc(doc(db, 'donors', userId));
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as DonorProfile;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

export async function saveDonorProfile(donor: Partial<DonorProfile> & { userId: string }): Promise<void> {
  const path = `donors/${donor.userId}`;
  try {
    await setDoc(doc(db, 'donors', donor.userId), {
      ...donor,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function updateDonorAvailability(
  userId: string,
  status: AvailabilityStatus,
  untilDate?: string
): Promise<void> {
  const path = `donors/${userId}`;
  try {
    await updateDoc(doc(db, 'donors', userId), {
      availabilityStatus: status,
      unavailableUntil: untilDate || '',
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function getAllDonors(): Promise<DonorProfile[]> {
  const path = 'donors';
  try {
    const snap = await getDocs(collection(db, 'donors'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as DonorProfile));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

// ---------------- HOSPITAL PROFILES ----------------
export async function getHospitalProfile(userId: string): Promise<HospitalProfile | null> {
  const path = `hospitals/${userId}`;
  try {
    const snap = await getDoc(doc(db, 'hospitals', userId));
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as HospitalProfile;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

export async function saveHospitalProfile(hospital: Partial<HospitalProfile> & { userId: string }): Promise<void> {
  const path = `hospitals/${hospital.userId}`;
  try {
    await setDoc(doc(db, 'hospitals', hospital.userId), {
      ...hospital,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function getAllHospitals(): Promise<HospitalProfile[]> {
  const path = 'hospitals';
  try {
    const snap = await getDocs(collection(db, 'hospitals'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as HospitalProfile));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function verifyHospital(
  hospitalId: string,
  status: HospitalVerificationStatus,
  adminId: string,
  notes?: string
): Promise<void> {
  const path = `hospitals/${hospitalId}`;
  try {
    await updateDoc(doc(db, 'hospitals', hospitalId), {
      verificationStatus: status,
      verifiedAt: new Date().toISOString(),
      verifiedBy: adminId,
      verificationNotes: notes || '',
      updatedAt: new Date().toISOString()
    });

    // Notify the hospital
    await createNotification({
      recipientId: hospitalId,
      recipientRole: 'HOSPITAL',
      type: 'HOSPITAL_VERIFIED',
      title: status === 'VERIFIED' ? 'Hospital Facility Verified' : 'Hospital Verification Update',
      message: status === 'VERIFIED'
        ? 'Your healthcare facility credentials have been approved by the network administrator. You can now publish blood requests.'
        : `Your verification status is: ${status}. Admin notes: ${notes || 'No remarks provided.'}`,
      read: false,
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// ---------------- BLOOD REQUESTS ----------------
export async function createBloodRequest(requestData: Omit<BloodRequest, 'id'>): Promise<string> {
  const path = 'bloodRequests';
  try {
    const ref = await addDoc(collection(db, 'bloodRequests'), requestData);
    return ref.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function getBloodRequest(requestId: string): Promise<BloodRequest | null> {
  const path = `bloodRequests/${requestId}`;
  try {
    const snap = await getDoc(doc(db, 'bloodRequests', requestId));
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as BloodRequest;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

export async function getHospitalRequests(hospitalId: string): Promise<BloodRequest[]> {
  const path = 'bloodRequests';
  try {
    const q = query(
      collection(db, 'bloodRequests'),
      where('hospitalId', '==', hospitalId)
    );
    const snap = await getDocs(q);
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as BloodRequest));
    // Sort client-side descending by createdAt
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function getAllActiveRequests(): Promise<BloodRequest[]> {
  const path = 'bloodRequests';
  try {
    const snap = await getDocs(collection(db, 'bloodRequests'));
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as BloodRequest));
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function updateRequestStatus(
  requestId: string,
  status: RequestStatus,
  additionalFields: Partial<BloodRequest> = {}
): Promise<void> {
  const path = `bloodRequests/${requestId}`;
  try {
    await updateDoc(doc(db, 'bloodRequests', requestId), {
      status,
      ...additionalFields,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function cancelBloodRequest(
  requestId: string,
  actorId: string,
  actorEmail: string,
  reason: string
): Promise<void> {
  const path = `bloodRequests/${requestId}`;
  try {
    // 1. Update request status
    await updateDoc(doc(db, 'bloodRequests', requestId), {
      status: 'CANCELLED',
      notes: reason ? `Cancelled: ${reason}` : 'Cancelled by hospital',
      updatedAt: new Date().toISOString()
    });

    // 2. Cancel all pending matches for this request
    const matchesQ = query(
      collection(db, 'matches'),
      where('requestId', '==', requestId),
      where('status', '==', 'PENDING')
    );
    const matchSnaps = await getDocs(matchesQ);
    const batch = writeBatch(db);
    matchSnaps.forEach(mDoc => {
      batch.update(mDoc.ref, {
        status: 'CANCELLED',
        updatedAt: new Date().toISOString()
      });
    });
    await batch.commit();

    // 3. Log audit event
    await createAuditLog({
      action: 'CANCEL_BLOOD_REQUEST',
      actorId,
      actorEmail,
      actorRole: 'HOSPITAL',
      targetEntity: 'BloodRequest',
      targetId: requestId,
      details: `Requisition cancelled. Reason: ${reason || 'N/A'}. Pending matches terminated.`,
      severity: 'WARN',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// ---------------- MATCHES ----------------
export async function createBatchMatches(matches: Omit<MatchRecord, 'id'>[]): Promise<void> {
  const path = 'matches';
  try {
    const batch = writeBatch(db);
    for (const match of matches) {
      const newRef = doc(collection(db, 'matches'));
      batch.set(newRef, match);

      // Create notification for donor
      const notifRef = doc(collection(db, 'notifications'));
      batch.set(notifRef, {
        recipientId: match.donorId,
        recipientRole: 'DONOR',
        type: 'MATCH_REQUEST',
        title: `${match.urgency} Blood Match: ${match.requestedBloodGroup}`,
        message: `${match.hospitalName} has an urgent requisition for ${match.requestedBloodGroup} blood (${match.urgency} priority). Compatibility score: ${match.compatibilityScore}/100.`,
        read: false,
        link: `/donor/matches`,
        referenceId: newRef.id,
        createdAt: new Date().toISOString()
      });
    }
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function getMatchesForDonor(donorId: string): Promise<MatchRecord[]> {
  const path = 'matches';
  try {
    const q = query(collection(db, 'matches'), where('donorId', '==', donorId));
    const snap = await getDocs(q);
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as MatchRecord));
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function getMatchesForRequest(requestId: string): Promise<MatchRecord[]> {
  const path = 'matches';
  try {
    const q = query(collection(db, 'matches'), where('requestId', '==', requestId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as MatchRecord));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function getAllMatches(): Promise<MatchRecord[]> {
  const path = 'matches';
  try {
    const snap = await getDocs(collection(db, 'matches'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as MatchRecord));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function respondToMatch(
  matchId: string,
  donorId: string,
  donorName: string,
  status: 'ACCEPTED' | 'DECLINED',
  reason?: string
): Promise<void> {
  const path = `matches/${matchId}`;
  try {
    const snap = await getDoc(doc(db, 'matches', matchId));
    if (!snap.exists()) throw new Error('Match record not found');
    const match = snap.data() as MatchRecord;

    if (match.donorId !== donorId) {
      throw new Error('Unauthorized: only the matched donor can submit a response.');
    }

    const now = new Date().toISOString();
    await updateDoc(doc(db, 'matches', matchId), {
      status,
      declineReason: reason || '',
      respondedAt: now,
      updatedAt: now
    });

    // Notify hospital of donor response
    await createNotification({
      recipientId: match.hospitalId,
      recipientRole: 'HOSPITAL',
      type: status === 'ACCEPTED' ? 'MATCH_ACCEPTED' : 'MATCH_DECLINED',
      title: status === 'ACCEPTED' ? 'Donor Accepted Blood Match' : 'Donor Declined Blood Match',
      message: status === 'ACCEPTED'
        ? `Donor ${donorName} (${match.donorBloodGroup}) accepted requisition #${match.requestId.slice(-6)}. You can coordinate schedule.`
        : `Donor ${donorName} declined requisition #${match.requestId.slice(-6)}${reason ? `: "${reason}"` : '.'}`,
      read: false,
      link: `/hospital/requests/${match.requestId}`,
      referenceId: matchId,
      createdAt: now
    });

    // If accepted, also auto-create a SCHEDULED donation record pending completion
    if (status === 'ACCEPTED') {
      await createDonationRecord({
        requestId: match.requestId,
        hospitalId: match.hospitalId,
        hospitalName: match.hospitalName,
        donorId: match.donorId,
        donorName: match.donorName,
        bloodGroup: match.donorBloodGroup,
        unitsDonated: 1, // standard 1 unit donation
        status: 'SCHEDULED',
        scheduledDate: now,
        inventoryCredited: false,
        notes: `Accepted from outreach wave ${match.waveNumber}. Awaiting donor arrival and hospital blood draw confirmation.`,
        createdAt: now,
        updatedAt: now
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// ---------------- DONATIONS ----------------
export async function createDonationRecord(donationData: Omit<DonationRecord, 'id'>): Promise<string> {
  const path = 'donations';
  try {
    const ref = await addDoc(collection(db, 'donations'), donationData);
    return ref.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function getDonationsForDonor(donorId: string): Promise<DonationRecord[]> {
  const path = 'donations';
  try {
    const q = query(collection(db, 'donations'), where('donorId', '==', donorId));
    const snap = await getDocs(q);
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as DonationRecord));
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function getDonationsForHospital(hospitalId: string): Promise<DonationRecord[]> {
  const path = 'donations';
  try {
    const q = query(collection(db, 'donations'), where('hospitalId', '==', hospitalId));
    const snap = await getDocs(q);
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as DonationRecord));
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function getAllDonations(): Promise<DonationRecord[]> {
  const path = 'donations';
  try {
    const snap = await getDocs(collection(db, 'donations'));
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as DonationRecord));
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

/**
 * Confirms a completed blood donation:
 * 1. Marks donation as COMPLETED with certificate ID & staff name
 * 2. Credits hospital inventory atomically with transaction log
 * 3. Updates blood request fulfilled units (if request linked)
 * 4. Updates donor profile (last donation date, increments total donations)
 * 5. Notifies donor with certificate recognition
 */
export async function confirmDonationCompletion(
  donationId: string,
  staffName: string,
  unitsConfirmed: number = 1
): Promise<void> {
  const path = `donations/${donationId}`;
  try {
    const dSnap = await getDoc(doc(db, 'donations', donationId));
    if (!dSnap.exists()) throw new Error('Donation record not found');
    const donation = dSnap.data() as DonationRecord;

    if (donation.status === 'COMPLETED') {
      throw new Error('This donation has already been marked completed.');
    }

    const now = new Date().toISOString();
    const certificateId = `LL-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 1. Update Donation
    await updateDoc(doc(db, 'donations', donationId), {
      status: 'COMPLETED',
      completedDate: now,
      confirmedByStaff: staffName,
      certificateId,
      unitsDonated: unitsConfirmed,
      inventoryCredited: true,
      updatedAt: now
    });

    // 2. Atomically Credit Inventory
    await adjustHospitalInventory({
      hospitalId: donation.hospitalId,
      bloodGroup: donation.bloodGroup,
      quantityDelta: unitsConfirmed,
      type: 'DONATION_CREDIT',
      reason: `Donation completion credit (Cert #${certificateId})`,
      referenceId: donationId,
      performedBy: staffName
    });

    // 3. Update Request Fulfilled Units if request linked
    if (donation.requestId) {
      const rSnap = await getDoc(doc(db, 'bloodRequests', donation.requestId));
      if (rSnap.exists()) {
        const req = rSnap.data() as BloodRequest;
        const newFulfilled = (req.unitsFulfilled || 0) + unitsConfirmed;
        const newStatus: RequestStatus = newFulfilled >= req.unitsRequired ? 'FULFILLED' : 'PARTIALLY_FULFILLED';
        await updateDoc(doc(db, 'bloodRequests', donation.requestId), {
          unitsFulfilled: newFulfilled,
          status: newStatus,
          updatedAt: now
        });
      }
    }

    // 4. Update Donor Profile
    const donorSnap = await getDoc(doc(db, 'donors', donation.donorId));
    if (donorSnap.exists()) {
      const dProfile = donorSnap.data() as DonorProfile;
      await updateDoc(doc(db, 'donors', donation.donorId), {
        lastDonationDate: now,
        totalDonations: (dProfile.totalDonations || 0) + 1,
        updatedAt: now
      });
    }

    // 5. Notify Donor
    await createNotification({
      recipientId: donation.donorId,
      recipientRole: 'DONOR',
      type: 'DONATION_COMPLETED',
      title: 'Blood Donation Verified — Thank You!',
      message: `Your donation of ${unitsConfirmed} unit(s) of ${donation.bloodGroup} at ${donation.hospitalName} has been processed. Certificate: ${certificateId}.`,
      read: false,
      link: '/donor/history',
      referenceId: donationId,
      createdAt: now
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// ---------------- INVENTORY ----------------
export async function getHospitalInventory(hospitalId: string): Promise<InventoryItem[]> {
  const path = 'inventory';
  try {
    const q = query(collection(db, 'inventory'), where('hospitalId', '==', hospitalId));
    const snap = await getDocs(q);
    const existing = snap.docs.map(d => ({ id: d.id, ...d.data() } as InventoryItem));

    // Ensure all 8 blood groups exist for display
    const result: InventoryItem[] = [];
    for (const bg of ALL_BLOOD_GROUPS) {
      const match = existing.find(i => i.bloodGroup === bg);
      if (match) {
        result.push(match);
      } else {
        result.push({
          id: `${hospitalId}_${bg}`,
          hospitalId,
          bloodGroup: bg,
          availableUnits: 0,
          reservedUnits: 0,
          status: 'CRITICAL',
          lastUpdated: new Date().toISOString()
        });
      }
    }
    return result;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function adjustHospitalInventory(params: {
  hospitalId: string;
  bloodGroup: BloodGroup;
  quantityDelta: number; // positive to add, negative to subtract
  type: InventoryTransaction['type'];
  reason: string;
  referenceId?: string;
  performedBy: string;
}): Promise<void> {
  const { hospitalId, bloodGroup, quantityDelta, type, reason, referenceId, performedBy } = params;
  const docId = `${hospitalId}_${bloodGroup}`;
  const path = `inventory/${docId}`;

  try {
    const itemRef = doc(db, 'inventory', docId);
    const snap = await getDoc(itemRef);

    let currentAvailable = 0;
    let currentReserved = 0;

    if (snap.exists()) {
      const data = snap.data() as InventoryItem;
      currentAvailable = data.availableUnits || 0;
      currentReserved = data.reservedUnits || 0;
    }

    const newAvailable = currentAvailable + quantityDelta;
    if (newAvailable < 0) {
      throw new Error(`Cannot adjust below 0 units. Current: ${currentAvailable}, delta: ${quantityDelta}`);
    }

    // Determine Status
    let status: 'NORMAL' | 'LOW' | 'CRITICAL' = 'NORMAL';
    if (newAvailable <= 2) {
      status = 'CRITICAL';
    } else if (newAvailable <= 5) {
      status = 'LOW';
    }

    const now = new Date().toISOString();

    await setDoc(itemRef, {
      id: docId,
      hospitalId,
      bloodGroup,
      availableUnits: newAvailable,
      reservedUnits: currentReserved,
      status,
      lastUpdated: now,
      updatedBy: performedBy
    }, { merge: true });

    // Record immutable audit transaction
    await addDoc(collection(db, 'inventoryTransactions'), {
      hospitalId,
      bloodGroup,
      type,
      quantity: Math.abs(quantityDelta),
      previousAvailable: currentAvailable,
      newAvailable,
      reason,
      referenceId: referenceId || '',
      performedBy,
      timestamp: now
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function reserveInventoryUnits(
  hospitalId: string,
  bloodGroup: BloodGroup,
  unitsToReserve: number,
  performedBy: string,
  reason: string
): Promise<void> {
  const docId = `${hospitalId}_${bloodGroup}`;
  const path = `inventory/${docId}`;
  try {
    const itemRef = doc(db, 'inventory', docId);
    const snap = await getDoc(itemRef);
    if (!snap.exists()) throw new Error('Inventory record not found');
    const data = snap.data() as InventoryItem;

    if (data.availableUnits < unitsToReserve) {
      throw new Error(`Insufficient available units (${data.availableUnits}) to reserve ${unitsToReserve} unit(s).`);
    }

    const newAvailable = data.availableUnits - unitsToReserve;
    const newReserved = (data.reservedUnits || 0) + unitsToReserve;
    const status: 'NORMAL' | 'LOW' | 'CRITICAL' = newAvailable <= 2 ? 'CRITICAL' : newAvailable <= 5 ? 'LOW' : 'NORMAL';
    const now = new Date().toISOString();

    await updateDoc(itemRef, {
      availableUnits: newAvailable,
      reservedUnits: newReserved,
      status,
      lastUpdated: now,
      updatedBy: performedBy
    });

    await addDoc(collection(db, 'inventoryTransactions'), {
      hospitalId,
      bloodGroup,
      type: 'RESERVATION',
      quantity: unitsToReserve,
      previousAvailable: data.availableUnits,
      newAvailable,
      reason,
      performedBy,
      timestamp: now
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function releaseInventoryReservation(
  hospitalId: string,
  bloodGroup: BloodGroup,
  unitsToRelease: number,
  performedBy: string,
  reason: string
): Promise<void> {
  const docId = `${hospitalId}_${bloodGroup}`;
  const path = `inventory/${docId}`;
  try {
    const itemRef = doc(db, 'inventory', docId);
    const snap = await getDoc(itemRef);
    if (!snap.exists()) throw new Error('Inventory record not found');
    const data = snap.data() as InventoryItem;

    const releaseCount = Math.min(unitsToRelease, data.reservedUnits || 0);
    const newAvailable = data.availableUnits + releaseCount;
    const newReserved = Math.max(0, (data.reservedUnits || 0) - releaseCount);
    const status: 'NORMAL' | 'LOW' | 'CRITICAL' = newAvailable <= 2 ? 'CRITICAL' : newAvailable <= 5 ? 'LOW' : 'NORMAL';
    const now = new Date().toISOString();

    await updateDoc(itemRef, {
      availableUnits: newAvailable,
      reservedUnits: newReserved,
      status,
      lastUpdated: now,
      updatedBy: performedBy
    });

    await addDoc(collection(db, 'inventoryTransactions'), {
      hospitalId,
      bloodGroup,
      type: 'RESERVATION_RELEASE',
      quantity: releaseCount,
      previousAvailable: data.availableUnits,
      newAvailable,
      reason,
      performedBy,
      timestamp: now
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function getInventoryTransactions(hospitalId: string): Promise<InventoryTransaction[]> {
  const path = 'inventoryTransactions';
  try {
    const q = query(
      collection(db, 'inventoryTransactions'),
      where('hospitalId', '==', hospitalId)
    );
    const snap = await getDocs(q);
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as InventoryTransaction));
    list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

// ---------------- NOTIFICATIONS ----------------
export async function createNotification(notifData: Omit<NotificationItem, 'id'>): Promise<void> {
  const path = 'notifications';
  try {
    await addDoc(collection(db, 'notifications'), notifData);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function getUserNotifications(userId: string): Promise<NotificationItem[]> {
  const path = 'notifications';
  try {
    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', userId)
    );
    const snap = await getDocs(q);
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as NotificationItem));
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function markNotificationAsRead(notifId: string): Promise<void> {
  const path = `notifications/${notifId}`;
  try {
    await updateDoc(doc(db, 'notifications', notifId), { read: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// ---------------- AUDIT LOGS ----------------
export async function createAuditLog(logData: Omit<AuditLogEntry, 'id'>): Promise<void> {
  const path = 'auditLogs';
  try {
    await addDoc(collection(db, 'auditLogs'), logData);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function getAuditLogs(): Promise<AuditLogEntry[]> {
  const path = 'auditLogs';
  try {
    const snap = await getDocs(collection(db, 'auditLogs'));
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as AuditLogEntry));
    list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

// ---------------- SEED INITIAL NETWORK DATA ----------------
/**
 * Seeds rich demonstration data to Cloud Firestore if the database has 0 hospitals/donors
 */
export async function seedInitialNetworkData(adminUid: string): Promise<boolean> {
  try {
    const hospitalSnaps = await getDocs(collection(db, 'hospitals'));
    if (!hospitalSnaps.empty) {
      return false; // Database already seeded
    }

    const batch = writeBatch(db);
    const now = new Date();

    // 1. Sample Hospitals
    const sampleHospitals = [
      {
        userId: 'hosp_st_jude_trauma',
        hospitalName: 'St. Jude Metropolitan Trauma Center',
        licenseNumber: 'HOSP-NY-90214-ER',
        email: 'trauma.bloodbank@stjudemetro.org',
        phone: '+1 (555) 234-5678',
        address: '450 Mercy Boulevard, West Wing',
        city: 'New York',
        latitude: 40.7128,
        longitude: -74.0060,
        verificationStatus: 'VERIFIED' as HospitalVerificationStatus,
        verifiedAt: new Date(now.getTime() - 86400000 * 14).toISOString(),
        verifiedBy: adminUid,
        verificationNotes: 'Class A Level 1 Trauma Facility verified by Health Dept.',
        createdAt: new Date(now.getTime() - 86400000 * 30).toISOString(),
        updatedAt: now.toISOString()
      },
      {
        userId: 'hosp_city_pediatric',
        hospitalName: 'City Children & Pediatric Blood Center',
        licenseNumber: 'HOSP-NY-84321-PED',
        email: 'coordination@citypediatric.org',
        phone: '+1 (555) 876-5432',
        address: '120 Healing Path, Tower B',
        city: 'New York',
        latitude: 40.7282,
        longitude: -73.9942,
        verificationStatus: 'VERIFIED' as HospitalVerificationStatus,
        verifiedAt: new Date(now.getTime() - 86400000 * 7).toISOString(),
        verifiedBy: adminUid,
        verificationNotes: 'Pediatric oncology transfusion unit approved.',
        createdAt: new Date(now.getTime() - 86400000 * 20).toISOString(),
        updatedAt: now.toISOString()
      },
      {
        userId: 'hosp_riverside_general',
        hospitalName: 'Riverside Community Hospital',
        licenseNumber: 'HOSP-NY-51203-GEN',
        email: 'bloodunit@riversidehosp.org',
        phone: '+1 (555) 345-6789',
        address: '880 River Drive',
        city: 'Brooklyn',
        latitude: 40.6782,
        longitude: -73.9442,
        verificationStatus: 'PENDING' as HospitalVerificationStatus,
        verificationNotes: 'Submitted licensing board certificate; awaiting admin review.',
        createdAt: new Date(now.getTime() - 86400000 * 2).toISOString(),
        updatedAt: now.toISOString()
      }
    ];

    sampleHospitals.forEach(h => {
      const ref = doc(db, 'hospitals', h.userId);
      batch.set(ref, h);
    });

    // 2. Sample Donors
    const sampleDonors = [
      {
        userId: 'donor_marcus_chen',
        fullName: 'Marcus Chen',
        email: 'marcus.chen@example.com',
        phone: '+1 (555) 901-2345',
        bloodGroup: 'O-' as BloodGroup, // Universal Donor
        city: 'New York',
        latitude: 40.7180,
        longitude: -74.0020,
        dateOfBirth: '1992-05-14',
        availabilityStatus: 'AVAILABLE' as AvailabilityStatus,
        lastDonationDate: new Date(now.getTime() - 86400000 * 110).toISOString(),
        totalDonations: 8,
        isVerified: true,
        createdAt: new Date(now.getTime() - 86400000 * 60).toISOString(),
        updatedAt: now.toISOString()
      },
      {
        userId: 'donor_sarah_jenkins',
        fullName: 'Sarah Jenkins',
        email: 'sarah.j@example.com',
        phone: '+1 (555) 812-3456',
        bloodGroup: 'O+' as BloodGroup,
        city: 'New York',
        latitude: 40.7250,
        longitude: -74.0090,
        dateOfBirth: '1995-11-20',
        availabilityStatus: 'AVAILABLE' as AvailabilityStatus,
        lastDonationDate: new Date(now.getTime() - 86400000 * 130).toISOString(),
        totalDonations: 5,
        isVerified: true,
        createdAt: new Date(now.getTime() - 86400000 * 45).toISOString(),
        updatedAt: now.toISOString()
      },
      {
        userId: 'donor_elena_rodriguez',
        fullName: 'Dr. Elena Rodriguez',
        email: 'elena.r@example.com',
        phone: '+1 (555) 723-4567',
        bloodGroup: 'A-' as BloodGroup,
        city: 'New York',
        latitude: 40.7310,
        longitude: -73.9980,
        dateOfBirth: '1988-03-08',
        availabilityStatus: 'AVAILABLE' as AvailabilityStatus,
        lastDonationDate: new Date(now.getTime() - 86400000 * 95).toISOString(),
        totalDonations: 12,
        isVerified: true,
        createdAt: new Date(now.getTime() - 86400000 * 90).toISOString(),
        updatedAt: now.toISOString()
      },
      {
        userId: 'donor_david_kim',
        fullName: 'David Kim',
        email: 'david.kim@example.com',
        phone: '+1 (555) 634-5678',
        bloodGroup: 'B+' as BloodGroup,
        city: 'Brooklyn',
        latitude: 40.6890,
        longitude: -73.9750,
        dateOfBirth: '1998-09-15',
        availabilityStatus: 'AVAILABLE' as AvailabilityStatus,
        lastDonationDate: new Date(now.getTime() - 86400000 * 150).toISOString(),
        totalDonations: 3,
        isVerified: true,
        createdAt: new Date(now.getTime() - 86400000 * 30).toISOString(),
        updatedAt: now.toISOString()
      },
      {
        userId: 'donor_amara_okoye',
        fullName: 'Amara Okoye',
        email: 'amara.o@example.com',
        phone: '+1 (555) 545-6789',
        bloodGroup: 'AB-' as BloodGroup,
        city: 'New York',
        latitude: 40.7420,
        longitude: -73.9850,
        dateOfBirth: '1994-07-22',
        availabilityStatus: 'AVAILABLE' as AvailabilityStatus,
        lastDonationDate: new Date(now.getTime() - 86400000 * 105).toISOString(),
        totalDonations: 6,
        isVerified: true,
        createdAt: new Date(now.getTime() - 86400000 * 50).toISOString(),
        updatedAt: now.toISOString()
      },
      {
        userId: 'donor_lucas_vance',
        fullName: 'Lucas Vance',
        email: 'lucas.v@example.com',
        phone: '+1 (555) 456-7890',
        bloodGroup: 'A+' as BloodGroup,
        city: 'New York',
        latitude: 40.7510,
        longitude: -73.9780,
        dateOfBirth: '1990-12-01',
        availabilityStatus: 'TEMPORARILY_UNAVAILABLE' as AvailabilityStatus,
        lastDonationDate: new Date(now.getTime() - 86400000 * 25).toISOString(), // Recent donation < 90 days
        totalDonations: 4,
        isVerified: true,
        createdAt: new Date(now.getTime() - 86400000 * 40).toISOString(),
        updatedAt: now.toISOString()
      }
    ];

    sampleDonors.forEach(d => {
      const ref = doc(db, 'donors', d.userId);
      batch.set(ref, d);
    });

    // 3. Sample Inventory for St. Jude Metropolitan Trauma Center
    const hospId = 'hosp_st_jude_trauma';
    const inventoryLevels: Record<BloodGroup, { available: number; reserved: number }> = {
      'O-': { available: 1, reserved: 2 },  // Critical shortage
      'O+': { available: 4, reserved: 1 },  // Low
      'A-': { available: 2, reserved: 1 },  // Critical
      'A+': { available: 9, reserved: 3 },  // Normal
      'B-': { available: 3, reserved: 0 },  // Low
      'B+': { available: 7, reserved: 1 },  // Normal
      'AB-': { available: 1, reserved: 0 }, // Critical
      'AB+': { available: 6, reserved: 0 }  // Normal
    };

    ALL_BLOOD_GROUPS.forEach(bg => {
      const invRef = doc(db, 'inventory', `${hospId}_${bg}`);
      const available = inventoryLevels[bg].available;
      const reserved = inventoryLevels[bg].reserved;
      const status = available <= 2 ? 'CRITICAL' : available <= 5 ? 'LOW' : 'NORMAL';
      batch.set(invRef, {
        id: `${hospId}_${bg}`,
        hospitalId: hospId,
        bloodGroup: bg,
        availableUnits: available,
        reservedUnits: reserved,
        status,
        lastUpdated: now.toISOString(),
        updatedBy: 'Blood Bank Director'
      });
    });

    // 4. Sample Blood Requests (Active Emergencies)
    const req1Ref = doc(collection(db, 'bloodRequests'));
    const req1Id = req1Ref.id;
    const deadline1 = new Date(now.getTime() + 1000 * 60 * 60 * 4).toISOString(); // 4 hours remaining
    batch.set(req1Ref, {
      hospitalId: 'hosp_st_jude_trauma',
      hospitalName: 'St. Jude Metropolitan Trauma Center',
      bloodGroup: 'O-' as BloodGroup,
      unitsRequired: 3,
      unitsFulfilled: 1,
      urgency: 'CRITICAL',
      status: 'MATCHING',
      requiredBy: deadline1,
      hospitalCity: 'New York',
      hospitalAddress: '450 Mercy Boulevard, West Wing',
      latitude: 40.7128,
      longitude: -74.0060,
      contactPhone: '+1 (555) 234-5678',
      notes: 'Emergency polytrauma surgery in OR 4. Massive transfusion protocol activated.',
      outreachWave: 1,
      createdAt: new Date(now.getTime() - 1000 * 60 * 45).toISOString(),
      updatedAt: now.toISOString()
    });

    const req2Ref = doc(collection(db, 'bloodRequests'));
    const req2Id = req2Ref.id;
    const deadline2 = new Date(now.getTime() + 1000 * 60 * 60 * 12).toISOString(); // 12 hours
    batch.set(req2Ref, {
      hospitalId: 'hosp_city_pediatric',
      hospitalName: 'City Children & Pediatric Blood Center',
      bloodGroup: 'A-' as BloodGroup,
      unitsRequired: 2,
      unitsFulfilled: 0,
      urgency: 'URGENT',
      status: 'OPEN',
      requiredBy: deadline2,
      hospitalCity: 'New York',
      hospitalAddress: '120 Healing Path, Tower B',
      latitude: 40.7282,
      longitude: -73.9942,
      contactPhone: '+1 (555) 876-5432',
      notes: 'Scheduled pediatric aplastic anemia transfusion replenishment.',
      outreachWave: 1,
      createdAt: new Date(now.getTime() - 1000 * 60 * 90).toISOString(),
      updatedAt: now.toISOString()
    });

    // 5. Active Match Dispatch for Marcus Chen
    const match1Ref = doc(collection(db, 'matches'));
    batch.set(match1Ref, {
      requestId: req1Id,
      hospitalId: 'hosp_st_jude_trauma',
      hospitalName: 'St. Jude Metropolitan Trauma Center',
      donorId: 'donor_marcus_chen',
      donorName: 'Marcus Chen',
      requestedBloodGroup: 'O-',
      donorBloodGroup: 'O-',
      urgency: 'CRITICAL',
      compatibilityScore: 98,
      scoreBreakdown: {
        compatibility: 40,
        availability: 20,
        distance: 20,
        eligibility: 10,
        reliability: 8,
        totalScore: 98,
        distanceKm: 0.8,
        warnings: []
      },
      distanceKm: 0.8,
      status: 'PENDING',
      waveNumber: 1,
      deadline: deadline1,
      createdAt: new Date(now.getTime() - 1000 * 60 * 30).toISOString(),
      updatedAt: now.toISOString()
    });

    // 6. Notification for Marcus Chen
    const notifRef = doc(collection(db, 'notifications'));
    batch.set(notifRef, {
      recipientId: 'donor_marcus_chen',
      recipientRole: 'DONOR',
      type: 'MATCH_REQUEST',
      title: 'CRITICAL Emergency Blood Match (O-)',
      message: 'St. Jude Metropolitan Trauma Center requires O- blood urgently. You are 0.8 km away with compatibility score 98/100.',
      read: false,
      link: '/donor/matches',
      referenceId: match1Ref.id,
      createdAt: now.toISOString()
    });

    // 7. Initial Audit Log
    const auditRef = doc(collection(db, 'auditLogs'));
    batch.set(auditRef, {
      action: 'SYSTEM_INITIALIZATION',
      actorId: adminUid,
      actorEmail: 'system@lifelink.org',
      actorRole: 'ADMIN',
      targetEntity: 'System',
      targetId: 'INIT',
      details: 'LifeLink Smart Blood Rescue Network initialized with verified emergency trauma hubs and donor registry.',
      severity: 'INFO',
      timestamp: now.toISOString()
    });

    await batch.commit();
    return true;
  } catch (err) {
    console.error('Error seeding initial network data:', err);
    return false;
  }
}
