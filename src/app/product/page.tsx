import { permanentRedirect } from "next/navigation";
import { SEO_REGION } from "@/lib/seo/site";

export default function LegacyProductArchivePage() {
  permanentRedirect(`/${SEO_REGION}`);
}
