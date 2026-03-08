import { NextResponse } from "next/server";
import { obterToken } from "@/services/auth";

export const dynamic = "force-dynamic";

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id: idBemParam } = await params;
    const idBem = parseInt(idBemParam, 10);

    if (isNaN(idBem)) {
        return NextResponse.json(
            { error: "ID de bem inválido" },
            { status: 400 }
        );
    }

    try {
        const token = await obterToken();

        if (!token) {
            return NextResponse.json(
                { error: "Não foi possível autenticar no ERP" },
                { status: 401 }
            );
        }

        const baseUrl = process.env.API_BASE_URL;
        // Rota para arrancar a proteção da capa principal antes de excluir a imagem de vez
        const urlPhoto = `${baseUrl}/api/bens/${idBem}/photo`;

        const res = await fetch(urlPhoto, {
            method: "DELETE",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: token,
                Origin: "https://erp.leiloespb.com.br",
                Referer: "https://erp.leiloespb.com.br/",
            },
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error(`[API Apagar Capa] Error Status: ${res.status}`, errorText);
            return NextResponse.json(
                { error: `Falha ao limpar foto principal do cadastro: ${res.statusText}` },
                { status: res.status }
            );
        }

        return NextResponse.json({
            message: "Capa do bem removida com sucesso.",
        });

    } catch (error) {
        console.error("Erro interno ao remover capa:", error);
        return NextResponse.json(
            { error: "Erro interno no servidor proxy." },
            { status: 500 }
        );
    }
}
