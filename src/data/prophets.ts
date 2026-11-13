/**
 * The 25 prophets named in the Quran, in the order commonly taught. Each
 * story keeps to what the Quran (and sahih hadith, where noted) tells us;
 * where the Quran says little, the story says so.
 */

export interface QuranRef {
  surah: number;
  ayah: number;
  to?: number; // last ayah of the passage
  about: string;
}

export interface Prophet {
  id: string;
  name: string;
  arabic: string;
  known?: string; // the name in English/Biblical tradition
  sentTo?: string;
  summary: string;
  story: string[];
  lessons: string[];
  refs: QuranRef[];
}

export const PROPHETS: Prophet[] = [
  {
    id: 'adam',
    name: 'Adam',
    arabic: 'آدم',
    sentTo: 'The first human, and the first prophet',
    summary: 'Created by Allah, honoured by the angels, and the first to repent.',
    story: [
      'Allah told the angels He would place a khalifah, a successor, on the earth. He created Adam from clay, breathed into him of His spirit, and taught him the names of all things, knowledge the angels did not have.',
      'Allah commanded the angels to prostrate to Adam, and they all did except Iblis, who refused out of pride: "I am better than him. You created me from fire and him from clay."',
      'Adam and his wife lived in the Garden and could eat from it freely, except from one tree. Shaytan whispered to them until they ate from it. They did not argue or blame others; they turned back to Allah: "Our Lord, we have wronged ourselves. If You do not forgive us and have mercy on us, we will surely be among the losers."',
      'Allah accepted their repentance and sent them down to the earth, promising guidance to them and their children: whoever follows it will have no fear and will not grieve.',
    ],
    lessons: [
      'Pride was the first sin; it is what kept Iblis from obeying.',
      'Everyone slips. What matters is turning back to Allah quickly and sincerely.',
      'Knowledge is part of the honour Allah gave humans.',
    ],
    refs: [
      { surah: 2, ayah: 30, to: 39, about: 'The successor on earth, the names, and the descent' },
      { surah: 7, ayah: 11, to: 25, about: 'Iblis refuses, and the prayer of repentance' },
      { surah: 20, ayah: 115, to: 123, about: 'The tree and the promise of guidance' },
    ],
  },
  {
    id: 'idris',
    name: 'Idris',
    arabic: 'إدريس',
    known: 'Enoch',
    summary: 'A truthful prophet whom Allah raised to a high station.',
    story: [
      'The Quran tells us little about Idris, but what it says is high praise: he was "a man of truth and a prophet, and We raised him to a high station."',
      'He is named alongside Ismail and Dhul-Kifl as one of the patient, whom Allah admitted into His mercy because they were righteous.',
      'In the hadith of the Ascension (Mi\'raj), the Prophet ﷺ met Idris in the fourth heaven, and Idris welcomed him: "Welcome to the righteous brother and the righteous prophet."',
    ],
    lessons: [
      'Truthfulness is one of the qualities the Quran praises most.',
      'A life does not need a long story to be honoured by Allah.',
    ],
    refs: [
      { surah: 19, ayah: 56, to: 57, about: 'A man of truth, raised to a high station' },
      { surah: 21, ayah: 85, to: 86, about: 'Among the patient and the righteous' },
    ],
  },
  {
    id: 'nuh',
    name: 'Nuh',
    arabic: 'نوح',
    known: 'Noah',
    sentTo: 'His people, who worshipped idols',
    summary: 'Called his people for 950 years, then built the Ark.',
    story: [
      'Nuh called his people to worship Allah alone for nine hundred and fifty years. He called them by night and by day, in public and in private. They put their fingers in their ears, covered themselves with their clothes and grew more arrogant.',
      'Only a few believed. Allah revealed to Nuh that no more of his people would believe, and told him to build the Ark. The chiefs mocked him as he built it on dry land.',
      'Then the water poured from the sky and burst from the earth. Nuh took the believers and a pair of every kind of animal. His own son refused to board, saying he would climb a mountain, and he was among those who drowned. Nuh\'s wife, too, did not believe.',
      'When the water fell, the Ark came to rest on Mount Judi.',
    ],
    lessons: [
      'Keep calling to good, patiently, even when few respond.',
      'Faith is not inherited: being a prophet\'s son or wife did not save those who refused.',
      'Allah saves those who believe.',
    ],
    refs: [
      { surah: 71, ayah: 1, to: 28, about: 'Surah Nuh: his calling, by night and by day' },
      { surah: 11, ayah: 25, to: 49, about: 'The Ark, the flood and his son' },
      { surah: 29, ayah: 14, about: 'A thousand years less fifty' },
      { surah: 66, ayah: 10, about: 'The wives of Nuh and Lut' },
    ],
  },
  {
    id: 'hud',
    name: 'Hud',
    arabic: 'هود',
    sentTo: 'The people of \'Ad, in al-Ahqaf (southern Arabia)',
    summary: 'Warned the mighty people of \'Ad, who trusted in their own strength.',
    story: [
      'The people of \'Ad were tall and strong, and they built Iram, the city of lofty pillars, "the like of which was never created in the land". Their strength made them proud: "Who is greater than us in strength?"',
      'Allah sent them their brother Hud: "O my people, worship Allah; you have no god but Him." He asked for no reward, only that they seek forgiveness and turn to Allah. They told him they would not leave their gods on his word.',
      'When they saw a cloud coming towards their valleys they rejoiced, thinking it would bring rain. It was a furious, icy wind that blew for seven nights and eight days, until they lay like hollow palm trunks. Allah saved Hud and those who believed with him.',
    ],
    lessons: [
      'Strength and wealth are no protection from Allah.',
      'What looks like a blessing can be a test, and the reverse.',
    ],
    refs: [
      { surah: 11, ayah: 50, to: 60, about: 'Hud\'s call to \'Ad' },
      { surah: 46, ayah: 21, to: 25, about: 'The cloud they thought was rain' },
      { surah: 69, ayah: 6, to: 8, about: 'Seven nights and eight days' },
      { surah: 89, ayah: 6, to: 8, about: 'Iram of the pillars' },
    ],
  },
  {
    id: 'salih',
    name: 'Salih',
    arabic: 'صالح',
    sentTo: 'The people of Thamud, in al-Hijr',
    summary: 'Brought the she-camel of Allah as a sign to Thamud.',
    story: [
      'Thamud came after \'Ad. They carved homes out of the mountains and built palaces on the plains. Allah sent them their brother Salih to call them to worship Him alone.',
      'They asked for a sign, and Allah gave them a she-camel: "This is the she-camel of Allah, a sign for you. Let her graze on Allah\'s earth and do her no harm." She had her turn to drink, and they had theirs.',
      'But they hamstrung the she-camel and dared Salih to bring the punishment. He told them they had three days. Then a mighty blast and earthquake seized them, and they lay lifeless in their homes. Salih and the believers were saved.',
    ],
    lessons: [
      'A clear sign is a mercy, and rejecting it after asking for it is serious.',
      'Homes carved in rock could not protect Thamud.',
    ],
    refs: [
      { surah: 7, ayah: 73, to: 79, about: 'The she-camel of Allah' },
      { surah: 11, ayah: 61, to: 68, about: 'Three days, then the blast' },
      { surah: 26, ayah: 141, to: 159, about: 'Her share of water' },
      { surah: 15, ayah: 80, to: 84, about: 'The people of al-Hijr' },
    ],
  },
  {
    id: 'ibrahim',
    name: 'Ibrahim',
    arabic: 'إبراهيم',
    known: 'Abraham',
    sentTo: 'His people, who worshipped idols and stars',
    summary: 'The friend of Allah, who broke the idols and was saved from the fire.',
    story: [
      'Ibrahim grew up among people who worshipped idols, his own father Azar among them. Looking at a star, then the moon, then the sun, he showed his people that whatever sets cannot be a god: "I have turned my face to the One who created the heavens and the earth."',
      'While his people were away he broke their idols, all but the biggest. When they asked who had done it, he said: "Ask them, if they can speak." They knew the idols could not, yet they built a great fire and threw him into it. Allah said: "O fire, be coolness and safety for Ibrahim."',
      'He argued with a king who claimed to give life and death: "Allah brings the sun from the east; bring it from the west." The king was dumbfounded.',
      'Later, in a dream, he saw himself sacrificing his son, and both of them submitted to Allah\'s command. Allah ransomed the son with a great sacrifice, remembered every Eid al-Adha. With his son Ismail he raised the foundations of the Ka\'bah. Allah took Ibrahim as His khalil, His close friend.',
    ],
    lessons: [
      'Use your reason: the Quran\'s first argument for Allah is one anyone can follow.',
      'Trust Allah completely, even in the fire.',
      'Hajj and Eid al-Adha keep Ibrahim\'s family\'s submission alive.',
    ],
    refs: [
      { surah: 6, ayah: 74, to: 83, about: 'The star, the moon and the sun' },
      { surah: 21, ayah: 51, to: 71, about: 'The idols and the fire' },
      { surah: 2, ayah: 258, about: 'The argument with the king' },
      { surah: 37, ayah: 99, to: 113, about: 'The dream and the sacrifice' },
      { surah: 2, ayah: 124, to: 129, about: 'Building the Ka\'bah' },
    ],
  },
  {
    id: 'lut',
    name: 'Lut',
    arabic: 'لوط',
    known: 'Lot',
    sentTo: 'The people of the cities of Sodom',
    summary: 'Stood alone against the open wrongdoing of his people.',
    story: [
      'Lut believed in Ibrahim and migrated with him; he is traditionally said to be his nephew. Allah sent him to a people who committed an indecency no one in the world had done before them, approaching men instead of women, and highway robbery, openly in their gatherings.',
      'Lut warned them again and again. Their answer was to threaten to drive him out "because they keep themselves pure".',
      'Angels came to Lut as guests, and the people rushed to his house. The angels told him to leave by night with his family and not look back. His wife stayed behind with the wrongdoers. At dawn their cities were turned upside down, and stones of baked clay rained on them.',
    ],
    lessons: [
      'Speak up for what is right, even if you stand alone.',
      'Being close to a prophet is not enough; each soul answers for itself.',
    ],
    refs: [
      { surah: 7, ayah: 80, to: 84, about: 'Lut\'s warning' },
      { surah: 11, ayah: 77, to: 83, about: 'The guests and the punishment' },
      { surah: 29, ayah: 26, to: 35, about: 'Lut believes in Ibrahim' },
    ],
  },
  {
    id: 'ismail',
    name: 'Ismail',
    arabic: 'إسماعيل',
    known: 'Ishmael',
    sentTo: 'The people around Makkah',
    summary: 'True to his promise, and a builder of the Ka\'bah.',
    story: [
      'Ismail was the son of Ibrahim and Hajar. Ibrahim left mother and baby by Allah\'s command in the barren valley of Makkah. When their water ran out, Hajar ran seven times between Safa and Marwah until the spring of Zamzam burst out (Sahih al-Bukhari 3364).',
      'When he was old enough to work beside his father, Ibrahim told him of the dream of sacrifice. Ismail answered: "O my father, do as you are commanded. You will find me, if Allah wills, among the patient." Most scholars hold that this son was Ismail.',
      'Together, father and son raised the foundations of the Ka\'bah. The Quran praises Ismail as true to his promise, a messenger and a prophet, who told his family to pray and give zakat.',
    ],
    lessons: [
      'Hajar\'s trust and effort together brought Zamzam: tawakkul and action.',
      'Keep your promises.',
    ],
    refs: [
      { surah: 19, ayah: 54, to: 55, about: 'True to his promise' },
      { surah: 37, ayah: 101, to: 107, about: '"You will find me among the patient"' },
      { surah: 2, ayah: 127, about: 'Raising the Ka\'bah with Ibrahim' },
    ],
  },
  {
    id: 'ishaq',
    name: 'Ishaq',
    arabic: 'إسحاق',
    known: 'Isaac',
    summary: 'The son given to Ibrahim and Sarah in old age.',
    story: [
      'Angels came to Ibrahim as guests. He hurried to serve them a roasted calf, and was alarmed when they did not eat. They told him not to fear: they were sent to the people of Lut, and they brought good news of a son, Ishaq, and after him a grandson, Ya\'qub.',
      'His wife Sarah laughed in wonder: "Shall I bear a child when I am an old woman and my husband is an old man?" The angels answered: "Do you wonder at the decree of Allah?"',
      'Ishaq became a prophet and one of the righteous, and from his line came many prophets of the Children of Israel.',
    ],
    lessons: [
      'Nothing is impossible for Allah, however late it seems.',
      'Generosity to guests is a trait of the prophets.',
    ],
    refs: [
      { surah: 11, ayah: 69, to: 73, about: 'The good news to Ibrahim and Sarah' },
      { surah: 37, ayah: 112, to: 113, about: 'A prophet among the righteous' },
      { surah: 51, ayah: 24, to: 30, about: 'Ibrahim\'s honoured guests' },
    ],
  },
  {
    id: 'yaqub',
    name: 'Ya\'qub',
    arabic: 'يعقوب',
    known: 'Jacob, also called Israel',
    summary: 'The father of Yusuf, a model of beautiful patience.',
    story: [
      'Ya\'qub, son of Ishaq, is also called Isra\'il; the Children of Israel are his descendants through his twelve sons.',
      'When his sons came back without Yusuf, with a shirt stained with false blood, he answered with "beautiful patience" and trusted Allah. He grieved so long that his eyes turned white, but he never lost hope: "Do not despair of the mercy of Allah."',
      'Years later, Yusuf\'s shirt was brought and cast over his face, and his sight returned. On his deathbed he asked his sons: "What will you worship after me?" They answered: "Your God, the God of your fathers Ibrahim, Ismail and Ishaq, one God."',
    ],
    lessons: [
      'Sabr jamil: patience without complaint to people, only to Allah.',
      'Never despair of Allah\'s mercy.',
      'Make sure your children know what they will worship after you.',
    ],
    refs: [
      { surah: 12, ayah: 18, about: 'Beautiful patience' },
      { surah: 12, ayah: 83, to: 87, about: 'His grief and his hope' },
      { surah: 12, ayah: 93, to: 96, about: 'His sight returns' },
      { surah: 2, ayah: 132, to: 133, about: 'His advice to his sons' },
    ],
  },
  {
    id: 'yusuf',
    name: 'Yusuf',
    arabic: 'يوسف',
    known: 'Joseph',
    sentTo: 'The people of Egypt',
    summary: 'From the well to the treasury of Egypt: "the best of stories".',
    story: [
      'As a boy, Yusuf dreamt that eleven stars, the sun and the moon bowed to him. His father told him to keep it from his brothers, who were already jealous. They threw him into a well, and travellers sold him in Egypt for a few coins.',
      'He grew up in the house of a minister, al-\'Aziz, whose wife tried to seduce him. He refused: "I seek refuge in Allah." Though innocent, he was put in prison, where he called his fellow prisoners to Allah and interpreted their dreams.',
      'When the king dreamt of seven fat cows eaten by seven lean ones, Yusuf explained it: seven years of plenty, then seven of drought. He was put in charge of the storehouses and saved Egypt from famine.',
      'His brothers came begging for grain without knowing him. When he finally revealed himself, he said: "No blame upon you today. Allah will forgive you." His parents came to Egypt and bowed before him, and his childhood dream came true.',
    ],
    lessons: [
      'Hardship can be the path to what Allah has planned for you.',
      'Chastity and honesty are worth prison.',
      'Forgive when you have the power to take revenge.',
    ],
    refs: [
      { surah: 12, ayah: 3, to: 6, about: 'The best of stories, and the dream' },
      { surah: 12, ayah: 15, to: 20, about: 'The well, and sold for a few coins' },
      { surah: 12, ayah: 23, to: 35, about: 'The minister\'s wife and the prison' },
      { surah: 12, ayah: 43, to: 57, about: 'The king\'s dream and the storehouses' },
      { surah: 12, ayah: 89, to: 100, about: '"No blame upon you today"' },
    ],
  },
  {
    id: 'ayyub',
    name: 'Ayyub',
    arabic: 'أيوب',
    known: 'Job',
    summary: 'Tested with illness and loss, and remembered for his patience.',
    story: [
      'Ayyub was tested with harm to his body and the loss of his family and wealth. The Quran does not dwell on the details; it records his prayer, which complains to no one but Allah: "Harm has touched me, and You are the Most Merciful of the merciful."',
      'Allah answered him: "Strike the ground with your foot. Here is a cool spring to wash in and to drink." His health returned, and Allah gave him back his family, and as many again with them, as a mercy.',
      'Allah describes him: "We found him patient. What an excellent servant! He always turned back to Allah."',
    ],
    lessons: [
      'Patience does not mean silence: Ayyub called on Allah in his pain.',
      'Ask Allah by His mercy.',
    ],
    refs: [
      { surah: 21, ayah: 83, to: 84, about: 'His prayer, and Allah\'s answer' },
      { surah: 38, ayah: 41, to: 44, about: '"We found him patient"' },
    ],
  },
  {
    id: 'shuaib',
    name: 'Shu\'aib',
    arabic: 'شعيب',
    sentTo: 'The people of Madyan, and the people of the Thicket',
    summary: 'Called his people to honest weights and fair trade.',
    story: [
      'The people of Madyan were traders who cheated: they gave short measure and short weight, and robbed people of their due. Allah sent them their brother Shu\'aib, known for his eloquence.',
      'He called them to worship Allah alone, give full measure and weight, and not spread corruption in the land. They mocked him: "Does your prayer tell you that we must leave what our fathers worshipped, or stop doing what we like with our own wealth?"',
      'They threatened to drive him and the believers out. Then an earthquake and a blast seized them, and they lay lifeless in their homes, as if they had never lived there.',
    ],
    lessons: [
      'Honesty in business is part of faith.',
      'Worship and how you earn your money cannot be kept apart.',
    ],
    refs: [
      { surah: 7, ayah: 85, to: 93, about: 'Full measure and weight' },
      { surah: 11, ayah: 84, to: 95, about: '"Does your prayer tell you…?"' },
      { surah: 26, ayah: 176, to: 191, about: 'The people of the Thicket' },
    ],
  },
  {
    id: 'musa',
    name: 'Musa',
    arabic: 'موسى',
    known: 'Moses',
    sentTo: 'Pharaoh and the Children of Israel',
    summary: 'The one Allah spoke to, who faced Pharaoh and crossed the sea.',
    story: [
      'Pharaoh was killing the baby boys of the Children of Israel. Allah inspired Musa\'s mother to put him in a basket on the river, promising to return him to her. He was found by Pharaoh\'s household and raised in the palace, and Allah brought him back to his mother to nurse.',
      'As a young man he fled Egypt to Madyan, where he worked for years and married. On the way back, at Mount Tur, Allah spoke to him from the fire: "I am Allah. There is no god but Me." His staff became a snake and his hand shone white, and his brother Harun was made his helper.',
      'Pharaoh\'s magicians threw their ropes, and Musa\'s staff swallowed what they made. The magicians fell down in prostration and believed, even under threat of death. When Musa led his people out, the sea parted for them, and Pharaoh and his army drowned.',
      'On the mountain Allah gave Musa the Tablets of the Torah. While he was away, as-Samiri led some of the people to worship a golden calf. Musa also travelled to learn from al-Khidr, a servant to whom Allah had given knowledge Musa did not have.',
    ],
    lessons: [
      'Allah protects whom He wills, even inside the palace of a tyrant.',
      'Truth overcomes even the best-made illusion.',
      'However much you know, there is always someone who knows more: keep learning.',
    ],
    refs: [
      { surah: 28, ayah: 7, to: 13, about: 'The basket on the river' },
      { surah: 20, ayah: 9, to: 36, about: 'Allah speaks to him, and Harun as helper' },
      { surah: 20, ayah: 65, to: 73, about: 'The magicians believe' },
      { surah: 26, ayah: 60, to: 67, about: 'The sea parts' },
      { surah: 18, ayah: 60, to: 82, about: 'Musa and al-Khidr' },
    ],
  },
  {
    id: 'harun',
    name: 'Harun',
    arabic: 'هارون',
    known: 'Aaron',
    sentTo: 'Pharaoh and the Children of Israel, with Musa',
    summary: 'Musa\'s brother and helper, given to him as a prophet.',
    story: [
      'When Allah sent Musa to Pharaoh, Musa asked for help: "My brother Harun is more eloquent than me. Send him with me as a helper to confirm me." Allah granted it, and Harun was made a prophet as a mercy to his brother.',
      'When Musa went to meet his Lord for forty nights, he left Harun in charge. While he was away, as-Samiri made a golden calf and many began to worship it. Harun warned them: "O my people, you are being tested by it. Your Lord is the Most Merciful, so follow me." They would not listen.',
      'Musa returned angry and seized his brother. Harun answered gently, "O son of my mother," explaining that he had feared splitting the people apart.',
    ],
    lessons: [
      'Asking for help is not weakness; Musa asked Allah for a partner in his mission.',
      'Siblings can support each other in doing good.',
    ],
    refs: [
      { surah: 20, ayah: 29, to: 36, about: '"Make my brother Harun my helper"' },
      { surah: 28, ayah: 34, to: 35, about: 'More eloquent in speech' },
      { surah: 20, ayah: 90, to: 94, about: 'The golden calf' },
      { surah: 19, ayah: 53, about: 'A prophet, out of Allah\'s mercy' },
    ],
  },
  {
    id: 'dhulkifl',
    name: 'Dhul-Kifl',
    arabic: 'ذو الكفل',
    summary: 'Named among the patient and the best.',
    story: [
      'The Quran mentions Dhul-Kifl twice, each time in a short list of the righteous: with Ismail and Idris as "all among the patient", and with Ismail and al-Yasa\' as "all among the best".',
      'His name means "the one with a portion" or "the one who took on a responsibility". Scholars differ on whether he was a prophet or a righteous man; in the list of 25 prophets taught in Indonesia and Malaysia he is counted among the prophets.',
    ],
    lessons: [
      'Allah\'s praise in a few words is worth more than fame.',
      'Patience is the quality the Quran names first for him.',
    ],
    refs: [
      { surah: 21, ayah: 85, to: 86, about: 'Among the patient' },
      { surah: 38, ayah: 48, about: 'Among the best' },
    ],
  },
  {
    id: 'dawud',
    name: 'Dawud',
    arabic: 'داود',
    known: 'David',
    sentTo: 'The Children of Israel',
    summary: 'Defeated Jalut, was given the Zabur, and the mountains sang with him.',
    story: [
      'As a young soldier in the army of King Talut, Dawud killed the giant Jalut (Goliath). Allah gave him kingship and wisdom and taught him what He willed.',
      'Allah gave him the Zabur (Psalms). The mountains and the birds glorified Allah with him, and Allah softened iron in his hands so he could make coats of mail.',
      'The Prophet ﷺ said the best fasting is the fasting of Dawud, who fasted every other day, and that he ate only from the work of his own hands (Sahih al-Bukhari 1131, 2072).',
    ],
    lessons: [
      'Courage comes from trust in Allah, not from size or numbers.',
      'Earn your own living, even if you are a king.',
    ],
    refs: [
      { surah: 2, ayah: 249, to: 251, about: 'Dawud kills Jalut' },
      { surah: 34, ayah: 10, to: 11, about: 'Mountains, birds and iron' },
      { surah: 38, ayah: 17, to: 20, about: 'Wisdom and decisive speech' },
      { surah: 17, ayah: 55, about: 'The Zabur' },
    ],
  },
  {
    id: 'sulaiman',
    name: 'Sulaiman',
    arabic: 'سليمان',
    known: 'Solomon',
    sentTo: 'The Children of Israel',
    summary: 'A king who understood the birds and the ants, and stayed thankful.',
    story: [
      'Sulaiman inherited from his father Dawud. Allah taught him the speech of birds, made the wind run at his command, and put the jinn to work for him. He asked Allah for a kingdom no one after him would have, and was given it.',
      'Marching with his army, he heard an ant warn the others to get into their homes before they were crushed. Sulaiman smiled and prayed: "My Lord, inspire me to be grateful for Your favour."',
      'The hoopoe brought news of a queen in Saba\' (Sheba) whose people worshipped the sun. Sulaiman wrote to her. Her throne was brought to him in the blink of an eye, and when she came, she submitted "with Sulaiman to Allah, Lord of the worlds".',
      'He died leaning on his staff, and the jinn kept working, not knowing, until a creature of the earth gnawed through the staff and he fell. Then they knew they had never known the unseen.',
    ],
    lessons: [
      'Power and wealth are a test of gratitude.',
      'Even an ant is worth listening to.',
      'Only Allah knows the unseen.',
    ],
    refs: [
      { surah: 27, ayah: 15, to: 19, about: 'The speech of birds, and the ant' },
      { surah: 27, ayah: 20, to: 44, about: 'The hoopoe and the Queen of Saba\'' },
      { surah: 34, ayah: 12, to: 14, about: 'The wind, the jinn, and his death' },
      { surah: 38, ayah: 30, to: 40, about: 'A kingdom like no other' },
    ],
  },
  {
    id: 'ilyas',
    name: 'Ilyas',
    arabic: 'إلياس',
    known: 'Elijah',
    sentTo: 'A people who worshipped the idol Ba\'l',
    summary: 'Called his people away from the idol Ba\'l.',
    story: [
      'Ilyas was one of the messengers. He said to his people: "Will you not fear Allah? Do you call upon Ba\'l and leave the Best of creators, Allah, your Lord and the Lord of your forefathers?"',
      'They denied him, except Allah\'s sincere servants. Allah left praise of him among later generations: "Peace be upon Ilyasin."',
    ],
    lessons: [
      'Call people to the Creator, not to things that are created.',
    ],
    refs: [
      { surah: 37, ayah: 123, to: 132, about: 'His call against Ba\'l' },
      { surah: 6, ayah: 85, about: 'Among the righteous' },
    ],
  },
  {
    id: 'alyasa',
    name: 'Al-Yasa\'',
    arabic: 'اليسع',
    known: 'Elisha',
    summary: 'Named among those preferred above the worlds.',
    story: [
      'Al-Yasa\' is named twice in the Quran: with Ismail, Yunus and Lut as ones Allah "preferred above the worlds", and with Ismail and Dhul-Kifl as "all among the best".',
      'Scholars say he followed Ilyas and carried on his mission among the Children of Israel. The Quran gives no more of his story.',
    ],
    lessons: [
      'Carrying on someone else\'s good work is itself honoured by Allah.',
    ],
    refs: [
      { surah: 6, ayah: 86, about: 'Preferred above the worlds' },
      { surah: 38, ayah: 48, about: 'Among the best' },
    ],
  },
  {
    id: 'yunus',
    name: 'Yunus',
    arabic: 'يونس',
    known: 'Jonah, also called Dhun-Nun',
    sentTo: 'A people of a hundred thousand or more',
    summary: 'Swallowed by the whale, saved by his prayer.',
    story: [
      'Yunus was sent to a people of a hundred thousand or more. When they did not believe, he left them in anger before Allah permitted him, and boarded a laden ship.',
      'At sea, lots were drawn, and Yunus was thrown overboard. A great fish swallowed him. In the darkness he called out: "There is no god but You. Glory be to You. I have been among the wrongdoers." Allah answered and saved him from distress, "and so We save the believers."',
      'He was cast ashore, ill, and Allah grew a gourd plant over him. Meanwhile his people believed, and Allah lifted the punishment from them, the only people the Quran says this happened to. Surah 10 is named after him.',
    ],
    lessons: [
      'Don\'t give up on people or a task before Allah\'s permission.',
      'The prayer of Yunus is answered in any distress (Jami\' at-Tirmidhi 3505).',
      'It is never too late to repent.',
    ],
    refs: [
      { surah: 21, ayah: 87, to: 88, about: 'The prayer in the darkness' },
      { surah: 37, ayah: 139, to: 148, about: 'The ship, the whale and the gourd' },
      { surah: 10, ayah: 98, about: 'His people believed and were spared' },
    ],
  },
  {
    id: 'zakariya',
    name: 'Zakariya',
    arabic: 'زكريا',
    known: 'Zechariah',
    sentTo: 'The Children of Israel',
    summary: 'Prayed quietly for a child in old age, and was given Yahya.',
    story: [
      'Zakariya was the guardian of Maryam. Whenever he entered her prayer room he found provision with her. "Where does this come from?" "It is from Allah. Allah provides for whom He wills without measure."',
      'Seeing that, he prayed to his Lord in secret: his bones were weak, his hair white, his wife barren, yet he had never been disappointed in calling on Allah. He asked for an heir to carry on the faith.',
      'The angels called him while he stood praying: Allah gave him good news of a son, Yahya. His sign was that he would not speak to people for three days except by gestures, while he glorified Allah morning and evening.',
    ],
    lessons: [
      'Ask Allah for what seems impossible.',
      'A quiet, private prayer is heard.',
    ],
    refs: [
      { surah: 3, ayah: 37, to: 41, about: 'Maryam\'s provision and his prayer' },
      { surah: 19, ayah: 2, to: 11, about: 'A prayer in secret' },
      { surah: 21, ayah: 89, to: 90, about: '"Do not leave me alone"' },
    ],
  },
  {
    id: 'yahya',
    name: 'Yahya',
    arabic: 'يحيى',
    known: 'John the Baptist',
    sentTo: 'The Children of Israel',
    summary: 'A name never given before, and wisdom as a child.',
    story: [
      'Yahya was the answer to his father Zakariya\'s prayer. Allah chose his name Himself, a name "We have not given to anyone before".',
      'Allah gave him wisdom while still a child, along with tenderness and purity. He was devoted to Allah, kind to his parents, and neither arrogant nor disobedient. He confirmed a word from Allah: the coming of Isa.',
      'Allah says of him: "Peace be upon him the day he was born, the day he dies, and the day he is raised alive."',
    ],
    lessons: [
      'Wisdom is not only for the old.',
      'Kindness to parents is part of a prophet\'s character.',
    ],
    refs: [
      { surah: 19, ayah: 7, to: 15, about: 'His name, his wisdom, and peace upon him' },
      { surah: 3, ayah: 39, about: 'Confirming a word from Allah' },
    ],
  },
  {
    id: 'isa',
    name: 'Isa',
    arabic: 'عيسى',
    known: 'Jesus',
    sentTo: 'The Children of Israel',
    summary: 'Born to Maryam without a father; given the Injil.',
    story: [
      'The angel came to Maryam with news of a son. She asked how, when no man had touched her. "So it will be: Allah creates what He wills." Allah says the example of Isa is like Adam, whom He created from dust and said "Be", and he was.',
      'When Maryam brought the baby to her people they accused her, and she pointed to him. The infant spoke from the cradle: "I am the servant of Allah. He has given me the Scripture and made me a prophet."',
      'By Allah\'s permission he made a bird of clay that flew, healed the blind and the leper, and gave life to the dead. He was given the Injil and called people to worship Allah alone: "Allah is my Lord and your Lord, so worship Him."',
      'The Quran says they did not kill him or crucify him; Allah raised him up to Himself. The Prophet ﷺ said he will descend again before the Hour (Sahih al-Bukhari 3448).',
    ],
    lessons: [
      'Miracles come by Allah\'s permission; the miracle-worker is a servant.',
      'Maryam\'s faith and purity are honoured by a whole surah.',
    ],
    refs: [
      { surah: 19, ayah: 16, to: 36, about: 'Maryam, the birth, and the cradle' },
      { surah: 3, ayah: 45, to: 59, about: 'His miracles, and like Adam' },
      { surah: 5, ayah: 110, to: 118, about: 'Allah\'s favours on Isa' },
      { surah: 4, ayah: 157, to: 158, about: 'Raised up to Allah' },
    ],
  },
  {
    id: 'muhammad',
    name: 'Muhammad ﷺ',
    arabic: 'محمد ﷺ',
    sentTo: 'All people, and a mercy to the worlds',
    summary: 'The final messenger, through whom the Quran was revealed.',
    story: [
      'Muhammad ﷺ was born in Makkah in the Year of the Elephant (around 570 CE), the year Abrahah\'s army came to destroy the Ka\'bah. His father died before he was born and his mother when he was six; he was raised by his grandfather and then his uncle Abu Talib. He became known as al-Amin, the trustworthy, and married Khadijah.',
      'At forty, in the cave of Hira, the angel Jibril brought the first revelation: "Read in the name of your Lord who created." Khadijah was the first to believe. For thirteen years he called the people of Makkah to Allah through mockery, boycott and persecution.',
      'In 622 CE he migrated to Madinah with Abu Bakr, hiding in a cave on the way. There the first Muslim community grew. Eight years later he returned to Makkah in victory and forgave its people.',
      'On his farewell Hajj the ayah was revealed: "Today I have perfected your religion for you." He died in Madinah in 11 AH, aged sixty-three. He is the Seal of the Prophets, and Allah calls him an excellent example for anyone who hopes in Allah and the Last Day.',
    ],
    lessons: [
      'He is the example to follow, in worship and in character.',
      'Trustworthiness earned him people\'s respect long before prophethood.',
      'Mercy and forgiveness, even to former enemies.',
    ],
    refs: [
      { surah: 96, ayah: 1, to: 5, about: 'The first revelation' },
      { surah: 9, ayah: 40, about: 'The cave during the Hijrah' },
      { surah: 33, ayah: 21, about: 'An excellent example' },
      { surah: 33, ayah: 40, about: 'The Seal of the Prophets' },
      { surah: 21, ayah: 107, about: 'A mercy to the worlds' },
    ],
  },
];
