import { getHeaderPublicNavigationData } from "@/lib/graphql";
import HeaderMenuSwitcher from "./HeaderMenuSwitcher";

export default async function HeaderMenuSwitcherAsync() {
  const { shopItems, blogItems } = await getHeaderPublicNavigationData().catch(() => ({
    shopItems: [],
    blogItems: [],
  }));
  return <HeaderMenuSwitcher shopItems={shopItems} blogItems={blogItems} />;
}