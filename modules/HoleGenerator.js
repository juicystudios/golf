// modules/HoleGenerator.js
export class HoleGenerator {
  constructor() {
    // Constants for generation ranges
    this.MIN_FAIRWAY_LENGTH = 350;
    this.MAX_FAIRWAY_LENGTH = 550;
    this.MIN_DOGLEG_ANGLE = Math.PI / 12;  // 15 degrees
    this.MAX_DOGLEG_ANGLE = Math.PI / 4;   // 45 degrees
    
    // Storage key
    this.STORAGE_KEY = 'wee_tee_time_holes';
    
    // Pre-generate today's hole when loaded (for splash screen)
    this._todaysHole = null;
  }
  
  // Get today's hole info for splash screen without fully selecting it
  getTodaysHoleInfo() {
    if (!this._todaysHole) {
      const today = new Date().toISOString().split('T')[0];
      this._todaysHole = this.generateHoleForDate(today);
    }
    
    return this._todaysHole;
  }
  
  // Generate hole config for a specific date
  generateHoleForDate(dateString) {
    // Try to get from storage first
    const existingHole = this.getHoleFromStorage(dateString);
    if (existingHole) {
      return existingHole;
    }
    
    // Create a numeric seed from date string
    const seed = this.dateToSeed(dateString);
    const seededRandom = this.createSeededRandom(seed);
    
    // Generate course parameters
    const fairwayLength = this.MIN_FAIRWAY_LENGTH + 
      seededRandom() * (this.MAX_FAIRWAY_LENGTH - this.MIN_FAIRWAY_LENGTH);
    
    const doglegAngle = this.MIN_DOGLEG_ANGLE +
      seededRandom() * (this.MAX_DOGLEG_ANGLE - this.MIN_DOGLEG_ANGLE);
    
    // Create hole config
    const holeConfig = {
      id: dateString,
      name: `Daily Challenge: ${dateString}`,
      groundSize: 1200,
      fairwayWidth: 30,
      fairwayLength: Math.round(fairwayLength),
      roughWidth: 60,
      greenRadius: 15,
      doglegAngle: doglegAngle,
      doglegPosition: Math.round(fairwayLength * 0.6),
      heightVariation: 10,
      treeDensity: 80,
      dateCreated: dateString
    };
    
    // Calculate par based on length
    const yards = Math.round(fairwayLength);
    let par = 4; // Default
    if (yards < 250) par = 3;
    else if (yards > 470) par = 5;
    
    holeConfig.par = par;
    
    // Save to storage
    this.saveHoleToStorage(holeConfig);
    
    return holeConfig;
  }
  
  // Get today's hole
  getTodaysHole() {
    if (!this._todaysHole) {
      const today = new Date().toISOString().split('T')[0];
      this._todaysHole = this.generateHoleForDate(today);
    }
    
    return this._todaysHole;
  }
  
  // Save hole to storage
  saveHoleToStorage(holeConfig) {
    const holes = this.getAllHoles();
    holes[holeConfig.id] = holeConfig;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(holes));
  }
  
  // Get a specific hole from storage
  getHoleFromStorage(dateString) {
    const holes = this.getAllHoles();
    return holes[dateString] || null;
  }
  
  // Get all stored holes
  getAllHoles() {
    const holesJson = localStorage.getItem(this.STORAGE_KEY);
    return holesJson ? JSON.parse(holesJson) : {};
  }
  
  // Helper: Convert date string to numeric seed
  dateToSeed(dateString) {
    return dateString.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  }
  
  // Helper: Create a seeded random function
  createSeededRandom(seed) {
    return function() {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  }
}

// Create HoleSelector class in the same file for convenience
export class HoleSelector {
  constructor() {
    this.holeGenerator = new HoleGenerator();
    this.selectedHoleConfig = null;
  }
  
  // Select today's hole
  selectTodaysHole() {
    this.selectedHoleConfig = this.holeGenerator.getTodaysHole();
    return this.selectedHoleConfig;
  }
  
  // Select a specific historical hole
  selectHoleByDate(dateString) {
    this.selectedHoleConfig = this.holeGenerator.generateHoleForDate(dateString);
    return this.selectedHoleConfig;
  }
  
  // Get list of all available holes
  getAllHoles() {
    const allHoles = this.holeGenerator.getAllHoles();
    
    // Convert to array and sort by date (newest first)
    return Object.values(allHoles).sort((a, b) => {
      return new Date(b.dateCreated) - new Date(a.dateCreated);
    });
  }
  
