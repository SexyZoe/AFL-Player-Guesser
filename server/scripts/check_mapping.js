const fs = require('fs');
const path = require('path');

// 读取CSV文件
function readCSVMapping() {
    const csvPath = path.join(__dirname, '../player_image_mapping.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const lines = csvContent.split('\n').slice(1); // 跳过标题行
    
    const mapping = [];
    for (const line of lines) {
        if (line.trim()) {
            const [id, name, team, number, imageFileName] = line.split(',');
            mapping.push({
                id: id.trim(),
                name: name.trim(),
                team: team.trim(),
                number: parseInt(number),
                imageFileName: imageFileName.trim()
            });
        }
    }
    return mapping;
}

// 获取所有实际存在的图片文件
function getActualImageFiles() {
    const playersDir = path.join(__dirname, '../public/images/players');
    const actualFiles = new Set();
    
    try {
        const teamDirs = fs.readdirSync(playersDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);
        
        for (const teamDir of teamDirs) {
            const teamPath = path.join(playersDir, teamDir);
            const files = fs.readdirSync(teamPath)
                .filter(file => file.endsWith('.webp'));
            
            for (const file of files) {
                actualFiles.add(file);
            }
        }
    } catch (error) {
        console.error('读取图片目录错误:', error);
    }
    
    return actualFiles;
}

// 主函数
function analyzeMapping() {
    console.log('🔍 分析球员图片映射关系...\n');
    
    // 读取CSV映射
    const csvMapping = readCSVMapping();
    console.log(`📊 CSV映射文件中的球员数量: ${csvMapping.length}`);
    
    // 获取实际图片文件
    const actualFiles = getActualImageFiles();
    console.log(`📁 实际存在的图片文件数量: ${actualFiles.size}\n`);
    
    // 分析匹配情况
    let matched = 0;
    let unmatched = 0;
    const unmatchedList = [];
    const duplicateFiles = new Set();
    
    for (const player of csvMapping) {
        const expectedFileName = `${player.id}.webp`;
        
        if (actualFiles.has(expectedFileName)) {
            matched++;
        } else {
            unmatched++;
            unmatchedList.push({
                name: player.name,
                team: player.team,
                id: player.id,
                expectedFile: expectedFileName
            });
        }
    }
    
    // 检查多余的图片文件
    const csvFileNames = new Set(csvMapping.map(p => `${p.id}.webp`));
    const extraFiles = [];
    
    for (const file of actualFiles) {
        if (!csvFileNames.has(file)) {
            extraFiles.push(file);
        }
    }
    
    // 输出结果
    console.log('📈 匹配统计结果:');
    console.log(`✅ 匹配成功: ${matched} 个`);
    console.log(`❌ 匹配失败: ${unmatched} 个`);
    console.log(`📊 匹配率: ${((matched / csvMapping.length) * 100).toFixed(2)}%`);
    console.log(`🗂️ 多余的图片文件: ${extraFiles.length} 个\n`);
    
    if (unmatched > 0) {
        console.log('❌ 未匹配的球员 (前10个):');
        unmatchedList.slice(0, 10).forEach((player, index) => {
            console.log(`${index + 1}. ${player.name} (${player.team}) - 期望文件: ${player.expectedFile}`);
        });
        
        if (unmatched > 10) {
            console.log(`... 还有 ${unmatched - 10} 个未匹配`);
        }
        console.log();
    }
    
    if (extraFiles.length > 0) {
        console.log('🗂️ 多余的图片文件 (前10个):');
        extraFiles.slice(0, 10).forEach((file, index) => {
            console.log(`${index + 1}. ${file}`);
        });
        
        if (extraFiles.length > 10) {
            console.log(`... 还有 ${extraFiles.length - 10} 个多余文件`);
        }
    }
    
    return {
        total: csvMapping.length,
        matched,
        unmatched,
        matchRate: (matched / csvMapping.length) * 100,
        extraFiles: extraFiles.length
    };
}

// 运行分析
const result = analyzeMapping();

