// Station content. Every station is ILLUSTRATIVE DEMO CONTENT: Sadu is a concept for Expo 2030 Riyadh and none
// of these are confirmed Expo pavilions or attractions.
// The five international pavilions come from the Figma frames (D15–D19, D20/D40–D55); the five Saudi heritage
// stations follow the same structure. Chapters, takeaways and quiz questions here are PRE-WRITTEN FALLBACK copy,
// shown (and labelled as such) only when AI generation is unavailable. AI generation is grounded in
// `src/data/sources.ts`; planning metadata (tags, coordinates, accessibility) lives in `src/data/stations.ts`.
import type { Localized } from "@/i18n/config";

export const STATION_IDS = ["saudi", "japan", "morocco", "mexico", "korea", "coffee", "diriyah", "hegra", "ahsa", "ardah"] as const;
export type PavilionId = (typeof STATION_IDS)[number];
export type Depth = "glimpse" | "visit" | "deep";
export const DEPTHS: Depth[] = ["glimpse", "visit", "deep"];

/** Time spent AT a station for each depth (minutes). Narration is part of it: 1–2, 3–5 and 6–10 min. */
export const DEPTH_MINUTES: Record<Depth, number> = { glimpse: 2, visit: 10, deep: 30 };

export type Chapter = {
  title: Localized;
  /** seconds */
  duration: number;
  /** captions, one line at a time */
  captions: { en: string[]; ar: string[] };
};

export type QuizQuestion = {
  q: Localized;
  /** four options: one correct answer, three distractors */
  options: Localized[];
  correct: number;
  fact: Localized;
};

export type Pavilion = {
  id: PavilionId;
  /** position in the station catalogue (1-based); journey order comes from the route optimizer */
  order: number;
  /** card colour behind the stamp art on the pavilion page */
  cover: string;
  title: Localized; // "Japan Pavilion: the art of hospitality"
  listTitle: Localized; // journey list (slightly shorter for Saudi)
  shortTitle: Localized; // "Japan: the art of hospitality"
  place: Localized; // "Japan Pavilion"
  stampName: Localized; // "Japan" — passport labels & "You earned the Japan stamp!"
  collectName: Localized; // "Japan" / "Saudi Arabia"
  homeMeta?: { depth: Depth; tag: Localized };
  floor: Localized;
  defaultDepth: Depth;
  takeaways: Localized[];
  chapters: Chapter[];
  /** chapter index shown as "Playing" when the story opens */
  startChapter: number;
  route: {
    directions: Localized[];
    walkStory: { title: Localized; duration: number };
  };
  /** pre-written fallback questions, one per depth: [glimpse, visit, deep] */
  quiz: QuizQuestion[];
  /** the essence line shown after the visit */
  essence: Localized;
};

const L = (en: string, ar: string): Localized => ({ en, ar });

