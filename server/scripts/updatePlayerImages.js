const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Player = require('../models/Player');

// Load environment variables
dotenv.config();

// Team name mapping (DB name -> folder name)
const teamNameMapping = {
  'Adelaide Crows': 'Adelaide Crows',
  'Brisbane Lions': 'Brisbane Lions',
  'Carlton Blues': 'Carlton',
  'Collingwood Magpies': 'Collingwood',
  'Essendon Bombers': 'Essendon',
  'Fremantle Dockers': 'Fremantle',
  'Geelong Cats': 'Geelong Cats',
  'Gold Coast Suns': 'Gold Coast Suns',
  'GWS Giants': 'GWS Giants',
  'Hawthorn Hawks': 'Hawthorn',
  'Melbourne Demons': 'Melbourne',
  'North Melbourne Kangaroos': 'North Melbourne',
  'Port Adelaide Power': 'Port Adelaide',
  'Richmond Tigers': 'Richmond',
  'St Kilda Saints': 'St Kilda',
  'Sydney Swans': 'Sydney Swans',
  'Western Bulldogs': 'Western Bulldogs',
  'West Coast Eagles': 'West Coast Eagles'
};

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

// Update player image URLs
async function updatePlayerImages() {
  try {
    // Fetch all players
    const players = await Player.find({});
    console.log(`Found ${players.length} players`);

    // Update each player's image URL
    for (const player of players) {
      // Determine the mapped folder name
      const folderName = teamNameMapping[player.team] || player.team;
      
      // Normalize image URL using mapped folder
      const imageUrl = `/images/players/${folderName}/${player._id}.webp`;
      
      await Player.findByIdAndUpdate(player._id, {
        image: imageUrl
      });
      
      console.log(`Updated image URL for ${player.name}: ${imageUrl}`);
    }

    console.log('All player image URLs updated');
  } catch (error) {
    console.error('Failed to update image URLs:', error);
  }
}

// Main entry
async function main() {
  await connectDB();
  await updatePlayerImages();
  mongoose.connection.close();
  console.log('Script finished');
}

// Run script
main(); 