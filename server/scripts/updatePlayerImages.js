const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Player = require('../models/Player');

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

// 更新球员图片URL
async function updatePlayerImages() {
  try {
    // 获取所有球员
    const players = await Player.find({});
    console.log(`找到 ${players.length} 名球员`);

    // 更新每个球员的图片URL
    for (const player of players) {
      const imageUrl = `/images/players/${player._id}.webp`;
      
      await Player.findByIdAndUpdate(player._id, {
        image: imageUrl
      });
      
      console.log(`更新球员 ${player.name} 的图片URL: ${imageUrl}`);
    }

    console.log('所有球员图片URL更新完成');
  } catch (error) {
    console.error('更新图片URL失败:', error);
  }
}

// 主函数
async function main() {
  await connectDB();
  await updatePlayerImages();
  mongoose.connection.close();
  console.log('脚本执行完成');
}

// 运行脚本
main(); 