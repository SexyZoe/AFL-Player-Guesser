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

// 标准化文件名（移除特殊字符，转换为小写）
function normalizeFileName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')  // 替换非字母数字字符为下划线
    .replace(/_+/g, '_')         // 合并多个下划线
    .replace(/^_|_$/g, '');      // 移除开头和结尾的下划线
}

// 根据球员名字更新图片URL
async function updateImagesByName() {
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
    
    for (const player of players) {
      const normalizedName = normalizeFileName(player.name);
      
      // 尝试匹配不同的文件名格式
      const possibleNames = [
        `${normalizedName}.webp`,
        `${normalizedName}.jpg`,
        `${normalizedName}.png`,
        `${player.name.replace(/\s+/g, '_')}.webp`,
        `${player.name.replace(/\s+/g, '-')}.webp`,
        `${player.name.replace(/\s+/g, '').toLowerCase()}.webp`
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
        
        console.log(`✅ ${player.name} -> ${matchedFile}`);
        matchedCount++;
      } else {
        unmatchedPlayers.push({
          name: player.name,
          normalizedName: normalizedName,
          possibleNames: possibleNames
        });
        console.log(`❌ ${player.name} -> 未找到匹配的图片`);
      }
    }
    
    console.log(`\n匹配结果:`);
    console.log(`成功匹配: ${matchedCount}/${players.length}`);
    console.log(`未匹配: ${unmatchedPlayers.length}`);
    
    if (unmatchedPlayers.length > 0) {
      console.log(`\n未匹配的球员及其可能的文件名:`);
      unmatchedPlayers.forEach(player => {
        console.log(`${player.name}:`);
        player.possibleNames.forEach(name => {
          console.log(`  - ${name}`);
        });
      });
    }
    
  } catch (error) {
    console.error('更新图片失败:', error);
  }
}

// 主函数
async function main() {
  await connectDB();
  await updateImagesByName();
  mongoose.connection.close();
  console.log('\n脚本执行完成');
}

// 运行脚本
main(); 