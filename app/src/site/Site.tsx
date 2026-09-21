import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  brand,
  services,
  steps,
  faqs,
  portfolio,
  type ServiceId,
  type PortfolioPhoto,
} from "./data";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function Photo({
  className = "",
  alt = "A fotógrafa durante uma sessão em estúdio",
  priority = false,
  position,
}: {
  className?: string;
  alt?: string;
  priority?: boolean;
  position?: string;
}) {
  return (
    <img
      className={className}
      src="/assets/photographer-1440.webp"
      srcSet="/assets/photographer-640.webp 640w, /assets/photographer-960.webp 960w, /assets/photographer-1440.webp 1440w"
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
  return (
    <img
      className={"brand-logo" + (inverse ? " inverse" : "")}
      src="/assets/logo.png"
      width={420}
      height={311}
      alt="MR Memorie Photography"
    />
  );
}
function Header({ hero = false }: { hero?: boolean }) {
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
    const closeOnDesktop = () => {
      if (desktop.matches) setOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
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
            ["Casais", "/ensaios/casais"],
            ["Aniversários", "/ensaios/aniversarios"],
            ["Casual", "/ensaios/casuais"],
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
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <Logo />
          <p>
            Casais, aniversários
            <br />e momentos seus.
          </p>
        </div>
        <div>
          <p className="footer-label">VAMOS CONVERSAR</p>
          <a href={"https://wa.me/" + brand.whatsapp} target="_blank" rel="noopener noreferrer">
            {brand.phone}
          </a>
          <p>{brand.location}</p>
        </div>
        <nav aria-label="Navegação do rodapé">
          <a href="/portfolio">Portfólio</a>
          <a href="/como-funciona">Como funciona</a>
          <a href="/contacto">Pedir orçamento</a>
          <a href="/privacidade">Privacidade</a>
        </nav>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} MR Memorie</span>
        <a href="#top">Voltar ao início ↑</a>
      </div>
    </footer>
  );
}
export function Frame({ children, hero = false }: { children: ReactNode; hero?: boolean }) {
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
    <div ref={scope} id="top">
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
  return (
    <section id="ensaios" className="section services-section">
      <Heading
        title="A vida acontece. A fotografia fica."
        text="Há dias marcados no calendário. Outros merecem ser lembrados simplesmente por serem seus."
      />
      <div className="service-grid">
        {services.map((s, i) => (
          <article className={"service-card service-" + i} key={s.id} data-reveal>
            <h3>{s.title}</h3>
            <p className="service-tagline">{s.tagline}</p>
            <a
              href={"/ensaios/" + s.id}
              className="service-media"
              aria-label={"Conhecer os ensaios de " + s.title}
            >
              <Photo
                position={s.focus}
                alt="Detalhe da imagem de apresentação da fotógrafa em estúdio"
              />
              <span className="media-arrow" aria-hidden="true">
                ↗
              </span>
            </a>
            <p className="service-summary">{s.summary}</p>
            <a className="service-action" href={"/ensaios/" + s.id}>
              Conhecer o ensaio
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
export function Process() {
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
  return (
    <section className="closing">
      <div className="closing-image" data-parallax>
        <Photo alt="" position="20% 60%" />
      </div>
      <div className="closing-scrim" />
      <div className="closing-copy" data-reveal>
        <h2>
          Que momento
          <br />
          <em>você quer guardar?</em>
        </h2>
        <p>Conte um pouco sobre o que está imaginando.</p>
        <a className="closing-action" href="/contacto">
          Pedir orçamento
        </a>
      </div>
    </section>
  );
}
export function Home() {
  return (
    <Frame hero>
      <section className="hero">
        <div className="hero-image" data-parallax>
          <Photo
            priority
            alt="Fotógrafa da MR Memorie com a câmera em estúdio"
            position="65% 40%"
          />
        </div>
        <div className="hero-scrim" />
        <div className="hero-copy">
          <p className="hero-kicker">FOTOGRAFIA EM VIANA DO CASTELO</p>
          <h1>
            Fotografias para guardar
            <br />
            <em>o que você sente.</em>
          </h1>
          <p>
            Casais, aniversários e momentos espontâneos.
            <br />
            Com espaço para ser você.
          </p>
          <div className="hero-actions">
            <a className="hero-primary" href="#ensaios">
              Ver ensaios
            </a>
            <a className="hero-secondary" href="/contacto">
              Pedir orçamento
            </a>
          </div>
        </div>
        <div className="hero-bottom">
          <span>MR MEMORIE PHOTOGRAPHY</span>
          <span>VIANA DO CASTELO · PORTUGAL</span>
        </div>
      </section>
      <ServiceCards />
      <section className="editorial-section section">
        <div className="editorial-image">
          <Photo alt="O olhar atento da fotógrafa durante o trabalho" position="75% 25%" />
        </div>
        <div className="editorial-copy" data-reveal>
          <p className="script-line">Um olhar mais próximo</p>
          <h2>
            Entre os grandes dias
            <br />e os pequenos gestos.
          </h2>
          <span className="hairline" />
          <p>
            O abraço que chega sem aviso. O riso no meio da conversa. Os detalhes que fazem um dia
            ser só seu.
          </p>
          <p>A fotografia começa antes do clique: começa no cuidado de olhar.</p>
          <a className="editorial-link" href="/sobre">
            Conhecer a proposta <span aria-hidden="true">↗</span>
          </a>
        </div>
      </section>
      <section className="process-section section">
        <Heading
          title="Tudo começa com uma conversa."
          text="Você traz a sua história. Juntos, pensamos na melhor forma de guardá-la."
        />
        <Process />
        <a className="process-action" href="/como-funciona">
          Ver como funciona <span aria-hidden="true">→</span>
        </a>
      </section>
      <section className="portfolio-preview section">
        <div data-reveal>
          <p className="script-line">Histórias que ficam</p>
          <h2>
            Um lugar para
            <br />
            as suas memórias.
          </h2>
          <p>
            O portfólio está sendo preparado. Enquanto isso, conheça as experiências e conte a sua
            ideia.
          </p>
          <a className="portfolio-action" href="/portfolio">
            Ver portfólio <span aria-hidden="true">↗</span>
          </a>
        </div>
        <div className="portfolio-detail">
          <Photo
            alt="Câmera e mãos da fotógrafa, detalhe da imagem institucional"
            position="40% 65%"
          />
        </div>
      </section>
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
  const s = services.find((x) => x.id === id)!;
  return (
    <Frame>
      <InnerHero title={s.headline} text={s.summary} kicker={s.title} />
      <section className="service-detail section">
        <div className="service-detail-image">
          <Photo position={s.focus} />
        </div>
        <div data-reveal>
          <h2>
            {id === "aniversarios"
              ? "Uma celebração do seu jeito."
              : id === "casais"
                ? "Cada casal tem seu próprio ritmo."
                : "Retratos com o seu ritmo."}
          </h2>
          <p>{s.intro}</p>
          <p>{s.detail}</p>
          <ul className="occasion-list">
            {s.occasions.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          <a className="detail-action" href={"/contacto?categoria=" + id}>
            Pedir orçamento
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
  return (
    <Frame>
      <InnerHero
        title="Espaço para sentir. Tempo para observar."
        kicker="MR MEMORIE"
        text="Fotografia de pessoas em seus próprios momentos, em Viana do Castelo."
      />
      <section className="about-section section">
        <div className="about-image">
          <Photo alt="Imagem de apresentação da fotógrafa da MR Memorie" position="70% 35%" />
        </div>
        <div data-reveal>
          <p className="script-line">Prazer em receber você.</p>
          <h2>
            O cuidado está
            <br />
            no olhar.
          </h2>
          <p>
            A proposta da MR Memorie é fotografar a cumplicidade de um casal, a energia de uma festa
            e a expressão de quem se permite estar diante da câmera.
          </p>
          <p>
            Uma fotografia pode mostrar como foi um dia. Queremos que ela também faça lembrar como
            foi estar ali.
          </p>
          <p>
            Conte a sua ideia. A conversa é o primeiro passo para uma experiência com a sua
            personalidade.
          </p>
          <a className="about-action" href="/contacto">
            Pedir orçamento
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
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
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
        <img src={photo.src} alt={photo.alt} />
        <figcaption>{photo.title}</figcaption>
      </figure>
      <button onClick={onNext} aria-label="Próxima fotografia">
        ›
      </button>
    </dialog>
  );
}
export function Portfolio() {
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
              {[{ id: "todas", title: "Todas" }, ...services].map((s) => (
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
                  <img src={p.src} alt={p.alt} loading="lazy" />
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
          número <a href="tel:+351938348287">{brand.phone}</a>.
        </p>
        <a className="legal-back" href="/contacto">
          Voltar ao contato →
        </a>
      </section>
    </Frame>
  );
}
