import { NextRequest, NextResponse } from "next/server";
import { buscarLotePorId } from "@/services/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const { obterToken } = await import("@/services/auth");
    const token = await obterToken();

    const data = await buscarLotePorId(id, token);

    return NextResponse.json(data);
  } catch (error) {
    console.error(`Erro ao buscar detalhe do lote:`, error);
    return NextResponse.json(
      { error: "Falha ao buscar detalhe do lote" },
      { status: 500 },
    );
  }
}
