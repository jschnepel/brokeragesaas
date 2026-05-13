/**
 * Client testimonials sourced from Yong Choi's verified RateMyAgent
 * profile. Pulled by hand from
 * https://www.ratemyagent.com/real-estate-agent/yong-choi-b2wan7/sales/reviews
 *
 * Every review is a verified 5-star review attributed to Yong on
 * RateMyAgent. The reviewer names are anonymised on the source platform,
 * so we display the property city only and link out to the verified
 * source for full provenance.
 */

export type Testimonial = {
  id: string;
  title: string;
  pullQuote: string;
  body: string;
  url: string;
  location: string;
  approxDate: string;
};

export const testimonialsSource = {
  platform: 'RateMyAgent',
  profileUrl:
    'https://www.ratemyagent.com/real-estate-agent/yong-choi-b2wan7/sales/overview',
  reviewsUrl:
    'https://www.ratemyagent.com/real-estate-agent/yong-choi-b2wan7/sales/reviews',
  rating: 5.0,
  totalReviews: 10,
  fiveStarReviews: 10,
} as const;

export const testimonials: readonly Testimonial[] = [
  {
    id: 'gold-standard-service',
    title: 'Gold standard service',
    pullQuote:
      'One of the top experiences we have had with a real estate professional in over 40 years of real estate transactions. He conducts himself with the highest level of integrity, respect and care.',
    body:
      'Working with Yong Choi on the sale of our home has been one of the top experiences we have had with a real estate professional in over 40 years of real estate transactions. He conducts himself with the highest level of integrity, respect and care, not to mention exceptional expertise. We highly recommend Yong and look forward to working with him again in the future.',
    url: 'https://www.ratemyagent.com/real-estate-agent/yong-choi/reviews/p/2305-east-fox-tail-carefree-ab8vd4?profileType=Individual&profileCode=b2wan7',
    location: 'Carefree, AZ',
    approxDate: '4 months ago',
  },
  {
    id: 'smoothest-transaction',
    title: "Smoothest transaction we've ever had",
    pullQuote:
      "His knowledge of the market, the buying process, local vendors and trades made the entire transaction so much less stressful. Yong's knowledge and professionalism made a very complex transaction quite simple.",
    body:
      "It was such a pleasure working with Yong. His knowledge of the market, the buying process, local vendors and trades made the entire transaction so much less stressful. He is super communicative and if he didn't have the answer immediately he found it and got back to us right away. Yong's knowledge and professionalism made a very complex transaction quite simple. We highly recommend Yong Choi to anyone looking for a great real estate experience!",
    url: 'https://www.ratemyagent.com/real-estate-agent/yong-choi/reviews/p/8343-e-spanish-boot-rd-carefree-ab9ptm?profileType=Individual&profileCode=b2wan7',
    location: 'Carefree, AZ',
    approxDate: 'about 1 month ago',
  },
  {
    id: 'absolute-dream',
    title: 'An absolute dream come true',
    pullQuote:
      'Yong is not only an incredible real estate agent, but also someone who truly cares about the people he works with. His knowledge of the market, attention to detail, and honest advice gave us so much confidence throughout the entire journey.',
    body:
      "Working with Yong Choi was truly such a wonderful experience from beginning to end. When my fiancé and I first started thinking about where we wanted to move, we honestly had no idea where to begin. Yong made what could have been an overwhelming process feel comfortable and exciting. From day one, he was incredibly patient, supportive, and always willing to take the time to answer our questions and guide us in the right direction. He was always quick to schedule showings and made himself available whenever we needed him. What meant the most to us was how genuinely he listened to what we were looking for and cared about helping us find a home that truly felt right. His knowledge of the market, attention to detail, and honest advice gave us so much confidence throughout the entire journey. When it came time to make an offer and move through the purchasing process, Yong really went above and beyond. His professionalism, dedication, and strong negotiation skills made a huge difference and helped everything move forward smoothly. Yong is the perfect representation of the professionalism and excellence Russ Lyon Sotheby's is known for.",
    url: 'https://www.ratemyagent.com/real-estate-agent/yong-choi/reviews/p/29257-north-50th-place-phoenix-ab8vd9?profileType=Individual&profileCode=b2wan7',
    location: 'Phoenix, AZ',
    approxDate: 'about 2 months ago',
  },
  {
    id: 'superb-realtor',
    title: 'Superb realtor',
    pullQuote:
      'Yong is very reliable, a great communicator, very knowledgeable about real estate, very trustworthy, and has a warm, friendly and sincere personality. He had our home in escrow within 24 hours of official listing.',
    body:
      'We are honored to write this letter of recommendation for Yong Choi. Yong is very reliable, a great communicator, very knowledgeable about real estate, very trustworthy, and has a warm, friendly and sincere personality. Yong brought a full market analysis of our property, and an analysis of potential homes for us to buy. He had our home in escrow within 24 hours of official listing. Yong helped us negotiate our offer and worked very closely with us through a somewhat complicated escrow. He was excellent at helping us coordinate the closing of the three escrows we were involved in, and the whole process went smoothly. Yong Choi is a fantastic realtor, with a depth of knowledge that is impressive.',
    url: 'https://www.ratemyagent.com/real-estate-agent/yong-choi/reviews/p/7507-e-quien-sabe-way-scottsdale-ab8vd2?profileType=Individual&profileCode=b2wan7',
    location: 'Scottsdale, AZ',
    approxDate: '4 months ago',
  },
  {
    id: 'beyond-expectations',
    title: 'Beyond expectations',
    pullQuote:
      'He was so knowledgeable about the area and what the different communities had to offer. He is a great communicator, always made himself available and was a shark at the negotiating table.',
    body:
      'We really enjoyed working with Yong. He was so knowledgeable about the area and what the different communities had to offer. He is a great communicator, always made himself available and was a shark at the negotiating table!',
    url: 'https://www.ratemyagent.com/real-estate-agent/yong-choi/reviews/p/10795-east-sutherland-way-scottsdale-ab8vdb?profileType=Individual&profileCode=b2wan7',
    location: 'Scottsdale, AZ',
    approxDate: '4 months ago',
  },
  {
    id: 'realtor-extraordinaire',
    title: 'Realtor extraordinaire',
    pullQuote:
      "Yong's knowledge of the market and communication is second to none. He has gone above and beyond — also a resource regarding services and the local area after closing. You couldn't find a better realtor.",
    body:
      "Yong was an excellent realtor to work with on our search. Yong's knowledge of the market and communication is second to none. Yong has gone above and beyond! He has also been a resource regarding services and the local area after closing. You couldn't find a better realtor!",
    url: 'https://www.ratemyagent.com/real-estate-agent/yong-choi/reviews/p/8154-east-tecolote-circle-scottsdale-ab8vd6?profileType=Individual&profileCode=b2wan7',
    location: 'Scottsdale, AZ',
    approxDate: '4 months ago',
  },
  {
    id: 'responsive-proactive',
    title: 'Responsive, pro-active, knowledgeable, and so kind',
    pullQuote:
      'Yong was extraordinarily attentive, responsive, and knowledgeable. He had cleaners, landscapers, contractors, pool maintenance professionals — literally at his fingertips.',
    body:
      'Due to declining health, my parents hadn’t been able to visit their vacation home in almost four years. When I arrived from Canada to assess and get the house ready for sale, I was a little overwhelmed. Very luckily for me, I had engaged Yong as our realtor. Yong had cleaners, landscapers, contractors, pool maintenance professionals, you name it — literally at his fingertips. My husband and I had a week to take care of getting the property into shape for sale, and we saw or spoke to Yong multiple times every day. I felt such relief by the time we left back to Canada, knowing Yong was visiting the property multiple times a week to report on progress. Throughout the process, from the early days of whirlwind cleaning and repairs to listing the property, Yong was extraordinarily attentive, responsive, and knowledgeable. I wholeheartedly recommend engaging Yong Choi if you are in need of a realtor in Maricopa County.',
    url: 'https://www.ratemyagent.com/real-estate-agent/yong-choi/reviews/p/2304-east-fox-tail-carefree-ab4e73?profileType=Individual&profileCode=b2wan7',
    location: 'Carefree, AZ',
    approxDate: 'about 1 year ago',
  },
  {
    id: 'super-responsive',
    title: 'Super responsive, thorough, professional',
    pullQuote:
      'He has helped us purchase three houses and now he is helping two of our kids find houses. He is super responsive and never says no.',
    body:
      'We have had a great experience with Yong. He is super responsive and never says no. He has helped us purchase three houses and now he is helping two of our kids find houses.',
    url: 'https://www.ratemyagent.com/real-estate-agent/yong-choi/reviews/p/1102-south-ironwood-circle-cottonwood-ab9n13?profileType=Individual&profileCode=b2wan7',
    location: 'Cottonwood, AZ',
    approxDate: 'about 1 month ago',
  },
  {
    id: 'great-communication',
    title: 'Great communication and help along the way',
    pullQuote:
      'Very thorough and explained a lot for a first timer. Very responsive via text and call. Answered a ton of questions. Helpful and great experience.',
    body:
      'Very responsive via text and call. Answered a ton of questions. Helpful and great experience. Very thorough and explained a lot for a first timer.',
    url: 'https://www.ratemyagent.com/real-estate-agent/yong-choi/reviews/p/n-37300-north-tom-darlington-drive-carefree-ab9n0x?profileType=Individual&profileCode=b2wan7',
    location: 'Carefree, AZ',
    approxDate: 'about 1 month ago',
  },
  {
    id: 'communicates-options',
    title: 'He communicates options to buyers very well',
    pullQuote:
      'The development had three home options with a number of buyers interested in each. We were instructed to move quickly. He eliminated options that would slow down our process.',
    body:
      'The development had 3 home options with a number of buyers interested in each home type. We were instructed to move quickly if interested. He eliminated options that would slow down our process. During the process he communicates to sellers well.',
    url: 'https://www.ratemyagent.com/real-estate-agent/yong-choi/reviews/p/6623-e-whispering-mesquite-trail-scottsdale-ab9n10?profileType=Individual&profileCode=b2wan7',
    location: 'Scottsdale, AZ',
    approxDate: 'about 1 month ago',
  },
];

export const featuredTestimonialId: Testimonial['id'] = 'gold-standard-service';

export function getFeaturedTestimonial(): Testimonial {
  const featured = testimonials.find((t) => t.id === featuredTestimonialId);
  if (!featured) {
    throw new Error(`Featured testimonial '${featuredTestimonialId}' not found`);
  }
  return featured;
}

export function getSecondaryTestimonials(limit = 6): readonly Testimonial[] {
  return testimonials.filter((t) => t.id !== featuredTestimonialId).slice(0, limit);
}
