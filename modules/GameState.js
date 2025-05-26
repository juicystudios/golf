// Game state management
import * as THREE from 'three';
export class GameState {
  constructor() {
    this.swingState = 'aiming'; // aiming, ready, swinging
    this.power = 0;
    this.accuracy = 0;
    this.selectedClub = 'driver';
    
    // Updated club distances with realistic values
    this.clubDistances = {
      driver: 280,   // Max 280 yards (reduced from 320)
      wood3: 240,    // Max 240 yards (reduced from 250)
      hybrid: 215,   // Max 215 yards (reduced from 230)
      iron2: 200,    // Max 200 yards (reduced from 220)
      iron3: 190,    // Max 190 yards (reduced from 210)
      iron4: 180,    // Max 180 yards (reduced from 200)
      iron5: 170,    // Max 170 yards (reduced from 190)
      iron6: 160,    // Max 160 yards (reduced from 180)
      iron7: 150,    // Max 150 yards (reduced from 170)
      iron8: 140,    // Max 140 yards (reduced from 160)
      iron9: 130,    // Max 130 yards (reduced from 145)
      pitchingWedge: 115, // Max 115 yards (reduced from 130)
      sandWedge: 90,     // Max 90 yards (reduced from 100)
      lobWedge: 70,      // Max 70 yards (reduced from 80)
      putter: 20         // Max 20 yards (reduced from 50)
    };
    
    // Add club categories to help with UI organization
    this.clubCategories = {
      woods: ['driver', 'wood3', 'hybrid'],
      longIrons: ['iron2', 'iron3', 'iron4', 'iron5'],
      shortIrons: ['iron6', 'iron7', 'iron8', 'iron9'],
      wedges: ['pitchingWedge', 'sandWedge', 'lobWedge'],
      putting: ['putter']
    };
    
    // Add display names for clubs (for UI)
    this.clubDisplayNames = {
      driver: 'Driver',
      wood3: '3 Wood',
      hybrid: 'Hybrid',
      iron2: '2 Iron',
      iron3: '3 Iron',
      iron4: '4 Iron',
      iron5: '5 Iron',
      iron6: '6 Iron',
      iron7: '7 Iron',
      iron8: '8 Iron',
      iron9: '9 Iron',
      pitchingWedge: 'P Wedge',
      sandWedge: 'S Wedge',
      lobWedge: 'L Wedge',
      putter: 'Putter'
    };
    
    this.strokes = 0;
    this.ballInMotion = false;
    this.holeCompleted = false;
    this.aimingDirection = new THREE.Vector3(0, 0, -1);
    this.aimingAngle = 0;
    this.isCameraRotating = false;
    this.cameraMode = 'free'; // Changed back to 'free' by default
    this.powerMeterActive = false;
    this.controlsDisabled = false;
    
    // Current ball lie information
    this.currentBallLie = {
      inSand: false,
      inRough: false,
      inWater: false,
      onGreen: false,
      onFairway: true
    };
  }
  
    // Get recommended clubs based on context
    getRecommendedClubs(distance, inSand = false, inRough = false, onGreen = false) {
      // If on the green, only return putter
      if (onGreen) {
        return ['putter'];
      }
      
      // If in a sand trap, prioritize sand wedge
      if (inSand) {
        // For very short distances out of sand
        if (distance < 30) {
          return ['sandWedge', 'lobWedge'];
        } else {
          return ['sandWedge', 'pitchingWedge'];
        }
      }
      
      // Recommendations based on distance to hole
      if (distance > 280) {
        return ['driver', 'wood3'];
      } else if (distance > 230) {
        return ['wood3', 'hybrid', 'iron2'];
      } else if (distance > 210) {
        return ['hybrid', 'iron2', 'iron3'];
      } else if (distance > 190) {
        return ['iron3', 'iron4'];
      } else if (distance > 170) {
        return ['iron4', 'iron5'];
      } else if (distance > 150) {
        return ['iron5', 'iron6'];
      } else if (distance > 130) {
        return ['iron6', 'iron7'];
      } else if (distance > 110) {
        return ['iron7', 'iron8'];
      } else if (distance > 90) {
        return ['iron8', 'iron9'];
      } else if (distance > 70) {
        return ['iron9', 'pitchingWedge'];
      } else if (distance > 50) {
        return ['pitchingWedge', 'sandWedge'];
      } else if (distance > 20) {
        return ['sandWedge', 'lobWedge'];
      } else {
        return ['putter', 'lobWedge'];
      }
    }
    
    // Get club icon class for UI display
    getClubIconClass(club) {
      if (this.clubCategories.woods.includes(club)) {
        return 'wood-icon';
      } else if (this.clubCategories.longIrons.includes(club) || 
                this.clubCategories.shortIrons.includes(club)) {
        return 'iron-icon';
      } else if (this.clubCategories.wedges.includes(club)) {
        return 'wedge-icon';
      } else {
        return 'putter-icon';
      }
    }
    
