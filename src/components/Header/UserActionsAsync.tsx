"use client";

import UserActions from "./UserActions";
import { useHeaderViewer } from "./HeaderViewerProvider";

export default function UserActionsAsync() {
  const { user, loading } = useHeaderViewer();
  return <UserActions user={user} loading={loading} />;
}
