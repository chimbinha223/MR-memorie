import { createFileRoute } from "@tanstack/react-router";
import { Frame, InnerHero } from "../site/Site";
import ContactForm from "../site/ContactForm";
import { brand } from "../site/data";
import { pageHead } from "../site/seo";
export const Route = createFileRoute("/contacto")({
  validateSearch: (search: Record<string, unknown>) => ({
    categoria:
      typeof search.categoria === "string" &&
      ["casais", "aniversarios", "casuais"].includes(search.categoria)
        ? search.categoria
        : "",
  }),
  head: () =>
    pageHead(
      "/contacto",
      "Pedir orçamento",
      "Conte a sua ideia e converse com a MR Memorie pelo WhatsApp.",
    ),
  component: Contact,
});
function Contact() {
  const { categoria } = Route.useSearch();
  return (
    <Frame>
      <InnerHero title="Conte a sua ideia." text="Alguns detalhes ajudam a dar o primeiro passo." />
      <section className="contact-layout section">
        <aside className="contact-aside">
          <p className="script-line">Vamos conversar.</p>
          <h2>
            Uma fotografia começa
            <br />
            com um encontro.
          </h2>
          <p>{brand.location}</p>
          <a href={"https://wa.me/" + brand.whatsapp} target="_blank" rel="noopener noreferrer">
            {brand.phone} ↗
          </a>
          <p className="contact-explanation">
            Prepare sua mensagem pelo formulário ou converse diretamente no WhatsApp. A data e a
            disponibilidade serão combinadas na conversa.
          </p>
        </aside>
        <ContactForm initialCategory={categoria} />
      </section>
    </Frame>
  );
}