  // Create a hole browser UI
  createHoleBrowser(onSelect) {
    const container = document.createElement('div');
    container.className = 'hole-browser';
    container.style.position = 'fixed';
    container.style.top = '50%';
    container.style.left = '50%';
    container.style.transform = 'translate(-50%, -50%)';
    container.style.width = '80%';
    container.style.maxWidth = '800px';
    container.style.maxHeight = '80vh';
    container.style.backgroundColor = 'white';
    container.style.borderRadius = '10px';
    container.style.padding = '20px';
    container.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
    container.style.zIndex = '1000';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.overflow = 'hidden';
    
    // Add header
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.marginBottom = '20px';
    
    const title = document.createElement('h2');
    title.textContent = 'Select a Hole';
    title.style.margin = '0';
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.background = 'none';
    closeBtn.style.border = 'none';
    closeBtn.style.fontSize = '24px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.padding = '0 10px';
    
    closeBtn.addEventListener('click', () => {
      document.body.removeChild(container);
    });
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    container.appendChild(header);
    
    // Add scrollable content
    const content = document.createElement('div');
    content.style.overflowY = 'auto';
    content.style.flex = '1';
    content.style.display = 'grid';
    content.style.gridTemplateColumns = 'repeat(auto-fill, minmax(200px, 1fr))';
    content.style.gap = '15px';
    content.style.padding = '10px';
    container.appendChild(content);
    
    // Get all holes
    const holes = this.getAllHoles();
    
    // Add today's hole if it doesn't exist
    const today = new Date().toISOString().split('T')[0];
    if (!holes.find(h => h.id === today)) {
      holes.unshift(this.holeGenerator.getTodaysHole());
    }
    
    // Add hole cards
    holes.forEach(hole => {
      const card = this.createHoleCard(hole, () => {
        onSelect(hole);
        document.body.removeChild(container);
      });
      content.appendChild(card);
    });
    
    return container;
  }
  
  // Create a card for an individual hole
  createHoleCard(hole, onClick) {
    const card = document.createElement('div');
    card.className = 'hole-card';
    card.style.background = '#f5f5f5';
    card.style.borderRadius = '8px';
    card.style.padding = '10px';
    card.style.cursor = 'pointer';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.transition = 'transform 0.2s ease';
    
    // Simple hole preview using fairwayLength and doglegAngle
    const canvas = document.createElement('canvas');
    canvas.width = 180;
    canvas.height = 120;
    const ctx = canvas.getContext('2d');
    
    // Draw a simple course preview
    ctx.fillStyle = '#90EE90'; // Light green
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw fairway
    ctx.fillStyle = '#3d9e41'; // Darker green
    ctx.beginPath();
    
    // Start at bottom center
    const startX = canvas.width / 2;
    const startY = canvas.height - 10;
    
    // Calculate dogleg position in canvas coordinates
    const doglegY = startY - (hole.doglegPosition / hole.fairwayLength) * (canvas.height - 20);
    
    // Calculate end position based on dogleg angle
    const endX = startX + Math.sin(hole.doglegAngle) * (canvas.width / 2);
    const endY = 10;
    
    // Draw fairway path
    ctx.moveTo(startX - 15, startY);
    ctx.lineTo(startX + 15, startY);
    ctx.lineTo(startX + 15, doglegY);
    ctx.lineTo(endX + 15, endY);
    ctx.lineTo(endX - 15, endY);
    ctx.lineTo(startX - 15, doglegY);
    ctx.closePath();
    ctx.fill();
    
    // Draw tee and hole
    ctx.fillStyle = '#3498db'; // Blue tee
    ctx.beginPath();
    ctx.arc(startX, startY, 5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#e74c3c'; // Red hole
    ctx.beginPath();
    ctx.arc(endX, endY, 5, 0, Math.PI * 2);
    ctx.fill();
    
    card.appendChild(canvas);
    
    // Add hole info
    const info = document.createElement('div');
    info.style.marginTop = '10px';
    
    // Format the date
    let dateDisplay = hole.id || 'Today';
    try {
      const dateObj = new Date(dateDisplay);
      if (!isNaN(dateObj)) {
        const options = { month: 'long', day: 'numeric' };
        dateDisplay = dateObj.toLocaleDateString(undefined, options);
      }
    } catch (e) {
      console.log("Date formatting error:", e);
    }
    
    const date = document.createElement('div');
    date.textContent = dateDisplay;
    date.style.fontWeight = 'bold';
    
    // Calculate par if not already defined
    let par = hole.par;
    if (!par) {
      par = 4; // Default
      if (hole.fairwayLength < 250) par = 3;
      else if (hole.fairwayLength > 470) par = 5;
    }
    
    const stats = document.createElement('div');
    stats.textContent = `Par ${par} • ${hole.fairwayLength} yards`;
    stats.style.fontSize = '14px';
    stats.style.color = '#555';
    
    info.appendChild(date);
    info.appendChild(stats);
    card.appendChild(info);
    
    // Is this today's hole?
    const today = new Date().toISOString().split('T')[0];
    if (hole.id === today) {
      const todayBadge = document.createElement('div');
      todayBadge.textContent = 'TODAY';
      todayBadge.style.position = 'absolute';
      todayBadge.style.top = '5px';
      todayBadge.style.right = '5px';
      todayBadge.style.background = '#e74c3c';
      todayBadge.style.color = 'white';
      todayBadge.style.padding = '3px 6px';
      todayBadge.style.borderRadius = '3px';
      todayBadge.style.fontSize = '12px';
      todayBadge.style.fontWeight = 'bold';
      
      card.style.position = 'relative';
      card.appendChild(todayBadge);
    }
    
    // Hover and click effects
    card.addEventListener('mouseover', () => {
      card.style.transform = 'translateY(-5px)';
      card.style.boxShadow = '0 5px 10px rgba(0,0,0,0.1)';
    });
    
    card.addEventListener('mouseout', () => {
      card.style.transform = 'translateY(0)';
      card.style.boxShadow = 'none';
    });
    
    card.addEventListener('click', onClick);
    
    return card;
  }
}