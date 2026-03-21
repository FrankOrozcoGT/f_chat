interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
}

export const StatCard = ({ label, value, subtext, icon }: StatCardProps) => {
  return (
    <div className="bg-bg-secondary border border-border-primary rounded-lg p-4 md:p-6 shadow-sm flex flex-col items-center justify-between text-center gap-2">
      <div className="flex items-center justify-between w-full gap-2">
        <p className="text-xs md:text-sm text-text-secondary font-medium">{label}</p>
        {icon && <div className="text-text-tertiary shrink-0">{icon}</div>}
      </div>
      <p className="text-2xl md:text-3xl font-bold text-text-primary">{value}</p>
      {subtext ? (
        <p className="text-xs text-text-tertiary">{subtext}</p>
      ) : (
        <span className="text-xs opacity-0">-</span>
      )}
    </div>
  );
};
