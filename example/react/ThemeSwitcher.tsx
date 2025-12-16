import React from 'react';

type Theme = 'purple' | 'blue' | 'green' | 'orange';

interface ThemeSwitcherProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ theme, setTheme }) => {
  const themes: Theme[] = ['purple', 'blue', 'green', 'orange'];
  const themeLabels = {
    purple: 'Purple',
    blue: 'Blue',
    green: 'Green',
    orange: 'Orange',
  };

  return (
    <div className="theme-switcher">
      <div className="theme-buttons">
        {themes.map((t) => (
          <button
            key={t}
            onClick={() => setTheme(t)}
            className={`theme-btn ${theme === t ? 'active' : ''}`}
            style={{
              backgroundColor: t === theme ? 'white' : 'rgba(255, 255, 255, 0.3)',
              color: t === theme ? '#333' : 'white',
            }}
          >
            {themeLabels[t]}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ThemeSwitcher;

