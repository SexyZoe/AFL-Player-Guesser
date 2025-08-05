const fs = require('fs');
const path = require('path');

// 球队名称映射：JSON中的名称 -> 实际文件夹名称
const teamFolderMapping = {
  'Adelaide Crows': 'Adelaide Crows',
  'Brisbane Lions': 'Brisbane Lions',
  'Carlton Blues': 'Carlton',  // 可能不匹配
  'Collingwood Magpies': 'Collingwood',  // 可能不匹配
  'Essendon Bombers': 'Essendon',  // 可能不匹配
  'Fremantle Dockers': 'Fremantle',  // 可能不匹配
  'Geelong Cats': 'Geelong Cats',
  'Gold Coast Suns': 'Gold Coast Suns',
  'GWS Giants': 'GWS Giants',
  'Hawthorn Hawks': 'Hawthorn',  // 可能不匹配
  'Melbourne Demons': 'Melbourne',  // 可能不匹配
  'North Melbourne Kangaroos': 'North Melbourne',  // 确认不匹配
  'Port Adelaide Power': 'Port Adelaide',  // 可能不匹配
  'Richmond Tigers': 'Richmond',  // 可能不匹配
  'St Kilda Saints': 'St Kilda',  // 可能不匹配
  'Sydney Swans': 'Sydney Swans',
  'West Coast Eagles': 'West Coast Eagles',
  'Western Bulldogs': 'Western Bulldogs'
};

// 检查并修复球队文件夹路径
function fixTeamFolderPaths() {
  console.log('===== 球队文件夹路径检查和修复 =====\n');
  
  // 1. 首先验证实际文件夹名称
  const playersDir = path.join(__dirname, '..', 'public', 'images', 'players');
  const actualFolders = fs.readdirSync(playersDir).filter(item => {
    const itemPath = path.join(playersDir, item);
    return fs.statSync(itemPath).isDirectory();
  });
  
  console.log('实际文件夹列表：');
  actualFolders.forEach(folder => console.log(`  - ${folder}`));
  console.log('');
  
  // 2. 检查映射是否正确
  console.log('验证映射关系：');
  let mismatches = [];
  
  Object.entries(teamFolderMapping).forEach(([jsonTeam, folderName]) => {
    if (actualFolders.includes(folderName)) {
      console.log(`✅ ${jsonTeam} -> ${folderName}`);
    } else {
      console.log(`❌ ${jsonTeam} -> ${folderName} (文件夹不存在)`);
      mismatches.push({ jsonTeam, expectedFolder: folderName });
    }
  });
  
  // 3. 读取players.json
  const playersPath = path.join(__dirname, '..', 'data', 'players.json');
  const playersData = JSON.parse(fs.readFileSync(playersPath, 'utf-8'));
  
  console.log(`\n读取到 ${playersData.length} 名球员`);
  
  // 4. 收集所有独特的球队名
  const uniqueTeams = [...new Set(playersData.map(p => p.team))];
  console.log(`\nJSON中的球队 (${uniqueTeams.length}个)：`);
  uniqueTeams.forEach(team => console.log(`  - ${team}`));
  
  // 5. 更新球员图片路径
  console.log('\n开始修复图片路径...');
  let fixedCount = 0;
  let alreadyCorrectCount = 0;
  let problemPlayers = [];
  
  playersData.forEach(player => {
    if (player.image) {
      const oldPath = player.image;
      const actualFolderName = teamFolderMapping[player.team];
      
      if (!actualFolderName) {
        console.log(`⚠️  未知球队: ${player.team}`);
        problemPlayers.push(player);
        return;
      }
      
      // 从旧路径中提取文件名
      const fileName = oldPath.split('/').pop();
      const newPath = `/images/players/${actualFolderName}/${fileName}`;
      
      if (oldPath !== newPath) {
        player.image = newPath;
        console.log(`📝 ${player.team} - ${player.name}`);
        console.log(`   旧路径: ${oldPath}`);
        console.log(`   新路径: ${newPath}`);
        fixedCount++;
      } else {
        alreadyCorrectCount++;
      }
    }
  });
  
  // 6. 创建备份并保存
  const backupPath = playersPath + '.backup.teamfix.' + Date.now();
  fs.copyFileSync(playersPath, backupPath);
  fs.writeFileSync(playersPath, JSON.stringify(playersData, null, 2));
  
  // 7. 打印总结
  console.log('\n===== 修复总结 =====');
  console.log(`总球员数: ${playersData.length}`);
  console.log(`修复路径: ${fixedCount}`);
  console.log(`已正确: ${alreadyCorrectCount}`);
  console.log(`问题球员: ${problemPlayers.length}`);
  console.log(`备份文件: ${backupPath.split('/').pop()}`);
  
  // 8. 验证每个球队是否有球员图片
  console.log('\n===== 各球队图片统计 =====');
  const teamStats = {};
  
  playersData.forEach(player => {
    if (!teamStats[player.team]) {
      teamStats[player.team] = { total: 0, withImage: 0, without: 0 };
    }
    teamStats[player.team].total++;
    if (player.image) {
      teamStats[player.team].withImage++;
    } else {
      teamStats[player.team].without++;
    }
  });
  
  Object.keys(teamStats).sort().forEach(team => {
    const stats = teamStats[team];
    const percentage = ((stats.withImage / stats.total) * 100).toFixed(1);
    console.log(`${team}: ${stats.withImage}/${stats.total} (${percentage}%)`);
    if (stats.without > 0) {
      console.log(`  ⚠️  缺失图片: ${stats.without} 名球员`);
    }
  });
  
  // 9. 检查实际图片文件是否存在
  console.log('\n===== 验证图片文件存在性 (抽样) =====');
  let sampleCount = 0;
  let existCount = 0;
  let notExistCount = 0;
  const notExistingFiles = [];
  
  for (const player of playersData) {
    if (player.image && sampleCount < 100) {  // 抽样检查前100个
      const imagePath = player.image.replace('/images/players/', '');
      const fullPath = path.join(playersDir, imagePath);
      
      if (fs.existsSync(fullPath)) {
        existCount++;
      } else {
        notExistCount++;
        notExistingFiles.push({
          player: `${player.team} - ${player.name}`,
          path: player.image
        });
      }
      sampleCount++;
    }
  }
  
  console.log(`抽样检查 ${sampleCount} 个文件：`);
  console.log(`  ✅ 存在: ${existCount}`);
  console.log(`  ❌ 不存在: ${notExistCount}`);
  
  if (notExistingFiles.length > 0) {
    console.log('\n不存在的文件示例：');
    notExistingFiles.slice(0, 5).forEach(item => {
      console.log(`  - ${item.player}`);
      console.log(`    ${item.path}`);
    });
  }
  
  console.log('\n🎯 修复完成！请重启服务器测试图片显示。');
}

// 运行脚本
if (require.main === module) {
  try {
    fixTeamFolderPaths();
  } catch (error) {
    console.error('❌ 修复失败:', error);
    process.exit(1);
  }
}