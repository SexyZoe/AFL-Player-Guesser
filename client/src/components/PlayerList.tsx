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
  ).slice(0, 8); // limit to the first 8 results

  // Generate autocomplete suggestion
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

  // Close dropdown when clicking outside
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

  // Handle keyboard navigation
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
        // Tab to accept autocomplete
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

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setSelectedIndex(-1);
    setShowDropdown(true); // always show dropdown
    
    // Simulate loading effect
    if (value.length > 0) {
      setIsLoading(true);
      setTimeout(() => setIsLoading(false), 200);
    }
  };

  // Handle player selection
  const handleSelectPlayer = (player: Player) => {
    onSelectPlayer(player);
    setSearchTerm('');
    setSelectedIndex(-1);
    setAutocompleteSuggestion('');
    setShowDropdown(false);
    inputRef.current?.blur();
  };

  // Handle input focus
  const handleInputFocus = () => {
    setShowDropdown(true);
    if (filteredPlayers.length > 0) {
      setSelectedIndex(0);
    }
  };

  // Handle search button click
  const handleSearchClick = () => {
    if (filteredPlayers.length > 0) {
      handleSelectPlayer(filteredPlayers[0]);
    }
  };

  // Accept autocomplete suggestion
  const acceptAutocompletion = () => {
    if (autocompleteSuggestion) {
      setSearchTerm(autocompleteSuggestion);
      setAutocompleteSuggestion('');
      setShowDropdown(false);
    }
  };

  // Handle dropdown click
  const handleDropdownClick = (e: React.MouseEvent) => {
    // Don't stop propagation when clicking the searchbox itself
    if ((e.target as Element).classList.contains('custom-dropdown-searchbox')) {
      return;
    }
    
    // Toggle dropdown open state
    setShowDropdown(!showDropdown);
    
    // When opening the dropdown, focus the searchbox
    if (!showDropdown) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Search area */}
      <div className="search-wrapper">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-3 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Select Player
          </h2>
          <p className="text-gray-600 text-lg font-medium">Type a player's name to search and select</p>
        </div>

        <div className="relative w-full max-w-2xl mx-auto" ref={searchRef}>
          {/* Custom dropdown */}
          <div className="relative">
            <div 
              className={`custom-dropdown-select ${showDropdown ? 'open' : ''}`}
              onClick={handleDropdownClick}
            >
              <span className={`custom-dropdown-current ${!searchTerm ? 'placeholder' : ''}`}>
                {searchTerm || 'Search for any AFL player...'}
              </span>
              
              {/* Dropdown list */}
              <div className="custom-dropdown-list">
                {/* Search box */}
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
                
                {/* Search results */}
                {filteredPlayers.length > 0 ? (
                  <div>
                    {filteredPlayers.map((player, index) => (
                      <div
                        key={player._id || player.id || index}
                        className={`custom-dropdown-option ${
                          index === selectedIndex ? 'selected' : ''
                        }`}
                        onClick={() => handleSelectPlayer(player)}
                        onMouseEnter={() => setSelectedIndex(index)}
                      >
                        {/* Highlight matched substring */}
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
                    
                    {/* Footer hint */}
                    {filteredPlayers.length === 8 && (
                      <div className="mx-2 mb-2 px-4 py-3 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 text-sm text-yellow-700 text-center rounded-lg font-medium">
                        ⚡ Showing first 8 results 
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


      </div>
    </div>
  );
};

export default PlayerList;
