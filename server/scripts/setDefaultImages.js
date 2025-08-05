const fs = require('fs');
const path = require('path');

// 为缺失图片的球员设置默认图片
function setDefaultImages() {
  console.log('为缺失图片的球员设置默认图片...\n');
  
  // 读取players.json
  const playersPath = path.join(__dirname, '..', 'data', 'players.json');
  const playersData = JSON.parse(fs.readFileSync(playersPath, 'utf-8'));
  
  // 默认图片路径（可以是一个通用的头像图片）
  const defaultImagePath = '/images/players/default-player.webp';
  
  let fixedCount = 0;
  let missingPlayers = [];
  
  playersData.forEach(player => {
    if (!player.image) {
      // 设置默认图片
      player.image = defaultImagePath;
      
      missingPlayers.push({
        name: player.name,
        team: player.team,
        number: player.number
      });
      
      console.log(`✅ 设置默认图片: ${player.team} - ${player.name} (#${player.number})`);
      fixedCount++;
    }
  });
  
  // 创建备份并保存
  const backupPath = playersPath + '.backup.default.' + Date.now();
  fs.copyFileSync(playersPath, backupPath);
  
  fs.writeFileSync(playersPath, JSON.stringify(playersData, null, 2));
  
  console.log(`\n=== 默认图片设置完成 ===`);
  console.log(`设置默认图片: ${fixedCount} 名球员`);
  console.log(`备份文件: ${backupPath.split('/').pop()}`);
  
  if (fixedCount > 0) {
    console.log(`\n=== 需要默认图片的球员 ===`);
    const byTeam = {};
    missingPlayers.forEach(player => {
      if (!byTeam[player.team]) {
        byTeam[player.team] = [];
      }
      byTeam[player.team].push(player);
    });
    
    Object.keys(byTeam).sort().forEach(team => {
      const players = byTeam[team];
      console.log(`\n${team} (${players.length}名):`);
      players.forEach((player, index) => {
        console.log(`  ${index + 1}. ${player.name} (#${player.number})`);
      });
    });
    
    console.log(`\n💡 建议：`);
    console.log(`1. 在 server/public/images/players/ 目录下放置一个 default-player.webp 文件作为默认头像`);
    console.log(`2. 或者为这些球员单独寻找并添加图片文件`);
    console.log(`3. 现在所有球员都有图片路径，前端应该能正常显示（使用默认图片）`);
  }
  
  console.log(`\n🎉 所有球员现在都有图片路径了！`);
}

// 运行脚本
if (require.main === module) {
  try {
    setDefaultImages();
  } catch (error) {
    console.error('❌ 设置默认图片失败:', error);
    process.exit(1);
  }
}