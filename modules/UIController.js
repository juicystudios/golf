// UI elements and interaction
export class UIController {
  constructor(gameState, courseConfig) {
    this.gameState = gameState;
    this.courseConfig = courseConfig;
    
    // Create UI elements
    this.powerMeter = this.createPowerMeter();
    this.swingButton = this.createSwingButton();
    this.aimControls = this.createAimControls();
    this.cameraModeButton = this.createCameraModeButton();
    
    // Create new club selection UI
    this.clubSelectionUI = this.createClubSelectionUI();
  
    // Set scorecard width
    this.setScoreCardWidth();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Initialize the club selection UI
    this.updateClubSelection();
  }
  
  // Create power meter UI element
  createPowerMeter() {
    const containerSize = { width: 200, height: 30 };
    
    // Power meter container 
    const powerMeterContainer = document.createElement('div');
    powerMeterContainer.id = 'powerMeterContainer';
    powerMeterContainer.style.position = 'fixed';
    powerMeterContainer.style.bottom = '140px';
    powerMeterContainer.style.left = '50%';
    powerMeterContainer.style.transform = 'translateX(-50%)';
    powerMeterContainer.style.width = `${containerSize.width}px`;
    powerMeterContainer.style.height = `${containerSize.height}px`;
    powerMeterContainer.style.background = 'rgba(0, 0, 0, 0.7)';
    powerMeterContainer.style.borderRadius = '15px';
    powerMeterContainer.style.overflow = 'hidden';
    powerMeterContainer.style.border = '2px solid white';
    powerMeterContainer.style.display = 'none'; // Hidden by default
    powerMeterContainer.style.zIndex = '100';
    
    // Power meter fill
    const powerMeterFill = document.createElement('div');
    powerMeterFill.id = 'powerMeterFill';
    powerMeterFill.style.height = '100%';
    powerMeterFill.style.width = '0%';
    powerMeterFill.style.background = 'linear-gradient(to right, green, yellow, red)';
    powerMeterFill.style.transition = 'none';
    
    // Power meter label
    const powerMeterLabel = document.createElement('div');
    powerMeterLabel.id = 'powerMeterLabel';
    powerMeterLabel.style.position = 'absolute';
    powerMeterLabel.style.top = '0';
    powerMeterLabel.style.left = '0';
    powerMeterLabel.style.width = '100%';
    powerMeterLabel.style.height = '100%';
    powerMeterLabel.style.display = 'flex';
    powerMeterLabel.style.justifyContent = 'center';
    powerMeterLabel.style.alignItems = 'center';
    powerMeterLabel.style.color = 'white';
    powerMeterLabel.style.fontWeight = 'bold';
    powerMeterLabel.style.textShadow = '1px 1px 2px black';
    powerMeterLabel.textContent = 'SWING';
    
    // Add elements to the DOM
    powerMeterContainer.appendChild(powerMeterFill);
    powerMeterContainer.appendChild(powerMeterLabel);
    document.body.appendChild(powerMeterContainer);
    
    return {
      container: powerMeterContainer,
      fill: powerMeterFill,
      label: powerMeterLabel
    };
  }
  
  // Create swing button
  createSwingButton() {
    const swingButton = document.createElement('button');
    swingButton.id = 'swingButton';
    swingButton.textContent = 'SWING';
    swingButton.style.position = 'fixed';
    swingButton.style.bottom = '20px';
    swingButton.style.left = '50%';
    swingButton.style.transform = 'translateX(-50%)';
    swingButton.style.padding = '15px 40px';
    swingButton.style.fontSize = '18px';
    swingButton.style.fontWeight = 'bold';
    swingButton.style.background = '#4CAF50';
    swingButton.style.color = 'white';
    swingButton.style.border = 'none';
    swingButton.style.borderRadius = '30px';
    swingButton.style.cursor = 'pointer';
    swingButton.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    swingButton.style.transition = 'all 0.2s ease';
    swingButton.style.zIndex = '100';
    
    // Add hover effect
    swingButton.addEventListener('mouseover', () => {
      swingButton.style.background = '#45a049';
      swingButton.style.transform = 'translateX(-50%) scale(1.05)';
    });
    
    swingButton.addEventListener('mouseout', () => {
      swingButton.style.background = '#4CAF50';
      swingButton.style.transform = 'translateX(-50%) scale(1)';
    });
    
    // Add to DOM
    document.body.appendChild(swingButton);
    
    return swingButton;
  }
  
