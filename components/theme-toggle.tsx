"use client"

import { useState, useEffect } from 'react';
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/custom-ui/Button"; // Verifica la ruta

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  // --- Configuración de Tamaño ---
  const iconSizeClass = "h-[60%] w-[60%]";
  // Define el tamaño del botón aquí (ej: 'w-10 h-10', 'w-12 h-12', 'w-14 h-14')
  const buttonSizeClass = "w-12 h-12";
  // Define qué porcentaje del botón debe ocupar el icono
  // --- Fin Configuración ---


  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        aria-label="Toggle Theme"
        disabled
        // Aplica el tamaño del botón y posicionamiento relativo
        className={`${buttonSizeClass} rounded-full relative`}
      >
        {/* Aplica el tamaño porcentual al icono placeholder */}
        <Sun className={`${iconSizeClass} text-muted-foreground`} />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Toggle Theme"
      // Aplica el tamaño del botón, posicionamiento y overflow
      className={`${buttonSizeClass} rounded-full relative overflow-hidden`}
    >
      {/* Icono del Sol con tamaño porcentual */}
      <Sun
        className={`
          absolute ${iconSizeClass} // Tamaño porcentual
          transition-all duration-500 ease-in-out
          ${theme === 'dark'
            ? 'opacity-0 rotate-90 scale-0'
            : 'opacity-100 rotate-0 scale-100'
          }
        `}
      />
      {/* Icono de la Luna con tamaño porcentual */}
      <Moon
        className={`
          absolute ${iconSizeClass} // Tamaño porcentual
          transition-all duration-500 ease-in-out
          ${theme === 'dark'
            ? 'opacity-100 rotate-0 scale-100'
            : 'opacity-0 -rotate-90 scale-0'
          }
        `}
      />
    </Button>
  );
}