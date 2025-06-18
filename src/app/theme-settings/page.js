'use client';

import Header from "components/Landing/Header";
import ThemeSettings from "components/ThemeSettings";

export default function ThemeSettingsPage() {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-theme-background py-12 ">
        <ThemeSettings />
      </div>
    </>
  );
}
