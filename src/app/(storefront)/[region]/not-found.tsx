import type { Metadata } from "next";
import NotFoundContent from "@/components/ui/NotFoundContent";

export const metadata: Metadata = {
  title: "صفحه پیدا نشد",
  robots: { index: false, follow: false },
};

export default function RegionNotFound() {
  return <NotFoundContent />;
}