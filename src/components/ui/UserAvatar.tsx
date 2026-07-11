import Image from "next/image";

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  ring?: boolean;
  className?: string;
}

const SIZE_MAP: Record<NonNullable<UserAvatarProps["size"]>, number> = {
  xs: 24,
  sm: 32,
  md: 44,
  lg: 64,
  xl: 96,
};

const TEXT_SIZE_MAP: Record<NonNullable<UserAvatarProps["size"]>, string> = {
  xs: "text-[10px]",
  sm: "text-xs",
  md: "text-sm",
  lg: "text-xl",
  xl: "text-3xl",
};

function getInitial(name?: string | null) {
  if (!name) return "؟";
  return name.trim().charAt(0).toUpperCase();
}

export default function UserAvatar({ src, name, size = "md", ring = false, className = "" }: UserAvatarProps) {
  const px = SIZE_MAP[size];

  return (
    <div
      style={{ width: px, height: px }}
      className={`relative shrink-0 rounded-full overflow-hidden bg-brand-blue/10 border ${
        ring ? "border-2 border-brand-blue shadow-[0_0_0_3px_rgba(0,116,224,0.15)]" : "border-brand-surface_hover"
      } transition-all duration-200 ${className}`}
    >
      {src ? (
        <Image src={src} alt={name || "avatar"} fill sizes={`${px}px`} className="object-cover" />
      ) : (
        <div className={`w-full h-full flex items-center justify-center font-black text-brand-blue ${TEXT_SIZE_MAP[size]}`}>
          {getInitial(name)}
        </div>
      )}
    </div>
  );
}