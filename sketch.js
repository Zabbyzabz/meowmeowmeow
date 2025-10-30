// === PHOTOBOOTH - Y2K GLITCH DIGITAL AESTHETIC ===
// Working face detection + Y2K style + Angel loading screen

let vid, overlayImg, catEarsImg, randomButtonImg, capture;
let faceapi, faceapiReady = false;
let detections = [];
let ml5Loaded = false;
let prevDetected = 0;
let loadingProgress = "meow~ initializing...";

// Y2K settings - BALANCED ADJUSTABLE SETTINGS
let pixelSize = 4;  // Increased from 2 to 4 for better performance (4x faster!)
let colorSteps = 16;  // Changed from 8 to 16 (more colors = smoother gradients)
let contrastBoost = 1.3;  // Reduced from 1.8 - more balanced contrast
let saturationBoost = 1.5;  // Reduced from 2.2 - less oversaturated
let brightnessBoost = 1.0;  // Reduced from 1.35 - no overexposure by default

// HOTKEY CONTROLS
let halftoneEnabled = false;
let halftoneSize = 8;  // Size of halftone dots
let halftoneSpacing = 10;  // Spacing between dots
let posterizeEnabled = false;
let posterizeLevels = 4;  // Number of color levels per channel
let overlayPixelSize = 2;  // Separate pixelation for overlay

// Random button settings (adjust these manually)
let buttonWidth = 68;  // Adjust button width
let buttonHeight = 68;  // Adjust button height
let buttonY = 610;  // Adjust Y position from top (higher = lower on screen)

// Adjustment step sizes for fine control
const BRIGHTNESS_STEP = 0.05;
const SATURATION_STEP = 0.1;
const CONTRAST_STEP = 0.1;

const DITHER = [[0, 2], [3, 1]];

// NICO NICO STYLE CAT KAOMOJI COMMENTS
let comments = [];
const CAT_KAOMOJIS = [
  '(=^･ω･^=)', '(=^‥^=)', '(=；ェ；=)', 'ฅ^•ﻌ•^ฅ', '(^･o･^)ﾉ"',
  'ଲ(ⓛ ω ⓛ)ଲ', '(^._.^)ﾉ', '(=`ω´=)', '(=^･ｪ･^=)', '₍˄·͈༝·͈˄₎◞ ̑̑ෆ⃛',
  '(ↀДↀ)', '(ㅇㅅㅇ❀)', 'ㅇㅅㅇ', '(=ටᆼට=)', '(=ｘェｘ=)', '~(=^‥^)/',
  '(๑˃̵ᴗ˂̵)و', 'ଲ(ⓛ ω ⓛ)ଲ', '(｡•́︿•̀｡)'
];

function preload() {
  console.log('📁 Loading files...');
  
  vid = createVideo('video.mp4', () => {
    console.log('✅ Video loaded!');
    vid.hide();
    vid.loop();
    vid.volume(0);
  });
  
  vid.elt.addEventListener('error', () => {
    console.log('⚠️ Video not found - continuing without video frame');
    vid = null;
  });
  
  overlayImg = loadImage('overlay.png', 
    () => console.log('✅ Overlay loaded!'),
    () => console.log('⚠️ Overlay not found')
  );
  
  catEarsImg = loadImage('cat-ears.png', 
    () => console.log('✅ Cat ears loaded!')
  );
  
  randomButtonImg = loadImage('button.png',
    () => console.log('✅ Random button loaded!'),
    () => console.log('⚠️ Random button not found')
  );
}

function setup() {
  createCanvas(640, 640);
  pixelDensity(1);
  frameRate(60);  // Increased from 30 to 60 for smoother performance
  
  console.log('🎥 Starting webcam...');
  loadingProgress = "meow~ starting webcam...";
  
  capture = createCapture(VIDEO);
  capture.size(640, 640);
  capture.hide();
  
  checkML5();
  
  textFont('monospace');
  textAlign(CENTER, CENTER);
  
  setInterval(spawnComment, random(2000, 4000));
}

