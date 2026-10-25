import { describe, expect, it } from "vitest";
import { parseSlowNotices, slowNoticeURL } from "./slowMessages";
describe("slow notice links and envelope", () => {
  const notice = {
    id: "a".repeat(32),
    version: 2,
    kind: "turn",
    title: "有空再来",
    roomKind: "gomoku",
    updatedAt: "2026-10-24T12:00:00Z",
  };
  it("only accepts known kinds and bounded private room identifiers", () => {
    expect(parseSlowNotices([notice])).toHaveLength(1);
    expect(parseSlowNotices([{ ...notice, kind: "update" }])).toHaveLength(1);
    expect(
      parseSlowNotices([
        { ...notice, id: "https://evil.invalid" },
        { ...notice, kind: "script" },
        { ...notice, version: NaN },
      ]),
    ).toEqual([]);
    expect(() => parseSlowNotices({})).toThrow();
  });
  it("constructs fixed product links without server supplied URLs or identity", () => {
    expect(slowNoticeURL({ id: notice.id, kind: "turn" })).toContain(
      "/relax/slow/" + notice.id,
    );
    expect(slowNoticeURL({ id: "friend:alice", kind: "friend" })).toContain(
      "/relax/slow?view=friends",
    );
    expect(slowNoticeURL({ id: "../../x", kind: "turn" })).not.toContain("../");
  });
});
