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
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('MongoDB 连接成功');
      return true;
    } else {
      console.log('未配置MONGODB_URI，将使用本地JSON文件');
      return false;
    }
  } catch (error) {
    console.error('MongoDB 连接失败:', error);
    console.log('将使用本地JSON文件作为备用方案');
    return false;
  }
}

// 从本地JSON文件读取球员数据
function loadPlayersFromJSON() {
  const playersDataPath = path.join(__dirname, '..', 'data', 'players.json');
  if (fs.existsSync(playersDataPath)) {
    try {
      const playersJson = fs.readFileSync(playersDataPath, 'utf8');
      const players = JSON.parse(playersJson);
      console.log(`成功从JSON文件加载 ${players.length} 名球员数据`);
      return players;
    } catch (error) {
      console.error('加载球员数据失败:', error);
      return [];
    }
  } else {
    console.log('球员数据文件不存在，请先运行导入脚本');
    return [];
  }
}

// 列出所有球员的ID和名字
async function listPlayerIds(useDatabase = true) {
  try {
    let players;
    
    if (useDatabase) {
      // 从数据库获取球员数据
      players = await Player.find({}).sort({ team: 1, name: 1 });
      console.log(`找到 ${players.length} 名球员\n`);
    } else {
      // 从本地JSON文件获取球员数据
      players = loadPlayersFromJSON();
      if (players.length === 0) {
        console.log('没有找到球员数据');
        return;
      }
      // 按球队和名字排序
      players.sort((a, b) => {
        if (a.team !== b.team) {
          return a.team.localeCompare(b.team);
        }
        return a.name.localeCompare(b.name);
      });
      console.log(`找到 ${players.length} 名球员\n`);
    }

    // 创建映射文件
    const playerMapping = [];
    const csvContent = ['ID,Name,Team,Number,ImageFileName'];

    console.log('球员列表：');
    console.log('====================================');
    
    for (const player of players) {
      const playerId = useDatabase ? player._id.toString() : (player._id || player.id || `player_${players.indexOf(player) + 1}`);
      const info = {
        id: playerId,
        name: player.name,
        team: player.team,
        number: player.number || player.no,
        imageFileName: `${playerId}.webp`
      };
      
      playerMapping.push(info);
      csvContent.push(`${info.id},${info.name},${info.team},${info.number},${info.imageFileName}`);
      
      console.log(`ID: ${info.id} | ${info.name} | ${info.team} | #${info.number}`);
      console.log(`图片文件名: ${info.imageFileName}`);
      console.log('------------------------------------');
    }

    // 保存到CSV文件
    const csvPath = path.join(__dirname, '..', 'player_image_mapping.csv');
    fs.writeFileSync(csvPath, csvContent.join('\n'));
    
    // 保存到JSON文件
    const jsonPath = path.join(__dirname, '..', 'player_image_mapping.json');
    fs.writeFileSync(jsonPath, JSON.stringify(playerMapping, null, 2));
    
    console.log(`\n映射文件已保存:`);
    console.log(`CSV: ${csvPath}`);
    console.log(`JSON: ${jsonPath}`);
    
    return playerMapping;
  } catch (error) {
    console.error('获取球员列表失败:', error);
  }
}

// 主函数
async function main() {
  const useDatabase = await connectDB();
  await listPlayerIds(useDatabase);
  
  if (useDatabase) {
    mongoose.connection.close();
  }
  console.log('\n脚本执行完成');
}

// 运行脚本
main(); 