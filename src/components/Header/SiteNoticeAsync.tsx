import SiteNotice from "./SiteNotice";

type SiteNoticeValue = { title: string; message: string } | null;

export default async function SiteNoticeAsync({
  noticePromise,
  desktop = false,
}: {
  noticePromise: Promise<SiteNoticeValue>;
  desktop?: boolean;
}) {
  const notice = await noticePromise;
  if (!notice) return null;
  return <SiteNotice title={notice.title} message={notice.message} desktop={desktop} />;
}
