import { useNavigate } from 'react-router-dom';
import { Users, Calendar, ToggleLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RefIDCardProps {
  refID: {
    code:           string;
    jobTitle:       string;
    accessDuration: number;
    isActive:       boolean;
    candidateCount: number;
    createdAt:      string;
  };
}

export function RefIDCard({ refID }: RefIDCardProps) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(`/company/refid/${refID.code}`)}
      className="w-full text-left border rounded-lg p-4 hover:bg-muted/40 transition-colors group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn(
              'inline-block w-2 h-2 rounded-full shrink-0',
              refID.isActive ? 'bg-green-500' : 'bg-muted-foreground'
            )} />
            <p className="font-semibold text-sm truncate">{refID.jobTitle}</p>
          </div>
          <p className="text-xs text-muted-foreground font-mono mb-3">{refID.code}</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {refID.candidateCount} candidate{refID.candidateCount !== 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {refID.accessDuration} day access
            </span>
            <span className="flex items-center gap-1">
              <ToggleLeft className="w-3 h-3" />
              {refID.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground mt-1 group-hover:translate-x-0.5 transition-transform shrink-0" />
      </div>
    </button>
  );
}
