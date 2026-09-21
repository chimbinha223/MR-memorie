import { z } from "zod";
const short = z.string().max(300),
  text = z.string().max(6000),
  id = z.string().regex(/^[a-z0-9][a-z0-9-]{0,69}$/, "Use letras minúsculas, números e hífen.");
export const imagePath = z
  .string()
  .max(240)
  .regex(
    /^\/(?:assets\/[A-Za-z0-9_-]+|images\/(?:gallery\/)?[A-Za-z0-9_-]+)\.(?:jpe?g|png|webp|avif)$/i,
    "Escolha uma imagem enviada para o site.",
  );
const optionalImage = z.union([z.literal(""), imagePath]);
const href = z
  .string()
  .max(500)
  .refine(
    (v) =>
      /^\/(?!\/)[a-zA-Z0-9_/?#=&%-]*$/.test(v) ||
      /^#[a-zA-Z0-9_-]+$/.test(v) ||
      /^https:\/\/[^\s]+$/.test(v),
    "Utilize uma ligação interna ou HTTPS.",
  );
const social = z.union([z.literal(""), z.url().startsWith("https://")]);
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Escolha uma cor hexadecimal.");
export const serviceSchema = z
  .object({
    id,
    title: short.min(1),
    tagline: short,
    summary: text,
    headline: short,
    intro: text,
    detail: text,
    occasions: z.array(short).max(20),
    focus: z.string().regex(/^\d{1,3}% \d{1,3}%$/),
    image: imagePath,
    alt: short,
    sectionTitle: short,
    buttonLabel: short,
  })
  .strict();
const photoSchema = z
  .object({
    id: z.string().max(80).min(1),
    src: imagePath,
    alt: short.min(1, "Indique um texto alternativo."),
    category: id,
    title: short,
    description: text,
    featured: z.boolean(),
  })
  .strict();
export const contentSchema = z
  .object({
    version: z.literal(1),
    brand: z
      .object({
        name: short.min(1),
        subtitle: short,
        location: short,
        phone: short,
        whatsapp: z.string().regex(/^\+?[\d\s()-]{6,25}$/, "Indique um número WhatsApp válido."),
        origin: z.url().startsWith("https://"),
        email: z.union([z.literal(""), z.email()]),
        logo: imagePath,
      })
      .strict(),
    home: z
      .object({
        hero: z
          .object({
            eyebrow: short,
            title: short,
            emphasis: short,
            description: text,
            image: imagePath,
            alt: short,
            primaryText: short,
            primaryHref: href,
            secondaryText: short,
            secondaryHref: href,
          })
          .strict(),
        servicesTitle: short,
        servicesIntro: text,
        editorial: z
          .object({
            eyebrow: short,
            title: short,
            paragraphs: z.array(text).max(10),
            image: imagePath,
          })
          .strict(),
        processTitle: short,
        processIntro: text,
        portfolioEyebrow: short,
        portfolioTitle: short,
        portfolioIntro: text,
        closingTitle: short,
        closingIntro: text,
        closingImage: imagePath,
        testimonialsTitle: short,
      })
      .strict(),
    labels: z
      .object({
        serviceCTA: short,
        contactCTA: short,
        moreAbout: short,
        moreProcess: short,
        portfolioCTA: short,
        backToTop: short,
        footerLine: short,
        footerContact: short,
      })
      .strict(),
    services: z.array(serviceSchema).max(30),
    categories: z
      .array(z.object({ id, title: short.min(1) }).strict())
      .min(1)
      .max(40),
    portfolio: z.array(photoSchema).max(500),
    steps: z.array(z.object({ title: short, text }).strict()).max(12),
    faqs: z.array(z.tuple([short.min(1), text])).max(80),
    testimonials: z
      .array(
        z
          .object({
            id: z.string().min(1).max(80),
            name: short.min(1),
            quote: text,
            context: short,
            photo: optionalImage,
          })
          .strict(),
      )
      .max(60),
    about: z
      .object({
        title: short,
        subtitle: text,
        eyebrow: short,
        heading: short,
        paragraphs: z.array(text).max(12),
        image: imagePath,
      })
      .strict(),
    socials: z
      .object({ instagram: social, facebook: social, tiktok: social, youtube: social })
      .strict(),
    seo: z
      .object({
        title: short.min(1),
        description: z.string().max(500),
        ogImage: imagePath,
        noindex: z.boolean(),
        pages: z.record(
          z.string().regex(/^\/[a-z0-9/-]*$/),
          z.object({ title: short, description: z.string().max(500) }).strict(),
        ),
      })
      .strict(),
    appearance: z
      .object({ primary: color, accent: color, background: color, text: color })
      .strict(),
  })
  .strict()
  .superRefine((c, ctx) => {
    for (const [name, items] of [
      ["services", c.services],
      ["categories", c.categories],
      ["portfolio", c.portfolio],
      ["testimonials", c.testimonials],
    ] as const) {
      const seen = new Set<string>();
      items.forEach((item, i) => {
        if (seen.has(item.id))
          ctx.addIssue({
            code: "custom",
            path: [name, i, "id"],
            message: "Identificador repetido.",
          });
        seen.add(item.id);
      });
    }
    const cats = new Set(c.categories.map((x) => x.id));
    c.portfolio.forEach((p, i) => {
      if (!cats.has(p.category))
        ctx.addIssue({
          code: "custom",
          path: ["portfolio", i, "category"],
          message: "A categoria desta fotografia já não existe.",
        });
    });
  });
export type SiteContent = z.infer<typeof contentSchema>;
export type UploadReceipt = { path: string; sha: string; receipt: string };
export type ContentSnapshot = {
  content: SiteContent;
  revision: string;
  assetBase: string;
  initialized: boolean;
};
export function collectImagePaths(value: unknown): Set<string> {
  const paths = new Set<string>();
  function visit(v: unknown) {
    if (typeof v === "string" && imagePath.safeParse(v).success) paths.add(v);
    else if (Array.isArray(v)) v.forEach(visit);
    else if (v && typeof v === "object") Object.values(v).forEach(visit);
  }
  visit(value);
  return paths;
}
export function imageURL(path: string, assetBase: string) {
  return path.startsWith("/images/") && assetBase ? assetBase + path : path;
}
