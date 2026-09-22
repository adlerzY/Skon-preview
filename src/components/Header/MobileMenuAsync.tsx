import { getHeaderPublicNavigationData, getHeaderRegionsData } from "@/lib/graphql";
import MobileMenu from "./MobileMenu";

export default function MobileMenuAsync({
  activeRegion,
  siteNotice,
}: {
  activeRegion: string;
  siteNotice: { title: string; message: string } | null;
}) {
  // Start public navigation and region data independently. The mobile drawer
  // only consumes them when the user opens it, so neither one blocks the
  // initial mobile header shell.
  const navigationPromise = getHeaderPublicNavigationData().catch(() => ({
    shopItems: [],
    blogItems: [],
  }));
  const regionsPromise = getHeaderRegionsData()
    .then(({ regions }) => regions)
    .catch(() => []);
  const drawerDataPromise = navigationPromise.then(({ shopItems, blogItems }) => ({
    shopItems,
    blogItems,
    user: null,
  }));

  return (
    <MobileMenu
      activeRegion={activeRegion}
      siteNotice={siteNotice}
      regionsPromise={regionsPromise}
      drawerDataPromise={drawerDataPromise}
    />
  );
}
