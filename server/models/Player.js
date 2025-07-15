const mongoose = require('mongoose');

// 定义球员模式
const playerSchema = new mongoose.Schema({
  number: Number,
  name: String,
  games: Number,
  age: String,
  dob: String,
  height: String,
  weight: String,
  origin: String,
  position: String,
  team: String,
  image: String  // 球员图片URL
}, { timestamps: true });

// 创建模型
const Player = mongoose.model('Player', playerSchema);

module.exports = Player; 