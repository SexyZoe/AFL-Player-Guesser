const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Player = require('../models/Player');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
console.log('MongoDB connected');
  } catch (error) {
console.error('MongoDB connection failed:', error);
    process.exit(1);
  }
}

// Verify whether image files exist
async function verifyImages() {
  try {
    const players = await Player.find({});
    const imageDir = path.join(__dirname, '..', 'public', 'images', 'players');
    
console.log(`Verifying images for ${players.length} players`);
console.log(`Images dir: ${imageDir}\n`);
    
    let hasImageCount = 0;
    let validImageCount = 0;
    let invalidImageCount = 0;
    let missingImageCount = 0;
    
    const invalidImages = [];
    const missingImages = [];
    const validImages = [];
    
    for (const player of players) {
      const status = {
        name: player.name,
        team: player.team,
        number: player.number,
        imageUrl: player.image
      };
      
      if (player.image) {
        hasImageCount++;
        
// Extract filename
        const filename = player.image.replace('/images/players/', '');
        const fullPath = path.join(imageDir, filename);
        
// Check file existence
        if (fs.existsSync(fullPath)) {
          const stats = fs.statSync(fullPath);
          status.fileSize = Math.round(stats.size / 1024) + ' KB';
status.status = '✅ valid';
          validImages.push(status);
          validImageCount++;
          console.log(`✅ ${player.name} -> ${filename} (${status.fileSize})`);
        } else {
status.status = '❌ file missing';
          invalidImages.push(status);
          invalidImageCount++;
console.log(`❌ ${player.name} -> ${filename} (file missing)`);
        }
      } else {
status.status = '⚠️ no image URL';
        missingImages.push(status);
        missingImageCount++;
console.log(`⚠️ ${player.name} -> no image URL`);
      }
    }
    
// Summary
console.log(`\n========== Validation Summary ==========`);
console.log(`Total players: ${players.length}`);
console.log(`With image URL: ${hasImageCount}`);
console.log(`Valid images: ${validImageCount}`);
console.log(`Invalid images: ${invalidImageCount}`);
console.log(`Missing images: ${missingImageCount}`);
console.log(`Coverage: ${Math.round((validImageCount / players.length) * 100)}%`);
    
    // Detailed listings
    if (invalidImages.length > 0) {
      console.log(`\n========== Invalid image list ==========`);
      invalidImages.forEach(img => {
        console.log(`${img.name} (${img.team}, #${img.number}): ${img.imageUrl}`);
      });
    }
    
    if (missingImages.length > 0) {
      console.log(`\n========== Missing image list ==========`);
      missingImages.forEach(img => {
        console.log(`${img.name} (${img.team}, #${img.number})`);
      });
    }
    
    // Save report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalPlayers: players.length,
        hasImageUrl: hasImageCount,
        validImages: validImageCount,
        invalidImages: invalidImageCount,
        missingImages: missingImageCount,
        completionRate: Math.round((validImageCount / players.length) * 100)
      },
      validImages,
      invalidImages,
      missingImages
    };
    
    const reportPath = path.join(__dirname, '..', 'image_verification_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\nVerification report saved: ${reportPath}`);
    
  } catch (error) {
    console.error('Image verification failed:', error);
  }
}

// Main entry
async function main() {
  await connectDB();
  await verifyImages();
  mongoose.connection.close();
  console.log('\nScript finished');
}

// Run script
main(); 