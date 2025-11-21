import { useState } from 'react';
import { X } from 'lucide-react';
import { userService, UserSearchResult } from '@/services/userService';
import { UserAvatar } from './UserAvatar';
import { formatHandicap } from '@/utils/formatters';

interface PlayerSearchProps {
  selectedPlayers: UserSearchResult[];
  onAddPlayer: (player: UserSearchResult) => void;
  onRemovePlayer: (playerId: string) => void;
  currentUserId?: string;
  label?: string;
}

/**
 * PlayerSearch - Reusable component for searching and selecting players
 */
export function PlayerSearch({
  selectedPlayers,
  onAddPlayer,
  onRemovePlayer,
  currentUserId,
  label = 'Who played with you? (optional)',
}: PlayerSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const results = await userService.searchUsers(query);
      // Filter out current user and already selected players
      const filtered = results.filter(
        user => user.id !== currentUserId && !selectedPlayers.find(p => p.id === user.id)
      );
      setSearchResults(filtered);
    } catch (error) {
      console.error('Failed to search users:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleAddPlayer = (player: UserSearchResult) => {
    onAddPlayer(player);
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>

      {/* Selected players */}
      {selectedPlayers.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {selectedPlayers.map(player => (
            <div
              key={player.id}
              className="inline-flex items-center gap-2 px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm"
            >
              <span>
                {player.firstName} {player.lastName}
              </span>
              <button
                type="button"
                onClick={() => onRemovePlayer(player.id)}
                className="hover:text-primary-900"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <input
          type="text"
          className="input"
          placeholder="Search for users..."
          value={searchQuery}
          onChange={e => handleSearch(e.target.value)}
        />

        {/* Search results dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {searchResults.map(user => (
              <button
                key={user.id}
                type="button"
                onClick={() => handleAddPlayer(user)}
                className="w-full px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-left"
              >
                <UserAvatar firstName={user.firstName} lastName={user.lastName} size="sm" />
                <div className="flex-1">
                  <p className="font-medium">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-sm text-gray-600">Handicap: {formatHandicap(user.handicap)}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* No results message */}
        {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-orange-200 rounded-lg shadow-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-orange-500 text-lg">⚠️</span>
              <div>
                <p className="font-medium text-gray-900 mb-1">No users found</p>
                <p className="text-sm text-gray-600">
                  The player "{searchQuery}" is not registered in the system. Only registered users
                  can be added to a round.
                </p>
              </div>
            </div>
          </div>
        )}

        {searching && <div className="absolute right-3 top-3 text-gray-400">Searching...</div>}
      </div>

      <p className="text-xs text-gray-500 mt-1">
        Search for users who played in the round (minimum 2 characters)
      </p>
    </div>
  );
}
