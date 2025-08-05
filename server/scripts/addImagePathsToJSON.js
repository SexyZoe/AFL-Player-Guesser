const fs = require('fs');
const path = require('path');

// 读取CSV映射文件
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

// 更新players.json文件
function updatePlayersJSON() {
  console.log('开始更新players.json文件...\n');
  
  // 读取现有的players.json文件
  const playersPath = path.join(__dirname, '..', 'data', 'players.json');
  const playersData = JSON.parse(fs.readFileSync(playersPath, 'utf-8'));
  
  console.log(`读取到 ${playersData.length} 名球员数据`);
  
  // 获取图片映射
  const imageMapping = getImageMapping();
  
  let updatedCount = 0;
  let notFoundCount = 0;
  
  // 为每个球员添加image字段
  playersData.forEach(player => {
    const possibleKeys = [
      `${player.team}|${player.name}`,
      `${player.team}|${player.name.replace(' ', ', ')}`,
      `${player.team}|${player.name.replace(', ', ' ')}`
    ];
    
    let imageUrl = null;
    
    for (const key of possibleKeys) {
      if (imageMapping.has(key)) {
        imageUrl = imageMapping.get(key);
        break;
      }
    }
    
    if (imageUrl) {
      player.image = imageUrl;
      console.log(`✅ ${player.team} - ${player.name}`);
      console.log(`   图片路径: ${imageUrl}`);
      updatedCount++;
    } else {
      console.log(`❌ 未找到映射: ${player.team} - ${player.name}`);
      notFoundCount++;
    }
  });
  
  // 创建备份
  const backupPath = playersPath + '.backup.' + Date.now();
  fs.copyFileSync(playersPath, backupPath);
  console.log(`\n已创建备份: ${backupPath}`);
  
  // 保存更新后的数据
  fs.writeFileSync(playersPath, JSON.stringify(playersData, null, 2));
  
  console.log(`\n=== 更新完成 ===`);
  console.log(`成功更新: ${updatedCount}`);
  console.log(`未找到: ${notFoundCount}`);
  console.log(`总计: ${updatedCount + notFoundCount}`);
  console.log(`\n✅ players.json文件已更新！`);
  console.log('重启服务器后图片应该可以正常显示了。');
}

// 运行脚本
if (require.main === module) {
  try {
    updatePlayersJSON();
  } catch (error) {
    console.error('❌ 更新失败:', error);
    process.exit(1);
  }
}