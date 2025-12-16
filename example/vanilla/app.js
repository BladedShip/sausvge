function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }).join("");
}

function generatePalette(baseColor) {
  const rgb = hexToRgb(baseColor);
  if (!rgb) return [];

  const palette = [];
  
  // Generate variations: lighter, base, darker, complementary, analogous
  palette.push({
    name: 'Light',
    color: rgbToHex(
      Math.min(255, rgb.r + 60),
      Math.min(255, rgb.g + 60),
      Math.min(255, rgb.b + 60)
    )
  });
  
  palette.push({
    name: 'Base',
    color: baseColor
  });
  
  palette.push({
    name: 'Dark',
    color: rgbToHex(
      Math.max(0, rgb.r - 60),
      Math.max(0, rgb.g - 60),
      Math.max(0, rgb.b - 60)
    )
  });
  
  // Complementary color
  palette.push({
    name: 'Complementary',
    color: rgbToHex(255 - rgb.r, 255 - rgb.g, 255 - rgb.b)
  });
  
  // Analogous color (shift hue)
  palette.push({
    name: 'Analogous',
    color: rgbToHex(
      Math.min(255, rgb.r + 30),
      Math.max(0, rgb.g - 20),
      Math.min(255, rgb.b + 40)
    )
  });

  return palette;
}

function displayPalette(palette) {
  const paletteElement = document.querySelector('[data-palette]');
  if (!paletteElement) return;
  
  if (!Array.isArray(palette) || palette.length === 0) return;
  
  paletteElement.innerHTML = '';
  
  // Use SVGApp.createSVGElement if available (like calculator example)
  // This ensures elements are created in the correct XHTML namespace
  const createElement = (typeof SVGApp !== 'undefined' && SVGApp.createSVGElement)
    ? SVGApp.createSVGElement
    : function(tag, className) {
        const XHTML_NS = "http://www.w3.org/1999/xhtml";
        const elem = document.createElementNS(XHTML_NS, tag);
        if (className) elem.setAttribute("class", className);
        return elem;
      };
  
  palette.forEach((item, index) => {
    const swatch = createElement('div', 'color-swatch');
    if (!swatch) return;
    
    // Set properties - elements created with createElementNS should have style
    swatch.style.backgroundColor = item.color;
    swatch.dataset.color = item.color;
    swatch.dataset.name = item.name || '';
    
    const label = createElement('div', 'swatch-label');
    if (label) {
      label.textContent = item.name || '';
      swatch.appendChild(label);
    }
    
    const hex = createElement('div', 'swatch-hex');
    if (hex) {
      hex.textContent = item.color;
      swatch.appendChild(hex);
    }
    
    swatch.addEventListener('click', () => showColorInfo(item));
    paletteElement.appendChild(swatch);
  });
}

function showColorInfo(colorItem) {
  if (!colorItem || !colorItem.color) return;
  
  const rgb = hexToRgb(colorItem.color);
  if (!rgb) return;
  
  const infoElement = document.querySelector('[data-color-info]');
  if (!infoElement) return;
  
  infoElement.innerHTML = `
    <div class="info-display" style="background-color: ${colorItem.color}">
      <div class="info-content">
        <h3>${colorItem.name || ''}</h3>
        <p><strong>Hex:</strong> ${colorItem.color}</p>
        <p><strong>RGB:</strong> rgb(${rgb.r}, ${rgb.g}, ${rgb.b})</p>
      </div>
    </div>
  `;
}

function randomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

// Initialize when DOM is ready
(function() {
  const baseColorInput = document.querySelector('[data-base-color]');
  const generateBtn = document.querySelector('[data-generate]');
  const randomBtn = document.querySelector('[data-random]');
  
  if (!baseColorInput || !generateBtn || !randomBtn) return;
  
  function updatePalette() {
    const baseColor = baseColorInput.value;
    const palette = generatePalette(baseColor);
    displayPalette(palette);
  }
  
  generateBtn.addEventListener('click', updatePalette);
  randomBtn.addEventListener('click', () => {
    baseColorInput.value = randomColor();
    updatePalette();
  });
  baseColorInput.addEventListener('input', updatePalette);
  
  // Generate initial palette
  updatePalette();
})();
