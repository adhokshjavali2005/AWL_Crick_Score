interface ScoreButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'boundary' | 'out' | 'undo';
  disabled?: boolean;
}

const ScoreButton = ({ label, onClick, variant = 'default', disabled }: ScoreButtonProps) => {
  const variants = {
    default: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/50',
    boundary: 'bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30',
    out: 'bg-destructive/20 text-destructive hover:bg-destructive/30 border border-destructive/30',
    undo: 'bg-accent/20 text-accent hover:bg-accent/30 border border-accent/30',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`score-button transition-all active:scale-90 hover:scale-[1.04] ${variants[variant]} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      {label}
    </button>
  );
};

export default ScoreButton;
