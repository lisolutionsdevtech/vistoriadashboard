import { NextRequest, NextResponse } from "next/server";
import { obterToken } from "@/services/auth";

export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get("url");

    if (!url) {
        return new NextResponse("Missing URL parameter", { status: 400 });
    }

    try {
        const headersInit: HeadersInit = {};

        if (url.includes("suporteleiloes.com.br") || url.includes("leiloespb.com.br")) {
            const token = await obterToken();
            if (token) {
                headersInit["Authorization"] = token;
                // ERP exige em alguns retornos JSON/Image o setup de accepts
                headersInit["Accept"] = "application/json, image/*";
            }
        }

        const response = await fetch(url, { headers: headersInit });
        if (!response.ok) throw new Error(`External response status: ${response.status}`);

        const blob = await response.blob();
        const headers = new Headers();
        headers.set("Access-Control-Allow-Origin", "*");
        headers.set("Content-Type", response.headers.get("Content-Type") || "image/jpeg");
        headers.set("Cache-Control", "public, max-age=31536000, immutable");

        return new NextResponse(blob, {
            status: 200,
            headers,
        });
    } catch (error) {
        console.error("Error proxying image:", error);
        return new NextResponse("Failed to fetch image", { status: 500 });
    }
}
