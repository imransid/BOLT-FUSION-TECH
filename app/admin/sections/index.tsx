import type { ComponentType } from "react";

import { MetaSection } from "./MetaSection";
import { NavbarSection } from "./NavbarSection";
import { HeroSection } from "./HeroSection";
import { AiExcellenceSection } from "./AiExcellenceSection";
import { ProjectsSection } from "./ProjectsSection";
import { AboutSection } from "./AboutSection";
import { TeamSection } from "./TeamSection";
import { RecentWorksSection } from "./RecentWorksSection";
import { CaseStudySection } from "./CaseStudySection";
import { ProcessSection } from "./ProcessSection";
import { ServicesSection } from "./ServicesSection";
import { IndustriesSection } from "./IndustriesSection";
import { TestimonialsSection } from "./TestimonialsSection";
import { FaqSection } from "./FaqSection";
import { CtaSection } from "./CtaSection";
import { ScheduleEmbedSection } from "./ScheduleEmbedSection";
import { FooterSection } from "./FooterSection";

export type SectionTab = { key: string; label: string; Component: ComponentType };

/** Editor tabs, in a sensible editing order (superset of the page sections). */
export const SECTION_TABS: SectionTab[] = [
  { key: "meta", label: "SEO / Meta", Component: MetaSection },
  { key: "navbar", label: "Navbar", Component: NavbarSection },
  { key: "hero", label: "Hero", Component: HeroSection },
  { key: "aiExcellence", label: "AI Excellence", Component: AiExcellenceSection },
  { key: "projects", label: "Projects", Component: ProjectsSection },
  { key: "about", label: "About", Component: AboutSection },
  { key: "team", label: "Team", Component: TeamSection },
  { key: "recentWorks", label: "Recent Works", Component: RecentWorksSection },
  { key: "caseStudy", label: "Case Study", Component: CaseStudySection },
  { key: "process", label: "Process", Component: ProcessSection },
  { key: "services", label: "Services", Component: ServicesSection },
  { key: "industries", label: "Industries", Component: IndustriesSection },
  { key: "testimonials", label: "Testimonials", Component: TestimonialsSection },
  { key: "faq", label: "FAQ", Component: FaqSection },
  { key: "cta", label: "CTA", Component: CtaSection },
  { key: "scheduleEmbed", label: "Schedule Embed", Component: ScheduleEmbedSection },
  { key: "footer", label: "Footer", Component: FooterSection },
];
