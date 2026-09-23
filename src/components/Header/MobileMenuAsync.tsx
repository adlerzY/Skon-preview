import { getHeaderRegionsData } from "@/lib/graphql";
import MobileMenu from "./MobileMenu";

export default function MobileMenuAsync({
  activeRegion,
  siteNoticePromise,
}: {
  activeRegion: string;
  siteNoticePromise: Promise<{ title: string; message: string } | null>;
}) {
  const regionsPromise = getHeaderRegionsData()
    .then(({ regions }) => regions)
    .catch(() => []);

  return (
    <MobileMenu
      activeRegion={activeRegion}
      siteNoticePromise={siteNoticePromise}
      regionsPromise={regionsPromise}
    />
  );
}