  // Create aim controls
  createAimControls() {
    const aimControlsContainer = document.createElement('div');
    aimControlsContainer.id = 'aimControlsContainer';
    aimControlsContainer.style.position = 'fixed';
    aimControlsContainer.style.bottom = '80px';
    aimControlsContainer.style.left = '50%';
    aimControlsContainer.style.transform = 'translateX(-50%)';
    aimControlsContainer.style.display = 'flex';
    aimControlsContainer.style.gap = '10px';
    aimControlsContainer.style.zIndex = '100';
    
    // Left aim button
    const leftAimButton = document.createElement('button');
    leftAimButton.id = 'leftAimButton';
    leftAimButton.innerHTML = '&#8592;'; // Left arrow
    leftAimButton.style.width = '50px';
    leftAimButton.style.height = '50px';
    leftAimButton.style.fontSize = '24px';
    leftAimButton.style.background = '#3498db';
    leftAimButton.style.color = 'white';
    leftAimButton.style.border = 'none';
    leftAimButton.style.borderRadius = '50%';
    leftAimButton.style.cursor = 'pointer';
    leftAimButton.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    
    // Right aim button
    const rightAimButton = document.createElement('button');
    rightAimButton.id = 'rightAimButton';
    rightAimButton.innerHTML = '&#8594;'; // Right arrow
    rightAimButton.style.width = '50px';
    rightAimButton.style.height = '50px';
    rightAimButton.style.fontSize = '24px';
    rightAimButton.style.background = '#3498db';
    rightAimButton.style.color = 'white';
    rightAimButton.style.border = 'none';
    rightAimButton.style.borderRadius = '50%';
    rightAimButton.style.cursor = 'pointer';
    rightAimButton.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    
    // Add to container
    aimControlsContainer.appendChild(leftAimButton);
    aimControlsContainer.appendChild(rightAimButton);
    
    // Add to DOM
    document.body.appendChild(aimControlsContainer);
    
    return {
      container: aimControlsContainer,
      leftButton: leftAimButton,
      rightButton: rightAimButton
    };
  }
  
  // Create camera mode button
  createCameraModeButton() {
    const cameraModeButton = document.createElement('button');
    cameraModeButton.id = 'cameraModeButton';
    cameraModeButton.textContent = 'CAMERA: FOLLOW';
    cameraModeButton.style.position = 'fixed';
    cameraModeButton.style.top = '20px';
    cameraModeButton.style.left = '50%';
    cameraModeButton.style.transform = 'translateX(-50%)';
    cameraModeButton.style.padding = '10px 20px';
    cameraModeButton.style.fontSize = '14px';
    cameraModeButton.style.background = '#9b59b6';
    cameraModeButton.style.color = 'white';
    cameraModeButton.style.border = 'none';
    cameraModeButton.style.borderRadius = '20px';
    cameraModeButton.style.cursor = 'pointer';
    cameraModeButton.style.zIndex = '100';
    
    // Add to DOM
    document.body.appendChild(cameraModeButton);
    
    return cameraModeButton;
  }
  
