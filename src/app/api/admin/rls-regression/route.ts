import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  unauthorizedError,
  validationError,
  handleDatabaseError,
} from "@/lib/api/error-responses";

type Target = "public" | "admin_e2e" | "all";

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is missing");
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing");

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-admin-token");
  if (!token || token !== process.env.RLS_REGRESSION_ADMIN_TOKEN) {
    return unauthorizedError("Invalid admin token");
  }

  let body: { target?: Target } = {};
  try {
    body = await req.json();
  } catch {
    // ignore invalid json
  }

  const target: Target = body.target ?? "all";
  if (!["public", "admin_e2e", "all"].includes(target)) {
    return validationError([{ field: "target", message: "Invalid target value" }]);
  }

  const supabase = getServerSupabase();
  const { data, error } = await supabase.rpc("run_rls_regression_tests", { target });

  if (error) {
    return handleDatabaseError(error);
  }

  return NextResponse.json({ ok: true, target, result: data }, { status: 200 });
}