# MR Memorie Photography — primeira versão

Local: Viana do Castelo, Portugal.
WhatsApp: +351 938 348 287.
Higgsfield website_id: 291a65c6-178f-4c1b-9de6-b0352a6aa8a3.
Domínio previsto: https://mr-memorie.higgsfield.app

## Entregue
Site editorial em português, inspirado na referência aprovada https://www.theportugalphotoshoot.com/: fotografia de abertura, navegação central, tipografia Cormorant Garamond, fundo branco, botões pretos e três serviços. Layout responsivo, movimento nativo de scroll com GSAP e suporte a movimento reduzido. Nove páginas: início, portfólio, casais, aniversários, casual, sobre, como funciona, contato e privacidade. Foto e logo fornecidos e aprovados pelo usuário.

O formulário valida nome/categoria/local e data opcional; mostra uma prévia antes do link explícito para WhatsApp. Nenhuma mensagem é enviada automaticamente. O site não possui CRM, armazenamento de leads, checkout nem confirmação automática de reserva.

## Conteúdo pendente
O portfólio aguarda fotos reais de casais, aniversários e ensaios casuais. As capas de serviços usam recortes temporários da imagem institucional aprovada. Não há depoimentos, preços ou biografia inventados. A seleção em app/src/site/data.ts está vazia; incluir src, alt, category e title para ativar filtros e lightbox. As capas por categoria podem ser trocadas em ServiceCards/ServicePage em app/src/site/Site.tsx.

A geração de imagens/design boards no Higgsfield retornou “Requires basic plan or higher”; zero tarefas foram submetidas. A construção continuou no ambiente de website do Higgsfield com o material fornecido. A imagem de compartilhamento é uma captura da página desenvolvida.

Noindex está ativo em app/src/routes/__root.tsx até revisar o conteúdo final e fornecer o portfólio. Robots, sitemap, canonical, redirecionamento sem barra final e headers estão implementados. Confirmar origem em app/src/site/data.ts e app/src/app-meta.json se o domínio mudar.

## Validação em 18/09/2026
- Bun: 6 testes de contato, 36 asserções, todos passaram.
- TypeScript e build de produção com inspector: passaram.
- Chromium: 60 verificações passaram, nove rotas HTTP 200, larguras 360/390/768/1440, menu/teclado, prévia/encoding de WhatsApp, movimento reduzido e scroll.
- Sem erros de console/hidratação. Nenhuma navegação ao WhatsApp foi disparada nos testes.
- Revisão visual de abertura desktop/celular, seção de serviços e formulário realizada antes da publicação.

## Desenvolvimento
Node 22 e Bun. Dentro de app: bun install --frozen-lockfile; bun run dev; bun test src/site/contact.test.ts; bun run typecheck; bun run build. O routeTree.gen.ts é gerado pelo Vite/TanStack, nunca editar manualmente. Publicar pelo fluxo Higgsfield website_repo_access push e deploy_website após commit; não usar git push direto. O .env não é necessário para este site.
