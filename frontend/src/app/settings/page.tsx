"use client"

import { useState } from "react"
import {
  Cpu,
  Moon,
  Sun,
  Bell,
  Shield,
  Download,
  Trash2,
  Save,
  RotateCcw,
  ChevronRight,
  Server,
  Sliders,
  FileOutput,
} from "lucide-react"

function Toggle({ checked, onChange, id }: { checked: boolean; onChange: (v: boolean) => void; id: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      id={id}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? "bg-purple-600" : "bg-gray-200 dark:bg-gray-700"}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  )
}

function SettingRow({ label, description, children, id }: { label: string; description?: string; children: React.ReactNode; id: string }) {
  return (
    <div id={id} className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div className="flex-1 min-w-0 mr-6">
        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  )
}

function SectionHeader({ icon: Icon, title, color }: { icon: React.ElementType; title: string; color: string }) {
  return (
    <div className="flex items-center gap-3 mb-0">
      <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
    </div>
  )
}

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    // AI Model
    model: "llama3-8b-instruct",
    quantization: "q4_k_m",
    temperature: 0.3,
    maxTokens: 4096,
    gpuLayers: 35,
    // Appearance
    darkMode: false,
    compactMode: false,
    // Notifications
    emailNotify: true,
    reviewComplete: true,
    weeklySummary: false,
    // Privacy
    anonymousUsage: false,
    // Export
    defaultFormat: "pdf",
    includeMeta: true,
    includeAgentDetails: true,
  })

  const set = (key: string, value: unknown) => setSettings((prev) => ({ ...prev, [key]: value }))

  return (
    <div className="p-6 max-w-3xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure your ScholarLens experience and AI model preferences.</p>
      </div>

      <div className="space-y-6">
        {/* AI Model Configuration */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          <SectionHeader icon={Cpu} title="AI Model Configuration" color="bg-gradient-to-br from-purple-500 to-violet-500" />
          <div className="mt-4 space-y-0">
            <SettingRow id="setting-model" label="Language Model" description="The local model used for all 5 review agents via Ollama.">
              <select
                value={settings.model}
                onChange={(e) => set("model", e.target.value)}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              >
                <option value="llama3-8b-instruct">Llama 3 8B Instruct</option>
                <option value="llama3-70b-instruct">Llama 3 70B Instruct</option>
                <option value="mistral-7b-instruct">Mistral 7B Instruct</option>
                <option value="phi3-mini">Phi-3 Mini</option>
              </select>
            </SettingRow>

            <SettingRow id="setting-quantization" label="Quantization" description="Lower quantization saves VRAM, slightly reduces quality.">
              <select
                value={settings.quantization}
                onChange={(e) => set("quantization", e.target.value)}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              >
                <option value="q4_k_m">Q4_K_M (Recommended, ~4GB)</option>
                <option value="q5_k_m">Q5_K_M (Better quality, ~5GB)</option>
                <option value="q8_0">Q8_0 (Highest quality, ~8GB)</option>
                <option value="f16">FP16 (Full precision, ~16GB)</option>
              </select>
            </SettingRow>

            <SettingRow id="setting-temperature" label={`Temperature: ${settings.temperature}`} description="Controls creativity. Lower = more consistent, factual reviews.">
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={settings.temperature}
                onChange={(e) => set("temperature", parseFloat(e.target.value))}
                className="w-32 accent-purple-600"
              />
            </SettingRow>

            <SettingRow id="setting-max-tokens" label="Max Output Tokens" description="Maximum tokens per agent response. Higher = more detailed reviews.">
              <select
                value={settings.maxTokens}
                onChange={(e) => set("maxTokens", parseInt(e.target.value))}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              >
                <option value={2048}>2048</option>
                <option value={4096}>4096 (Default)</option>
                <option value={8192}>8192</option>
              </select>
            </SettingRow>

            <SettingRow id="setting-gpu-layers" label={`GPU Layers: ${settings.gpuLayers}`} description="Number of layers to offload to GPU. More layers = faster inference.">
              <input
                type="range"
                min={0}
                max={40}
                step={5}
                value={settings.gpuLayers}
                onChange={(e) => set("gpuLayers", parseInt(e.target.value))}
                className="w-32 accent-purple-600"
              />
            </SettingRow>
          </div>

          {/* Ollama status */}
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl flex items-center gap-3">
            <Server className="w-4 h-4 text-gray-400" />
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Ollama Server Status</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">localhost:11434</p>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Connected</span>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          <SectionHeader icon={Sun} title="Appearance" color="bg-gradient-to-br from-amber-400 to-orange-500" />
          <div className="mt-4">
            <SettingRow id="setting-dark-mode" label="Dark Mode" description="Switch to dark theme for low-light environments.">
              <Toggle checked={settings.darkMode} onChange={(v) => { set("darkMode", v); document.documentElement.classList.toggle("dark", v) }} id="toggle-dark-mode" />
            </SettingRow>
            <SettingRow id="setting-compact" label="Compact Mode" description="Reduce spacing for a denser information layout.">
              <Toggle checked={settings.compactMode} onChange={(v) => set("compactMode", v)} id="toggle-compact" />
            </SettingRow>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          <SectionHeader icon={Bell} title="Notifications" color="bg-gradient-to-br from-blue-500 to-indigo-500" />
          <div className="mt-4">
            <SettingRow id="setting-email-notify" label="Email Notifications" description="Receive email when a review is complete.">
              <Toggle checked={settings.emailNotify} onChange={(v) => set("emailNotify", v)} id="toggle-email-notify" />
            </SettingRow>
            <SettingRow id="setting-review-complete" label="In-App Alerts" description="Show a notification when AI processing finishes.">
              <Toggle checked={settings.reviewComplete} onChange={(v) => set("reviewComplete", v)} id="toggle-review-complete" />
            </SettingRow>
            <SettingRow id="setting-weekly-summary" label="Weekly Summary" description="Get a weekly digest of your review activity.">
              <Toggle checked={settings.weeklySummary} onChange={(v) => set("weeklySummary", v)} id="toggle-weekly-summary" />
            </SettingRow>
          </div>
        </div>

        {/* Export Preferences */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          <SectionHeader icon={FileOutput} title="Export Preferences" color="bg-gradient-to-br from-emerald-500 to-teal-500" />
          <div className="mt-4">
            <SettingRow id="setting-export-format" label="Default Export Format" description="Format used when downloading review reports.">
              <select
                value={settings.defaultFormat}
                onChange={(e) => set("defaultFormat", e.target.value)}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              >
                <option value="pdf">PDF</option>
                <option value="markdown">Markdown</option>
                <option value="json">JSON (raw)</option>
              </select>
            </SettingRow>
            <SettingRow id="setting-include-meta" label="Include Meta-Reviewer Summary" description="Add the Meta-Reviewer synthesis to exported reports.">
              <Toggle checked={settings.includeMeta} onChange={(v) => set("includeMeta", v)} id="toggle-include-meta" />
            </SettingRow>
            <SettingRow id="setting-include-agents" label="Include Agent Details" description="Include per-agent strengths and weaknesses in reports.">
              <Toggle checked={settings.includeAgentDetails} onChange={(v) => set("includeAgentDetails", v)} id="toggle-include-agents" />
            </SettingRow>
          </div>
        </div>

        {/* Privacy & Data */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          <SectionHeader icon={Shield} title="Privacy & Data" color="bg-gradient-to-br from-gray-500 to-gray-700" />
          <div className="mt-4">
            <SettingRow id="setting-anonymous" label="Anonymous Usage Statistics" description="Help improve ScholarLens by sharing anonymized usage data (no paper content).">
              <Toggle checked={settings.anonymousUsage} onChange={(v) => set("anonymousUsage", v)} id="toggle-anonymous" />
            </SettingRow>

            <div className="pt-4 flex items-center gap-3">
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                id="export-data"
              >
                <Download className="w-4 h-4" />
                Export My Data
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 dark:border-red-900 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                id="delete-account"
              >
                <Trash2 className="w-4 h-4" />
                Delete Account
              </button>
            </div>
          </div>
        </div>

        {/* Save / Reset */}
        <div className="flex items-center justify-between">
          <button
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            id="reset-settings"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Defaults
          </button>
          <button
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/20"
            id="save-settings"
          >
            <Save className="w-4 h-4" />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  )
}
