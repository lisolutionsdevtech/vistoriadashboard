import { NextResponse } from "next/server";
import { buscarBens } from "@/services/api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const status = searchParams.get("status") || undefined;

  try {
    const data = await buscarBens(search, page, status);
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Falha ao buscar bens" },
      { status: 500 },
    );
  }
}
