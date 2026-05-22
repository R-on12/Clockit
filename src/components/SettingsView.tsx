import React, { useState } from 'react';
import { User, Lock, Bell, Palette, HelpCircle, LogOut, ChevronRight, Edit2, CheckCircle } from 'lucide-react';
import { UserSettings } from '../types';

interface SettingsViewProps {
  userSettings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onSignOut: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  userSettings,
  onUpdateSettings,
  onSignOut,
}) => {
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [tempName, setTempName] = useState(userSettings.name);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSaveProfile = () => {
    onUpdateSettings({ name: tempName });
    setShowEditProfile(false);
    setSuccessMsg('Sanctuary settings updated!');
    setTimeout(() => {
      setSuccessMsg('');
    }, 2500);
  };

  return (
    <div className="space-y-10 py-6 animate-fade-in" id="settings-parent-view">
      {/* Hero Header Section */}
      <section className="pt-8 pb-4">
        <h2 className="font-headline text-5xl font-extrabold tracking-tight text-primary leading-tight">
          Settings
        </h2>
        <p className="text-on-surface-variant font-body mt-4 max-w-xs leading-relaxed">
          Refine your sanctuary to match your personal rhythm.
        </p>
      </section>

      {successMsg && (
        <div className="bg-primary-container/20 text-on-primary-container p-4 rounded-xl flex items-center gap-2 text-sm border border-primary-container/30">
          <CheckCircle className="w-5 h-5 text-primary" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Profile Quick Card */}
      <section className="mb-10">
        <div className="bg-surface-container-low rounded-2xl p-6 flex items-center justify-between shadow-[0_4px_24px_rgba(0,0,0,0.01)] border border-outline-variant/10">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary-fixed/60 relative">
              <img
                className="w-full h-full object-cover"
                alt="Ronnie Rose Studio Portrait"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAgyN6hcg6K1DWFhrpKtsLOvGQPic66iJot5H9BmkYMS1pfknTN26X2alL5zKZWhGgrSv8mwEFMfl7nssPegY7u8w2hGbU0727UMvl9z9AWBVghWuFxN5AN1AWTbGo9pu7RIfLVBJhjq3PJOLBnbC1gKgAu8LakpFwgHTEdGfXUKBm1G_RJQRZIjSQhVm_w_1Ofj9MwYXk4Ocpu_qpyGeRzE2nzxVdnbLX_aIqoddIvwylVf_WR92rw1-00RGmhvyotXaVSlPi56pQ"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-headline font-bold text-lg text-on-surface">Ronnie Rose</h3>
                <button 
                  onClick={() => setShowEditProfile(!showEditProfile)}
                  className="p-1 hover:bg-surface-container hover:text-primary rounded-full transition-colors text-outline"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-sm text-on-surface-variant font-body">{userSettings.membership}</p>
            </div>
          </div>
          <div className="bg-secondary-container text-on-secondary-container px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider font-label shadow-sm">
            Zen Level {userSettings.zenLevel}
          </div>
        </div>

        {/* Inline Profile Editor */}
        {showEditProfile && (
          <div className="bg-surface-container-low/40 rounded-2xl p-5 mt-4 border border-outline-variant/20 animate-fade-in space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Edit Sanctuary Profile</h4>
            <div className="space-y-1">
              <label className="text-xs text-outline font-label block">Sanctuary Nickname</label>
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className="w-full bg-surface border border-outline-variant/30 rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-primary text-sm font-body text-on-surface"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button 
                onClick={() => setShowEditProfile(false)}
                className="py-1.5 px-3 hover:bg-surface-container rounded-lg text-xs font-semibold text-outline"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveProfile}
                className="py-1.5 px-4 bg-primary text-on-primary rounded-lg text-xs font-semibold shadow-sm"
              >
                Apply Names
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Settings Grid Rows */}
      <div className="space-y-8 pb-4">
        {/* Category: Account */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-outline px-2">Account</h4>
          <div className="bg-surface-container-low rounded-2xl overflow-hidden border border-outline-variant/10 shadow-[0_4px_24px_rgba(0,0,0,0.01)]">
            {/* Profile Row */}
            <div className="flex items-center justify-between p-5 cursor-pointer hover:bg-surface-container-high/60 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container-lowest text-primary shadow-sm">
                  <User className="w-5 h-5" />
                </div>
                <span className="font-body font-medium text-on-surface">Profile</span>
              </div>
              <ChevronRight className="w-5 h-5 text-outline group-hover:translate-x-1 transition-transform" />
            </div>
            
            {/* Privacy Row */}
            <div className="flex items-center justify-between p-5 cursor-pointer hover:bg-surface-container-high/60 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container-lowest text-primary shadow-sm">
                  <Lock className="w-5 h-5" />
                </div>
                <span className="font-body font-medium text-on-surface">Privacy</span>
              </div>
              <ChevronRight className="w-5 h-5 text-outline group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* Category: Preferences */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-outline px-2">Preferences</h4>
          <div className="bg-surface-container-low rounded-2xl overflow-hidden border border-outline-variant/10 shadow-[0_4px_24px_rgba(0,0,0,0.01)]">
            {/* Notifications Row */}
            <div className="flex items-center justify-between p-5 cursor-pointer hover:bg-surface-container-high/60 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container-lowest text-primary shadow-sm overflow-hidden">
                  <Bell className="w-5 h-5" />
                </div>
                <span className="font-body font-medium text-on-surface">Notifications</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-outline">{userSettings.notifications}</span>
                <ChevronRight className="w-5 h-5 text-outline group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* App Theme Row */}
            <div className="flex items-center justify-between p-5 cursor-pointer hover:bg-surface-container-high/60 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container-lowest text-primary shadow-sm">
                  <Palette className="w-5 h-5" />
                </div>
                <span className="font-body font-medium text-on-surface">App Theme</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3.5 h-3.5 rounded-full bg-primary border border-outline-variant/20 shadow-sm"></div>
                  <div className="w-3.5 h-3.5 rounded-full bg-secondary border border-outline-variant/20 shadow-sm"></div>
                </div>
                <ChevronRight className="w-5 h-5 text-outline group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>

        {/* Category: Help & Legal */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-outline px-2">Help & Legal</h4>
          <div className="bg-surface-container-low rounded-2xl overflow-hidden border border-outline-variant/10 shadow-[0_4px_24px_rgba(0,0,0,0.01)]">
            {/* Support Row */}
            <div className="flex items-center justify-between p-5 cursor-pointer hover:bg-surface-container-high/60 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container-lowest text-primary shadow-sm">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <span className="font-body font-medium text-on-surface">Support</span>
              </div>
              <ChevronRight className="w-5 h-5 text-outline group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* Sign Out Button */}
      <div className="mt-12 flex justify-center pb-6">
        <button 
          onClick={onSignOut}
          className="flex items-center gap-2 px-8 py-4 bg-surface-container-high text-secondary hover:bg-secondary-fixed/55 active:scale-95 transition-all font-bold rounded-full text-sm shadow-sm border border-outline-variant/10"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out from Clockit</span>
        </button>
      </div>

      <div className="mt-8 text-center pb-12">
        <p className="text-[10px] text-outline uppercase tracking-[0.3em]">Clockit Version 2.4.0 (Aether)</p>
      </div>
    </div>
  );
};