  // Create an improved club selection interface
  createClubSelectionUI() {
    // Create main container
    const clubSelectionContainer = document.createElement('div');
    clubSelectionContainer.id = 'clubSelectionContainer';
    clubSelectionContainer.style.position = 'fixed';
    clubSelectionContainer.style.top = '220px'; // Position below scorecard
    clubSelectionContainer.style.right = '20px'; // Align with scorecard
    clubSelectionContainer.style.left = 'auto'; // Remove default left positioning
    clubSelectionContainer.style.bottom = 'auto'; // Remove default bottom positioning
    clubSelectionContainer.style.background = 'rgba(255, 255, 255, 0.9)'; // Match scorecard background
    clubSelectionContainer.style.borderRadius = '10px';
    clubSelectionContainer.style.padding = '10px';
    clubSelectionContainer.style.width = '280px';
    clubSelectionContainer.style.zIndex = '100';
    clubSelectionContainer.style.display = 'flex';
    clubSelectionContainer.style.flexDirection = 'column';
    clubSelectionContainer.style.gap = '5px';
    clubSelectionContainer.style.boxShadow = '0 4px 10px rgba(0,0,0,0.2)'; // Match scorecard shadow
    
    // Add distance indicator at the top
    const distanceIndicator = document.createElement('div');
    distanceIndicator.id = 'clubDistance';
    distanceIndicator.style.color = '#2c3e50'; // Match scorecard text color
    distanceIndicator.style.textAlign = 'center';
    distanceIndicator.style.padding = '5px';
    distanceIndicator.style.borderBottom = '1px solid rgba(0, 0, 0, 0.2)';
    distanceIndicator.style.marginBottom = '5px';
    distanceIndicator.style.fontSize = '16px';
    distanceIndicator.style.fontWeight = 'bold';
    
    // Get initial distance to display
    const initialDistance = this.getDistanceToHole();
    distanceIndicator.textContent = `${initialDistance.toFixed(1)} yards to hole`;
    
    clubSelectionContainer.appendChild(distanceIndicator);
    
    // Create club selection title
    const titleElement = document.createElement('div');
    titleElement.textContent = 'CLUB SELECTION';
    titleElement.style.color = '#2c3e50'; // Match scorecard text color
    titleElement.style.fontWeight = 'bold';
    titleElement.style.textAlign = 'center';
    titleElement.style.marginBottom = '5px';
    titleElement.style.fontSize = '16px';
    clubSelectionContainer.appendChild(titleElement);
    
    // Create recommended clubs section
    const recommendedSection = document.createElement('div');
    recommendedSection.id = 'recommendedClubs';
    recommendedSection.style.display = 'flex';
    recommendedSection.style.flexWrap = 'wrap';
    recommendedSection.style.gap = '8px';     // Increased gap
    recommendedSection.style.marginBottom = '12px';  // Increased margin
    recommendedSection.style.justifyContent = 'center';
    recommendedSection.style.padding = '5px'; // Added padding
    clubSelectionContainer.appendChild(recommendedSection);
    
    // Create "Show All Clubs" button
    const showAllButton = document.createElement('button');
    showAllButton.id = 'showAllClubsButton';
    showAllButton.textContent = 'Show All Clubs';
    showAllButton.style.background = '#3498db';
    showAllButton.style.color = 'white';
    showAllButton.style.border = 'none';
    showAllButton.style.borderRadius = '5px';
    showAllButton.style.padding = '5px 10px';
    showAllButton.style.cursor = 'pointer';
    showAllButton.style.fontSize = '14px';
    showAllButton.style.width = '100%';
    showAllButton.style.marginBottom = '5px';
    clubSelectionContainer.appendChild(showAllButton);
    
    // Create all clubs section (initially hidden)
    const allClubsSection = document.createElement('div');
    allClubsSection.id = 'allClubsContainer';
    allClubsSection.style.display = 'none'; // Hidden by default
    allClubsSection.style.maxHeight = '400px'; // Limit maximum height
    allClubsSection.style.overflowY = 'auto'; // Add vertical scrolling
    allClubsSection.style.marginTop = '10px'; // Add some spacing
    allClubsSection.style.paddingRight = '5px'; // Add padding for scroll bar
    allClubsSection.style.borderTop = '1px solid rgba(0,0,0,0.1)'; // Add separator
    allClubsSection.style.paddingTop = '10px'; // Add padding above content
    clubSelectionContainer.appendChild(allClubsSection);
    
    // Create category containers for all clubs
    const categories = [
      { id: 'woodsContainer', title: 'Woods', clubs: this.gameState.clubCategories.woods },
      { id: 'longIronsContainer', title: 'Long Irons', clubs: this.gameState.clubCategories.longIrons },
      { id: 'shortIronsContainer', title: 'Short Irons', clubs: this.gameState.clubCategories.shortIrons },
      { id: 'wedgesContainer', title: 'Wedges', clubs: this.gameState.clubCategories.wedges },
      { id: 'puttingContainer', title: 'Putter', clubs: this.gameState.clubCategories.putting }
    ];
    
    categories.forEach(category => {
      const container = document.createElement('div');
      container.id = category.id;
      container.style.marginBottom = '15px'; // Increased space between categories
      
      const categoryTitle = document.createElement('div');
      categoryTitle.textContent = category.title;
      categoryTitle.style.color = '#2c3e50';
      categoryTitle.style.fontSize = '14px';
      categoryTitle.style.fontWeight = 'bold'; // Make title bolder
      categoryTitle.style.marginBottom = '8px'; // Increased spacing below title
      categoryTitle.style.textAlign = 'center'; // Center titles
      categoryTitle.style.borderBottom = '1px solid #eee'; // Add subtle separator
      categoryTitle.style.paddingBottom = '3px';
      container.appendChild(categoryTitle);
      
      const clubsContainer = document.createElement('div');
      clubsContainer.style.display = 'flex';
      clubsContainer.style.flexWrap = 'wrap';
      clubsContainer.style.gap = '8px'; // Increased gap
      clubsContainer.style.justifyContent = 'center'; // Center clubs in container
      
      category.clubs.forEach(club => {
        const clubElement = this.createClubElement(club);
        
        // Add click handler right away
        clubElement.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          if (this.gameState.ballInMotion) return;
          
          console.log(`Club ${club} clicked from category`);
          this.selectClub(club);
        });
        
        clubsContainer.appendChild(clubElement);
      });
      
      container.appendChild(clubsContainer);
      allClubsSection.appendChild(container);
    });
    
    // Add to DOM
    document.body.appendChild(clubSelectionContainer);
    
    // Add event listener for the "Show All Clubs" button
    showAllButton.addEventListener('click', () => {
      if (allClubsSection.style.display === 'none') {
        allClubsSection.style.display = 'block';
        showAllButton.textContent = 'Hide All Clubs';
        
        // Keep the same width - no horizontal expansion
        // This ensures the container only expands vertically
        
        // Update scorecard width too (for consistency)
        const scorecard = document.getElementById('scorecard');
        if (scorecard) {
          scorecard.style.width = '280px';  // Keep at fixed width
        }
      } else {
        allClubsSection.style.display = 'none';
        showAllButton.textContent = 'Show All Clubs';
        
        // Maintain original width
        clubSelectionContainer.style.width = '280px';
        
        // Ensure scorecard width matches
        const scorecard = document.getElementById('scorecard');
        if (scorecard) {
          scorecard.style.width = '280px';
        }
      }
    });
    
    return clubSelectionContainer;
  }
  
  // Create an individual club element
  createClubElement(club) {
    const clubElement = document.createElement('div');
    clubElement.classList.add('club');
    clubElement.dataset.club = club;
    
    // Increase sizes here
    clubElement.style.width = '85px';       // Increased from 65px
    clubElement.style.height = '50px';      // Increased from 38px
    clubElement.style.fontSize = '14px';    // Increased from 12px
    
    clubElement.style.background = '#444';
    clubElement.style.color = 'white';
    clubElement.style.display = 'flex';
    clubElement.style.flexDirection = 'column';
    clubElement.style.alignItems = 'center';
    clubElement.style.justifyContent = 'center';
    clubElement.style.borderRadius = '5px';
    clubElement.style.cursor = 'pointer';
    clubElement.style.transition = 'all 0.2s';
    clubElement.style.position = 'relative';
    clubElement.style.overflow = 'hidden';
    
    // Add club name
    const displayName = document.createElement('div');
    displayName.textContent = this.gameState.clubDisplayNames[club];
    displayName.style.fontWeight = 'bold';
    displayName.style.marginBottom = '4px';  // Increased spacing
    displayName.style.fontSize = '15px';     // Increased from default
    clubElement.appendChild(displayName);
    
    // Add club distance - make sure to get CURRENT value each time
    const distance = document.createElement('div');
    // Get the current distance from gameState, not hardcoded
    const currentDistance = this.gameState.clubDistances[club];
    distance.textContent = currentDistance + 'y';
    distance.style.fontSize = '12px';       // Increased from 10px
    distance.style.opacity = '0.8';
    clubElement.appendChild(distance);
    
    // Add club icon class
    clubElement.classList.add(this.gameState.getClubIconClass(club));
    
    // Add hover effect
    clubElement.addEventListener('mouseover', () => {
      clubElement.style.background = '#95a5a6'; // Lighter gray on hover
      clubElement.style.transform = 'scale(1.05)';
    });
    
    clubElement.addEventListener('mouseout', () => {
      if (club === this.gameState.selectedClub) {
        clubElement.style.background = '#3498db'; // Selected club stays blue
      } else {
        clubElement.style.background = '#7f8c8d'; // Non-selected clubs revert to gray
      }
      clubElement.style.transform = 'scale(1)';
    });
    
    // If this is the currently selected club, highlight it
    if (club === this.gameState.selectedClub) {
      clubElement.style.background = '#3498db'; // Blue for selected club
      clubElement.classList.add('selected');
    }
    
    return clubElement;
  }
  
  // Update the club selection based on the current situation
  updateClubSelection() {
    // Clear existing recommendations
    const recommendedSection = document.getElementById('recommendedClubs');
    if (!recommendedSection) {
      console.warn("Recommended clubs section not found");
      return;
    }
    
    recommendedSection.innerHTML = '';
    
    // Get the current distance to the hole
    const distanceToHole = this.getDistanceToHole();
    console.log(`Updating club selection for distance: ${distanceToHole} yards`);
    
    // Check the lie of the ball
    const lie = this.gameState.checkLie();
    console.log(`Current ball lie:`, lie);
    
    // Get recommended clubs based on distance and lie
    const recommendedClubs = this.gameState.getRecommendedClubs(
      distanceToHole,
      lie.inSand,
      lie.inRough,
      lie.onGreen
    );
    
    console.log(`Recommended clubs:`, recommendedClubs);
    
    // Add recommended clubs to the UI
    recommendedClubs.forEach(club => {
      const clubElement = this.createClubElement(club);
      
      // Add click event directly here instead of doing it later
      clubElement.addEventListener('click', () => {
        if (this.gameState.ballInMotion) return;
        console.log(`Club ${club} clicked directly`);
        this.selectClub(club);
      });
      
      recommendedSection.appendChild(clubElement);
    });
    
    // Auto-select the first recommended club if none selected or current is not recommended
    if (!recommendedClubs.includes(this.gameState.selectedClub) && recommendedClubs.length > 0) {
      this.selectClub(recommendedClubs[0]);
    }
    
    // Always update the UI to show the current selection, even if no change was made
    this.updateClubSelectionUI(this.gameState.selectedClub);
    
    // Add click handlers to ALL club elements
    this.updateAllClubClickHandlers();
  }
  
  // Add a new method to handle ALL club click events
  updateAllClubClickHandlers() {
    // Get all club elements
    const allClubs = document.querySelectorAll('.club');
    
    // Loop through all clubs and add click handlers
    allClubs.forEach(clubElem => {
      // First remove old click handlers by cloning the element
      const clubName = clubElem.dataset.club;
      const newClubElem = clubElem.cloneNode(true);
      newClubElem.dataset.club = clubName;
      clubElem.parentNode.replaceChild(newClubElem, clubElem);
      
      // Add new click event listener
      newClubElem.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (this.gameState.ballInMotion) return;
        
        console.log(`Club ${clubName} clicked via cloned element`);
        this.selectClub(clubName);
      });
    });
  }
  
  // Get distance to hole (helper method)
  getDistanceToHole() {
    if (this.gameState.ballPosition && this.courseConfig && this.courseConfig.holePosition) {
      const holePosition = this.courseConfig.holePosition;
      return Math.sqrt(
        Math.pow(this.gameState.ballPosition.x - holePosition.x, 2) +
        Math.pow(this.gameState.ballPosition.z - holePosition.z, 2)
      );
    }
    return 0;
  }
  
  // Helper to select a club
  selectClub(club) {
    if (this.gameState.ballInMotion) return;
    
    // Check if the club is different than current selection
    const previousClub = this.gameState.selectedClub;
    
    // Set the club in the game state
    this.gameState.selectedClub = club;
    
    // Log club change for debugging
    if (previousClub !== club) {
      console.log(`Club changed from ${previousClub} to ${club}`);
    }
    
    // Update UI immediately but also with a slight delay to ensure DOM is ready
    this.updateClubSelectionUI(club);
    
    // Also update with a slight delay as a backup
    setTimeout(() => {
      this.updateClubSelectionUI(club);
    }, 50);
    
    // Trigger club changed event
    document.dispatchEvent(new CustomEvent('clubChanged', { 
      detail: { club: club } 
    }));
  }
  
  // New helper method to update club selection UI elements
  updateClubSelectionUI(club) {
    // Get all club elements
    const clubElements = document.querySelectorAll('.club');
    
    // Debug how many elements we found
    console.log(`Updating ${clubElements.length} club UI elements to show ${club} as selected`);
    
    // Update visual state of each club element with stronger styling
    clubElements.forEach(clubElem => {
      if (clubElem.dataset.club === club) {
        clubElem.style.background = '#3498db'; // Bright blue for selected
        clubElem.style.transform = 'scale(1.05)'; // Slightly larger
        clubElem.style.boxShadow = '0 0 8px rgba(52, 152, 219, 0.7)'; // Glow effect
        clubElem.style.border = '2px solid white'; // White border
        clubElem.classList.add('selected');
      } else {
        clubElem.style.background = '#7f8c8d'; // Medium gray for non-selected
        clubElem.style.transform = 'scale(1)';
        clubElem.style.boxShadow = 'none';
        clubElem.style.border = 'none';
        clubElem.classList.remove('selected');
      }
    });
    
    // Show club info tooltip
    this.showClubInfo(club);
  }
  
  // Then modify the setupEventListeners method to catch the selectClub event directly
  setupEventListeners() {
    // ADD THIS NEW EVENT LISTENER - listen for direct selectClub events
    document.addEventListener('selectClub', (event) => {
      console.log('Select club event received:', event.detail.club);
      this.selectClub(event.detail.club);
    });
    
    // Rest of the original setupEventListeners code...
    // Listen for ball position updates to update club recommendations
    document.addEventListener('shotComplete', () => {
      this.updateClubSelection();
    });
    
    document.addEventListener('setupNextShot', () => {
      this.updateClubSelection();
    });
    
    // Auto-detect if ball is in a hazard and update club recommendations accordingly
    document.addEventListener('ballLieChanged', (event) => {
      this.updateClubSelection();
    });
    
    // And the rest of your event listeners...
  }
  
  // Also update updateClubSelection to ensure it properly updates the UI when called
