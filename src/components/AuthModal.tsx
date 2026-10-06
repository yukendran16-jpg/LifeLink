import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { UserRole, BloodGroup } from '../types';
import { ALL_BLOOD_GROUPS } from '../lib/compatibility';
import { X, Heart, Hospital, Shield, Sparkles, AlertCircle, Lock, Mail, Building2, Phone } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: UserRole;
  onSuccessNavigate?: (tab: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialRole = 'DONOR',
  onSuccessNavigate
}) => {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, switchSimulatedPersona } = useAuth();
  const toast = useToast();

  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O+');
  const [city, setCity] = useState('New York');
  const [phone, setPhone] = useState('');

  // Hospital specific
  const [hospitalName, setHospitalName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [address, setAddress] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      if (mode === 'LOGIN') {
        await signInWithEmail(email, password);
        toast.success('Signed in successfully.');
      } else {
        if (selectedRole === 'DONOR') {
          await signUpWithEmail(email, password, displayName || 'Donor', 'DONOR', {
            bloodGroup,
            city,
            phone
          });
          toast.success('Donor account registered successfully!');
        } else if (selectedRole === 'HOSPITAL') {
          await signUpWithEmail(email, password, hospitalName || 'Hospital Center', 'HOSPITAL', {
            hospitalName,
            licenseNumber,
            address,
            city,
            phone
          });
          toast.success('Hospital facility registered. Verification pending.');
        } else {
          await signUpWithEmail(email, password, displayName || 'System Admin', 'ADMIN');
          toast.success('Administrator profile provisioned.');
        }
      }

      onClose();
      if (onSuccessNavigate) {
        if (selectedRole === 'DONOR') onSuccessNavigate('donor');
        else if (selectedRole === 'HOSPITAL') onSuccessNavigate('hospital');
        else onSuccessNavigate('admin');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication operation failed. Please verify credentials.');
      toast.error('Authentication failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    setLoading(true);
    try {
      await signInWithGoogle(selectedRole);
      toast.success('Signed in with Google.');
      onClose();
      if (onSuccessNavigate) {
        onSuccessNavigate(selectedRole === 'DONOR' ? 'donor' : 'hospital');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Google sign-in was cancelled or failed.');
      toast.error('Google Sign-In failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (role: UserRole, personaId?: string) => {
    switchSimulatedPersona(role, personaId);
    toast.success(`Active persona switched to ${role} (${personaId || 'Admin'})`);
    onClose();
    if (onSuccessNavigate) {
      if (role === 'DONOR') onSuccessNavigate('donor');
      else if (role === 'HOSPITAL') onSuccessNavigate('hospital');
      else onSuccessNavigate('admin');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#162032] border border-white/15 rounded-3xl shadow-2xl overflow-hidden text-white max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-[#162032]">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-[#351522] via-[#C62845] to-[#E63950] text-white border border-white/20 shadow-xs">
              {selectedRole === 'DONOR' && <Heart className="w-5 h-5 fill-white" />}
              {selectedRole === 'HOSPITAL' && <Hospital className="w-5 h-5" />}
              {selectedRole === 'ADMIN' && <Shield className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                {mode === 'LOGIN' ? 'Sign In to LifeLink' : `Register as ${selectedRole}`}
              </h3>
              <p className="text-xs text-slate-400">
                {selectedRole === 'DONOR'
                  ? 'Volunteer blood donor registry'
                  : selectedRole === 'HOSPITAL'
                  ? 'Accredited healthcare facility portal'
                  : 'Platform oversight & compliance'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Selector Tabs */}
        <div className="px-6 pt-3 pb-2 border-b border-white/10 flex items-center space-x-2 bg-[#101827]">
          <button
            type="button"
            onClick={() => setSelectedRole('DONOR')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
              selectedRole === 'DONOR'
                ? 'bg-gradient-to-r from-[#C62845] to-[#E63950] text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Donor</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole('HOSPITAL')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
              selectedRole === 'HOSPITAL'
                ? 'bg-gradient-to-r from-[#C62845] to-[#E63950] text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Hospital className="w-3.5 h-3.5" />
            <span>Hospital</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole('ADMIN')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
              selectedRole === 'ADMIN'
                ? 'bg-gradient-to-r from-indigo-700 to-indigo-500 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Quick Evaluator Launcher Box */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-amber-300 flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Instant Review & Demo Launch</span>
              </span>
              <span className="text-[10px] text-slate-400">1-Click Evaluation</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('DONOR', 'donor_marcus_chen')}
                className="py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white text-[11px] font-bold transition-colors text-center border border-white/10 shadow-xs"
              >
                Donor (O-)
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('HOSPITAL', 'hosp_st_jude_trauma')}
                className="py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white text-[11px] font-bold transition-colors text-center border border-white/10 shadow-xs"
              >
                Hospital Console
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('ADMIN')}
                className="py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white text-[11px] font-bold transition-colors text-center border border-white/10 shadow-xs"
              >
                Admin Oversight
              </button>
            </div>
          </div>

          {/* Social Sign In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-bold text-white flex items-center justify-center space-x-2 transition-all shadow-xs"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink mx-3 text-slate-400 text-[10px] uppercase tracking-wider font-bold">
              Or with credentials
            </span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/40 text-[#E63950] text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-[#E63950] mt-0.5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {mode === 'SIGNUP' && selectedRole === 'DONOR' && (
              <>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Marcus Chen"
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-white focus:outline-none focus:border-[#E63950]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Blood Group</label>
                    <select
                      value={bloodGroup}
                      onChange={e => setBloodGroup(e.target.value as BloodGroup)}
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
                    <label className="block font-bold text-slate-300 mb-1">City / Region</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      placeholder="New York"
                      className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-white focus:outline-none focus:border-[#E63950]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-white focus:outline-none focus:border-[#E63950]"
                  />
                </div>
              </>
            )}

            {mode === 'SIGNUP' && selectedRole === 'HOSPITAL' && (
              <>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Hospital Facility Name</label>
                  <input
                    type="text"
                    required
                    value={hospitalName}
                    onChange={e => setHospitalName(e.target.value)}
                    placeholder="St. Jude Trauma Center"
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-white focus:outline-none focus:border-[#E63950]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">State Medical License Number</label>
                  <input
                    type="text"
                    required
                    value={licenseNumber}
                    onChange={e => setLicenseNumber(e.target.value)}
                    placeholder="HOSP-REG-NY-90214"
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-white focus:outline-none focus:border-[#E63950]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      placeholder="New York"
                      className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-white focus:outline-none focus:border-[#E63950]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Emergency Phone</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-white focus:outline-none focus:border-[#E63950]"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Email & Password */}
            <div>
              <label className="block font-bold text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-[#E63950]"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-[#E63950]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#C62845] to-[#E63950] hover:opacity-90 text-white font-bold text-xs transition-all shadow-md shadow-red-950/40 mt-3 disabled:opacity-50"
            >
              {loading
                ? 'Processing...'
                : mode === 'LOGIN'
                ? `Sign In as ${selectedRole}`
                : `Complete ${selectedRole} Registration`}
            </button>
          </form>

          {/* Toggle Login / Register */}
          <div className="pt-2 text-center text-xs text-slate-400">
            {mode === 'LOGIN' ? (
              <p>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('SIGNUP')}
                  className="text-[#E63950] font-bold hover:underline"
                >
                  Create {selectedRole} Account
                </button>
              </p>
            ) : (
              <p>
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => setMode('LOGIN')}
                  className="text-[#E63950] font-bold hover:underline"
                >
                  Sign In
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