function checkML5() {
  if (typeof ml5 !== 'undefined') {
    console.log('✅ ml5 loaded!');
    ml5Loaded = true;
    loadingProgress = "meow~ loading meow AI...";
    console.log('📦 Loading face detection...');
    startFaceDetection();  // Start immediately without delay
  } else {
    console.log('⏳ Waiting for ml5...');
    loadingProgress = "meow~ preparing magic...";
    setTimeout(checkML5, 1000);
  }
}

function spawnComment() {
  let comment = {
    text: random(CAT_KAOMOJIS),
    x: width + 100,
    y: random(50, height - 100),
    speed: random(2, 5),
    size: random(20, 35),
    color: color(random(200, 255), random(200, 255), random(200, 255))
  };
  comments.push(comment);
}

function startFaceDetection() {
  const options = { 
    withLandmarks: true, 
    withDescriptors: false, 
    minConfidence: 0.1  // Lowered from 0.15 to 0.1 for even easier detection in dark
  };
  
  loadingProgress = "meow~ downloading meow AI...";
  
  console.log('🔄 Initializing face detection...');
  
  faceapi = ml5.faceApi(capture, options, () => {
    console.log('✅ Face API ready! Starting detection loop...');
    faceapiReady = true;
    loadingProgress = "";
    detectFaces();
  });
}

function detectFaces() {
  if (!faceapiReady) return;
  
  faceapi.detect((err, results) => {
    if (err) {
      console.error('Face detection error:', err);
    } else {
      // Keep previous detections for 3 frames if face is lost (smoother tracking)
      if (results && results.length > 0) {
        detections = results;
        prevDetected = detections.length;
      } else if (prevDetected > 0) {
        // Don't immediately clear detections - keep for a bit
        prevDetected--;
      } else {
        detections = [];
      }
    }
    setTimeout(detectFaces, 33);  // Reduced from 50ms to 33ms (30fps detection)
  });
}

function draw() {
  background(255);
  
  // LAYER 1: Y2K glitchy digital style
  drawY2KStyle();
  
  // LAYER 2: Flashing overlay (when face detected)
  if (detections.length > 0 && overlayImg) {
    let flashInterval = 30;
    let showOverlay = floor(frameCount / flashInterval) % 2 === 0;
    if (showOverlay) {
      // Simplified pixelation - only every other frame for better performance
      if (frameCount % 2 === 0 || !window.cachedOverlay) {
        let pg = createGraphics(width, height);
        pg.image(overlayImg, 0, 0, width, height);
        pg.loadPixels();
        
        let pixelatedOverlay = createGraphics(width, height);
        pixelatedOverlay.noSmooth();
        pixelatedOverlay.noStroke();
        
        for (let y = 0; y < height; y += overlayPixelSize) {
          for (let x = 0; x < width; x += overlayPixelSize) {
            let index = (floor(y) * width + floor(x)) * 4;
            let r = pg.pixels[index];
            let g = pg.pixels[index + 1];
            let b = pg.pixels[index + 2];
            let a = pg.pixels[index + 3];
            
            pixelatedOverlay.fill(r, g, b, a);
            pixelatedOverlay.rect(x, y, overlayPixelSize, overlayPixelSize);
          }
        }
        
        if (window.cachedOverlay) window.cachedOverlay.remove();
        window.cachedOverlay = pixelatedOverlay;
        pg.remove();
      }
      
      if (window.cachedOverlay) {
        image(window.cachedOverlay, 0, 0, width, height);
      }
    }
  }
  
  // LAYER 3: Cat ears (when face detected)
  if (faceapiReady && detections.length > 0) {
    drawCatEars();
  }
  
  // LAYER 4: Video frame with transparency (only if video loaded)
  if (vid && vid.loadedmetadata) {
    drawVideoFrame();
  }
  
  // LAYER 5: Nico Nico style comments
  drawComments();
  
  // LAYER 6: Angel loading indicator
  if (loadingProgress !== "") {
    drawLoadingIndicator();
  }
  
  // LAYER 7: Random button (bottom center)
  if (randomButtonImg) {
    drawRandomButton();
  }
  
  // DEBUG: Show detection status (remove this later if you want)
  if (faceapiReady) {
    push();
    fill(255);
    stroke(0);
    strokeWeight(2);
    textSize(14);
    textAlign(LEFT, TOP);
    text('Face Detection: ' + (detections.length > 0 ? 'ON (' + detections.length + ')' : 'NO FACE'), 10, height - 30);
    pop();
  }
}

