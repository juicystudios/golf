// components/SkyboxManager.js
// Handles creation and management of the skybox

import * as THREE from 'three';

export class SkyboxManager {
  constructor(scene, courseConfig) {
    this.scene = scene;
    this.courseConfig = courseConfig;
  }

  // Create a proper skybox using a hemisphere and mountain planes
  createProperSkybox() {
    console.log("Creating proper skybox with mountains");
    
    // Use a simpler approach: a hemisphere for the sky and mountain planes on the horizon
    
    // 1. Create a sky hemisphere
    const skyRadius = this.courseConfig.groundSize * 1.2;
    const hemisphereGeometry = new THREE.SphereGeometry(skyRadius, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    
    // Sky blue color
    const skyColor = new THREE.Color(0x87CEEB);
    const skyMaterial = new THREE.MeshBasicMaterial({
      color: skyColor,
      side: THREE.BackSide
    });
    
    const skyDome = new THREE.Mesh(hemisphereGeometry, skyMaterial);
    skyDome.position.y = 0;
    this.scene.add(skyDome);
    
    // Set the scene background color to match
    this.scene.background = skyColor;
    
    // 2. Create mountain silhouettes around the horizon
    const mountainHeight = 150;
    const mountainDistance = this.courseConfig.groundSize * 0.8;
    
    // Create mountains in 8 directions for better coverage
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI / 4) * i;
      
      // Create the mountain plane
      const mountainWidth = this.courseConfig.groundSize * 1.2;
      const mountainGeometry = new THREE.PlaneGeometry(mountainWidth, mountainHeight);
      
      // Create mountain texture with solid mountains (no transparency)
      const mountainTexture = this.createSolidMountainTexture();
      
      const mountainMaterial = new THREE.MeshBasicMaterial({
        map: mountainTexture,
        side: THREE.DoubleSide
      });
      
      const mountainPlane = new THREE.Mesh(mountainGeometry, mountainMaterial);
      
      // Position around the horizon
      mountainPlane.position.set(
        Math.sin(angle) * mountainDistance,
        mountainHeight / 2 - 10,
        Math.cos(angle) * mountainDistance
      );
      
      // Rotate to face center
      mountainPlane.rotation.y = angle + Math.PI;
      
      this.scene.add(mountainPlane);
    }
  }

  // Create a solid mountain texture with no transparency issues
  createSolidMountainTexture() {
    // Create a canvas to draw the mountain silhouette
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    
    const ctx = canvas.getContext('2d');
    
    // Fill the canvas with sky color that matches scene background
    const skyColor = new THREE.Color(0x87CEEB);
    ctx.fillStyle = `rgb(${Math.floor(skyColor.r * 255)}, ${Math.floor(skyColor.g * 255)}, ${Math.floor(skyColor.b * 255)})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw mountain silhouettes - using solid color, no transparency
    ctx.fillStyle = 'rgb(56, 64, 84)';  // Dark blue-gray for mountains, fully opaque
    
    // Base Y position for mountains (near bottom of canvas)
    const baseY = canvas.height * 0.7;
    
    // Random peaks using a sine wave with noise
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);  // Start at bottom left
    
    // Add bottom-left corner
    ctx.lineTo(0, baseY);
    
    // Draw mountain range
    for (let x = 0; x < canvas.width; x++) {
      // Create multiple overlapping sine waves with different frequencies 
      const y1 = Math.sin(x * 0.01) * 20;
      const y2 = Math.sin(x * 0.02 + 1) * 15;
      const y3 = Math.sin(x * 0.005 + 2) * 25;
      
      // Add some randomness
      const noise = Math.sin(x * 0.1) * 5;
      
      // Combine waves and ensure higher peaks in the middle
      const middle = Math.abs(x - canvas.width/2);
      const centerBoost = Math.max(0, 20 - middle * 0.1);
      
      const y = baseY - (y1 + y2 + y3 + noise + centerBoost);
      
      ctx.lineTo(x, y);
    }
    
    // Add bottom-right corner and close the path
    ctx.lineTo(canvas.width, baseY);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.closePath();
    ctx.fill();
    
    // Create a texture from the canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    return texture;
  }
}