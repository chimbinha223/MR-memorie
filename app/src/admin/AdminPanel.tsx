import { useEffect, useRef, useState } from "react";
import {
  contentSchema,
  imageURL,
  type ContentSnapshot,
  type SiteContent,
  type UploadReceipt,
} from "./content-schema";
import { Field } from "./AdminFields";
const menus = [
  "Visão geral",
  "Página inicial",
  "Portfólio",
  "Serviços",
  "Sobre",
  "Testemunhos",
  "FAQ",
  "Contactos",
  "Redes sociais",
  "SEO",
  "Aparência",
  "Definições",
];
const pagePaths = ["/", "/portfolio", "/sobre", "/como-funciona", "/contacto", "/privacidade"];
async function request(path: string, init: RequestInit = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    ...init,
    headers: { "X-MR-Admin": "1", ...init.headers },
  });
  const data = await response.json();
  if (response.status === 401) {
    window.location.assign("/admin/login");
    throw new Error("A sessão terminou.");
  }
  if (!response.ok) throw new Error(data.error || "Não foi possível concluir o pedido.");
  return data;
}
export default function AdminPanel() {
  const [snapshot, setSnapshot] = useState<ContentSnapshot | null>(null),
    [draft, setDraft] = useState<SiteContent | null>(null),
    [tab, setTab] = useState("Visão geral"),
    [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false),
    [uploading, setUploading] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(""),
    [menu, setMenu] = useState(false),
    [selected, setSelected] = useState<string | null>(null),
    [preview, setPreview] = useState<Record<string, string>>({}),
    [receipts, setReceipts] = useState<UploadReceipt[]>([]);
  const mutation = useRef(crypto.randomUUID());
  const heading = useRef<HTMLHeadingElement>(null);
  const side = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const previewRef = useRef<Record<string, string>>({});
  const dirty = !!draft && !!snapshot && JSON.stringify(draft) !== JSON.stringify(snapshot.content);
  const busy = saving || uploading;
  async function load() {
    setLoading(true);
    setError("");
    try {
      const next = await request("/api/admin/content");
      setSnapshot(next);
      setDraft(next.content);
      setReceipts([]);
      setSuccess("");
      mutation.current = crypto.randomUUID();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha de ligação.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
    return () => {
      Object.values(previewRef.current).forEach(URL.revokeObjectURL);
    };
  }, []);
  useEffect(() => {
    if (!dirty && !uploading) return;
    const block = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", block);
    return () => window.removeEventListener("beforeunload", block);
  }, [dirty, uploading]);
  useEffect(() => {
    if (!menu) return;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const links = side.current?.querySelectorAll<HTMLElement>("button,a");
    links?.[0]?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenu(false);
        toggle.current?.focus();
      }
      if (e.key === "Tab" && links?.length) {
        const first = links[0],
          last = links[links.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    const resize = () => {
      if (window.innerWidth > 900) setMenu(false);
    };
    window.addEventListener("keydown", key);
    window.addEventListener("resize", resize);
    return () => {
      document.body.style.overflow = old;
      window.removeEventListener("keydown", key);
      window.removeEventListener("resize", resize);
    };
  }, [menu]);
  function edit(path: Array<string | number>, value: any) {
    setDraft((old) => {
      if (!old) return old;
      const copy = structuredClone(old);
      let target: any = copy;
      for (const part of path.slice(0, -1)) target = target[part];
      target[path.at(-1)!] = value;
      return copy;
    });
    setSuccess("");
    mutation.current = crypto.randomUUID();
  }
  function choose(next: string) {
    setTab(next);
    setMenu(false);
    setTimeout(() => heading.current?.focus(), 0);
  }
  async function upload(file: File, purpose: string) {
    if (file.size > 5 * 1024 * 1024) {
      setError("A fotografia excede 5 MB.");
      return null;
    }
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("purpose", purpose);
      const result = await request("/api/admin/upload", { method: "POST", body: form });
      const path = "/" + result.path.slice("app/public/".length);
      const local = URL.createObjectURL(file);
      previewRef.current[path] = local;
      setPreview((p) => ({ ...p, [path]: local }));
      setReceipts((items) => [...items, result]);
      return path;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível enviar a fotografia.");
      return null;
    } finally {
      setUploading(false);
    }
  }
  async function addPhotos(files: FileList | null) {
    if (!files || !draft) return;
    if (files.length > 20) {
      setError("Selecione até 20 fotografias de cada vez.");
      return;
    }
    for (const file of Array.from(files)) {
      const path = await upload(file, "gallery");
      if (path) {
        const title = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
        setDraft((old) =>
          old
            ? {
                ...old,
                portfolio: [
                  ...old.portfolio,
                  {
                    id: crypto.randomUUID(),
                    src: path,
                    title,
                    alt: title || "Fotografia MR Memorie",
                    description: "",
                    category: old.categories[0].id,
                    featured: false,
                  },
                ],
              }
            : old,
        );
        mutation.current = crypto.randomUUID();
        setSuccess("");
      }
    }
  }
  async function publish() {
    if (!draft || !snapshot) return;
    const parsed = contentSchema.safeParse(draft);
    if (!parsed.success) {
      setError(
        parsed.error.issues
          .slice(0, 3)
          .map((i) => i.path.join(" › ") + ": " + i.message)
          .join(" · "),
      );
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const result = await request("/api/admin/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: parsed.data,
          revision: snapshot.revision,
          uploads: receipts,
          mutationId: mutation.current,
        }),
      });
      setSnapshot(result);
      setDraft(result.content);
      setReceipts([]);
      setSuccess(
        "Alterações publicadas com sucesso. O site está a atualizar o conteúdo. As alterações poderão demorar até 30 segundos a aparecer.",
      );
      mutation.current = crypto.randomUUID();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "A ligação foi interrompida. O rascunho foi mantido; tente novamente.",
      );
    } finally {
      setSaving(false);
    }
  }
  async function logout() {
    if (dirty && !window.confirm("Tem alterações por publicar. Pretende sair?")) return;
    try {
      await request("/api/admin/logout", { method: "POST" });
      window.location.assign("/admin/login");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível terminar a sessão.");
    }
  }
  const resolve = (path: string) => preview[path] || imageURL(path, snapshot?.assetBase || "");
  const renderField = (value: any, path: Array<string | number>) =>
    draft ? (
      <Field
        key={path.join(".")}
        value={value}
        path={path}
        onChange={edit}
        upload={upload}
        resolve={resolve}
        draft={draft}
        disabled={busy}
      />
    ) : null;
  const photoIndex = draft?.portfolio.findIndex((p) => p.id === selected) ?? -1;
  const photo = draft?.portfolio[photoIndex];
  const commonPaths = draft
    ? [...pagePaths, ...draft.services.map((s) => "/ensaios/" + s.id)]
    : pagePaths;
  function movePhoto(direction: number) {
    if (!draft || photoIndex < 0) return;
    const list = [...draft.portfolio];
    [list[photoIndex], list[photoIndex + direction]] = [
      list[photoIndex + direction],
      list[photoIndex],
    ];
    edit(["portfolio"], list);
  }
  return (
    <div className="admin-root admin-shell">
      {menu && (
        <button
          className="admin-backdrop"
          aria-label="Fechar menu"
          onClick={() => setMenu(false)}
        />
      )}
      <aside
        ref={side}
        className={"admin-sidebar" + (menu ? " is-open" : "")}
        aria-label="Menu administrativo"
      >
        <a className="admin-brand" href="/" target="_blank" rel="noopener noreferrer">
          <img src="/assets/logo.png" alt="MR Memorie" />
          <span>ESTÚDIO DE ADMINISTRAÇÃO</span>
        </a>
        <button
          className="admin-menu-close"
          onClick={() => {
            setMenu(false);
            toggle.current?.focus();
          }}
        >
          Fechar menu ×
        </button>
        <nav>
          {menus.map((item, i) => (
            <button
              key={item}
              aria-current={tab === item ? "page" : undefined}
              onClick={() => choose(item)}
            >
              <span aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
              {item}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-bottom">
          <a href="/" target="_blank" rel="noopener noreferrer">
            Ver site ↗
          </a>
          <button onClick={logout} disabled={busy}>
            Terminar sessão
          </button>
        </div>
      </aside>
      <div className="admin-workspace">
        <header className="admin-topbar">
          <button
            ref={toggle}
            className="admin-menu-toggle"
            aria-label="Abrir menu"
            aria-expanded={menu}
            onClick={() => setMenu(true)}
          >
            ☰
          </button>
          <span className={"admin-save-state" + (dirty ? " is-dirty" : "")}>
            {uploading
              ? "A enviar fotografia..."
              : dirty
                ? "Alterações por publicar"
                : "Conteúdo guardado"}
          </span>
          <button className="admin-primary" disabled={!draft || !dirty || busy} onClick={publish}>
            {saving ? "A publicar alterações..." : "Publicar alterações"}
          </button>
        </header>
        <main className="admin-main">
          <div className="admin-page-heading">
            <p className="admin-eyebrow">MR MEMORIE · ADMINISTRAÇÃO</p>
            <h1 ref={heading} tabIndex={-1}>
              {tab}
            </h1>
            <p>O cuidado com o site começa aqui.</p>
          </div>
          {error && (
            <div className="admin-error" role="alert">
              {error}
            </div>
          )}
          {success && (
            <div className="admin-success" role="status">
              {success}
              <a href="/" target="_blank" rel="noopener noreferrer">
                {" "}
                Ver site ↗
              </a>
            </div>
          )}
          {loading ? (
            <div className="admin-card" role="status">
              A carregar os conteúdos...
            </div>
          ) : !draft ? (
            <div className="admin-card">
              <p>
                Não foi possível carregar o conteúdo. Verifique a ligação ao GitHub nas definições
                do site.
              </p>
              <button className="admin-secondary" onClick={load}>
                Tentar novamente
              </button>
            </div>
          ) : (
            <>
              {tab === "Visão geral" && (
                <>
                  <div className="admin-overview-grid">
                    {[
                      [draft.portfolio.length, "Fotografias"],
                      [draft.services.length, "Serviços"],
                      [draft.portfolio.filter((p) => p.featured).length, "Em destaque"],
                    ].map(([count, label]) => (
                      <div key={label} className="admin-stat">
                        <strong>{count}</strong>
                        <span>{label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="admin-welcome">
                    <img src={resolve(draft.home.hero.image)} alt="Imagem principal do site" />
                    <div>
                      <p className="admin-eyebrow">O SEU SITE, AO SEU RITMO</p>
                      <h2>
                        Conte histórias.
                        <br />
                        Guarde memórias.
                      </h2>
                      <p>
                        Edite os textos, organize as fotografias e publique quando estiver pronto.
                      </p>
                      <button className="admin-primary" onClick={() => choose("Portfólio")}>
                        Gerir portfólio →
                      </button>
                    </div>
                  </div>
                  <div className="admin-card">
                    <h2>Publicação sem base de dados</h2>
                    <p>
                      Os conteúdos e as imagens ficam guardados no GitHub. A página pública carrega
                      a versão publicada automaticamente. As alterações feitas aqui só ficam
                      públicas depois de carregar em “Publicar alterações”.
                    </p>
                    <p className="admin-muted">
                      Revisão atual: {snapshot?.revision.slice(0, 8) || "Inicial"}
                    </p>
                  </div>
                </>
              )}
              {tab === "Página inicial" && (
                <>
                  <section className="admin-card">
                    <h2>Identidade</h2>
                    {renderField(draft.brand.name, ["brand", "name"])}
                    {renderField(draft.brand.subtitle, ["brand", "subtitle"])}
                  </section>
                  <section className="admin-card">{renderField(draft.home, ["home"])}</section>
                  <section className="admin-card">
                    <h2>Botões e rodapé</h2>
                    {renderField(draft.labels, ["labels"])}
                  </section>
                  <section className="admin-card">{renderField(draft.steps, ["steps"])}</section>
                </>
              )}
              {tab === "Portfólio" && (
                <>
                  <div className="admin-card">
                    <div className="admin-section-title">
                      <div>
                        <h2>As suas fotografias</h2>
                        <p>Selecione uma imagem para editar os detalhes.</p>
                      </div>
                      <label className="admin-upload-button">
                        + Adicionar fotografias
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/avif"
                          multiple
                          disabled={busy}
                          onChange={(e) => {
                            void addPhotos(e.target.files);
                            e.currentTarget.value = "";
                          }}
                        />
                      </label>
                    </div>
                    <div className="admin-gallery-layout">
                      <div className="admin-gallery">
                        {draft.portfolio.length === 0 ? (
                          <div className="admin-empty">
                            <strong>O próximo momento começa aqui.</strong>
                            <p>Adicione as fotografias que quer mostrar no seu portfólio.</p>
                          </div>
                        ) : (
                          draft.portfolio.map((p, i) => (
                            <button
                              type="button"
                              className={"admin-photo" + (p.id === selected ? " selected" : "")}
                              key={p.id}
                              aria-label={"Editar " + (p.title || "fotografia " + (i + 1))}
                              onClick={() => setSelected(p.id)}
                            >
                              <img src={resolve(p.src)} alt={p.alt} />
                              <span>
                                {String(i + 1).padStart(2, "0")} · {p.title || "Sem título"}
                              </span>
                              {p.featured && <small>★ Destaque</small>}
                            </button>
                          ))
                        )}
                      </div>
                      {photo && (
                        <section className="admin-photo-editor">
                          <img
                            className="admin-photo-preview"
                            src={resolve(photo.src)}
                            alt={photo.alt}
                          />
                          <h3>Detalhes da fotografia</h3>
                          {renderField(photo.title, ["portfolio", photoIndex, "title"])}
                          {renderField(photo.alt, ["portfolio", photoIndex, "alt"])}
                          {renderField(photo.description, ["portfolio", photoIndex, "description"])}
                          <label>
                            Categoria
                            <select
                              value={photo.category}
                              disabled={busy}
                              onChange={(e) =>
                                edit(["portfolio", photoIndex, "category"], e.target.value)
                              }
                            >
                              {draft.categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.title}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="admin-checkbox">
                            <input
                              type="checkbox"
                              checked={photo.featured}
                              disabled={busy}
                              onChange={(e) =>
                                edit(["portfolio", photoIndex, "featured"], e.target.checked)
                              }
                            />
                            Marcar como destaque
                          </label>
                          <div className="admin-actions">
                            <button
                              disabled={busy || photoIndex === 0}
                              onClick={() => movePhoto(-1)}
                            >
                              ↑ Subir
                            </button>
                            <button
                              disabled={busy || photoIndex === draft.portfolio.length - 1}
                              onClick={() => movePhoto(1)}
                            >
                              ↓ Descer
                            </button>
                            <button
                              className="admin-danger"
                              disabled={busy}
                              onClick={() => {
                                if (
                                  window.confirm(
                                    "Eliminar esta fotografia do portfólio? A alteração só fica pública ao publicar.",
                                  )
                                ) {
                                  edit(
                                    ["portfolio"],
                                    draft.portfolio.filter((p) => p.id !== selected),
                                  );
                                  setSelected(null);
                                }
                              }}
                            >
                              Eliminar
                            </button>
                          </div>
                        </section>
                      )}
                    </div>
                  </div>
                  <section className="admin-card">
                    {renderField(draft.categories, ["categories"])}
                    <p className="admin-muted">
                      Antes de eliminar uma categoria, mova as suas fotografias para outra.
                    </p>
                  </section>
                </>
              )}
              {tab === "Serviços" && (
                <section className="admin-card">
                  {renderField(draft.services, ["services"])}
                </section>
              )}
              {tab === "Sobre" && (
                <section className="admin-card">{renderField(draft.about, ["about"])}</section>
              )}
              {tab === "Testemunhos" && (
                <section className="admin-card">
                  <p>Adicione apenas testemunhos reais e autorizados.</p>
                  {renderField(draft.testimonials, ["testimonials"])}
                </section>
              )}
              {tab === "FAQ" && (
                <section className="admin-card">{renderField(draft.faqs, ["faqs"])}</section>
              )}
              {tab === "Contactos" && (
                <section className="admin-card">
                  {["email", "phone", "whatsapp", "location"].map((k) =>
                    renderField((draft.brand as any)[k], ["brand", k]),
                  )}
                </section>
              )}
              {tab === "Redes sociais" && (
                <section className="admin-card">
                  <p>
                    Introduza o endereço completo de cada perfil (https://...). Deixe vazio para
                    ocultar.
                  </p>
                  {renderField(draft.socials, ["socials"])}
                </section>
              )}
              {tab === "SEO" && (
                <>
                  <section className="admin-card">
                    {["title", "description", "ogImage", "noindex"].map((k) =>
                      renderField((draft.seo as any)[k], ["seo", k]),
                    )}
                    {renderField(draft.brand.origin, ["brand", "origin"])}
                  </section>
                  <section className="admin-card">
                    <h2>Páginas</h2>
                    {commonPaths.map((path) => (
                      <details className="admin-repeat" key={path}>
                        <summary>{path}</summary>
                        <div className="admin-repeat-body">
                          <label>
                            Título
                            <input
                              value={draft.seo.pages[path]?.title || ""}
                              disabled={busy}
                              onChange={(e) =>
                                edit(["seo", "pages"], {
                                  ...draft.seo.pages,
                                  [path]: {
                                    title: e.target.value,
                                    description: draft.seo.pages[path]?.description || "",
                                  },
                                })
                              }
                            />
                          </label>
                          <label>
                            Descrição
                            <textarea
                              value={draft.seo.pages[path]?.description || ""}
                              disabled={busy}
                              onChange={(e) =>
                                edit(["seo", "pages"], {
                                  ...draft.seo.pages,
                                  [path]: {
                                    title: draft.seo.pages[path]?.title || "",
                                    description: e.target.value,
                                  },
                                })
                              }
                            />
                          </label>
                        </div>
                      </details>
                    ))}
                  </section>
                </>
              )}
              {tab === "Aparência" && (
                <>
                  <section className="admin-card">
                    <h2>Cores do site</h2>
                    {renderField(draft.appearance, ["appearance"])}
                  </section>
                  <section className="admin-card">
                    {renderField(draft.brand.logo, ["brand", "logo"])}
                  </section>
                  <section className="admin-card">
                    <h2>Imagem principal</h2>
                    {renderField(draft.home.hero.image, ["home", "hero", "image"])}
                    {renderField(draft.home.hero.alt, ["home", "hero", "alt"])}
                  </section>
                </>
              )}
              {tab === "Definições" && (
                <section className="admin-card">
                  <h2>Acesso e publicação</h2>
                  <p>
                    Existe apenas um administrador. O email, a palavra-passe e a ligação ao GitHub
                    são configurados nos segredos do site no Higgsfield.
                  </p>
                  <p>
                    As credenciais nunca são mostradas neste painel. Para mudar a palavra-passe,
                    configure um novo hash e volte a publicar a aplicação.
                  </p>
                  <p>
                    O botão “Publicar alterações” guarda conteúdo e imagens no GitHub. Não altera o
                    código do site nem a versão antiga na Vercel.
                  </p>
                  <div className="admin-actions">
                    <button
                      className="admin-secondary"
                      disabled={busy}
                      onClick={() => {
                        if (
                          !dirty ||
                          window.confirm("Descartar o rascunho e carregar a versão publicada?")
                        )
                          void load();
                      }}
                    >
                      Carregar versão publicada
                    </button>
                    <button
                      className="admin-secondary"
                      disabled={busy}
                      onClick={() => {
                        const blob = new Blob([JSON.stringify(draft, null, 2)], {
                          type: "application/json",
                        });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "mr-memorie-rascunho.json";
                        a.click();
                        setTimeout(() => URL.revokeObjectURL(url), 1000);
                      }}
                    >
                      Guardar cópia do rascunho
                    </button>
                  </div>
                  <p className="admin-muted">
                    A cópia é apenas uma salvaguarda do texto; as fotografias ainda não publicadas
                    devem ser enviadas novamente se fechar esta página.
                  </p>
                </section>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
