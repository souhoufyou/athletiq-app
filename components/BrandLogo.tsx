type BrandLogoProps = {
  className?: string;
  priority?: boolean;
  variant?: "icon" | "wordmark";
};

export function BrandLogo({ className = "", variant = "icon" }: BrandLogoProps) {
  if (variant === "wordmark") {
    return (
      <div className={`brand-wordmark ${className}`} aria-label="AthletIQ IA">
        <LogoMark className="brand-wordmark-mark" />
        <span className="brand-wordmark-text">
          ATHLET<span>IQ</span>
        </span>
        <span className="brand-wordmark-ai">IA</span>
      </div>
    );
  }

  return (
    <span className={`brand-icon ${className}`} aria-label="AthletIQ IA">
      <LogoMark className="brand-icon-svg" />
    </span>
  );
}

function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 64 64" aria-hidden="true">
      <path
        d="M7.5 52.5 34.4 7.8l7.9 17.7-10.7 4.2-7.8 13.7 24.8-12.1 7.9 7.1-41.4 18.9 13-18.2-20.6 13.4Z"
        fill="currentColor"
      />
      <path
        d="M28.1 39.1 48.6 31.3 22.8 56.6H7.5l20.6-17.5Z"
        fill="currentColor"
      />
    </svg>
  );
}
