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
 * RoundCard - Redesigned card component with better mobile UX
 */
export function RoundCard({ round, showEditButton, onEdit, playerNames }: RoundCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200 hover:border-primary-300">
      {/* Header with course and date */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-lg text-gray-900 truncate">{round.courseName}</h4>
          <p className="text-sm text-gray-500 mt-0.5">{formatDate(round.date)}</p>
        </div>
        {showEditButton && onEdit && (
          <button
            onClick={() => onEdit(round.id)}
            className="ml-2 p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors flex-shrink-0"
            title="Edit round"
            aria-label="Edit round"
          >
            <Pencil className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Score section - prominent display */}
      <div className="flex items-center justify-between mb-3 p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
        <div className="flex items-baseline gap-2">
          <span className={`text-4xl font-bold ${getScoreColor(round.totalScore, round.totalPar)}`}>
            {round.totalScore}
          </span>
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 uppercase tracking-wide">Score</span>
            <span
              className={`text-sm font-semibold ${getScoreColor(round.totalScore, round.totalPar)}`}
            >
              {formatScoreDiff(round.totalScore, round.totalPar)}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold text-gray-400">{round.totalPar}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Par</div>
        </div>
      </div>

      {/* Details - mobile optimized */}
      <div className="flex flex-wrap gap-2 mb-2">
        <TeeColorBadge color={round.teeColor} />
        <span className="inline-flex items-center px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
          {round.numberOfHoles} holes
        </span>
        <span className="inline-flex items-center px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-full">
          Diff: {round.scoreDifferential.toFixed(1)}
        </span>
      </div>

      {/* Players - if present */}
      {round.players && round.players.length > 0 && playerNames && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-start gap-2 text-sm">
            <span className="text-gray-400 flex-shrink-0">👥</span>
            <span className="text-gray-600 leading-relaxed">
              <span className="font-medium text-gray-700">Played with:</span>{' '}
              {round.players.map(playerId => playerNames[playerId] || 'Loading...').join(', ')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
