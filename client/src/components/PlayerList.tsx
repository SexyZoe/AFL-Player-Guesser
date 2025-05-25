import React, { useState, useRef, useEffect } from 'react';
import { Player } from '../types';

interface PlayerListProps {
  players: Player[];
  onSelectPlayer: (player: Player) => void;
}

const PlayerList: React.FC<PlayerListProps> = ({ players, onSelectPlayer }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [autocompleteSuggestion, setAutocompleteSuggestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 8); // 限制显示前8个结果

  // 生成自动完成建议
  useEffect(() => {
    if (searchTerm.length > 0) {
      const firstMatch = players.find(player =>
        player.name.toLowerCase().startsWith(searchTerm.toLowerCase())
      );
      
      if (firstMatch && firstMatch.name.toLowerCase() !== searchTerm.toLowerCase()) {
        setAutocompleteSuggestion(firstMatch.name);
      } else {
        setAutocompleteSuggestion('');
      }
    } else {
      setAutocompleteSuggestion('');
    }
  }, [searchTerm, players]);

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 处理键盘导航
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || filteredPlayers.length === 0) {
      if (e.key === 'ArrowDown' && filteredPlayers.length > 0) {
        e.preventDefault();
        setShowDropdown(true);
        setSelectedIndex(0);
      }
      return;
    }

    switch (e.key) {
      case 'Tab':
        // Tab键自动完成
        if (autocompleteSuggestion) {
          e.preventDefault();
          setSearchTerm(autocompleteSuggestion);
          setAutocompleteSuggestion('');
          setShowDropdown(false);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredPlayers.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredPlayers.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredPlayers.length) {
          handleSelectPlayer(filteredPlayers[selectedIndex]);
        } else if (autocompleteSuggestion) {
          setSearchTerm(autocompleteSuggestion);
          setAutocompleteSuggestion('');
          setShowDropdown(false);
        } else if (filteredPlayers.length > 0) {
          handleSelectPlayer(filteredPlayers[0]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        setAutocompleteSuggestion('');
        break;
      case 'ArrowRight':
        if (autocompleteSuggestion && inputRef.current) {
          const cursorPosition = inputRef.current.selectionStart || 0;
          if (cursorPosition === searchTerm.length) {
            e.preventDefault();
            setSearchTerm(autocompleteSuggestion);
            setAutocompleteSuggestion('');
            setShowDropdown(false);
          }
        }
        break;
    }
  };

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setSelectedIndex(-1);
    setShowDropdown(value.length > 0);
    
    // 模拟搜索加载效果
    if (value.length > 0) {
      setIsLoading(true);
      setTimeout(() => setIsLoading(false), 200);
    }
  };

  // 处理选择玩家
  const handleSelectPlayer = (player: Player) => {
    onSelectPlayer(player);
    setSearchTerm('');
    setSelectedIndex(-1);
    setAutocompleteSuggestion('');
    setShowDropdown(false);
    inputRef.current?.blur();
  };

  // 处理输入框聚焦
  const handleInputFocus = () => {
    if (searchTerm.length > 0 && filteredPlayers.length > 0) {
      setShowDropdown(true);
      setSelectedIndex(0);
    }
  };

  // 处理搜索按钮点击
  const handleSearchClick = () => {
    if (filteredPlayers.length > 0) {
      handleSelectPlayer(filteredPlayers[0]);
    }
  };

  // 接受自动完成建议
  const acceptAutocompletion = () => {
    if (autocompleteSuggestion) {
      setSearchTerm(autocompleteSuggestion);
      setAutocompleteSuggestion('');
      setShowDropdown(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* 搜索区域 */}
      <div className="search-wrapper">
        <div className="mb-8 text-center">
          <h2 className="text-5xl font-bold text-gray-800 mb-3 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Select Player
          </h2>
          <p className="text-gray-600 text-xl font-medium">Type a player's name to search and select</p>
        </div>

        <div className="relative w-full max-w-2xl mx-auto" ref={searchRef}>
          {/* 搜索输入框和下拉框的相对容器 */}
          <div className="relative">
            {/* 搜索框容器 */}
            <div className="search-container relative">
              {/* 自动完成建议背景文本 */}
              {autocompleteSuggestion && !showDropdown && (
                <div className="autocomplete-suggestion">
                  <span className="invisible">{searchTerm}</span>
                  <span>{autocompleteSuggestion.slice(searchTerm.length)}</span>
                </div>
              )}
              
              <input
                ref={inputRef}
                type="text"
                placeholder="Search for any AFL player..."
                className="search-input relative z-10 bg-transparent"
                value={searchTerm}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                onKeyDown={handleKeyDown}
                autoComplete="off"
              />
              <button
                className="search-button"
                onClick={handleSearchClick}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                ) : (
                  '🔍'
                )}
              </button>
            </div>

            {/* 清除按钮 */}
            {searchTerm && (
              <button
                className="absolute right-20 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 transition-all duration-200 text-xl z-20 w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedIndex(-1);
                  setAutocompleteSuggestion('');
                  setShowDropdown(false);
                }}
              >
                ✕
              </button>
            )}

            {/* 下拉式搜索结果容器 - 绝对定位在输入框下方 */}
            {showDropdown && searchTerm && (
              <div className="dropdown-suggestions absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-80 overflow-hidden">
                {filteredPlayers.length > 0 ? (
                  <>
                    {/* 头部信息 */}
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 text-sm text-gray-600 font-medium flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                        {filteredPlayers.length} player{filteredPlayers.length !== 1 ? 's' : ''} found
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <kbd className="text-xs">↑↓</kbd> navigate • <kbd className="text-xs">Enter</kbd> select
                      </span>
                    </div>
                    
                    {/* 搜索结果列表 */}
                    <div className="max-h-64 overflow-y-auto">
                      {filteredPlayers.map((player, index) => (
                        <div
                          key={player.id}
                          className={`dropdown-item px-4 py-3 cursor-pointer transition-all duration-200 border-b border-gray-100 last:border-b-0 ${
                            index === selectedIndex 
                              ? 'bg-blue-50 border-l-4 border-l-blue-500 text-blue-900' 
                              : 'hover:bg-gray-50 text-gray-800'
                          }`}
                          onClick={() => handleSelectPlayer(player)}
                          onMouseEnter={() => setSelectedIndex(index)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-base">
                              {/* 高亮匹配的文本 */}
                              {searchTerm ? (
                                <>
                                  {player.name.substring(0, player.name.toLowerCase().indexOf(searchTerm.toLowerCase()))}
                                  <span className={`${index === selectedIndex ? 'bg-blue-200 text-blue-900' : 'bg-yellow-200 text-yellow-800'} px-1 rounded font-semibold`}>
                                    {player.name.substring(
                                      player.name.toLowerCase().indexOf(searchTerm.toLowerCase()),
                                      player.name.toLowerCase().indexOf(searchTerm.toLowerCase()) + searchTerm.length
                                    )}
                                  </span>
                                  {player.name.substring(player.name.toLowerCase().indexOf(searchTerm.toLowerCase()) + searchTerm.length)}
                                </>
                              ) : (
                                player.name
                              )}
                            </div>
                            <div className={`text-xs font-medium ${index === selectedIndex ? 'text-blue-600' : 'text-gray-400'}`}>
                              {index === selectedIndex ? '→' : ''}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* 底部提示 */}
                    {filteredPlayers.length === 8 && (
                      <div className="px-4 py-2 bg-yellow-50 border-t border-yellow-200 text-xs text-yellow-700 text-center">
                        ⚡ Showing first 8 results • Type more to narrow down
                      </div>
                    )}
                  </>
                ) : (
                  <div className="px-6 py-8 text-center">
                    <div className="text-4xl mb-3 opacity-50">🔍</div>
                    <p className="text-gray-500 text-base font-medium mb-1">No players found</p>
                    <p className="text-gray-400 text-sm">Try a different search term</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 自动完成提示 - 移到相对容器外部 */}
          {autocompleteSuggestion && !showDropdown && (
            <div className="autocomplete-hint absolute top-full left-0 right-0 mt-1 z-40">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Press <kbd>Tab</kbd> or <kbd>→</kbd> to complete: 
                  <strong className="ml-2 text-blue-600">{autocompleteSuggestion}</strong>
                </span>
                <button
                  onClick={acceptAutocompletion}
                  className="text-blue-500 hover:text-blue-700 font-medium text-sm transition-colors duration-200 px-3 py-1 rounded-lg hover:bg-blue-50"
                >
                  Accept
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 搜索提示 */}
        {!searchTerm && (
          <div className="mt-6 text-center text-gray-500 text-sm space-y-2">
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg">💡</span>
              <span>Start typing a player's name to see search suggestions</span>
            </div>
            <div className="text-xs flex items-center justify-center gap-4 bg-gray-50 rounded-lg py-2 px-4 max-w-md mx-auto">
              <span className="flex items-center gap-1">
                <kbd>Tab</kbd> autocomplete
              </span>
              <span className="flex items-center gap-1">
                <kbd>↑↓</kbd> navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd>Enter</kbd> select
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 空状态显示 */}
      {!searchTerm && (
        <div className="text-center py-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl border-2 border-dashed border-blue-200 relative overflow-hidden mt-8">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 to-purple-400/5"></div>
          <div className="relative z-10">
            <div className="text-8xl mb-6 animate-pulse">⌨️</div>
            <p className="text-gray-600 text-3xl font-bold mb-3">Ready to make your guess?</p>
            <p className="text-gray-500 text-lg mb-6">Use the search box above to find and select a player</p>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 max-w-md mx-auto border border-white/50">
              <p className="text-sm text-gray-600 font-medium">🔥 Pro tip: Use keyboard shortcuts for faster searching!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerList;
