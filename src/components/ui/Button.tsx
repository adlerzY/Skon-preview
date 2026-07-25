import React from "react";
import Link from "next/link";

type BaseProps = {
  variant?: "primary" | "icon" | "ghost";
  children: React.ReactNode;
  className?: string;
};

type ButtonAsButton = BaseProps & React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: never };
type ButtonAsLink = BaseProps & React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

type ButtonProps = ButtonAsButton | ButtonAsLink;

export default function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  const baseStyles = "focus:outline-none flex items-center justify-center font-bold select-none cursor-pointer";

  const variants = {
    primary: "bg-brand-blue border border-transparent hover:border-brand-white text-brand-white px-8 py-2 text-sm",
    icon: "bg-brand-bg hover:border-brand-surface_m text-m_khonsa hover:text-brand-white p-2 opacity-0 group-hover:opacity-100 border border-brand-surface disabled:bg-opacity-50 disabled:pointer-events-none",
    ghost: "text-gray-500 hover:text-brand-blue",
  };

  const combinedClasses = `${baseStyles} ${variants[variant]} ${className}`;

  if (props.href) {
    const { href, ...anchorProps } = props as ButtonAsLink;
    return (
      <Link href={href} className={combinedClasses} {...anchorProps}>
        {children}
      </Link>
    );
  }

  const buttonProps = props as ButtonAsButton;
  return (
    <button className={combinedClasses} {...buttonProps}>
      {children}
    </button>
  );
}