function drawY2KStyle() {
  if (!capture || !capture.loadedmetadata) {
    push();
    fill(200);
    textSize(16);
    text('Waiting for webcam...', width/2, height/2);
    pop();
    return;
  }
  
  capture.loadPixels();
  if (!capture.pixels || !capture.pixels.length) return;
  
  noStroke();
  
  // Pre-calculate constants outside loop
  let capW = capture.width;
  let capH = capture.height;
  let scaleX = capW / width;
  let scaleY = capH / height;
  let steps = posterizeEnabled ? posterizeLevels : colorSteps;
  let stepSize = 255 / (steps - 1);
  
  // OPTIMIZED: Fewer function calls, inline clamping
  for (let y = 0; y < height; y += pixelSize) {
    let cy = ((height - y - pixelSize) * scaleY) | 0;
    
    for (let x = 0; x < width; x += pixelSize) {
      let mirrorX = width - x - pixelSize;
      let cx = (mirrorX * scaleX) | 0;
      
      let capIdx = (cy * capW + cx) * 4;
      let r = capture.pixels[capIdx];
      let g = capture.pixels[capIdx + 1];
      let b = capture.pixels[capIdx + 2];
      
      // Saturation boost (optimized)
      let gray = (r + g + b) * 0.333;
      r = gray + (r - gray) * saturationBoost;
      g = gray + (g - gray) * saturationBoost;
      b = gray + (b - gray) * saturationBoost;
      
      // Brightness & Contrast combined
      r = ((r * brightnessBoost) - 128) * contrastBoost + 128;
      g = ((g * brightnessBoost) - 128) * contrastBoost + 128;
      b = ((b * brightnessBoost) - 128) * contrastBoost + 128;
      
      // Dithering (simplified)
      let ditherVal = ((x + y) & pixelSize) ? 8 : -8;
      r += ditherVal;
      g += ditherVal;
      b += ditherVal;
      
      // Quantize
      r = ((r / stepSize + 0.5) | 0) * stepSize;
      g = ((g / stepSize + 0.5) | 0) * stepSize;
      b = ((b / stepSize + 0.5) | 0) * stepSize;
      
      // Clamp (faster than constrain)
      r = r < 0 ? 0 : r > 255 ? 255 : r;
      g = g < 0 ? 0 : g > 255 ? 255 : g;
      b = b < 0 ? 0 : b > 255 ? 255 : b;
      
      fill(r, g, b);
      rect(x, y, pixelSize, pixelSize);
    }
  }
  
  // Apply HALFTONE effect if enabled (only every 3rd frame for speed)
  if (halftoneEnabled && frameCount % 3 === 0) {
    drawHalftone();
  }
}

function quantize(v, step) {
  const stepSize = 255 / (step - 1);
  return constrain(Math.round(v / stepSize) * stepSize, 0, 255);
}

function drawHalftone() {
  // Create colorful CMYK-style halftone dots
  const channels = [
    {color: [0, 255, 255], offset: 0},      // Cyan
    {color: [255, 0, 255], offset: 2},      // Magenta
    {color: [255, 255, 0], offset: 4},      // Yellow
    {color: [0, 0, 0], offset: 6}           // Black (Key)
  ];
  
  blendMode(MULTIPLY);
  noStroke();
  
  for (let channel of channels) {
    for (let y = channel.offset; y < height; y += halftoneSpacing) {
      for (let x = channel.offset; x < width; x += halftoneSpacing) {
        // Sample the current pixel color at this position
        let c = get(x, y);
        let brightness = (red(c) + green(c) + blue(c)) / 3;
        
        // Invert brightness for dot size (darker = bigger dots)
        let dotSize = map(brightness, 0, 255, halftoneSize, 0);
        
        if (dotSize > 1) {  // Skip very small dots for performance
          fill(channel.color[0], channel.color[1], channel.color[2]);
          ellipse(x, y, dotSize, dotSize);
        }
      }
    }
  }
  
  blendMode(BLEND);
}

