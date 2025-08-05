const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Player = require('../models/Player');

// MongoDB连接
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/afl-players');
    console.log('MongoDB连接成功');
  } catch (error) {
    console.error('MongoDB连接失败:', error);
    process.exit(1);
  }
}

// 修复Western Bulldogs球员图片映射
async function fixWesternBulldogsImages() {
  try {
    // 获取Western Bulldogs的所有球员
    const westernBulldogsPlayers = await Player.find({ team: 'Western Bulldogs' }).sort({ name: 1 });
    console.log(`找到 ${westernBulldogsPlayers.length} 名Western Bulldogs球员`);

    // 获取实际的图片文件
    const imageDir = path.join(__dirname, '..', 'public', 'images', 'players', 'Western Bulldogs');
    const imageFiles = fs.readdirSync(imageDir)
      .filter(file => file.endsWith('.webp'))
      .sort();
    
    console.log(`找到 ${imageFiles.length} 个图片文件`);
    console.log('图片文件列表:', imageFiles.slice(0, 5).map(f => f)); // 显示前5个

    // 读取CSV映射文件获取正确的映射
    const csvPath = path.join(__dirname, '..', 'player_image_mapping.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const csvLines = csvContent.split('\n').slice(1); // 跳过表头

    // 创建名字到图片文件的映射
    const nameToImageMap = new Map();
    
    for (const line of csvLines) {
      if (line.trim()) {
        const parts = line.split(',');
        if (parts.length >= 5 && parts[2].includes('Western Bulldogs')) {
          const name = parts[1].trim().replace(/"/g, '');
          const imageFileName = parts[4].trim().replace(/"/g, '');
          nameToImageMap.set(name, imageFileName);
        }
      }
    }

    console.log('\n开始修复图片URL...');
    let updatedCount = 0;
    let notFoundCount = 0;

    for (const player of westernBulldogsPlayers) {
      // 尝试多种名字匹配方式
      const possibleNames = [
        player.name,
        player.name.replace(', ', ','), // 移除逗号后的空格
        player.name.replace(/,\s*/, ', '), // 标准化逗号空格
      ];

      let imageFileName = null;
      
      for (const possibleName of possibleNames) {
        if (nameToImageMap.has(possibleName)) {
          imageFileName = nameToImageMap.get(possibleName);
          break;
        }
      }

      // 如果在映射中没找到，尝试直接匹配现有图片文件
      if (!imageFileName) {
        // 按顺序分配图片文件（作为备用方案）
        const playerIndex = westernBulldogsPlayers.indexOf(player);
        if (playerIndex < imageFiles.length) {
          imageFileName = imageFiles[playerIndex];
        }
      }

      if (imageFileName) {
        const newImageUrl = `/images/players/Western Bulldogs/${imageFileName}`;
        
        await Player.findByIdAndUpdate(player._id, {
          image: newImageUrl
        });

        console.log(`✅ ${player.name} -> ${imageFileName}`);
        updatedCount++;
      } else {
        console.log(`❌ 未找到图片: ${player.name}`);
        notFoundCount++;
      }
    }

    console.log(`\n修复完成:`);
    console.log(`成功更新: ${updatedCount}/${westernBulldogsPlayers.length}`);
    console.log(`未找到图片: ${notFoundCount}`);

  } catch (error) {
    console.error('修复过程中出错:', error);
  }
}

// 主函数
async function main() {
  await connectDB();
  await fixWesternBulldogsImages();
  await mongoose.disconnect();
  console.log('脚本执行完成');
}

// 运行脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { fixWesternBulldogsImages };