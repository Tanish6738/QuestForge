import "./globals.css";

export const metadata = {
  title: "QuestForge - Gamified Goal Tracker",
  description: "Transform your goals into epic quests and level up your life!",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
