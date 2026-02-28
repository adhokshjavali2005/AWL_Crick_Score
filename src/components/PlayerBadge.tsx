import { X } from 'lucide-react';

interface PlayerBadgeProps {
  name: string;
  onRemove?: () => void;
  isActive?: boolean;
  role?: string;
}

const PlayerBadge = ({ name, onRemove, isActive, role }: PlayerBadgeProps) => (
  <div
    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
      ${isActive
        ? 'bg-primary/20 text-primary border border-primary/30'
        : 'bg-secondary text-secondary-foreground border border-border/50'
      }`}
  >
    {name}
    {role && <span className="text-[10px] uppercase tracking-wider text-muted-foreground ml-1">({role})</span>}
    {onRemove && (
      <button onClick={onRemove} className="ml-1 hover:text-destructive transition-colors">
        <X className="w-3 h-3" />
      </button>
    )}
  </div>
);

export default PlayerBadge;
