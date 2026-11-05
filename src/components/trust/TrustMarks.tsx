interface TrustMarksProps {
  variant?: "footer" | "support";
  className?: string;
}

const ENAMAD_LINK =
  "https://trustseal.enamad.ir/?id=590925&Code=uDFad4CdGO1BxiP8jHv9WRnIQl2h7lwX";

const ENAMAD_IMAGE =
  "https://trustseal.enamad.ir/logo.aspx?id=590925&Code=uDFad4CdGO1BxiP8jHv9WRnIQl2h7lwX";

export default function TrustMarks({
  variant = "footer",
  className = "",
}: TrustMarksProps) {
  const isFooter = variant === "footer";

  const markSize = isFooter
    ? "w-[64px] h-[64px]"
    : "w-[82px] h-[82px]";

  return (
    <div
      dir="ltr"
      className={`flex flex-wrap items-center gap-3 ${className}`}
    >
      <a
        href={ENAMAD_LINK}
        target="_blank"
        rel="noopener"
        referrerPolicy="origin"
        aria-label="نماد اعتماد الکترونیکی"
        className={`${markSize} shrink-0 flex items-center justify-center overflow-hidden`}
      >
        <img
          referrerPolicy="origin"
          src={ENAMAD_IMAGE}
          alt=""
          code="uDFad4CdGO1BxiP8jHv9WRnIQl2h7lwX"
          loading="lazy"
          className="max-w-full max-h-full object-contain"
        />
      </a>

      <div
        aria-hidden="true"
        className={`${markSize} shrink-0 border border-brand-surface_hover bg-brand-surface/50`}
      />

      <div
        aria-hidden="true"
        className={`${markSize} shrink-0 border border-brand-surface_hover bg-brand-surface/50`}
      />
    </div>
  );
}