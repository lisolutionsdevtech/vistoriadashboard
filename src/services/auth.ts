let cachedToken: string | null = null;
let tokenExpiry: number | null = null;
let pendingTokenPromise: Promise<string> | null = null;

export async function obterToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && tokenExpiry && now < tokenExpiry) {
    return cachedToken;
  }

  if (pendingTokenPromise) {
    return pendingTokenPromise;
  }

  pendingTokenPromise = (async () => {
    try {
      const baseUrl = process.env.API_BASE_URL;
      const username = process.env.API_USER;
      const password = process.env.API_PASS;

      if (!baseUrl || !username || !password) {
        console.warn("Credenciais de API não configuradas corretamente.");
        return "";
      }

      const params = new URLSearchParams();
      params.append("user", username);
      params.append("pass", password);

      const res = await fetch(`${baseUrl}/api/auth`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          Origin: "https://erp.leiloespb.com.br",
          Referer: "https://erp.leiloespb.com.br/",
        },
        body: params,
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`Falha ao obter token: ${res.status}`);
      }

      const data = await res.json();
      const fs = require("fs");
      try {
        fs.appendFileSync(
          "debug.log",
          `[${new Date().toISOString()}] [Auth] Response Keys: ${Object.keys(data).join(",")}\n`,
        );
      } catch (e) {}

      const token = data.token || data.access_token || data.accessToken;

      if (!token) {
        try {
          fs.appendFileSync(
            "debug.log",
            `[${new Date().toISOString()}] [Auth] Token NOT FOUND. Data: ${JSON.stringify(data)}\n`,
          );
        } catch (e) {}
        return "";
      }

      cachedToken = `Bearer ${token}`;
      tokenExpiry = Date.now() + 50 * 60 * 1000; // 50 minutos
      return cachedToken;
    } catch (error) {
      console.error("Erro na autenticação:", error);
      const fs = require("fs");
      try {
        fs.appendFileSync(
          "debug.log",
          `[${new Date().toISOString()}] [Auth] Exception: ${error}\n`,
        );
      } catch (e) {}
      return "";
    } finally {
      pendingTokenPromise = null;
    }
  })();

  return pendingTokenPromise;
}
