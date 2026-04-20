// GET /api/copilot-quota — fetch Copilot usage/quota info from GitHub API

import type { Context } from "hono";
import { githubHeaders } from "../lib/copilot.ts";
import { getGithubCredentials } from "../lib/github.ts";

interface QuotaDetail {
  entitlement: number;
  overage_count: number;
  overage_permitted: boolean;
  percent_remaining: number;
  quota_id: string;
  quota_remaining: number;
  remaining: number;
  unlimited: boolean;
}

interface CopilotUsageResponse {
  access_type_sku: string;
  analytics_tracking_id: string;
  assigned_date: string;
  can_signup_for_limited: boolean;
  chat_enabled: boolean;
  copilot_plan: string;
  organization_login_list: unknown[];
  organization_list: unknown[];
  quota_reset_date: string;
  quota_snapshots: {
    chat: QuotaDetail;
    completions: QuotaDetail;
    premium_interactions: QuotaDetail;
  };
}

export const copilotQuota = async (c: Context) => {
  try {
    const { token: githubToken } = await getGithubCredentials();

    const resp = await fetch(
      "https://api.github.com/copilot_internal/user",
      { headers: await githubHeaders(githubToken) },
    );

    if (!resp.ok) {
      const text = await resp.text();
      // Map upstream 401/403 to 502 so the dashboard client doesn't confuse
      // "GitHub credential issue" with "your dashboard auth is invalid" and logout.
      const status = resp.status === 401 || resp.status === 403 ? 502 : resp.status;
      return c.json(
        { error: `GitHub API error: ${resp.status} ${text}` },
        status as 400 | 404 | 500 | 502,
      );
    }

    const data = (await resp.json()) as CopilotUsageResponse;
    return c.json(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return c.json({ error: msg }, 502);
  }
};