function drawEffectUI() {
  push();
  
  // Soft dreamy background with glow
  fill(0, 0, 0, 120);
  noStroke();
  rect(10, 10, 240, 190, 10);
  
  // Inner soft glow
  fill(245, 240, 255, 60);
  rect(12, 12, 236, 186, 9);
  
  // Title with stars
  fill(255, 200, 255);
  textAlign(LEFT, TOP);
  textSize(13);
  textFont('monospace');
  text('✦ controls ✦ (press ? for help)', 18, 18);
  
  // Decorative sparkles
  fill(255, 220, 255, 150);
  textSize(10);
  text('˚ ༘♡', 200, 15);
  text('⋆｡˚', 15, 35);
  
  // Settings display
  textSize(11);
  let yPos = 42;
  
  // Color adjustments section with cute header
  fill(255, 180, 220);
  text('♡ color adjustments', 18, yPos);
  yPos += 18;
  
  fill(255, 240, 250);
  text('brightness ☼ ' + brightnessBoost.toFixed(2), 20, yPos);
  yPos += 15;
  text('saturation ✿ ' + saturationBoost.toFixed(2), 20, yPos);
  yPos += 15;
  text('contrast ★ ' + contrastBoost.toFixed(2), 20, yPos);
  yPos += 20;
  
  // Effects section with cute header
  fill(200, 220, 255);
  text('✧ effects', 18, yPos);
  yPos += 18;
  
  fill(240, 250, 255);
  text('pixelation ◌ ' + pixelSize, 20, yPos);
  yPos += 18;
  
  text('halftone ○ ' + (halftoneEnabled ? 'ON' : 'OFF'), 20, yPos);
  if (halftoneEnabled) {
    fill(200, 255, 220);
    textSize(10);
    text('size: ' + halftoneSize + ' ◇ space: ' + halftoneSpacing, 25, yPos + 13);
    textSize(11);
    yPos += 13;
    fill(240, 250, 255);
  }
  yPos += 18;
  
  text('posterize ◈ ' + (posterizeEnabled ? 'ON' : 'OFF'), 20, yPos);
  if (posterizeEnabled) {
    fill(255, 220, 240);
    textSize(10);
    text('levels: ' + posterizeLevels, 25, yPos + 13);
    textSize(11);
    yPos += 13;
    fill(240, 250, 255);
  }
  
  // Footer
  fill(200, 200, 255, 180);
  textSize(9);
  text('˚ ༘♡ ⋆｡˚ press 0 to reset ⋆｡˚ ♡༘ ˚', 18, 188);
  
  pop();
}

function drawComments() {
  push();
  textAlign(LEFT, CENTER);
  
  for (let i = comments.length - 1; i >= 0; i--) {
    let c = comments[i];
    c.x -= c.speed;
    
    if (c.x < -200) {
      comments.splice(i, 1);
      continue;
    }
    
    let hideComment = false;
    if (detections.length > 0) {
      for (let d of detections) {
        if (!d.alignedRect) continue;
        
        const box = d.alignedRect._box;
        const scaleX = width / capture.width;
        const scaleY = height / capture.height;
        
        // Flip face detection Y coordinates
        const faceRight = width - (box._x * scaleX);
        const faceLeft = width - ((box._x + box._width) * scaleX);
        const faceTop = height - ((box._y + box._height) * scaleY);
        const faceBottom = height - (box._y * scaleY);
        
        if (c.x > faceLeft && c.x < faceRight &&
            c.y > faceTop && c.y < faceBottom) {
          hideComment = true;
          break;
        }
      }
    }
    
    if (!hideComment) {
      fill(c.color);
      textSize(c.size);
      text(c.text, c.x, c.y);
    }
  }
  
  pop();
}

function drawVideoFrame() {
  if (!vid || !vid.loadedmetadata) return;
  
  vid.loadPixels();
  if (!vid.pixels || !vid.pixels.length) return;
  
  push();
  let pg = createGraphics(vid.width, vid.height);
  pg.image(vid, 0, 0);
  pg.loadPixels();
  
  const threshold = 30;
  for (let i = 0; i < pg.pixels.length; i += 4) {
    let brightness = (pg.pixels[i] + pg.pixels[i + 1] + pg.pixels[i + 2]) / 3;
    if (brightness < threshold) {
      pg.pixels[i + 3] = 0;
    }
  }
  
  pg.updatePixels();
  image(pg, 0, 0, width, height);
  pg.remove();
  pop();
}

