# Central Milhas Plus

PWA instalável para operações de milhas: cadastro de promoções, lançamento em lote nas contas, fechamento mensal no layout da arte original, financeiro com baixa de pagamentos e portal do parceiro.

```
index.html        o app inteiro
manifest.json
sw.js             cache offline
icons/            ícones do PWA
firestore.rules   regras de segurança do banco
```

---

## 1. Subir no GitHub Pages

1. Crie o repositório e envie os arquivos mantendo a pasta `icons/`.
2. **Settings → Pages** → branch `main`, pasta `/ (root)`.
3. Abra o endereço gerado. Precisa ser HTTPS: o service worker e o login do Google exigem isso.

Nesse ponto o app já funciona, mas gravando só no aparelho. Para os parceiros acessarem de onde estiverem, siga o passo 2.

---

## 2. Configurar o Firebase

### 2.1 Criar o projeto

1. Em <https://console.firebase.google.com>, crie um projeto.
2. **Criação → Firestore Database → Criar banco de dados**, modo produção, região `southamerica-east1`.
3. **Criação → Authentication → Começar** e ative os métodos que for usar:
   - **E-mail/senha** — serve para qualquer e-mail, inclusive os que não são Gmail.
   - **Google** — entrada com um clique, para quem tem conta Google.
4. Ainda em Authentication, aba **Settings → Domínios autorizados**, adicione **cada endereço** onde o app for publicado. Hoje são dois:
   - `alanclebersantana.github.io`
   - `mpliminares.netlify.app`

   O login com Google só funciona em domínio liberado. Se faltar, o app mostra o domínio exato para copiar.

### 2.2 Credenciais

**Já estão preenchidas** no topo do `index.html`, com os dados do projeto `mpliminares`. Se um dia trocar de projeto, o bloco é este:

```js
window.MP_FIREBASE = {
  apiKey: "AIza...",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:abc123"
};
```

Essas chaves são públicas por natureza — quem protege os dados são as regras do passo 2.4, não elas.

### 2.3 Definir quem é administrador

O app não deixa ninguém se promover. O primeiro administrador é criado à mão:

1. Entre uma vez no app com sua conta Google. Vai aparecer "esta conta não tem acesso" — é o esperado.
2. Em **Authentication → Users**, copie o **UID** dessa conta.
3. Em **Firestore → Iniciar coleção**, crie a coleção `admins` com um documento cujo **ID é o UID copiado**. Pode deixar sem nenhum campo.
4. Recarregue o app. Você entra como administrador.

Para adicionar outro administrador depois, repita criando outro documento em `admins`.

### 2.4 Publicar as regras

Em **Firestore → Regras**, apague o conteúdo, cole o arquivo `firestore.rules` e publique.

Sem esse passo o banco recusa tudo: um projeto novo em modo produção já nasce bloqueado, e é daí que vem o erro `permission-denied` na tela de acesso.

> **Se você alterar as regras**, cuidado com um detalhe do Firestore: numa consulta, as regras não filtram os resultados — o banco confere se os filtros da consulta já garantem a regra. A condição precisa ser exatamente `resource.data.campo == request.auth.token.email`, batendo com o `where('campo','==',email)` do app. Colocar uma transformação (`.lower()`) ou uma checagem extra (`!= null`) no meio quebra esse casamento e a consulta inteira é negada, mesmo o usuário sendo dono de todos os documentos.

### 2.5 Se aparecer erro na tela de acesso

A própria tela diz o que falta e já mostra o seu UID com botão de copiar:

| Mensagem | O que fazer |
|---|---|
| `permission-denied` | As regras não foram publicadas (passo 2.4). É a causa mais comum. |
| "ainda não tem acesso" | Falta criar `admins/<seu UID>` (passo 2.3), ou o e-mail não está em nenhum parceiro. |
| `auth/unauthorized-domain` | Falta liberar o domínio do GitHub Pages em Authentication → Settings → Domínios autorizados. |
| `auth/popup-blocked` | O navegador bloqueou a janela do Google. Libere e tente de novo. |

---

## 3. Dar acesso a um parceiro

O parceiro pode entrar de duas formas, com o mesmo e-mail que você cadastrou nele:

- **E-mail e senha** — na primeira vez ele usa "Criar conta com este e-mail" para definir a senha. Serve para qualquer provedor.
- **Entrar com Google** — se ele tiver conta Google nesse e-mail.


> **Antes de copiar qualquer link:** abra o app pelo endereço publicado (o do GitHub Pages). O link do convite é montado a partir da página onde você está no momento. Se você abrir o `index.html` por um preview do Google Drive, pelo seu computador ou pelo `localhost`, o parceiro vai receber um link para lá e cair numa tela de acesso negado. A própria tela de Acessos mostra qual endereço está sendo usado e avisa quando ele não serve.

> **Para testar o login do parceiro**, use uma janela anônima e **outra** conta Google. Se você abrir o convite com a mesma conta que está em `admins`, o app entra como administrador — que é o acesso mais amplo — e mostra um aviso explicando.


1. **Mais → Cadastros → Parceiros**: preencha nome, telefone e, se já souber, o e-mail da conta Google dele.
2. **Mais → Ajustes → Acesso dos parceiros**: clique em **Gerar código** e depois em **Enviar no WhatsApp**. A mensagem já sai pronta com o link.
3. O parceiro abre o link, entra com Google, e a conta dele fica vinculada. Nos acessos seguintes basta entrar com Google.

A coluna "Conta vinculada" mostra o e-mail assim que ele entra pela primeira vez.

Para tirar o acesso, use o **X** ao lado do código e apague o e-mail do cadastro.

