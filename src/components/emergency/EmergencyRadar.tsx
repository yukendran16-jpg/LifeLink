import React, { useEffect, useState } from 'react';
import { getAllActiveRequests, getAllMatches, updateRequestStatus, createAuditLog } from '../../lib/dbService';
import { BloodRequest, MatchRecord } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  AlertTriangle,
  Clock,
  Droplet,
  Hospital,
  Activity,
  ShieldAlert,
  RefreshCw,
  Zap,
  CheckCircle2,
  MapPin,
  Radio
} from 'lucide-react';

export const EmergencyRadar: React.FC = () => {
  const { user, userProfile } = useAuth();
  const toast = useToast();

  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [escalatingId, setEscalatingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [reqs, allMatches] = await Promise.all([
        getAllActiveRequests(),
        getAllMatches()
      ]);
      setRequests(reqs || []);
      setMatches(allMatches || []);
    } catch (err) {
      console.error('Error loading emergency radar data:', err);
      toast.error('Unable to fetch live emergency feed.');
    } finally {
      setLoading(false);
    }
  };

  const getRemainingTime = (deadlineIso: string) => {
    const diff = new Date(deadlineIso).getTime() - currentTime;
    if (diff <= 0) return { expired: true, text: 'DEADLINE REACHED' };
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);
    return {
      expired: false,
      text: `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    };
  };

  const handleEscalateRequest = async (req: BloodRequest) => {
    setEscalatingId(req.id);
    try {
      const now = new Date().toISOString();
      await updateRequestStatus(req.id, 'ESCALATED', {
        escalatedAt: now,
        notes: req.notes ? `${req.notes} [ESCALATED TO REGIONAL NETWORK]` : 'Escalated to regional trauma network'
      });

      await createAuditLog({
        action: 'EMERGENCY_ESCALATION',
        actorId: user?.uid || 'SYSTEM_COORDINATOR',
        actorEmail: user?.email || 'coordinator@lifelink.org',
        actorRole: userProfile?.role || 'COORDINATOR',
        targetEntity: 'BloodRequest',
        targetId: req.id,
        details: `Requisition for ${req.unitsRequired} unit(s) of ${req.bloodGroup} at ${req.hospitalName} escalated to regional network.`,
        severity: 'CRITICAL',
        timestamp: now
      });

      toast.success(
        `Emergency requisition #${req.id.slice(-6).toUpperCase()} escalated to all regional blood centers and secondary donor pools.`,
        'Regional Escalation Triggered'
      );

      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Escalation failed');
    } finally {
      setEscalatingId(null);
    }
  };

  const emergencyRequests = requests.filter(
    r => (r.urgency === 'CRITICAL' || r.urgency === 'URGENT') && r.status !== 'CANCELLED' && r.status !== 'FULFILLED'
  );

  return (
    <div className="space-y-6">
      {/* Emergency Header Banner with Command Center Dark Styling */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-white/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center space-x-4 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#351522] via-[#C62845] to-[#E63950] text-white flex items-center justify-center font-black flex-shrink-0 shadow-lg shadow-red-950/40 border border-white/20">
            <Radio className="w-7 h-7 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Emergency Blood Requisition Radar
              </h1>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-[#E63950]/20 text-[#E63950] border border-[#E63950]/30 animate-pulse">
                ACTIVE TRIAGE
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Real-time monitoring of urgent hospital trauma requisitions, response deadlines, and wave escalations.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 relative z-10">
          <button
            onClick={loadData}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors"
            title="Refresh radar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#E63950]' : ''}`} />
          </button>
          <div className="px-3.5 py-2 rounded-xl bg-[#C62845]/20 border border-[#E63950]/30 text-xs font-bold text-[#E63950] flex items-center space-x-1.5 shadow-sm">
            <Activity className="w-4 h-4" />
            <span>{emergencyRequests.length} Active Emergencies</span>
          </div>
        </div>
      </div>

      {/* Emergency Triage Feed */}
      {emergencyRequests.length === 0 ? (
        <div className="p-16 text-center rounded-3xl glass-panel border border-white/10 shadow-xl">
          <CheckCircle2 className="w-12 h-12 mx-auto text-[#16845B] mb-3" />
          <h3 className="text-base font-bold text-white">No Critical Emergencies Active</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
            All registered trauma facilities in this region have sufficient emergency reserves for current demand.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {emergencyRequests.map(req => {
            const reqMatches = matches.filter(m => m.requestId === req.id);
            const accepted = reqMatches.filter(m => m.status === 'ACCEPTED').length;
            const pending = reqMatches.filter(m => m.status === 'PENDING').length;
            const countdown = getRemainingTime(req.requiredBy);

            return (
              <div
                key={req.id}
                className="p-6 rounded-3xl glass-panel border border-white/10 shadow-xl relative overflow-hidden transition-all hover:border-[#E63950]/40"
              >
                <div
                  className={`absolute top-0 left-0 right-0 h-1.5 ${
                    req.urgency === 'CRITICAL'
                      ? 'bg-gradient-to-r from-[#B91C1C] via-[#E63950] to-[#B91C1C]'
                      : 'bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600'
                  }`}
                />

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pt-1">
                  <div className="space-y-2.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          req.urgency === 'CRITICAL'
                            ? 'bg-red-950/60 text-[#E63950] border border-red-500/40'
                            : 'bg-amber-950/60 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {req.urgency} PRIORITY
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/5 text-slate-300 border border-white/10">
                        STATUS: {req.status}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        #{req.id.slice(-6).toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="text-2xl font-black text-[#E63950] font-mono">
                        {req.bloodGroup}
                      </span>
                      <span className="text-base font-bold text-white">
                        {req.hospitalName}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300">
                      {req.notes || 'Emergency surgical holding and resuscitation protocol.'}
                    </p>

                    {/* Stats */}
                    <div className="flex flex-wrap items-center gap-4 text-xs pt-1 text-slate-400">
                      <span>
                        Units Needed: <strong className="text-white font-mono">{req.unitsRequired}</strong>
                      </span>
                      <span>
                        Fulfilled: <strong className="text-emerald-400 font-mono">{req.unitsFulfilled || 0}</strong>
                      </span>
                      <span>
                        Donors Contacted: <strong className="text-white font-mono">{reqMatches.length}</strong>
                      </span>
                      <span>
                        Accepted: <strong className="text-emerald-400 font-mono">{accepted}</strong>
                      </span>
                      <span>
                        Pending: <strong className="text-amber-300 font-mono">{pending}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Countdown and Action */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-end justify-between gap-3">
                    <div className="text-right">
                      <span className="text-xs text-slate-400 font-medium block">Response Deadline Window:</span>
                      <span
                        className={`text-2xl font-black font-mono tracking-wider tabular-nums ${
                          countdown.expired ? 'text-[#E63950]' : 'text-amber-400'
                        }`}
                      >
                        {countdown.text}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        Target: {new Date(req.requiredBy).toLocaleTimeString()}
                      </span>
                    </div>

                    {req.status !== 'ESCALATED' && (
                      <button
                        onClick={() => handleEscalateRequest(req)}
                        disabled={escalatingId === req.id}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#B91C1C] to-[#E63950] hover:opacity-90 text-xs font-bold text-white shadow-md shadow-red-950/50 transition-all flex items-center space-x-1.5 border border-white/20"
                      >
                        <Zap className="w-4 h-4" />
                        <span>{escalatingId === req.id ? 'Escalating...' : 'Trigger Regional Escalation'}</span>
                      </button>
                    )}

                    {req.status === 'ESCALATED' && (
                      <span className="px-3 py-1.5 rounded-xl bg-red-950/60 text-[#E63950] border border-red-500/40 text-xs font-bold flex items-center space-x-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Escalated to Regional Hubs</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
