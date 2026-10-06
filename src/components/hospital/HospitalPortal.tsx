import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  getHospitalProfile,
  getHospitalRequests,
  createBloodRequest,
  cancelBloodRequest,
  getAllDonors,
  getMatchesForRequest,
  createBatchMatches,
  getHospitalInventory,
  adjustHospitalInventory,
  reserveInventoryUnits,
  releaseInventoryReservation,
  getInventoryTransactions,
  getDonationsForHospital,
  confirmDonationCompletion
} from '../../lib/dbService';
import {
  HospitalProfile,
  BloodRequest,
  MatchRecord,
  DonorProfile,
  InventoryItem,
  InventoryTransaction,
  DonationRecord,
  BloodGroup,
  UrgencyLevel
} from '../../types';
import { ALL_BLOOD_GROUPS, MEDICAL_DISCLAIMER_TEXT } from '../../lib/compatibility';
import { rankEligibleDonors, partitionOutreachWaves } from '../../lib/matchingEngine';
import {
  Hospital,
  Plus,
  AlertTriangle,
  Clock,
  Droplet,
  Users,
  Search,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  ChevronRight,
  Database,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Send,
  X,
  FileCheck,
  Calendar,
  Layers,
  Activity,
  Flame,
  PackageCheck,
  SlidersHorizontal,
  ChevronLeft,
  Shield
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const HospitalPortal: React.FC = () => {
  const { user, hospitalProfile: authHosp, activeSimulatedId } = useAuth();
  const toast = useToast();
  const effectiveHospitalId = activeSimulatedId || user?.uid || 'hosp_st_jude_trauma';

  const [profile, setProfile] = useState<HospitalProfile | null>(null);
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [donorsPool, setDonorsPool] = useState<DonorProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Active view tab
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'REQUESTS' | 'INVENTORY' | 'DONATIONS'>('DASHBOARD');

  // Search & Filtering for Requests
  const [requestSearch, setRequestSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('ALL');
  const [tableDensity, setTableDensity] = useState<'comfortable' | 'compact'>('comfortable');
  const [page, setPage] = useState(1);
  const itemsPerPage = 6;

  // Create Request Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [reqBloodGroup, setReqBloodGroup] = useState<BloodGroup>('O-');
  const [reqUnits, setReqUnits] = useState(2);
  const [reqUrgency, setReqUrgency] = useState<UrgencyLevel>('URGENT');
  const [reqRequiredHours, setReqRequiredHours] = useState(4);
  const [reqNotes, setReqNotes] = useState('');
  const [creatingRequest, setCreatingRequest] = useState(false);

  // Request Details & Matching Drawer
  const [selectedRequest, setSelectedRequest] = useState<BloodRequest | null>(null);
  const [requestMatches, setRequestMatches] = useState<MatchRecord[]>([]);
  const [dispatchingWave, setDispatchingWave] = useState(false);

  // Inventory Adjustment Modal
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);
  const [invActionType, setInvActionType] = useState<'ADJUST' | 'RESERVE' | 'RELEASE'>('ADJUST');
  const [invDelta, setInvDelta] = useState(1);
  const [invReason, setInvReason] = useState('Routine blood bank intake');
  const [invStaffName, setInvStaffName] = useState('Staff Nurse');
  const [processingInv, setProcessingInv] = useState(false);

  // Confirm Donation Modal
  const [confirmingDonation, setConfirmingDonation] = useState<DonationRecord | null>(null);
  const [donationStaff, setDonationStaff] = useState('Dr. Transfusion Officer');
  const [donationUnitsConfirmed, setDonationUnitsConfirmed] = useState(1);
  const [completingDonation, setCompletingDonation] = useState(false);

  useEffect(() => {
    loadHospitalData();
  }, [effectiveHospitalId]);

  const loadHospitalData = async () => {
    setLoading(true);
    try {
      let hosp = await getHospitalProfile(effectiveHospitalId);
      if (!hosp && authHosp) hosp = authHosp;
      if (hosp) setProfile(hosp);

      const [hospReqs, hospInv, hospTx, hospDonations, allDonors] = await Promise.all([
        getHospitalRequests(effectiveHospitalId),
        getHospitalInventory(effectiveHospitalId),
        getInventoryTransactions(effectiveHospitalId),
        getDonationsForHospital(effectiveHospitalId),
        getAllDonors()
      ]);

      setRequests(hospReqs || []);
      setInventory(hospInv || []);
      setTransactions(hospTx || []);
      setDonations(hospDonations || []);
      setDonorsPool(allDonors || []);
    } catch (err) {
      console.error('Error loading hospital portal:', err);
      toast.error('Unable to fetch clinical records from Firestore.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRequestDetails = async (req: BloodRequest) => {
    setSelectedRequest(req);
    try {
      const matches = await getMatchesForRequest(req.id);
      setRequestMatches(matches || []);
    } catch (err) {
      console.error('Failed to load request matches:', err);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingRequest(true);
    try {
      const deadline = new Date(Date.now() + reqRequiredHours * 60 * 60 * 1000).toISOString();
      const newReqData: Omit<BloodRequest, 'id'> = {
        hospitalId: profile?.userId || profile?.id || effectiveHospitalId,
        hospitalName: profile?.hospitalName || 'Accredited Medical Center',
        bloodGroup: reqBloodGroup,
        unitsRequired: Number(reqUnits),
        unitsFulfilled: 0,
        urgency: reqUrgency,
        status: 'MATCHING',
        requiredBy: deadline,
        hospitalCity: profile?.city || 'New York',
        hospitalAddress: profile?.address || 'Medical Plaza',
        latitude: profile?.latitude || 40.7128,
        longitude: profile?.longitude || -74.0060,
        contactPhone: profile?.phone || '+1 (555) 000-0000',
        notes: reqNotes,
        outreachWave: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const newId = await createBloodRequest(newReqData);
      const createdReq: BloodRequest = { id: newId, ...newReqData };

      // Automatically compute matches & dispatch Wave 1 (Top 5 Suitable Donors)
      const ranked = rankEligibleDonors(donorsPool, createdReq);
      const { wave1 } = partitionOutreachWaves(ranked);

      if (wave1.length > 0) {
        const matchesToCreate = wave1.map(sd => ({
          requestId: newId,
          hospitalId: createdReq.hospitalId,
          hospitalName: createdReq.hospitalName,
          donorId: sd.donor.userId || sd.donor.id,
          donorName: sd.donor.fullName,
          donorPhone: sd.donor.phone,
          requestedBloodGroup: createdReq.bloodGroup,
          donorBloodGroup: sd.donor.bloodGroup,
          urgency: createdReq.urgency,
          compatibilityScore: sd.scoreBreakdown.totalScore,
          scoreBreakdown: sd.scoreBreakdown,
          distanceKm: sd.scoreBreakdown.distanceKm,
          status: 'PENDING' as const,
          waveNumber: 1,
          deadline: createdReq.requiredBy,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));

        await createBatchMatches(matchesToCreate);
      }

      setIsCreateModalOpen(false);
      setReqNotes('');
      toast.success(
        `Blood requisition #${newId.slice(-6).toUpperCase()} broadcasted. Wave 1 alerts dispatched to ${wave1.length} candidates.`,
        'Requisition Active'
      );
      await loadHospitalData();
      handleOpenRequestDetails(createdReq);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create request');
    } finally {
      setCreatingRequest(false);
    }
  };

  const handleDispatchNextWave = async (waveNumber: number) => {
    if (!selectedRequest) return;
    setDispatchingWave(true);
    try {
      const alreadyContacted = new Set(requestMatches.map(m => m.donorId));
      const ranked = rankEligibleDonors(donorsPool, selectedRequest, alreadyContacted);
      const waves = partitionOutreachWaves(ranked);
      const targetWave = waveNumber === 2 ? waves.wave2 : waves.wave3;

      if (targetWave.length === 0) {
        toast.warning('No additional uncontacted compatible donors currently available for this wave.');
        return;
      }

      const matchesToCreate = targetWave.map(sd => ({
        requestId: selectedRequest.id,
        hospitalId: selectedRequest.hospitalId,
        hospitalName: selectedRequest.hospitalName,
        donorId: sd.donor.userId || sd.donor.id,
        donorName: sd.donor.fullName,
        donorPhone: sd.donor.phone,
        requestedBloodGroup: selectedRequest.bloodGroup,
        donorBloodGroup: sd.donor.bloodGroup,
        urgency: selectedRequest.urgency,
        compatibilityScore: sd.scoreBreakdown.totalScore,
        scoreBreakdown: sd.scoreBreakdown,
        distanceKm: sd.scoreBreakdown.distanceKm,
        status: 'PENDING' as const,
        waveNumber,
        deadline: selectedRequest.requiredBy,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      await createBatchMatches(matchesToCreate);
      toast.success(`Wave ${waveNumber} outreach dispatched to ${targetWave.length} candidate donors.`);
      await loadHospitalData();
      await handleOpenRequestDetails(selectedRequest);
    } catch (err: any) {
      toast.error(err.message || 'Failed to dispatch wave');
    } finally {
      setDispatchingWave(false);
    }
  };

  const handleCancelRequest = async (reqId: string) => {
    const reason = prompt('Please specify clinical cancellation reason (e.g. Patient stabilized, alternative blood unit acquired):');
    if (!reason) return;
    try {
      await cancelBloodRequest(
        reqId,
        profile?.userId || effectiveHospitalId,
        profile?.email || 'hospital@lifelink.org',
        reason
      );
      toast.info(`Requisition #${reqId.slice(-6).toUpperCase()} cancelled.`);
      await loadHospitalData();
      if (selectedRequest?.id === reqId) {
        setSelectedRequest(null);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel request');
    }
  };

  const handleInventoryAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInventoryItem) return;
    setProcessingInv(true);
    try {
      if (invActionType === 'ADJUST') {
        await adjustHospitalInventory({
          hospitalId: selectedInventoryItem.hospitalId,
          bloodGroup: selectedInventoryItem.bloodGroup,
          quantityDelta: Number(invDelta),
          type: invDelta > 0 ? 'DONATION_CREDIT' : 'DISPATCH_USE',
          reason: invReason,
          performedBy: invStaffName
        });
        toast.success(`Inventory updated for ${selectedInventoryItem.bloodGroup}: ${invDelta > 0 ? '+' : ''}${invDelta} unit(s).`);
      } else if (invActionType === 'RESERVE') {
        await reserveInventoryUnits(
          selectedInventoryItem.hospitalId,
          selectedInventoryItem.bloodGroup,
          Number(invDelta),
          invStaffName,
          invReason
        );
        toast.success(`Reserved ${invDelta} unit(s) of ${selectedInventoryItem.bloodGroup} for surgical holding.`);
      } else if (invActionType === 'RELEASE') {
        await releaseInventoryReservation(
          selectedInventoryItem.hospitalId,
          selectedInventoryItem.bloodGroup,
          Number(invDelta),
          invStaffName,
          invReason
        );
        toast.info(`Released ${invDelta} reserved unit(s) of ${selectedInventoryItem.bloodGroup} back to general pool.`);
      }

      setSelectedInventoryItem(null);
      await loadHospitalData();
    } catch (err: any) {
      toast.error(err.message || 'Inventory action failed');
    } finally {
      setProcessingInv(false);
    }
  };

  const handleConfirmDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmingDonation) return;
    setCompletingDonation(true);
    try {
      await confirmDonationCompletion(
        confirmingDonation.id,
        donationStaff,
        Number(donationUnitsConfirmed)
      );

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });

      toast.success(
        `Blood draw confirmed! ${donationUnitsConfirmed} unit(s) of ${confirmingDonation.bloodGroup} atomically credited to hospital blood bank.`,
        'Transfusion Verified'
      );

      setConfirmingDonation(null);
      await loadHospitalData();
    } catch (err: any) {
      toast.error(err.message || 'Donation confirmation failed');
    } finally {
      setCompletingDonation(false);
    }
  };

  // Calculations for summary metrics
  const openReqs = requests.filter(r => r.status === 'OPEN' || r.status === 'MATCHING');
  const criticalReqs = requests.filter(r => r.urgency === 'CRITICAL' && r.status !== 'CANCELLED' && r.status !== 'FULFILLED');
  const totalUnitsRequired = requests.reduce((sum, r) => sum + (r.unitsRequired || 0), 0);
  const totalUnitsFulfilled = requests.reduce((sum, r) => sum + (r.unitsFulfilled || 0), 0);
  const totalAvailableInventory = inventory.reduce((sum, i) => sum + (i.availableUnits || 0), 0);
  const scheduledArrivals = donations.filter(d => d.status === 'SCHEDULED');
  const criticalStockItems = inventory.filter(i => i.status === 'CRITICAL');

  // Filtered requests list
  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      const matchSearch =
        req.id.toLowerCase().includes(requestSearch.toLowerCase()) ||
        req.bloodGroup.toLowerCase().includes(requestSearch.toLowerCase()) ||
        (req.notes && req.notes.toLowerCase().includes(requestSearch.toLowerCase()));
      const matchStatus = statusFilter === 'ALL' || req.status === statusFilter;
      const matchUrgency = urgencyFilter === 'ALL' || req.urgency === urgencyFilter;
      return matchSearch && matchStatus && matchUrgency;
    });
  }, [requests, requestSearch, statusFilter, urgencyFilter]);

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage) || 1;
  const paginatedRequests = filteredRequests.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-28 glass-panel rounded-3xl animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-20 glass-panel rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-96 glass-panel rounded-3xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Verification Warning Banner if facility is unverified */}
      {profile?.verificationStatus === 'PENDING' && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 flex items-start space-x-3 shadow-sm backdrop-blur-md">
          <ShieldAlert className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs">
            <p className="font-bold text-sm text-white">Facility Licensing Verification Pending</p>
            <p className="mt-0.5 text-amber-200/80 leading-relaxed">
              Hospital credentialing record (#{profile.licenseNumber}) has been submitted and is currently being audited by the platform administrator. All internal features and test workflows are operational.
            </p>
          </div>
        </div>
      )}

      {/* Hospital Operations Command Header */}
      <div className="p-6 rounded-3xl glass-panel shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-white/10">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#351522] via-[#C62845] to-[#E63950] text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-[#E63950]/20 border border-white/20 flex-shrink-0">
            <Hospital className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Hospital Command Center
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                  profile?.verificationStatus === 'VERIFIED'
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                }`}
              >
                {profile?.verificationStatus || 'PENDING'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Facility: <span className="font-bold text-white">{profile?.hospitalName || 'Trauma Center'}</span> •{' '}
              Licence: <span className="font-mono text-slate-200">{profile?.licenseNumber}</span> •{' '}
              <span className="text-[#E63950] font-medium">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </p>
            <p className="text-[11px] text-slate-400">
              Monitor requests, donor responses and blood availability from one place.
            </p>
          </div>
        </div>

        {/* Primary Header Action Buttons */}
        <div className="flex items-center space-x-2.5 w-full sm:w-auto">
          <button
            onClick={() => {
              setReqUrgency('CRITICAL');
              setReqRequiredHours(2);
              setIsCreateModalOpen(true);
            }}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#B91C1C] to-[#8E1B1B] hover:opacity-90 text-white font-bold text-xs shadow-md shadow-red-950/50 transition-all flex items-center justify-center space-x-1.5 border border-red-500/30"
          >
            <Flame className="w-4 h-4 fill-white" />
            <span>Emergency Request</span>
          </button>

          <button
            onClick={() => {
              setReqUrgency('URGENT');
              setReqRequiredHours(4);
              setIsCreateModalOpen(true);
            }}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#C62845] to-[#E63950] hover:opacity-90 text-white font-bold text-xs shadow-md shadow-[#E63950]/30 transition-all flex items-center justify-center space-x-1.5 border border-white/20"
          >
            <Plus className="w-4 h-4" />
            <span>Create Blood Request</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards Grid (Section 7) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div
          onClick={() => {
            setActiveTab('REQUESTS');
            setStatusFilter('OPEN');
          }}
          className="p-4 rounded-2xl glass-panel-interactive shadow-sm cursor-pointer border border-white/10"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400">Open Requests</span>
            <Droplet className="w-4 h-4 text-[#E63950]" />
          </div>
          <p className="text-2xl font-black text-white mt-2">{openReqs.length}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Matching active</p>
        </div>

        <div
          onClick={() => {
            setActiveTab('REQUESTS');
            setUrgencyFilter('CRITICAL');
          }}
          className="p-4 rounded-2xl glass-panel-interactive shadow-sm cursor-pointer border border-red-500/30"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-red-300">Critical Emergencies</span>
            <AlertTriangle className="w-4 h-4 text-[#E63950]" />
          </div>
          <p className="text-2xl font-black text-[#E63950] mt-2">{criticalReqs.length}</p>
          <p className="text-[10px] text-red-300/80 font-semibold mt-0.5">Urgent OR priority</p>
        </div>

        <div
          onClick={() => setActiveTab('DONATIONS')}
          className="p-4 rounded-2xl glass-panel-interactive shadow-sm cursor-pointer border border-amber-500/20"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-300">Pending Arrivals</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-300 mt-2">{scheduledArrivals.length}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Awaiting draw</p>
        </div>

        <div className="p-4 rounded-2xl glass-panel shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400">Units Required</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-white mt-2">{totalUnitsRequired}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Total demand</p>
        </div>

        <div className="p-4 rounded-2xl glass-panel shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-400">Units Fulfilled</span>
            <CheckCircle2 className="w-4 h-4 text-[#16845B]" />
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-2">{totalUnitsFulfilled}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {totalUnitsRequired > 0 ? Math.round((totalUnitsFulfilled / totalUnitsRequired) * 100) : 0}% fulfillment
          </p>
        </div>

        <div
          onClick={() => setActiveTab('INVENTORY')}
          className="p-4 rounded-2xl glass-panel-interactive shadow-sm cursor-pointer border border-white/10"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400">Blood Inventory</span>
            <PackageCheck className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-black text-white mt-2">{totalAvailableInventory} U</p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {criticalStockItems.length > 0 ? `${criticalStockItems.length} low groups` : 'All groups stable'}
          </p>
        </div>
      </div>

      {/* Main Hospital Navigation Tabs */}
      <div className="glass-panel rounded-2xl px-3 pt-3 flex border-b border-white/10 space-x-4 text-xs font-bold overflow-x-auto shadow-sm">
        <button
          onClick={() => setActiveTab('DASHBOARD')}
          className={`pb-3 px-2 border-b-2 transition-colors flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'DASHBOARD'
              ? 'border-[#E63950] text-[#E63950]'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Operations Command</span>
        </button>

        <button
          onClick={() => setActiveTab('REQUESTS')}
          className={`pb-3 px-2 border-b-2 transition-colors flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'REQUESTS'
              ? 'border-[#E63950] text-[#E63950]'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Droplet className="w-4 h-4" />
          <span>Active Requisitions ({requests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('INVENTORY')}
          className={`pb-3 px-2 border-b-2 transition-colors flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'INVENTORY'
              ? 'border-[#E63950] text-[#E63950]'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <PackageCheck className="w-4 h-4" />
          <span>Blood Bank Inventory ({totalAvailableInventory} Units)</span>
        </button>

        <button
          onClick={() => setActiveTab('DONATIONS')}
          className={`pb-3 px-2 border-b-2 transition-colors flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'DONATIONS'
              ? 'border-[#E63950] text-[#E63950]'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Arrivals & Draws ({scheduledArrivals.length})</span>
        </button>
      </div>

      {/* VIEW 1: OPERATIONS COMMAND OVERVIEW */}
      {activeTab === 'DASHBOARD' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2 spans): Active Requisitions & Critical Alert Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Critical Emergency Requisitions Box */}
            {criticalReqs.length > 0 && (
              <div className="p-5 rounded-3xl glass-panel-burgundy shadow-lg border border-red-500/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="p-1.5 rounded-lg bg-red-950/80 border border-red-500/30 text-[#E63950]">
                      <AlertTriangle className="w-4 h-4 animate-pulse" />
                    </span>
                    <h3 className="text-sm font-bold text-white">Immediate Critical Requisitions</h3>
                  </div>
                  <span className="text-[11px] font-bold text-[#E63950] uppercase tracking-wider">
                    Live Response Countdown
                  </span>
                </div>

                <div className="space-y-3">
                  {criticalReqs.map(req => (
                    <div
                      key={req.id}
                      className="p-4 rounded-2xl bg-[#101827]/80 border border-red-500/25 flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#C62845] text-white">
                            {req.bloodGroup}
                          </span>
                          <span className="text-xs font-bold text-white">
                            {req.unitsRequired} Unit(s) Needed (OR Phase 1)
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 line-clamp-1">{req.notes || 'Emergency surgical requirement'}</p>
                      </div>

                      <button
                        onClick={() => handleOpenRequestDetails(req)}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#C62845] to-[#E63950] hover:opacity-90 text-white text-xs font-bold shadow-md whitespace-nowrap"
                      >
                        Match Console →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Active Requests Table preview */}
            <div className="p-6 rounded-3xl glass-panel shadow-sm border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white">Current Blood Requisitions</h3>
                <button
                  onClick={() => setActiveTab('REQUESTS')}
                  className="text-xs font-bold text-[#E63950] hover:underline"
                >
                  View All ({requests.length}) →
                </button>
              </div>

              {requests.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No active requests. Click "Create Blood Request" above to initiate a requisition.
                </div>
              ) : (
                <div className="divide-y divide-white/10 text-xs">
                  {requests.slice(0, 4).map(req => (
                    <div key={req.id} className="py-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-[#E63950]">{req.bloodGroup}</span>
                          <span className="font-bold text-white">Req #{req.id.slice(-6).toUpperCase()}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                              req.urgency === 'CRITICAL'
                                ? 'bg-red-950/80 text-rose-300 border border-red-500/30'
                                : req.urgency === 'URGENT'
                                ? 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {req.urgency}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {req.unitsFulfilled || 0} of {req.unitsRequired} fulfilled • Wave #{req.outreachWave || 1}
                        </p>
                      </div>

                      <button
                        onClick={() => handleOpenRequestDetails(req)}
                        className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold border border-white/10 text-[11px]"
                      >
                        Details
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Inventory Transactions Activity */}
            <div className="p-6 rounded-3xl glass-panel shadow-sm border border-white/10">
              <h3 className="text-sm font-bold text-white mb-4">Recent Blood Bank Activity Ledger</h3>
              <div className="divide-y divide-white/10 text-xs">
                {transactions.slice(0, 5).map(tx => (
                  <div key={tx.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white">
                        {tx.type === 'DONATION_CREDIT' ? 'Intake / Donation Drawn' : tx.type} ({tx.bloodGroup})
                      </p>
                      <p className="text-[11px] text-slate-400">{tx.reason} • Staff: {tx.performedBy}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-white">
                        {tx.type.includes('DISPATCH') || tx.type.includes('RESERVATION') ? '-' : '+'}
                        {tx.quantity} U
                      </span>
                      <p className="text-[10px] text-slate-400">{new Date(tx.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column (1 span): Inventory Quick Status & Scheduled Arrivals */}
          <div className="space-y-6">
            {/* Quick Inventory Gauges */}
            <div className="p-6 rounded-3xl glass-panel shadow-sm border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white">Blood Bank Unit Levels</h3>
                <button
                  onClick={() => setActiveTab('INVENTORY')}
                  className="text-xs font-bold text-[#E63950] hover:underline"
                >
                  Manage →
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {inventory.map(item => (
                  <div
                    key={item.bloodGroup}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                      item.status === 'CRITICAL'
                        ? 'bg-red-950/40 border-red-500/30'
                        : item.status === 'LOW'
                        ? 'bg-amber-950/40 border-amber-500/30'
                        : 'bg-[#101827]/70 border-white/10'
                    }`}
                  >
                    <div>
                      <span className="font-mono font-bold text-sm text-white">{item.bloodGroup}</span>
                      <p className="text-[10px] text-slate-400">{item.reservedUnits} reserved</p>
                    </div>
                    <span
                      className={`font-mono font-extrabold text-base ${
                        item.status === 'CRITICAL'
                          ? 'text-[#E63950]'
                          : item.status === 'LOW'
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {item.availableUnits}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Scheduled Donor Arrivals */}
            <div className="p-6 rounded-3xl glass-panel shadow-sm border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white">Upcoming Blood Draws</h3>
                <span className="text-[11px] font-bold text-emerald-400">{scheduledArrivals.length} Confirmed</span>
              </div>

              {scheduledArrivals.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No donors currently booked for arrival.</p>
              ) : (
                <div className="space-y-3">
                  {scheduledArrivals.map(don => (
                    <div key={don.id} className="p-3.5 rounded-xl bg-[#101827]/70 border border-white/10 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-white">{don.donorName}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#351522] text-[#E63950] border border-red-500/30">
                          {don.bloodGroup}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300">{don.notes || 'Accepted from matching wave'}</p>
                      <button
                        onClick={() => setConfirmingDonation(don)}
                        className="mt-2 w-full py-1.5 rounded-lg bg-[#16845B] hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center justify-center space-x-1"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>Confirm Unit Drawn</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: ACTIVE REQUISITIONS TABLE */}
      {activeTab === 'REQUESTS' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl glass-panel shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs border border-white/10">
            <div className="flex items-center space-x-2 flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={requestSearch}
                onChange={e => {
                  setRequestSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search requisitions by ID, blood group or notes..."
                className="w-full bg-transparent border-none text-xs text-white focus:outline-none placeholder-slate-400"
              />
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={urgencyFilter}
                onChange={e => {
                  setUrgencyFilter(e.target.value);
                  setPage(1);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-[#101827] border border-white/10 text-white font-medium"
              >
                <option value="ALL">All Urgencies</option>
                <option value="CRITICAL">Critical Priority</option>
                <option value="URGENT">Urgent</option>
                <option value="NORMAL">Normal</option>
              </select>

              <select
                value={statusFilter}
                onChange={e => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-[#101827] border border-white/10 text-white font-medium"
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="MATCHING">Matching</option>
                <option value="FULFILLED">Fulfilled</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              <button
                onClick={() => setTableDensity(tableDensity === 'comfortable' ? 'compact' : 'comfortable')}
                className="p-1.5 rounded-xl bg-[#101827] border border-white/10 text-slate-300 hover:text-white"
                title="Toggle Density"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="glass-panel rounded-3xl border border-white/10 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#101827]/80 border-b border-white/10 text-slate-400 font-bold">
                    <th className="py-3 px-4">Requisition ID</th>
                    <th className="py-3 px-4">Blood Group</th>
                    <th className="py-3 px-4">Units (Req/Done)</th>
                    <th className="py-3 px-4">Urgency</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Deadline</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {paginatedRequests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No matching blood requisitions found.
                      </td>
                    </tr>
                  ) : (
                    paginatedRequests.map(req => (
                      <tr key={req.id} className="hover:bg-white/5 transition-colors">
                        <td className={`px-4 font-mono font-bold text-white ${tableDensity === 'compact' ? 'py-2' : 'py-3.5'}`}>
                          #{req.id.slice(-6).toUpperCase()}
                        </td>
                        <td className="px-4 font-black font-mono text-sm text-[#E63950]">
                          {req.bloodGroup}
                        </td>
                        <td className="px-4 text-slate-200">
                          <span className="font-bold text-white">{req.unitsFulfilled || 0}</span> / {req.unitsRequired} Units
                        </td>
                        <td className="px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              req.urgency === 'CRITICAL'
                                ? 'bg-red-950/80 text-rose-300 border border-red-500/30'
                                : req.urgency === 'URGENT'
                                ? 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {req.urgency}
                          </span>
                        </td>
                        <td className="px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              req.status === 'FULFILLED'
                                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                                : req.status === 'CANCELLED'
                                ? 'bg-slate-800 text-slate-400'
                                : 'bg-blue-950/80 text-blue-300 border border-blue-500/30'
                            }`}
                          >
                            {req.status}
                          </span>
                        </td>
                        <td className="px-4 text-slate-300 whitespace-nowrap">
                          {new Date(req.requiredBy).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-4 text-right space-x-1.5 whitespace-nowrap">
                          {req.status !== 'CANCELLED' && req.status !== 'FULFILLED' && (
                            <button
                              onClick={() => handleCancelRequest(req.id)}
                              className="px-2 py-1 rounded text-rose-400 hover:bg-rose-950/30 font-semibold"
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenRequestDetails(req)}
                            className="px-3 py-1 rounded-lg bg-[#C62845] hover:bg-[#E63950] text-white font-bold"
                          >
                            Console
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
              <span>
                Showing page {page} of {totalPages} ({filteredRequests.length} requisitions)
              </span>
              <div className="flex items-center space-x-1.5">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="p-1 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="p-1 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: INVENTORY */}
      {activeTab === 'INVENTORY' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-base font-bold text-white">Blood Bank On-Site Stock Management</h2>
              <p className="text-xs text-slate-400">8 ABO/Rh categories with atomic transactional auditing</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {inventory.map(item => (
              <div
                key={item.bloodGroup}
                className="p-5 rounded-2xl glass-panel shadow-sm relative overflow-hidden border border-white/10"
              >
                <div
                  className={`absolute top-0 left-0 right-0 h-1 ${
                    item.status === 'CRITICAL'
                      ? 'bg-[#B91C1C]'
                      : item.status === 'LOW'
                      ? 'bg-[#D97706]'
                      : 'bg-[#16845B]'
                  }`}
                />
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl font-black text-white font-mono">{item.bloodGroup}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.status === 'CRITICAL'
                        ? 'bg-red-950/80 text-rose-300 border border-red-500/30'
                        : item.status === 'LOW'
                        ? 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Available:</span>
                    <span className="font-mono font-bold text-white text-sm">{item.availableUnits} U</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Reserved:</span>
                    <span className="font-mono font-semibold text-amber-300">{item.reservedUnits} U</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedInventoryItem(item);
                      setInvActionType('ADJUST');
                    }}
                    className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-white border border-white/10"
                  >
                    Adjust
                  </button>
                  <button
                    onClick={() => {
                      setSelectedInventoryItem(item);
                      setInvActionType('RESERVE');
                    }}
                    className="flex-1 py-1.5 rounded-lg bg-[#C62845]/20 hover:bg-[#C62845]/30 text-[#E63950] text-xs font-bold border border-[#C62845]/30"
                  >
                    Reserve
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Full Transaction Audit History */}
          <div className="p-6 rounded-3xl glass-panel shadow-sm border border-white/10">
            <h3 className="text-sm font-bold text-white mb-4">Complete Inventory Transaction Audit Trail</h3>
            <div className="divide-y divide-white/10 text-xs">
              {transactions.map(tx => (
                <div key={tx.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-black text-sm text-[#E63950]">{tx.bloodGroup}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#101827] text-white border border-white/10">
                        {tx.type}
                      </span>
                      <span className="text-slate-200 font-medium">{tx.reason}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">Staff: {tx.performedBy}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-black text-white">
                      {tx.type.includes('DISPATCH') || tx.type.includes('RESERVATION') ? '-' : '+'}
                      {tx.quantity} Units
                    </span>
                    <p className="text-[10px] text-slate-400">{new Date(tx.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: ARRIVALS & BLOOD DRAWS */}
      {activeTab === 'DONATIONS' && (
        <div className="space-y-4">
          <div className="p-6 rounded-3xl glass-panel shadow-sm border border-white/10">
            <h3 className="text-sm font-bold text-white mb-4">Scheduled Transfusions & Arrival Records</h3>
            {donations.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No donor arrivals recorded.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {donations.map(don => (
                  <div key={don.id} className="p-5 rounded-2xl bg-[#101827]/80 border border-white/10 text-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          don.status === 'COMPLETED'
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {don.status}
                      </span>
                      <span className="text-slate-400 font-mono">
                        {new Date(don.scheduledDate).toLocaleDateString()}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-white">{don.donorName}</h4>
                      <p className="text-slate-300 mt-0.5">
                        Group: <strong className="text-[#E63950] font-mono">{don.bloodGroup}</strong> • {don.unitsDonated} Unit(s)
                      </p>
                      {don.confirmedByStaff && (
                        <p className="text-[11px] text-emerald-400 mt-1 font-medium">
                          Verified draw by: {don.confirmedByStaff}
                        </p>
                      )}
                    </div>

                    {don.status === 'SCHEDULED' && (
                      <button
                        onClick={() => setConfirmingDonation(don)}
                        className="w-full py-2 rounded-xl bg-[#16845B] hover:bg-emerald-700 text-white font-bold transition-all shadow-sm"
                      >
                        Confirm Blood Drawn & Credit Stock
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE BLOOD REQUEST MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#162032] border border-white/15 rounded-3xl p-6 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <span className="w-8 h-8 rounded-xl bg-[#C62845]/20 text-[#E63950] flex items-center justify-center">
                  <Droplet className="w-4 h-4 fill-[#E63950]" />
                </span>
                <h3 className="text-base font-bold text-white">New Blood Requisition</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-200 mb-1">Required Blood Group</label>
                  <select
                    value={reqBloodGroup}
                    onChange={e => setReqBloodGroup(e.target.value as BloodGroup)}
                    className="w-full px-3 py-2 rounded-xl bg-[#101827] border border-white/10 text-white font-black font-mono text-sm"
                  >
                    {ALL_BLOOD_GROUPS.map(bg => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-200 mb-1">Units Required</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    required
                    value={reqUnits}
                    onChange={e => setReqUnits(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#101827] border border-white/10 text-white font-bold text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-200 mb-1">Urgency Priority</label>
                  <select
                    value={reqUrgency}
                    onChange={e => setReqUrgency(e.target.value as UrgencyLevel)}
                    className="w-full px-3 py-2 rounded-xl bg-[#101827] border border-white/10 text-white font-bold"
                  >
                    <option value="CRITICAL">CRITICAL (Massive Transfusion OR)</option>
                    <option value="URGENT">URGENT (Surgery / ICU)</option>
                    <option value="NORMAL">NORMAL (Routine Transfusion)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-200 mb-1">Response Window</label>
                  <select
                    value={reqRequiredHours}
                    onChange={e => setReqRequiredHours(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#101827] border border-white/10 text-white font-bold"
                  >
                    <option value={2}>2 Hours (Immediate Critical)</option>
                    <option value={4}>4 Hours (Emergency OR)</option>
                    <option value={12}>12 Hours (Today)</option>
                    <option value={24}>24 Hours (Next Day)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-200 mb-1">Clinical Department / Notes</label>
                <textarea
                  rows={2}
                  value={reqNotes}
                  onChange={e => setReqNotes(e.target.value)}
                  placeholder="e.g. Acute vascular injury OR 3, patient ABO confirmed."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#101827] border border-white/10 text-white placeholder-slate-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-[11px] text-rose-300 leading-relaxed">
                ⚡ <strong>Smart Wave 1 Outreach:</strong> Creating this requisition automatically calculates compatibility and proximity across registered donors and alerts the top 5 candidates.
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingRequest}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#C62845] to-[#E63950] text-white font-bold shadow-md shadow-red-950/50"
                >
                  {creatingRequest ? 'Broadcasting...' : 'Broadcast Requisition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SMART MATCHING CONSOLE DRAWER */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-end p-0 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl h-full bg-[#162032] border-l border-white/15 shadow-2xl p-6 overflow-y-auto flex flex-col justify-between text-white">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div>
                  <span className="text-[10px] font-bold text-[#E63950] uppercase tracking-wider">
                    Smart Match Console
                  </span>
                  <h2 className="text-xl font-black text-white mt-0.5">
                    Requisition #{selectedRequest.id.slice(-6).toUpperCase()} ({selectedRequest.bloodGroup})
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="my-4 p-4 rounded-2xl bg-[#101827] border border-white/10 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Units Required:</span>
                  <span className="font-bold text-white">{selectedRequest.unitsRequired}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Units Fulfilled:</span>
                  <span className="font-bold text-emerald-400">{selectedRequest.unitsFulfilled || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Urgency Level:</span>
                  <span className="font-bold text-[#E63950]">{selectedRequest.urgency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Response Target:</span>
                  <span className="font-mono text-amber-300 font-bold">
                    {new Date(selectedRequest.requiredBy).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Contacted Donors list */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Contacted Candidates ({requestMatches.length})
                  </h3>
                  <button
                    onClick={() => handleDispatchNextWave(2)}
                    disabled={dispatchingWave}
                    className="px-3 py-1 rounded-lg bg-[#C62845] hover:bg-[#E63950] text-white text-[11px] font-bold flex items-center space-x-1"
                  >
                    <Send className="w-3 h-3" />
                    <span>{dispatchingWave ? 'Sending...' : 'Dispatch Wave 2 (Next 10)'}</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {requestMatches.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">No candidates alerted yet.</p>
                  ) : (
                    requestMatches.map(m => (
                      <div
                        key={m.id}
                        className="p-3.5 rounded-xl bg-[#101827] border border-white/10 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-white">{m.donorName}</span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#351522] text-[#E63950] border border-red-500/30">
                              {m.donorBloodGroup}
                            </span>
                            <span className="text-slate-400">
                              {m.distanceKm !== null ? `~${m.distanceKm} km away` : ''}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#E63950] mt-0.5 font-medium">
                            Score: {m.compatibilityScore}/100 • Wave #{m.waveNumber}
                          </p>
                          {m.declineReason && (
                            <p className="text-[10px] text-rose-400 mt-0.5">
                              Declined: "{m.declineReason}"
                            </p>
                          )}
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            m.status === 'ACCEPTED'
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                              : m.status === 'DECLINED'
                              ? 'bg-red-950/80 text-rose-300 border border-red-500/30'
                              : 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {m.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 text-[11px] text-slate-400 leading-relaxed">
              {MEDICAL_DISCLAIMER_TEXT}
            </div>
          </div>
        </div>
      )}

      {/* INVENTORY ADJUST / RESERVE MODAL */}
      {selectedInventoryItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[#162032] border border-white/15 rounded-3xl p-6 shadow-2xl text-white">
            <h3 className="text-base font-bold text-white mb-2">
              {invActionType === 'ADJUST' && `Adjust Stock: ${selectedInventoryItem.bloodGroup}`}
              {invActionType === 'RESERVE' && `Reserve Units: ${selectedInventoryItem.bloodGroup}`}
              {invActionType === 'RELEASE' && `Release Units: ${selectedInventoryItem.bloodGroup}`}
            </h3>
            <form onSubmit={handleInventoryAction} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  {invActionType === 'ADJUST' ? 'Quantity Change (+/-)' : 'Units to Allocate'}
                </label>
                <input
                  type="number"
                  required
                  value={invDelta}
                  onChange={e => setInvDelta(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-[#101827] border border-white/10 text-white font-mono font-bold text-sm"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Current Available: {selectedInventoryItem.availableUnits} • Reserved: {selectedInventoryItem.reservedUnits}
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Clinical Reason</label>
                <input
                  type="text"
                  required
                  value={invReason}
                  onChange={e => setInvReason(e.target.value)}
                  placeholder="e.g. Surgical holding reserve"
                  className="w-full px-3 py-2 rounded-xl bg-[#101827] border border-white/10 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Attending Staff Name</label>
                <input
                  type="text"
                  required
                  value={invStaffName}
                  onChange={e => setInvStaffName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#101827] border border-white/10 text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedInventoryItem(null)}
                  className="px-3 py-2 rounded-xl bg-white/5 text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingInv}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#C62845] to-[#E63950] text-white font-bold shadow-md shadow-red-950/40"
                >
                  {processingInv ? 'Updating...' : 'Commit Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM COMPLETED DONATION DRAW MODAL */}
      {confirmingDonation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[#162032] border border-white/15 rounded-3xl p-6 shadow-2xl text-white">
            <h3 className="text-base font-bold text-white mb-1">Verify Completed Blood Draw</h3>
            <p className="text-xs text-slate-300 mb-4">
              Authorized completion atomically credits hospital inventory, issues certificate, and advances request fulfillment.
            </p>
            <form onSubmit={handleConfirmDonation} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Donor Name</label>
                <input
                  type="text"
                  disabled
                  value={confirmingDonation.donorName}
                  className="w-full px-3 py-2 rounded-xl bg-[#101827] border border-white/10 text-slate-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Blood Group</label>
                  <input
                    type="text"
                    disabled
                    value={confirmingDonation.bloodGroup}
                    className="w-full px-3 py-2 rounded-xl bg-[#101827] border border-white/10 text-[#E63950] font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Units Drawn</label>
                  <input
                    type="number"
                    min={1}
                    max={2}
                    value={donationUnitsConfirmed}
                    onChange={e => setDonationUnitsConfirmed(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#101827] border border-white/10 text-white font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-300 font-bold mb-1">Attending Clinical Staff Name</label>
                <input
                  type="text"
                  required
                  value={donationStaff}
                  onChange={e => setDonationStaff(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#101827] border border-white/10 text-white"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmingDonation(null)}
                  className="px-3 py-2 rounded-xl bg-white/5 text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={completingDonation}
                  className="px-4 py-2 rounded-xl bg-[#16845B] hover:bg-emerald-700 text-white font-bold"
                >
                  {completingDonation ? 'Authorizing...' : 'Authorize Transfusion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