---

## 3.1 Leitura de extrato por IA

Em **Mais → Ler extrato — IA** você envia o print ou o PDF do extrato do programa. A IA agrupa parcelas e bônus da mesma promoção, separa voos e estornos, e sugere a operação do mês de cada grupo. Você confere, ajusta as milhas se precisar, e só então gera os lançamentos.

Para funcionar, precisa de uma chave da API do Google Gemini. Gere em <https://aistudio.google.com/apikey> e grave no topo do `index.html`:

```js
window.MP_GEMINI = "AIza...";
```

Assim ela vale para todos os aparelhos, sem precisar cadastrar um a um. Também dá para cadastrar em **Mais → Ajustes → Leitura de extrato por IA**: nesse caso ela vai para o Firestore, em `config/privado`, que só o administrador lê — o parceiro não enxerga.

Ao gerar, o valor e o custo de cada lançamento saem dos parâmetros da operação vinculada. Se a operação estiver no modo "custo total", o rateio é refeito considerando as contas novas.

---

## 4. O que cada um enxerga

| | Administrador | Parceiro |
|---|---|---|
| Painel e relatório | tudo | só as contas dele |
| Custo e CPM de custo | sim | **não** |
| Operações do mês | cadastra e lança | vê só o nome da promoção |
| Financeiro | fila e baixas | só os próprios comprovantes |
| Cadastros e ajustes | sim | não |

A restrição não depende da tela: o banco recusa a leitura. Os custos ficam em coleções separadas (`custos` e `operacoes`) justamente para poderem ser negados.

---

## 5. Como o app usa o banco

| Coleção | Conteúdo | Quem lê |
|---|---|---|
| `parceiros` | nome, e-mail, telefone, PIX, dia de pagamento | admin; parceiro lê o próprio |
| `contas` | titular, CPF, parceiro dono, milhas padrão | admin; parceiro, as dele |
| `operacoes` | parâmetros da promoção, **inclui custo** | só admin |
| `lancamentos` | milhas, valor e resultado por conta | admin; parceiro, os dele |
| `custos` | custo e CPM de custo de cada lançamento | só admin |
| `pagamentos` | baixas com data, valor e comprovante | admin; parceiro, as dele |
| `config/geral` | companhias, fornecedores, preferências | qualquer logado |
| `config/privado` | chave da API de leitura de extrato | só admin |
| `convites` | código → parceiro, usado no 1º acesso | leitura por id exato |
| `admins` | um documento por UID de administrador | o próprio |

O app grava o campo `respEmail` em contas, lançamentos e pagamentos a cada sincronização. É esse campo que as regras comparam — assim a checagem não precisa de leituras extras, que seriam cobradas.

As alterações sobem sozinhas cerca de meio segundo depois de cada mudança, e só os documentos que realmente mudaram são enviados.

---

## 6. Sem Firebase

Se `apiKey` ficar vazio, o app roda sem login, guardando tudo no navegador, e o portal do parceiro é acessado por código na própria máquina. Serve para testar ou para uso individual. Faça backup em **Mais → Ajustes → Baixar backup** antes de trocar de aparelho.

---

## 7. Instalar

Mande para as pessoas o endereço `.../instalar.html`. A página detecta o aparelho, abre já no passo certo e traz o botão de instalar quando o navegador permite.

Resumo do que ela explica:

- **Android (Chrome):** botão “Instalar agora”, ou menu ⋮ → Instalar aplicativo.
- **iPhone e iPad:** obrigatoriamente no **Safari** → Compartilhar → Adicionar à Tela de Início.
- **Windows (Chrome/Edge):** botão “Instalar agora”, ou o ícone de instalar na barra de endereço.
- **Mac:** Safari → Arquivo → Adicionar ao Dock; no Chrome/Edge, o ícone da barra de endereço.

---

## 8. Domínio próprio — www.mpliminar.com.br

O domínio não vem pronto: precisa ser registrado por você, com CPF ou CNPJ.

### 8.1 Registrar

1. Em <https://registro.br>, consulte `mpliminar` e veja se está livre.
2. Registre em nome do CPF ou CNPJ da Milhas Plus. A cobrança é anual.

### 8.2 Apontar para a hospedagem

No painel do Registro.br, em **DNS → Editar zona**, conforme onde o site estiver:

**GitHub Pages**

| Tipo | Nome | Valor |
|---|---|---|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | seuusuario.github.io |

Depois, em **Settings → Pages → Custom domain**, informe `www.mpliminar.com.br` e marque **Enforce HTTPS**. O arquivo `CNAME` já vai no pacote com esse endereço — ele é o que amarra o domínio ao repositório.

**Netlify**

| Tipo | Nome | Valor |
|---|---|---|
| CNAME | www | seusite.netlify.app |

E em **Domain management → Add domain**, informe `www.mpliminar.com.br`. O `_redirects` já manda o endereço sem www para o com www.

O DNS costuma levar de minutos a algumas horas para propagar.

### 8.3 Liberar o domínio no Firebase

**Sem este passo o login para de funcionar no endereço novo.**

No console do Firebase: **Authentication → Settings → Domínios autorizados → Adicionar domínio**, e inclua:

```
www.mpliminar.com.br
mpliminar.com.br
```

Mantenha também os endereços antigos enquanto estiverem no ar.

### 8.4 Reenviar os links dos parceiros

Os convites já enviados apontam para o endereço antigo. Depois que o domínio estiver no ar, gere os links de novo em **Mais → Ajustes → Acesso dos parceiros** — a tela mostra qual endereço está sendo usado.
