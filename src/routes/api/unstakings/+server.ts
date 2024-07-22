import { getPaginatedUnstakings } from "$lib/db";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ url, locals }) => {
  const { db } = locals;

  const res = await getPaginatedUnstakings(
    db,
    url.searchParams.get("limit"),
    url.searchParams.get("prevDelegate"),
    url.searchParams.get("prevTimestamp"),
    null
  );

  if (res.error != null) {
    return json({ error: res.error }, { status: res.status });
  }

  return json(res.data);
};
