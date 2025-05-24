import axios from 'axios';
import { Player } from '../types';

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// 获取所有球员
export const getAllPlayers = async (): Promise<Player[]> => {
  try {
    const response = await api.get<Player[]>('/players');
    return response.data;
  } catch (error) {
    console.error('获取球员数据失败', error);
    return [];
  }
};

// 获取随机球员
export const getRandomPlayer = async (): Promise<Player | null> => {
  try {
    const response = await api.get<Player>('/random-player');
    return response.data;
  } catch (error) {
    console.error('获取随机球员失败', error);
    return null;
  }
}; 