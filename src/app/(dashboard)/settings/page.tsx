"use client";

import { useState } from "react";
import { motion, Variants } from "framer-motion";
import {
  Settings, User, Bell, Shield, Key, Globe, Moon,
  Check, ChevronRight, Copy, Eye, EyeOff, Zap
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};
const stagger: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };

type Section = "profile" | "notifications" | "api" | "security";

const sections: { label: string; icon: typeof Settings; key: Section }[] = [
  { label: "Profile", icon: User, key: "profile" },
  { label: "Notifications", icon: Bell, key: "notifications" },
  { label: "API & Integrations", icon: Key, key: "api" },
  { label: "Security", icon: Shield, key: "security" },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-all duration-300 ${checked ? "bg-indigo-500" : "bg-white/10"}`}
    >
      <motion.div
        animate={{ x: checked ? 22 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 40 }}
        className="absolute top-[2px] w-4 h-4 rounded-full bg-white shadow-sm"
      />
    </button>
  );
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-white/[0.05] last:border-0">
      <div>
        <p className="text-[14px] font-semibold text-white">{label}</p>
        {description && <p className="text-[12px] text-zinc-500 mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<Section>("profile");
  const [showApiKey, setShowApiKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const MOCK_API_KEY = "eg_sk_live_••••••••••••••••••••••••••••••••";
  const MOCK_REVEALED = "eg_sk_live_xK9jN2mPqRs8wYtUvLhBnE3cFdGaOiZu";

  const [notifications, setNotifications] = useState({
    emailOnComplete: true,
    weeklyDigest: false,
    slackAlerts: false,
    smsAlerts: false,
  });

  const [security, setSecurity] = useState({
    twoFactor: false,
    sessionTimeout: true,
  });

  const copyKey = () => {
    navigator.clipboard.writeText(MOCK_REVEALED);
    setCopied(true);
    toast.success("API key copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#020202] selection:bg-indigo-500/20">
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/[0.03] blur-[120px] rounded-full" />
      </div>

      <Toaster position="bottom-right" toastOptions={{ style: { background: "#111", color: "#fff", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px" }, duration: 2500 }} />

      <div className="relative z-10 max-w-[1000px] mx-auto px-6 py-8 lg:px-10 lg:py-10">

        {/* Header */}
        <motion.div initial="hidden" animate="visible" variants={stagger} className="mb-8">
          <motion.div variants={fadeUp} className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-[11px] bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center">
              <Settings className="w-4 h-4 text-indigo-400" />
            </div>
            <h1 className="text-[26px] font-bold tracking-tight text-white">Settings</h1>
          </motion.div>
          <motion.p variants={fadeUp} className="text-zinc-500 text-[14px] ml-12">
            Manage your account and platform preferences
          </motion.p>
        </motion.div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar nav */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="md:w-[200px] shrink-0"
          >
            <div className="rounded-[16px] border border-white/[0.06] bg-[#0a0a0a] p-2 space-y-0.5">
              {sections.map(({ label, icon: Icon, key }) => (
                <button
                  key={key}
                  onClick={() => setActiveSection(key)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] text-[13px] font-medium transition-all ${
                    activeSection === key
                      ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/20"
                      : "text-zinc-500 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                  {activeSection === key && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Content panel */}
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1 rounded-[18px] border border-white/[0.06] bg-[#0a0a0a] p-6"
          >
            {/* Profile */}
            {activeSection === "profile" && (
              <div className="space-y-6">
                <h2 className="text-[15px] font-bold text-white">Profile Information</h2>

                <div className="flex items-center gap-5 p-4 rounded-[14px] bg-white/[0.02] border border-white/[0.05]">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-[22px] font-black text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                    A
                  </div>
                  <div>
                    <p className="text-[15px] font-bold text-white">Admin User</p>
                    <p className="text-[13px] text-zinc-500">admin@echograde.ai</p>
                  </div>
                  <button className="ml-auto text-[12px] font-medium text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 rounded-[8px] transition-all">
                    Change Avatar
                  </button>
                </div>

                <div className="space-y-4">
                  {[
                    { label: "Display Name", defaultValue: "Admin User", type: "text" },
                    { label: "Email Address", defaultValue: "admin@echograde.ai", type: "email" },
                    { label: "Organization", defaultValue: "EchoGrade Inc.", type: "text" },
                  ].map(field => (
                    <div key={field.label}>
                      <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">
                        {field.label}
                      </label>
                      <input
                        type={field.type}
                        defaultValue={field.defaultValue}
                        className="w-full h-10 px-3.5 rounded-[10px] bg-black/60 border border-white/[0.08] text-[14px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => toast.success("Profile updated!")}
                    className="h-9 px-5 rounded-[10px] bg-indigo-500/15 border border-indigo-500/20 text-[13px] font-semibold text-indigo-400 hover:bg-indigo-500/25 transition-all"
                  >
                    Save Changes
                  </motion.button>
                </div>
              </div>
            )}

            {/* Notifications */}
            {activeSection === "notifications" && (
              <div>
                <h2 className="text-[15px] font-bold text-white mb-5">Notification Preferences</h2>
                <div className="divide-y divide-white/[0.05]">
                  <SettingRow label="Email on completion" description="Get an email when a candidate finishes an interview">
                    <Toggle checked={notifications.emailOnComplete} onChange={v => setNotifications(p => ({ ...p, emailOnComplete: v }))} />
                  </SettingRow>
                  <SettingRow label="Weekly digest" description="Weekly summary of submissions and scores">
                    <Toggle checked={notifications.weeklyDigest} onChange={v => setNotifications(p => ({ ...p, weeklyDigest: v }))} />
                  </SettingRow>
                  <SettingRow label="Slack alerts" description="Push notifications to a Slack webhook">
                    <Toggle checked={notifications.slackAlerts} onChange={v => setNotifications(p => ({ ...p, slackAlerts: v }))} />
                  </SettingRow>
                  <SettingRow label="SMS alerts" description="Receive text messages for high-priority events">
                    <Toggle checked={notifications.smsAlerts} onChange={v => setNotifications(p => ({ ...p, smsAlerts: v }))} />
                  </SettingRow>
                </div>
              </div>
            )}

            {/* API */}
            {activeSection === "api" && (
              <div className="space-y-6">
                <h2 className="text-[15px] font-bold text-white">API & Integrations</h2>

                <div className="rounded-[14px] border border-white/[0.06] bg-black/40 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-indigo-400" />
                      <p className="text-[13px] font-bold text-white">API Key</p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">Live</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-[12px] font-mono text-zinc-400 bg-black/60 border border-white/[0.06] px-3 py-2.5 rounded-[10px] truncate">
                      {showApiKey ? MOCK_REVEALED : MOCK_API_KEY}
                    </code>
                    <button onClick={() => setShowApiKey(v => !v)} className="w-9 h-9 rounded-[9px] border border-white/[0.08] bg-white/[0.03] flex items-center justify-center text-zinc-500 hover:text-white transition-all">
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button onClick={copyKey} className="w-9 h-9 rounded-[9px] border border-white/[0.08] bg-white/[0.03] flex items-center justify-center text-zinc-500 hover:text-white transition-all">
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-600 mt-2">Keep this key secret. Rotate it immediately if compromised.</p>
                </div>

                <div className="space-y-2.5">
                  <p className="text-[13px] font-bold text-white mb-3">Available Integrations</p>
                  {[
                    { name: "Slack", desc: "Post interview completions to a channel", icon: "🔔" },
                    { name: "Greenhouse ATS", desc: "Sync candidates automatically", icon: "🌿" },
                    { name: "Zapier", desc: "Automate workflows with 5000+ apps", icon: "⚡" },
                    { name: "Webhooks", desc: "POST events to your own endpoint", icon: "🔗" },
                  ].map(integration => (
                    <div key={integration.name} className="flex items-center gap-4 p-4 rounded-[12px] border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                      <span className="text-[20px]">{integration.icon}</span>
                      <div className="flex-1">
                        <p className="text-[13px] font-semibold text-white">{integration.name}</p>
                        <p className="text-[11px] text-zinc-500">{integration.desc}</p>
                      </div>
                      <button className="text-[12px] font-semibold text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 rounded-[8px] transition-all">
                        Connect
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Security */}
            {activeSection === "security" && (
              <div>
                <h2 className="text-[15px] font-bold text-white mb-5">Security Settings</h2>
                <div className="divide-y divide-white/[0.05] mb-6">
                  <SettingRow label="Two-factor authentication" description="Add an extra layer of login security">
                    <Toggle checked={security.twoFactor} onChange={v => setSecurity(p => ({ ...p, twoFactor: v }))} />
                  </SettingRow>
                  <SettingRow label="Auto session timeout" description="Sign out after 30 minutes of inactivity">
                    <Toggle checked={security.sessionTimeout} onChange={v => setSecurity(p => ({ ...p, sessionTimeout: v }))} />
                  </SettingRow>
                </div>

                <div className="rounded-[14px] border border-red-500/15 bg-red-500/[0.04] p-5">
                  <h3 className="text-[13px] font-bold text-red-400 mb-1">Danger Zone</h3>
                  <p className="text-[12px] text-zinc-500 mb-4">Irreversible actions. Proceed with caution.</p>
                  <button
                    onClick={() => toast.error("Account deletion requires email confirmation.")}
                    className="text-[12px] font-bold text-red-400 border border-red-500/20 bg-red-500/10 px-4 py-2 rounded-[9px] hover:bg-red-500/15 transition-all"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
