import { cloudFetch } from "./cloudSync";

export type SlowNotice = {
  id: string;
  version: number;
  kind: "invite" | "turn" | "membership" | "update" | "friend";
  title: string;
  roomKind: string;
  updatedAt: string;
};
export const toolboxOrigin =
  import.meta.env.VITE_TOOLBOX_URL || "https://tools.wyanhub.com";
export function slowNoticeURL(notice: Pick<SlowNotice, "id" | "kind">): string {
  return `${toolboxOrigin}${notice.kind === "friend" || !/^[a-f0-9]{32}$/.test(notice.id) ? "/relax/slow?view=friends" : `/relax/slow/${notice.id}`}`;
}
export function parseSlowNotices(value: unknown): SlowNotice[] {
  if (!Array.isArray(value)) throw new Error("消息格式异常，请稍后重试");
  return value
    .slice(0, 100)
    .filter((n): n is SlowNotice =>
      Boolean(
        n &&
        typeof n === "object" &&
        typeof n.id === "string" &&
        (n.kind === "friend"
          ? n.id.startsWith("friend:")
          : /^[a-f0-9]{32}$/.test(n.id)) &&
        ["invite", "turn", "membership", "update", "friend"].includes(n.kind) &&
        Number.isSafeInteger(n.version) &&
        n.version >= 1 &&
        typeof n.title === "string" &&
        n.title.length <= 200 &&
        typeof n.updatedAt === "string",
      ),
    );
}
export async function fetchSlowNotices(
  signal?: AbortSignal,
): Promise<SlowNotice[]> {
  const response = await cloudFetch("/api/desk/relax/notifications", {
    signal,
    cache: "no-store",
    redirect: "manual",
    headers: { Accept: "application/json" },
  });
  if (
    !response.ok ||
    !response.headers.get("content-type")?.includes("application/json")
  )
    throw new Error(
      response.status === 401 ? "登录已过期，请重新登录" : "暂时无法读取消息",
    );
  return parseSlowNotices(await response.json());
}
export async function readSlowNotice(
  notice: SlowNotice,
  signal?: AbortSignal,
): Promise<void> {
  if (notice.kind === "friend") return;
  if (!/^[a-f0-9]{32}$/.test(notice.id)) throw new Error("无效消息");
  const response = await cloudFetch(
    `/api/desk/relax/notifications/${notice.id}/read`,
    {
      method: "POST",
      signal,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ version: notice.version }),
    },
  );
  if (!response.ok) throw new Error("标记已读失败，请重试");
}
