import React, { useState } from 'react';
import { ALL_BLOOD_GROUPS, isDonorCompatible, getCompatibilityType, MEDICAL_DISCLAIMER_TEXT } from '../../lib/compatibility';
import { BloodGroup } from '../../types';
import { Droplet, Heart, Check, X, ShieldAlert, Info } from 'lucide-react';

export const CompatibilityMatrix: React.FC = () => {
  const [selectedDonor, setSelectedDonor] = useState<BloodGroup | null>(null);
  const [selectedRecipient, setSelectedRecipient] = useState<BloodGroup | null>(null);

  const testResult = selectedDonor && selectedRecipient ? getCompatibilityType(selectedDonor, selectedRecipient) : null;

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="max-w-3xl">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#C62845]/20 border border-[#E63950]/30 text-[#E63950] text-xs font-bold mb-3">
          <Droplet className="w-3.5 h-3.5 fill-[#E63950]" />
          <span>Red Blood Cell (ABO/Rh) Serology Standards</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          ABO/Rh Blood Compatibility Matrix
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
          Preliminary red-cell transfusion compatibility rules. These operational rules determine which donor blood groups can be safely considered prior to laboratory cross-matching.
        </p>
      </div>

      {/* Interactive Simulator */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-white/10 shadow-xl">
        <h2 className="text-base font-bold text-white mb-4 flex items-center space-x-2">
          <Info className="w-4 h-4 text-[#E63950]" />
          <span>Interactive Compatibility Simulator</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-2">
              1. Select Donor Blood Type:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {ALL_BLOOD_GROUPS.map(bg => (
                <button
                  key={`donor-${bg}`}
                  onClick={() => setSelectedDonor(bg)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold font-mono transition-all ${
                    selectedDonor === bg
                      ? 'bg-gradient-to-r from-[#C62845] to-[#E63950] text-white shadow-lg shadow-red-950/50 scale-105 border border-white/20'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  {bg}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-200 mb-2">
              2. Select Recipient Blood Type:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {ALL_BLOOD_GROUPS.map(bg => (
                <button
                  key={`recip-${bg}`}
                  onClick={() => setSelectedRecipient(bg)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold font-mono transition-all ${
                    selectedRecipient === bg
                      ? 'bg-gradient-to-r from-indigo-700 to-indigo-500 text-white shadow-lg shadow-indigo-950/50 scale-105 border border-white/20'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  {bg}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Test Result Display */}
        {selectedDonor && selectedRecipient && (
          <div
            className={`mt-6 p-4 rounded-2xl border text-xs flex items-center justify-between transition-all backdrop-blur-md ${
              testResult === 'INCOMPATIBLE'
                ? 'bg-red-950/50 border-red-500/40 text-red-200'
                : 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200'
            }`}
          >
            <div className="flex items-center space-x-3">
              {testResult === 'INCOMPATIBLE' ? (
                <X className="w-6 h-6 text-[#E63950]" />
              ) : (
                <Check className="w-6 h-6 text-emerald-400" />
              )}
              <div>
                <p className="font-bold text-sm text-white">
                  {testResult === 'INCOMPATIBLE'
                    ? `Incompatible: Donor (${selectedDonor}) cannot donate to Patient (${selectedRecipient})`
                    : `Compatible Match: Donor (${selectedDonor}) can safely donate to Patient (${selectedRecipient})`}
                </p>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  {testResult === 'EXACT' && 'Exact ABO/Rh identical unit.'}
                  {testResult === 'UNIVERSAL' && 'Universal red blood cell donor (O-).'}
                  {testResult === 'COMPATIBLE' && 'Alternative compatible antigen combination.'}
                  {testResult === 'INCOMPATIBLE' && 'Presence of conflicting A, B, or Rh surface antigens.'}
                </p>
              </div>
            </div>
            <span className="font-mono font-bold text-xs uppercase px-2.5 py-1 rounded bg-white/10 border border-white/20 text-white shadow-xs">
              {testResult}
            </span>
          </div>
        )}
      </div>

      {/* Complete 8x8 Reference Grid */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-white/10 shadow-xl overflow-x-auto">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-base font-bold text-white">
            Complete Red Blood Cell Transfusion Reference (8x8 Grid)
          </h2>
          <div className="flex items-center space-x-3 text-xs">
            <span className="flex items-center space-x-1 text-emerald-400 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block shadow-sm shadow-emerald-400/50" />
              <span>Compatible</span>
            </span>
            <span className="flex items-center space-x-1 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-600 inline-block" />
              <span>Incompatible</span>
            </span>
          </div>
        </div>

        <table className="w-full text-center text-xs border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="p-3 text-left font-bold text-slate-400 bg-white/5 rounded-tl-xl">
                Recipient \ Donor
              </th>
              {ALL_BLOOD_GROUPS.map(donor => (
                <th key={donor} className="p-3 font-bold text-white bg-white/5 font-mono">
                  {donor}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ALL_BLOOD_GROUPS.map(recip => (
              <tr key={recip} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="p-3 text-left font-bold text-white font-mono bg-white/5">
                  {recip}
                  {recip === 'AB+' && ' (Universal Recipient)'}
                </td>
                {ALL_BLOOD_GROUPS.map(donor => {
                  const compatible = isDonorCompatible(donor, recip);
                  return (
                    <td key={`${recip}-${donor}`} className="p-3 font-mono">
                      {compatible ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 font-bold shadow-xs">
                          ✓
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-slate-600">
                          —
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Clinical Disclaimer */}
      <div className="p-5 rounded-2xl glass-panel-burgundy border border-red-500/30 text-xs text-slate-300 flex items-start space-x-3 shadow-sm">
        <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-white">Clinical Cross-Matching Requirement:</p>
          <p className="mt-1 leading-relaxed text-slate-300/90">{MEDICAL_DISCLAIMER_TEXT}</p>
        </div>
      </div>
    </div>
  );
};
