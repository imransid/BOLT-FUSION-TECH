import { z } from "zod";

export const sectionIds = [
  "hero",
  "ai_excellence",
  "projects",
  "about",
  "team",
  "recent_works",
  "case_study",
  "process",
  "services",
  "industries",
  "testimonials",
  "faq",
  "cta",
  "schedule_embed",
] as const;

export type SectionId = (typeof sectionIds)[number];

export const industryIconKeySchema = z.enum([
  "edtech",
  "fintech",
  "ecommerce",
  "pharma",
  "telecom",
  "retail",
  "software",
  "startup",
]);

export type IndustryIconKey = z.infer<typeof industryIconKeySchema>;

const navLinkSchema = z.object({
  label: z.string(),
  href: z.string(),
});

const socialLinkSchema = z.object({
  name: z.string(),
  url: z.string().min(1),
});

const faqItemSchema = z.object({
  q: z.string(),
  a: z.string(),
});

const testimonialSchema = z.object({
  name: z.string(),
  role: z.string(),
  text: z.string(),
  stars: z.number().min(1).max(5).default(5),
});

const projectTileSchema = z.object({
  src: z.string(),
  alt: z.string(),
  caption: z.string().optional(),
  isProfile: z.boolean().optional(),
  imgMobileClass: z.string().optional(),
});

const featuredWorkSchema = z.object({
  src: z.string(),
  title: z.string(),
  outcome: z.string(),
  stack: z.string(),
  alt: z.string(),
  imgClass: z.string().optional(),
});

const processStepSchema = z.object({
  num: z.number(),
  title: z.string(),
  desc: z.string(),
});

const serviceCardSchema = z.object({
  title: z.string(),
  desc: z.string(),
});

const industryItemSchema = z.object({
  title: z.string(),
  description: z.string(),
  iconKey: industryIconKeySchema,
});

const teamMemberSchema = z.object({
  name: z.string(),
  handle: z.string(),
  image: z.string(),
  profileUrl: z.string().optional(),
});

const aiMetricSchema = z.object({
  value: z.string(),
  label: z.string(),
  title: z.string(),
  desc: z.string(),
});

const caseStudyKpiSchema = z.object({
  value: z.string(),
  label: z.string(),
  hint: z.string().optional(),
});

const caseStudyLaneSchema = z.object({
  lane: z.number(),
  title: z.string(),
  summary: z.string(),
  traffic: z.string(),
  latency: z.string(),
  bullets: z.array(z.string()),
  costLine: z.string().optional(),
});

const caseStudyStackGroupSchema = z.object({
  title: z.string(),
  items: z.array(z.string()),
});

const caseStudyContextSchema = z.object({
  name: z.string(),
  tagline: z.string(),
  bullets: z.array(z.string()),
  featured: z.boolean().optional(),
});

const experienceRowSchema = z.object({
  role: z.string(),
  company: z.string(),
  period: z.string(),
});