// Update the updateClubSelection method
updateClubSelection() {
  // Clear existing recommendations
  const recommendedSection = document.getElementById('recommendedClubs');
  if (!recommendedSection) {
    console.warn("Recommended clubs section not found");
    return;
  }
  
  recommendedSection.innerHTML = '';
  
  // Get the current distance to the hole
  const distanceToHole = this.getDistanceToHole();
  console.log(`Updating club selection for distance: ${distanceToHole} yards`);
  
  // Check the lie of the ball
  const lie = this.gameState.checkLie();
  console.log(`Current ball lie:`, lie);
  
  // Get recommended clubs based on distance and lie
  const recommendedClubs = this.gameState.getRecommendedClubs(
    distanceToHole,
    lie.inSand,
    lie.inRough,
    lie.onGreen
  );
  
  console.log(`Recommended clubs:`, recommendedClubs);
  
  // Add recommended clubs to the UI with DIRECT click handlers
  recommendedClubs.forEach(club => {
    const clubElement = this.createClubElement(club);
    
    // IMPORTANT: Add event listener directly to the element
    clubElement.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log(`Recommended club ${club} clicked directly!`);
      this.selectClub(club);
    });
    
    recommendedSection.appendChild(clubElement);
  });
  
  // Auto-select the first recommended club if none selected or current is not recommended
  if (!recommendedClubs.includes(this.gameState.selectedClub) && recommendedClubs.length > 0) {
    this.selectClub(recommendedClubs[0]);
  }
  
  // Always update the UI to show the current selection
  this.updateClubSelectionUI(this.gameState.selectedClub);
}
  
  // Set up event listeners
  setupEventListeners() {
    // Listen for ball position updates to update club recommendations
    document.addEventListener('shotComplete', () => {
      this.updateClubSelection();
    });
    
    document.addEventListener('setupNextShot', () => {
      this.updateClubSelection();
    });
    
    // Auto-detect if ball is in a hazard and update club recommendations accordingly
    document.addEventListener('ballLieChanged', (event) => {
      this.updateClubSelection();
    });
    
    // Swing button
    this.swingButton.addEventListener('click', () => {
      if (this.gameState.ballInMotion || this.gameState.holeCompleted) return;
      
      if (this.gameState.swingState === 'aiming') {
        // Start power phase
        this.startPowerPhase();
      } else if (this.gameState.swingState === 'ready') {
        // Execute shot
        document.dispatchEvent(new CustomEvent('executeShot', { 
          detail: { power: this.gameState.power } 
        }));
        
        // Reset UI
        this.resetUIAfterShot();
      }
    });
    
    // Aim controls - handle mouse and touch events
    let aimingInterval = null;
    
    // Left aim button
    this.aimControls.leftButton.addEventListener('mousedown', () => {
      if (this.gameState.ballInMotion || this.gameState.swingState !== 'aiming') return;
      
      aimingInterval = setInterval(() => {
        // Adjust aiming angle (rotate left)
        document.dispatchEvent(new CustomEvent('adjustAim', { 
          detail: { direction: 'left', amount: 0.03 } 
        }));
      }, 16);
    });
    
    // Right aim button
    this.aimControls.rightButton.addEventListener('mousedown', () => {
      if (this.gameState.ballInMotion || this.gameState.swingState !== 'aiming') return;
      
      aimingInterval = setInterval(() => {
        // Adjust aiming angle (rotate right)
        document.dispatchEvent(new CustomEvent('adjustAim', { 
          detail: { direction: 'right', amount: 0.03 } 
        }));
      }, 16);
    });
    
    // Clear aiming interval function
    const clearAimingInterval = () => {
      if (aimingInterval !== null) {
        clearInterval(aimingInterval);
        aimingInterval = null;
      }
    };
    
    // Clear interval on mouse up/leave
    this.aimControls.leftButton.addEventListener('mouseup', clearAimingInterval);
    this.aimControls.rightButton.addEventListener('mouseup', clearAimingInterval);
    this.aimControls.leftButton.addEventListener('mouseleave', clearAimingInterval);
    this.aimControls.rightButton.addEventListener('mouseleave', clearAimingInterval);
    
    // Touch events for mobile
    this.aimControls.leftButton.addEventListener('touchstart', (e) => {
      if (this.gameState.ballInMotion || this.gameState.swingState !== 'aiming') return;
      
      aimingInterval = setInterval(() => {
        // Adjust aiming angle (rotate left)
        document.dispatchEvent(new CustomEvent('adjustAim', { 
          detail: { direction: 'left', amount: 0.03 } 
        }));
      }, 16);
      
      e.preventDefault();
    });
    
    this.aimControls.rightButton.addEventListener('touchstart', (e) => {
      if (this.gameState.ballInMotion || this.gameState.swingState !== 'aiming') return;
      
      aimingInterval = setInterval(() => {
        // Adjust aiming angle (rotate right)
        document.dispatchEvent(new CustomEvent('adjustAim', { 
          detail: { direction: 'right', amount: 0.03 } 
        }));
      }, 16);
      
      e.preventDefault();
    });
    
    this.aimControls.leftButton.addEventListener('touchend', clearAimingInterval);
    this.aimControls.rightButton.addEventListener('touchend', clearAimingInterval);
    
    // Camera mode button
    this.cameraModeButton.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('toggleCameraMode'));
    });
    
