const fs = require('fs');
const path = require('path');

// 修复重复的.webp扩展名
function fixDuplicateWebpExtensions() {
  const playersDir = path.join(__dirname, '..', 'public', 'images', 'players');
  
  console.log('开始扫描并修复重复的.webp扩展名...');
  console.log(`扫描目录: ${playersDir}`);
  
  let totalFixed = 0;
  let totalScanned = 0;
  
  // 获取所有球队文件夹
  const teamFolders = fs.readdirSync(playersDir).filter(item => {
    const itemPath = path.join(playersDir, item);
    return fs.statSync(itemPath).isDirectory();
  });
  
  console.log(`找到 ${teamFolders.length} 个球队文件夹`);
  
  // 处理每个球队文件夹
  teamFolders.forEach(teamFolder => {
    const teamPath = path.join(playersDir, teamFolder);
    console.log(`\n处理球队: ${teamFolder}`);
    
    try {
      const files = fs.readdirSync(teamPath);
      const webpWebpFiles = files.filter(file => file.endsWith('.webp.webp'));
      
      console.log(`  找到 ${files.length} 个文件，其中 ${webpWebpFiles.length} 个需要修复`);
      
      webpWebpFiles.forEach(oldFileName => {
        const oldFilePath = path.join(teamPath, oldFileName);
        const newFileName = oldFileName.replace('.webp.webp', '.webp');
        const newFilePath = path.join(teamPath, newFileName);
        
        try {
          // 检查目标文件是否已存在
          if (fs.existsSync(newFilePath)) {
            console.log(`  ⚠️  目标文件已存在，跳过: ${newFileName}`);
            return;
          }
          
          // 重命名文件
          fs.renameSync(oldFilePath, newFilePath);
          console.log(`  ✅ ${oldFileName} -> ${newFileName}`);
          totalFixed++;
        } catch (error) {
          console.log(`  ❌ 重命名失败: ${oldFileName} - ${error.message}`);
        }
      });
      
      totalScanned += files.length;
      
    } catch (error) {
      console.log(`  ❌ 处理文件夹失败: ${teamFolder} - ${error.message}`);
    }
  });
  
  console.log(`\n修复完成:`);
  console.log(`总计扫描文件: ${totalScanned}`);
  console.log(`成功修复文件: ${totalFixed}`);
  
  // 验证修复结果
  console.log('\n验证修复结果...');
  let remainingWebpWebpFiles = 0;
  
  teamFolders.forEach(teamFolder => {
    const teamPath = path.join(playersDir, teamFolder);
    try {
      const files = fs.readdirSync(teamPath);
      const webpWebpFiles = files.filter(file => file.endsWith('.webp.webp'));
      remainingWebpWebpFiles += webpWebpFiles.length;
      
      if (webpWebpFiles.length > 0) {
        console.log(`${teamFolder}: 仍有 ${webpWebpFiles.length} 个.webp.webp文件`);
      }
    } catch (error) {
      console.log(`验证 ${teamFolder} 时出错: ${error.message}`);
    }
  });
  
  if (remainingWebpWebpFiles === 0) {
    console.log('✅ 所有重复扩展名已修复完成！');
  } else {
    console.log(`⚠️  仍有 ${remainingWebpWebpFiles} 个文件需要手动处理`);
  }
}

// 主函数
function main() {
  try {
    fixDuplicateWebpExtensions();
  } catch (error) {
    console.error('脚本执行失败:', error);
  }
}

// 运行脚本
if (require.main === module) {
  main();
}

module.exports = { fixDuplicateWebpExtensions };