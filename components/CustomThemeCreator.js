'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './ThemeContext';

const ColorPicker = ({ label, color, onChange, description }) => (
  <div className="mb-4">
    <div className="flex items-center justify-between mb-2">
      <label className="text-theme-text font-medium">{label}</label>
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-md border border-theme-border/30" style={{ backgroundColor: color }}></div>
        <input
          type="color"
          value={color}
          onChange={e => onChange(e.target.value)}
          className="w-10 h-8 rounded cursor-pointer bg-transparent"
        />
      </div>
    </div>
    {description && <p className="text-xs text-theme-text-secondary mb-1">{description}</p>}
    <div className="relative mt-1 mb-3">
      <div className="w-full h-1 bg-theme-secondary rounded-full" />
      <div className="absolute top-0 left-0 h-1 rounded-full" style={{ width: '100%', background: `linear-gradient(to right, rgba(255,255,255,0.1), ${color})` }} />
    </div>
  </div>
);

const ThemePreview = ({ theme }) => (
  <div className="rounded-xl overflow-hidden border p-4" style={{ backgroundColor: theme.background, borderColor: `${theme.border}40` }}>
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: theme.primary }}>
        <span className="w-5 h-5 block bg-white rounded-full" />
      </div>
      <div>
        <h3 className="font-medium" style={{ color: theme.text }}>Theme Preview</h3>
        <p className="text-sm" style={{ color: theme.textSecondary }}>See your theme in action</p>
      </div>
    </div>
    <div className="p-3 rounded-lg mb-4" style={{ backgroundColor: theme.secondary, borderColor: `${theme.border}40` }}>
      <p style={{ color: theme.text }}>Content area</p>
      <p className="text-sm" style={{ color: theme.textSecondary }}>Secondary background with text</p>
    </div>
    <div className="flex gap-2 flex-wrap">
      <button className="px-4 py-2 rounded-lg text-white text-sm" style={{ backgroundColor: theme.primary }}>Primary Button</button>
      <button className="px-4 py-2 rounded-lg border text-sm" style={{ color: theme.primary, borderColor: theme.primary }}>Outline</button>
      <button className="px-4 py-2 rounded-lg text-sm" style={{ backgroundColor: theme.secondary, color: theme.textSecondary, borderColor: `${theme.border}40` }}>Secondary</button>
    </div>
    <div className="mt-4 flex gap-3">
      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.success }} title="Success"></div>
      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.warning }} title="Warning"></div>
      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.error }} title="Error"></div>
    </div>
  </div>
);

