const fs = require('fs');
const path = require('path');

// 简单的CSV解析（和之前成功的脚本相同）
function parseCSVLine(line) {
  const parts = line.split(',');
  
  if (parts.length < 5) return null;
  
  const id = parts[0].trim();
  const imageFileName = parts[parts.length - 1].trim();
  const number = parseInt(parts[parts.length - 2].trim());
  
  const twoWordTeams = [
    'Adelaide Crows', 'Brisbane Lions', 'Carlton Blues', 'Collingwood Magpies',
    'Essendon Bombers', 'Fremantle Dockers', 'Geelong Cats', 'Gold Coast Suns', 
    'GWS Giants', 'Hawthorn Hawks', 'Melbourne Demons', 'North Melbourne Kangaroos',
    'Port Adelaide Power', 'Richmond Tigers', 'St Kilda Saints', 'Sydney Swans',
    'West Coast Eagles', 'Western Bulldogs'
  ];
  
  let team, name;
  
  if (parts.length >= 5) {
    const possibleTwoWordTeam = `${parts[parts.length - 4].trim()} ${parts[parts.length - 3].trim()}`;
    if (twoWordTeams.includes(possibleTwoWordTeam)) {
      team = possibleTwoWordTeam;
      name = parts.slice(1, parts.length - 4).join(',').trim();
    } else {
      team = parts[parts.length - 3].trim();
      name = parts.slice(1, parts.length - 3).join(',').trim();
    }
  }
  
  return { id, name, team, number, imageFileName };
}

// 找出缺失的球员
function findMissingPlayers() {
  console.log('查找缺失映射的15名球员...\n');
  
  // 读取CSV文件创建映射
  const csvPath = path.join(__dirname, '..', 'player_image_mapping.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const csvLines = csvContent.split('\n').slice(1);
  
  const mapping = new Map();
  
  csvLines.forEach(line => {
    if (line.trim()) {
      const parsed = parseCSVLine(line);
      if (parsed && parsed.team && parsed.name) {
        const keys = [
          `${parsed.team}|${parsed.name}`,
          `${parsed.team}|${parsed.name.replace(' ', ', ')}`,
          `${parsed.team}|${parsed.name.replace(', ', ' ')}`
        ];
        
        keys.forEach(key => {
          mapping.set(key, true);
        });
      }
    }
  });
  
  // 读取players.json
  const playersPath = path.join(__dirname, '..', 'data', 'players.json');
  const playersData = JSON.parse(fs.readFileSync(playersPath, 'utf-8'));
  
  let missingPlayers = [];
  
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
        break;
      }
    }
    
    if (!found) {
      missingPlayers.push({
        name: player.name,
        team: player.team,
        number: player.number,
        id: player._id
      });
    }
  });
  
  console.log(`=== 缺失映射的 ${missingPlayers.length} 名球员 ===\n`);
  
  // 按球队分组
  const byTeam = {};
  missingPlayers.forEach(player => {
    if (!byTeam[player.team]) {
      byTeam[player.team] = [];
    }
    byTeam[player.team].push(player);
  });
  
  Object.keys(byTeam).sort().forEach(team => {
    const players = byTeam[team];
    console.log(`${team} (${players.length}名):`);
    players.forEach((player, index) => {
      console.log(`  ${index + 1}. ${player.name} (#${player.number})`);
      console.log(`     JSON ID: ${player.id}`);
    });
    console.log('');
  });
  
  // 显示总结
  console.log(`总计缺失: ${missingPlayers.length} 名球员`);
  console.log(`成功匹配: ${playersData.length - missingPlayers.length} 名球员`);
  console.log(`匹配率: ${((playersData.length - missingPlayers.length) / playersData.length * 100).toFixed(1)}%`);
}

// 运行脚本
if (require.main === module) {
  try {
    findMissingPlayers();
  } catch (error) {
    console.error('❌ 查找失败:', error);
    process.exit(1);
  }
}