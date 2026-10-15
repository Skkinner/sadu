// Verified source notes: the ONLY factual material the LLM may use when it writes station stories, quiz
// questions and narrative bridges (see src/server/ai). Keep each note short, factual and cited.
// Editors: change a note → its hash changes → cached AI content for that station is regenerated.
// Before a public launch, re-check every reference link and statement against the cited source.
import type { PavilionId } from "./pavilions.ts";

export type Reference = { id: string; title: string; publisher: string; year?: number; url: string };
export type StationSource = { topic: string; facts: string[]; references: Reference[] };

const ICH_LISTS = "https://ich.unesco.org/en/lists";

export const SOURCES: Record<PavilionId, StationSource> = {
  saudi: {
    topic: "Al Sadu, the traditional Bedouin weaving of Saudi Arabia",
    facts: [
      "Al Sadu is a traditional form of weaving practised by Bedouin women in Saudi Arabia and Kuwait. [unesco-sadu]",
      "Weavers spin and weave sheep wool, camel hair and goat hair, traditionally on a horizontal ground loom. [unesco-sadu]",
      "Sadu textiles were used for Bedouin tents, room dividers, rugs, cushions and camel trappings. [unesco-sadu]",
      "Sadu patterns are geometric, and the wool was traditionally coloured with natural dyes. [unesco-sadu]",
      "Skills were passed down within families, from older women to girls. [unesco-sadu]",
      "In 2020 UNESCO inscribed \"Al Sadu, traditional weaving skills in Saudi Arabia and Kuwait\" on its Representative List of the Intangible Cultural Heritage of Humanity. [unesco-sadu]",
    ],
    references: [{ id: "unesco-sadu", title: "Al Sadu, traditional weaving skills in Saudi Arabia and Kuwait", publisher: "UNESCO Intangible Cultural Heritage", year: 2020, url: ICH_LISTS }],
  },
  japan: {
    topic: "The Japanese tea ceremony and the idea of hospitality",
    facts: [
      "The Japanese tea ceremony (chanoyu, also called sadō, \"the way of tea\") is the ritual preparation and serving of powdered green tea, matcha. [britannica-tea]",
      "The host prepares the tea in front of the guests, whisking matcha and hot water with a bamboo whisk called a chasen. [britannica-tea]",
      "The tea master Sen no Rikyū shaped the practice in the 16th century, emphasising simplicity and calm. [britannica-tea]",
      "The phrase \"ichi-go ichi-e\" (\"one time, one meeting\") is associated with the tea ceremony: each gathering is unique and will never be repeated. [wiki-ichigo]",
      "Like Arabic coffee in Saudi Arabia, serving tea is a way of honouring a guest. (Editorial comparison made by Sadu.) [britannica-tea]",
    ],
    references: [
      { id: "britannica-tea", title: "Tea ceremony", publisher: "Encyclopaedia Britannica", url: "https://www.britannica.com/topic/tea-ceremony" },
      { id: "wiki-ichigo", title: "Ichi-go ichi-e", publisher: "Wikipedia", url: "https://en.wikipedia.org/wiki/Ichi-go_ichi-e" },
    ],
  },
  morocco: {
    topic: "Moroccan zellige tilework",
    facts: [
      "Zellige (zellij) is a Moroccan mosaic made of individually hand-cut pieces of glazed terracotta tile set into plaster. [wiki-zellij]",
      "Zellige is arranged in geometric patterns and decorates walls, floors, fountains and courtyards in Moroccan architecture. [wiki-zellij]",
      "Fez is closely associated with the craft, and its medina is a UNESCO World Heritage Site, inscribed in 1981. [whc-fez]",
      "Geometric ornament is a shared tradition across Islamic art, from Morocco to the Arabian Peninsula. (Editorial comparison made by Sadu.) [wiki-zellij]",
    ],
    references: [
      { id: "wiki-zellij", title: "Zellij", publisher: "Wikipedia", url: "https://en.wikipedia.org/wiki/Zellij" },
      { id: "whc-fez", title: "Medina of Fez", publisher: "UNESCO World Heritage Centre", year: 1981, url: "https://whc.unesco.org/en/list/170" },
    ],
  },
  mexico: {
    topic: "Maize and traditional Mexican cuisine",
    facts: [
      "In 2010 UNESCO inscribed traditional Mexican cuisine on its Representative List of the Intangible Cultural Heritage of Humanity. [unesco-mexico]",
      "Traditional Mexican cuisine is built on maize, beans and chili. [unesco-mexico]",
      "Nixtamalization is the ancient process of cooking and soaking maize in an alkaline solution, such as lime water, before grinding it into dough. [wiki-nixtamal]",
      "At El Castillo in Chichén Itzá, the setting sun at the spring and autumn equinoxes casts a shadow that looks like a serpent descending the pyramid's steps. [whc-chichen]",
    ],
    references: [
      { id: "unesco-mexico", title: "Traditional Mexican cuisine - ancestral, ongoing community culture, the Michoacán paradigm", publisher: "UNESCO Intangible Cultural Heritage", year: 2010, url: ICH_LISTS },
      { id: "wiki-nixtamal", title: "Nixtamalization", publisher: "Wikipedia", url: "https://en.wikipedia.org/wiki/Nixtamalization" },
      { id: "whc-chichen", title: "Pre-Hispanic City of Chichen-Itza", publisher: "UNESCO World Heritage Centre", year: 1988, url: "https://whc.unesco.org/en/list/483" },
    ],
  },
  korea: {
    topic: "Korean bojagi, hanji paper and ondol heating",
    facts: [
      "Bojagi are traditional Korean wrapping cloths used to wrap, carry and store things, including gifts. [wiki-bojagi]",
      "Many bojagi are patchwork, pieced together from leftover scraps of fabric. [wiki-bojagi]",
      "Hanji is traditional Korean handmade paper made from the inner bark of the paper mulberry tree. [wiki-hanji]",
      "Hanji has been used for books, windows, doors and lanterns. [wiki-hanji]",
      "Ondol is the traditional Korean underfloor heating system: heat from a fire travels through channels beneath a stone floor. [wiki-ondol]",
    ],
    references: [
      { id: "wiki-bojagi", title: "Bojagi", publisher: "Wikipedia", url: "https://en.wikipedia.org/wiki/Bojagi" },
      { id: "wiki-hanji", title: "Hanji", publisher: "Wikipedia", url: "https://en.wikipedia.org/wiki/Hanji" },
      { id: "wiki-ondol", title: "Ondol", publisher: "Wikipedia", url: "https://en.wikipedia.org/wiki/Ondol" },
    ],
  },
  coffee: {
    topic: "Arabic coffee, a symbol of generosity",
    facts: [
      "In 2015 UNESCO inscribed \"Arabic coffee, a symbol of generosity\" on its Representative List; it was nominated by the United Arab Emirates, Saudi Arabia, Oman and Qatar. [unesco-coffee]",
      "Serving Arabic coffee is an important part of hospitality and a sign of generosity toward guests. [unesco-coffee]",
      "The beans are roasted, ground or pounded, and brewed in a pot; the coffee is served in small cups. [unesco-coffee]",
      "In Saudi Arabia the coffee pot is called a dallah, and coffee is often flavoured with cardamom and served with dates. [wiki-arabic-coffee]",
    ],
    references: [
      { id: "unesco-coffee", title: "Arabic coffee, a symbol of generosity", publisher: "UNESCO Intangible Cultural Heritage", year: 2015, url: ICH_LISTS },
      { id: "wiki-arabic-coffee", title: "Arabic coffee", publisher: "Wikipedia", url: "https://en.wikipedia.org/wiki/Arabic_coffee" },
    ],
  },
  diriyah: {
    topic: "At-Turaif in Diriyah and Najdi mud-brick architecture",
    facts: [
      "At-Turaif District in ad-Dir'iyah was inscribed as a UNESCO World Heritage Site in 2010. [whc-turaif]",
      "At-Turaif was the first capital of the Saudi dynasty, in the heart of the Arabian Peninsula, north-west of Riyadh. [whc-turaif]",
      "It is an outstanding example of the Najdi architectural style, built mainly of mud brick. [whc-turaif]",
      "Najdi mud-brick buildings use thick earthen walls and courtyards, which help keep interiors cooler in the desert climate. [wiki-najdi]",
    ],
    references: [
      { id: "whc-turaif", title: "At-Turaif District in ad-Dir'iyah", publisher: "UNESCO World Heritage Centre", year: 2010, url: "https://whc.unesco.org/en/list/1329" },
      { id: "wiki-najdi", title: "Najdi architecture", publisher: "Wikipedia", url: "https://en.wikipedia.org/wiki/Najdi_architecture" },
    ],
  },
  hegra: {
    topic: "Hegra (Al-Hijr), the Nabataean site in AlUla",
    facts: [
      "Hegra, also known as Al-Hijr or Mada'in Salih, is in the AlUla region of Saudi Arabia. [whc-hegra]",
      "It is the largest conserved site of the Nabataean civilization south of Petra, the Nabataean capital in present-day Jordan. [whc-hegra]",
      "Its well-preserved monumental tombs, many with decorated façades, were carved into sandstone outcrops and date from around the 1st century BC to the 1st century AD. [whc-hegra]",
      "The site also has inscriptions and wells. [whc-hegra]",
      "In 2008 it became the first UNESCO World Heritage Site in Saudi Arabia. [whc-hegra]",
    ],
    references: [{ id: "whc-hegra", title: "Al-Hijr Archaeological Site (Madâin Sâlih)", publisher: "UNESCO World Heritage Centre", year: 2008, url: "https://whc.unesco.org/en/list/1293" }],
  },
  ahsa: {
    topic: "Al-Ahsa Oasis, an evolving cultural landscape",
    facts: [
      "Al-Ahsa Oasis in eastern Saudi Arabia was inscribed as a UNESCO World Heritage Site in 2018 as an evolving cultural landscape. [whc-ahsa]",
      "It is one of the largest oases in the world and has millions of date palms. [whc-ahsa]",
      "Its landscape includes gardens, canals, springs, wells and a drainage lake, together with historic buildings and archaeological sites. [whc-ahsa]",
      "The oasis shows how people have managed scarce water in a desert environment over a very long time. [whc-ahsa]",
    ],
    references: [{ id: "whc-ahsa", title: "Al-Ahsa Oasis, an Evolving Cultural Landscape", publisher: "UNESCO World Heritage Centre", year: 2018, url: "https://whc.unesco.org/en/list/1563" }],
  },
  ardah: {
    topic: "Al-Ardah (Alardah Alnajdiyah): dance, drumming and poetry",
    facts: [
      "In 2015 UNESCO inscribed \"Alardah Alnajdiyah, dance, drumming and poetry in Saudi Arabia\" on its Representative List. [unesco-ardah]",
      "Al-Ardah combines dance, drumming and the chanting of poetry. [unesco-ardah]",
      "Performers stand in rows holding swords and move together to the rhythm of the drums, while a poet chants verses. [unesco-ardah]",
      "It is performed at national and religious celebrations and other community occasions. [unesco-ardah]",
    ],
    references: [{ id: "unesco-ardah", title: "Alardah Alnajdiyah, dance, drumming and poetry in Saudi Arabia", publisher: "UNESCO Intangible Cultural Heritage", year: 2015, url: ICH_LISTS }],
  },
};

/** The source note as one block of text, as given to the model. */
export function sourceText(id: PavilionId) {
  const s = SOURCES[id];
  return [`Topic: ${s.topic}`, ...s.facts.map((f) => `- ${f}`), "", "References:", ...s.references.map((r) => `[${r.id}] ${r.publisher}${r.year ? ` (${r.year})` : ""}: ${r.title}`)].join("\n");
}
