import { useEffect, useRef, useState, type ReactNode } from "react";
import { type ServiceId, type PortfolioPhoto } from "./data";
import { useSiteContent } from "./content-context";
import type { CSSProperties } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function Photo({
  className = "",
  alt = "A fotógrafa durante uma sessão em estúdio",
  priority = false,
  position,
  src,
}: {
  className?: string;
  alt?: string;
  priority?: boolean;
  position?: string;
  src?: string;
}) {
  const { content, resolveAsset } = useSiteContent();
  const path = src || content.home.hero.image;
  const standard = path === "/assets/photographer-1440.webp";
  return (
    <img
      className={className}
      src={resolveAsset(path)}
      srcSet={
        standard
          ? "/assets/photographer-640.webp 640w, /assets/photographer-960.webp 960w, /assets/photographer-1440.webp 1440w"
          : undefined
      }
      sizes="(max-width: 700px) 100vw, 70vw"
      width={1448}
      height={1086}
      alt={alt}
      style={position ? { objectPosition: position } : undefined}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
    />
  );
}
export function Logo({ inverse = false }: { inverse?: boolean }) {
  const { content, resolveAsset } = useSiteContent();
  return (
    <img
      className={"brand-logo" + (inverse ? " inverse" : "")}
      src={resolveAsset(content.brand.logo)}
      width={420}
      height={311}
      alt={content.brand.name + " " + content.brand.subtitle}
    />
  );
}
function Header({ hero = false }: { hero?: boolean }) {
  const { brand, services } = useSiteContent().content;
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 45);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.querySelector<HTMLAnchorElement>("a")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
      if (e.key === "Tab") {
        const links = panel.current?.querySelectorAll<HTMLAnchorElement>("a");
        if (!links?.length) return;
        const first = links[0],
          last = links[links.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          toggle.current?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          toggle.current?.focus();
        } else if (document.activeElement === toggle.current) {
          e.preventDefault();
          (e.shiftKey ? last : first).focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 801px)");
    const close = () => {
      if (desktop.matches) setOpen(false);
    };
    desktop.addEventListener("change", close);
    return () => desktop.removeEventListener("change", close);
  }, []);
  const dark = hero && !scrolled && !open;
  return (
    <header
      className={"site-header" + (dark ? " over-hero" : " solid") + (open ? " menu-is-open" : "")}
    >
      <nav className="desktop-nav nav-left" aria-label="Navegação principal">
        <a href="/">Início</a>
        <a href="/portfolio">Portfólio</a>
        <div className="nav-dropdown">
          <a href="/#ensaios">
            Ensaios <span aria-hidden="true">⌄</span>
          </a>
          <div className="dropdown-links">
            {services.map((s) => (
              <a key={s.id} href={"/ensaios/" + s.id}>
                {s.title}
              </a>
            ))}
          </div>
        </div>
      </nav>
      <a href="/" className="logo-link" aria-label="MR Memorie, página inicial">
        <Logo inverse={dark || scrolled} />
      </a>
      <nav className="desktop-nav nav-right" aria-label="Informações">
        <a href="/como-funciona">Como funciona</a>
        <a href="/sobre">Sobre</a>
        <a href="/contacto">Contato</a>
      </nav>
      <button
        ref={toggle}
        className="menu-toggle"
        aria-expanded={open}
        aria-controls="mobile-navigation"
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        onClick={() => setOpen((v) => !v)}
      >
        <span />
        <span />
      </button>
      {open && (
        <nav
          id="mobile-navigation"
          ref={panel}
          className="mobile-navigation"
          aria-label="Menu móvel"
        >
          {[
            ["Início", "/"],
            ["Portfólio", "/portfolio"],
            ...services.map((s) => [s.title, "/ensaios/" + s.id]),
            ["Como funciona", "/como-funciona"],
            ["Sobre", "/sobre"],
            ["Contato", "/contacto"],
          ].map(([name, url]) => (
            <a key={url} href={url} onClick={() => setOpen(false)}>
              {name}
            </a>
          ))}
          <small>{brand.location}</small>
        </nav>
      )}
    </header>
  );
}
function Footer() {
  const { brand, labels, socials } = useSiteContent().content;
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <Logo />
          <p className="preserve-lines">{labels.footerLine}</p>
        </div>
        <div>
          <p className="footer-label">{labels.footerContact}</p>
          <a href={"https://wa.me/" + brand.whatsapp.replace(/\D/g, "")} target="_blank" rel="noopener noreferrer">
            {brand.phone}
          </a>
          <p>{brand.location}</p>
          {brand.email && <a href={"mailto:" + brand.email}>{brand.email}</a>}
          <div className="public-socials">
            {Object.entries(socials)
              .filter(([, url]) => url)
              .map(([name, url]) => (
                <a key={name} href={url} target="_blank" rel="noopener noreferrer">
                  {name}
                </a>
              ))}
          </div>
        </div>
        <nav aria-label="Navegação do rodapé">
          <a href="/portfolio">Portfólio</a>
          <a href="/como-funciona">Como funciona</a>
          <a href="/contacto">Pedir orçamento</a>
          <a href="/privacidade">Privacidade</a>
        </nav>
      </div>
      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} {brand.name}
        </span>
        <a href="#top">{labels.backToTop} ↑</a>
      </div>
    </footer>
  );
}
export function Frame({ children, hero = false }: { children: ReactNode; hero?: boolean }) {
  const { appearance } = useSiteContent().content;
  const scope = useRef<HTMLDivElement>(null);
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const ctx = gsap.context(() => {
        gsap.utils
          .toArray<HTMLElement>("[data-reveal]")
          .forEach((el) =>
            gsap.fromTo(
              el,
              { y: 24 },
              {
                y: 0,
                duration: 0.85,
                ease: "power2.out",
                scrollTrigger: { trigger: el, start: "top 95%", once: true },
              },
            ),
          );
        if (window.matchMedia("(min-width: 769px)").matches) {
          gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
            gsap.fromTo(
              el,
              { yPercent: -3, scale: 1.08 },
              {
                yPercent: 3,
                scale: 1.02,
                ease: "none",
                scrollTrigger: {
                  trigger: el.parentElement,
                  start: "top bottom",
                  end: "bottom top",
                  scrub: 0.65,
                },
              },
            );
          });
        }
      }, scope);
      return () => ctx.revert();
    });
    return () => mm.revert();
  }, []);
  return (
    <div
      ref={scope}
      id="top"
      className="public-site"
      style={
        {
          "--ink": appearance.text,
          "--green": appearance.accent,
          "--brand-primary": appearance.primary,
          "--brand-bg": appearance.background,
          "--brand-text": appearance.text,
          background: appearance.background,
          color: appearance.text,
        } as CSSProperties
      }
    >
      <a className="skip-link" href="#main">
        Ir para o conteúdo
      </a>
      <Header hero={hero} />
      <main id="main">{children}</main>
      <Footer />
    </div>
  );
}
export function Heading({ title, text }: { title: string; text?: string }) {
  return (
    <div className="section-heading" data-reveal>
      <h2>{title}</h2>
      <span className="hairline" />
      {text && <p>{text}</p>}
    </div>
  );
}
export function ServiceCards() {
  const { services, home, labels } = useSiteContent().content;
  return (
    <section id="ensaios" className="section services-section">
      <Heading title={home.servicesTitle} text={home.servicesIntro} />
      <div className="service-grid">
        {services.map((s, i) => (
          <article
            className={
              "service-card" + (s.image === "/assets/photographer-1440.webp" ? " service-" + i : "")
            }
            key={s.id}
            data-reveal
          >
            <h3>{s.title}</h3>
            <p className="service-tagline">{s.tagline}</p>
            <a
              href={"/ensaios/" + s.id}
              className="service-media"
              aria-label={"Conhecer os ensaios de " + s.title}
            >
              <Photo src={s.image} position={s.focus} alt={s.alt} />
              <span className="media-arrow" aria-hidden="true">
                ↗
              </span>
            </a>
            <p className="service-summary">{s.summary}</p>
            <a className="service-action" href={"/ensaios/" + s.id}>
              {labels.serviceCTA}
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
export function Process() {
  const { steps } = useSiteContent().content;
  return (
    <div className="process-grid">
      {steps.map((s) => (
        <article key={s.title} data-reveal>
          <h3>{s.title}</h3>
          <p>{s.text}</p>
        </article>
      ))}
    </div>
  );
}
export function FAQ() {
  const { faqs } = useSiteContent().content;
  return (
    <div className="faq-list">
      {faqs.map(([q, a]) => (
        <details key={q}>
          <summary>
            {q}
            <span aria-hidden="true">+</span>
          </summary>
          <p>{a}</p>
        </details>
      ))}
    </div>
  );
}
export function Closing() {
  const { home, labels } = useSiteContent().content;
  return (
    <section className="closing">
      <div className="closing-image" data-parallax>
        <Photo src={home.closingImage} alt="" position="20% 60%" />
      </div>
      <div className="closing-scrim" />
      <div className="closing-copy" data-reveal>
        <h2 className="preserve-lines">{home.closingTitle}</h2>
        <p>{home.closingIntro}</p>
        <a className="closing-action" href="/contacto">
          {labels.contactCTA}
        </a>
      </div>
    </section>
  );
}
export function Home() {
  const { content, resolveAsset } = useSiteContent();
  const { home, brand, labels, portfolio, testimonials } = content;
  return (
    <Frame hero>
      <section className="hero">
        <div className="hero-image" data-parallax>
          <Photo src={home.hero.image} priority alt={home.hero.alt} position="65% 40%" />
        </div>
        <div className="hero-scrim" />
        <div className="hero-copy">
          <p className="hero-kicker">{home.hero.eyebrow}</p>
          <h1>
            {home.hero.title}
            <br />
            <em>{home.hero.emphasis}</em>
          </h1>
          <p className="preserve-lines">{home.hero.description}</p>
          <div className="hero-actions">
            <a className="hero-primary" href={home.hero.primaryHref}>
              {home.hero.primaryText}
            </a>
            <a className="hero-secondary" href={home.hero.secondaryHref}>
              {home.hero.secondaryText}
            </a>
          </div>
        </div>
        <div className="hero-bottom">
          <span>
            {brand.name.toUpperCase()} {brand.subtitle.toUpperCase()}
          </span>
          <span>{brand.location.toUpperCase()}</span>
        </div>
      </section>
      <ServiceCards />
      <section className="editorial-section section">
        <div className="editorial-image">
          <Photo
            src={home.editorial.image}
            alt="O olhar atento da fotógrafa durante o trabalho"
            position="75% 25%"
          />
        </div>
        <div className="editorial-copy" data-reveal>
          <p className="script-line">{home.editorial.eyebrow}</p>
          <h2 className="preserve-lines">{home.editorial.title}</h2>
          <span className="hairline" />
          {home.editorial.paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          <a className="editorial-link" href="/sobre">
            {labels.moreAbout} <span aria-hidden="true">↗</span>
          </a>
        </div>
      </section>
      <section className="process-section section">
        <Heading title={home.processTitle} text={home.processIntro} />
        <Process />
        <a className="process-action" href="/como-funciona">
          {labels.moreProcess} <span aria-hidden="true">→</span>
        </a>
      </section>
      <section className="portfolio-preview section">
        <div data-reveal>
          <p className="script-line">{home.portfolioEyebrow}</p>
          <h2 className="preserve-lines">{home.portfolioTitle}</h2>
          <p>
            {portfolio.length && home.portfolioIntro.startsWith("O portfólio está sendo preparado")
              ? "Uma seleção de momentos e histórias para guardar."
              : home.portfolioIntro}
          </p>
          <a className="portfolio-action" href="/portfolio">
            {labels.portfolioCTA} <span aria-hidden="true">↗</span>
          </a>
        </div>
        <div className="portfolio-detail">
          <Photo
            alt="Câmera e mãos da fotógrafa, detalhe da imagem institucional"
            position="40% 65%"
          />
        </div>
      </section>
      {portfolio.some((p) => p.featured) && (
        <section className="section">
          <Heading title="Fotografias em destaque" />
          <div className="featured-photos">
            {portfolio
              .filter((p) => p.featured)
              .slice(0, 6)
              .map((p) => (
                <a key={p.id} href="/portfolio">
                  <img src={resolveAsset(p.src)} alt={p.alt} loading="lazy" />
                  <span>{p.title}</span>
                </a>
              ))}
          </div>
        </section>
      )}
      {testimonials.length > 0 && (
        <section className="section">
          <Heading title={home.testimonialsTitle} />
          <div className="testimonials-grid">
            {testimonials.map((t) => (
              <blockquote key={t.id}>
                {t.photo && <img src={resolveAsset(t.photo)} alt={t.name} />}
                <p>{t.quote}</p>
                <footer>
                  {t.name}
                  {t.context && <small>{t.context}</small>}
                </footer>
              </blockquote>
            ))}
          </div>
        </section>
      )}
      <Closing />
    </Frame>
  );
}
export function InnerHero({
  title,
  text,
  kicker,
}: {
  title: string;
  text?: string;
  kicker?: string;
}) {
  return (
    <section className="inner-hero" data-reveal>
      {kicker && <p className="inner-kicker">{kicker}</p>}
      <h1>{title}</h1>
      <span className="hairline" />
      {text && <p>{text}</p>}
    </section>
  );
}
export function ServicePage({ id }: { id: ServiceId }) {
  const { services, labels } = useSiteContent().content;
  const s = services.find((x) => x.id === id);
  if (!s)
    return (
      <Frame>
        <InnerHero title="Experiência indisponível" />
        <section className="section">
          <a href="/#ensaios">Ver as experiências disponíveis</a>
        </section>
      </Frame>
    );
  return (
    <Frame>
      <InnerHero title={s.headline} text={s.summary} kicker={s.title} />
      <section className="service-detail section">
        <div className="service-detail-image">
          <Photo src={s.image} position={s.focus} alt={s.alt} />
        </div>
        <div data-reveal>
          <h2>{s.sectionTitle}</h2>
          <p>{s.intro}</p>
          <p>{s.detail}</p>
          <ul className="occasion-list">
            {s.occasions.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          <a className="detail-action" href={"/contacto?categoria=" + id}>
            {s.buttonLabel || labels.contactCTA}
          </a>
        </div>
      </section>
      <section className="planning-section section">
        <Heading
          title="Vamos combinar os detalhes."
          text="A proposta é preparada de acordo com a experiência que você imagina."
        />
        <div className="planning-grid">
          {[
            "Local e data",
            "Duração da experiência",
            "Fotografias incluídas",
            "Forma e prazo de entrega",
          ].map((x) => (
            <p key={x}>{x}</p>
          ))}
        </div>
        <p className="planning-note">
          Galeria desta experiência em preparação. Você pode conversar diretamente pelo WhatsApp.
        </p>
      </section>
      <Closing />
    </Frame>
  );
}
export function About() {
  const { brand, about, labels } = useSiteContent().content;
  return (
    <Frame>
      <InnerHero title={about.title} kicker={brand.name.toUpperCase()} text={about.subtitle} />
      <section className="about-section section">
        <div className="about-image">
          <Photo
            src={about.image}
            alt={"Imagem de apresentação da " + brand.name}
            position="70% 35%"
          />
        </div>
        <div data-reveal>
          <p className="script-line">{about.eyebrow}</p>
          <h2 className="preserve-lines">{about.heading}</h2>
          {about.paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          <a className="about-action" href="/contacto">
            {labels.contactCTA}
          </a>
        </div>
      </section>
      <Closing />
    </Frame>
  );
}
export function HowItWorks() {
  return (
    <Frame>
      <InnerHero
        title="Da primeira ideia à fotografia."
        text="Os detalhes são combinados a partir do momento que você quer guardar."
      />
      <section className="section how-process">
        <Process />
      </section>
      <section className="section faq-section">
        <Heading title="Antes do seu ensaio." />
        <FAQ />
      </section>
      <Closing />
    </Frame>
  );
}
function Lightbox({
  photo,
  onClose,
  onPrevious,
  onNext,
}: {
  photo: PortfolioPhoto;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const { resolveAsset } = useSiteContent();
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previousFocus = document.activeElement;
    dialog.current?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="lightbox"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") onPrevious();
        if (e.key === "ArrowRight") onNext();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <button autoFocus className="lightbox-close" onClick={onClose} aria-label="Fechar fotografia">
        ×
      </button>
      <button onClick={onPrevious} aria-label="Fotografia anterior">
        ‹
      </button>
      <figure>
        <img src={resolveAsset(photo.src)} alt={photo.alt} />
        <figcaption>
          {photo.title}
          {photo.description && <p>{photo.description}</p>}
        </figcaption>
      </figure>
      <button onClick={onNext} aria-label="Próxima fotografia">
        ›
      </button>
    </dialog>
  );
}
export function Portfolio() {
  const { content, resolveAsset } = useSiteContent();
  const { portfolio, services, categories, labels } = content;
  const [filter, setFilter] = useState<ServiceId | "todas">("todas");
  const [selected, setSelected] = useState<number | null>(null);
  const photos = portfolio.filter((p) => filter === "todas" || p.category === filter);
  return (
    <Frame>
      <InnerHero
        title="Histórias que merecem ficar."
        text="Casais, aniversários e momentos espontâneos."
      />
      <section className="section portfolio-page">
        {portfolio.length > 0 ? (
          <>
            <div className="portfolio-filters" aria-label="Filtrar fotografias">
              {[{ id: "todas", title: "Todas" }, ...categories].map((s) => (
                <button
                  key={s.id}
                  aria-pressed={s.id === filter}
                  onClick={() => {
                    setFilter(s.id as typeof filter);
                    setSelected(null);
                  }}
                >
                  {s.title}
                </button>
              ))}
            </div>
            <div className="gallery-grid">
              {photos.map((p, i) => (
                <button key={p.src} onClick={() => setSelected(i)} aria-label={"Ampliar " + p.alt}>
                  <img src={resolveAsset(p.src)} alt={p.alt} loading="lazy" />
                </button>
              ))}
            </div>
            {photos.length === 0 && <p>Nenhuma fotografia nesta categoria por enquanto.</p>}
            {selected !== null && photos[selected] && (
              <Lightbox
                photo={photos[selected]}
                onClose={() => setSelected(null)}
                onNext={() => setSelected((selected + 1) % photos.length)}
                onPrevious={() => setSelected((selected + photos.length - 1) % photos.length)}
              />
            )}
          </>
        ) : (
          <div className="portfolio-empty" data-reveal>
            <div className="empty-mark" aria-hidden="true">
              M<span>R</span>
            </div>
            <h2>Novas histórias, em breve.</h2>
            <p>
              Estamos preparando a seleção de fotografias do portfólio.
              <br />
              Até lá, conheça os ensaios e fale sobre o que deseja fotografar.
            </p>
            <div className="empty-links">
              {services.map((s) => (
                <a key={s.id} href={"/ensaios/" + s.id}>
                  {s.title} ↗
                </a>
              ))}
            </div>
            <a className="empty-action" href="/contacto">
              Pedir orçamento
            </a>
          </div>
        )}
      </section>
      <Closing />
    </Frame>
  );
}
export function Privacy() {
  const { brand } = useSiteContent().content;
  return (
    <Frame>
      <InnerHero title="Privacidade" text="Informações sobre o contato e a navegação neste site." />
      <section className="legal-copy section">
        <h2>Contato pelo WhatsApp</h2>
        <p>
          O formulário prepara uma mensagem no seu navegador. O site não envia nem armazena os
          campos em um banco de dados. Ao escolher “Abrir WhatsApp”, o nome, a experiência, a data,
          o local e a mensagem são incluídos no link que abre o WhatsApp.
        </p>
        <p>
          Você pode revisar a mensagem antes de enviá-la na conversa. O serviço WhatsApp tem suas
          próprias condições e política de privacidade.
        </p>
        <h2>Navegação</h2>
        <p>
          Este site não utiliza ferramentas próprias de publicidade ou análise de comportamento. A
          hospedagem pode processar dados técnicos necessários para entregar as páginas e manter o
          serviço seguro.
        </p>
        <h2>Fale com a MR Memorie</h2>
        <p>
          Para assuntos relacionados ao contato ou aos dados compartilhados na conversa, use o
          número <a href={"tel:" + brand.phone.replace(/[^+\d]/g, "")}>{brand.phone}</a>.
        </p>
        <a className="legal-back" href="/contacto">
          Voltar ao contato →
        </a>
      </section>
    </Frame>
  );
}
