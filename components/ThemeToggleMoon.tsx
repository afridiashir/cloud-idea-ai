"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react"; // Import icons

export default function ThemeToggle() {
    const [theme, setTheme] = useState<string>("light");

    // Load theme from localStorage or set default
    useEffect(() => {
        const storedTheme = localStorage.getItem("theme") || "light";
        setTheme(storedTheme);
        document.documentElement.setAttribute("data-theme", storedTheme);
        document.body.classList.add(storedTheme);
    }, []);

    // Toggle theme handler
    const toggleTheme = () => {
        const newTheme = theme === "light" ? "dark" : "light";

        // Update state
        setTheme(newTheme);

        // Persist theme in localStorage
        localStorage.setItem("theme", newTheme);

        // Update the data-theme attribute
        document.documentElement.setAttribute("data-theme", newTheme);

        // Update body class: Remove the old theme and add the new one
        document.body.classList.remove(theme);
        document.body.classList.add(newTheme);
    };

    return (
        <button onClick={toggleTheme} className="flex items-center p-2 rounded-md transition-colors">
            {theme === "light" ? (
                <Moon className="w-6 h-6 text-gray-500 hover:text-gray-700" />
            ) : (
                <Sun className="w-6 h-6 text-yellow-500 hover:text-yellow-700" />
            )}
        </button>
    );
}
