# MR Memorie Photography

Website de fotografia de casais, aniversários e ensaios casuais em Viana do Castelo, Portugal.

**Site publicado:** https://mr-memorie.higgsfield.app

**Contato:** +351 938 348 287

A imagem da mulher com a câmera é a fotografia principal da abertura. O site inclui nove páginas, animações discretas acompanhando a rolagem, layout responsivo e formulário com revisão da mensagem antes de abrir o WhatsApp.

## Executar localmente

Requisitos: Node.js 22 e Bun 1.4.2.

```sh
cd app
bun install --frozen-lockfile
bun run dev
```

## Verificar e compilar

```sh
cd app
bun run test
bun run typecheck
bun run build
```

O projeto usa React 19, TanStack Start, TypeScript e GSAP. O código está em `app/`; o resultado da compilação contém o cliente e o servidor para Cloudflare Worker. Este projeto precisa de renderização no servidor e não é um site estático para GitHub Pages.

## Conteúdo e manutenção

- `app/data/content.json`: conteúdo publicado, editável através do painel.
- `app/src/site/Site.tsx`: composição das páginas, menu e animações.
- `app/src/site/ContactForm.tsx`: formulário e prévia da mensagem.
- `app/src/site/contact.ts`: validação e link para WhatsApp.
- `app/public/assets/`: imagens otimizadas e logotipo.
- `DESIGN_BRIEF.md`: direção visual.
- `README_MR_MEMORIE.md`: detalhes da entrega e testes anteriores.

As fotos reais de cada especialidade ainda precisam ser adicionadas ao portfólio. Por enquanto, as capas usam recortes da foto institucional aprovada. A configuração `noindex` está ativa até a revisão final do conteúdo. Não foram criados depoimentos ou preços fictícios.

## Publicação

Esta cópia preserva o código do site criado no Higgsfield. As alterações de conteúdo feitas no painel são guardadas no GitHub e aparecem no site através de leitura dinâmica, com cache de 30 segundos. Mudanças ao código continuam a exigir publicação pelo Higgsfield. O workflow do GitHub valida a compilação e os testes.

As fotografias e o logotipo são materiais da MR Memorie fornecidos para este projeto. Os pacotes incluídos mantêm suas próprias licenças; esta cópia não concede licença aberta sobre a marca ou as fotografias.

## Área de administração

O painel está em `/admin`, com acesso por `/admin/login`. Inclui editores visuais de textos, serviços, contactos, SEO e aparência, além de upload, categorias, destaques e ordenação de fotografias. Não utiliza base de dados.

É necessário configurar os quatro segredos de produção antes de iniciar sessão e publicar. Consulte [ADMINISTRACAO.md](ADMINISTRACAO.md) para a ativação segura e os resultados dos testes. Nunca coloque credenciais no código nem no chat.