import Image from "next/image";

const GRID_SIZES =
  "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw";

export default function ProductCardImage({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={GRID_SIZES}
      quality={65}
      className="rounded-none object-cover brightness-[0.99] group-hover:brightness-110 transition-[filter] duration-200"
    />
  );
}