export const pavilions: Pavilion[] = [
  {
    id: "saudi",
    order: 1,
    cover: "#14163A",
    title: L("Saudi Pavilion: the woven desert", "جناح السعودية: نسيج الصحراء"),
    listTitle: L("Saudi Pavilion: woven desert", "جناح السعودية: نسيج الصحراء"),
    shortTitle: L("Saudi: the woven desert", "جناح السعودية: نسيج الصحراء"),
    place: L("Saudi Pavilion", "جناح السعودية"),
    stampName: L("Saudi", "السعودية"),
    collectName: L("Saudi Arabia", "السعودية"),
    floor: L("Ground floor", "الطابق الأرضي"),
    defaultDepth: "deep",
    takeaways: [
      L("Sadu is a Bedouin craft women wove from sheep wool and camel hair", "السدو حرفة بدوية نسجتها النساء من صوف الغنم ووبر الإبل"),
      L("Al Sadu joined UNESCO's intangible heritage list in 2020", "سُجّل السدو في قائمة اليونسكو للتراث غير المادي عام 2020"),
      L("Every Sadu motif has a name and a meaning passed down by its weavers", "لكل نقشة في السدو اسم ومعنى تتوارثه النسّاجات"),
    ],
    chapters: [
      {
        title: L("The tent and the loom", "الخيمة والنول"),
        duration: 240,
        captions: {
          en: ["\"The tent was our home, and the loom was its heart.\"", "Women set up a ground loom beside the tent and wove its walls from sheep wool and camel hair."],
          ar: ["«كان بيت الشعر بيتنا، والنول قلبه.»", "نصبت النساء النول الأرضي بجانب البيت، ونسجن جدرانه من صوف الغنم ووبر الإبل."],
        },
      },
      {
        title: L("Colours from the desert", "ألوان من الصحراء"),
        duration: 360,
        captions: {
          en: ["\"The land here doesn't give much, but it gives enough.\"", "Women dyed the wool with what nature gave: henna for reddish orange, pomegranate peel for yellow."],
          ar: ["«الأرض هنا لا تعطي كثيراً، لكنها تعطي ما يكفي.»", "كانت النساء يصبغن الصوف بما تمنحه الطبيعة: الحنّاء للبرتقالي المحمر، وقشر الرمان للأصفر."],
        },
      },
      {
        title: L("The language of motifs", "لغة النقوش"),
        duration: 600,
        captions: {
          en: ["\"Every line in the weave says something.\"", "Diamonds, combs and eyes: each Sadu motif has a name, and weavers read them like words."],
          ar: ["«كل خط في النسيج يقول شيئاً.»", "المعيّنات والأمشاط والعيون: لكل نقشة في السدو اسم، وتقرؤها النسّاجات مثل الكلمات."],
        },
      },
      {
        title: L("Sadu today", "السدو اليوم"),
        duration: 600,
        captions: {
          en: ["\"The loom moved from the tent to the studio.\"", "Today designers carry Sadu into fashion, architecture and the very logo you see here."],
          ar: ["«انتقل النول من البيت إلى المرسم.»", "اليوم يحمل المصممون السدو إلى الأزياء والعمارة، وحتى إلى الشعار الذي تراه هنا."],
        },
      },
    ],
    startChapter: 1,
    route: {
      directions: [
        L("Walk straight 120 m along Oasis Walk", "امشِ مستقيماً 120 م عبر ممر الواحة"),
        L("Turn right at the Sadu fountain", "انعطف يميناً عند نافورة السدو"),
        L("The pavilion is 100 m ahead", "الجناح أمامك بعد 100 م"),
      ],
      walkStory: { title: L("Why the black tent?", "لماذا بيت الشعر؟"), duration: 70 },
    },
    quiz: [
      {
        q: L("What was Sadu traditionally woven from?", "من أي شيء كان يُنسج السدو تقليدياً؟"),
        options: [L("Cotton and silk", "القطن والحرير"), L("Sheep wool and camel hair", "صوف الغنم ووبر الإبل"), L("Palm fronds", "سعف النخيل"), L("Goat leather", "جلد الماعز")],
        correct: 1,
        fact: L("Camel hair kept the tent warm in winter and let air through in summer.", "وبر الإبل يدفّي البيت في الشتاء، ويسمح للهواء بالمرور في الصيف."),
      },
      {
        q: L("In which year was Al Sadu added to UNESCO's intangible heritage list?", "في أي عام سُجّل السدو في قائمة اليونسكو للتراث غير المادي؟"),
        options: [L("2010", "2010"), L("2020", "2020"), L("2000", "2000"), L("2015", "2015")],
        correct: 1,
        fact: L("Saudi Arabia and Kuwait nominated it together, so Sadu is now heritage the whole world protects.", "رشّحته السعودية والكويت معاً، فصار السدو تراثاً يحفظه العالم كله."),
      },
      {
        q: L("Which natural dye gave Sadu wool its yellow?", "أي صبغة طبيعية أعطت صوف السدو لونه الأصفر؟"),
        options: [L("Henna", "الحنّاء"), L("Indigo", "النيلة"), L("Pomegranate peel", "قشر الرمان"), L("Saffron", "الزعفران")],
        correct: 2,
        fact: L("Henna gave the reddish orange, so a single tent could carry the whole desert palette.", "والحنّاء أعطت البرتقالي المحمر، فصار البيت الواحد يحمل ألوان الصحراء كلها."),
      },
    ],
    essence: L("Sadu is not decoration: every motif maps desert life", "السدو ليس زخرفة: كل نقشة خريطة لحياة البادية"),
  },
  {
    id: "japan",
    order: 2,
    cover: "#0B6B57",
    title: L("Japan Pavilion: the art of hospitality", "جناح اليابان: فن الضيافة"),
    listTitle: L("Japan Pavilion: the art of hospitality", "جناح اليابان: فن الضيافة"),
    shortTitle: L("Japan: the art of hospitality", "جناح اليابان: فن الضيافة"),
    place: L("Japan Pavilion", "جناح اليابان"),
    stampName: L("Japan", "اليابان"),
    collectName: L("Japan", "اليابان"),
    homeMeta: { depth: "visit", tag: L("Hospitality", "ضيافة") },
    floor: L("First floor", "الطابق الأول"),
    defaultDepth: "visit",
    takeaways: [
      L("Why serving tea is an art of its own", "لماذا يُعدّ تقديم الشاي فناً قائماً بذاته"),
      L("\"One time, one meeting\": hospitality as a rare moment", "معنى «لقاء لا يتكرر» في الضيافة اليابانية"),
      L("What Japanese tea shares with Arabic coffee", "أوجه الشبه بين الشاي الياباني والقهوة العربية"),
    ],
    chapters: [
      {
        title: L("The welcome", "الترحيب"),
        duration: 90,
        captions: {
          en: ["\"A guest is welcomed before they reach the door.\"", "The host waters the garden path so it glistens, a quiet sign that someone is expected."],
          ar: ["«يُستقبل الضيف قبل أن يصل إلى الباب.»", "يرشّ المضيف ممر الحديقة بالماء حتى يلمع، علامة هادئة أن هناك من يُنتظر."],
        },
      },
      {
        title: L("The tea ritual", "طقس الشاي"),
        duration: 180,
        captions: {
          en: ["\"It all begins with silence, then the sound of water.\"", "Green tea is whisked with bamboo until it foams softly, then offered with both hands."],
          ar: ["«يبدأ كل شيء بالصمت، ثم بصوت الماء.»", "يُحرَّك الشاي الأخضر بمخفقة من الخيزران حتى تعلوه رغوة ناعمة، ثم يُقدَّم بكلتا اليدين."],
        },
      },
      {
        title: L("One time, one meeting", "لقاء لا يتكرر"),
        duration: 180,
        captions: {
          en: ["\"Ichi-go ichi-e: this moment will never come again.\"", "Every cup of tea is a meeting that will never happen again, so it is made as if it were the last."],
          ar: ["«إيتشي-غو إيتشي-إي: هذه اللحظة لن تتكرر.»", "في كل كوب شاي لقاء لا يتكرر، لذلك يُحضَّر بعناية كأنه الأخير."],
        },
      },
      {
        title: L("Tea and coffee", "الشاي والقهوة"),
        duration: 150,
        captions: {
          en: ["\"Two cups, one meaning.\"", "Like the first cup of Arabic coffee poured for a guest, Japanese tea says: you are welcome here."],
          ar: ["«فنجانان، ومعنى واحد.»", "مثل فنجال القهوة الأول للضيف عندنا، يقول الشاي الياباني: حيّاك، أنت في بيتك."],
        },
      },
    ],
    startChapter: 1,
    route: {
      directions: [
        L("Walk 200 m towards East Plaza", "امشِ 200 م باتجاه ساحة الشرق"),
        L("Turn left at the bamboo garden", "انعطف يساراً عند حديقة الخيزران"),
        L("The pavilion is 150 m on your right", "الجناح على يمينك بعد 150 م"),
      ],
      walkStory: { title: L("From the desert to the East", "من الصحراء إلى الشرق"), duration: 100 },
    },
    quiz: [
      {
        q: L("What is used to whisk matcha in the tea ritual?", "بماذا يُخفق شاي الماتشا في طقس الشاي؟"),
        options: [L("A silver spoon", "ملعقة فضية"), L("A bamboo whisk", "مخفقة من الخيزران"), L("A wooden stick", "عود خشبي"), L("A copper ladle", "مغرفة نحاسية")],
        correct: 1,
        fact: L("The whisk, called a chasen, is carved from a single piece of bamboo.", "المخفقة اسمها «تشاسن»، وتُنحت من قطعة خيزران واحدة."),
      },
      {
        q: L("What does \"ichi-go ichi-e\" mean in the tea ritual?", "ما معنى «إيتشي-غو إيتشي-إي» في طقس الشاي؟"),
        options: [L("Morning tea", "شاي الصباح"), L("One meeting that never repeats", "لقاء واحد لا يتكرر"), L("A formal welcome", "ترحيب رسمي بالضيف"), L("The last cup of the day", "آخر كوب في اليوم")],
        correct: 1,
        fact: L("So every cup is made as if it were the last, like the first cup we pour for a guest.", "لذلك يُحضَّر كل كوب كأنه الأخير، مثل فنجال الضيف الأول عندنا."),
      },
      {
        q: L("How is the tea bowl offered to the guest?", "كيف يُقدَّم وعاء الشاي للضيف؟"),
        options: [L("With both hands", "بكلتا اليدين"), L("On a silver tray", "على صينية فضية"), L("Left on the table", "يُترك على الطاولة"), L("In a paper cup", "في كوب ورقي")],
        correct: 0,
        fact: L("The host turns the bowl so its most beautiful side faces the guest.", "ويدير المضيف الوعاء حتى يكون أجمل وجه فيه مقابل الضيف."),
      },
    ],
    essence: L("In Japan, every meeting is honoured as one of a kind", "في اليابان، كل لقاء يُكرَّم كأنه لن يتكرر"),
  },
  {
    id: "morocco",
    order: 3,
    cover: "#A3232E",
    title: L("Morocco Pavilion: cities of colour", "جناح المغرب: مدن الألوان"),
    listTitle: L("Morocco Pavilion: cities of colour", "جناح المغرب: مدن الألوان"),
    shortTitle: L("Morocco: cities of colour", "جناح المغرب: مدن الألوان"),
    place: L("Morocco Pavilion", "جناح المغرب"),
    stampName: L("Morocco", "المغرب"),
    collectName: L("Morocco", "المغرب"),
    homeMeta: { depth: "glimpse", tag: L("Art", "فنون") },
    floor: L("Outdoor court", "الساحة الخارجية"),
    defaultDepth: "glimpse",
    takeaways: [
      L("The stories behind blue Chefchaouen, and why historians still disagree", "حكايات الأزرق في شفشاون، ولماذا لم يتفق المؤرخون على سببه"),
      L("Zellige: mosaic cut by hand, tile by tile", "الزليج: فسيفساء تُقطع باليد قطعة قطعة"),
      L("Moroccan doors tell the story of the house", "الأبواب المغربية تحكي قصة البيت"),
    ],
    chapters: [
      {
        title: L("A blue city", "مدينة زرقاء"),
        duration: 60,
        captions: {
          en: ["\"Nobody agrees why Chefchaouen is blue.\"", "Some say it keeps the mosquitoes away, others that it mirrors the sky. Everyone agrees it is beautiful."],
          ar: ["«لا أحد يتفق لماذا شفشاون زرقاء.»", "يقول البعض إنه يبعد البعوض، ويقول آخرون إنه يعكس السماء. والكل يتفق أنه جميل."],
        },
      },
      {
        title: L("The zellige story", "حكاية الزليج"),
        duration: 60,
        captions: {
          en: ["\"In Fez, beauty starts with one small piece.\"", "Each clay piece is cut by hand, then set into a star with no beginning and no end."],
          ar: ["«في فاس، يبدأ الجمال من قطعة صغيرة.»", "تُقطع كل قطعة خزف باليد، ثم تُرصّ لتصنع نجمة لا بداية لها ولا نهاية."],
        },
      },
    ],
    startChapter: 1,
    route: {
      directions: [
        L("Leave Japan through its south gate", "اخرج من البوابة الجنوبية لجناح اليابان"),
        L("Follow the shaded walkway for 250 m", "اتبع ممر الظل 250 م"),
        L("The pavilion is ahead by the blue fountain", "الجناح أمامك عند النافورة الزرقاء"),
      ],
      walkStory: { title: L("The story of blue Chefchaouen", "حكاية الأزرق في شفشاون"), duration: 80 },
    },
    quiz: [
      {
        q: L("Which Moroccan city is famous for its blue streets?", "أي مدينة مغربية تشتهر بشوارعها الزرقاء؟"),
        options: [L("Marrakesh", "مراكش"), L("Chefchaouen", "شفشاون"), L("Casablanca", "الدار البيضاء"), L("Rabat", "الرباط")],
        correct: 1,
        fact: L("Its walls are repainted every spring, so the blue never fades.", "وتُعاد صباغة جدرانها كل ربيع، فلا يبهت أزرقها أبداً."),
      },
      {
        q: L("What is Moroccan zellige made from?", "من أي شيء يُصنع الزليج المغربي؟"),
        options: [L("Coloured glass", "زجاج ملوّن"), L("Hand-cut glazed clay tiles", "قطع خزف تُقطع باليد"), L("Desert stones", "حجارة صحراوية"), L("Painted wood panels", "ألواح خشب ملوّنة")],
        correct: 1,
        fact: L("Every piece is chiselled by hand, then fitted into endless geometric stars.", "كل قطعة تُنحت يدوياً ثم تُركّب لتكوّن نجوماً هندسية لا تنتهي."),
      },
      {
        q: L("In which city did zellige craft flourish?", "في أي مدينة ازدهرت حرفة الزليج؟"),
        options: [L("Fez", "فاس"), L("Tangier", "طنجة"), L("Agadir", "أكادير"), L("Essaouira", "الصويرة")],
        correct: 0,
        fact: L("Fez masters still pass the craft from teacher to apprentice.", "وما زال معلّمو فاس يورّثون الحرفة من المعلّم إلى المتعلّم."),
      },
    ],
    essence: L("In Morocco, every piece of zellige is cut by hand", "في المغرب، تُقطع كل قطعة زليج باليد"),
  },
  {
    id: "mexico",
    order: 4,
    cover: "#E2A33A",
    title: L("Mexico Pavilion: memory of maize", "جناح المكسيك: ذاكرة الذرة"),
    listTitle: L("Mexico Pavilion: memory of maize", "جناح المكسيك: ذاكرة الذرة"),
    shortTitle: L("Mexico: memory of maize", "جناح المكسيك: ذاكرة الذرة"),
    place: L("Mexico Pavilion", "جناح المكسيك"),
    stampName: L("Mexico", "المكسيك"),
    collectName: L("Mexico", "المكسيك"),
    floor: L("Ground floor", "الطابق الأرضي"),
    defaultDepth: "visit",
    takeaways: [
      L("Maize has been the heart of Mexican food for millennia", "الذرة قلب المطبخ المكسيكي منذ آلاف السنين"),
      L("How tortillas are made with ancient nixtamal", "كيف تُحضَّر التورتيلا بطريقة النيكستامال القديمة"),
      L("Stepped pyramids and the counting of seasons", "الأهرامات المدرّجة وحساب الفصول"),
    ],
    chapters: [
      {
        title: L("People of maize", "شعب الذرة"),
        duration: 150,
        captions: {
          en: ["\"In the old stories, people were made from maize.\"", "Mayan legends tell that the first humans were shaped from yellow and white corn dough."],
          ar: ["«في الحكايات القديمة، خُلق الناس من الذرة.»", "تحكي أساطير المايا أن أول البشر شُكّلوا من عجين الذرة الأصفر والأبيض."],
        },
      },
      {
        title: L("From field to kitchen", "من الحقل إلى المطبخ"),
        duration: 180,
        captions: {
          en: ["\"Grandmother said: maize isn't just food, it's memory.\"", "The kernels are cooked in lime water and left overnight until the skins soften into tortilla dough."],
          ar: ["«قالت الجدة: الذرة ليست طعاماً فقط، إنها ذاكرة.»", "تُطبخ الحبوب في ماء الجير ثم تُترك فيه طوال الليل، فتلين قشرتها وتصير عجينة التورتيلا."],
        },
      },
      {
        title: L("Stones that count days", "حجارة تعدّ الأيام"),
        duration: 150,
        captions: {
          en: ["\"The pyramid is a calendar you can climb.\"", "Its steps add up to the days of the year, and the sun draws a serpent on it at the equinox."],
          ar: ["«الهرم تقويم تقدر تصعده.»", "مجموع درجاته يساوي أيام السنة، وفي الاعتدال ترسم الشمس عليه ظل أفعى."],
        },
      },
      {
        title: L("Maize today", "الذرة اليوم"),
        duration: 120,
        captions: {
          en: ["\"Sixty-four kinds of maize, still growing.\"", "Farmers keep dozens of native varieties alive, each with its own colour and taste."],
          ar: ["«أربعة وستون نوعاً من الذرة، وما زالت تُزرع.»", "يحافظ المزارعون على عشرات الأصناف المحلية، لكل صنف لونه وطعمه."],
        },
      },
    ],
    startChapter: 1,
    route: {
      directions: [
        L("Take the shortcut through the market lane", "خذ الطريق المختصر عبر ممر الأسواق"),
        L("Walk 180 m to the sun sculpture", "امشِ 180 م حتى تمثال الشمس"),
        L("The pavilion is on your left", "الجناح على يسارك"),
      ],
      walkStory: { title: L("Maize's journey across the ocean", "رحلة الذرة عبر المحيط"), duration: 120 },
    },
    quiz: [
      {
        q: L("Which crop sits at the heart of Mexican food?", "أي محصول يقع في قلب المطبخ المكسيكي؟"),
        options: [L("Rice", "الأرز"), L("Wheat", "القمح"), L("Maize", "الذرة"), L("Barley", "الشعير")],
        correct: 2,
        fact: L("Maize was first grown in Mexico around 9,000 years ago.", "زُرعت الذرة لأول مرة في المكسيك قبل نحو 9 آلاف سنة."),
      },
      {
        q: L("What is the ancient way of preparing maize for tortillas?", "ما الطريقة القديمة لتحضير الذرة قبل صنع التورتيلا؟"),
        options: [L("Drying it in the sun", "تجفيفها في الشمس فقط"), L("Nixtamal: soaking it in lime water", "النيكستامال: نقعها في ماء الجير"), L("Grinding it with wheat", "طحنها مع القمح"), L("Boiling it in sugar syrup", "سلقها في شراب السكر")],
        correct: 1,
        fact: L("A method thousands of years old that makes maize richer and easier to grind.", "طريقة عمرها آلاف السنين، تجعل الذرة أغنى وأسهل في الطحن."),
      },
      {
        q: L("What did the stepped pyramids help people count?", "ماذا ساعدت الأهرامات المدرّجة الناس على حسابه؟"),
        options: [L("The seasons", "الفصول"), L("Their harvest", "المحصول"), L("The stars", "النجوم"), L("Their kings", "ملوكهم")],
        correct: 0,
        fact: L("At the equinox, the sun's shadow forms a serpent sliding down the steps.", "في الاعتدال، يرسم ظل الشمس أفعى تنزلق على الدرجات."),
      },
    ],
    essence: L("In Mexico, maize is memory as much as food", "في المكسيك، الذرة ذاكرة قبل أن تكون طعاماً"),
  },
  {
    id: "korea",
    order: 5,
    cover: "#14163A",
    title: L("Korea Pavilion: the craft wave", "جناح كوريا: موجة الحِرف"),
    listTitle: L("Korea Pavilion: the craft wave", "جناح كوريا: موجة الحِرف"),
    shortTitle: L("Korea: the craft wave", "جناح كوريا: موجة الحِرف"),
    place: L("Korea Pavilion", "جناح كوريا"),
    stampName: L("Korea", "كوريا"),
    collectName: L("Korea", "كوريا"),
    floor: L("Second floor", "الطابق الثاني"),
    defaultDepth: "visit",
    takeaways: [
      L("Hanji: handmade paper that lasts a thousand years", "الهانجي: ورق يدوي يعيش ألف عام"),
      L("Bojagi: cloth that wraps gifts and saves scraps", "البوجاغي: قماش يلف الهدايا ويجمع البقايا"),
      L("Hanok: homes built with nature, not against it", "الهانوك: بيوت تُبنى مع الطبيعة لا ضدها"),
    ],
    chapters: [
      {
        title: L("Thousand-year paper", "ورق ألف عام"),
        duration: 150,
        captions: {
          en: ["\"Silk lasts five hundred years; hanji, a thousand.\"", "Mulberry bark is boiled, beaten and layered by hand into paper strong enough for windows."],
          ar: ["«الحرير يعيش خمسمئة عام، والهانجي ألفاً.»", "يُغلى لحاء شجر التوت ويُطرق ويُرصّ باليد ليصير ورقاً قوياً يكفي للنوافذ."],
        },
      },
      {
        title: L("Small pieces, big gift", "قطع صغيرة، هدية كبيرة"),
        duration: 150,
        captions: {
          en: ["\"Nothing is thrown away in a tailor's house.\"", "Leftover scraps are stitched together into bojagi, a cloth that wraps gifts with care."],
          ar: ["«لا شيء يُرمى في بيت الخياطة.»", "تُخاط قصاصات القماش المتبقية معاً، فتصير «البوجاغي» غطاءً يلف الهدايا بالمحبة."],
        },
      },
      {
        title: L("A house that breathes", "بيت يتنفس"),
        duration: 180,
        captions: {
          en: ["\"The hanok faces the mountain and the river.\"", "Its floors are warmed from below and its paper doors let the breeze move through the house."],
          ar: ["«يواجه الهانوك الجبل والنهر.»", "تُدفّأ أرضيته من الأسفل، وتسمح أبوابه الورقية للنسيم أن يتنقل في البيت."],
        },
      },
      {
        title: L("Craft today", "الحرفة اليوم"),
        duration: 120,
        captions: {
          en: ["\"Old hands, new ideas.\"", "Young Korean makers bring hanji and bojagi into lamps, fashion and design studios."],
          ar: ["«أيدٍ قديمة، وأفكار جديدة.»", "يحمل الصنّاع الشباب في كوريا الهانجي والبوجاغي إلى المصابيح والأزياء واستوديوهات التصميم."],
        },
      },
    ],
    startChapter: 1,
    route: {
      directions: [
        L("Head back to the main Oasis Walk", "ارجع إلى ممر الواحة الرئيسي"),
        L("Take the stairs to the second floor", "اصعد الدرج إلى الطابق الثاني"),
        L("The pavilion is 60 m ahead", "الجناح أمامك بعد 60 م"),
      ],
      walkStory: { title: L("The paper road of Asia", "طريق الورق في آسيا"), duration: 90 },
    },
    quiz: [
      {
        q: L("What is bojagi used for?", "فيمَ تُستخدم «البوجاغي»؟"),
        options: [L("Wrapping gifts", "لف الهدايا"), L("Cooking rice", "طبخ الأرز"), L("Painting walls", "طلاء الجدران"), L("Carrying water", "حمل الماء")],
        correct: 0,
        fact: L("Made from leftover scraps, every bojagi is one of a kind.", "تُصنع من القصاصات المتبقية، فلا تتشابه قطعتان أبداً."),
      },
      {
        q: L("What is Korean \"hanji\"?", "ما هو «الهانجي» الكوري؟"),
        options: [L("A type of pottery", "نوع من الخزف"), L("Handmade paper from mulberry bark", "ورق يدوي من لحاء شجر التوت"), L("A traditional rice dish", "طبق أرز تقليدي"), L("A woven straw mat", "حصيرة من القش")],
        correct: 1,
        fact: L("It's said to last a thousand years, so it was used for books, windows and lanterns.", "يُقال إنه يعيش ألف عام، لذلك استُخدم في الكتب والنوافذ والفوانيس."),
      },
      {
        q: L("How is a traditional hanok floor warmed?", "كيف تُدفّأ أرضية بيت الهانوك التقليدي؟"),
        options: [L("With carpets", "بالسجاد"), L("From below, by heated stones", "من الأسفل بحجارة ساخنة"), L("With a fireplace", "بمدفأة"), L("With hot-water pipes in the walls", "بأنابيب ماء ساخن في الجدران")],
        correct: 1,
        fact: L("The system is called ondol, and many Korean homes still use it today.", "اسم هذا النظام «أوندول»، وما زالت بيوت كورية كثيرة تستخدمه."),
      },
    ],
    essence: L("In Korea, small scraps become a big gift", "في كوريا، القصاصات الصغيرة تصير هدية كبيرة"),
  },
  {
    id: "coffee",
    order: 6,
    cover: "#4A2E1C",
    title: L("Arabic Coffee Majlis: a cup of generosity", "مجلس القهوة العربية: فنجال الكرم"),
    listTitle: L("Arabic Coffee Majlis", "مجلس القهوة العربية"),
    shortTitle: L("Arabic coffee: a cup of generosity", "القهوة العربية: فنجال الكرم"),
    place: L("Coffee Majlis", "مجلس القهوة"),
    stampName: L("Coffee", "القهوة"),
    collectName: L("Arabic Coffee", "القهوة العربية"),
    homeMeta: { depth: "glimpse", tag: L("Hospitality", "ضيافة") },
    floor: L("Ground floor", "الطابق الأرضي"),
    defaultDepth: "visit",
    takeaways: [
      L("Serving Arabic coffee is a sign of generosity toward every guest", "تقديم القهوة العربية علامة كرم لكل ضيف"),
      L("Beans are roasted, pounded and brewed in a dallah, often with cardamom", "تُحمَّص الحبوب وتُدق وتُطبخ في الدلّة، وغالباً مع الهيل"),
      L("UNESCO inscribed Arabic coffee on its intangible heritage list in 2015", "سجّلت اليونسكو القهوة العربية في قائمة التراث غير المادي عام 2015"),
    ],
    chapters: [
      {
        title: L("The welcome cup", "فنجال الترحيب"),
        duration: 120,
        captions: {
          en: ["\"The coffee is ready before the guest arrives.\"", "Serving Arabic coffee is a sign of generosity, offered to every guest who enters the majlis."],
          ar: ["«القهوة جاهزة قبل وصول الضيف.»", "تقديم القهوة العربية علامة كرم، تُقدَّم لكل ضيف يدخل المجلس."],
        },
      },
      {
        title: L("Roast, pound, brew", "تحميص ودق وطبخ"),
        duration: 180,
        captions: {
          en: ["\"You smell the coffee before you see it.\"", "The beans are roasted, pounded in a mortar and brewed in a dallah, often with cardamom."],
          ar: ["«تشم القهوة قبل أن تراها.»", "تُحمَّص الحبوب، وتُدق في الهاون، وتُطبخ في الدلّة، وغالباً مع الهيل."],
        },
      },
      {
        title: L("Small cups, long talks", "فناجيل صغيرة وأحاديث طويلة"),
        duration: 240,
        captions: {
          en: ["\"Small cups keep the conversation going.\"", "Coffee is poured into small cups called finjan, and it is usually served with dates."],
          ar: ["«الفناجيل الصغيرة تُطيل السوالف.»", "تُصب القهوة في فناجيل صغيرة، وتُقدَّم عادة مع التمر."],
        },
      },
      {
        title: L("A shared heritage", "تراث مشترك"),
        duration: 240,
        captions: {
          en: ["\"One pot, many homes.\"", "In 2015 UNESCO inscribed Arabic coffee, a symbol of generosity, nominated by Saudi Arabia, the UAE, Oman and Qatar."],
          ar: ["«دلّة واحدة وبيوت كثيرة.»", "في 2015 سجّلت اليونسكو القهوة العربية رمزاً للكرم، بترشيح من السعودية والإمارات وعُمان وقطر."],
        },
      },
    ],
    startChapter: 0,
    route: {
      directions: [
        L("Head toward the palm courtyard", "اتجه نحو ساحة النخيل"),
        L("Pass the water channel on your left", "مر بجانب قناة الماء على يسارك"),
        L("The majlis tent is straight ahead", "خيمة المجلس أمامك مباشرة"),
      ],
      walkStory: { title: L("Why the dallah has a long spout", "لماذا للدلّة منقار طويل؟"), duration: 60 },
    },
    quiz: [
      {
        q: L("What is serving Arabic coffee traditionally a sign of?", "تقديم القهوة العربية علامة على ماذا تقليدياً؟"),
        options: [L("Generosity", "الكرم"), L("Wealth", "الثراء"), L("Victory", "النصر"), L("Farewell", "الوداع")],
        correct: 0,
        fact: L("UNESCO's listing calls Arabic coffee \"a symbol of generosity\".", "تصف اليونسكو القهوة العربية بأنها «رمز للكرم»."),
      },
      {
        q: L("Which pot is Arabic coffee brewed and poured from?", "من أي إناء تُطبخ القهوة العربية وتُصب؟"),
        options: [L("A samovar", "السماور"), L("A dallah", "الدلّة"), L("A tagine", "الطاجين"), L("A teapot with a strainer", "إبريق شاي بمصفاة")],
        correct: 1,
        fact: L("The dallah's long spout makes it easy to pour into small cups.", "منقار الدلّة الطويل يسهّل الصب في الفناجيل الصغيرة."),
      },
      {
        q: L("In which year did UNESCO inscribe Arabic coffee on its intangible heritage list?", "في أي عام سجّلت اليونسكو القهوة العربية في قائمة التراث غير المادي؟"),
        options: [L("2005", "2005"), L("2010", "2010"), L("2015", "2015"), L("2020", "2020")],
        correct: 2,
        fact: L("Saudi Arabia, the UAE, Oman and Qatar nominated it together.", "رشّحتها السعودية والإمارات وعُمان وقطر معاً."),
      },
    ],
    essence: L("Arabic coffee is a welcome you can taste", "القهوة العربية ترحيب تتذوقه"),
  },
  {
    id: "diriyah",
    order: 7,
    cover: "#7A4B2E",
    title: L("Najdi Architecture: the mud-brick city", "العمارة النجدية: مدينة الطين"),
    listTitle: L("Najdi Architecture: mud-brick city", "العمارة النجدية: مدينة الطين"),
    shortTitle: L("Najdi architecture: the mud-brick city", "العمارة النجدية: مدينة الطين"),
    place: L("Najdi Architecture Hall", "قاعة العمارة النجدية"),
    stampName: L("Diriyah", "الدرعية"),
    collectName: L("Najdi Architecture", "العمارة النجدية"),
    floor: L("Ground floor", "الطابق الأرضي"),
    defaultDepth: "visit",
    takeaways: [
      L("At-Turaif in Diriyah was the first capital of the Saudi state", "حي الطريف في الدرعية كان أول عاصمة للدولة السعودية"),
      L("Thick mud-brick walls help keep Najdi interiors cool", "الجدران الطينية السميكة تساعد على إبقاء البيوت النجدية باردة"),
      L("At-Turaif became a UNESCO World Heritage Site in 2010", "صار حي الطريف موقع تراث عالمي لدى اليونسكو عام 2010"),
    ],
    chapters: [
      {
        title: L("Built from the earth", "مبنية من الأرض"),
        duration: 180,
        captions: {
          en: ["\"The walls came from the ground they stand on.\"", "Najdi buildings were made of sun-dried mud bricks, shaped from clay mixed with straw."],
          ar: ["«الجدران جاءت من الأرض التي تقف عليها.»", "بُنيت البيوت النجدية من لِبن مجفف في الشمس، يُصنع من الطين المخلوط بالتبن."],
        },
      },
      {
        title: L("Walls that keep the heat out", "جدران تصد الحر"),
        duration: 240,
        captions: {
          en: ["\"Inside, the afternoon felt like morning.\"", "Thick mud walls and small openings slow the desert heat, keeping rooms cooler without machines."],
          ar: ["«في الداخل، كان العصر يشبه الصباح.»", "الجدران الطينية السميكة والفتحات الصغيرة تبطئ حرارة الصحراء، فتبقى الغرف أبرد بلا آلات."],
        },
      },
      {
        title: L("At-Turaif", "حي الطريف"),
        duration: 300,
        captions: {
          en: ["\"A capital of mud and memory.\"", "The At-Turaif district of Diriyah was the first capital of the Saudi state and a UNESCO World Heritage Site since 2010."],
          ar: ["«عاصمة من الطين والذاكرة.»", "حي الطريف في الدرعية كان أول عاصمة للدولة السعودية، وهو موقع تراث عالمي منذ 2010."],
        },
      },
      {
        title: L("Old ideas, new buildings", "أفكار قديمة ومبانٍ جديدة"),
        duration: 300,
        captions: {
          en: ["\"The future can learn from the past.\"", "Najdi details such as courtyards and triangular openings still inspire buildings in Riyadh today."],
          ar: ["«المستقبل يتعلم من الماضي.»", "ما زالت التفاصيل النجدية مثل الأفنية والفتحات المثلثة تلهم مباني الرياض اليوم."],
        },
      },
    ],
    startChapter: 0,
    route: {
      directions: [
        L("Follow the sand-coloured path west", "اتبع الممر الرملي غرباً"),
        L("Walk under the shaded arcade", "امشِ تحت الرواق المظلل"),
        L("The hall is behind the mud-brick gate", "القاعة خلف البوابة الطينية"),
      ],
      walkStory: { title: L("How a mud brick is made", "كيف يُصنع اللبن؟"), duration: 75 },
    },
    quiz: [
      {
        q: L("What were traditional Najdi buildings mainly made of?", "مم كانت تُبنى البيوت النجدية التقليدية أساساً؟"),
        options: [L("Marble", "الرخام"), L("Coral stone", "الحجر المرجاني"), L("Sun-dried mud bricks", "اللبن المجفف في الشمس"), L("Steel frames", "هياكل الحديد")],
        correct: 2,
        fact: L("The bricks were clay mixed with straw, dried in the sun.", "اللبن طين مخلوط بالتبن ومجفف في الشمس."),
      },
      {
        q: L("Why are traditional Najdi walls so thick?", "لماذا الجدران النجدية التقليدية سميكة؟"),
        options: [L("To keep the rooms cooler", "لتبقى الغرف أبرد"), L("To carry stone roofs", "لتحمل أسقفاً حجرية"), L("For decoration only", "للزينة فقط"), L("To block all daylight", "لتحجب ضوء النهار كله")],
        correct: 0,
        fact: L("Thick mud walls slow the heat of the day before it reaches the rooms.", "الجدران الطينية السميكة تبطئ حرارة النهار قبل أن تصل إلى الغرف."),
      },
      {
        q: L("When did At-Turaif in Diriyah become a UNESCO World Heritage Site?", "متى صار حي الطريف في الدرعية موقع تراث عالمي؟"),
        options: [L("2008", "2008"), L("2010", "2010"), L("2014", "2014"), L("2018", "2018")],
        correct: 1,
        fact: L("It was the first capital of the Saudi state.", "كان أول عاصمة للدولة السعودية."),
      },
    ],
    essence: L("In Najd, the earth itself became shelter and shade", "في نجد، صارت الأرض نفسها مأوى وظلاً"),
  },
  {
    id: "hegra",
    order: 8,
    cover: "#8E3F22",
    title: L("Hegra: the carved city of AlUla", "الحِجر: مدينة منحوتة في العُلا"),
    listTitle: L("Hegra: carved city of AlUla", "الحِجر: مدينة منحوتة في العُلا"),
    shortTitle: L("Hegra: the carved city", "الحِجر: المدينة المنحوتة"),
    place: L("Hegra Gallery", "معرض الحِجر"),
    stampName: L("Hegra", "الحِجر"),
    collectName: L("Hegra", "الحِجر"),
    homeMeta: { depth: "visit", tag: L("History", "تاريخ") },
    floor: L("First floor", "الطابق الأول"),
    defaultDepth: "visit",
    takeaways: [
      L("The Nabataeans carved monumental tombs into Hegra's sandstone", "نحت الأنباط مقابر ضخمة في صخور الحِجر الرملية"),
      L("Hegra is the largest preserved Nabataean site south of Petra", "الحِجر أكبر موقع نبطي محفوظ جنوب البتراء"),
      L("In 2008 it became Saudi Arabia's first UNESCO World Heritage Site", "في 2008 صار أول موقع سعودي على قائمة التراث العالمي"),
    ],
    chapters: [
      {
        title: L("A city in the rocks", "مدينة في الصخر"),
        duration: 180,
        captions: {
          en: ["\"They did not build these walls. They carved them.\"", "In AlUla, the Nabataeans carved monumental tombs straight into sandstone outcrops."],
          ar: ["«لم يبنوا هذه الجدران، بل نحتوها.»", "في العُلا، نحت الأنباط مقابر ضخمة مباشرة في الصخور الرملية."],
        },
      },
      {
        title: L("The Nabataeans", "الأنباط"),
        duration: 240,
        captions: {
          en: ["\"Petra was their capital; Hegra was their south.\"", "Hegra is the largest preserved Nabataean site south of Petra, their capital in today's Jordan."],
          ar: ["«البتراء عاصمتهم، والحِجر جنوبهم.»", "الحِجر أكبر موقع نبطي محفوظ جنوب البتراء، عاصمتهم في الأردن اليوم."],
        },
      },
      {
        title: L("Doorways for eternity", "أبواب للخلود"),
        duration: 300,
        captions: {
          en: ["\"Each façade is a message in stone.\"", "More than a hundred tombs stand here, many with decorated façades and carved inscriptions."],
          ar: ["«كل واجهة رسالة من حجر.»", "تقف هنا أكثر من مئة مقبرة، كثير منها بواجهات مزخرفة ونقوش محفورة."],
        },
      },
      {
        title: L("A first for the Kingdom", "الأول في المملكة"),
        duration: 300,
        captions: {
          en: ["\"The world came to see what the desert kept.\"", "In 2008 Hegra, also known as Al-Hijr, became Saudi Arabia's first UNESCO World Heritage Site."],
          ar: ["«جاء العالم ليرى ما حفظته الصحراء.»", "في 2008 صارت الحِجر أول موقع سعودي على قائمة اليونسكو للتراث العالمي."],
        },
      },
    ],
    startChapter: 0,
    route: {
      directions: [
        L("Take the ramp up to the first floor", "اصعد المنحدر إلى الطابق الأول"),
        L("Follow the sandstone-coloured wall", "اتبع الجدار بلون الحجر الرملي"),
        L("The gallery opens on your right", "المعرض على يمينك"),
      ],
      walkStory: { title: L("Reading a Nabataean façade", "كيف تقرأ واجهة نبطية؟"), duration: 70 },
    },
    quiz: [
      {
        q: L("Which ancient people carved the tombs of Hegra?", "أي شعب قديم نحت مقابر الحِجر؟"),
        options: [L("The Romans", "الرومان"), L("The Nabataeans", "الأنباط"), L("The Phoenicians", "الفينيقيون"), L("The Sumerians", "السومريون")],
        correct: 1,
        fact: L("The Nabataeans carved the tombs directly into sandstone outcrops.", "نحت الأنباط المقابر مباشرة في الصخور الرملية."),
      },
      {
        q: L("Which city was the Nabataean capital?", "ما المدينة التي كانت عاصمة الأنباط؟"),
        options: [L("Palmyra", "تدمر"), L("Babylon", "بابل"), L("Petra", "البتراء"), L("Byblos", "جبيل")],
        correct: 2,
        fact: L("Hegra is the largest preserved Nabataean site south of Petra.", "الحِجر أكبر موقع نبطي محفوظ جنوب البتراء."),
      },
      {
        q: L("In which year did Hegra become Saudi Arabia's first UNESCO World Heritage Site?", "في أي عام صارت الحِجر أول موقع سعودي في قائمة التراث العالمي؟"),
        options: [L("2002", "2002"), L("2008", "2008"), L("2012", "2012"), L("2016", "2016")],
        correct: 1,
        fact: L("It is also known as Al-Hijr or Mada'in Salih.", "وتُعرف أيضاً باسم مدائن صالح."),
      },
    ],
    essence: L("At Hegra, a whole civilisation speaks through carved stone", "في الحِجر، تتكلم حضارة كاملة عبر الحجر المنحوت"),
  },
  {
    id: "ahsa",
    order: 9,
    cover: "#2E5E36",
    title: L("Al-Ahsa: the oasis that feeds", "الأحساء: الواحة التي تُطعم"),
    listTitle: L("Al-Ahsa Oasis", "واحة الأحساء"),
    shortTitle: L("Al-Ahsa: the living oasis", "الأحساء: الواحة الحية"),
    place: L("Oasis Garden", "حديقة الواحة"),
    stampName: L("Al-Ahsa", "الأحساء"),
    collectName: L("Al-Ahsa Oasis", "واحة الأحساء"),
    homeMeta: { depth: "glimpse", tag: L("Sustainability", "استدامة") },
    floor: L("Outdoor garden", "حديقة خارجية"),
    defaultDepth: "visit",
    takeaways: [
      L("Al-Ahsa is one of the largest oases in the world", "الأحساء من أكبر الواحات في العالم"),
      L("Springs, wells and canals have watered its palms for centuries", "العيون والآبار والقنوات تسقي نخيلها منذ قرون"),
      L("It was inscribed as a UNESCO cultural landscape in 2018", "سُجّلت مشهداً ثقافياً في قائمة اليونسكو عام 2018"),
    ],
    chapters: [
      {
        title: L("A sea of palms", "بحر من النخيل"),
        duration: 180,
        captions: {
          en: ["\"Green, as far as you can see.\"", "Al-Ahsa is one of the largest oases in the world, home to millions of date palms."],
          ar: ["«أخضر على مد البصر.»", "الأحساء من أكبر الواحات في العالم، وفيها ملايين النخيل."],
        },
      },
      {
        title: L("Water from below", "ماء من الأعماق"),
        duration: 240,
        captions: {
          en: ["\"The desert hides its water underground.\"", "Springs and wells feed canals that carry water through the gardens, then drain it away."],
          ar: ["«الصحراء تخبئ ماءها تحت الأرض.»", "تغذي العيون والآبار قنوات تحمل الماء بين البساتين ثم تصرفه."],
        },
      },
      {
        title: L("Dates and daily life", "التمر والحياة اليومية"),
        duration: 300,
        captions: {
          en: ["\"Every palm is a pantry.\"", "Dates have long been a staple here, and the palm also gave wood and fronds for homes and baskets."],
          ar: ["«كل نخلة مخزن طعام.»", "كان التمر غذاءً أساسياً هنا، والنخلة أعطت الخشب والسعف للبيوت والسلال."],
        },
      },
      {
        title: L("A living landscape", "مشهد حي"),
        duration: 300,
        captions: {
          en: ["\"Heritage you can still walk through.\"", "In 2018 UNESCO inscribed Al-Ahsa Oasis as an evolving cultural landscape."],
          ar: ["«تراث ما زلت تمشي فيه.»", "في 2018 سجّلت اليونسكو واحة الأحساء مشهداً ثقافياً متطوراً."],
        },
      },
    ],
    startChapter: 0,
    route: {
      directions: [
        L("Exit to the outdoor garden", "اخرج إلى الحديقة الخارجية"),
        L("Follow the water channel between the palms", "اتبع قناة الماء بين النخيل"),
        L("The garden pavilion is by the spring pool", "جناح الحديقة عند بركة العين"),
      ],
      walkStory: { title: L("How an oasis stays green", "كيف تبقى الواحة خضراء؟"), duration: 65 },
    },
    quiz: [
      {
        q: L("Which tree fills the Al-Ahsa Oasis?", "أي شجرة تملأ واحة الأحساء؟"),
        options: [L("Olive", "الزيتون"), L("Acacia", "السَّمُر"), L("Cedar", "الأرز"), L("Date palm", "النخلة")],
        correct: 3,
        fact: L("The oasis is home to millions of date palms.", "في الواحة ملايين النخيل."),
      },
      {
        q: L("Where does Al-Ahsa's water traditionally come from?", "من أين يأتي ماء الأحساء تقليدياً؟"),
        options: [L("Underground springs and wells", "العيون والآبار الجوفية"), L("A large river", "نهر كبير"), L("Melting snow", "ذوبان الثلوج"), L("Desalination plants", "محطات التحلية")],
        correct: 0,
        fact: L("Canals carry the spring water through the gardens.", "تحمل القنوات ماء العيون بين البساتين."),
      },
      {
        q: L("In which year was Al-Ahsa Oasis inscribed by UNESCO?", "في أي عام سجّلت اليونسكو واحة الأحساء؟"),
        options: [L("2008", "2008"), L("2013", "2013"), L("2018", "2018"), L("2021", "2021")],
        correct: 2,
        fact: L("It is listed as an evolving cultural landscape.", "وهي مسجّلة مشهداً ثقافياً متطوراً."),
      },
    ],
    essence: L("In Al-Ahsa, careful use of water keeps a desert green", "في الأحساء، حُسن استخدام الماء يُبقي الصحراء خضراء"),
  },
  {
    id: "ardah",
    order: 10,
    cover: "#5E1A26",
    title: L("Al-Ardah: drums, poetry and swords", "العرضة: طبول وشعر وسيوف"),
    listTitle: L("Al-Ardah performance", "عرض العرضة"),
    shortTitle: L("Al-Ardah: drums and poetry", "العرضة: طبول وشعر"),
    place: L("Ardah Stage", "مسرح العرضة"),
    stampName: L("Al-Ardah", "العرضة"),
    collectName: L("Al-Ardah", "العرضة"),
    floor: L("Outdoor stage", "مسرح خارجي"),
    defaultDepth: "glimpse",
    takeaways: [
      L("Al-Ardah combines dance, drumming and poetry", "تجمع العرضة الرقص والطبول والشعر"),
      L("Performers stand in rows holding swords while a poet chants", "يصطف المؤدون حاملين السيوف بينما يُنشد الشاعر"),
      L("UNESCO inscribed Alardah Alnajdiyah on its heritage list in 2015", "سجّلت اليونسكو العرضة النجدية في قائمة التراث عام 2015"),
    ],
    chapters: [
      {
        title: L("Two rows", "صفّان"),
        duration: 150,
        captions: {
          en: ["\"Shoulder to shoulder, the rows begin to move.\"", "In Al-Ardah, men stand in rows holding swords and move together to the beat."],
          ar: ["«كتفاً بكتف، يبدأ الصفّان بالحركة.»", "في العرضة، يقف الرجال في صفوف حاملين السيوف ويتحركون معاً على الإيقاع."],
        },
      },
      {
        title: L("The drums", "الطبول"),
        duration: 180,
        captions: {
          en: ["\"The drum is the heartbeat of the Ardah.\"", "Drummers set the rhythm that the whole performance follows."],
          ar: ["«الطبل نبض العرضة.»", "يضبط الطبّالون الإيقاع الذي يتبعه العرض كله."],
        },
      },
      {
        title: L("The poet's voice", "صوت الشاعر"),
        duration: 240,
        captions: {
          en: ["\"One voice, then a hundred.\"", "A poet chants the verses, and the rows repeat them together."],
          ar: ["«صوت واحد ثم مئة.»", "يُنشد الشاعر الأبيات، وتردّدها الصفوف معاً."],
        },
      },
      {
        title: L("A national heritage", "تراث وطني"),
        duration: 240,
        captions: {
          en: ["\"Performed at celebrations across the Kingdom.\"", "In 2015 UNESCO inscribed Alardah Alnajdiyah: dance, drumming and poetry in Saudi Arabia."],
          ar: ["«تُؤدّى في المناسبات في أنحاء المملكة.»", "في 2015 سجّلت اليونسكو العرضة النجدية: رقص وطبول وشعر في السعودية."],
        },
      },
    ],
    startChapter: 0,
    route: {
      directions: [
        L("Follow the sound of the drums", "اتبع صوت الطبول"),
        L("Cross the open plaza", "اعبر الساحة المفتوحة"),
        L("The stage is under the large canopy", "المسرح تحت المظلة الكبيرة"),
      ],
      walkStory: { title: L("Why poetry leads the Ardah", "لماذا يقود الشعر العرضة؟"), duration: 55 },
    },
    quiz: [
      {
        q: L("What do the performers hold during Al-Ardah?", "ماذا يحمل المؤدون في العرضة؟"),
        options: [L("Lanterns", "فوانيس"), L("Swords", "سيوف"), L("Fishing nets", "شباك صيد"), L("Prayer beads", "مسابح")],
        correct: 1,
        fact: L("The rows of performers hold swords as they move to the beat.", "تحمل صفوف المؤدين السيوف وهي تتحرك على الإيقاع."),
      },
      {
        q: L("What sets the rhythm of Al-Ardah?", "ما الذي يضبط إيقاع العرضة؟"),
        options: [L("An oud", "العود"), L("A ney flute", "الناي"), L("Drums", "الطبول"), L("Bells", "الأجراس")],
        correct: 2,
        fact: L("Drummers set the rhythm that the whole performance follows.", "يضبط الطبّالون الإيقاع الذي يتبعه العرض كله."),
      },
      {
        q: L("Which three elements does UNESCO's listing of Alardah Alnajdiyah name?", "ما العناصر الثلاثة التي يذكرها تسجيل اليونسكو للعرضة النجدية؟"),
        options: [
          L("Dance, drumming and poetry", "الرقص والطبول والشعر"),
          L("Weaving, dyeing and embroidery", "النسج والصباغة والتطريز"),
          L("Coffee, dates and incense", "القهوة والتمر والبخور"),
          L("Riding, racing and falconry", "الفروسية والسباق والصقارة"),
        ],
        correct: 0,
        fact: L("It was inscribed in 2015.", "سُجّلت عام 2015."),
      },
    ],
    essence: L("In Al-Ardah, poetry and rhythm move a whole community together", "في العرضة، يحرّك الشعر والإيقاع جماعة كاملة معاً"),
  },
];

export const pavilionIds = pavilions.map((p) => p.id);

export function getPavilion(id: string) {
  return pavilions.find((p) => p.id === id);
}

export function isStationId(id: unknown): id is PavilionId {
  return typeof id === "string" && (STATION_IDS as readonly string[]).includes(id);
}

