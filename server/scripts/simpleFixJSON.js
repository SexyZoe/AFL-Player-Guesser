const fs = require('fs');
const path = require('path');

// 简单可靠的CSV解析
function parseCSVLine(line) {
  const parts = line.split(',');
  
  if (parts.length < 5) return null;
  
  // 已知结构：ID,Name,Team,Number,ImageFileName  
  // ID: 第1个字段（无逗号）
  // ImageFileName: 最后1个字段（无逗号）
  // Number: 倒数第2个字段（无逗号）
  
  const id = parts[0].trim();
  const imageFileName = parts[parts.length - 1].trim();
  const number = parseInt(parts[parts.length - 2].trim());
  
  // Team: 可能是1个或2个词
  let team, name;
  
  // 已知的两词球队名
  const twoWordTeams = [
    'Adelaide Crows', 'Brisbane Lions', 'Carlton Blues', 'Collingwood Magpies',
    'Essendon Bombers', 'Fremantle Dockers', 'Geelong Cats', 'Gold Coast Suns', 
    'GWS Giants', 'Hawthorn Hawks', 'Melbourne Demons', 'North Melbourne Kangaroos',
    'Port Adelaide Power', 'Richmond Tigers', 'St Kilda Saints', 'Sydney Swans',
    'West Coast Eagles', 'Western Bulldogs'
  ];
  
  // 检查倒数第4、3个字段是否组成两词球队名
  if (parts.length >= 5) {
    const possibleTwoWordTeam = `${parts[parts.length - 4].trim()} ${parts[parts.length - 3].trim()}`;
    if (twoWordTeams.includes(possibleTwoWordTeam)) {
      team = possibleTwoWordTeam;
      // Name是从第2个字段到倒数第5个字段
      name = parts.slice(1, parts.length - 4).join(',').trim();
    } else {
      // 单词球队名
      team = parts[parts.length - 3].trim();
      // Name是从第2个字段到倒数第4个字段  
      name = parts.slice(1, parts.length - 3).join(',').trim();
    }
  }
  
  return { id, name, team, number, imageFileName };
}

// 修复players.json文件
function fixPlayersJSON() {
  console.log('使用简单解析方法修复players.json...\n');
  
  // 读取CSV文件
  const csvPath = path.join(__dirname, '..', 'player_image_mapping.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const csvLines = csvContent.split('\n').slice(1); // 跳过表头
  
  // 解析CSV创建映射
  const mapping = new Map();
  let parsedCount = 0;
  
  csvLines.forEach((line, index) => {
    if (line.trim()) {
      const parsed = parseCSVLine(line);
      if (parsed && parsed.team && parsed.name) {
        // 创建多种键格式
        const keys = [
          `${parsed.team}|${parsed.name}`,
          `${parsed.team}|${parsed.name.replace(' ', ', ')}`,
          `${parsed.team}|${parsed.name.replace(', ', ' ')}`
        ];
        
        const imageUrl = `/images/players/${parsed.team}/${parsed.imageFileName}`;
        
        keys.forEach(key => {
          mapping.set(key, imageUrl);
        });
        
        parsedCount++;
        
        // 显示前5个解析示例
        if (parsedCount <= 5) {
          console.log(`解析示例 ${parsedCount}: "${parsed.name}" -> ${parsed.team}`);
        }
      } else {
        console.log(`解析失败第 ${index + 2} 行: ${line.substring(0, 50)}...`);
      }
    }
  });
  
  console.log(`成功解析 ${parsedCount} 条CSV记录`);
  console.log(`创建了 ${mapping.size} 条映射`);
  
  // 读取players.json
  const playersPath = path.join(__dirname, '..', 'data', 'players.json');
  const playersData = JSON.parse(fs.readFileSync(playersPath, 'utf-8'));
  
  console.log(`\n读取到 ${playersData.length} 名球员数据`);
  
  let updatedCount = 0;
  let notFoundCount = 0;
  
  // 更新每个球员
  playersData.forEach(player => {
    const possibleKeys = [
      `${player.team}|${player.name}`,
      `${player.team}|${player.name.replace(' ', ', ')}`,
      `${player.team}|${player.name.replace(', ', ' ')}`
    ];
    
    let imageUrl = null;
    
    for (const key of possibleKeys) {
      if (mapping.has(key)) {
        imageUrl = mapping.get(key);
        break;
      }
    }
    
    if (imageUrl) {
      player.image = imageUrl;
      updatedCount++;
      
      // 显示前5个和缺失的球队示例
      if (updatedCount <= 5 || player.team === 'Sydney Swans' || player.team === 'Western Bulldogs') {
        console.log(`✅ ${player.team} - ${player.name}`);
      }
    } else {
      notFoundCount++;
      console.log(`❌ 未找到: ${player.team} - ${player.name}`);
    }
  });
  
  // 创建备份并保存
  const backupPath = playersPath + '.backup.simple.' + Date.now();
  fs.copyFileSync(playersPath, backupPath);
  
  fs.writeFileSync(playersPath, JSON.stringify(playersData, null, 2));
  
  console.log(`\n=== 修复完成 ===`);
  console.log(`成功更新: ${updatedCount}`);
  console.log(`未找到: ${notFoundCount}`);
  console.log(`总计: ${updatedCount + notFoundCount}`);
  console.log(`备份文件: ${backupPath.split('/').pop()}`);
  
  if (notFoundCount === 0) {
    console.log('\n🎉 所有球员都找到了图片映射！');
  }
}

// 运行脚本
if (require.main === module) {
  try {
    fixPlayersJSON();
  } catch (error) {
    console.error('❌ 修复失败:', error);
    process.exit(1);
  }
}