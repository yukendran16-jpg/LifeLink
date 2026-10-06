import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  getAllDonors,
  getAllHospitals,
  getAllActiveRequests,
  getAllMatches,
  getAllDonations,
  getAuditLogs,
  verifyHospital,
  seedInitialNetworkData
} from '../../lib/dbService';
import {
  DonorProfile,
  HospitalProfile,
  BloodRequest,
  MatchRecord,
  DonationRecord,
  AuditLogEntry,
  HospitalVerificationStatus
} from '../../types';
import {
  Shield,
  Hospital,
  Users,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Search,
  RefreshCw,
  Database,
  Building,
  Check,
  X,
  Clock,
  Sparkles,
  Layers,
  Heart
} from 'lucide-react';

export const AdminPortal: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [donors, setDonors] = useState<DonorProfile[]>([]);
  const [hospitals, setHospitals] = useState<HospitalProfile[]>([]);
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'VERIFICATION' | 'AUDIT' | 'DONORS' | 'HOSPITALS'>('VERIFICATION');
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [auditSearch, setAuditSearch] = useState('');

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [allDonors, allHosp, allReqs, allMatches, allDons, logs] = await Promise.all([
        getAllDonors(),
        getAllHospitals(),
        getAllActiveRequests(),
        getAllMatches(),
        getAllDonations(),
        getAuditLogs()
      ]);

      setDonors(allDonors || []);
      setHospitals(allHosp || []);
      setRequests(allReqs || []);
      setMatches(allMatches || []);
      setDonations(allDons || []);
      setAuditLogs(logs || []);
    } catch (err) {
      console.error('Error loading admin portal data:', err);
      toast.error('Unable to fetch administrative registers.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyHospital = async (hospitalId: string, status: HospitalVerificationStatus) => {
    setVerifyingId(hospitalId);
    try {
      await verifyHospital(hospitalId, status, user?.email || 'admin@lifelink.org');
      toast.success(
        `Hospital facility ${status === 'VERIFIED' ? 'accredited & verified' : 'review status updated'}.`,
        'Compliance Update'
      );
      await loadAdminData();
    } catch (err: any) {
      toast.error(err.message || 'Verification update failed');
    } finally {
      setVerifyingId(null);
    }
  };

  const pendingHospitals = hospitals.filter(h => h.verificationStatus === 'PENDING');
  const verifiedHospitals = hospitals.filter(h => h.verificationStatus === 'VERIFIED');
  const availableDonors = donors.filter(d => d.availabilityStatus === 'AVAILABLE');
  const criticalRequests = requests.filter(r => r.urgency === 'CRITICAL');

  const filteredLogs = auditLogs.filter(log =>
    log.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
    log.details.toLowerCase().includes(auditSearch.toLowerCase()) ||
    log.actorEmail.toLowerCase().includes(auditSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 glass-panel rounded-3xl animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-20 glass-panel rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-80 glass-panel rounded-3xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin Header with Command Center Dark Styling */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-white/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center space-x-4 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-950 via-indigo-900 to-indigo-700 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-lg shadow-indigo-950/50 border border-white/20">
            <Shield className="w-7 h-7 text-indigo-300" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                System Administration & Regulatory Oversight
              </h1>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-indigo-950/70 text-indigo-300 border border-indigo-500/40">
                TIER-1 AUDIT
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              State hospital facility verification, compliance credentialing, and immutable audit ledgers.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 relative z-10">
          <button
            onClick={loadAdminData}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors"
            title="Refresh console"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={async () => {
              if (confirm('Re-seed initial demonstration network data if database is empty?')) {
                await seedInitialNetworkData(user?.uid || 'ADMIN');
                toast.success('Demonstration database records initialized.');
                await loadAdminData();
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-[#C62845]/20 hover:bg-[#C62845]/30 text-white text-xs font-bold flex items-center space-x-1.5 border border-[#E63950]/30 transition-colors shadow-sm"
          >
            <Database className="w-3.5 h-3.5 text-[#E63950]" />
            <span>Database Seeder</span>
          </button>
        </div>
      </div>

      {/* Global Administrative Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl glass-panel border border-white/10 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-400">Total Donors</p>
          <p className="text-2xl font-black text-white mt-1 font-mono">{donors.length}</p>
          <p className="text-[10px] text-emerald-400 font-semibold mt-0.5">{availableDonors.length} active available</p>
        </div>
        <div className="p-4 rounded-2xl glass-panel border border-white/10 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-400">Facilities</p>
          <p className="text-2xl font-black text-white mt-1 font-mono">{hospitals.length}</p>
          <p className="text-[10px] text-[#E63950] font-semibold mt-0.5">{verifiedHospitals.length} verified centers</p>
        </div>
        <div className="p-4 rounded-2xl glass-panel border border-amber-500/30 shadow-sm">
          <p className="text-[11px] font-semibold text-amber-300">Pending Audits</p>
          <p className="text-2xl font-black text-amber-400 mt-1 font-mono">{pendingHospitals.length}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Awaiting review</p>
        </div>
        <div className="p-4 rounded-2xl glass-panel border border-red-500/30 shadow-sm">
          <p className="text-[11px] font-semibold text-red-300">Active Requisitions</p>
          <p className="text-2xl font-black text-white mt-1 font-mono">{requests.length}</p>
          <p className="text-[10px] text-[#E63950] font-semibold mt-0.5">{criticalRequests.length} critical</p>
        </div>
        <div className="p-4 rounded-2xl glass-panel border border-white/10 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-400">Matches Dispatched</p>
          <p className="text-2xl font-black text-white mt-1 font-mono">{matches.length}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Wave dispatches</p>
        </div>
        <div className="p-4 rounded-2xl glass-panel border border-emerald-500/30 shadow-sm">
          <p className="text-[11px] font-semibold text-emerald-300">Draws Completed</p>
          <p className="text-2xl font-black text-emerald-400 mt-1 font-mono">{donations.length}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Transfusions confirmed</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="glass-panel rounded-2xl border border-white/10 px-3 pt-3 flex border-b space-x-2 sm:space-x-4 text-xs font-bold overflow-x-auto shadow-sm">
        <button
          onClick={() => setActiveTab('VERIFICATION')}
          className={`pb-3 px-3 border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'VERIFICATION'
              ? 'border-[#E63950] text-[#E63950]'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <span>Hospital Verification Queue ({pendingHospitals.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('AUDIT')}
          className={`pb-3 px-3 border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'AUDIT'
              ? 'border-[#E63950] text-[#E63950]'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <span>Regulatory Audit Logs ({auditLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('DONORS')}
          className={`pb-3 px-3 border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'DONORS'
              ? 'border-[#E63950] text-[#E63950]'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <span>Donors Registry ({donors.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('HOSPITALS')}
          className={`pb-3 px-3 border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'HOSPITALS'
              ? 'border-[#E63950] text-[#E63950]'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <span>Hospital Registry ({hospitals.length})</span>
        </button>
      </div>

      {/* TAB 1: HOSPITAL VERIFICATION QUEUE */}
      {activeTab === 'VERIFICATION' && (
        <div className="space-y-4">
          {pendingHospitals.length === 0 ? (
            <div className="p-12 text-center rounded-3xl glass-panel border border-white/10 shadow-xl">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400 mb-3" />
              <h3 className="text-base font-bold text-white">No Facilities Awaiting Verification</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                All registered trauma centers and blood facilities have verified state licenses.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {pendingHospitals.map(h => (
                <div
                  key={h.userId || h.id}
                  className="p-6 rounded-3xl glass-panel border border-amber-500/40 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-950/70 text-amber-300 border border-amber-500/40">
                        AUDIT PENDING
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        Submitted: {new Date(h.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-lg font-black text-white">{h.hospitalName}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-300">
                      <div>
                        Licence: <strong className="font-mono text-white">{h.licenseNumber}</strong>
                      </div>
                      <div>
                        City: <strong className="text-white">{h.city}</strong>
                      </div>
                      <div>
                        Contact: <strong className="text-white">{h.phone || h.email}</strong>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400">Address: {h.address}</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleVerifyHospital(h.userId || h.id, 'REJECTED')}
                      disabled={verifyingId === (h.userId || h.id)}
                      className="px-4 py-2 rounded-xl bg-white/5 hover:bg-red-950/40 text-rose-300 text-xs font-bold border border-white/10 transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleVerifyHospital(h.userId || h.id, 'VERIFIED')}
                      disabled={verifyingId === (h.userId || h.id)}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#16845B] to-emerald-600 hover:opacity-90 text-white text-xs font-bold shadow-md shadow-emerald-950/50 transition-all flex items-center space-x-1 border border-white/20"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve Facility</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AUDIT LOGS */}
      {activeTab === 'AUDIT' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl glass-panel border border-white/10 shadow-sm flex items-center space-x-2 text-xs">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={auditSearch}
              onChange={e => setAuditSearch(e.target.value)}
              placeholder="Search regulatory audit entries by action, details or actor..."
              className="w-full bg-transparent border-none text-xs text-white focus:outline-none placeholder-slate-400"
            />
          </div>

          <div className="glass-panel rounded-3xl border border-white/10 shadow-xl divide-y divide-white/10 text-xs overflow-hidden">
            {filteredLogs.length === 0 ? (
              <p className="p-8 text-center text-slate-400">No matching audit events recorded.</p>
            ) : (
              filteredLogs.map(log => (
                <div key={log.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-white/5 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.severity === 'CRITICAL'
                            ? 'bg-red-950/70 text-[#E63950] border border-red-500/40'
                            : log.severity === 'WARN'
                            ? 'bg-amber-950/70 text-amber-300 border border-amber-500/40'
                            : 'bg-white/10 text-slate-300'
                        }`}
                      >
                        {log.severity}
                      </span>
                      <span className="font-mono font-bold text-white">{log.action}</span>
                      <span className="text-slate-400 font-mono">({log.targetEntity})</span>
                    </div>
                    <p className="text-slate-200">{log.details}</p>
                    <p className="text-[11px] text-slate-400">
                      Actor: <span className="text-slate-300">{log.actorEmail}</span> ({log.actorRole})
                    </p>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: DONORS REGISTRY */}
      {activeTab === 'DONORS' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {donors.map(d => (
            <div key={d.userId || d.id} className="p-5 rounded-2xl glass-panel border border-white/10 shadow-sm text-xs space-y-2 hover:border-[#E63950]/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white">{d.fullName}</span>
                <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#351522] via-[#C62845] to-[#E63950] text-white font-black flex items-center justify-center font-mono text-xs border border-white/20 shadow-xs">
                  {d.bloodGroup}
                </span>
              </div>
              <div className="text-slate-300 space-y-0.5">
                <p>Location: <strong className="text-white">{d.city}</strong></p>
                <p>Status: <strong className="text-emerald-400">{d.availabilityStatus}</strong></p>
                <p>Verified Draws: <strong className="text-white font-mono">{d.totalDonations || 0}</strong></p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: HOSPITALS REGISTRY */}
      {activeTab === 'HOSPITALS' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {hospitals.map(h => (
            <div key={h.userId || h.id} className="p-5 rounded-2xl glass-panel border border-white/10 shadow-sm text-xs space-y-2 hover:border-white/20 transition-all">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white">{h.hospitalName}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    h.verificationStatus === 'VERIFIED'
                      ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-950/70 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {h.verificationStatus}
                </span>
              </div>
              <p className="text-slate-300">License: <span className="font-mono text-white">{h.licenseNumber}</span></p>
              <p className="text-slate-400">Address: {h.address}, {h.city}</p>
              <p className="text-slate-400">Phone: {h.phone}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
