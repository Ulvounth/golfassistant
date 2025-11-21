import { Pencil } from 'lucide-react';
import { GolfRound } from '@/types';
import { formatDate, getScoreColor, formatScoreDiff } from '@/utils/formatters';
import { TeeColorBadge } from './TeeColorBadge';

interface RoundCardProps {
  round: GolfRound;
  showEditButton?: boolean;
  onEdit?: (roundId: string) => void;
  playerNames?: Record<string, string>;
}

/**
 * RoundCard - Reusable card component for displaying golf round information
 */
export function RoundCard({ round, showEditButton, onEdit, playerNames }: RoundCardProps) {
  return (
    <div className="border rounded-lg p-4 hover:bg-gray-50">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h4 className="font-semibold text-lg">{round.courseName}</h4>
          <p className="text-sm text-gray-600">{formatDate(round.date)}</p>
        </div>
        <div className="flex items-start gap-3">
          <div className="text-right">
            <p className={`text-2xl font-bold ${getScoreColor(round.totalScore, round.totalPar)}`}>
              {round.totalScore}
            </p>
            <p className="text-sm text-gray-600">
              Par {round.totalPar} • {formatScoreDiff(round.totalScore, round.totalPar)}
            </p>
          </div>
          {showEditButton && onEdit && (
            <button
              onClick={() => onEdit(round.id)}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit round"
            >
              <Pencil className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-4 text-sm text-gray-600 mt-2">
        <span>
          <TeeColorBadge color={round.teeColor} />
        </span>
        <span>• {round.numberOfHoles} holes</span>
        <span>• Differential: {round.scoreDifferential.toFixed(1)}</span>
      </div>

      {round.players && round.players.length > 0 && playerNames && (
        <div className="mt-2 pt-2 border-t text-sm text-gray-600">
          <span className="font-medium">👥 Played with: </span>
          <span className="ml-1">
            {round.players.map(playerId => playerNames[playerId] || 'Loading...').join(', ')}
          </span>
        </div>
      )}
    </div>
  );
}
