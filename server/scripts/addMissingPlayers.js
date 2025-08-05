const fs = require('fs');
const path = require('path');

// 基于球员数据生成图片文件名的函数
function generateImageFileName(player) {
  // 可以基于多种策略生成文件名：
  // 1. 使用球队+姓名+号码组合生成唯一ID
  // 2. 使用现有的ID格式
  // 3. 或者用户指定的文件名
  
  // 这里使用一个简单的策略：球队简称_姓名_号码
  const teamShort = player.team.replace(/\s+/g, '').toLowerCase();
  const nameShort = player.name.replace(/[^a-zA-Z]/g, '').toLowerCase();
  
  return `${teamShort}_${nameShort}_${player.number}.webp`;
}

// 生成类似现有格式的ID
function generatePlayerId(player, index = 0) {
  // 使用类似现有ID的格式：6831a9ec2753892f14822XXX
  const baseId = '6831a9ec2753892f148229';
  const suffix = (50 + index).toString(16).padStart(2, '0'); // 从50开始递增
  return baseId + suffix;
}

// 添加缺失的球员数据
function addMissingPlayers(missingPlayersData) {
  console.log(`开始添加 ${missingPlayersData.length} 名缺失球员...\n`);
  
  // 读取现有的CSV文件
  const csvPath = path.join(__dirname, '..', 'player_image_mapping.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const csvLines = csvContent.split('\n');
  
  // 读取players.json
  const playersPath = path.join(__dirname, '..', 'data', 'players.json');
  const playersData = JSON.parse(fs.readFileSync(playersPath, 'utf-8'));
  
  let addedCount = 0;
  const newCsvLines = [];
  
  missingPlayersData.forEach((newPlayer, index) => {
    // 生成图片文件名和ID
    const imageFileName = generateImageFileName(newPlayer);
    const playerId = generatePlayerId(newPlayer, index);
    
    // 创建CSV行
    const csvLine = `${playerId},${newPlayer.name},${newPlayer.team},${newPlayer.number},${imageFileName}`;
    newCsvLines.push(csvLine);
    
    // 在players.json中找到对应的球员并更新图片路径
    const foundPlayer = playersData.find(p => 
      p.name === newPlayer.name && 
      p.team === newPlayer.team && 
      p.number === newPlayer.number
    );
    
    if (foundPlayer) {
      foundPlayer.image = `/images/players/${newPlayer.team}/${imageFileName}`;
      console.log(`✅ 添加: ${newPlayer.team} - ${newPlayer.name} (#${newPlayer.number})`);
      console.log(`   图片文件: ${imageFileName}`);
      console.log(`   图片路径: ${foundPlayer.image}`);
      addedCount++;
    } else {
      console.log(`❌ 在players.json中未找到: ${newPlayer.name}`);
    }
  });
  
  // 更新CSV文件
  const updatedCsvContent = csvLines.concat(newCsvLines).join('\n');
  const csvBackupPath = csvPath + '.backup.' + Date.now();
  fs.copyFileSync(csvPath, csvBackupPath);
  fs.writeFileSync(csvPath, updatedCsvContent);
  
  // 更新players.json文件
  const playersBackupPath = playersPath + '.backup.' + Date.now();
  fs.copyFileSync(playersPath, playersBackupPath);
  fs.writeFileSync(playersPath, JSON.stringify(playersData, null, 2));
  
  console.log(`\n=== 添加完成 ===`);
  console.log(`成功添加: ${addedCount} 名球员`);
  console.log(`CSV备份: ${csvBackupPath.split('/').pop()}`);
  console.log(`JSON备份: ${playersBackupPath.split('/').pop()}`);
  
  console.log(`\n💡 下一步：`);
  console.log(`1. 需要为这些球员准备实际的图片文件：`);
  newCsvLines.forEach((line, index) => {
    const parts = line.split(',');
    const fileName = parts[4];
    const team = parts[2];
    console.log(`   - server/public/images/players/${team}/${fileName}`);
  });
  console.log(`2. 或者暂时使用默认图片占位`);
  console.log(`3. 重启服务器使更改生效`);
}

// 示例用法函数
function addSinglePlayer(playerData) {
  return addMissingPlayers([playerData]);
}

// 如果直接运行脚本，使用示例数据
if (require.main === module) {
  // 示例：添加用户提供的 Maric, Ryan R
  const examplePlayer = {
    "number": 23,
    "name": "Maric, Ryan R",
    "games": 39,
    "age": "20yr 8mth",
    "date_of_birth": "2004-09-06",
    "height_cm": 196,
    "weight_kg": 93,
    "origin": "Gippsland Power",
    "position": "Midfield, Forward",
    "team": "West Coast Eagles"
  };
  
  console.log('示例：添加单个球员...');
  try {
    addSinglePlayer(examplePlayer);
  } catch (error) {
    console.error('❌ 添加失败:', error);
    process.exit(1);
  }
}

module.exports = { addMissingPlayers, addSinglePlayer };