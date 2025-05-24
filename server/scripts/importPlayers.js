const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// 导入球员模型
const Player = require('../models/Player');

// 检查MongoDB连接URI
if (!process.env.MONGODB_URI) {
  console.error('错误: 请在.env文件中设置MONGODB_URI环境变量');
  process.exit(1);
}

// 连接到MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('已连接到MongoDB'))
  .catch(err => {
    console.error('MongoDB连接失败:', err);
    process.exit(1);
  });

// 读取数据目录
const dataDir = path.join(__dirname, '..', 'data');
const files = fs.readdirSync(dataDir).filter(file => file.endsWith('_player_with_team.json'));

// 导入所有球队的球员数据
async function importPlayers() {
  try {
    // 清空现有球员集合
    await Player.deleteMany({});
    console.log('已清空现有球员数据');

    let totalPlayers = 0;

    // 处理每个球队文件
    for (const file of files) {
      const filePath = path.join(dataDir, file);
      const teamData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      console.log(`正在导入 ${file}，包含 ${teamData.length} 名球员`);
      
      // 批量插入每个球队的球员数据
      await Player.insertMany(teamData);
      
      totalPlayers += teamData.length;
    }

    console.log(`成功导入 ${totalPlayers} 名球员数据，共 ${files.length} 支球队`);

    // 创建索引
    await Player.collection.createIndex({ name: 1 });
    await Player.collection.createIndex({ team: 1 });
    console.log('已创建索引');

    // 生成合并后的players.json文件（供现有代码使用）
    const allPlayers = await Player.find({}).lean();
    fs.writeFileSync(
      path.join(dataDir, 'players.json'), 
      JSON.stringify(allPlayers, null, 2)
    );
    console.log('已生成合并后的players.json文件');

    mongoose.connection.close();
    console.log('数据库连接已关闭');
  } catch (error) {
    console.error('导入数据时出错:', error);
    mongoose.connection.close();
    process.exit(1);
  }
}

// 运行导入脚本
importPlayers(); 