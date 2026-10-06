import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  getDonorProfile,
  saveDonorProfile,
  updateDonorAvailability,
  getMatchesForDonor,
  respondToMatch,
  getDonationsForDonor
} from '../../lib/dbService';
import { DonorProfile, MatchRecord, DonationRecord, AvailabilityStatus, BloodGroup } from '../../types';
import { ALL_BLOOD_GROUPS, MEDICAL_DISCLAIMER_TEXT } from '../../lib/compatibility';
import {
  Heart,
  Droplet,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Award,
  Calendar,
  Phone,
  ShieldCheck,
  RefreshCw,
  Navigation,
  FileCheck,
  User,
  Sparkles,
  Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const DonorPortal: React.FC = () => {
  const { user, donorProfile: authDonor, activeSimulatedId, refreshProfiles } = useAuth();
  const toast = useToast();
  const effectiveDonorId = activeSimulatedId || user?.uid || 'donor_marcus_chen';

  const [profile, setProfile] = useState<DonorProfile | null>(null);
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingResponse, setSubmittingResponse] = useState<string | null>(null);

  // Profile Edit modal
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editBloodGroup, setEditBloodGroup] = useState<BloodGroup>('O+');
  const [editCity, setEditCity] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsCoordinates, setGpsCoordinates] = useState<{ lat?: number; lon?: number }>({});

  // Decline modal state
  const [decliningMatch, setDecliningMatch] = useState<MatchRecord | null>(null);
  const [declineReason, setDeclineReason] = useState('Schedule conflict');

  // Certificate Modal
  const [selectedCertificate, setSelectedCertificate] = useState<DonationRecord | null>(null);

  const [activeTab, setActiveTab] = useState<'MATCHES' | 'HISTORY'>('MATCHES');

  useEffect(() => {
    loadDonorData();
  }, [effectiveDonorId]);

  const loadDonorData = async () => {
    setLoading(true);
    try {
      let donor = await getDonorProfile(effectiveDonorId);
      if (!donor && user) {
        // If not found in firestore, initialize default
        donor = {
          id: effectiveDonorId,
          userId: effectiveDonorId,
          fullName: user.displayName || 'Volunteer Donor',
          email: user.email || '',
          phone: '',
          bloodGroup: 'O+',
          city: 'Metropolitan Area',
          availabilityStatus: 'AVAILABLE',
          totalDonations: 0,
          isVerified: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }

      if (donor) {
        setProfile(donor);
        setEditFullName(donor.fullName);
        setEditBloodGroup(donor.bloodGroup);
        setEditCity(donor.city);
        setEditPhone(donor.phone || '');
        if (donor.latitude) {
          setGpsCoordinates({ lat: donor.latitude, lon: donor.longitude });
        }
      }

      // Fetch matches and donation records for donor
      const [allMatches, allDonations] = await Promise.all([
        getMatchesForDonor(effectiveDonorId),
        getDonationsForDonor(effectiveDonorId)
      ]);

      setMatches(allMatches || []);
      setDonations(allDonations || []);
    } catch (err) {
      console.error('Error loading donor profile:', err);
      toast.error('Unable to fetch donor records.');
    } finally {
      setLoading(false);
    }
  };

  const handleAvailabilityChange = async (newStatus: AvailabilityStatus) => {
    if (!profile) return;
    try {
      await updateDonorAvailability(profile.userId || profile.id || effectiveDonorId, newStatus);
      setProfile({ ...profile, availabilityStatus: newStatus });
      toast.success(
        `Availability status changed to ${newStatus === 'AVAILABLE' ? 'Available for emergency requisitions' : 'Temporarily Unavailable'}.`
      );
    } catch (err: any) {
      toast.error(err.message || 'Failed to update availability');
    }
  };

  const handleGpsDetection = () => {
    setDetectingGps(true);
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      setDetectingGps(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      pos => {
        setGpsCoordinates({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude
        });
        toast.success(`Coordinates captured: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        setDetectingGps(false);
      },
      err => {
        toast.warning('Could not acquire GPS fix. You can still save your metropolitan city.');
        setDetectingGps(false);
      },
      { timeout: 8000 }
    );
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    try {
      const updated: DonorProfile = {
        ...profile,
        fullName: editFullName,
        bloodGroup: editBloodGroup,
        city: editCity,
        phone: editPhone,
        latitude: gpsCoordinates.lat,
        longitude: gpsCoordinates.lon,
        updatedAt: new Date().toISOString()
      };

      await saveDonorProfile(updated);
      setProfile(updated);
      setIsEditingProfile(false);
      toast.success('Donor profile updated with location parameters.');
      await refreshProfiles();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save profile');
    }
  };

  const handleAcceptMatch = async (match: MatchRecord) => {
    setSubmittingResponse(match.id);
    try {
      await respondToMatch(
        match.id,
        profile?.userId || profile?.id || effectiveDonorId,
        profile?.fullName || 'Volunteer Donor',
        'ACCEPTED'
      );

      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.6 }
      });

      toast.success(
        `Thank you for accepting! Hospital staff at ${match.hospitalName} has been alerted for your arrival.`,
        'Rescue Match Confirmed'
      );

      await loadDonorData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to accept requisition');
    } finally {
      setSubmittingResponse(null);
    }
  };

  const handleDeclineMatchSubmit = async () => {
    if (!decliningMatch) return;
    setSubmittingResponse(decliningMatch.id);
    try {
      await respondToMatch(
        decliningMatch.id,
        profile?.userId || profile?.id || effectiveDonorId,
        profile?.fullName || 'Volunteer Donor',
        'DECLINED',
        declineReason
      );
      toast.info('Response logged. The hospital engine will escalate outreach to the next candidate.');
      setDecliningMatch(null);
      await loadDonorData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit response');
    } finally {
      setSubmittingResponse(null);
    }
  };

  const pendingMatches = matches.filter(m => m.status === 'PENDING');
  const pastMatches = matches.filter(m => m.status !== 'PENDING');

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 glass-panel rounded-3xl animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 glass-panel rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-80 glass-panel rounded-3xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Donor Profile Header with Dark Command Center Aesthetic */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-white/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center space-x-4 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#351522] via-[#C62845] to-[#E63950] border border-white/20 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-red-950/40 flex-shrink-0 font-mono">
            {profile?.bloodGroup || 'O+'}
          </div>
          <div>
            <div className="flex items-center space-x-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {profile?.fullName || 'Registered Donor'}
              </h1>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950/70 text-emerald-300 border border-emerald-500/40">
                ACTIVE REGISTRY
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 flex items-center space-x-2">
              <MapPin className="w-3.5 h-3.5 text-[#E63950]" />
              <span>{profile?.city || 'New York, NY'}</span>
              {profile?.latitude && (
                <span className="text-[#E63950] font-mono text-[11px]">
                  (GPS: {profile.latitude.toFixed(2)}, {profile.longitude?.toFixed(2)})
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Availability Switcher & Profile Edit */}
        <div className="flex items-center space-x-2.5 flex-wrap gap-2 relative z-10">
          <div className="flex items-center p-1 rounded-xl bg-white/5 border border-white/10">
            <button
              onClick={() => handleAvailabilityChange('AVAILABLE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                profile?.availabilityStatus === 'AVAILABLE'
                  ? 'bg-gradient-to-r from-[#16845B] to-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Available
            </button>
            <button
              onClick={() => handleAvailabilityChange('TEMPORARILY_UNAVAILABLE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                profile?.availabilityStatus === 'TEMPORARILY_UNAVAILABLE'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Unavailable
            </button>
          </div>

          <button
            onClick={() => setIsEditingProfile(true)}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold border border-white/10 transition-colors"
          >
            Edit Profile & GPS
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl glass-panel border border-white/10 shadow-sm">
          <p className="text-xs text-slate-400 font-medium">Pending Requisitions</p>
          <p className="text-2xl font-black text-[#E63950] mt-1 font-mono">{pendingMatches.length}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Awaiting your response</p>
        </div>
        <div className="p-4 rounded-2xl glass-panel border border-emerald-500/30 shadow-sm">
          <p className="text-xs text-slate-400 font-medium">Completed Donations</p>
          <p className="text-2xl font-black text-emerald-400 mt-1 font-mono">{profile?.totalDonations || 0}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Hospital verified blood draws</p>
        </div>
        <div className="p-4 rounded-2xl glass-panel border border-white/10 shadow-sm">
          <p className="text-xs text-slate-400 font-medium">Last Donation Date</p>
          <p className="text-sm font-bold text-white mt-2 font-mono">
            {profile?.lastDonationDate
              ? new Date(profile.lastDonationDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
              : 'None recorded'}
          </p>
          <p className="text-[10px] text-emerald-400 mt-0.5 font-semibold">≥90-day recovery window</p>
        </div>
        <div className="p-4 rounded-2xl glass-panel border border-amber-500/30 shadow-sm">
          <p className="text-xs text-slate-400 font-medium">Donor Recognition</p>
          <div className="flex items-center space-x-1.5 mt-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-black text-amber-300">
              {(profile?.totalDonations || 0) >= 5 ? 'Gold Guardian' : 'Active Rescuer'}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Certified digital record</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="glass-panel rounded-2xl border border-white/10 px-3 pt-3 flex border-b space-x-2 sm:space-x-4 text-xs font-bold shadow-sm overflow-x-auto">
        <button
          onClick={() => setActiveTab('MATCHES')}
          className={`pb-3 px-3 border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'MATCHES'
              ? 'border-[#E63950] text-[#E63950]'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <span>Pending Match Requests ({pendingMatches.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`pb-3 px-3 border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'HISTORY'
              ? 'border-[#E63950] text-[#E63950]'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <span>Verified Transfusions & Certificates ({donations.length})</span>
        </button>
      </div>

      {/* TAB 1: MATCH REQUESTS */}
      {activeTab === 'MATCHES' && (
        <div className="space-y-4">
          {pendingMatches.length === 0 ? (
            <div className="p-12 text-center rounded-3xl glass-panel border border-white/10 shadow-xl">
              <Heart className="w-10 h-10 mx-auto text-slate-500 mb-3" />
              <h3 className="text-base font-bold text-white">No Pending Requisitions</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
                You are currently marked as {profile?.availabilityStatus}. When an accredited hospital within your region requisitions your compatible blood type, priority alerts will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {pendingMatches.map(match => (
                <div
                  key={match.id}
                  className="p-6 rounded-3xl glass-panel border border-white/10 shadow-xl relative overflow-hidden transition-all hover:border-[#E63950]/40"
                >
                  <div
                    className={`absolute top-0 left-0 right-0 h-1.5 ${
                      match.urgency === 'CRITICAL'
                        ? 'bg-gradient-to-r from-[#B91C1C] via-[#E63950] to-[#B91C1C]'
                        : 'bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600'
                    }`}
                  />

                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pt-1">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                            match.urgency === 'CRITICAL'
                              ? 'bg-red-950/70 text-[#E63950] border border-red-500/40'
                              : 'bg-amber-950/70 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          {match.urgency} Priority
                        </span>
                        <span className="px-2 py-0.5 rounded bg-white/5 text-slate-300 text-xs font-mono font-semibold border border-white/10">
                          Wave #{match.waveNumber}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          Ref #{match.requestId.slice(-6).toUpperCase()}
                        </span>
                      </div>

                      <h3 className="text-lg font-black text-white">{match.hospitalName}</h3>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                        <span className="flex items-center space-x-1">
                          <Droplet className="w-3.5 h-3.5 text-[#E63950]" />
                          <span>Required: <strong className="text-white font-mono">{match.requestedBloodGroup}</strong></span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{match.distanceKm !== null ? `~${match.distanceKm} km away` : 'Metropolitan region'}</span>
                        </span>
                        <span className="flex items-center space-x-1 text-amber-300 font-semibold">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Respond by: {new Date(match.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </span>
                      </div>

                      {/* 100-Point Score Pills */}
                      <div className="pt-2 flex flex-wrap gap-2 text-[10px]">
                        <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300">
                          Compatibility: <strong className="text-white font-mono">{match.scoreBreakdown?.compatibility || 40}/40</strong>
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300">
                          Availability: <strong className="text-white font-mono">{match.scoreBreakdown?.availability || 20}/20</strong>
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300">
                          Distance: <strong className="text-white font-mono">{match.scoreBreakdown?.distance || 16}/20</strong>
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300">
                          Reliability: <strong className="text-white font-mono">{match.scoreBreakdown?.reliability || 10}/10</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row lg:flex-col items-end justify-between gap-3">
                      <div className="text-right">
                        <span className="text-2xl font-black text-[#E63950] font-mono">
                          {match.compatibilityScore}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-semibold">/ 100 Operational Score</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setDecliningMatch(match)}
                          disabled={submittingResponse === match.id}
                          className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 hover:text-white border border-white/10 transition-colors"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => handleAcceptMatch(match)}
                          disabled={submittingResponse === match.id}
                          className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#16845B] to-emerald-600 hover:opacity-90 text-xs font-bold text-white shadow-md shadow-emerald-950/50 transition-all flex items-center space-x-1.5 border border-white/20"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{submittingResponse === match.id ? 'Accepting...' : 'Accept Match'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TRANSFUSION HISTORY & CERTIFICATES */}
      {activeTab === 'HISTORY' && (
        <div className="space-y-4">
          <div className="p-6 rounded-3xl glass-panel border border-white/10 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-4">Official Transfusion Records ({donations.length})</h3>
            {donations.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No prior donations recorded.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {donations.map(don => (
                  <div key={don.id} className="p-5 rounded-2xl bg-white/5 border border-white/10 text-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          don.status === 'COMPLETED'
                            ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40'
                            : 'bg-amber-950/70 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {don.status}
                      </span>
                      <span className="font-mono text-slate-400">
                        {new Date(don.scheduledDate).toLocaleDateString()}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-white">{don.hospitalName}</h4>
                      <p className="text-slate-300 mt-0.5">
                        Units: <strong className="text-[#E63950] font-bold font-mono">{don.unitsDonated} Unit ({don.bloodGroup})</strong>
                      </p>
                      {don.confirmedByStaff && (
                        <p className="text-[11px] text-slate-400 mt-0.5">Verified by staff: {don.confirmedByStaff}</p>
                      )}
                    </div>

                    {don.status === 'COMPLETED' && (
                      <button
                        onClick={() => setSelectedCertificate(don)}
                        className="w-full py-2 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15 text-white font-bold text-[11px] flex items-center justify-center space-x-1.5 transition-all shadow-xs"
                      >
                        <FileCheck className="w-3.5 h-3.5 text-[#E63950]" />
                        <span>View Verified Certificate</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* EDIT PROFILE MODAL */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#162032] border border-white/15 rounded-3xl p-6 shadow-2xl text-white">
            <h3 className="text-base font-bold text-white mb-4">Edit Donor Profile & Proximity GPS</h3>
            <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={e => setEditFullName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-white focus:outline-none focus:border-[#E63950]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Blood Group</label>
                  <select
                    value={editBloodGroup}
                    onChange={e => setEditBloodGroup(e.target.value as BloodGroup)}
                    className="w-full px-3 py-2 rounded-xl bg-[#101827] border border-white/15 text-white font-mono font-bold focus:outline-none focus:border-[#E63950]"
                  >
                    {ALL_BLOOD_GROUPS.map(bg => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={editCity}
                    onChange={e => setEditCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white focus:outline-none focus:border-[#E63950]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-white focus:outline-none focus:border-[#E63950]"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center space-x-1">
                    <Navigation className="w-3.5 h-3.5 text-[#E63950]" />
                    <span>Proximity GPS Calculation</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleGpsDetection}
                    disabled={detectingGps}
                    className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#C62845] to-[#E63950] text-white hover:opacity-90 text-[11px] font-bold"
                  >
                    {detectingGps ? 'Detecting...' : 'Detect Coordinates'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 font-mono">
                  Coordinates:{' '}
                  {gpsCoordinates.lat !== undefined
                    ? `${gpsCoordinates.lat.toFixed(4)}, ${gpsCoordinates.lon?.toFixed(4)}`
                    : 'Unset (Distance score 0/20)'}
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#C62845] to-[#E63950] text-white font-bold hover:opacity-90 shadow-sm"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DECLINE REASON MODAL */}
      {decliningMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[#162032] border border-white/15 rounded-3xl p-6 shadow-2xl text-white">
            <h3 className="text-sm font-bold text-white mb-1">Decline Requisition Match</h3>
            <p className="text-xs text-slate-400 mb-3">
              Providing a reason helps the hospital matching engine automatically dispatch Wave 2 alerts to the next candidate.
            </p>
            <div className="space-y-1.5 mb-4 text-xs">
              {[
                'Schedule conflict / working',
                'Currently traveling / out of town',
                'Temporarily feeling unwell',
                'Recent medical procedure',
                'Other reason'
              ].map(reason => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setDeclineReason(reason)}
                  className={`w-full text-left px-3 py-2 rounded-xl transition-all ${
                    declineReason === reason
                      ? 'bg-[#C62845]/20 border border-[#E63950]/40 text-[#E63950] font-bold'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>
            <div className="flex justify-end space-x-2 text-xs">
              <button
                type="button"
                onClick={() => setDecliningMatch(null)}
                className="px-3 py-2 rounded-xl bg-white/5 text-slate-300 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeclineMatchSubmit}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#B91C1C] to-red-700 text-white font-bold hover:opacity-90"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIGITAL CERTIFICATE VIEWER */}
      {selectedCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#162032] border border-white/15 rounded-3xl p-8 shadow-2xl text-center relative overflow-hidden">
            <Award className="w-14 h-14 mx-auto text-amber-400 mb-3" />
            <h2 className="text-2xl font-black text-white tracking-tight">
              Certificate of Blood Donation
            </h2>
            <p className="text-xs text-[#E63950] uppercase font-bold tracking-widest mt-0.5">
              LifeLink Smart Blood Rescue Network
            </p>

            <div className="my-6 p-5 rounded-2xl bg-white/5 border border-white/10 text-xs space-y-2 text-slate-300">
              <p>This verified certificate honors donor:</p>
              <p className="text-xl font-black text-white">{selectedCertificate.donorName}</p>
              <p>
                for voluntary donation of{' '}
                <strong className="text-[#E63950] font-black font-mono">{selectedCertificate.unitsDonated} Unit ({selectedCertificate.bloodGroup})</strong>{' '}
                to:
              </p>
              <p className="text-sm font-bold text-white">{selectedCertificate.hospitalName}</p>
              <p className="text-[10px] text-slate-400 pt-2 border-t border-white/10">
                Official Certificate Ref: <span className="font-mono font-bold text-slate-200">{selectedCertificate.certificateId}</span>
              </p>
            </div>

            <button
              onClick={() => setSelectedCertificate(null)}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#C62845] to-[#E63950] text-white text-xs font-bold hover:opacity-90 shadow-md shadow-red-950/40"
            >
              Close Certificate
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
