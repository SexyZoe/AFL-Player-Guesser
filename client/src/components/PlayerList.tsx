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
    searchTerm ? player.name.toLowerCase().includes(searchTerm.toLowerCase()) : true
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
    if (!showDropdown) {
      if (e.key === 'ArrowDown' && filteredPlayers.length > 0) {
        e.preventDefault();
        setShowDropdown(true);
        setSelectedIndex(0);
      }
      return;
    }
    
    if (filteredPlayers.length === 0) {
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
    setShowDropdown(true); // 始终显示下拉菜单
    
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
    setShowDropdown(true);
    if (filteredPlayers.length > 0) {
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

  // 处理下拉菜单点击
  const handleDropdownClick = (e: React.MouseEvent) => {
    // 如果点击的是搜索框，不要阻止事件
    if ((e.target as Element).classList.contains('custom-dropdown-searchbox')) {
      return;
    }
    
    // 切换下拉菜单显示状态
    setShowDropdown(!showDropdown);
    
    // 如果打开下拉菜单，聚焦搜索框
    if (!showDropdown) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
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
          {/* 新的自定义下拉菜单 */}
          <div className="relative">
            <div 
              className={`custom-dropdown-select ${showDropdown ? 'open' : ''}`}
              onClick={handleDropdownClick}
            >
              <span className={`custom-dropdown-current ${!searchTerm ? 'placeholder' : ''}`}>
                {searchTerm || 'Search for any AFL player...'}
              </span>
              
              {/* 自定义下拉列表 */}
              <div className="custom-dropdown-list">
                {/* 搜索框 */}
                <div className="custom-dropdown-search">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search for any AFL player..."
                    className="custom-dropdown-searchbox"
                    value={searchTerm}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    onKeyDown={handleKeyDown}
                    autoComplete="off"
                  />
                </div>
                
                {/* 搜索结果 */}
                {filteredPlayers.length > 0 ? (
                  <div>
                    {filteredPlayers.map((player, index) => (
                      <div
                        key={player.id}
                        className={`custom-dropdown-option ${
                          index === selectedIndex ? 'selected' : ''
                        }`}
                        onClick={() => handleSelectPlayer(player)}
                        onMouseEnter={() => setSelectedIndex(index)}
                      >
                        {/* 高亮匹配的文本 */}
                        {searchTerm && player.name.toLowerCase().includes(searchTerm.toLowerCase()) ? (
                          <>
                            {player.name.substring(0, player.name.toLowerCase().indexOf(searchTerm.toLowerCase()))}
                            <span className="custom-dropdown-highlight">
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
                    ))}
                    
                    {/* 底部提示 */}
                    {filteredPlayers.length === 8 && (
                      <div className="mx-2 mb-2 px-4 py-3 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 text-sm text-yellow-700 text-center rounded-lg font-medium">
                        ⚡ Showing first 8 results • Type more to narrow down
                      </div>
                    )}
                  </div>
                ) : searchTerm ? (
                  <div className="mx-2 mb-2 px-6 py-8 text-center bg-gradient-to-b from-white to-gray-50 rounded-lg border border-gray-200">
                    <div className="text-4xl mb-3 opacity-60">🔍</div>
                    <p className="text-gray-600 text-base font-semibold mb-2">No players found</p>
                    <p className="text-gray-500 text-sm">Try a different search term</p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* 搜索提示 */}
        {!searchTerm && (
          <div className="mt-6 text-center text-gray-500 text-sm space-y-2">
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg">💡</span>
              <span>Click the dropdown to start searching for players</span>
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
    </div>
  );
};

export default PlayerList;
