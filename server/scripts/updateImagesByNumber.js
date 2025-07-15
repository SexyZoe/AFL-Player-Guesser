const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Player = require('../models/Player');
const fs = require('fs');
const path = require('path');

// 加载环境变量
dotenv.config();

// 连接到MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB 连接成功');
  } catch (error) {
    console.error('MongoDB 连接失败:', error);
    process.exit(1);
  }
}

// 根据球员号码更新图片URL
async function updateImagesByNumber() {
  try {
    const players = await Player.find({});
    const imageDir = path.join(__dirname, '..', 'public', 'images', 'players');
    
    console.log(`找到 ${players.length} 名球员`);
    console.log(`图片目录: ${imageDir}`);
    
    // 获取所有图片文件
    const imageFiles = fs.readdirSync(imageDir).filter(file => 
      file.endsWith('.webp') || file.endsWith('.jpg') || file.endsWith('.png')
    );
    
    console.log(`找到 ${imageFiles.length} 个图片文件`);
    
    let matchedCount = 0;
    let unmatchedPlayers = [];
    
    // 按球队分组处理（因为不同球队可能有相同号码）
    const playersByTeam = {};
    players.forEach(player => {
      const teamKey = player.team || 'unknown';
      if (!playersByTeam[teamKey]) {
        playersByTeam[teamKey] = [];
      }
      playersByTeam[teamKey].push(player);
    });
    
    console.log(`\n按球队分组处理:`);
    
    for (const [team, teamPlayers] of Object.entries(playersByTeam)) {
      console.log(`\n处理球队: ${team} (${teamPlayers.length} 名球员)`);
      
      for (const player of teamPlayers) {
        if (!player.number) {
          console.log(`❌ ${player.name} -> 没有号码`);
          unmatchedPlayers.push({
            name: player.name,
            team: player.team,
            reason: '没有号码'
          });
          continue;
        }
        
        // 尝试匹配不同的文件名格式
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
          console.log(`❌ ${player.name} (#${player.number}) -> 未找到匹配的图片`);
        }
      }
    }
    
    console.log(`\n匹配结果:`);
    console.log(`成功匹配: ${matchedCount}/${players.length}`);
    console.log(`未匹配: ${unmatchedPlayers.length}`);
    
    if (unmatchedPlayers.length > 0) {
      console.log(`\n未匹配的球员及其可能的文件名:`);
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
    console.error('更新图片失败:', error);
  }
}

// 主函数
async function main() {
  await connectDB();
  await updateImagesByNumber();
  mongoose.connection.close();
  console.log('\n脚本执行完成');
}

// 运行脚本
main(); 