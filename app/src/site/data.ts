export const brand = {
  name: "MR Memorie",
  location: "Viana do Castelo, Portugal",
  phone: "+351 938 348 287",
  whatsapp: "351938348287",
  origin: "https://mr-memorie.higgsfield.app",
};
export type ServiceId = "casais" | "aniversarios" | "casuais";
export const services = [
  {
    id: "casais" as ServiceId,
    title: "Casais",
    tagline: "O jeito de vocês, juntos.",
    summary:
      "Uma caminhada, uma troca de olhares, um lugar com significado. Um ensaio para a história que vocês estão vivendo.",
    headline: "O jeito de vocês, juntos.",
    intro:
      "Cada casal tem seu próprio ritmo. Pode ser um reencontro, uma data especial ou simplesmente a vontade de guardar como é estar juntos.",
    detail:
      "Pensem nos lugares que fazem parte da relação: onde se conheceram, um passeio favorito ou um cenário que desejam descobrir.",
    occasions: [
      "Um ensaio a dois",
      "Aniversário de namoro ou casamento",
      "Uma nova fase da relação",
    ],
    focus: "70% 35%",
  },
  {
    id: "aniversarios" as ServiceId,
    title: "Aniversários",
    tagline: "Mais um ano. Tantas histórias.",
    summary:
      "Os encontros, os detalhes, o abraço depois dos parabéns. Fotografias para celebrar uma nova fase.",
    headline: "Mais um ano. Tantas histórias.",
    intro:
      "Um aniversário pode reunir todo mundo ou reservar um momento só para você. Escolha entre fotografar a festa e criar um ensaio comemorativo.",
    detail:
      "Na cobertura, a atenção acompanha a celebração e os convidados. No ensaio, reservamos um tempo para retratos que marquem este capítulo.",
    occasions: [
      "Cobertura de festa",
      "Ensaio comemorativo",
      "Um encontro com quem faz parte da sua história",
    ],
    focus: "35% 65%",
  },
  {
    id: "casuais" as ServiceId,
    title: "Casual",
    tagline: "Um momento para ser você.",
    summary:
      "Retratos em um ritmo leve, sozinho ou em boa companhia. Sem precisar de uma ocasião especial.",
    headline: "Você não precisa de uma ocasião.",
    intro:
      "Um passeio, uma nova fase ou a vontade de se ver de outra maneira. O ensaio casual começa nos detalhes com os quais você se identifica.",
    detail:
      "Você pode imaginar um momento só seu ou incluir amigos. Conte quais lugares, roupas e ideias fazem parte dessa experiência.",
    occasions: [
      "Retratos individuais",
      "Um encontro entre amigos",
      "Um dia para fazer algo por você",
    ],
    focus: "75% 50%",
  },
];
export const steps = [
  {
    title: "Conte a sua ideia",
    text: "Escolha a experiência e compartilhe a data, o local e o que está imaginando. Tudo pode começar com uma conversa.",
  },
  {
    title: "Combinamos os detalhes",
    text: "Formato, duração, valores e condições de entrega fazem parte da proposta, antes da reserva.",
  },
  {
    title: "Viva o momento",
    text: "No dia, a experiência segue o ritmo combinado. Depois, as fotografias recebem o cuidado definido na proposta.",
  },
];
export const faqs = [
  [
    "Ainda não tenho data ou local. Posso entrar em contato?",
    "Sim. Indique que a data ou o local estão a definir e conte o que já imaginou para a sessão.",
  ],
  [
    "Preciso saber posar?",
    "O ensaio não exige experiência diante da câmera. Conte como você se sente e que tipo de fotografia combina com você.",
  ],
  [
    "Quanto tempo dura uma sessão?",
    "A duração depende do formato e será definida na proposta, antes da reserva.",
  ],
  [
    "Quantas fotografias vou receber?",
    "A quantidade, o formato dos arquivos e as condições de seleção serão informados na proposta.",
  ],
  [
    "Quando recebo as fotografias?",
    "O prazo e a forma de entrega serão combinados antes da reserva.",
  ],
  [
    "Posso escolher um lugar especial?",
    "Compartilhe a sua ideia. A viabilidade do espaço e eventuais deslocamentos são avaliados no planejamento.",
  ],
];
export type PortfolioPhoto = { src: string; alt: string; category: ServiceId; title: string };
export const portfolio: PortfolioPhoto[] = [];
