import React, { useState } from 'react';
import Counter from './Counter';
import ThemeSwitcher from './ThemeSwitcher';
import FormDemo from './FormDemo';

const App = () => {
  const [theme, setTheme] = useState<'purple' | 'blue' | 'green' | 'orange'>('purple');

  const themes = {
    purple: { primary: '#667eea', secondary: '#764ba2' },
    blue: { primary: '#4facfe', secondary: '#00f2fe' },
    green: { primary: '#43e97b', secondary: '#38f9d7' },
    orange: { primary: '#fa709a', secondary: '#fee140' },
  };

  const currentTheme = themes[theme];

  return (
    <div className="app-container" style={{
      background: `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.secondary} 100%)`
    }}>
      <div className="app-content">
        <h1>SVG React App</h1>
        <p className="subtitle">A feature-rich React application bundled into SVG</p>
        
        <div className="features-grid">
          <div className="feature-card">
            <h2>Counter</h2>
            <Counter />
          </div>
          
          <div className="feature-card">
            <h2>Theme Switcher</h2>
            <ThemeSwitcher theme={theme} setTheme={setTheme} />
          </div>
          
          <div className="feature-card">
            <h2>Form Demo</h2>
            <FormDemo />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
