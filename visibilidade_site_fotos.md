# Controlando a Visibilidade das Fotos no Site

Nem todas as fotos que estão armazenadas na aba "Galeria de Fotos" ou "Arquivos" do lado do ERP interno devem ir para a vitrine do leilão (site público). O ERP tem duas formas principais de lidar com o que é exibido para os arrematantes e o que é para uso puramente interno (ex: fotos de documentos, fotos de avarias confidenciais).

---

## 1. O que define se a foto vai pro site?

Na rota que lista os detalhes do bem (`GET /api/bens/{id}`), as fotos vêm com dois campos cruciais que ditam isso:

```json
{
  "id": 784160,
  "nome": "IMG_2026.jpg",
  "permissao": 0,    // 0 = Público, 100 = Privado/Interno
  "site": true,      // true = Aparece no site, false = Oculto
  "tipo": {
    "id": 1,         // 1 = Categoria "Foto Site"
    "nome": "Foto Site"
  }
}
```
O sistema de ERP usa a combinação de **"tipo"** e **"permissao"** para definir a flag `"site": true`.

Se você adiciona com o `tipo: 1` ("Foto Site"), automaticamente ela se torna uma foto de exibição. Se você adiciona com `tipo: 12` ("Outros"), ela fica oculta do público e ganha a flag `"site": false`.

---

## 2. Definindo a visibilidade no momento do Upload (POST)

Se o PWA tiver um botão separado, ex: *"Adicionar Foto Confidencial"* ou *"Foto de Documento"*, você só precisa mudar dois parâmetros no JSON do payload de Upload da foto (`POST /api/bens/{id}/arquivos`):

```javascript
const payload = {
  data: base64String,
  filename: `documento_${Date.now()}.jpg`,
  
  // PARÂMETROS PARA OCULTAR DO SITE:
  tipo: 12,        // '12' é geralmente o ID para 'Outros' (Documentos em anexo/Interno)
  permissao: 100,  // '100' restringe acesso apenas para funcionários do ERP logados
  
  file: {},
  done: true, success: true, progress: 100
};
```
Ao enviar desta forma, ela vai pra galeria do ERP, mas **nunca** aparecerá no site.

*(Dica: Se você der um `GET /api/tiposArquivo` vai ver a lista exata de todos os números disponíveis. Mas `1` é sempre "Foto Site" e `12` costuma ser "Outros").*

---

## 3. Alterando a visibilidade de uma imagem já salva (PATCH)

E se a foto já subiu como "Foto Site" e agora eu quero **ocultá-la** do site sem deletá-la?
Ou o oposto: se estava oculta e quero exibi-la na vitrine do leilão?

Existe a rota `PATCH` para editar apenas a configuração daquele arquivo:
*   **Rota:** `PATCH /api/bens/{id}/arquivos/{id2}`

Nesta rota você enviará apenas a alteração desejada em formato JSON.

### Implementação JS para Ocultar (Mudar tipo):
```javascript
async function ocultarFotoDoSite(idBem, idArquivo) {
  const url = `https://api.suporteleiloes.com.br/api/bens/${idBem}/arquivos/${idArquivo}`;
  
  // Mudando categoria para 'Outros' (12) e Permissão Privada (100)
  const payload = {
    tipo: 12,
    permissao: 100
  };

  await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer SEU_TOKEN'
    },
    body: JSON.stringify(payload)
  });
}
```

### Implementação JS para Exibir (Tornar "Foto Site"):
```javascript
async function exibirFotoNoSite(idBem, idArquivo) {
  const url = `https://api.suporteleiloes.com.br/api/bens/${idBem}/arquivos/${idArquivo}`;
  
  const payload = {
    tipo: 1,       // '1' = Foto Site
    permissao: 0   // '0' = Público
  };

  await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer SEU_TOKEN'
    },
    body: JSON.stringify(payload)
  });
}
```

Com o `PATCH`, você consegue colocar "olhinhos" (👁️ / 👁️‍🗨️) na tela do PWA para o vistoriador alternar a foto que ele quiser entre pública e privada!
