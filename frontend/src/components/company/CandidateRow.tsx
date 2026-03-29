import { useNavigate } from 'react-router-dom';
import { Clock, ChevronRight } from 'lucide-react';

interface CandidateRowProps {
  permission: {
    _id:      string;
    userId: {
      _id:         string;
      displayName: string;
      email:       string;
    };
    grantedAt:  string;
    expiresAt:  string;
    isRevoked:  boolean;
  };
  refCode: string;
}

export function CandidateRow({ permission, refCode }: CandidateRowProps) {
  const navigate  = useNavigate();
  const isExpired = new Date(permission.expiresAt) < new Date();
  const status    = permission.isRevoked ? 'Revoked' : isExpired ? 'Expired' : 'Active';
  const statusColor = permission.isRevoked || isExpired ? 'text-muted-foreground' : 'text-green-500';

  return (
    <button
      type="button"
      onClick={() => navigate(`/company/candidate/${permission.userId._id}?permission=${permission._id}`)}
      className="w-full flex items-center justify-between px-4 py-3 border-b last:border-0 hover:bg-muted/30 transition-colors group"
    >
      <div className="text-left">
        <p className="text-sm font-medium">{permission.userId.displayName}</p>
        <p className="text-xs text-muted-foreground">{permission.userId.email}</p>
      </div>
      <div className="flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1 text-muted-foreground">
          <Clock className="w-3 h-3" />
          {new Date(permission.grantedAt).toLocaleDateString()}
        </span>
        <span className={statusColor}>{status}</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
      </div>
    </button>
  );
}
