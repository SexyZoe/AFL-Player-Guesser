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

// Update image URLs by player number
async function updateImagesByNumber() {
  try {
    const players = await Player.find({});
    const imageDir = path.join(__dirname, '..', 'public', 'images', 'players');
    
    console.log(`Found ${players.length} players`);
    console.log(`Images dir: ${imageDir}`);
    
    // Read all image files
    const imageFiles = fs.readdirSync(imageDir).filter(file => 
      file.endsWith('.webp') || file.endsWith('.jpg') || file.endsWith('.png')
    );
    
    console.log(`Found ${imageFiles.length} image files`);
    
    let matchedCount = 0;
    let unmatchedPlayers = [];
    
    // Group by team (different teams may have same numbers)
    const playersByTeam = {};
    players.forEach(player => {
      const teamKey = player.team || 'unknown';
      if (!playersByTeam[teamKey]) {
        playersByTeam[teamKey] = [];
      }
      playersByTeam[teamKey].push(player);
    });
    
    console.log(`\nProcessing by team:`);
    
    for (const [team, teamPlayers] of Object.entries(playersByTeam)) {
      console.log(`\nTeam: ${team} (${teamPlayers.length} players)`);
      
      for (const player of teamPlayers) {
        if (!player.number) {
          console.log(`❌ ${player.name} -> no number`);
          unmatchedPlayers.push({
            name: player.name,
            team: player.team,
            reason: 'no number'
          });
          continue;
        }
        
        // Try multiple filename patterns
        const teamShort = team.replace(/\s+/g, '').toLowerCase();
        const possibleNames = [
          `${player.number}.webp`,
          `${player.number}.jpg`,
          `${player.number}.png`,
          `${teamShort}_${player.number}.webp`,
          `${team.replace(/\s+/g, '_')}_${player.number}.webp`,
          `${team.split(' ')[0]}_${player.number}.webp`
        ];
        
        let matchedFile = null;
        
        for (const possibleName of possibleNames) {
          if (imageFiles.includes(possibleName)) {
            matchedFile = possibleName;
            break;
          }
        }
        
        if (matchedFile) {
          const imageUrl = `/images/players/${matchedFile}`;
          
          await Player.findByIdAndUpdate(player._id, {
            image: imageUrl
          });
          
          console.log(`✅ ${player.name} (#${player.number}) -> ${matchedFile}`);
          matchedCount++;
        } else {
          unmatchedPlayers.push({
            name: player.name,
            team: player.team,
            number: player.number,
            possibleNames: possibleNames
          });
          console.log(`❌ ${player.name} (#${player.number}) -> no matching image found`);
        }
      }
    }
    
    console.log(`\nMatch results:`);
    console.log(`Matched: ${matchedCount}/${players.length}`);
    console.log(`Unmatched: ${unmatchedPlayers.length}`);
    
    if (unmatchedPlayers.length > 0) {
      console.log(`\nUnmatched players and possible filenames:`);
      unmatchedPlayers.forEach(player => {
        console.log(`${player.name} (${player.team || 'Unknown'}, #${player.number || 'N/A'}):`);
        if (player.possibleNames) {
          player.possibleNames.forEach(name => {
            console.log(`  - ${name}`);
          });
        } else {
          console.log(`  - ${player.reason}`);
        }
      });
    }
    
  } catch (error) {
    console.error('Failed to update images:', error);
  }
}

// Main entry
async function main() {
  await connectDB();
  await updateImagesByNumber();
  mongoose.connection.close();
  console.log('\nScript finished');
}

// Run script
main(); 