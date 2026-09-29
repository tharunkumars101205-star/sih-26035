import React, { useState } from 'react';
import {
  Settings,
  Building2,
  Save,
  RotateCcw,
  CheckCircle2,
  ShieldAlert,
  UserCheck,
  Scale,
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { LaboratorySettings, UserRole } from '../../types';

interface SettingsPageProps {
  onNavigate: (path: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate }) => {
  const [settings, setSettings] = useState<LaboratorySettings>(storageService.getSettings());
  const [currentUser, setCurrentUser] = useState(storageService.getCurrentUser());
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.saveSettings(settings);
    setSaveMessage('Laboratory settings successfully updated.');
    setTimeout(() => setSaveMessage(null), 3500);
  };

  const handleExecuteReset = () => {
    storageService.resetToDemoDefaults();
    setConfirmResetOpen(false);
    setSaveMessage('All records successfully restored to OIML R 76 default benchmark dataset.');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleRoleChange = (role: UserRole) => {
    const updated = storageService.setCurrentUserRole(role);
    setCurrentUser(updated);
    setSaveMessage(`Switched simulated user role to: ${updated.designation}`);
    setTimeout(() => setSaveMessage(null), 3500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Laboratory Configuration & Settings
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Laboratory accreditation parameters, report header credentials, and simulated user permissions.
          </p>
        </div>

        <button
          onClick={() => setConfirmResetOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-800 bg-rose-50 border border-rose-200 rounded hover:bg-rose-100 transition-colors shadow-xs"
        >
          <RotateCcw size={13} />
          <span>Reset to Demo Benchmark Data</span>
        </button>
      </div>

      {confirmResetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
              <ShieldAlert size={18} />
              <span>Confirm Benchmark Data Reset</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Are you sure you want to reset all data back to the default synthetic benchmark dataset? This will restore clean OIML R 76-1 records and overwrite local edits.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmResetOpen(false)}
                className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteReset}
                className="px-4 py-1.5 bg-rose-700 text-white rounded font-semibold hover:bg-rose-800"
              >
                Reset All Records
              </button>
            </div>
          </div>
        </div>
      )}

      {saveMessage && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Simulated User Profile & Roles */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4 text-xs">
        <div className="border-b border-slate-100 pb-2">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <UserCheck size={14} className="text-cyan-700" />
            <span>Simulated User Role (Demo Testing)</span>
          </h2>
          <p className="text-slate-500 mt-0.5">
            Switch between testing personnel personas to evaluate distinct role-based permissions in the metrology workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              role: 'testing_engineer' as UserRole,
              title: 'Testing Engineer',
              desc: 'Enters instrument specs, records raw test points, submits evaluations',
              active: currentUser.role === 'testing_engineer',
            },
            {
              role: 'technical_reviewer' as UserRole,
              title: 'Technical Reviewer',
              desc: 'Inspects error curves, validates MPE compliance, approves evaluations',
              active: currentUser.role === 'technical_reviewer',
            },
            {
              role: 'laboratory_admin' as UserRole,
              title: 'Laboratory Administrator',
              desc: 'Manages ISO/IEC 17025 accreditation, standards, and rules library',
              active: currentUser.role === 'laboratory_admin',
            },
          ].map((item) => (
            <button
              key={item.role}
              type="button"
              onClick={() => handleRoleChange(item.role)}
              className={`p-3.5 rounded-lg border text-left transition-colors space-y-1 ${
                item.active
                  ? 'border-cyan-600 bg-cyan-50/50 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">{item.title}</span>
                {item.active && (
                  <span className="text-[10px] font-mono text-cyan-800 bg-cyan-100 px-1.5 py-0.2 rounded font-semibold">
                    ACTIVE
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-600 leading-normal">{item.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Laboratory Details Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4 text-xs">
          <div className="border-b border-slate-100 pb-2">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 size={14} className="text-cyan-700" />
              <span>Laboratory Accreditation & Contact Details</span>
            </h2>
            <p className="text-slate-500 mt-0.5">
              These details auto-populate on the header of all standardized OIML R 76-2 test reports.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block font-medium text-slate-700 mb-1">
                Official Laboratory Name
              </label>
              <input
                type="text"
                required
                value={settings.laboratoryName}
                onChange={(e) => setSettings({ ...settings, laboratoryName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Accreditation & Approval Reference
              </label>
              <input
                type="text"
                required
                value={settings.accreditationNumber}
                onChange={(e) => setSettings({ ...settings, accreditationNumber: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded text-slate-900 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Default Local Gravity $g$ (m/s²)
              </label>
              <input
                type="number"
                step="0.0001"
                required
                value={settings.defaultGravity}
                onChange={(e) =>
                  setSettings({ ...settings, defaultGravity: parseFloat(e.target.value) || 9.7912 })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded text-slate-900 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-medium text-slate-700 mb-1">Address Line 1</label>
              <input
                type="text"
                value={settings.addressLine1}
                onChange={(e) => setSettings({ ...settings, addressLine1: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">City, State & Postal Code</label>
              <input
                type="text"
                value={settings.cityStatePincode}
                onChange={(e) => setSettings({ ...settings, cityStatePincode: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Contact Phone</label>
              <input
                type="text"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Official Email</label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Website URL</label>
              <input
                type="text"
                value={settings.website}
                onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Save size={14} />
              <span>Save Laboratory Preferences</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
