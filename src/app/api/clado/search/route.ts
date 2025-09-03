import { NextResponse } from "next/server";

// GET /api/clado/search?query=...&limit=...&company=A&company=B&school=X
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get("query");
    const limit = url.searchParams.get("limit");

    if (!query) {
      return NextResponse.json({ error: "Missing required 'query' parameter" }, { status: 422 });
    }

    const apiKey = process.env.CLADO_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "CLADO_API_KEY is not configured on the server" }, { status: 500 });
    }

    const companies = url.searchParams.getAll("company");
    const schools = url.searchParams.getAll("school");

    const cladoUrl = new URL("https://search.clado.ai/api/search");
    cladoUrl.searchParams.set("query", query);
    if (limit) {
      cladoUrl.searchParams.set("limit", limit);
    }
    for (const c of companies) {
      if (c && c.trim()) cladoUrl.searchParams.append("company", c.trim());
    }
    for (const s of schools) {
      if (s && s.trim()) cladoUrl.searchParams.append("school", s.trim());
    }

    const response = await fetch(cladoUrl.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      cache: "no-store",
    });

    const text = await response.text();
    let data: unknown;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: "Clado API error", status: response.status, data },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error in Clado search handler:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

 