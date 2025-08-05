const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Player = require('../models/Player');

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// 检查MongoDB连接URI
if (!process.env.MONGODB_URI) {
  console.error('错误: 请在.env文件中设置MONGODB_URI环境变量');
  process.exit(1);
}

// MongoDB连接
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB连接成功');
  } catch (error) {
    console.error('MongoDB连接失败:', error);
    process.exit(1);
  }
}

// 读取CSV文件获取正确的图片映射
function getImageMapping() {
  const csvPath = path.join(__dirname, '..', 'player_image_mapping.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').slice(1); // 跳过表头
  
  const mapping = new Map();
  
  lines.forEach(line => {
    if (line.trim()) {
      const parts = line.split(',');
      if (parts.length >= 5) {
        const name = parts[1].trim().replace(/"/g, '');
        const team = parts[2].trim().replace(/"/g, '');
        const imageFileName = parts[4].trim().replace(/"/g, '');
        
        // 创建多种可能的键格式进行匹配
        const keys = [
          `${team}|${name}`,
          `${team}|${name.replace(' ', ', ')}`,
          `${team}|${name.replace(', ', ' ')}`
        ];
        
        keys.forEach(key => {
          mapping.set(key, `/images/players/${team}/${imageFileName}`);
        });
      }
    }
  });
  
  console.log(`加载了 ${mapping.size} 条图片映射`);
  return mapping;
}

// 更新数据库中的图片路径
async function updateImagePaths() {
  console.log('开始更新球员图片路径...\n');
  
  const imageMapping = getImageMapping();
  const players = await Player.find({});
  
  console.log(`找到 ${players.length} 名球员`);
  
  let updatedCount = 0;
  let notFoundCount = 0;
  
  for (const player of players) {
    const possibleKeys = [
      `${player.team}|${player.name}`,
      `${player.team}|${player.name.replace(' ', ', ')}`,
      `${player.team}|${player.name.replace(', ', ' ')}`
    ];
    
    let newImageUrl = null;
    
    for (const key of possibleKeys) {
      if (imageMapping.has(key)) {
        newImageUrl = imageMapping.get(key);
        break;
      }
    }
    
    if (newImageUrl) {
      await Player.findByIdAndUpdate(player._id, {
        image: newImageUrl
      });
      
      console.log(`✅ ${player.team} - ${player.name}`);
      console.log(`   更新图片路径: ${newImageUrl}`);
      updatedCount++;
    } else {
      console.log(`❌ 未找到映射: ${player.team} - ${player.name}`);
      notFoundCount++;
    }
  }
  
  console.log(`\n=== 更新完成 ===`);
  console.log(`成功更新: ${updatedCount}`);
  console.log(`未找到: ${notFoundCount}`);
  console.log(`总计: ${updatedCount + notFoundCount}`);
}

// 主函数
async function main() {
  try {
    await connectDB();
    await updateImagePaths();
    await mongoose.disconnect();
    console.log('\n🎉 图片路径更新完成！');
  } catch (error) {
    console.error('❌ 更新失败:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}