function drawCatEars() {
  push();
  
  for (let d of detections) {
    if (!d.alignedRect) continue;
    
    const box = d.alignedRect._box;
    const scaleX = width / capture.width;
    const scaleY = height / capture.height;
    
    // Flip Y coordinates for face detection
    const centerX = width - (box._x * scaleX + (box._width * scaleX) / 2);
    const topY = height - (box._y * scaleY);
    const faceWidth = box._width * scaleX;
    
    const earsWidth = faceWidth * 2.5;
    const earsHeight = catEarsImg ? earsWidth * (catEarsImg.height / catEarsImg.width) : earsWidth;
    
    // Adjust the X position here - add or subtract to shift left/right
    const earsX = centerX + 38; // Change this number: positive = right, negative = left
    const earsY = topY - earsHeight * 2.7;
    
    if (catEarsImg && catEarsImg.width > 0) {
      imageMode(CENTER);
      tint(255, 255);
      image(catEarsImg, earsX, earsY, earsWidth, earsHeight);
      noTint();
    }
    
    noFill();
    stroke(0, 255, 0);
    strokeWeight(3);
    const mirroredX = width - ((box._x + box._width) * scaleX);
    const flippedTopY = height - ((box._y + box._height) * scaleY);
    rect(mirroredX, flippedTopY, box._width * scaleX, box._height * scaleY);
  }  
  pop();
}

function drawLoadingIndicator() {
  push();
  
  // Soft dreamy background
  noStroke();
  rectMode(CENTER);
  
  // Outer ethereal glow
  fill(245, 240, 255, 200);
  rect(width/2, height/2, 400, 180, 20);
  
  // Main soft box
  fill(252, 250, 255, 240);
  rect(width/2, height/2, 380, 160, 18);
  
  let time = frameCount * 0.04;
  
  // Top decorative stars
  fill(200, 195, 220);
  textSize(18);
  textAlign(CENTER, CENTER);
  textFont('monospace');
  text('✦', width/2 - 140, height/2 - 55);
  text('✦', width/2 + 140, height/2 - 55);
  
  // Floating stars around everything
  fill(210, 200, 230, 180 + sin(time * 2) * 60);
  textSize(16);
  text('⋆', width/2 - 100 + sin(time * 1.5) * 3, height/2 - 50);
  text('⋆', width/2 + 100 + sin(time * 1.8) * 3, height/2 - 50);
  
  // Main centerpiece: ꒰ა ☆ ໒꒱
  fill(190, 180, 210);
  textSize(32);
  
  // Gentle float animation
  let floatY = sin(time * 1.5) * 3;
  
  // Left bracket ꒰ა
  text('꒰ა', width/2 - 35, height/2 - 20 + floatY);
  
  // Star ☆
  fill(220, 200, 240);
  textSize(24);
  text('☆', width/2, height/2 - 18 + floatY);
  
  // Right bracket ໒꒱
  fill(190, 180, 210);
  textSize(32);
  text('໒꒱', width/2 + 35, height/2 - 20 + floatY);
  
  // Loading text with animated dots
  let dots = '.'.repeat((frameCount / 20) % 4);
  fill(170, 165, 200);
  textSize(13);
  textFont('monospace');
  text(loadingProgress + dots, width/2, height/2 + 15);
  
  // Bottom message with stars
  textSize(11);
  fill(180, 175, 200);
  textFont('monospace');
  text('✦ loading meow vibes ✦', width/2, height/2 + 38);
  
  // More ambient stars everywhere
  fill(210, 200, 230, 120 + sin(time * 1.8) * 60);
  textSize(12);
  text('✦', width/2 - 160, height/2 + cos(time * 1.2) * 10);
  text('✦', width/2 + 160, height/2 + sin(time * 1.4) * 10);
  
  fill(200, 190, 220, 120 + cos(time * 2.2) * 60);
  textSize(14);
  text('⋆', width/2 - 150 + sin(time) * 5, height/2 - 20);
  text('⋆', width/2 + 150 + cos(time) * 5, height/2 - 20);
  
  // Additional sparkles
  fill(220, 210, 240, 100 + sin(time * 1.3) * 70);
  textSize(10);
  text('✧', width/2 - 120, height/2 + 50);
  text('✧', width/2 + 120, height/2 + 50);
  
  pop();
}

