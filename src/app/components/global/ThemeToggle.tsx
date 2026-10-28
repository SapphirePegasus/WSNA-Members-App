// This code is never actually used in the app but the system
// architecture is still present and can be used any time in
// future if the app has light/dark mode themes.

"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // On initial render, check localStorage for user's preference
  useEffect(() => {
    const storedPreference = localStorage.getItem("dark-mode");
    if (storedPreference === "true") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("dark-mode", "false");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("dark-mode", "true");
    }
    setIsDarkMode(!isDarkMode);
  };

  return (
    <button onClick={toggleDarkMode}>
      {isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
    </button>
  );
}
