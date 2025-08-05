const fs = require('fs');
const path = require('path');

// 增强的姓名匹配逻辑
function createNameVariants(name) {
  const variants = [name]; // 原始名称
  
  // 移除后缀 "R"
  if (name.endsWith(' R')) {
    variants.push(name.replace(' R', ''));
  }
  
  // 姓名顺序互换
  if (name.includes(' ') && !name.includes(',')) {
    // "名 姓" -> "姓 名" 或 "姓, 名"
    const parts = name.split(' ');
    if (parts.length === 2) {
      variants.push(`${parts[1]} ${parts[0]}`);
      variants.push(`${parts[1]}, ${parts[0]}`);
    } else if (parts.length === 3) {
      // "名 中名 姓" -> "姓 名 中名"
      variants.push(`${parts[2]} ${parts[0]} ${parts[1]}`);
      variants.push(`${parts[2]}, ${parts[0]} ${parts[1]}`);
    }
  }
  
  // 逗号格式转换
  if (name.includes(', ')) {
    variants.push(name.replace(', ', ' '));
  } else if (name.includes(' ') && !name.includes(',')) {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      variants.push(`${parts[0]}, ${parts.slice(1).join(' ')}`);
    }
  }
  
  // 去掉点号
  if (name.includes('.')) {
    variants.push(name.replace(/\./g, ''));
  }
  
  return [...new Set(variants)]; // 去重
}

// 简单的CSV解析
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

// 修复剩余的球员
function fixRemainingPlayers() {
  console.log('使用增强匹配逻辑修复剩余球员...\n');
  
  // 读取CSV文件创建增强映射
  const csvPath = path.join(__dirname, '..', 'player_image_mapping.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const csvLines = csvContent.split('\n').slice(1);
  
  const mapping = new Map();
  
  csvLines.forEach(line => {
    if (line.trim()) {
      const parsed = parseCSVLine(line);
      if (parsed && parsed.team && parsed.name) {
        // 为每个CSV球员创建多种姓名变体
        const nameVariants = createNameVariants(parsed.name);
        
        nameVariants.forEach(variant => {
          const key = `${parsed.team}|${variant}`;
          mapping.set(key, `/images/players/${parsed.team}/${parsed.imageFileName}`);
        });
      }
    }
  });
  
  console.log(`创建了 ${mapping.size} 条增强映射`);
  
  // 读取players.json
  const playersPath = path.join(__dirname, '..', 'data', 'players.json');
  const playersData = JSON.parse(fs.readFileSync(playersPath, 'utf-8'));
  
  let newlyFixedCount = 0;
  let stillMissingPlayers = [];
  
  playersData.forEach(player => {
    // 如果已经有image字段，跳过
    if (player.image) {
      return;
    }
    
    // 为JSON球员创建姓名变体
    const nameVariants = createNameVariants(player.name);
    
    let imageUrl = null;
    let matchedVariant = null;
    
    for (const variant of nameVariants) {
      const key = `${player.team}|${variant}`;
      if (mapping.has(key)) {
        imageUrl = mapping.get(key);
        matchedVariant = variant;
        break;
      }
    }
    
    if (imageUrl) {
      player.image = imageUrl;
      console.log(`✅ 新匹配: ${player.team} - ${player.name}`);
      console.log(`   匹配方式: "${player.name}" -> "${matchedVariant}"`);
      console.log(`   图片路径: ${imageUrl}`);
      newlyFixedCount++;
    } else {
      stillMissingPlayers.push({
        name: player.name,
        team: player.team,
        number: player.number,
        variants: nameVariants
      });
    }
  });
  
  // 创建备份并保存
  const backupPath = playersPath + '.backup.enhanced.' + Date.now();
  fs.copyFileSync(playersPath, backupPath);
  
  fs.writeFileSync(playersPath, JSON.stringify(playersData, null, 2));
  
  console.log(`\n=== 增强修复结果 ===`);
  console.log(`新修复: ${newlyFixedCount} 名球员`);
  console.log(`仍缺失: ${stillMissingPlayers.length} 名球员`);
  
  if (stillMissingPlayers.length > 0) {
    console.log(`\n=== 仍然缺失的球员 ===`);
    stillMissingPlayers.forEach((player, index) => {
      console.log(`${index + 1}. ${player.team} - ${player.name} (#${player.number})`);
      console.log(`   尝试的变体: ${player.variants.join(', ')}`);
    });
    
    console.log(`\n这些球员可能需要：`);
    console.log(`1. 检查图片文件是否存在`);
    console.log(`2. 手动添加到CSV文件`);
    console.log(`3. 或者使用默认图片`);
  }
}

// 运行脚本
if (require.main === module) {
  try {
    fixRemainingPlayers();
  } catch (error) {
    console.error('❌ 修复失败:', error);
    process.exit(1);
  }
}