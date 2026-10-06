import React, { useEffect, useState } from 'react';
import {
  Heart,
  Droplet,
  ShieldCheck,
  Hospital,
  AlertTriangle,
  Zap,
  MapPin,
  CheckCircle2,
  ChevronDown,
  Layers,
  ArrowRight,
  Clock,
  Activity,
  Users,
  Building2,
  Sparkles,
  Award,
  Radio,
  Share2,
  Database
} from 'lucide-react';
import { UserRole, BloodGroup } from '../types';
import { RECIPIENT_COMPATIBILITY_MAP, DONOR_CAN_GIVE_TO, ALL_BLOOD_GROUPS, MEDICAL_DISCLAIMER_TEXT } from '../lib/compatibility';
import { getAllDonors, getAllHospitals, getAllActiveRequests } from '../lib/dbService';

interface LandingPageProps {
  setCurrentTab: (tab: string) => void;
  openAuthModal: (role?: UserRole) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  setCurrentTab,
  openAuthModal
}) => {
  // Live counts from Firestore
  const [stats, setStats] = useState({
    donorsCount: 0,
    availableDonorsCount: 0,
    hospitalsCount: 0,
    verifiedHospitalsCount: 0,
    activeRequestsCount: 0,
    criticalEmergenciesCount: 0
  });

  const [testBlood, setTestBlood] = useState<BloodGroup>('O-');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [donors, hospitals, requests] = await Promise.all([
          getAllDonors(),
          getAllHospitals(),
          getAllActiveRequests()
        ]);

        setStats({
          donorsCount: donors.length,
          availableDonorsCount: donors.filter(d => d.availabilityStatus === 'AVAILABLE').length,
          hospitalsCount: hospitals.length,
          verifiedHospitalsCount: hospitals.filter(h => h.verificationStatus === 'VERIFIED').length,
          activeRequestsCount: requests.filter(r => r.status === 'OPEN' || r.status === 'MATCHING').length,
          criticalEmergenciesCount: requests.filter(r => r.urgency === 'CRITICAL' && r.status !== 'CANCELLED' && r.status !== 'FULFILLED').length
        });
      } catch (err) {
        console.error('Error loading landing page stats:', err);
      }
    }
    fetchStats();
  }, []);

  const faqs = [
    {
      q: 'Does LifeLink make final clinical eligibility decisions?',
      a: 'No. LifeLink provides operational matchmaking recommendations based on preliminary ABO/Rh compatibility and proximity. Final medical eligibility, laboratory cross-matching, and blood safety screenings are always performed directly by licensed blood bank and hospital professionals.'
    },
    {
      q: 'How does the 100-Point Operational Ranking work?',
      a: 'The transparent scoring engine computes up to 40 points for ABO/Rh compatibility, 20 points for current availability, 20 points for Haversine geographic proximity, 10 points for preliminary donation deferral window (≥90 days), and 10 points for historical fulfillment reliability.'
    },
    {
      q: 'How are hospital facilities verified?',
      a: 'Every newly registered healthcare facility begins in a PENDING state with restricted broadcast capabilities. A designated platform administrator independently verifies state hospital licensing credentials before granting blood requisition rights.'
    },
    {
      q: 'How are emergency outreach waves coordinated?',
      a: 'Critical requisitions are dispatched in structured waves: Wave 1 contacts the top 5 highest-ranking suitable donors. If unanswered within the configured response deadline, Wave 2 automatically alerts the next 10 candidates, followed by network escalation.'
    }
  ];

  return (
    <div className="space-y-16 py-4">
      {/* Critical Alert Bar if live critical emergencies in region */}
      {stats.criticalEmergenciesCount > 0 && (
        <div className="bg-gradient-to-r from-[#B91C1C] via-[#8E1B1B] to-[#511727] text-white p-4 rounded-3xl shadow-lg border border-red-500/30 flex items-center justify-between flex-wrap gap-3 text-xs">
          <div className="flex items-center space-x-3 font-semibold">
            <span className="p-1 rounded-full bg-white/20">
              <AlertTriangle className="w-4 h-4 text-white animate-pulse" />
            </span>
            <span>
              {stats.criticalEmergenciesCount} Critical Trauma Requisitions Active in Regional Hospital Network
            </span>
          </div>
          <button
            onClick={() => setCurrentTab('emergencies')}
            className="px-3.5 py-1.5 rounded-xl bg-white text-[#B91C1C] hover:bg-slate-100 font-bold transition-all shadow-sm"
          >
            Open Emergency Radar →
          </button>
        </div>
      )}

      {/* Cinematic Hero Section with Scientific Circulation Motif */}
      <section className="glass-panel rounded-3xl p-8 sm:p-12 lg:p-16 shadow-2xl relative overflow-hidden border border-white/10">
        {/* Soft crimson/burgundy radial ambient illumination */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-br from-[#E63950]/20 via-[#C62845]/15 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
          {/* Left Column: Hero Typography & CTAs */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-[#C62845]/20 border border-[#E63950]/30 text-[#E63950] text-xs font-black tracking-wider uppercase">
              <Radio className="w-3.5 h-3.5 text-[#E63950] animate-pulse" />
              <span>SMART BLOOD RESCUE NETWORK</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
              Every Drop{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E63950] via-[#C62845] to-rose-300">
                Connects a Life.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
              Bringing blood donors and hospitals together through intelligent matching, coordinated requests and emergency response.
            </p>

            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Donors. Hospitals. One Connected Network.</span>
            </div>

            {/* Hero CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3.5">
              <button
                onClick={() => openAuthModal('DONOR')}
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-[#C62845] via-[#E63950] to-[#C62845] hover:opacity-95 text-white font-bold text-sm shadow-lg shadow-[#E63950]/30 transition-all flex items-center justify-center space-x-2 border border-white/20"
              >
                <Heart className="w-4 h-4 fill-white" />
                <span>Become a Donor</span>
              </button>

              <button
                onClick={() => openAuthModal('HOSPITAL')}
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm border border-white/15 shadow-sm transition-all flex items-center justify-center space-x-2 backdrop-blur-md"
              >
                <Hospital className="w-4 h-4 text-[#E63950]" />
                <span>Hospital Portal</span>
              </button>

              <button
                onClick={() => setCurrentTab('compatibility')}
                className="w-full sm:w-auto px-5 py-3.5 rounded-2xl text-xs font-semibold text-slate-300 hover:text-white transition-colors text-center"
              >
                Compatibility Matrix →
              </button>
            </div>
          </div>

          {/* Right Column: Original Medical Illustration (Biconcave Cells, Network Nodes, Circulation Lines) */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            <div className="w-full max-w-sm aspect-square relative rounded-3xl p-6 glass-panel-burgundy flex flex-col items-center justify-center text-center shadow-2xl border border-red-500/20 overflow-hidden">
              {/* Background ambient pulse circle */}
              <div className="absolute inset-0 bg-radial from-[#E63950]/20 via-[#351522]/40 to-transparent pointer-events-none" />

              {/* Central Linked Blood Rescue Icon */}
              <div className="relative z-10 w-28 h-28 rounded-full bg-gradient-to-tr from-[#351522] via-[#C62845] to-[#E63950] p-1.5 shadow-2xl shadow-[#E63950]/40 flex items-center justify-center border border-white/25">
                <div className="w-full h-full rounded-full bg-[#101827] flex items-center justify-center">
                  <Droplet className="w-12 h-12 text-[#E63950] fill-[#C62845]" />
                </div>
                {/* Floating orbital erythrocyte indicators */}
                <div className="absolute -top-2 -right-1 w-7 h-7 rounded-full bg-gradient-to-br from-[#E63950] to-[#511727] border border-white/30 shadow-md flex items-center justify-center text-[10px] font-black font-mono text-white">
                  O-
                </div>
                <div className="absolute -bottom-2 -left-1 w-7 h-7 rounded-full bg-gradient-to-br from-[#C62845] to-[#351522] border border-white/30 shadow-md flex items-center justify-center text-[10px] font-black font-mono text-white">
                  AB+
                </div>
              </div>

              {/* Network Node Connections Visualization */}
              <div className="relative z-10 mt-6 space-y-1.5">
                <p className="text-sm font-black text-white tracking-wide">
                  Intelligent Life Rescue Routing
                </p>
                <p className="text-xs text-slate-300 leading-relaxed px-4">
                  Autonomous 100-point compatibility filters, geodetic distance calculations & controlled emergency dispatch waves.
                </p>
              </div>

              <div className="relative z-10 mt-4 flex items-center space-x-2 text-[11px] text-[#E63950] font-bold">
                <Activity className="w-3.5 h-3.5" />
                <span>Active 24/7 Regional Triaging</span>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Verified Stats Grid from Firestore */}
        <div className="mt-12 pt-8 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-[#101827]/70 border border-white/10 backdrop-blur-md">
            <p className="text-xs text-slate-400 font-medium">Network Donors</p>
            <p className="text-2xl font-black text-white mt-1">{stats.donorsCount}</p>
            <p className="text-[11px] text-[#16845B] font-semibold mt-0.5">{stats.availableDonorsCount} available now</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#101827]/70 border border-white/10 backdrop-blur-md">
            <p className="text-xs text-slate-400 font-medium">Hospital Hubs</p>
            <p className="text-2xl font-black text-white mt-1">{stats.hospitalsCount}</p>
            <p className="text-[11px] text-[#E63950] font-semibold mt-0.5">{stats.verifiedHospitalsCount} accredited facilities</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#101827]/70 border border-white/10 backdrop-blur-md">
            <p className="text-xs text-slate-400 font-medium">Active Requisitions</p>
            <p className="text-2xl font-black text-amber-400 mt-1">{stats.activeRequestsCount}</p>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Matching & outreach</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#101827]/70 border border-white/10 backdrop-blur-md">
            <p className="text-xs text-slate-400 font-medium">Critical Emergencies</p>
            <p className="text-2xl font-black text-[#E63950] mt-1">{stats.criticalEmergenciesCount}</p>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Priority OR triage</p>
          </div>
        </div>
      </section>

      {/* Interactive ABO/Rh Compatibility Explorer */}
      <section className="glass-panel rounded-3xl p-6 sm:p-10 shadow-xl border border-white/10">
        <div className="max-w-2xl mx-auto text-center mb-8">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#C62845]/20 text-[#E63950] border border-[#C62845]/30 text-xs font-bold mb-2">
            <Droplet className="w-3.5 h-3.5 fill-[#E63950]" />
            <span>Interactive Serology Explorer</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Preliminary ABO/Rh Compatibility Matrix
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
            Test preliminary compatibility rules before formal hospital cross-match.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Blood Selector Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            <span className="text-xs font-bold text-slate-300 mr-2">Select Blood Type:</span>
            {ALL_BLOOD_GROUPS.map(bg => (
              <button
                key={bg}
                onClick={() => setTestBlood(bg)}
                className={`px-3.5 py-1.5 rounded-xl font-bold font-mono text-xs transition-all ${
                  testBlood === bg
                    ? 'bg-gradient-to-r from-[#C62845] to-[#E63950] text-white shadow-lg shadow-red-950/50 scale-105 border border-white/20'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                }`}
              >
                {bg}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* If patient is recipient */}
            <div className="p-5 rounded-2xl bg-[#101827]/80 border border-white/10">
              <div className="flex items-center space-x-2 text-[#E63950] font-bold text-sm mb-2">
                <Droplet className="w-4 h-4 fill-[#E63950]" />
                <span>If Patient is Recipient ({testBlood})</span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                Can receive red blood cells from these compatible donor groups:
              </p>
              <div className="flex flex-wrap gap-2">
                {RECIPIENT_COMPATIBILITY_MAP[testBlood].map(donorBg => (
                  <span
                    key={donorBg}
                    className="px-3 py-1 rounded-lg bg-white/10 border border-white/15 text-white font-bold font-mono text-xs"
                  >
                    {donorBg}
                    {donorBg === 'O-' && ' (Universal Donor)'}
                    {donorBg === testBlood && ' (Identical)'}
                  </span>
                ))}
              </div>
            </div>

            {/* If donor is voluntary */}
            <div className="p-5 rounded-2xl bg-[#101827]/80 border border-white/10">
              <div className="flex items-center space-x-2 text-[#16845B] font-bold text-sm mb-2">
                <Heart className="w-4 h-4 fill-[#16845B]" />
                <span>If Voluntary Donor is ({testBlood})</span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                Can donate red blood cells to patients with these blood groups:
              </p>
              <div className="flex flex-wrap gap-2">
                {DONOR_CAN_GIVE_TO[testBlood].map(recipBg => (
                  <span
                    key={recipBg}
                    className="px-3 py-1 rounded-lg bg-white/10 border border-white/15 text-white font-bold font-mono text-xs"
                  >
                    {recipBg}
                    {recipBg === 'AB+' && ' (Universal Recipient)'}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How LifeLink Works Section */}
      <section className="glass-panel rounded-3xl p-8 sm:p-12 shadow-xl border border-white/10">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-bold mb-2">
            <span>Coordinated Rescue Flow</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            How LifeLink Works
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
            A structured triage protocol ensuring swift, reliable response during critical shortages.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-[#101827]/80 border border-white/10 relative overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#C62845] to-[#E63950] text-white flex items-center justify-center font-black text-sm mb-4 shadow-md">
              1
            </div>
            <h3 className="font-bold text-sm text-white mb-1.5">Hospital Requisition</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Verified clinical staff places an emergency requirement detailing ABO/Rh group, units, and response deadline.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#101827]/80 border border-white/10 relative overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-[#26364D] text-white flex items-center justify-center font-black text-sm mb-4 shadow-md">
              2
            </div>
            <h3 className="font-bold text-sm text-white mb-1.5">Smart Match Engine</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              The 100-point transparent engine calculates compatibility, proximity, availability, and eligibility to rank candidates.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#101827]/80 border border-white/10 relative overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#8E1B1B] to-[#C62845] text-white flex items-center justify-center font-black text-sm mb-4 shadow-md">
              3
            </div>
            <h3 className="font-bold text-sm text-white mb-1.5">Outreach Waves</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Targeted alerts dispatch in waves (Wave 1: top 5). Donors review urgency and location to accept or decline.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#101827]/80 border border-white/10 relative overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-[#16845B] text-white flex items-center justify-center font-black text-sm mb-4 shadow-md">
              4
            </div>
            <h3 className="font-bold text-sm text-white mb-1.5">Verified Transfusion</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Attending hospital staff logs the confirmed blood draw. Blood bank inventory is atomically credited with audit certificates.
            </p>
          </div>
        </div>
      </section>

      {/* Safety, Privacy & Hospital Coordination */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-8 rounded-3xl glass-panel border border-white/10 shadow-xl space-y-3">
          <div className="w-10 h-10 rounded-xl bg-red-950/50 border border-red-500/30 text-[#E63950] flex items-center justify-center mb-2">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Hospital Licensing & Credentialing</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Every participating medical center must provide certified state health licensing documentation. Broadcast rights are authorized exclusively after administrator verification to safeguard network integrity.
          </p>
        </div>

        <div className="p-8 rounded-3xl glass-panel border border-white/10 shadow-xl space-y-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/20 text-[#E63950] flex items-center justify-center mb-2">
            <Droplet className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Donor Privacy & PII Protection</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Donor contact details and precise location coordinates are strictly shielded. In-app match notifications convey only operational criteria and hospital destination without exposing private personal identifiers.
          </p>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="glass-panel rounded-3xl p-8 sm:p-10 shadow-xl border border-white/10 max-w-4xl mx-auto w-full">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white">Frequently Asked Questions</h2>
          <p className="text-xs text-slate-400 mt-1">Operational guidelines and matching protocol.</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div key={idx} className="rounded-2xl border border-white/10 bg-[#101827]/60 overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between text-xs sm:text-sm font-bold text-white hover:bg-white/5 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform ${openFaq === idx ? 'rotate-180 text-[#E63950]' : ''}`}
                />
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-5 text-xs text-slate-300 leading-relaxed border-t border-white/10 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