function drawRandomButton() {
  push();
  imageMode(CENTER);
  // Position at bottom center
  let buttonX = width / 2;
  image(randomButtonImg, buttonX, buttonY, buttonWidth, buttonHeight);
  pop();
}

// ===== HOTKEY CONTROLS =====
function keyPressed() {
  // PIXELATION CONTROLS (Q/W keys)
  if (key === 'q' || key === 'Q') {
    pixelSize = max(1, pixelSize - 1);
    console.log('◌ pixelation decreased', pixelSize);
  }
  if (key === 'w' || key === 'W') {
    pixelSize = min(20, pixelSize + 1);
    console.log('◌ pixelation increased', pixelSize);
  }
  
  // OVERLAY PIXELATION CONTROLS (T/Y keys)
  if (key === 't' || key === 'T') {
    overlayPixelSize = max(1, overlayPixelSize - 1);
    console.log('◈ overlay pixelation decreased', overlayPixelSize);
  }
  if (key === 'y' || key === 'Y') {
    overlayPixelSize = min(20, overlayPixelSize + 1);
    console.log('◈ overlay pixelation increased', overlayPixelSize);
  }
  
  // BRIGHTNESS CONTROLS (1/2 keys)
  if (key === '1') {
    brightnessBoost = max(0.5, brightnessBoost - BRIGHTNESS_STEP);
    console.log('☼ brightness decreased', brightnessBoost.toFixed(2));
  }
  if (key === '2') {
    brightnessBoost = min(2.5, brightnessBoost + BRIGHTNESS_STEP);
    console.log('☼ brightness increased', brightnessBoost.toFixed(2));
  }
  
  // SATURATION CONTROLS (3/4 keys)
  if (key === '3') {
    saturationBoost = max(0.5, saturationBoost - SATURATION_STEP);
    console.log('✿ saturation decreased', saturationBoost.toFixed(2));
  }
  if (key === '4') {
    saturationBoost = min(4.0, saturationBoost + SATURATION_STEP);
    console.log('✿ saturation increased', saturationBoost.toFixed(2));
  }
  
  // CONTRAST CONTROLS (5/6 keys)
  if (key === '5') {
    contrastBoost = max(0.5, contrastBoost - CONTRAST_STEP);
    console.log('★ contrast decreased', contrastBoost.toFixed(2));
  }
  if (key === '6') {
    contrastBoost = min(3.0, contrastBoost + CONTRAST_STEP);
    console.log('★ contrast increased', contrastBoost.toFixed(2));
  }
  
  // RESET TO DEFAULTS (0 key)
  if (key === '0') {
    brightnessBoost = 1.0;
    saturationBoost = 1.5;
    contrastBoost = 1.3;
    console.log('✧ reset to defaults');
    console.log('  ☼ brightness:', brightnessBoost);
    console.log('  ✿ saturation:', saturationBoost);
    console.log('  ★ contrast:', contrastBoost);
  }
  
  // HALFTONE TOGGLE (H key)
  if (key === 'h' || key === 'H') {
    halftoneEnabled = !halftoneEnabled;
    console.log('○ halftone:', halftoneEnabled ? 'ON' : 'OFF');
  }
  
  // HALFTONE SIZE (A/S keys) - only works when halftone is on
  if ((key === 'a' || key === 'A') && halftoneEnabled) {
    halftoneSize = max(2, halftoneSize - 1);
    console.log('◇ halftone size', halftoneSize);
  }
  if ((key === 's' || key === 'S') && halftoneEnabled) {
    halftoneSize = min(20, halftoneSize + 1);
    console.log('◇ halftone size', halftoneSize);
  }
  
  // HALFTONE SPACING (Z/X keys) - only works when halftone is on
  if ((key === 'z' || key === 'Z') && halftoneEnabled) {
    halftoneSpacing = max(4, halftoneSpacing - 1);
    console.log('◇ halftone spacing', halftoneSpacing);
  }
  if ((key === 'x' || key === 'X') && halftoneEnabled) {
    halftoneSpacing = min(30, halftoneSpacing + 1);
    console.log('◇ halftone spacing', halftoneSpacing);
  }
  
  // POSTERIZE TOGGLE (P key)
  if (key === 'p' || key === 'P') {
    posterizeEnabled = !posterizeEnabled;
    console.log('◈ posterize:', posterizeEnabled ? 'ON' : 'OFF');
  }
  
  // POSTERIZE LEVELS (E/R keys) - only works when posterize is on
  if ((key === 'e' || key === 'E') && posterizeEnabled) {
    posterizeLevels = max(2, posterizeLevels - 1);
    console.log('◈ posterize levels', posterizeLevels);
  }
  if ((key === 'r' || key === 'R') && posterizeEnabled) {
    posterizeLevels = min(16, posterizeLevels + 1);
    console.log('◈ posterize levels', posterizeLevels);
  }
  
  // RANDOMIZER (SPACEBAR key)
  if (key === ' ') {
    randomizeEffects();
  }
  
  // HELP (? key)
  if (key === '?') {
    console.log('\n✧･ﾟ: *✧･ﾟ:* HOTKEY CONTROLS *:･ﾟ✧*:･ﾟ✧');
    console.log('');
    console.log('♡ COLOR ADJUSTMENTS');
    console.log('  1/2 → decrease/increase brightness ☼');
    console.log('  3/4 → decrease/increase saturation ✿');
    console.log('  5/6 → decrease/increase contrast ★');
    console.log('  0 → reset to defaults');
    console.log('');
    console.log('✧ EFFECTS');
    console.log('  Q/W → decrease/increase pixelation ◌');
    console.log('  T/Y → decrease/increase overlay pixelation ◈');
    console.log('  H → toggle halftone ○');
    console.log('  A/S → halftone size ◇ (when on)');
    console.log('  Z/X → halftone spacing ◇ (when on)');
    console.log('  P → toggle posterize ◈');
    console.log('  E/R → posterize levels (when on)');
    console.log('');
    console.log('✦ FUN');
    console.log('  SPACEBAR → randomize all effects! ✨');
    console.log('  record button = random meow surprise (=^･ω･^=)');
    console.log('');
    console.log('  ? → show this help');
    console.log('\n˚ ༘♡ ⋆｡˚ ☁︎ ˚｡⋆｡˚☽˚｡⋆\n');
  }
  
  return false; // Prevent default behavior
}

