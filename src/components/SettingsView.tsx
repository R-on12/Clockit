import React, { useState, useEffect } from 'react';
import { User, Lock, Bell, Palette, HelpCircle, LogOut, ChevronRight, Edit2, CheckCircle } from 'lucide-react';
import { UserSettings } from '../types';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

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
  const [expandedSection, setExpandedSection] = useState<'profile' | 'privacy' | 'notifications' | 'theme' | 'support' | null>(null);
  const [tempName, setTempName] = useState(userSettings.name);
  const [tempAvatar, setTempAvatar] = useState(userSettings.avatar);
  const [tempMembership, setTempMembership] = useState(userSettings.membership);
  const [tempZenLevel, setTempZenLevel] = useState(userSettings.zenLevel);
  const [successMsg, setSuccessMsg] = useState('');

  // Sync state if userSettings loaded/updated from outside
  useEffect(() => {
    setTempName(userSettings.name);
    setTempAvatar(userSettings.avatar);
    setTempMembership(userSettings.membership);
    setTempZenLevel(userSettings.zenLevel);
  }, [userSettings.name, userSettings.avatar, userSettings.membership, userSettings.zenLevel]);

  // Privacy states
  const [privacySettings, setPrivacySettings] = useState({
    privateSanctuary: false,
    publicZenLevel: true,
    anonymousCircles: false,
    optimization: true
  });

  // Support states
  const [supportCategory, setSupportCategory] = useState('Technical Help');
  const [supportText, setSupportText] = useState('');
  const [ticketSuccess, setTicketSuccess] = useState(false);

  const handleSaveProfile = () => {
    onUpdateSettings({
      name: tempName,
      avatar: tempAvatar,
      membership: tempMembership,
      zenLevel: tempZenLevel
    });
    setSuccessMsg('Sanctuary settings updated!');
    setTimeout(() => {
      setSuccessMsg('');
    }, 2500);
    setExpandedSection(null);
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
        <div 
          onClick={() => setExpandedSection(expandedSection === 'profile' ? null : 'profile')}
          className="bg-surface-container-low rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_4px_24px_rgba(0,0,0,0.01)] border border-outline-variant/10 cursor-pointer hover:bg-surface-container-high/40 transition-colors group"
        >
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-primary-fixed/60 relative shrink-0">
              <img
                className="w-full h-full object-cover"
                alt={`${userSettings.name} Studio Portrait`}
                src={userSettings.avatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuDoyaWl51725uwC6lMhOaK-1M9NPiGyMaUVkwLk2kEwMW2qwOzZw69c0PhlQIRB159p-2KQUuJPx2wagma4TziOrBe_sSIN8HuKKMZONsgDfZEQrlDLFO6-_mj205uXzIoo4UaPA6aJjYJQtt-7_L6xAxvAWWq791mVYhQZPEFw3xMoHlIfod_Jh8136RnAAc90bO97692QHKkgZYGJTRQ6qeI6G64FVaHQucqsoe-3o8a8okxigAJ9Wstm2AdaQl8xNWNAW-8Yf7Rg"}
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-headline font-bold text-base sm:text-lg text-on-surface">{userSettings.name}</h3>
                <div className="p-1 hover:bg-surface-container hover:text-primary rounded-full transition-colors text-outline group-hover:scale-110">
                  <Edit2 className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-xs sm:text-sm text-on-surface-variant font-body">{userSettings.membership}</p>
            </div>
          </div>
          <div className="bg-secondary-container text-on-secondary-container px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-semibold uppercase tracking-wider font-label shadow-sm self-end sm:self-auto">
            Zen Level {userSettings.zenLevel}
          </div>
        </div>

        {/* Inline Profile Editor */}
        {expandedSection === 'profile' && (
          <div className="bg-surface-container-low/40 rounded-2xl p-4 sm:p-5 mt-4 border border-outline-variant/20 animate-fade-in space-y-4">
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

            <div>
              <label className="text-xs text-outline font-label block mb-2">Preset Zen Avatar</label>
              <div className="flex gap-3 overflow-x-auto py-1">
                {[
                  { name: 'Classic Portrait', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDoyaWl51725uwC6lMhOaK-1M9NPiGyMaUVkwLk2kEwMW2qwOzZw69c0PhlQIRB159p-2KQUuJPx2wagma4TziOrBe_sSIN8HuKKMZONsgDfZEQrlDLFO6-_mj205uXzIoo4UaPA6aJjYJQtt-7_L6xAxvAWWq791mVYhQZPEFw3xMoHlIfod_Jh8136RnAAc90bO97692QHKkgZYGJTRQ6qeI6G64FVaHQucqsoe-3o8a8okxigAJ9Wstm2AdaQl8xNWNAW-8Yf7Rg' },
                  { name: 'Lotus Spirit', url: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&q=80&w=150' },
                  { name: 'Forest Path', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=150' },
                  { name: 'Ocean Wave', url: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&q=80&w=150' }
                ].map((av) => (
                  <button
                    key={av.url}
                    onClick={() => {
                      setTempAvatar(av.url);
                      onUpdateSettings({ avatar: av.url });
                    }}
                    className={`relative shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 transition-all ${tempAvatar === av.url ? 'border-primary scale-110 shadow-sm' : 'border-transparent hover:border-outline-variant/50'}`}
                    title={av.name}
                  >
                    <img src={av.url} className="w-full h-full object-cover" alt={av.name} referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-outline font-label block mb-2">Membership Tier</label>
              <div className="grid grid-cols-3 gap-2">
                {['Standard', 'Premium Member', 'Zen Master'].map((tier) => (
                  <button
                    key={tier}
                    onClick={() => setTempMembership(tier)}
                    className={`py-1.5 sm:py-2 px-1 text-center rounded-xl text-[10px] sm:text-xs font-semibold border transition-all ${tempMembership === tier ? 'bg-primary/10 border-primary text-primary font-bold' : 'bg-surface border-outline-variant/20 text-outline hover:border-outline-variant/60'}`}
                  >
                    {tier}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-outline font-label block mb-2">Zen Score Level ({tempZenLevel})</label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setTempZenLevel(Math.max(1, tempZenLevel - 1))}
                  className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface hover:text-primary transition-all flex items-center justify-center font-bold text-sm"
                >
                  -
                </button>
                <span className="font-headline font-bold text-sm sm:text-base w-8 text-center text-on-surface">{tempZenLevel}</span>
                <button
                  onClick={() => setTempZenLevel(tempZenLevel + 1)}
                  className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface hover:text-primary transition-all flex items-center justify-center font-bold text-sm"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant/10">
              <button 
                onClick={() => {
                  setTempName(userSettings.name);
                  setTempAvatar(userSettings.avatar);
                  setTempMembership(userSettings.membership);
                  setTempZenLevel(userSettings.zenLevel);
                  setExpandedSection(null);
                }}
                className="py-1.5 px-3 hover:bg-surface-container rounded-lg text-xs font-semibold text-outline"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveProfile}
                className="py-1.5 px-4 bg-primary text-on-primary rounded-lg text-xs font-semibold shadow-sm"
              >
                Apply Profile
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
            <div 
              onClick={() => setExpandedSection(expandedSection === 'profile' ? null : 'profile')}
              className="flex items-center justify-between p-4 sm:p-5 cursor-pointer hover:bg-surface-container-high/60 transition-colors group border-b border-outline-variant/5"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-surface-container-lowest text-primary shadow-sm shrink-0">
                  <User className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                </div>
                <span className="font-body font-medium text-sm sm:text-base text-on-surface">Profile</span>
              </div>
              <ChevronRight className={`w-5 h-5 text-outline transition-transform duration-200 shrink-0 ${expandedSection === 'profile' ? 'rotate-90 text-primary' : 'group-hover:translate-x-1'}`} />
            </div>
            
            {/* Privacy Row */}
            <div 
              onClick={() => setExpandedSection(expandedSection === 'privacy' ? null : 'privacy')}
              className="flex items-center justify-between p-4 sm:p-5 cursor-pointer hover:bg-surface-container-high/60 transition-colors group"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-surface-container-lowest text-primary shadow-sm shrink-0">
                  <Lock className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                </div>
                <span className="font-body font-medium text-sm sm:text-base text-on-surface">Privacy & Security</span>
              </div>
              <ChevronRight className={`w-5 h-5 text-outline transition-transform duration-200 shrink-0 ${expandedSection === 'privacy' ? 'rotate-90 text-primary' : 'group-hover:translate-x-1'}`} />
            </div>

            {/* Privacy Expanded Panel */}
            {expandedSection === 'privacy' && (
              <div className="border-t border-outline-variant/10 p-4 sm:p-5 bg-surface-container-lowest/50 space-y-4 animate-fade-in text-on-surface font-body text-sm">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-xs sm:text-sm">Private Sanctuary Mode</div>
                      <div className="text-[10px] sm:text-xs text-on-surface-variant">Hide active status from community circle feeds</div>
                    </div>
                    <button
                      onClick={() => setPrivacySettings(prev => ({ ...prev, privateSanctuary: !prev.privateSanctuary }))}
                      className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${privacySettings.privateSanctuary ? 'bg-primary' : 'bg-outline-variant/50'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${privacySettings.privateSanctuary ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-xs sm:text-sm">Publish Zen Level</div>
                      <div className="text-[10px] sm:text-xs text-on-surface-variant">Allow circle members to see your achievements</div>
                    </div>
                    <button
                      onClick={() => setPrivacySettings(prev => ({ ...prev, publicZenLevel: !prev.publicZenLevel }))}
                      className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${privacySettings.publicZenLevel ? 'bg-primary' : 'bg-outline-variant/50'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${privacySettings.publicZenLevel ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-xs sm:text-sm">Anonymous Posting</div>
                      <div className="text-[10px] sm:text-xs text-on-surface-variant">Contribute to community feeds as "Anonymous Companion"</div>
                    </div>
                    <button
                      onClick={() => setPrivacySettings(prev => ({ ...prev, anonymousCircles: !prev.anonymousCircles }))}
                      className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${privacySettings.anonymousCircles ? 'bg-primary' : 'bg-outline-variant/50'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${privacySettings.anonymousCircles ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>
                <div className="flex justify-end pt-2 border-t border-outline-variant/10">
                  <button
                    onClick={() => {
                      setSuccessMsg('Privacy preferences stored safely in sanctuary.');
                      setTimeout(() => setSuccessMsg(''), 2500);
                      setExpandedSection(null);
                    }}
                    className="py-1.5 px-4 bg-primary text-on-primary rounded-lg text-xs font-semibold shadow-sm w-full sm:w-auto text-center"
                  >
                    Save Preferences
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Category: Preferences */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-outline px-2">Preferences</h4>
          <div className="bg-surface-container-low rounded-2xl overflow-hidden border border-outline-variant/10 shadow-[0_4px_24px_rgba(0,0,0,0.01)]">
            {/* Notifications Row */}
            <div 
              onClick={() => setExpandedSection(expandedSection === 'notifications' ? null : 'notifications')}
              className="flex items-center justify-between p-4 sm:p-5 cursor-pointer hover:bg-surface-container-high/60 transition-colors group border-b border-outline-variant/5"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-surface-container-lowest text-primary shadow-sm overflow-hidden shrink-0">
                  <Bell className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                </div>
                <span className="font-body font-medium text-sm sm:text-base text-on-surface">Notifications</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <span className="text-xs text-outline">{userSettings.notifications}</span>
                <ChevronRight className={`w-5 h-5 text-outline transition-transform duration-200 shrink-0 ${expandedSection === 'notifications' ? 'rotate-90 text-primary' : 'group-hover:translate-x-1'}`} />
              </div>
            </div>

            {/* Notifications Expanded Panel */}
            {expandedSection === 'notifications' && (
              <div className="border-t border-outline-variant/10 p-4 sm:p-5 bg-surface-container-lowest/50 space-y-4 animate-fade-in font-body">
                <div className="grid grid-cols-1 gap-2.5">
                  {[
                    { label: 'Smart Alerts', desc: 'Notify only when bio-pulses show cognitive stress load' },
                    { label: 'All Alerts', desc: 'Updates on community replies, meditation cues, and reflections' },
                    { label: 'Off', desc: 'Completely muted state for peaceful stillness' }
                  ].map((item) => (
                    <div
                      key={item.label}
                      onClick={() => onUpdateSettings({ notifications: item.label })}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${userSettings.notifications === item.label ? 'border-primary bg-primary/5 text-primary' : 'border-outline-variant/20 bg-surface text-on-surface hover:border-outline-variant/50'}`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center ${userSettings.notifications === item.label ? 'border-primary' : 'border-outline'}`}>
                        {userSettings.notifications === item.label && (
                          <div className="w-2 h-2 bg-primary rounded-full" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-xs sm:text-sm">{item.label}</div>
                        <div className="text-[10px] sm:text-xs text-on-surface-variant mt-0.5">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* App Theme Row */}
            <div 
              onClick={() => setExpandedSection(expandedSection === 'theme' ? null : 'theme')}
              className="flex items-center justify-between p-4 sm:p-5 cursor-pointer hover:bg-surface-container-high/60 transition-colors group"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-surface-container-lowest text-primary shadow-sm shrink-0">
                  <Palette className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                </div>
                <span className="font-body font-medium text-sm sm:text-base text-on-surface">App Theme</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <div className="flex gap-1.5 shrink-0">
                  <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-primary border border-outline-variant/20 shadow-sm"></div>
                  <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-secondary border border-outline-variant/20 shadow-sm"></div>
                </div>
                <ChevronRight className={`w-5 h-5 text-outline transition-transform duration-200 shrink-0 ${expandedSection === 'theme' ? 'rotate-90 text-primary' : 'group-hover:translate-x-1'}`} />
              </div>
            </div>

            {/* App Theme Expanded Panel */}
            {expandedSection === 'theme' && (
              <div className="border-t border-outline-variant/10 p-4 sm:p-5 bg-surface-container-lowest/50 space-y-4 animate-fade-in">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'light', label: 'Light', preview: 'bg-[#f8faf3]', desc: 'Garden Green' },
                    { id: 'dark', label: 'Dark', preview: 'bg-[#11140f] border-neutral-700', desc: 'Obsidian Pine' },
                    { id: 'sepia', label: 'Sepia', preview: 'bg-[#f4edd8]', desc: 'Warm Paper' },
                    { id: 'ocean', label: 'Ocean', preview: 'bg-[#0b131a] border-[#132230]', desc: 'Calming Blue' },
                    { id: 'forest', label: 'Forest', preview: 'bg-[#0d1612] border-[#1b2d22]', desc: 'Deep Velvet' },
                    { id: 'cosmic', label: 'Cosmic', preview: 'bg-[#110e1a] border-[#221a36]', desc: 'Violet Nebula' }
                  ].map((t) => (
                    <div
                      key={t.id}
                      onClick={() => onUpdateSettings({ themeMode: t.id as 'light' | 'dark' | 'sepia' | 'ocean' | 'forest' | 'cosmic' })}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-2 cursor-pointer transition-all ${userSettings.themeMode === t.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-outline-variant/20 bg-surface hover:border-outline-variant/50'}`}
                    >
                      <div className={`w-10 h-10 rounded-full border border-outline-variant/30 flex items-center justify-center ${t.preview} shadow-sm`}>
                        {userSettings.themeMode === t.id && (
                          <div className="w-4 h-4 bg-primary rounded-full" />
                        )}
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-xs text-on-surface">{t.label}</div>
                        <div className="text-[9px] text-on-surface-variant mt-0.5 uppercase tracking-wide">{t.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Category: Help & Legal */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-outline px-2">Help & Support</h4>
          <div className="bg-surface-container-low rounded-2xl overflow-hidden border border-outline-variant/10 shadow-[0_4px_24px_rgba(0,0,0,0.01)]">
            {/* Support Row */}
            <div 
              onClick={() => setExpandedSection(expandedSection === 'support' ? null : 'support')}
              className="flex items-center justify-between p-4 sm:p-5 cursor-pointer hover:bg-surface-container-high/60 transition-colors group"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-surface-container-lowest text-primary shadow-sm shrink-0">
                  <HelpCircle className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                </div>
                <span className="font-body font-medium text-sm sm:text-base text-on-surface">Submitting Wellness Support</span>
              </div>
              <ChevronRight className={`w-5 h-5 text-outline transition-transform duration-200 shrink-0 ${expandedSection === 'support' ? 'rotate-90 text-primary' : 'group-hover:translate-x-1'}`} />
            </div>

            {/* Support Expanded Panel */}
            {expandedSection === 'support' && (
              <div className="border-t border-outline-variant/10 p-4 sm:p-5 bg-surface-container-lowest/50 space-y-4 animate-fade-in font-body text-sm text-on-surface">
                {ticketSuccess ? (
                  <div className="text-center py-4 space-y-2">
                    <CheckCircle className="w-10 h-10 text-primary mx-auto" strokeWidth={1.5} />
                    <h5 className="font-headline font-bold text-sm text-on-surface">Support Ticket Sent</h5>
                    <p className="text-xs text-on-surface-variant max-w-xs mx-auto">
                      Our sanctuary specialists will communicate with you regarding "{supportCategory}" shortly. Always here to help.
                    </p>
                    <button
                      onClick={() => {
                        setTicketSuccess(false);
                        setSupportText('');
                      }}
                      className="text-primary text-xs font-semibold hover:underline mt-2 inline-block bg-primary/10 px-3 py-1 rounded-full"
                    >
                      New Inquiry
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-outline font-label block mb-1.5">Sanctuary Support Topic</label>
                      <select
                        value={supportCategory}
                        onChange={(e) => setSupportCategory(e.target.value)}
                        className="w-full bg-surface border border-outline-variant/30 rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-primary text-sm font-body text-on-surface"
                      >
                        <option>Technical Help</option>
                        <option>Billing & Sanctuary Plans</option>
                        <option>Guided Meditation Requests</option>
                        <option>App Feedback</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-outline font-label block mb-1.5">Describe your Inquiry</label>
                      <textarea
                        value={supportText}
                        onChange={(e) => setSupportText(e.target.value)}
                        placeholder="Type here. May peace be with your journey..."
                        rows={3}
                        className="w-full bg-surface border border-outline-variant/30 rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-primary text-sm font-body text-on-surface resize-none"
                      />
                    </div>

                    <div className="flex justify-end pt-2 border-t border-outline-variant/10">
                      <button
                        onClick={async () => {
                          if (!supportText.trim()) return;
                          try {
                            await addDoc(collection(db, 'reviews'), {
                              userName: userSettings.name || 'Anonymous Usr',
                              userEmail: userSettings.email || 'anonymous@clockit.com',
                              userAvatar: userSettings.avatar || '',
                              category: supportCategory,
                              text: supportText,
                              createdAt: new Date().toISOString(),
                              status: 'pending'
                            });
                          } catch (err) {
                            console.error('Failed to save review to firestore:', err);
                          }
                          setTicketSuccess(true);
                        }}
                        disabled={!supportText.trim()}
                        className="py-1.5 px-4 bg-primary text-on-primary rounded-xl text-xs font-semibold shadow-sm w-full sm:w-auto text-center disabled:opacity-50"
                      >
                        Submit Ticket
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
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