// Keyboard controls
document.addEventListener('keydown', (e) => {
  // For spacebar, allow it in both aiming and ready states
  if (e.code === 'Space') {
    // Prevent default spacebar behavior (page scroll)
    e.preventDefault();
    
    // Don't allow input during ball motion or when hole is completed
    if (this.gameState.ballInMotion || this.gameState.holeCompleted) return;
    
    if (this.gameState.swingState === 'aiming') {
      // First spacebar press - start the power meter
      this.startPowerPhase();
    } else if (this.gameState.swingState === 'ready') {
      // Second spacebar press - execute the shot with current power
      document.dispatchEvent(new CustomEvent('executeShot', { 
        detail: { power: this.gameState.power } 
      }));
      
      // Reset UI after shot
      this.resetUIAfterShot();
    }
    return;
  }
  
  // For other keys, maintain the original restriction to aiming state
  if (this.gameState.ballInMotion || this.gameState.swingState !== 'aiming') return;
  
  if (e.code === 'ArrowLeft') {
    // Adjust aiming angle (rotate left)
    document.dispatchEvent(new CustomEvent('adjustAim', { 
      detail: { direction: 'left', amount: 0.05 } 
    }));
  } else if (e.code === 'ArrowRight') {
    // Adjust aiming angle (rotate right)
    document.dispatchEvent(new CustomEvent('adjustAim', { 
      detail: { direction: 'right', amount: 0.05 } 
    }));
  } else if (e.code === 'Digit1' || e.code === 'Numpad1') {
    // Quick select driver
    this.selectClub('driver');
  } else if (e.code === 'Digit2' || e.code === 'Numpad2') {
    // Quick select wood3
    this.selectClub('wood3');
  } else if (e.code === 'Digit3' || e.code === 'Numpad3') {
    // Quick select iron5
    this.selectClub('iron5');
  } else if (e.code === 'Digit4' || e.code === 'Numpad4') {
    // Quick select iron7
    this.selectClub('iron7');
  } else if (e.code === 'Digit5' || e.code === 'Numpad5') {
    // Quick select wedge
    this.selectClub('pitchingWedge');
  } else if (e.code === 'Digit6' || e.code === 'Numpad6') {
    // Quick select sand wedge
    this.selectClub('sandWedge');
  } else if (e.code === 'Digit7' || e.code === 'Numpad7') {
    // Quick select putter
    this.selectClub('putter');
  }
});

