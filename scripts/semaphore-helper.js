// Semaphore Flag Positions
// Each letter is represented by specific arm/flag positions
// Positions use clock positions: 0=up, 45=upper-right, 90=right, 135=lower-right, 180=down, etc.

const SEMAPHORE_ALPHABET = {
  'A': { left: 45, right: 315, visual: '↗  ↖' },
  'B': { left: 45, right: 0, visual: '↗  ↑' },
  'C': { left: 0, right: 315, visual: '↑  ↖' },
  'D': { left: 45, right: 135, visual: '↗  ↙' },
  'E': { left: 0, right: 0, visual: '↑  ↑' },
  'F': { left: 315, right: 45, visual: '↖  ↗' },
  'G': { left: 0, right: 135, visual: '↑  ↙' },
  'H': { left: 315, right: 90, visual: '↖  →' },
  'I': { left: 45, right: 90, visual: '↗  →' },
  'J': { left: 0, right: 45, visual: '↑  ↗' },
  'K': { left: 315, right: 135, visual: '↖  ↙' },
  'L': { left: 45, right: 180, visual: '↗  ↓' },
  'M': { left: 90, right: 315, visual: '→  ↖' },
  'N': { left: 90, right: 0, visual: '→  ↑' },
  'O': { left: 180, right: 0, visual: '↓  ↑' },
  'P': { left: 90, right: 45, visual: '→  ↗' },
  'Q': { left: 180, right: 45, visual: '↓  ↗' },
  'R': { left: 90, right: 135, visual: '→  ↙' },
  'S': { left: 180, right: 90, visual: '↓  →' },
  'T': { left: 90, right: 180, visual: '→  ↓' },
  'U': { left: 315, right: 0, visual: '↖  ↑' },
  'V': { left: 180, right: 135, visual: '↓  ↙' },
  'W': { left: 0, right: 90, visual: '↑  →' },
  'X': { left: 315, right: 180, visual: '↖  ↓' },
  'Y': { left: 135, right: 0, visual: '↙  ↑' },
  'Z': { left: 180, right: 315, visual: '↓  ↖' },
  '0': { left: 135, right: 135, visual: '↙  ↙' },
  '1': { left: 135, right: 90, visual: '↙  →' },
  '2': { left: 135, right: 45, visual: '↙  ↗' },
  '3': { left: 135, right: 0, visual: '↙  ↑' },
  '4': { left: 135, right: 315, visual: '↙  ↖' },
  '5': { left: 135, right: 180, visual: '↙  ↓' },
  '6': { left: 90, right: 90, visual: '→  →' },
  '7': { left: 180, right: 180, visual: '↓  ↓' },
  '8': { left: 45, right: 45, visual: '↗  ↗' },
  '9': { left: 0, right: 180, visual: '↑  ↓' },
  ' ': { left: 225, right: 225, visual: 'rest' } // Space/Rest position
};

// Create reverse mapping for decoder
const SEMAPHORE_REVERSE = {};
Object.entries(SEMAPHORE_ALPHABET).forEach(([char, positions]) => {
  const key = `${positions.left},${positions.right}`;
  SEMAPHORE_REVERSE[key] = char;
});

/**
 * Encode text to semaphore positions
 * @param {string} text - Text to encode
 * @returns {array} Array of semaphore position objects
 */
function encodeSemaphore(text) {
  return text.toUpperCase().split('').map(char => {
    return SEMAPHORE_ALPHABET[char] || SEMAPHORE_ALPHABET[' '];
  });
}

/**
 * Decode semaphore positions to text
 * @param {array} positions - Array of position objects with left and right values
 * @returns {string} Decoded text
 */
function decodeSemaphore(positions) {
  return positions.map(pos => {
    const key = `${pos.left},${pos.right}`;
    return SEMAPHORE_REVERSE[key] || '?';
  }).join('');
}

/**
 * Get SVG visualization of semaphore positions
 * @param {object} positions - Object with left and right arm positions
 * @returns {string} SVG markup
 */
function getSemaphoreVisualization(positions) {
  const size = 120;
  const center = size / 2;
  const armLength = 40;
  
  // Convert degrees to radians and calculate endpoints
  const getCoords = (angle) => {
    const rad = (angle - 90) * Math.PI / 180;
    return {
      x: center + armLength * Math.cos(rad),
      y: center + armLength * Math.sin(rad)
    };
  };
  
  const leftCoords = getCoords(positions.left);
  const rightCoords = getCoords(positions.right);
  
  return `
    <svg width="120" height="120" viewBox="0 0 ${size} ${size}" style="border: 2px solid #ddd; border-radius: 8px;">
      <!-- Body -->
      <circle cx="${center}" cy="${center}" r="6" fill="#333"/>
      <!-- Left arm -->
      <line x1="${center}" y1="${center}" x2="${leftCoords.x}" y2="${leftCoords.y}" stroke="#c00014" stroke-width="3" stroke-linecap="round"/>
      <circle cx="${leftCoords.x}" cy="${leftCoords.y}" r="5" fill="#c00014"/>
      <!-- Right arm -->
      <line x1="${center}" y1="${center}" x2="${rightCoords.x}" y2="${rightCoords.y}" stroke="#00668a" stroke-width="3" stroke-linecap="round"/>
      <circle cx="${rightCoords.x}" cy="${rightCoords.y}" r="5" fill="#00668a"/>
    </svg>
  `;
}

/**
 * Get text description of semaphore position
 * @param {object} positions - Object with left and right arm positions
 * @returns {string} Description
 */
function getPositionDescription(positions) {
  const directions = {
    0: 'UP',
    45: 'UP-RIGHT',
    90: 'RIGHT',
    135: 'DOWN-RIGHT',
    180: 'DOWN',
    225: 'DOWN-LEFT',
    270: 'LEFT',
    315: 'UP-LEFT'
  };
  
  return `L:${directions[positions.left] || positions.left} R:${directions[positions.right] || positions.right}`;
}
