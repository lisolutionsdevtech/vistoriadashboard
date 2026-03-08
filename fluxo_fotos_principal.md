# Fluxo Completo de Gestão de Fotos no ERP (PWA)

Ao desenvolver o PWA, o gerenciamento de fotos de um bem (veículo, imóvel, etc) envolve não apenas o upload, mas o comportamento do sistema com a **Foto Principal** (a imagem de capa do lote).

Segundo o comportamento do ERP mapeado nas rotas:
1. Ao adicionar a primeira foto, o sistema automaticamente a define como "Principal" no cadastro do Bem.
2. Se você exclui essa foto, o arquivo some, mas o "vínculo principal" no cadastro pode permanecer apontando para um arquivo inexistente (causando imagens quebradas).
3. O ERP requer rotas separadas para interagir especificamente com o status de "Principal".

---

## 1. Upload como "Foto Site" (Público)

Para subir uma foto diretamente para a galeria pública do lote (visível para os arrematantes no site), usamos a rota detalhada anteriormente, garantindo que o `tipo` seja `1`.

*   **Rota:** `POST /api/bens/{id}/arquivos`
*   **Payload Essencial:**
    ```json
    {
      "data": "data:image/jpeg;base64,...",
      "filename": "foto.jpg",
      "tipo": 1, 
      "permissao": 0, 
      "file": {},
      "done": true,
      "success": true,
      "progress": 100
    }
    ```
    *(Nota: `tipo: 1` = "Foto Site" / `permissao: 0` = "Acesso Público")*

---

## 2. Definir uma Foto como Principal

Se você subiu várias fotos e quer escolher qual delas será a capa do anúncio, você deve usar a rota `definirFotoPrincipal`. 

*   **Rota:** `POST /api/bens/{id}/arquivos/{id2}/definirFotoPrincipal`
*   **Parâmetros de Rota:**
    *   `id`: ID do Bem (ex: 38141)
    *   `id2`: ID do Arquivo já salvo (ex: 797282)
*   **Corpo da Requisição:** Vazio.
*   **Headers:** `Authorization: Bearer <token>`

### Implementação JS:
```javascript
async function setFotoCapa(idBem, idArquivo) {
  const url = `https://api.suporteleiloes.com.br/api/bens/${idBem}/arquivos/${idArquivo}/definirFotoPrincipal`;
  await fetch(url, { method: 'POST', headers: { 'Authorization': '...' } });
}
```

---

## 3. Excluir uma Foto de Galeria (Comum)

Para deletar uma foto que **não é a principal**, basta apagar o arquivo.

*   **Rota:** `DELETE /api/bens/{id}/arquivos/{id2}`
*   **Ação:** Remove o arquivo do servidor.

### Implementação JS:
```javascript
async function excluirFotoComum(idBem, idArquivo) {
  const url = `https://api.suporteleiloes.com.br/api/bens/${idBem}/arquivos/${idArquivo}`;
  await fetch(url, { method: 'DELETE', headers: { 'Authorization': '...' } });
}
```

---

## 4. O Problema da Foto Principal (E como resolver)

Se a foto que você quer apagar for a **Foto Principal**, não basta apagar o arquivo via `DELETE /api/bens/{id}/arquivos/{id2}`. Você também precisa desvincular o campo "foto principal" na raiz do cadastro do bem, ou a capa ficará corrompida.

Para isso, o ERP possui uma rota específica:

*   **Rota Secundária:** `DELETE /api/bens/{id}/photo`
*   **Ação:** Esta rota atua no banco de dados limpando a referência à foto de capa do Bem.

### Fluxo Correto para Excluir Foto Principal (JS):

Quando o usuário apertar para excluir a foto que atualmente é a "Capa", você deve fazer **duas requisições**:
1. Desvincular do cadastro (`DELETE /api/bens/{id}/photo`)
2. Apagar o arquivo físico (`DELETE /api/bens/{id}/arquivos/{id2}`)

```javascript
async function excluirFotoPrincipal(idBem, idArquivo) {
  if (!confirm("Excluir a foto principal?")) return;

  try {
    // 1. Desvincula a foto do cabeçalho do Bem
    await fetch(`https://api.suporteleiloes.com.br/api/bens/${idBem}/photo`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer SEU_TOKEN' }
    });

    // 2. Apaga definitivamente o arquivo do servidor
    await fetch(`https://api.suporteleiloes.com.br/api/bens/${idBem}/arquivos/${idArquivo}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer SEU_TOKEN' }
    });

    alert("Foto principal excluída com sucesso!");
    
    // (Opcional p/ UX avançada) Chamar a API setFotoCapa de novo 
    // com o idArquivo da segunda foto que sobrou, para não deixar sem capa.

  } catch (error) {
    console.error("Falha ao excluir foto principal", error);
  }
}
```

Dessa forma, a exclusão atuará nas duas pontas e corrigirá o bug da "imagem fantasma" na capa.
