const fs = require('fs');
const path = require('path');

// 创建.env文件
function createEnvFile() {
  const envPath = path.join(__dirname, '..', '.env');
  const envContent = `PORT=5000
MONGODB_URI=mongodb://localhost:27017/afl-player-guesser`;

  try {
    fs.writeFileSync(envPath, envContent);
    console.log('已创建.env文件');
  } catch (error) {
    console.error('创建.env文件失败:', error);
  }
}

// 主函数
function setup() {
  console.log('正在设置AFL球员猜谜游戏的MongoDB...');
  
  // 检查并创建.env文件
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    createEnvFile();
  } else {
    console.log('.env文件已存在');
  }
  
  console.log('\n===== 设置完成 =====');
  console.log('请按照以下步骤操作:');
  console.log('1. 确保MongoDB已安装并运行在localhost:27017');
  console.log('   - 如果没有安装，请访问: https://www.mongodb.com/try/download/community');
  console.log('   - 或使用Docker: docker run -d -p 27017:27017 --name mongodb mongo');
  console.log('2. 运行导入命令将球员数据导入MongoDB:');
  console.log('   npm run import-players');
  console.log('3. 启动服务器:');
  console.log('   npm run dev');
}

// 运行设置
setup(); 