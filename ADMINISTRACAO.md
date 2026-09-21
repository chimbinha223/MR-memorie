# Administração — MR Memorie no Higgsfield

A versão React/TanStack existente foi adaptada. O site Next.js/Vercel não foi alterado. A imagem da fotógrafa continua na abertura. Não existe base de dados, registo público, nem armazenamento permanente no sistema de ficheiros do servidor.

## Ativação inicial

1. No projeto `app`, instale as dependências com `bun install --frozen-lockfile`.
2. Execute `node scripts/setup-admin.mjs` num terminal interativo. Escolha o email e uma palavra-passe com pelo menos 12 caracteres. O programa não mostra a palavra-passe e cria apenas o hash bcrypt e o segredo de sessão em `app/.env.admin.local`, ignorado pelo Git.
3. Nas definições do website MR Memorie no Higgsfield, configure os segredos `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` e `AUTH_SECRET` com os valores desse ficheiro. Não coloque estes valores no chat, no código, nem em variáveis com prefixo VITE_.
O token usa o nome exclusivo `MR_MEMORIE_GITHUB_TOKEN` para evitar qualquer acesso a credenciais internas da plataforma. A aplicação só lê os nomes enumerados no seu módulo de configuração.

4. No GitHub, crie um token de acesso pessoal com permissões granulares, limitado ao repositório `chimbinha223/MR-memorie`, com **Contents: Read and write**. Configure-o como `MR_MEMORIE_GITHUB_TOKEN` nos segredos do site no Higgsfield.
5. Os valores por omissão são `MR_MEMORIE_GITHUB_OWNER=chimbinha223`, `MR_MEMORIE_GITHUB_REPO=MR-memorie`, `MR_MEMORIE_GITHUB_BRANCH=main`. Só configure estes três nomes se mudar o destino.
6. Volte a publicar a aplicação no Higgsfield para aplicar os segredos. Abra https://mr-memorie.higgsfield.app/admin/login.

Sem estes segredos, o login permanece desativado. Nunca existe palavra-passe predefinida. Alterar o hash ou o segredo invalida as sessões anteriores. Para gerar novamente as credenciais, preserve ou remova conscientemente o ficheiro local existente; o programa não o substitui automaticamente.

## Utilização

O menu oferece Visão geral, Página inicial, Portfólio, Serviços, Sobre, Testemunhos, FAQ, Contactos, Redes sociais, SEO, Aparência e Definições. Edite visualmente e carregue em **Publicar alterações**.

No portfólio, adicione JPEG, PNG, WebP ou AVIF até 5 MB; escolha uma imagem para editar título, ALT, descrição, categoria, destaque e ordem. Pode criar categorias. Mova as fotografias antes de eliminar a categoria. As imagens são limitadas a 16 000 píxeis por lado e 60 megapíxeis.

Os rascunhos ficam na memória desta página. O navegador avisa ao sair com alterações. Enviar uma imagem não a torna pública no site: só a publicação a associa ao conteúdo. Envios expiram após duas horas; se necessário, envie novamente. A cópia de rascunho em Definições salva apenas os textos e referências.

O conteúdo é guardado em `app/data/content.json`; as imagens em `app/public/images/` e `app/public/images/gallery/`. Uma publicação cria uma árvore e um commit únicos, com proteção contra alterações concorrentes. Se outro editor publicar primeiro, o painel mantém o rascunho e pede que carregue a versão atual.

O Higgsfield lê o JSON publicado no GitHub com cache de 30 segundos. **Não depende da Vercel nem de uma nova compilação para mostrar alterações de conteúdo.** Mudanças ao código continuam a exigir publicação pelo Higgsfield. Fotografias apagadas deixam de estar no conteúdo atual; o histórico normal do GitHub conserva versões anteriores.

## Segurança e validação

A sessão dura quatro horas, usa assinatura HS256 e cookie HttpOnly, SameSite=Lax e Secure em HTTPS. O servidor valida autenticação, origem, formatos e limites antes de escrever. O token GitHub nunca é enviado ao navegador. O limite de tentativas usa cache por localização Cloudflare; é uma proteção auxiliar, não um contador global atómico.

As imagens recebem nomes aleatórios e recibos assinados. A publicação só aceita imagens previamente referenciadas ou enviadas pelo painel, e só remove imagens que já não são usadas por nenhum campo. As alterações não escrevem ficheiros permanentes no Worker.

Comandos de verificação em `app`:
- `bun run test`: testes da aplicação (autenticação, cookies, origens, limites, publicação GitHub simulada e formulário).
- `npm run build`: compilação Vite e verificação TypeScript.
- `bun audit`: auditoria de dependências.

A suite do painel usa respostas GitHub simuladas para não alterar dados reais durante os testes. A ativação e uma publicação autenticada no ambiente real dependem dos segredos configurados pelo proprietário.

## Verificação desta entrega

Em 21/09/2026: compilação e TypeScript concluídos sem erros; 22 testes da aplicação passaram (88 verificações); auditoria de 672 pacotes sem vulnerabilidades detetadas. O pacote do navegador não contém as variáveis de autenticação nem o token GitHub.

A revisão Chromium local verificou redirecionamento de acesso sem sessão, rejeição das APIs sem autenticação e de origens externas, login incorreto/correto, cookie HttpOnly, saída, formulário de edição, publicação simulada, upload visual e destaque, menu móvel, ausência de overflow horizontal, fotografia principal carregada e formulário WhatsApp. Respostas de armazenamento foram simuladas na revisão do painel; os fluxos de persistência têm testes próprios com API simulada.

A ativação em produção continua dependente da configuração dos quatro segredos. Nenhuma credencial de teste foi publicada como segredo de produção.
