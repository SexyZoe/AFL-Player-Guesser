# Railway部署说明

## 🚀 部署步骤

### 1. 准备MongoDB Atlas
1. 访问 [MongoDB Atlas](https://cloud.mongodb.com/)
2. 创建免费集群
3. 创建数据库用户
4. 获取连接字符串

### 2. 部署到Railway
1. 访问 [Railway](https://railway.app/)
2. 使用GitHub登录
3. 点击 "Deploy from GitHub repo"
4. 选择此仓库
5. 设置环境变量

### 3. 必需的环境变量
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
NODE_ENV=production
```

### 4. 部署后配置
1. 等待构建完成
2. 访问分配的URL
3. 测试游戏功能

## 📁 项目结构
```
AFL-Player-Guesser/
├── client/                  # 前端React应用
├── server/                  # 后端Node.js应用
│   ├── public/
│   │   └── images/
│   │       └── players/     # 球员图片存储
├── railway.json            # Railway配置
└── package.json            # 项目配置
```

## 🖼️ 添加球员图片
1. 将WebP格式图片放入 `server/public/images/players/`
2. 文件命名：`球员ID.webp`
3. 图片访问URL：`https://your-app.railway.app/images/players/1.webp`

## 🔧 本地开发
```bash
# 安装依赖
npm run install:all

# 启动开发服务器
npm run start:dev

# 构建前端
npm run build
```

## 🎮 功能特性
- ✅ 实时多人对战
- ✅ Socket.io支持
- ✅ MongoDB数据库
- ✅ 球员图片显示
- ✅ 响应式设计 