function mousePressed() {
  // Check if click is on the random button
  if (randomButtonImg) {
    let buttonX = width / 2;
    let halfWidth = buttonWidth / 2;
    let halfHeight = buttonHeight / 2;
    
    if (mouseX > buttonX - halfWidth && mouseX < buttonX + halfWidth &&
        mouseY > buttonY - halfHeight && mouseY < buttonY + halfHeight) {
      // Trigger randomization
      randomizeEffects();
    }
  }
}

function randomizeEffects() {
  // Randomize color settings
  brightnessBoost = random(0.8, 1.8);
  saturationBoost = random(1.0, 3.0);
  contrastBoost = random(1.0, 2.5);
  
  // Randomize pixelation
  pixelSize = floor(random(1, 8));
  overlayPixelSize = floor(random(1, 8));
  
  // Randomly enable/disable effects
  halftoneEnabled = random() > 0.5;
  if (halftoneEnabled) {
    halftoneSize = floor(random(4, 15));
    halftoneSpacing = floor(random(6, 20));
  }
  
  posterizeEnabled = random() > 0.5;
  if (posterizeEnabled) {
    posterizeLevels = floor(random(2, 12));
  }
  
  console.log('\n✧ RANDOMIZED! ✧');
  console.log('☼ brightness:', brightnessBoost.toFixed(2));
  console.log('✿ saturation:', saturationBoost.toFixed(2));
  console.log('★ contrast:', contrastBoost.toFixed(2));
  console.log('◌ pixelation:', pixelSize);
  console.log('◈ overlay pixelation:', overlayPixelSize);
  console.log('○ halftone:', halftoneEnabled ? 'ON (size: ' + halftoneSize + ', space: ' + halftoneSpacing + ')' : 'OFF');
  console.log('◈ posterize:', posterizeEnabled ? 'ON (levels: ' + posterizeLevels + ')' : 'OFF');
  console.log('');
}