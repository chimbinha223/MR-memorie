import { useId } from "react";
import type { SiteContent } from "./content-schema";
export const labels: Record<string, string> = {
  brand: "Identidade",
  name: "Nome",
  subtitle: "Subtítulo",
  location: "Localização",
  phone: "Telefone",
  whatsapp: "WhatsApp",
  origin: "Endereço do site",
  email: "Email",
  logo: "Logótipo",
  hero: "Imagem principal e abertura",
  eyebrow: "Texto acima do título",
  title: "Título",
  emphasis: "Parte em destaque do título",
  description: "Descrição",
  image: "Imagem",
  alt: "Texto alternativo (ALT)",
  primaryText: "Texto do botão principal",
  primaryHref: "Destino do botão principal",
  secondaryText: "Texto do segundo botão",
  secondaryHref: "Destino do segundo botão",
  servicesTitle: "Título dos serviços",
  servicesIntro: "Introdução dos serviços",
  editorial: "Apresentação",
  paragraphs: "Parágrafos",
  processTitle: "Título do processo",
  processIntro: "Introdução do processo",
  portfolioEyebrow: "Introdução do portfólio",
  portfolioTitle: "Título do portfólio",
  portfolioIntro: "Descrição do portfólio",
  closingTitle: "Título da chamada final",
  closingIntro: "Texto da chamada final",
  closingImage: "Imagem da chamada final",
  testimonialsTitle: "Título dos testemunhos",
  serviceCTA: "Botão dos serviços",
  contactCTA: "Botão de contacto",
  moreAbout: "Botão Sobre",
  moreProcess: "Botão Como funciona",
  portfolioCTA: "Botão Portfólio",
  backToTop: "Voltar ao início",
  footerLine: "Texto do rodapé",
  footerContact: "Título dos contactos",
  id: "Identificador",
  tagline: "Frase de apresentação",
  summary: "Resumo",
  headline: "Título da página",
  intro: "Introdução",
  detail: "Texto detalhado",
  occasions: "Ocasiões",
  focus: "Posição da imagem (ex.: 50% 50%)",
  sectionTitle: "Título da secção",
  buttonLabel: "Texto do botão",
  text: "Texto",
  quote: "Testemunho",
  context: "Serviço ou contexto",
  photo: "Fotografia (opcional)",
  heading: "Título principal",
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  youtube: "YouTube",
  ogImage: "Imagem para partilha",
  noindex: "Ocultar o site dos motores de pesquisa",
  primary: "Cor dos botões",
  accent: "Cor de destaque",
  background: "Cor de fundo",
  services: "Serviços",
  categories: "Categorias",
  steps: "Etapas",
  testimonials: "Testemunhos",
  faqs: "Perguntas frequentes",
};
type Path = Array<string | number>;
export type FieldProps = {
  value: any;
  path: Path;
  onChange: (path: Path, value: any) => void;
  upload: (file: File, purpose: string) => Promise<string | null>;
  resolve: (path: string) => string;
  draft: SiteContent;
  disabled?: boolean;
};
export function newItem(key: string, draft: SiteContent): any {
  const id = crypto.randomUUID();
  if (key === "services")
    return {
      id: "servico-" + id.slice(0, 8),
      title: "Novo serviço",
      tagline: "",
      summary: "",
      headline: "",
      intro: "",
      detail: "",
      occasions: [],
      focus: "50% 50%",
      image: draft.home.hero.image,
      alt: "",
      sectionTitle: "",
      buttonLabel: "Pedir orçamento",
    };
  if (key === "categories") return { id: "categoria-" + id.slice(0, 8), title: "Nova categoria" };
  if (key === "testimonials") return { id, name: "", quote: "", context: "", photo: "" };
  if (key === "steps") return { title: "Nova etapa", text: "" };
  if (key === "faqs") return ["Nova pergunta", ""];
  return "";
}
export function Field(props: FieldProps) {
  const { value, path, onChange, upload, resolve, draft, disabled } = props;
  const uid = useId();
  const key = String(path.at(-1));
  const label = labels[key] || (/^\d+$/.test(key) ? "Texto " + (Number(key) + 1) : key);
  if (typeof value === "boolean")
    return (
      <label className="admin-checkbox">
        <input
          type="checkbox"
          checked={value}
          disabled={disabled}
          onChange={(e) => onChange(path, e.target.checked)}
        />
        {label}
      </label>
    );
  if (typeof value === "string") {
    const image = ["image", "logo", "ogImage", "closingImage", "photo"].includes(key);
    if (image)
      return (
        <div className="admin-asset-field">
          <label htmlFor={uid}>{label}</label>
          {value ? (
            <img src={resolve(value)} alt="Pré-visualização da imagem escolhida" />
          ) : (
            <p className="admin-muted">Sem imagem.</p>
          )}
          <input
            id={uid}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            disabled={disabled}
            onChange={async (e) => {
              const file = e.currentTarget.files?.[0];
              e.currentTarget.value = "";
              if (file) {
                const result = await upload(file, "brand");
                if (result) onChange(path, result);
              }
            }}
          />
          {key === "photo" && value && (
            <button type="button" className="admin-link" onClick={() => onChange(path, "")}>
              Retirar fotografia
            </button>
          )}
          <small>JPEG, PNG, WebP ou AVIF. Até 5 MB.</small>
        </div>
      );
    const isColor = path[0] === "appearance";
    const long =
      [
        "description",
        "intro",
        "detail",
        "summary",
        "text",
        "quote",
        "portfolioIntro",
        "closingIntro",
        "servicesIntro",
        "processIntro",
      ].includes(key) ||
      path.includes("paragraphs") ||
      value.includes("\n");
    return (
      <label htmlFor={uid}>
        {isColor && key === "text" ? "Cor do texto" : label}
        {long && !isColor ? (
          <textarea
            id={uid}
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(path, e.target.value)}
          />
        ) : (
          <input
            id={uid}
            type={isColor ? "color" : key === "email" ? "email" : "text"}
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(path, e.target.value)}
          />
        )}
      </label>
    );
  }
  if (Array.isArray(value)) {
    if (path[0] === "faqs" && path.length === 2)
      return (
        <div className="admin-fields">
          <label>
            Pergunta
            <input
              value={value[0]}
              disabled={disabled}
              onChange={(e) => onChange([...path, 0], e.target.value)}
            />
          </label>
          <label>
            Resposta
            <textarea
              value={value[1]}
              disabled={disabled}
              onChange={(e) => onChange([...path, 1], e.target.value)}
            />
          </label>
        </div>
      );
    function move(i: number, d: number) {
      const next = [...value];
      [next[i], next[i + d]] = [next[i + d], next[i]];
      onChange(path, next);
    }
    return (
      <section className="admin-array">
        <div className="admin-section-title">
          <h3>{label}</h3>
          <span>{value.length}</span>
        </div>
        {value.map((item, i) => (
          <details className="admin-repeat" key={item?.id || i}>
            <summary>
              {typeof item === "string"
                ? item.slice(0, 65) || "Texto " + (i + 1)
                : Array.isArray(item)
                  ? item[0] || "Pergunta " + (i + 1)
                  : item.title || item.name || label + " " + (i + 1)}
            </summary>
            <div className="admin-repeat-body">
              <Field {...props} value={item} path={[...path, i]} />
              <div className="admin-actions">
                <button type="button" disabled={disabled || i === 0} onClick={() => move(i, -1)}>
                  ↑ Subir
                </button>
                <button
                  type="button"
                  disabled={disabled || i === value.length - 1}
                  onClick={() => move(i, 1)}
                >
                  ↓ Descer
                </button>
                <button
                  type="button"
                  className="admin-danger"
                  disabled={disabled}
                  onClick={() => {
                    if (window.confirm("Eliminar este elemento do rascunho?"))
                      onChange(
                        path,
                        value.filter((_, j) => j !== i),
                      );
                  }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          </details>
        ))}
        <button
          type="button"
          className="admin-secondary"
          disabled={disabled}
          onClick={() => onChange(path, [...value, newItem(key, draft)])}
        >
          + Adicionar{" "}
          {key === "faqs"
            ? "pergunta"
            : key === "categories"
              ? "categoria"
              : key === "services"
                ? "serviço"
                : "elemento"}
        </button>
      </section>
    );
  }
  if (value && typeof value === "object")
    return (
      <div className="admin-fields">
        {Object.entries(value)
          .filter(([k]) => k !== "id" || path[0] === "services" || path[0] === "categories")
          .map(([k, v]) => (
            <Field {...props} key={k} value={v} path={[...path, k]} />
          ))}
      </div>
    );
  return null;
}
