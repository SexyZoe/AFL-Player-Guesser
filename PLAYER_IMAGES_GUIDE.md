# 球员图片管理指南

## 📋 概述

本指南详细说明如何为AFL球员添加图片，并将图片与数据库中的球员记录关联。

## 🎯 支持的图片组织方式

### 方式1: 使用数据库ID命名 (推荐)
```
server/public/images/players/
├── 507f1f77bcf86cd799439011.webp  # 数据库ID
├── 507f1f77bcf86cd799439012.webp
└── default.webp
```

### 方式2: 使用球员名字命名
```
server/public/images/players/
├── berry_sam.webp
├── bond_hugh.webp
├── borlase_james_r.webp
└── default.webp
```

### 方式3: 使用球员号码命名
```
server/public/images/players/
├── 3.webp          # 简单号码
├── adelaide_21.webp # 球队_号码
├── carlton_13.webp
└── default.webp
```

## 🚀 快速开始

### 1. 准备图片文件
- **格式**: WebP (推荐), JPG, PNG
- **尺寸**: 200x200px 正方形
- **文件大小**: 20-30KB以内
- **背景**: 透明或统一背景色

### 2. 获取球员信息
```bash
# 列出所有球员的ID、名字和号码
npm run list-players
```

这会生成两个文件：
- `server/player_image_mapping.csv` - Excel可打开的映射表
- `server/player_image_mapping.json` - JSON格式的映射数据

### 3. 添加图片文件
将图片文件放入 `server/public/images/players/` 目录

### 4. 更新数据库
根据你的图片命名方式选择对应的脚本：

```bash
# 方式1: 按数据库ID匹配
npm run update-images

# 方式2: 按球员名字匹配
npm run update-images-by-name

# 方式3: 按球员号码匹配
npm run update-images-by-number
```

### 5. 验证图片链接
```bash
# 验证所有图片链接是否有效
npm run verify-images
```

## 📝 详细步骤

### 步骤1: 获取球员列表
```bash
npm run list-players
```

**输出示例:**
```
球员列表：
====================================
ID: 507f1f77bcf86cd799439011 | Berry Sam | Adelaide Crows | #3
图片文件名: 507f1f77bcf86cd799439011.webp
------------------------------------
ID: 507f1f77bcf86cd799439012 | Bond Hugh | Adelaide Crows | #40
图片文件名: 507f1f77bcf86cd799439012.webp
------------------------------------
```

### 步骤2: 准备图片文件
根据生成的映射表，准备对应的图片文件。

**方式1示例 (使用ID):**
```
server/public/images/players/
├── 507f1f77bcf86cd799439011.webp  # Berry Sam
├── 507f1f77bcf86cd799439012.webp  # Bond Hugh
└── default.webp                    # 默认图片
```

**方式2示例 (使用名字):**
```
server/public/images/players/
├── berry_sam.webp
├── bond_hugh.webp
├── borlase_james_r.webp
└── default.webp
```

**方式3示例 (使用号码):**
```
server/public/images/players/
├── 3.webp                    # Berry Sam #3
├── 40.webp                   # Bond Hugh #40
├── adelaide_3.webp           # 或者加上球队前缀
└── default.webp
```

### 步骤3: 更新数据库
```bash
# 按ID匹配（推荐）
npm run update-images

# 按名字匹配
npm run update-images-by-name

# 按号码匹配
npm run update-images-by-number
```

**输出示例:**
```
✅ Berry Sam -> 507f1f77bcf86cd799439011.webp
✅ Bond Hugh -> 507f1f77bcf86cd799439012.webp
❌ Borlase James R -> 未找到匹配的图片

匹配结果:
成功匹配: 2/3
未匹配: 1
```

### 步骤4: 验证结果
```bash
npm run verify-images
```

**输出示例:**
```
✅ Berry Sam -> 507f1f77bcf86cd799439011.webp (25 KB)
✅ Bond Hugh -> 507f1f77bcf86cd799439012.webp (32 KB)
❌ Borlase James R -> 507f1f77bcf86cd799439013.webp (文件不存在)

========== 验证结果 ==========
总球员数: 3
有图片URL: 3
有效图片: 2
无效图片: 1
缺少图片: 0
完整率: 67%
```

## 🔧 高级功能

### 批量重命名图片
如果你有一堆图片需要重命名，可以使用生成的CSV文件：

```bash
# 打开 server/player_image_mapping.csv
# 使用Excel或其他工具查看ID和名字的对应关系
# 手动重命名图片文件
```

### 图片优化建议
```bash
# 使用 ImageMagick 批量转换和优化
magick convert *.jpg -resize 200x200 -format webp *.webp

# 使用 cwebp 优化WebP图片
cwebp -q 80 input.jpg -o output.webp
```

## 🎮 游戏中的效果

配置完成后，游戏中会显示：
- 游戏结束时显示目标球员的头像
- 图片加载失败时显示默认头像 👤
- 图片加载过程中显示加载动画

## 📊 文件结构

```
AFL-Player-Guesser/
├── server/
│   ├── public/
│   │   └── images/
│   │       └── players/           # 图片存储目录
│   │           ├── *.webp         # 球员图片
│   │           └── default.webp   # 默认图片
│   ├── scripts/
│   │   ├── listPlayerIds.js       # 列出球员ID
│   │   ├── updatePlayerImages.js  # 按ID更新
│   │   ├── updateImagesByName.js  # 按名字更新
│   │   ├── updateImagesByNumber.js # 按号码更新
│   │   └── verifyImages.js        # 验证图片
│   ├── player_image_mapping.csv   # 球员映射表
│   └── image_verification_report.json # 验证报告
```

## 🚨 常见问题

### Q: 图片不显示怎么办？
1. 运行 `npm run verify-images` 检查图片路径
2. 确保图片文件存在于 `server/public/images/players/` 目录
3. 检查图片格式是否支持（WebP, JPG, PNG）
4. 确保文件名完全匹配（区分大小写）

### Q: 如何批量处理多个球队？
按球队分批处理：
```bash
# 先处理一个球队的图片
npm run update-images-by-name

# 验证结果
npm run verify-images

# 再处理下一个球队
```

### Q: 图片文件太大怎么办？
```bash
# 使用在线工具或命令行工具压缩
# 目标：200x200px, 20-30KB
```

## 🎯 最佳实践

1. **使用数据库ID命名** - 最可靠的方式
2. **保持图片尺寸一致** - 200x200px
3. **使用WebP格式** - 文件更小
4. **定期验证** - 确保图片链接有效
5. **备份原始图片** - 便于重新处理

## 🔄 更新流程

当添加新球员或更新图片时：
```bash
1. npm run list-players     # 获取最新球员列表
2. # 添加新图片文件
3. npm run update-images    # 更新数据库
4. npm run verify-images    # 验证结果
``` 