import { NextResponse } from "next/server";
import { obterToken } from "@/services/auth";

export const dynamic = "force-dynamic";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);

    if (isNaN(id)) {
        return NextResponse.json({ error: "ID de bem inválido" }, { status: 400 });
    }

    try {
        const body = await request.json();
        const token = await obterToken();

        if (!token) {
            return NextResponse.json(
                { error: "Não foi possível autenticar no ERP" },
                { status: 401 }
            );
        }

        const { data, filename, tipo, permissao } = body;

        if (!data || !filename) {
            return NextResponse.json(
                { error: "Payload inválido. 'data' e 'filename' são obrigatórios." },
                { status: 400 }
            );
        }

        // Payload requerido pelo ERP conforme pwa_captura_imagem_leiloes.md e visibilidade_site_fotos.md
        const payloadERP = {
            data,
            filename,
            tipo: tipo !== undefined ? tipo : 12, // 1 = Visível, 12 = Oculta
            permissao: permissao !== undefined ? permissao : 100, // 0 = Público, 100 = ERP interno
            file: {}, // Conforme doc: objeto vazio
            done: true,
            copying: false,
            progress: 100,
            fail: false,
            success: true,
        };

        const baseUrl = process.env.API_BASE_URL;
        const urlUpload = `${baseUrl}/api/bens/${id}/arquivos`;

        const res = await fetch(urlUpload, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: token,
                Origin: "https://erp.leiloespb.com.br",
                Referer: "https://erp.leiloespb.com.br/",
            },
            body: JSON.stringify(payloadERP),
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error(`[API Upload] Error Status: ${res.status}`, errorText);
            return NextResponse.json(
                { error: `Falha no upload para o ERP: ${res.statusText}` },
                { status: res.status }
            );
        }

        const resultData = await res.json();

        return NextResponse.json({
            message: "Upload realizado com sucesso",
            data: resultData
        });

    } catch (error) {
        console.error("Erro interno no upload da imagem:", error);
        return NextResponse.json(
            { error: "Erro interno no servidor de proxy." },
            { status: 500 }
        );
    }
}
