-- ============================================================================
-- Aimprove Supabase Initial Curriculum Seed (Japanese Levels 1-2 & Quran Pages)
-- ============================================================================

insert into public.jp_subjects (id, level, kind, characters, meanings, readings, reading_type, component_ids, amalgamation_ids, mnemonic, reading_mnemonic, jlpt_level, grammar_structure)
values
  ('rad-ground', 1, 'radical', '一', '["Ground", "One"]'::jsonb, '[]'::jsonb, null, '[]'::jsonb, '["kan-ichi", "kan-ue", "kan-shita"]'::jsonb, 'A single horizontal stroke lying flat like the ground beneath your feet.', null, 'N5', null),
  ('rad-person', 1, 'radical', '人', '["Person"]'::jsonb, '[]'::jsonb, null, '[]'::jsonb, '["kan-hito"]'::jsonb, 'Two legs striding forward in profile represent a walking person.', null, 'N5', null),
  ('rad-mouth', 1, 'radical', '口', '["Mouth"]'::jsonb, '[]'::jsonb, null, '[]'::jsonb, '["kan-kuchi"]'::jsonb, 'A wide-open square box shaped like an open mouth.', null, 'N5', null),
  ('rad-sun', 1, 'radical', '日', '["Sun", "Day"]'::jsonb, '[]'::jsonb, null, '[]'::jsonb, '["kan-hi"]'::jsonb, 'A bright window looking out at the sun.', null, 'N5', null),
  ('rad-tree', 1, 'radical', '木', '["Tree", "Wood"]'::jsonb, '[]'::jsonb, null, '[]'::jsonb, '["kan-hon", "kan-yasumu"]'::jsonb, 'A sturdy trunk with branches reaching out and roots anchored below.', null, 'N5', null),
  ('rad-mountain', 1, 'radical', '山', '["Mountain"]'::jsonb, '[]'::jsonb, null, '[]'::jsonb, '["kan-yama"]'::jsonb, 'Three sharp rocky peaks rising out of the earth.', null, 'N5', null),
  ('rad-river', 1, 'radical', '川', '["River", "Stream"]'::jsonb, '[]'::jsonb, null, '[]'::jsonb, '["kan-kawa"]'::jsonb, 'Three flowing currents of water streaming side by side.', null, 'N5', null),
  ('rad-power', 1, 'radical', '力', '["Power", "Strength"]'::jsonb, '[]'::jsonb, null, '[]'::jsonb, '["kan-chikara"]'::jsonb, 'A flexed arm muscle showing raw physical strength and power.', null, 'N5', null),
  ('kan-ichi', 1, 'kanji', '一', '["One"]'::jsonb, '["いち", "ひと"]'::jsonb, 'onyomi', '["rad-ground"]'::jsonb, '["voc-hitotsu", "voc-hitori"]'::jsonb, 'One single stroke resting on the ground means One.', 'Your skin itches (いち) in one spot.', 'N5', null),
  ('kan-hito', 1, 'kanji', '人', '["Person", "Human"]'::jsonb, '["にん", "じん", "ひと"]'::jsonb, 'onyomi', '["rad-person"]'::jsonb, '["voc-hito", "voc-hitori", "voc-nihonjin"]'::jsonb, 'The person radical is identical to the kanji for Person.', 'Imagine a ninja (にん) who is a stealthy person.', 'N5', null),
  ('kan-ue', 1, 'kanji', '上', '["Above", "Up"]'::jsonb, '["じょう", "うえ"]'::jsonb, 'onyomi', '["rad-ground"]'::jsonb, '["voc-ue"]'::jsonb, 'A marker standing above the flat ground line means Above or Up.', 'Joe (じょう) climbed above the clouds.', 'N5', null),
  ('kan-shita', 1, 'kanji', '下', '["Below", "Down", "Under"]'::jsonb, '["か", "げ", "した"]'::jsonb, 'onyomi', '["rad-ground"]'::jsonb, '["voc-shita"]'::jsonb, 'Everything hanging beneath the ground line points Below.', 'A car (か) is parked down below.', 'N5', null),
  ('voc-hitotsu', 1, 'vocab', '一つ', '["One Thing", "One"]'::jsonb, '["ひとつ"]'::jsonb, 'vocab', '["kan-ichi"]'::jsonb, '[]'::jsonb, 'The kanji One followed by つ is the native Japanese counter for One Thing (ひとつ).', null, 'N5', null),
  ('voc-hitori', 1, 'vocab', '一人', '["One Person", "Alone"]'::jsonb, '["ひとり"]'::jsonb, 'vocab', '["kan-ichi", "kan-hito"]'::jsonb, '[]'::jsonb, 'One + Person takes the counter reading ひとり.', null, 'N5', null),
  ('gram-te-iru', 1, 'grammar', '〜ている', '["Ongoing Action", "Resultant State"]'::jsonb, '["ている", "ています"]'::jsonb, 'cloze', '[]'::jsonb, '[]'::jsonb, 'Combines the て-form of an action with いる to express ongoing state.', null, 'N5', 'Verb (て-form) + いる / います')
on conflict (id) do nothing;

insert into public.quran_pages (page_number, juz, hizb, surah_summary, ayah_count)
values
  (1, 1, 1, 'Surah Al-Fatihah (1:1-7)', 7),
  (2, 1, 1, 'Surah Al-Baqarah (2:1-5)', 5),
  (582, 30, 59, 'Surah An-Naba (78:1-30)', 30),
  (602, 30, 60, 'Al-Kafirun (109), An-Nasr (110), Al-Masad (111)', 14),
  (603, 30, 60, 'Al-Ikhlas / Al-Falaq', 9),
  (604, 30, 60, 'Al-Ikhlas (112), Al-Falaq (113), An-Nas (114)', 15)
on conflict (page_number) do nothing;

