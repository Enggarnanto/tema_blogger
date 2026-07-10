import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

type CmsPost = {
  id?: string;
  title: string;
  slug?: string;
  content_html: string;
  excerpt?: string;
  labels?: string[];
  location_name?: string | null;
  status?: "draft" | "published" | "scheduled";
  publish_at?: string | null;
  blogger_post_id?: string | null;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    await requireAdmin(req);

    const post = await req.json() as CmsPost;
    validatePost(post);

    const accessToken = await getGoogleAccessToken();
    const blogId = requiredEnv("BLOGGER_BLOG_ID");
    const isUpdate = Boolean(post.blogger_post_id);
    const url = isUpdate
      ? `https://www.googleapis.com/blogger/v3/blogs/${blogId}/posts/${post.blogger_post_id}`
      : `https://www.googleapis.com/blogger/v3/blogs/${blogId}/posts/`;

    const bloggerPayload = {
      kind: "blogger#post",
      title: post.title,
      content: post.content_html,
      labels: post.labels || [],
      location: buildBloggerLocation(post),
      customMetaData: JSON.stringify({
        slug: post.slug || "",
        excerpt: post.excerpt || "",
        source_post_id: post.id || "",
      }),
    };

    const publishParam = post.status === "published" ? "?isDraft=false" : "?isDraft=true";
    const response = await fetch(`${url}${publishParam}`, {
      method: isUpdate ? "PUT" : "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bloggerPayload),
    });

    const result = await response.json();
    if (!response.ok) {
      return json({ error: "Blogger API error", details: result }, response.status);
    }

    return json({
      ok: true,
      blogger_post_id: result.id,
      blogger_url: result.url,
      status: post.status || "draft",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return json({ error: message }, 400);
  }
});

async function requireAdmin(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw new Error("Missing Authorization header");

  const supabaseUrl = requiredEnv("SUPABASE_URL");
  const supabaseAnonKey = requiredEnv("SUPABASE_ANON_KEY");
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Unauthorized");

  const adminEmails = (Deno.env.get("CMS_ADMIN_EMAILS") || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  if (adminEmails.length > 0 && !adminEmails.includes((data.user.email || "").toLowerCase())) {
    throw new Error("Forbidden");
  }
}

async function getGoogleAccessToken() {
  const body = new URLSearchParams({
    client_id: requiredEnv("GOOGLE_CLIENT_ID"),
    client_secret: requiredEnv("GOOGLE_CLIENT_SECRET"),
    refresh_token: requiredEnv("GOOGLE_REFRESH_TOKEN"),
    grant_type: "refresh_token",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const result = await response.json();
  if (!response.ok || !result.access_token) {
    throw new Error("Failed to refresh Google access token");
  }

  return result.access_token as string;
}

function validatePost(post: CmsPost) {
  if (!post.title?.trim()) throw new Error("Title is required");
  if (!post.content_html?.trim()) throw new Error("Content is required");
}

function buildBloggerLocation(post: CmsPost) {
  const name = post.location_name?.trim() || "";
  return name ? { name } : undefined;
}

function requiredEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}