const CustomThemeCreator = ({ onClose }) => {
  const { customThemes, saveCustomTheme, deleteCustomTheme, saveTheme } = useTheme();
  const [isCreating, setIsCreating] = useState(false);
  const [themeName, setThemeName] = useState("");
  const [themeDescription, setThemeDescription] = useState("");
  const [editingTheme, setEditingTheme] = useState(null);
  const defaultThemeValues = {
    primary: "#00A99D",
    background: "#1B212C",
    secondary: "#151B24",
    text: "#E1E6EB",
    textSecondary: "#A0AEC0",
    border: "#A0AEC0",
    accent: "#00A99D",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
  };
  const [themeColors, setThemeColors] = useState({ ...defaultThemeValues });
  const [localCustomThemes, setLocalCustomThemes] = useState([]);

  useEffect(() => {
    if (customThemes) setLocalCustomThemes(Object.values(customThemes));
  }, [customThemes]);
  useEffect(() => {
    if (editingTheme) {
      setThemeColors(editingTheme);
      setThemeName(editingTheme.name);
      setThemeDescription(editingTheme.description);
      setIsCreating(true);
    }
  }, [editingTheme]);

  const handleColorChange = (colorKey, value) => setThemeColors(prev => ({ ...prev, [colorKey]: value }));
  const resetToDefaultColors = () => setThemeColors({ ...defaultThemeValues });
  const saveCustom = () => {
    if (!themeName.trim()) return alert("Please enter a theme name");
    const newTheme = { name: themeName, description: themeDescription, ...themeColors };
    saveCustomTheme(themeName, newTheme);
    setIsCreating(false);
    setThemeName("");
    setThemeDescription("");
    setThemeColors({ ...defaultThemeValues });
    setEditingTheme(null);
  };
  const editTheme = (theme) => setEditingTheme(theme);
  const deleteThemeHandler = (name) => { if (confirm("Delete this theme?")) deleteCustomTheme(name); };
  const applyTheme = (name) => saveTheme(name);
  const randomColor = (lum = 0) => {
    // Generate a random hex color, optionally with luminance adjustment
    let hex = "#" + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    // Optionally, you can add more logic to ensure contrast or theme harmony
    return hex;
  };
  // Elegant random color palette generator
  function hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }

  const randomElegantPalette = () => {
    // Pick a base hue
    const baseHue = Math.floor(Math.random() * 360);
    // Analogous/triadic harmony
    const primary = hslToHex(baseHue, 70, 45);
    const accent = hslToHex((baseHue + 30) % 360, 80, 50);
    const background = hslToHex(baseHue, 30, 12);
    const secondary = hslToHex((baseHue + 20) % 360, 25, 18);
    const border = hslToHex(baseHue, 20, 35);
    const text = hslToHex(baseHue, 20, 92);
    const textSecondary = hslToHex(baseHue, 12, 70);
    // Semantic colors: green, yellow, red
    const success = hslToHex((baseHue + 100) % 360, 60, 40);
    const warning = hslToHex((baseHue + 60) % 360, 80, 45);
    const error = hslToHex((baseHue + 340) % 360, 70, 45);
    return {
      primary,
      background,
      secondary,
      text,
      textSecondary,
      border,
      accent,
      success,
      warning,
      error,
    };
  };

  const randomizeColors = () => {
    setThemeColors(randomElegantPalette());
  };

  const colorFields = [
    { key: 'primary', label: 'Primary Color', description: 'Main brand color for buttons and accents' },
    { key: 'background', label: 'Background', description: 'Main background color' },
    { key: 'secondary', label: 'Secondary Background', description: 'Cards and panels background' },
    { key: 'text', label: 'Text Color', description: 'Primary text color' },
    { key: 'textSecondary', label: 'Secondary Text', description: 'Muted text color' },
    { key: 'border', label: 'Border Color', description: 'Borders and dividers' },
    { key: 'accent', label: 'Accent Color', description: 'Highlights and special elements' },
    { key: 'success', label: 'Success Color', description: 'Success states and messages' },
    { key: 'warning', label: 'Warning Color', description: 'Warning states and messages' },
    { key: 'error', label: 'Error Color', description: 'Error states and messages' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-theme-text mb-2">Custom Theme Creator</h2>
          <p className="text-theme-text-secondary">Create and manage your custom themes</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="px-3 py-1 rounded border text-theme-text border-theme-border">Close</button>
        )}
      </div>
      <div className="flex gap-3 flex-wrap">
        <button onClick={() => setIsCreating(true)} className="px-4 py-2 rounded bg-theme-primary text-white" disabled={isCreating}>Create New Theme</button>
        {isCreating && (
          <>
            <button onClick={resetToDefaultColors} className="px-4 py-2 rounded border border-theme-primary text-theme-primary">Reset to Default</button>
            <button onClick={randomizeColors} className="px-4 py-2 rounded border border-theme-accent text-theme-accent">Randomize Colors</button>
          </>
        )}
      </div>
      <AnimatePresence>
        {isCreating && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card-theme p-6">
              <h3 className="text-lg font-semibold text-theme-text mb-4">Customize Colors</h3>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-theme-text mb-2">Theme Name *</label>
                  <input type="text" value={themeName} onChange={e => setThemeName(e.target.value)} placeholder="Enter theme name" className="w-full px-3 py-2 rounded-lg border border-theme-border bg-theme-background text-theme-text placeholder-theme-text-secondary focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-theme-text mb-2">Description</label>
                  <input type="text" value={themeDescription} onChange={e => setThemeDescription(e.target.value)} placeholder="Optional description" className="w-full px-3 py-2 rounded-lg border border-theme-border bg-theme-background text-theme-text placeholder-theme-text-secondary focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-transparent" />
                </div>
              </div>
              <div className="space-y-4">
                {colorFields.map(field => (
                  <ColorPicker key={field.key} label={field.label} color={themeColors[field.key]} onChange={value => handleColorChange(field.key, value)} description={field.description} />
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={saveCustom} className="px-4 py-2 rounded bg-theme-primary text-white" disabled={!themeName.trim()}>{editingTheme ? 'Update Theme' : 'Save Theme'}</button>
                <button onClick={() => { setIsCreating(false); setEditingTheme(null); }} className="px-4 py-2 rounded border border-theme-border text-theme-text">Cancel</button>
              </div>
            </div>
            <div className="card-theme p-6">
              <h3 className="text-lg font-semibold text-theme-text mb-4">Live Preview</h3>
              <ThemePreview theme={themeColors} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="card-theme p-6">
        <h3 className="text-lg font-semibold text-theme-text mb-4">Your Custom Themes ({localCustomThemes.length})</h3>
        {localCustomThemes.length === 0 ? (
          <div className="text-center py-8">
            <span className="w-12 h-12 block rounded-full bg-theme-secondary mx-auto mb-4" />
            <p className="text-theme-text-secondary">No custom themes yet</p>
            <p className="text-sm text-theme-text-secondary mt-1">Create your first custom theme to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {localCustomThemes.map(theme => (
              <motion.div key={theme.name} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative group">
                <div className="p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:scale-105" style={{ backgroundColor: theme.background || theme.secondary, borderColor: theme.primary }} onClick={() => applyTheme(theme.name)}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.primary }} />
                    <h4 className="font-medium text-sm" style={{ color: theme.text }}>{theme.name}</h4>
                  </div>
                  <p className="text-xs mb-3" style={{ color: theme.textSecondary }}>{theme.description}</p>
                  <div className="flex gap-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.primary }} />
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.success }} />
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.warning }} />
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.error }} />
                  </div>
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button onClick={e => { e.stopPropagation(); editTheme(theme); }} className="p-1 rounded bg-theme-primary/20 hover:bg-theme-primary/30 text-theme-primary">Edit</button>
                  <button onClick={e => { e.stopPropagation(); deleteThemeHandler(theme.name); }} className="p-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-500">Delete</button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomThemeCreator;