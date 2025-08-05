const fs = require('fs');
const path = require('path');

// 读取CSV映射文件
function getImageMapping() {
  const csvPath = path.join(__dirname, '..', 'player_image_mapping.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').slice(1); // 跳过表头
  
  const mapping = new Map();
  const csvPlayers = [];
  
  lines.forEach(line => {
    if (line.trim()) {
      const parts = line.split(',');
      if (parts.length >= 5) {
        const name = parts[1].trim().replace(/"/g, '');
        const team = parts[2].trim().replace(/"/g, '');
        const imageFileName = parts[4].trim().replace(/"/g, '');
        
        csvPlayers.push({ name, team });
        
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
  
  console.log(`CSV文件包含 ${csvPlayers.length} 名球员`);
  return { mapping, csvPlayers };
}

// 检查缺失的映射
function checkMissingMappings() {
  console.log('分析缺失的图片映射...\n');
  
  // 读取players.json文件
  const playersPath = path.join(__dirname, '..', 'data', 'players.json');
  const playersData = JSON.parse(fs.readFileSync(playersPath, 'utf-8'));
  
  console.log(`JSON文件包含 ${playersData.length} 名球员`);
  
  // 获取图片映射
  const { mapping, csvPlayers } = getImageMapping();
  
  let foundCount = 0;
  let missingPlayers = [];
  
  // 检查每个球员
  playersData.forEach(player => {
    const possibleKeys = [
      `${player.team}|${player.name}`,
      `${player.team}|${player.name.replace(' ', ', ')}`,
      `${player.team}|${player.name.replace(', ', ' ')}`
    ];
    
    let found = false;
    
    for (const key of possibleKeys) {
      if (mapping.has(key)) {
        found = true;
        foundCount++;
        break;
      }
    }
    
    if (!found) {
      missingPlayers.push({
        name: player.name,
        team: player.team,
        jsonFormat: `"${player.name}"`,
        possibleKeys: possibleKeys
      });
    }
  });
  
  console.log(`\n=== 分析结果 ===`);
  console.log(`找到映射: ${foundCount}`);
  console.log(`缺失映射: ${missingPlayers.length}`);
  
  // 按球队分组显示缺失的球员
  const missingByTeam = {};
  missingPlayers.forEach(player => {
    if (!missingByTeam[player.team]) {
      missingByTeam[player.team] = [];
    }
    missingByTeam[player.team].push(player);
  });
  
  console.log(`\n=== 缺失映射的球员（按球队） ===`);
  Object.keys(missingByTeam).sort().forEach(team => {
    const players = missingByTeam[team];
    console.log(`\n${team} (${players.length}名):`);
    players.forEach((player, index) => {
      console.log(`  ${index + 1}. "${player.name}"`);
    });
  });
  
  // 检查是否是球队名称不匹配的问题
  console.log(`\n=== CSV中的球队名称 ===`);
  const csvTeams = [...new Set(csvPlayers.map(p => p.team))];
  csvTeams.sort().forEach(team => {
    console.log(`- ${team}`);
  });
  
  console.log(`\n=== JSON中的球队名称 ===`);
  const jsonTeams = [...new Set(playersData.map(p => p.team))];
  jsonTeams.sort().forEach(team => {
    console.log(`- ${team}`);
  });
  
  // 找出不匹配的球队名称
  const unmatchedJsonTeams = jsonTeams.filter(team => !csvTeams.includes(team));
  const unmatchedCsvTeams = csvTeams.filter(team => !jsonTeams.includes(team));
  
  if (unmatchedJsonTeams.length > 0 || unmatchedCsvTeams.length > 0) {
    console.log(`\n=== 球队名称不匹配 ===`);
    if (unmatchedJsonTeams.length > 0) {
      console.log(`JSON中有但CSV中没有:`);
      unmatchedJsonTeams.forEach(team => console.log(`  - ${team}`));
    }
    if (unmatchedCsvTeams.length > 0) {
      console.log(`CSV中有但JSON中没有:`);
      unmatchedCsvTeams.forEach(team => console.log(`  - ${team}`));
    }
  }
}

// 运行脚本
if (require.main === module) {
  try {
    checkMissingMappings();
  } catch (error) {
    console.error('❌ 分析失败:', error);
    process.exit(1);
  }
}