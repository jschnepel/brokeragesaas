export const homeContent = {
  intro: {
    kicker: 'A Portfolio, Not a Listing Site',
    headlineLeft: 'Represented with *discretion,*',
    headlineRight: 'delivered with *distinction.*',
    lead: 'Yong Choi represents the Phoenix Metro’s most private estates.',
    body:
      'A former advisor turned broker — with $1.2B in career sales across Silverleaf, Desert Mountain, Estancia, Paradise Valley and DC Ranch. Every representation is bespoke.',
  },
  portfolio: {
    // ARMLS audit F1 reframing — section previously read
    // "Current Portfolio · Now offering" alongside third-party IDX
    // cards, implying the listings were Yong's representations. The
    // pivot is to "Top of the Market · Currently for sale across
    // the Valley" so the section is honest about what it surfaces:
    // the active aggregator-fed inventory. Curated representations
    // live at /portfolio (the CTA target). Each card carries the
    // ARMLS IDX badge + "Courtesy of {Office}" attribution when the
    // listing is third-party. Section footnote in the component
    // names the data source.
    kicker: 'Top of the Market',
    headline: 'Currently for sale across the Valley.',
    cta: { label: 'View Yong’s Portfolio', href: '/portfolio' },
  },
  communities: {
    kicker: 'The Communities',
    headline: 'Where buyers choose to live.',
    cta: { label: 'Explore Communities', href: '/communities' },
  },
  market: {
    kicker: 'Market Intelligence',
    bigStat: '$3.4M',
    bigStatLabel: 'Phoenix Metro · Median Luxury Sale',
    body:
      'Yong’s practice is built on market intelligence — live pricing, velocity, and neighborhood-level benchmarks.',
    cta: { label: 'Read the Reports', href: '/market-reports' },
  },
  contactCta: {
    kicker: 'An Invitation',
    headline: '*Let’s begin* a conversation.',
    body:
      'Whether you’re assessing a move or years away, every client relationship starts with a conversation.',
  },
} as const;
