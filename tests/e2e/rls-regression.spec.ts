import { test, expect } from "@playwright/test";

test("RLS regression (service_role RPC)", async ({ request }) => {
  const token = process.env.RLS_REGRESSION_ADMIN_TOKEN;
  expect(token, "RLS_REGRESSION_ADMIN_TOKEN must be set").toBeTruthy();

  const res = await request.post("/api/admin/rls-regression", {
    headers: {
      "content-type": "application/json",
      "x-admin-token": token!,
    },
    data: { target: "all" },
  });

  const body = await res.json().catch(() => null);

  expect(
    res.status(),
    `status=${res.status()} body=${JSON.stringify(body)}`
  ).toBe(200);

  expect(
    body?.ok,
    `body=${JSON.stringify(body)}`
  ).toBe(true);

  // 任意：結果の形だけ軽くチェック（必要なら強化）
  expect(body?.result).toBeTruthy();
});