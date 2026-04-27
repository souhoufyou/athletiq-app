type BrandMarkProps = {
  compact?: boolean;
};

export function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="brand-icon" aria-hidden="true">
        A
      </div>
      {!compact ? (
        <div className="leading-none">
          <p className="brand-wordmark">AthletIQ</p>
          <p className="mt-1 text-[10px] font-black uppercase text-white/42">adaptive training</p>
        </div>
      ) : null}
    </div>
  );
}
