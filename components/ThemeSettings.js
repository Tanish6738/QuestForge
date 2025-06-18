"use client";

import React, { useState } from "react";
import { useTheme } from "./ThemeContext";
import CustomThemeCreator from "./CustomThemeCreator";

const ThemeSettings = () => {
  const {
    currentTheme,
    predefinedThemes,
    customThemes,
    accessibilitySettings,
    saveTheme,
    updateAccessibilitySettings,
    saveCustomTheme,
    deleteCustomTheme,
  } = useTheme();

  const [activeTab, setActiveTab] = useState("themes");
  const [showCustomCreator, setShowCustomCreator] = useState(false);
  const [newTheme, setNewTheme] = useState({
    name: "",
    ...predefinedThemes.dark,
  });

  return (
    <div className="max-w-2xl mx-auto bg-theme-secondary rounded-xl p-8 shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-theme-text">Theme & Accessibility Settings</h2>
      {/* Tabs for Themes / Accessibility */}
      <div className="flex gap-4 mb-6">
        <button className={`px-4 py-2 rounded ${activeTab === 'themes' ? 'bg-theme-primary text-white' : 'bg-theme-background text-theme-text'}`} onClick={() => setActiveTab('themes')}>Themes</button>
        <button className={`px-4 py-2 rounded ${activeTab === 'accessibility' ? 'bg-theme-primary text-white' : 'bg-theme-background text-theme-text'}`} onClick={() => setActiveTab('accessibility')}>Accessibility</button>
      </div>
      {activeTab === "themes" && (
        <div>
          <h3 className="font-semibold mb-2">Choose Theme</h3>
          <div className="flex flex-wrap gap-3 mb-4">
            {Object.entries({ ...predefinedThemes, ...customThemes }).map(([name, theme]) => (
              <button
                key={name}
                className={`px-4 py-2 rounded border ${currentTheme === name ? 'bg-theme-primary text-white' : 'bg-theme-background text-theme-text'}`}
                style={{ borderColor: theme.primary }}
                onClick={() => saveTheme(name)}
              >
                {name.charAt(0).toUpperCase() + name.slice(1)}
              </button>
            ))}
            <button className="px-4 py-2 rounded border border-dashed border-theme-primary text-theme-primary" onClick={() => setShowCustomCreator(true)}>
              + Create Custom
            </button>
          </div>
          {/* Custom Theme Creator Modal */}
          {showCustomCreator && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-theme-background p-6 rounded-xl shadow-xl w-full max-w-3xl max-h-[80vh] overflow-y-auto">
                <CustomThemeCreator onClose={() => setShowCustomCreator(false)} />
              </div>
            </div>
          )}
        </div>
      )}
      {activeTab === "accessibility" && (
        <div>
          <h3 className="font-semibold mb-2">Accessibility Options</h3>
          <div className="flex flex-col gap-2">
            <label>
              <input type="checkbox" checked={!!accessibilitySettings.highContrast} onChange={e => updateAccessibilitySettings({ ...accessibilitySettings, highContrast: e.target.checked })} /> High Contrast
            </label>
            <label>
              <input type="checkbox" checked={!!accessibilitySettings.reducedMotion} onChange={e => updateAccessibilitySettings({ ...accessibilitySettings, reducedMotion: e.target.checked })} /> Reduced Motion
            </label>
            <label>
              <input type="checkbox" checked={!!accessibilitySettings.focusIndicators} onChange={e => updateAccessibilitySettings({ ...accessibilitySettings, focusIndicators: e.target.checked })} /> Focus Indicators
            </label>
            <label>
              <input type="checkbox" checked={!!accessibilitySettings.largerClickTargets} onChange={e => updateAccessibilitySettings({ ...accessibilitySettings, largerClickTargets: e.target.checked })} /> Larger Click Targets
            </label>
            <label>
              <input type="checkbox" checked={!!accessibilitySettings.stickyFocus} onChange={e => updateAccessibilitySettings({ ...accessibilitySettings, stickyFocus: e.target.checked })} /> Sticky Focus
            </label>
            <label>
              Font Size:
              <select value={accessibilitySettings.fontSize || 'medium'} onChange={e => updateAccessibilitySettings({ ...accessibilitySettings, fontSize: e.target.value })}>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeSettings;
