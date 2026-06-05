import { siteConfig } from "@/lib/config/site";

const bookingUseCases = [
  "weddings and sangeet ceremonies",
  "corporate events and galas",
  "college festivals and fests",
  "private parties and celebrations",
  "social gatherings and community events",
];

const benefitPhrases = [
  "100% verified artists with proven track records",
  "direct booking at lowest-commission pricing",
  "dedicated concierge support throughout your event",
  "hassle-free contract and logistics management",
];

function pick<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function getCategoryEventTypes(category: string): string[] {
  const lower = category.toLowerCase();
  if (lower.includes("dj") || lower.includes("music") || lower.includes("band"))
    return ["wedding receptions", "corporate parties", "college fests", "nightclub events"];
  if (lower.includes("comed") || lower.includes("anchor") || lower.includes("emcee"))
    return ["corporate events", "award ceremonies", "college fests", "stand-up nights"];
  if (lower.includes("dancer") || lower.includes("dance"))
    return ["wedding sangeet", "corporate events", "stage shows", "festival celebrations"];
  return ["weddings", "corporate events", "private parties", "college festivals"];
}

function getCategoryArtistTerms(category: string): string[] {
  const lower = category.toLowerCase();
  if (lower.includes("dj")) return ["DJs", "disc jockeys", "turntablists", "electronic music artists"];
  if (lower.includes("singer") || lower.includes("vocal")) return ["singers", "vocalists", "playback artists", "live performers"];
  if (lower.includes("band") || lower.includes("music")) return ["live bands", "music groups", "ensembles", "instrumentalists"];
  if (lower.includes("comed")) return ["stand-up comedians", "comedy artists", "humorists", "comedy performers"];
  if (lower.includes("dancer") || lower.includes("dance")) return ["dancers", "dance troupes", "choreographers", "dance performers"];
  if (lower.includes("anchor") || lower.includes("emcee")) return ["anchors", "emcees", "hosts", "event presenters"];
  return [`${category} artists`, `${category} performers`, `${category} professionals`, `${category} talents`];
}

function getCityEventScene(city: string): string {
  const cityLower = city.toLowerCase();
  const scenes: Record<string, string> = {
    mumbai: "Mumbai, the city of dreams, boasts India's most vibrant entertainment scene with Bollywood glamour, thriving live music venues, and a bustling corporate events landscape.",
    delhi: "Delhi NCR is a powerhouse of cultural events, wedding celebrations, and corporate galas, making it one of India's largest entertainment markets.",
    bangalore: "Bangalore's cosmopolitan culture fuels a dynamic live entertainment ecosystem with a unique blend of corporate events, music festivals, and pub performances.",
    hyderabad: "Hyderabad's rich cultural heritage combined with its rapidly growing corporate sector creates a thriving demand for premium entertainment.",
    chennai: "Chennai's deep-rooted musical traditions and flourishing film industry make it a unique market for artist bookings and live performances.",
    kolkata: "Kolkata's cultural renaissance and love for music, literature, and performing arts make it a distinctive market for entertainment booking.",
    pune: "Pune's youthful energy, education hubs, and growing corporate presence drive a vibrant events and entertainment scene.",
    jaipur: "Jaipur's royal heritage and booming wedding tourism industry create exceptional opportunities for premium artist bookings.",
    lucknow: "Lucknow's refined cultural tastes and growing corporate events market demand high-quality entertainment options.",
    ahmedabad: "Ahmedabad's thriving business community and love for cultural celebrations fuel a robust entertainment booking market.",
  };
  return scenes[cityLower] || `${capitalize(city)} has a growing entertainment and events scene with increasing demand for professional artist bookings across weddings, corporate events, and private celebrations.`;
}

