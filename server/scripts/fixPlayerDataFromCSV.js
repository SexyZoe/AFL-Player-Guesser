const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Player = require('../models/Player');

// MongoDB连接
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/afl-players');
    console.log('MongoDB连接成功');
  } catch (error) {
    console.error('MongoDB连接失败:', error);
    process.exit(1);
  }
}

// 从CSV文件读取数据
function readCSVData() {
  const csvPath = path.join(__dirname, '..', 'player_image_mapping.csv');
  
  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV文件不存在: ${csvPath}`);
  }
  
  console.log('读取CSV文件:', csvPath);
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  // 跳过表头
  const dataLines = lines.slice(1);
  console.log(`CSV文件包含 ${dataLines.length} 条球员数据`);
  
  const players = [];
  
  dataLines.forEach((line, index) => {
    try {
      // 正确解析CSV，处理姓名中包含逗号的情况
      // CSV格式：ID,Name,Team,Number,ImageFileName
      // 按照逗号分割，但需要正确处理姓名字段
      
      const parts = [];
      let currentField = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          parts.push(currentField.trim());
          currentField = '';
        } else {
          currentField += char;
        }
      }
      
      // 添加最后一个字段
      if (currentField) {
        parts.push(currentField.trim());
      }
      
      // 如果split不够精确，尝试正则表达式方法
      if (parts.length < 5) {
        // 备用方案：假设格式为 ID,Name,Team,Number,ImageFileName
        // 其中ID和ImageFileName不包含逗号，Team是已知的球队名
        const knownTeams = [
          'Adelaide Crows', 'Brisbane Lions', 'Carlton Blues', 'Collingwood Magpies',
          'Essendon Bombers', 'Fremantle Dockers', 'Geelong Cats', 'Gold Coast Suns',
          'GWS Giants', 'Hawthorn Hawks', 'Melbourne Demons', 'North Melbourne Kangaroos',
          'Port Adelaide Power', 'Richmond Tigers', 'St Kilda Saints', 'Sydney Swans',
          'West Coast Eagles', 'Western Bulldogs'
        ];
        
        // 重新分割整行
        const allParts = line.split(',');
        if (allParts.length >= 5) {
          const id = allParts[0].trim();
          const fileName = allParts[allParts.length - 1].trim();
          const number = allParts[allParts.length - 2].trim();
          
          // 找到球队名
          let teamIndex = -1;
          let teamName = '';
          for (let j = 2; j < allParts.length - 2; j++) {
            const possibleTeam = allParts.slice(j, j + 2).join(',').trim(); // 处理两个词的球队名
            if (knownTeams.includes(possibleTeam)) {
              teamIndex = j;
              teamName = possibleTeam;
              break;
            }
            const singleWordTeam = allParts[j].trim();
            if (knownTeams.includes(singleWordTeam)) {
              teamIndex = j;
              teamName = singleWordTeam;
              break;
            }
          }
          
          if (teamIndex > 0) {
            const name = allParts.slice(1, teamIndex).join(',').trim();
            parts.length = 0; // 清空
            parts.push(id, name, teamName, number, fileName);
          }
        }
      }
      
      if (parts.length >= 5) {
        const player = {
          id: parts[0].replace(/"/g, ''),
          name: parts[1].replace(/"/g, ''),
          team: parts[2].replace(/"/g, ''),
          number: parseInt(parts[3].replace(/"/g, '')),
          imageFileName: parts[4].replace(/"/g, '')
        };
        players.push(player);
        
        // Debug: 打印前几个解析结果
        if (players.length <= 3) {
          console.log(`解析示例 ${players.length}: ${player.name} -> ${player.team}`);
        }
      } else {
        console.log(`跳过格式错误的行 ${index + 2}: ${line}`);
      }
    } catch (error) {
      console.log(`解析第 ${index + 2} 行时出错: ${line} - ${error.message}`);
    }
  });
  
  console.log(`成功解析 ${players.length} 条球员数据`);
  return players;
}

// 重新生成JSON文件
function regenerateJSONFile(players) {
  const jsonPath = path.join(__dirname, '..', 'player_image_mapping.json');
  
  console.log('重新生成JSON文件:', jsonPath);
  
  // 创建备份
  if (fs.existsSync(jsonPath)) {
    const backupPath = jsonPath + '.backup.' + Date.now();
    fs.copyFileSync(jsonPath, backupPath);
    console.log(`已创建备份: ${backupPath}`);
  }
  
  // 写入新的JSON数据
  fs.writeFileSync(jsonPath, JSON.stringify(players, null, 2));
  console.log(`✅ JSON文件已更新，包含 ${players.length} 条记录`);
}

// 更新数据库中的球员数据
async function updateDatabase(players) {
  console.log('\n开始更新数据库...');
  
  // 按球队分组，便于统计
  const teamStats = {};
  let totalUpdated = 0;
  let totalNotFound = 0;
  let totalErrors = 0;
  
  for (const csvPlayer of players) {
    try {
      // 处理姓名格式差异 - CSV中是"姓 名"，数据库中可能是"姓, 名"
      const possibleNames = [
        csvPlayer.name,  // 原始格式：Berry Sam
        csvPlayer.name.replace(' ', ', '),  // 转换为：Berry, Sam
        csvPlayer.name.replace(/\s+/g, ', '), // 多空格转逗号：Berry  Sam -> Berry, Sam
      ];
      
      let existingPlayer = null;
      
      // 尝试不同的姓名格式进行匹配
      for (const nameVariant of possibleNames) {
        existingPlayer = await Player.findOne({
          name: nameVariant,
          team: csvPlayer.team
        });
        
        if (existingPlayer) {
          console.log(`🔍 找到匹配 "${nameVariant}" (原CSV: "${csvPlayer.name}")`);
          break;
        }
      }
      
      // 如果还是找不到，尝试按号码匹配（同一球队内号码唯一）
      if (!existingPlayer) {
        existingPlayer = await Player.findOne({
          team: csvPlayer.team,
          number: csvPlayer.number
        });
        
        if (existingPlayer) {
          console.log(`🔍 通过号码找到匹配: ${csvPlayer.team} #${csvPlayer.number} - ${existingPlayer.name}`);
        }
      }
      
      if (existingPlayer) {
        // 构建新的图片URL
        const imageUrl = `/images/players/${csvPlayer.team}/${csvPlayer.imageFileName}`;
        
        // 更新球员数据
        await Player.findByIdAndUpdate(existingPlayer._id, {
          image: imageUrl
        });
        
        console.log(`✅ ${csvPlayer.team} - ${csvPlayer.name} (#${csvPlayer.number})`);
        console.log(`   图片URL: ${imageUrl}`);
        
        // 统计
        if (!teamStats[csvPlayer.team]) {
          teamStats[csvPlayer.team] = { updated: 0, notFound: 0, errors: 0 };
        }
        teamStats[csvPlayer.team].updated++;
        totalUpdated++;
        
      } else {
        console.log(`❌ 未找到球员: ${csvPlayer.team} - ${csvPlayer.name}`);
        
        if (!teamStats[csvPlayer.team]) {
          teamStats[csvPlayer.team] = { updated: 0, notFound: 0, errors: 0 };
        }
        teamStats[csvPlayer.team].notFound++;
        totalNotFound++;
      }
      
    } catch (error) {
      console.log(`❌ 更新失败: ${csvPlayer.team} - ${csvPlayer.name} - ${error.message}`);
      
      if (!teamStats[csvPlayer.team]) {
        teamStats[csvPlayer.team] = { updated: 0, notFound: 0, errors: 0 };
      }
      teamStats[csvPlayer.team].errors++;
      totalErrors++;
    }
  }
  
  // 打印统计结果
  console.log('\n=== 更新统计 ===');
  console.log(`总计更新成功: ${totalUpdated}`);
  console.log(`总计未找到: ${totalNotFound}`);
  console.log(`总计错误: ${totalErrors}`);
  
  console.log('\n=== 各球队统计 ===');
  Object.keys(teamStats).sort().forEach(team => {
    const stats = teamStats[team];
    console.log(`${team}: 成功${stats.updated} | 未找到${stats.notFound} | 错误${stats.errors}`);
  });
}

// 主函数
async function main() {
  try {
    console.log('🚀 开始修复球员数据...\n');
    
    // 1. 读取CSV数据
    const players = readCSVData();
    
    // 2. 重新生成JSON文件
    regenerateJSONFile(players);
    
    // 3. 连接数据库
    await connectDB();
    
    // 4. 更新数据库
    await updateDatabase(players);
    
    // 5. 断开数据库连接
    await mongoose.disconnect();
    
    console.log('\n✅ 所有修复任务完成！');
    
  } catch (error) {
    console.error('❌ 修复过程中出现错误:', error);
    process.exit(1);
  }
}

// 运行脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };