// Challenge configurations — expand this as you add more challenges
export const CHALLENGES = {
  pricing: {
    id: 'pricing',
    title: 'Pricing pressure',
    description: 'Customers pushing for discounts, competitor pricing, unable to justify premium',
    questions: [
      {
        question: 'Are customers frequently comparing you on price against competitors?',
        options: ['Yes, almost every deal', 'Sometimes, in competitive situations', 'Rarely — but it\'s a problem when they do'],
      },
      {
        question: 'At what stage do price objections typically come up?',
        options: ['Early — before full understanding', 'During proposal review', 'At final negotiation'],
      },
      {
        question: 'How do you respond when a customer says "your price is too high"?',
        options: ['Explain features and quality', 'Offer a discount', 'Try to understand what they\'re comparing against'],
      },
    ],
    situations: [
      { id: 'discount', title: 'Customer directly asking for a discount', description: 'They want 10-20% off and won\'t budge without it' },
      { id: 'competitor', title: 'Competitor is significantly cheaper', description: 'A known player or new entrant is undercutting you by 20-30%' },
      { id: 'justify', title: 'Unable to justify premium pricing', description: 'You believe in your product but can\'t articulate why it\'s worth more' },
      { id: 'budget', title: 'Customer says budget is limited', description: 'They like your solution but claim they can\'t afford it' },
    ],
  },
  closing: {
    id: 'closing',
    title: 'Closing deals',
    description: 'Deals stuck, "we\'ll get back to you", last-minute objections, decision-maker gone silent',
    questions: [
      {
        question: 'How long has the deal been stuck without progress?',
        options: ['1-2 weeks — recent stall', '3-4 weeks — losing momentum', 'More than a month — feels dead'],
      },
      {
        question: 'Who was the last person you spoke with about this deal?',
        options: ['The decision maker directly', 'A technical evaluator or influencer', 'A procurement / purchasing person'],
      },
      {
        question: 'What was the last thing they said?',
        options: ['"We\'ll get back to you" or "Let us discuss internally"', '"We need to review with management"', '"There are some concerns we need to address"'],
      },
    ],
    situations: [
      { id: 'ghosting', title: 'Customer keeps saying "we\'ll get back"', description: 'Polite stalling with no clear timeline' },
      { id: 'objections', title: 'Last-minute objections killing the deal', description: 'New concerns appear just when you thought it was closed' },
      { id: 'stuck', title: 'Deal stuck after negotiation', description: 'Terms discussed but nothing moves forward' },
      { id: 'silent', title: 'Decision-maker has gone silent', description: 'They were engaged, then suddenly stopped responding' },
    ],
  },
};

export const INDUSTRIES = [
  'Plastic', 'Metal', 'Material handling', 'Printing & packaging',
  'E-mobility', 'Chemical', 'Pharma', 'Machine tools', 'Other',
];

export const CUSTOMER_TYPES = [
  'End users', 'Consultants', 'OEMs', 'Panel builders',
  'EPC contractors', 'Partners', 'Distributors', 'Dealers',
];

export type ChallengeId = keyof typeof CHALLENGES;
