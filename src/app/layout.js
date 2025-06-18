import { ThemeProvider } from "components/ThemeContext";
import "./globals.css";
import ThemeInitializer from "components/ThemeInitializer";
// import { ThemeProvider } from "@/components/ThemeContext";
// import ThemeInitializer from "@/components/ThemeInitializer";  

export const metadata = {
  title: "QuestForge - Gamified Goal Tracker",
  description: "Transform your goals into epic quests and level up your life!",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <ThemeInitializer />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
