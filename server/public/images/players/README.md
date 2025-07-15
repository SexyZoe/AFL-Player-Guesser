# 球员图片存储说明

## 图片格式要求
- 格式：WebP
- 尺寸：200x200px（正方形）
- 文件大小：20-30KB以内
- 命名规则：`球员ID.webp`

## 文件示例
```
1.webp          # 球员ID为1的图片
2.webp          # 球员ID为2的图片
3.webp          # 球员ID为3的图片
default.webp    # 默认占位符图片
```

## 图片URL格式
```
http://localhost:5000/images/players/1.webp
http://localhost:5000/images/players/default.webp
```

## 添加新图片
1. 将WebP格式的图片放入此目录
2. 确保文件名为`球员ID.webp`
3. 更新数据库中的球员记录，添加image字段 