export const siteContentSchema = z.object({
  meta: z.object({
    title: z.string(),
    description: z.string(),
    ogTitle: z.string(),
    ogDescription: z.string(),
  }),
  site: z.object({
    sectionOrder: z.array(z.enum(sectionIds)),
    sectionVisibility: z.record(z.string(), z.boolean()).default({}),
  }),
  navbar: z.object({
    links: z.array(navLinkSchema),
    scheduleCtaLabel: z.string(),
  }),
  footer: z.object({
    copyrightName: z.string(),
    rightsLine: z.string(),
    socialLinks: z.array(socialLinkSchema),
    backToTopLabel: z.string(),
  }),
  hero: z.object({
    badge: z.string(),
    headlineLine1: z.string(),
    headlineLine2: z.string(),
    subtext: z.string(),
    trustPoints: z.array(z.string()),
    logos: z.array(z.string()),
    tagline: z.string(),
    primaryCtaLabel: z.string(),
    primaryCtaHref: z.string(),
    secondaryCtaLabel: z.string(),
    secondaryCtaHref: z.string(),
    scrollHintLeft: z.string(),
    scrollHintRight: z.string(),
  }),
  aiExcellence: z.object({
    headlineLine1: z.string(),
    headlineLine2: z.string(),
    headlineLine3: z.string(),
    intro: z.string(),
    scheduleCtaLabel: z.string(),
    scheduleCtaHref: z.string(),
    imageSrc: z.string(),
    imageAlt: z.string(),
    metrics: z.array(aiMetricSchema),
    footerTitle: z.string(),
    footerSubtitle: z.string(),
    trustPoints: z.array(z.string()),
  }),
  projects: z.object({
    introStart: z.string(),
    introLinkText: z.string(),
    introLinkHref: z.string(),
    introEnd: z.string(),
    tiles: z.array(projectTileSchema),
    featuredDetailLabel: z.string(),
    discussLabel: z.string(),
    mobileStripHint: z.string(),
  }),
  about: z.object({
    title: z.string(),
    bio: z.string(),
    skills: z.array(z.string()),
    experience: z.array(experienceRowSchema),
  }),
  team: z.object({
    benchLabel: z.string(),
    codeComment: z.string(),
    headlineLine1: z.string(),
    headlineLine2: z.string(),
    subtext: z.string(),
    statLabel: z.string(),
    members: z.array(teamMemberSchema),
  }),
  recentWorks: z.object({
    title: z.string(),
    subtitle: z.string(),
    mobileSwipeHint: z.string(),
    items: z.array(featuredWorkSchema),
  }),
  caseStudy: z.object({
    badge: z.string(),
    title: z.string(),
    titleAccentLine: z.string(),
    subtitle: z.string(),
    executiveSummary: z.string(),
    imageSrc: z.string(),
    imageAlt: z.string(),
    kpis: z.array(caseStudyKpiSchema),
    kpiSectionEyebrow: z.string(),
    kpiBlockTitle: z.string(),
    lanesSectionTitle: z.string(),
    lanesIntro: z.string(),
    lanes: z.array(caseStudyLaneSchema),
    stackSectionTitle: z.string(),
    stackBlockTitle: z.string(),
    stackGroups: z.array(caseStudyStackGroupSchema),
    patternsSectionTitle: z.string(),
    patterns: z.array(z.string()),
    architectureSectionTitle: z.string(),
    architectureBlockTitle: z.string(),
    architectureLead: z.string(),
    contexts: z.array(caseStudyContextSchema),
    sharedKernelTitle: z.string(),
    sharedKernelItems: z.array(z.string()),
    diagramBadgeLeft: z.string(),
    diagramBadgeRight: z.string(),
    ctaSupportingText: z.string(),
    primaryCtaLabel: z.string(),
    primaryCtaHref: z.string(),
    secondaryCtaLabel: z.string(),
    secondaryCtaHref: z.string(),
  }),
  process: z.object({
    badge: z.string(),
    title: z.string(),
    intro: z.string(),
    imageSrc: z.string(),
    imageAlt: z.string(),
    discussLabel: z.string(),
    workLabel: z.string(),
    steps: z.array(processStepSchema),
  }),
  services: z.object({
    badge: z.string(),
    title: z.string(),
    intro: z.string(),
    skills: z.array(z.string()),
    discussLabel: z.string(),
    workLabel: z.string(),
    cards: z.array(serviceCardSchema),
    marquee: z.array(z.string()),
    imageSrc: z.string(),
    imageAlt: z.string(),
  }),
  industries: z.object({
    badge: z.string(),
    titleLine1: z.string(),
    titleLine2: z.string(),
    subtitle: z.string(),
    items: z.array(industryItemSchema),
    ctaCardTitle: z.string(),
    ctaCardBody: z.string(),
    ctaCardButton: z.string(),
    learnMoreLabel: z.string(),
  }),
  testimonials: z.object({
    badge: z.string(),
    title: z.string(),
    intro: z.string(),
    startConversationLabel: z.string(),
    startConversationHref: z.string(),
    recentWorkLabel: z.string(),
    recentWorkHref: z.string(),
    items: z.array(testimonialSchema),
  }),
  faq: z.object({
    badge: z.string(),
    title: z.string(),
    items: z.array(faqItemSchema),
  }),
  cta: z.object({
    statusLabel: z.string(),
    title: z.string(),
    body: z.string(),
    scheduleLabel: z.string(),
    scheduleHref: z.string(),
    emailLabel: z.string(),
    emailHref: z.string(),
  }),
  scheduleEmbed: z.object({
    blurb: z.string(),
  }),
});

export type SiteContent = z.infer<typeof siteContentSchema>;
