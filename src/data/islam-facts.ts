/**
 * One fact or piece of knowledge about Islam a day. Each one names its
 * source: a Quran reference (surah:ayah) or a hadith collection and number.
 */

export interface IslamFact {
  title: string;
  body: string;
  source: string;
  /** Opens the reader at this ayah, when the source is the Quran. */
  ayah?: { surah: number; ayah: number };
}

export const ISLAM_FACTS: IslamFact[] = [
  {
    title: "The first word revealed was \"Read\"",
    body: "The first revelation came to the Prophet ﷺ in the cave of Hira, when he was forty: \"Read in the name of your Lord who created.\" Knowledge sits at the very start of Islam.",
    source: "Quran 96:1–5 · Sahih al-Bukhari 3",
    ayah: { surah: 96, ayah: 1 },
  },
  {
    title: "Stammering over the Quran earns a double reward",
    body: "The Prophet ﷺ said the one who is skilled in the Quran is with the noble, righteous scribes, and the one who reads it with difficulty, stumbling over it, has two rewards. Every slow reading counts.",
    source: "Sahih Muslim 798",
  },
  {
    title: "Ten rewards for every letter",
    body: "Whoever reads a letter of the Book of Allah has a good deed, and each good deed is multiplied by ten. The Prophet ﷺ added: \"I do not say Alif Lam Mim is a letter. Alif is a letter, Lam is a letter and Mim is a letter.\"",
    source: "Jami' at-Tirmidhi 2910",
  },
  {
    title: "The greatest ayah",
    body: "The Prophet ﷺ asked Ubayy ibn Ka'b which ayah of the Quran is the greatest. He answered Ayat al-Kursi, and the Prophet ﷺ congratulated him on his knowledge.",
    source: "Sahih Muslim 810 · Quran 2:255",
    ayah: { surah: 2, ayah: 255 },
  },
  {
    title: "A third of the Quran in four lines",
    body: "Surah Al-Ikhlas, \"Say: He is Allah, the One\", is equal to a third of the Quran, the Prophet ﷺ said. It is about Allah's oneness, one of the Quran's three great themes.",
    source: "Sahih al-Bukhari 5013",
    ayah: { surah: 112, ayah: 1 },
  },
  {
    title: "The longest and the shortest surah",
    body: "Al-Baqarah is the longest surah, with 286 ayat. Al-Kawthar is the shortest, with only 3.",
    source: "Quran 2 and 108",
    ayah: { surah: 108, ayah: 1 },
  },
  {
    title: "The longest ayah is about debt",
    body: "The longest single ayah in the Quran, 2:282, sets out how to write down a loan, with witnesses. Fairness in everyday dealings matters enough for the longest ayah.",
    source: "Quran 2:282",
    ayah: { surah: 2, ayah: 282 },
  },
  {
    title: "One surah without Bismillah, one with two",
    body: "At-Tawbah is the only surah that doesn't open with Bismillah. An-Naml has it twice: at its start, and in the letter Sulaiman sent to the Queen of Saba'. So the Quran still holds 114 Bismillahs.",
    source: "Quran 9:1 · 27:30",
    ayah: { surah: 27, ayah: 30 },
  },
  {
    title: "The only woman named in the Quran",
    body: "Maryam, the mother of Isa, is the only woman mentioned by name in the Quran, and a whole surah, the 19th, carries her name.",
    source: "Quran 19:16",
    ayah: { surah: 19, ayah: 16 },
  },
  {
    title: "The prophet named most often",
    body: "Musa is named more than any other prophet in the Quran, around 136 times. His story is told across many surahs, from his birth to the crossing of the sea.",
    source: "Quran 20:9 onwards, among many",
    ayah: { surah: 20, ayah: 9 },
  },
  {
    title: "Muhammad ﷺ is named four times",
    body: "The name Muhammad appears four times in the Quran, and the name Ahmad once, in the words of Isa giving good news of a messenger to come after him.",
    source: "Quran 3:144 · 33:40 · 47:2 · 48:29 · 61:6",
    ayah: { surah: 61, ayah: 6 },
  },
  {
    title: "The Seal of the Prophets",
    body: "Muhammad ﷺ is the messenger of Allah and the last of the prophets. No prophet comes after him.",
    source: "Quran 33:40",
    ayah: { surah: 33, ayah: 40 },
  },
  {
    title: "Islam is built on five",
    body: "The Prophet ﷺ said Islam is built on five: bearing witness that there is no god but Allah and that Muhammad is His messenger, prayer, zakat, Hajj and fasting Ramadan.",
    source: "Sahih al-Bukhari 8",
  },
  {
    title: "Six things to believe in",
    body: "When Jibril came as a man and asked about faith, the Prophet ﷺ answered: believe in Allah, His angels, His books, His messengers, the Last Day, and destiny, its good and its bad.",
    source: "Sahih Muslim 8",
  },
  {
    title: "Ihsan: as if you see Him",
    body: "In the same hadith Jibril asked about ihsan, excellence. The answer: worship Allah as though you see Him, and though you don't see Him, He sees you.",
    source: "Sahih Muslim 8",
  },
  {
    title: "Actions are by intentions",
    body: "The very first hadith in Sahih al-Bukhari: deeds are judged by intentions, and everyone gets what they intended. The same act can be worship or nothing, depending on why it is done.",
    source: "Sahih al-Bukhari 1",
  },
  {
    title: "The Hijri calendar starts with a journey",
    body: "The Islamic calendar counts from the Hijrah, the Prophet's ﷺ migration from Makkah to Madinah in 622 CE. The count was set during the caliphate of Umar.",
    source: "Islamic history",
  },
  {
    title: "Why Ramadan moves every year",
    body: "The Hijri year follows the moon: 12 months of 29 or 30 days, about 354 days. That is around 11 days shorter than the solar year, so Ramadan comes earlier each year and passes through every season in about 33 years.",
    source: "Quran 9:36 · 2:189",
    ayah: { surah: 2, ayah: 189 },
  },
  {
    title: "Four sacred months",
    body: "Of the twelve months, four are sacred: Dhul-Qa'dah, Dhul-Hijjah, Muharram and Rajab. Wrongdoing in them is especially serious.",
    source: "Quran 9:36",
    ayah: { surah: 9, ayah: 36 },
  },
  {
    title: "Better than a thousand months",
    body: "Laylat al-Qadr, the Night of Decree, is better than a thousand months: more than 83 years. The Prophet ﷺ told us to seek it in the odd nights of the last ten of Ramadan.",
    source: "Quran 97:3 · Sahih al-Bukhari 2017",
    ayah: { surah: 97, ayah: 1 },
  },
  {
    title: "The Quran came down in Ramadan",
    body: "Ramadan is the month in which the Quran was sent down, as guidance for people. That is why many Muslims read the whole Quran during it.",
    source: "Quran 2:185",
    ayah: { surah: 2, ayah: 185 },
  },
  {
    title: "Revealed over 23 years",
    body: "The Quran was not sent down all at once but in parts over about 23 years, so the Prophet ﷺ could recite it to people slowly.",
    source: "Quran 17:106",
    ayah: { surah: 17, ayah: 106 },
  },
  {
    title: "From scattered pages to one book",
    body: "After many reciters died at the battle of Yamamah, Abu Bakr had Zayd ibn Thabit gather the Quran into one copy. Later, Uthman had standard copies made and sent to the main cities.",
    source: "Sahih al-Bukhari 4986 · 4987",
  },
  {
    title: "114 surahs, 30 juz",
    body: "The Quran has 114 surahs and is divided into 30 equal parts (juz), so it can be read in a month: one juz a day. In the common Kufan count it has 6,236 ayat.",
    source: "The Madinah Mushaf",
  },
  {
    title: "The seven oft-repeated",
    body: "Al-Fatihah is called \"the seven oft-repeated\": seven ayat recited in every rak'ah. There is no prayer without it.",
    source: "Quran 15:87 · Sahih al-Bukhari 756",
    ayah: { surah: 15, ayah: 87 },
  },
  {
    title: "The five prayers were given in the heavens",
    body: "The five daily prayers were made obligatory during the Night Journey and Ascension (Isra' and Mi'raj), when the Prophet ﷺ was taken up through the heavens.",
    source: "Quran 17:1 · Sahih al-Bukhari 349",
    ayah: { surah: 17, ayah: 1 },
  },
  {
    title: "The direction of prayer changed",
    body: "For about sixteen or seventeen months in Madinah the Muslims prayed towards Jerusalem. Then Allah turned the qiblah to the Ka'bah in Makkah.",
    source: "Quran 2:144 · Sahih al-Bukhari 40",
    ayah: { surah: 2, ayah: 144 },
  },
  {
    title: "Built by a father and son",
    body: "Ibrahim and his son Ismail raised the foundations of the Ka'bah together, praying: \"Our Lord, accept this from us.\"",
    source: "Quran 2:127",
    ayah: { surah: 2, ayah: 127 },
  },
  {
    title: "Zamzam began with a mother's search",
    body: "Hajar ran seven times between the hills of Safa and Marwah looking for water for baby Ismail, until the spring of Zamzam burst out. Pilgrims walk the same path in Hajj and Umrah.",
    source: "Sahih al-Bukhari 3364",
  },
  {
    title: "A prayer in Makkah is worth 100,000",
    body: "A prayer in the Prophet's ﷺ mosque in Madinah is better than a thousand elsewhere, except Masjid al-Haram, where a prayer is worth a hundred thousand.",
    source: "Sahih al-Bukhari 1190 · Sunan Ibn Majah 1406",
  },
  {
    title: "Three mosques worth the journey",
    body: "The Prophet ﷺ said one should only set out on a journey specially to three mosques: Masjid al-Haram, his own mosque, and Masjid al-Aqsa.",
    source: "Sahih al-Bukhari 1189",
  },
  {
    title: "The best day of the week",
    body: "The best day the sun rises on is Friday. On it Adam was created, on it he entered Paradise, and on it the Hour will come.",
    source: "Sahih Muslim 854",
  },
  {
    title: "Purity is half of faith",
    body: "The Prophet ﷺ said purity is half of faith. Wudu before prayer is part of worship, not just washing.",
    source: "Sahih Muslim 223",
  },
  {
    title: "Wudu washes sins away",
    body: "When a believer washes their face in wudu, every sin their eyes looked at leaves with the water, and so with the hands and feet, until they come out cleansed.",
    source: "Sahih Muslim 244",
  },
  {
    title: "Seeking knowledge is a duty",
    body: "The Prophet ﷺ said that seeking knowledge is an obligation on every Muslim. Learning, including learning to read the Quran, is worship.",
    source: "Sunan Ibn Majah 224",
  },
  {
    title: "A road to Paradise",
    body: "Whoever takes a path seeking knowledge, Allah makes easy for them a path to Paradise.",
    source: "Sahih Muslim 2699",
  },
  {
    title: "The best of you",
    body: "\"The best of you are those who learn the Quran and teach it.\"",
    source: "Sahih al-Bukhari 5027",
  },
  {
    title: "Deeds that keep going after death",
    body: "When a person dies, their deeds end except three: ongoing charity, knowledge others benefit from, and a righteous child who prays for them.",
    source: "Sahih Muslim 1631",
  },
  {
    title: "Small but steady",
    body: "The deeds most loved by Allah are the ones done regularly, even if they are small. A page a day beats a juz once a month.",
    source: "Sahih al-Bukhari 6464",
  },
  {
    title: "Two light words, heavy on the scale",
    body: "Two phrases are light on the tongue, heavy on the scale and loved by the Most Merciful: SubhanAllahi wa bihamdihi, SubhanAllahil-'Azim.",
    source: "Sahih al-Bukhari 6406",
  },
  {
    title: "The living and the dead",
    body: "The one who remembers their Lord and the one who doesn't are like the living and the dead.",
    source: "Sahih al-Bukhari 6407",
  },
  {
    title: "Hearts find rest",
    body: "\"Verily, in the remembrance of Allah do hearts find rest.\"",
    source: "Quran 13:28",
    ayah: { surah: 13, ayah: 28 },
  },
  {
    title: "Remember Me, I will remember you",
    body: "\"So remember Me; I will remember you. Be grateful to Me and do not deny Me.\"",
    source: "Quran 2:152",
    ayah: { surah: 2, ayah: 152 },
  },
  {
    title: "Allah is near",
    body: "\"When My servants ask you about Me, I am near. I answer the call of the caller when he calls upon Me.\"",
    source: "Quran 2:186",
    ayah: { surah: 2, ayah: 186 },
  },
  {
    title: "Closer than your jugular vein",
    body: "Allah created the human, knows what their soul whispers to them, and is closer to them than their jugular vein.",
    source: "Quran 50:16",
    ayah: { surah: 50, ayah: 16 },
  },
  {
    title: "Never more than you can bear",
    body: "\"Allah does not burden a soul beyond what it can bear.\" The closing ayat of Al-Baqarah end with a prayer every Muslim can make.",
    source: "Quran 2:286",
    ayah: { surah: 2, ayah: 286 },
  },
  {
    title: "Ease, twice",
    body: "\"Indeed, with hardship comes ease. Indeed, with hardship comes ease.\" Said twice, one after the other.",
    source: "Quran 94:5–6",
    ayah: { surah: 94, ayah: 5 },
  },
  {
    title: "Mercy in a hundred parts",
    body: "Allah made mercy in a hundred parts. He sent one part down to earth, and from it all creatures show mercy to each other, even a mare lifting her hoof from her foal. He kept ninety-nine for the Day of Judgement.",
    source: "Sahih al-Bukhari 6000",
  },
  {
    title: "Mercy before anger",
    body: "When Allah created creation, He wrote in a book with Him above the Throne: \"My mercy prevails over My anger.\"",
    source: "Sahih al-Bukhari 7404",
  },
  {
    title: "Ninety-nine names",
    body: "Allah has ninety-nine names, one hundred less one. Whoever learns them, understands them and lives by them will enter Paradise.",
    source: "Sahih al-Bukhari 2736 · Sahih Muslim 2677",
  },
  {
    title: "Allah looks at hearts",
    body: "Allah does not look at your appearance or your wealth. He looks at your hearts and your deeds.",
    source: "Sahih Muslim 2564",
  },
  {
    title: "Love for your brother",
    body: "None of you truly believes until he loves for his brother what he loves for himself.",
    source: "Sahih al-Bukhari 13",
  },
  {
    title: "Speak good or stay silent",
    body: "Whoever believes in Allah and the Last Day should say something good or keep quiet.",
    source: "Sahih al-Bukhari 6018",
  },
  {
    title: "A smile is charity",
    body: "Smiling at your brother is charity. So is guiding someone who is lost and removing a stone or thorn from the road.",
    source: "Jami' at-Tirmidhi 1956",
  },
  {
    title: "Charity never makes you poorer",
    body: "Charity does not decrease wealth. Allah only adds honour to one who forgives, and raises whoever humbles himself for Allah.",
    source: "Sahih Muslim 2588",
  },
  {
    title: "Spread salam",
    body: "\"You will not enter Paradise until you believe, and you will not believe until you love one another. Shall I tell you something that, if you do it, you will love one another? Spread salam among you.\"",
    source: "Sahih Muslim 54",
  },
  {
    title: "Your mother, three times",
    body: "A man asked who most deserves his good company. The Prophet ﷺ said: \"Your mother.\" Then who? \"Your mother.\" Then who? \"Your mother.\" Then who? \"Your father.\"",
    source: "Sahih al-Bukhari 5971",
  },
  {
    title: "Forgiven for giving a dog water",
    body: "A man found a dog panting with thirst, climbed down a well, filled his shoe with water and gave it a drink. Allah thanked him and forgave him. There is a reward in kindness to every living being.",
    source: "Sahih al-Bukhari 2363",
  },
  {
    title: "Say Bismillah and eat with your right hand",
    body: "The Prophet ﷺ taught a boy: \"Mention the name of Allah, eat with your right hand, and eat from what is in front of you.\"",
    source: "Sahih al-Bukhari 5376",
  },
  {
    title: "When you sneeze",
    body: "When one of you sneezes, say \"Alhamdulillah\". Whoever hears it replies \"Yarhamukallah\" (may Allah have mercy on you), and the sneezer answers \"Yahdikumullah wa yuslihu balakum\".",
    source: "Sahih al-Bukhari 6224",
  },
  {
    title: "The siwak",
    body: "The Prophet ﷺ said that if it would not be hard on his ummah, he would have ordered them to use the siwak (tooth-stick) before every prayer.",
    source: "Sahih al-Bukhari 887",
  },
  {
    title: "Healing in honey",
    body: "Surah An-Nahl, \"The Bee\", says that from the bellies of bees comes a drink of different colours, in which there is healing for people.",
    source: "Quran 16:69",
    ayah: { surah: 16, ayah: 69 },
  },
  {
    title: "Surahs named after animals",
    body: "Several surahs are named after animals: Al-Baqarah (the cow), Al-An'am (cattle), An-Nahl (the bee), An-Naml (the ant), Al-'Ankabut (the spider) and Al-Fil (the elephant).",
    source: "Quran 2 · 6 · 16 · 27 · 29 · 105",
    ayah: { surah: 27, ayah: 18 },
  },
  {
    title: "Every living thing from water",
    body: "\"We made from water every living thing. Will they not then believe?\"",
    source: "Quran 21:30",
    ayah: { surah: 21, ayah: 30 },
  },
  {
    title: "Asleep for 309 years",
    body: "The young men of the Cave fled to protect their faith and Allah let them sleep for three hundred years, and nine more.",
    source: "Quran 18:25",
    ayah: { surah: 18, ayah: 25 },
  },
  {
    title: "Luqman's advice to his son",
    body: "Luqman told his son: don't associate anything with Allah; pray, enjoin good and forbid evil; be patient; don't turn your cheek away from people in pride; walk modestly and lower your voice.",
    source: "Quran 31:13–19",
    ayah: { surah: 31, ayah: 13 },
  },
  {
    title: "Five prophets of firm resolve",
    body: "Five messengers are known as Ulul 'Azm, those of firm resolve: Nuh, Ibrahim, Musa, Isa and Muhammad ﷺ.",
    source: "Quran 46:35 · 33:7",
    ayah: { surah: 33, ayah: 7 },
  },
  {
    title: "The friend in the cave",
    body: "During the Hijrah, the Prophet ﷺ and Abu Bakr hid in a cave. \"Do not grieve, Allah is with us,\" he told his companion.",
    source: "Quran 9:40",
    ayah: { surah: 9, ayah: 40 },
  },
  {
    title: "The religion was completed at Arafah",
    body: "\"Today I have perfected your religion for you\" was revealed on the day of Arafah, during the Prophet's ﷺ farewell Hajj.",
    source: "Quran 5:3 · Sahih al-Bukhari 45",
    ayah: { surah: 5, ayah: 3 },
  },
  {
    title: "Fasting the day of Arafah",
    body: "Fasting the day of Arafah wipes out the sins of the year before and the year after. Fasting 'Ashura wipes out the year before.",
    source: "Sahih Muslim 1162",
  },
  {
    title: "Ramadan with faith",
    body: "Whoever fasts Ramadan out of faith and hoping for reward will have their past sins forgiven.",
    source: "Sahih al-Bukhari 38",
  },
  {
    title: "Islam means submission, and peace",
    body: "\"Islam\" comes from the same root as salam, peace: it means submitting to Allah. A Muslim is one who submits.",
    source: "Arabic root s-l-m",
  },
  {
    title: "Time is a witness",
    body: "Surah Al-'Asr is only three ayat: by time, all people are in loss, except those who believe, do good, and urge each other to truth and patience. Imam ash-Shafi'i said that had people reflected on this surah alone, it would have been enough for them.",
    source: "Quran 103",
    ayah: { surah: 103, ayah: 1 },
  },
  {
    title: "Call on Me",
    body: "\"Your Lord says: Call upon Me, I will respond to you.\"",
    source: "Quran 40:60",
    ayah: { surah: 40, ayah: 60 },
  },
];

const DAY = 24 * 60 * 60 * 1000;

/** Days since 1 Jan 1970 in local time: the same number all day long. */
export function dayNumber(date = new Date()) {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY);
}

// The series starts on the day this was added, with the first revelation.
const START = Date.UTC(2026, 10, 13) / DAY;

/** The fact for a day number (see dayNumber): one a day, in order, then round again. */
export function factOfDay(day: number) {
  const n = ISLAM_FACTS.length;
  return ISLAM_FACTS[(((day - START) % n) + n) % n];
}
