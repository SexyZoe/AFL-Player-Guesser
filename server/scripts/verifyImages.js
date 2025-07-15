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

// 验证图片文件是否存在
async function verifyImages() {
  try {
    const players = await Player.find({});
    const imageDir = path.join(__dirname, '..', 'public', 'images', 'players');
    
    console.log(`验证 ${players.length} 名球员的图片`);
    console.log(`图片目录: ${imageDir}\n`);
    
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
        
        // 提取文件名
        const filename = player.image.replace('/images/players/', '');
        const fullPath = path.join(imageDir, filename);
        
        // 检查文件是否存在
        if (fs.existsSync(fullPath)) {
          const stats = fs.statSync(fullPath);
          status.fileSize = Math.round(stats.size / 1024) + ' KB';
          status.status = '✅ 有效';
          validImages.push(status);
          validImageCount++;
          console.log(`✅ ${player.name} -> ${filename} (${status.fileSize})`);
        } else {
          status.status = '❌ 文件不存在';
          invalidImages.push(status);
          invalidImageCount++;
          console.log(`❌ ${player.name} -> ${filename} (文件不存在)`);
        }
      } else {
        status.status = '⚠️ 没有图片URL';
        missingImages.push(status);
        missingImageCount++;
        console.log(`⚠️ ${player.name} -> 没有图片URL`);
      }
    }
    
    // 统计结果
    console.log(`\n========== 验证结果 ==========`);
    console.log(`总球员数: ${players.length}`);
    console.log(`有图片URL: ${hasImageCount}`);
    console.log(`有效图片: ${validImageCount}`);
    console.log(`无效图片: ${invalidImageCount}`);
    console.log(`缺少图片: ${missingImageCount}`);
    console.log(`完整率: ${Math.round((validImageCount / players.length) * 100)}%`);
    
    // 显示详细信息
    if (invalidImages.length > 0) {
      console.log(`\n========== 无效图片列表 ==========`);
      invalidImages.forEach(img => {
        console.log(`${img.name} (${img.team}, #${img.number}): ${img.imageUrl}`);
      });
    }
    
    if (missingImages.length > 0) {
      console.log(`\n========== 缺少图片列表 ==========`);
      missingImages.forEach(img => {
        console.log(`${img.name} (${img.team}, #${img.number})`);
      });
    }
    
    // 保存报告
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
    
    console.log(`\n验证报告已保存: ${reportPath}`);
    
  } catch (error) {
    console.error('验证图片失败:', error);
  }
}

// 主函数
async function main() {
  await connectDB();
  await verifyImages();
  mongoose.connection.close();
  console.log('\n脚本执行完成');
}

// 运行脚本
main(); 