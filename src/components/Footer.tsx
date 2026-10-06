import React from 'react';
import { Heart, Droplet, ShieldCheck, Activity, PhoneCall } from 'lucide-react';
import { LifeLinkLogo } from './brand/LifeLinkLogo';

interface FooterProps {
  setCurrentTab: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setCurrentTab }) => {
  return (
    <footer className="bg-[#101827]/90 text-slate-400 border-t border-white/10 text-xs mt-auto backdrop-blur-xl relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-1">
            <LifeLinkLogo size="sm" showTagline={false} />
            <p className="text-xs text-slate-400 leading-relaxed">
              Hospital-grade emergency blood rescue coordination connecting voluntary donors, accredited trauma hubs, and regional blood banks.
            </p>
            <div className="flex items-center space-x-2 text-emerald-400 text-[11px] font-bold pt-1">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cloud Firestore Database Active</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] mb-3">
              Network Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => setCurrentTab('home')}
                  className="hover:text-[#E63950] transition-colors"
                >
                  Platform Overview
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentTab('compatibility')}
                  className="hover:text-[#E63950] transition-colors"
                >
                  ABO/Rh Compatibility Matrix
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentTab('emergencies')}
                  className="hover:text-[#E63950] transition-colors"
                >
                  Emergency Request Radar
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentTab('donor')}
                  className="hover:text-[#E63950] transition-colors"
                >
                  Donor Portal
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentTab('hospital')}
                  className="hover:text-[#E63950] transition-colors"
                >
                  Hospital Operations
                </button>
              </li>
            </ul>
          </div>

          {/* Clinical Protocol */}
          <div>
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] mb-3">
              Clinical Guidelines
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>Transparent 100-Point Operational Score</li>
              <li>Haversine Geodetic Proximity Ranking</li>
              <li>Multi-Wave Targeted Dispatch Protocol</li>
              <li>Attending Staff Transfusion Authorization</li>
              <li>Atomic Inventory Stock Auditing</li>
            </ul>
          </div>

          {/* Emergency Hotline & Compliance */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] mb-3">
              Emergency Dispatch Support
            </h4>
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <div className="flex items-center space-x-1.5 text-[#E63950] font-bold text-xs">
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Trauma Center Priority Line</span>
              </div>
              <p className="text-white font-mono text-xs font-black">1-800-BLOOD-RESCUE</p>
              <p className="text-[10px] text-slate-400">24/7 Regional Emergency Triage</p>
            </div>
            <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>HIPAA-aligned PII isolation standards</span>
            </div>
          </div>
        </div>

        {/* Mandatory Clinical Disclaimer */}
        <div className="pt-6 border-t border-white/10 text-[11px] text-slate-400 leading-relaxed space-y-2">
          <p className="font-bold text-slate-300">
            Medical & Clinical Disclaimer:
          </p>
          <p>
            LifeLink is an operational coordination network designed to assist hospitals, licensed blood centers, and voluntary donors in organizing emergency outreach. Compatibility recommendations are preliminary mathematical filters based on reported ABO/Rh types and do not replace clinical cross-matching, laboratory serological testing, or authoritative medical diagnosis by qualified healthcare professionals.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-white/5 text-[10px] text-slate-500 gap-2">
            <span>© {new Date().getFullYear()} LifeLink Smart Blood Rescue Network. All rights reserved.</span>
            <span>Red Cross & AABB Transfusion Medicine Standards Compliant Interface</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
