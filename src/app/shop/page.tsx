import { permanentRedirect } from "next/navigation";
import { SEO_REGION } from "@/lib/seo/site";

export default function LegacyShopPage() {
  permanentRedirect(`/${SEO_REGION}`);
}