// Distance display update
document.addEventListener('updateDistance', (event) => {
  this.updateDistanceDisplay(event.detail.distance);
});
  }
  
  // Start power phase
  startPowerPhase() {
    this.gameState.swingState = 'ready';
    this.gameState.powerMeterActive = true;
    
    // Show power meter
    this.powerMeter.container.style.display = 'block';
    this.powerMeter.label.textContent = 'CLICK TO SWING!';
    
    // Animation variables
    let power = 0;
    let direction = 1; // 1 increasing, -1 decreasing
    
    // Start power meter animation
    const powerAnimation = () => {
      if (!this.gameState.powerMeterActive) return;
      
      // Update power
      power += 0.01 * direction;
      
      if (power >= 1) {
        power = 1;
        direction = -1;
      } else if (power <= 0) {
        power = 0;
        direction = 1;
      }
      
      // Update UI
      this.powerMeter.fill.style.width = `${power * 100}%`;
      this.gameState.power = power;
      
      requestAnimationFrame(powerAnimation);
    };
    
    powerAnimation();
    
    // Update swing button
    this.swingButton.textContent = 'HIT!';
    this.swingButton.style.background = '#e74c3c';
  }
  
  // Reset UI after shot execution
  resetUIAfterShot() {
    // Stop power meter animation
    this.gameState.powerMeterActive = false;
    this.powerMeter.container.style.display = 'none';
    
    // Reset swing button
    this.swingButton.textContent = 'SWING';
    this.swingButton.style.background = '#4CAF50';
  }
  
  // Update distance display
  updateDistanceDisplay(distance) {
    // Round to 1 decimal place for cleaner display
    const distanceInYards = distance.toFixed(1);
    
    // Update the scorecard display
    const distanceDisplay = document.getElementById('distance');
    if (distanceDisplay) {
      distanceDisplay.textContent = distanceInYards;
    }
    
    // Also update the club distance indicator if it exists
    const clubDistance = document.getElementById('clubDistance');
    if (clubDistance) {
      clubDistance.textContent = `${distanceInYards} yards to hole`;
    }
  }
  
  // Adjust UI for mobile
  adjustForMobile() {
    // Make buttons larger for touch
    this.swingButton.style.padding = '20px 50px';
    this.swingButton.style.fontSize = '24px';
    
    this.aimControls.leftButton.style.width = '70px';
    this.aimControls.leftButton.style.height = '70px';
    this.aimControls.leftButton.style.fontSize = '32px';
    
    this.aimControls.rightButton.style.width = '70px';
    this.aimControls.rightButton.style.height = '70px';
    this.aimControls.rightButton.style.fontSize = '32px';
    
    // Adjust club selection UI
    document.getElementById('clubSelectionContainer').style.padding = '15px';
    
    // Make club buttons bigger
    document.querySelectorAll('.club').forEach(clubElem => {
      clubElem.style.width = '80px';
      clubElem.style.height = '45px';
      clubElem.style.fontSize = '14px';
    });
  }
  
  // Create a message to show club info when selected
  showClubInfo(club) {
    // Create or get the info element
    let infoElement = document.getElementById('club-info');
    
    if (!infoElement) {
      infoElement = document.createElement('div');
      infoElement.id = 'club-info';
      infoElement.style.position = 'fixed';
      infoElement.style.top = '100px';
      infoElement.style.left = '50%';
      infoElement.style.transform = 'translateX(-50%)';
      infoElement.style.background = 'rgba(0, 0, 0, 0.7)';
      infoElement.style.color = 'white';
      infoElement.style.padding = '10px 20px';
      infoElement.style.borderRadius = '10px';
      infoElement.style.fontSize = '16px';
      infoElement.style.textAlign = 'center';
      infoElement.style.zIndex = '1000';
      infoElement.style.opacity = '0';
      infoElement.style.transition = 'opacity 0.3s ease';
      document.body.appendChild(infoElement);
    }
    
    // Set club info and show element
    infoElement.textContent = `${this.gameState.clubDisplayNames[club]} - Max Distance: ${this.gameState.clubDistances[club]} yards`;
    infoElement.style.opacity = '1';
    
    // Hide info after 2 seconds
    setTimeout(() => {
      infoElement.style.opacity = '0';
    }, 2000);
  }
  // Add this new method here
  setScoreCardWidth() {
    // Find the scorecard element
    const scorecard = document.getElementById('scorecard');
    
    if (scorecard) {
      // Set fixed width to match club selection container
      scorecard.style.width = '280px';  // Increased from 220px
      scorecard.style.boxSizing = 'border-box';
      
      // Apply consistent styling
      scorecard.style.minWidth = '280px';  // Increased from 220px
      scorecard.style.right = '20px'; // Ensure right alignment
      scorecard.style.padding = '10px';
      
      // Make sure text doesn't overflow
      const scorecardChildren = scorecard.querySelectorAll('div');
      scorecardChildren.forEach(child => {
        child.style.whiteSpace = 'nowrap';
        child.style.overflow = 'hidden';
        child.style.textOverflow = 'ellipsis';
      });
    }
  }
}