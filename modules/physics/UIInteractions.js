// UIInteractions.js - Handles UI-related functions and events
import * as THREE from 'three';

export class UIInteractions {
  constructor(ballPhysics) {
    // Store reference to main class
    this.ballPhysics = ballPhysics;
    
    // Shortcuts to commonly used properties
    this.ballPosition = ballPhysics.ballPosition;
    this.gameState = ballPhysics.gameState;
    this.courseBuilder = ballPhysics.courseBuilder;
  }
  
  // Update distance to hole display
  updateDistanceToHole() {
    const holePosition = this.courseBuilder.courseConfig.holePosition;
    const distance = Math.sqrt(
      Math.pow(this.ballPosition.x - holePosition.x, 2) +
      Math.pow(this.ballPosition.z - holePosition.z, 2)
    );
    
    // Convert to yards for display (assuming 1 unit = 1 yard)
    const distanceInYards = distance;
    
    // Emit event for UI to update
    document.dispatchEvent(new CustomEvent('updateDistance', {
      detail: { distance: distanceInYards }
    }));
  }
  
// Force camera to reset to behind-ball position
forceCameraReset() {
  // Log the request for debugging
  console.log("forceCameraReset called - resetting camera to position:", this.ballPosition);
  
  // Make sure gameState ball position is updated
  this.gameState.ballPosition = this.ballPosition.clone();
  
  // Explicitly trigger camera position reset with current ball position
  document.dispatchEvent(new CustomEvent('resetCameraBehindBall', {
    detail: {
      position: this.ballPosition.clone()
    }
  }));
  
  // Also dispatch the standard events for backward compatibility
  document.dispatchEvent(new CustomEvent('shotComplete', {
    detail: {
      position: this.ballPosition.clone()
    }
  }));
  
  // Send setupNextShot event with a small delay to ensure other events are processed first
  setTimeout(() => {
    document.dispatchEvent(new CustomEvent('setupNextShot', {
      detail: {
        position: this.ballPosition.clone()
      }
    }));
    console.log("Camera reset events dispatched");
  }, 50);
}
  
  // Show a gameplay tip to the player
  showTip(message, duration = 3000) {
    // Create or get the tip element
    let tipElement = document.getElementById('gameplay-tip');
    
    if (!tipElement) {
      tipElement = document.createElement('div');
      tipElement.id = 'gameplay-tip';
      tipElement.style.position = 'fixed';
      tipElement.style.top = '100px';
      tipElement.style.left = '50%';
      tipElement.style.transform = 'translateX(-50%)';
      tipElement.style.background = 'rgba(0, 0, 0, 0.7)';
      tipElement.style.color = 'white';
      tipElement.style.padding = '10px 20px';
      tipElement.style.borderRadius = '10px';
      tipElement.style.fontSize = '16px';
      tipElement.style.fontWeight = 'bold';
      tipElement.style.textAlign = 'center';
      tipElement.style.zIndex = '1000';
      tipElement.style.opacity = '0';
      tipElement.style.transition = 'opacity 0.3s ease';
      document.body.appendChild(tipElement);
    }
    
    // Set message and show tip
    tipElement.textContent = message;
    tipElement.style.opacity = '1';
    
    // Hide tip after duration
    setTimeout(() => {
      tipElement.style.opacity = '0';
    }, duration);
  }
  
  // Display power meter and activate shot system
  activatePowerMeter() {
    // This functionality would normally interact with UI controller
    // For now, we'll just emit an event
    document.dispatchEvent(new CustomEvent('activatePowerMeter'));
  }
  
  // Show score and shot information
  displayShotInformation(shotType, distance, club) {
    // Build the message
    let message = `${shotType}: ${distance.toFixed(1)} yards`;
    if (club) {
      message += ` with ${this.gameState.clubDisplayNames[club]}`;
    }
    
    // Show the tip
    this.showTip(message, 2500);
  }
  
  // Show notification for terrain change
  notifyTerrainChange(terrainType) {
    let message = '';
    let color = 'white';
    
    switch(terrainType) {
      case 'green':
        message = "Ball is on the green!";
        color = '#2ecc71'; // Green color
        break;
      case 'fairway':
        message = "Ball is on the fairway";
        color = '#27ae60'; // Dark green
        break;
      case 'rough':
        message = "Ball is in the rough";
        color = '#f39c12'; // Orange
        break;
      case 'outerRough':
        message = "Ball is in deep rough";
        color = '#e67e22'; // Dark orange
        break;
      case 'sand':
        message = "Ball is in a sand bunker";
        color = '#f1c40f'; // Yellow
        break;
      case 'water':
        message = "Ball is in water";
        color = '#3498db'; // Blue
        break;
    }
    
    if (message) {
      // Create temporary notification
      let notification = document.createElement('div');
      notification.textContent = message;
      notification.style.position = 'fixed';
      notification.style.bottom = '180px';
      notification.style.left = '50%';
      notification.style.transform = 'translateX(-50%)';
      notification.style.background = 'rgba(0, 0, 0, 0.7)';
      notification.style.color = color;
      notification.style.padding = '8px 15px';
      notification.style.borderRadius = '8px';
      notification.style.fontSize = '14px';
      notification.style.fontWeight = 'bold';
      notification.style.zIndex = '999';
      
      document.body.appendChild(notification);
      
      // Remove after a delay
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 2000);
    }
  }
}