export function categorySeoContent(category: string, total: number): string {
  const eventTypes = getCategoryEventTypes(category);
  const artistTerms = getCategoryArtistTerms(category);
  const twoUses = pick(bookingUseCases, 2);
  const twoBenefits = pick(benefitPhrases, 2);

  return (
    `Looking to book top-tier ${category.toLowerCase()} performers for your next event? ${siteConfig.name} connects you with ${total > 0 ? `over ${total} verified` : "professional"} ${artistTerms[0].toLowerCase()} across India. ` +
    `Whether you need entertainment for ${twoUses[0]}, ${twoUses[1]}, or any special occasion, our curated roster of ${category.toLowerCase()} talent ensures you find the perfect match for your event's theme, budget, and audience.` +
    `\n\n` +
    `${artistTerms[1]} bring energy, artistry, and unforgettable moments to every stage. From ${eventTypes[0]} to ${eventTypes[1]}, our ${category.toLowerCase()} professionals have the experience and versatility to elevate your event. ` +
    `We carefully vet each artist for professional reliability, performance quality, and audience engagement — so you can book with complete confidence.` +
    `\n\n` +
    `Why choose ${siteConfig.name} for hiring ${category.toLowerCase()} talent? ` +
    `${capitalize(twoBenefits[0])}. ${capitalize(twoBenefits[1])}. ` +
    `Plus, our dedicated booking team provides personalized recommendations, transparent pricing, and end-to-end coordination — from first inquiry to final bow.` +
    `\n\n` +
    `Browse our complete collection of ${category.toLowerCase()} artists below, filter by city or budget, and submit a booking request. ` +
    `Our team typically responds within 24 hours with availability, customized pricing packages, and expert guidance to make your event truly spectacular.`
  );
}

export function citySeoContent(city: string, total: number): string {
  const scene = getCityEventScene(city);
  const twoBenefits = pick(benefitPhrases, 2);

  return (
    `${scene} ` +
    `${siteConfig.name} features ${total > 0 ? `${total}+ verified` : "a wide selection of verified"} performers based in or available in ${capitalize(city)} — including singers, DJs, comedians, bands, dancers, anchors, and more.` +
    `\n\n` +
    `Whether you're planning a wedding celebration, corporate gala, college festival, or private party in ${capitalize(city)}, finding the right entertainment is crucial for creating memorable experiences. ` +
    `Our platform makes it easy to discover, compare, and book ${city}-based artists who understand the local audience and event landscape.` +
    `\n\n` +
    `${capitalize(twoBenefits[0])}. ${capitalize(twoBenefits[1])}. ` +
    `Our ${capitalize(city)} booking team has deep knowledge of the local entertainment scene and can help match you with artists who fit your specific requirements, venue, and budget.` +
    `\n\n` +
    `Browse the full list of performers available in ${capitalize(city)} below. ` +
    `Each artist profile includes performance videos, past event photos, genre specialties, and direct booking options. ` +
    `Submit an enquiry today and let us help make your ${capitalize(city)} event truly unforgettable.`
  );
}

export function categoryMetaDescription(category: string): string {
  const lower = category.toLowerCase();
  if (lower.includes("singer") || lower.includes("vocal"))
    return `Book verified ${lower} artists for weddings, corporate events, and parties in India. Browse top playback singers, Bollywood vocalists, and independent artists at ${siteConfig.name}.`;
  if (lower.includes("dj"))
    return `Hire professional DJs for weddings, clubs, and corporate events across India. Browse verified disc jockeys, turntablists, and electronic music artists at ${siteConfig.name}.`;
  if (lower.includes("comed") || lower.includes("comic"))
    return `Book stand-up comedians for corporate events, college fests, and private parties in India. Hire verified comedy artists at ${siteConfig.name}.`;
  if (lower.includes("band") || lower.includes("music"))
    return `Hire live bands for weddings, sangeet, and corporate events across India. Browse verified music groups, ensembles, and instrumentalists at ${siteConfig.name}.`;
  if (lower.includes("dancer") || lower.includes("dance"))
    return `Book professional dancers and dance troupes for weddings, sangeet, and events in India. Hire verified choreographers at ${siteConfig.name}.`;
  if (lower.includes("anchor") || lower.includes("emcee"))
    return `Hire professional anchors and emcees for corporate events, award ceremonies, and weddings in India. Book verified hosts at ${siteConfig.name}.`;
  return `Book verified ${lower} artists for weddings, corporate events, and private parties in India. Browse top ${lower} performers at ${siteConfig.name}.`;
}

export function cityMetaDescription(city: string): string {
  return `Find and book top performers in ${city} for weddings, corporate events, and private parties. Browse verified singers, DJs, comedians, bands, and more in ${city} at ${siteConfig.name}.`;
}
