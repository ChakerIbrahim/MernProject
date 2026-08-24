import React from 'react';
import { useTheme } from './ThemeContext';

export default function Logo({ className = "h-10 w-auto", compact = false }) {
  const { isDark } = useTheme();

  if (compact) {
    return <img src="/icon-etimad.svg" alt="اعتماد" className={className} />;
  }

  return (
    <img
      src={isDark ? "/logo-etimad-dark.svg" : "/logo-etimad.svg"}
      alt="اعتماد"
      className={className}
    />
  );
}