    // Check ball lie for club recommendations
    checkLie() {
      return this.currentBallLie;
    }
  
    // Update strokes count and UI
    incrementStrokes() {
      this.strokes++;
      document.getElementById('strokes').textContent = this.strokes;
      return this.strokes;
    }
  
    // Get club-specific properties
    getClubDistance(club) {
      return this.clubDistances[club] || this.clubDistances.driver;
    }
  
    // Check if current club is a putter
    isPutter() {
      return this.selectedClub === 'putter';
    }
    
    // Check if current club is a sand wedge
    isSandWedge() {
      return this.selectedClub === 'sandWedge';
    }
  
    // Reset game state for a new hole
    resetForNewHole() {
      this.swingState = 'aiming';
      this.power = 0;
      this.strokes = 0;
      this.ballInMotion = false;
      this.holeCompleted = false;
      this.selectedClub = 'driver'; // Reset to driver
      this.currentBallLie = {
        inSand: false,
        inRough: false,
        inWater: false,
        onGreen: false,
        onFairway: true
      };
      
      // Reset UI
      document.getElementById('strokes').textContent = this.strokes;
    }
  
    // Complete the hole - FIXED to properly show completion message
    completeHole() {
      console.log("ATTEMPTING TO COMPLETE HOLE with strokes:", this.strokes);
      
      if (this.holeCompleted) {
        console.log("Hole already completed, ignoring");
        return;
      }
      
      console.log("HOLE COMPLETED! Showing completion screen");
      this.holeCompleted = true;
      
      // Create a more prominent completion message
      const completionMsg = document.createElement('div');
      completionMsg.style.position = 'fixed';
      completionMsg.style.top = '50%';
      completionMsg.style.left = '50%';
      completionMsg.style.transform = 'translate(-50%, -50%)';
      completionMsg.style.background = 'rgba(0, 0, 0, 0.8)';
      completionMsg.style.color = 'white';
      completionMsg.style.padding = '30px 50px';
      completionMsg.style.borderRadius = '15px';
      completionMsg.style.fontSize = '24px';
      completionMsg.style.textAlign = 'center';
      completionMsg.style.zIndex = '1000';
      completionMsg.style.boxShadow = '0 5px 15px rgba(0,0,0,0.5)';
      
      // Add par rating based on strokes
      let parRating = "Par";
      if (this.strokes === 1) {
        parRating = "Hole in One!";
      } else if (this.strokes === 2) {
        parRating = "Eagle";
      } else if (this.strokes === 3) {
        parRating = "Birdie";
      } else if (this.strokes === 4) {
        parRating = "Par";
      } else if (this.strokes === 5) {
        parRating = "Bogey";
      } else if (this.strokes === 6) {
        parRating = "Double Bogey";
      } else if (this.strokes > 6) {
        parRating = "Triple Bogey+";
      }
      
      // Get hole ID from course config
      const holeId = this.courseConfig.id || 'Today\'s Hole';
      
      completionMsg.innerHTML = `
        <h2 style="margin-top: 0; color: gold;">Hole Complete!</h2>
        <p>${holeId}</p>
        <p>You completed the hole in ${this.strokes} strokes.</p>
        <p style="color: ${this.strokes <= 4 ? '#4CAF50' : '#e74c3c'}">${parRating}</p>
        <button id="newGameBtn" style="background: #4CAF50; border: none; color: white; padding: 10px 20px; 
          border-radius: 5px; cursor: pointer; font-size: 16px; margin-top: 10px;">
          Play Again
        </button>
        <button id="returnToSplashBtn" style="background: #3498db; border: none; color: white; padding: 10px 20px; 
          border-radius: 5px; cursor: pointer; font-size: 16px; margin-top: 10px; margin-left: 10px;">
          Return to Menu
        </button>
      `;
      
      document.body.appendChild(completionMsg);
      
      console.log("Completion message added to DOM");
      
      // Add event listener to the new game button
      document.getElementById('newGameBtn').addEventListener('click', () => {
        console.log("New game button clicked");
        // Remove the completion message
        document.body.removeChild(completionMsg);
        
        // Reset the game
        this.resetForNewHole();
        
        // Reset the ball position
        if (window.ballPhysics) {
          window.ballPhysics.placeBallOnTee();
        } else {
          // Try to find and dispatch a custom event for game reset
          document.dispatchEvent(new CustomEvent('resetGame'));
        }
      });
      
      // Add event listener to return to splash button
      document.getElementById('returnToSplashBtn').addEventListener('click', () => {
        console.log("Return to menu button clicked");
        document.body.removeChild(completionMsg);
        if (window.WeeTeeTime && window.WeeTeeTime.returnToSplash) {
          window.WeeTeeTime.returnToSplash();
        }
      });
    }
  }