/**
 * One-shot merge: append multi-film character nodes + edges into src/data/filmData.json.
 * Run from repo root: node scripts/add-multifilm-characters.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const target = path.join(root, "src/data/filmData.json");

const n = (
  id,
  name,
  film,
  filmId,
  basePower,
  type,
  role,
  zTarget,
  notes,
) => ({
  id,
  name,
  film,
  filmId,
  basePower,
  type,
  role,
  zTarget,
  notes,
});

const L = (source, target, formality, label, socialDistance) => ({
  source,
  target,
  formality,
  label,
  socialDistance,
});

const extraNodes = [
  // —— Spirited Away (more encoded bathhouse / threshold figures) ——
  n(
    "spirited_NightShiftCaptain",
    "Night-shift captain",
    "Spirited Away",
    "spirited-away",
    4,
    "worker",
    "After-hours floor lead",
    1.4,
    "Compressed polite chain between Lin’s day crew and bathhouse night routines.",
  ),
  n(
    "spirited_SeaRailConductor",
    "Sea-rail conductor",
    "Spirited Away",
    "spirited-away",
    5,
    "spirit-functionary",
    "Silent train steward",
    0.5,
    "Minimal honorific surface; institutional anonymity toward passengers.",
  ),
  n(
    "spirited_PaperCharmCourier",
    "Paper-charm courier",
    "Spirited Away",
    "spirited-away",
    3,
    "spirit-servant",
    "Shikigami-like messenger",
    -1.2,
    "High deferential chirps toward Yubaba’s office; clipped to peers.",
  ),
  n(
    "spirited_TunnelKappa",
    "Tunnel toll kappa",
    "Spirited Away",
    "spirited-away",
    3,
    "spirit-clerk",
    "Threshold fee spirit",
    1.9,
    "Terse transactional politeness at the red gate tunnel.",
  ),
  n(
    "spirited_ReturnDockClerk",
    "Return-dock clerk",
    "Spirited Away",
    "spirited-away",
    2,
    "worker",
    "Departure pier paperwork",
    1.5,
    "Formulaic desu/masu toward travelers leaving the spirit economy.",
  ),
  n(
    "spirited_FeastBusser",
    "Feast busser",
    "Spirited Away",
    "spirited-away",
    2,
    "worker",
    "No-Face banquet cleanup",
    1.7,
    "Burst keigo upward during chaos; plain peer coordination sideways.",
  ),
  n(
    "spirited_RiverbankKitsune",
    "Riverbank kitsune elder",
    "Spirited Away",
    "spirited-away",
    6,
    "spirit-guest",
    "Shallow-water observer",
    0.9,
    "Older guest register: soft honorifics from children, plain replies down.",
  ),
  n(
    "spirited_BathhouseScribe",
    "Contract scribe",
    "Spirited Away",
    "spirited-away",
    3,
    "worker",
    "Name-stealing paperwork assistant",
    1.2,
    "Institutional keigo shell around Yubaba’s naming violence.",
  ),

  // —— Rashōmon ——
  n("rashomon_Tajomaru", "Tajōmaru", "Rashōmon", "rashomon", 7, "bandit", "Confessed outlaw", 2.8, "Rough plain brags; court testimony shifts register with audience."),
  n("rashomon_Takehiro", "Takehiro Samurai", "Rashōmon", "rashomon", 5, "samurai", "Traveling husband", 1.5, "Honor-bound self-description under pressure."),
  n("rashomon_Masako", "Masako", "Rashōmon", "rashomon", 4, "noblewoman", "Traveling wife", 2.2, "Polite veneer cracking into accusatory speech."),
  n("rashomon_Woodcutter", "Woodcutter", "Rashōmon", "rashomon", 2, "commoner", "Gate narrator", 1.8, "Humble deferential frame to priest and commoner."),
  n("rashomon_Priest", "Traveling priest", "Rashōmon", "rashomon", 5, "cleric", "Moral witness", 1.0, "Measured Buddhist-inflected politeness."),
  n("rashomon_Commoner", "Commoner", "Rashōmon", "rashomon", 3, "commoner", "Shelter-seeker", 2.0, "Blunt transactional talk; challenges woodcutter’s tale."),

  // —— I Was Born, But… ——
  n("bornbut_Taro", "Taro", "I Was Born, But…", "born-but", 2, "child", "Older brother", 1.5, "Playground rough speech vs. polite mask toward adults."),
  n("bornbut_Jiro", "Jirō", "I Was Born, But…", "born-but", 2, "child", "Younger brother", 1.6, "Echoes Taro’s stance; bows when forced."),
  n("bornbut_Father", "Salaryman father", "I Was Born, But…", "born-but", 4, "salaryman", "Office father", 1.2, "Workplace hierarchy language brought home."),
  n("bornbut_Mother", "Mother", "I Was Born, But…", "born-but", 3, "homemaker", "Household anchor", 1.4, "Soft teineigo toward neighbors; plain to sons."),
  n("bornbut_Teacher", "Teacher Yamamoto", "I Was Born, But…", "born-but", 5, "teacher", "School authority", 0.8, "Institutional polite commands to pupils and parents."),
  n("bornbut_BullyBossSon", "Boss’s son", "I Was Born, But…", "born-but", 3, "child", "Privileged peer", -0.5, "Casual cruelty; parents’ rank backs his plain imperatives."),

  // —— Late Spring ——
  n("latespring_Noriko", "Noriko", "Late Spring", "late-spring", 3, "daughter", "Unmarried daughter", 2.0, "Deferential daughter speech toward father and matchmakers."),
  n("latespring_Shukichi", "Shūkichi", "Late Spring", "late-spring", 6, "father", "Professor widower", 0.5, "Warm plain at home; careful polite omissions about remarriage."),
  n("latespring_AuntMasa", "Aunt Masa", "Late Spring", "late-spring", 5, "relative", "Matchmaking aunt", 1.2, "Indirect keigo-heavy persuasion toward Noriko."),
  n("latespring_ProfessorHattori", "Professor Hattori", "Late Spring", "late-spring", 6, "academic", "Colleague / suitor’s father", 0.7, "Academic polite distance; careful honorifics in public."),
  n("latespring_MrsTaguchi", "Mrs Taguchi", "Late Spring", "late-spring", 4, "friend", "Father’s friend’s wife", 1.5, "Neighbor politeness; gossips gently."),
  n("latespring_MissMiwa", "Miss Miwa", "Late Spring", "late-spring", 3, "friend", "Noriko’s friend", 1.8, "Peer desu/masu; confessional plain in private."),

  // —— The Mourning Forest ——
  n("mourning_Machiko", "Machiko", "The Mourning Forest", "mourning-forest", 4, "caregiver", "Orchard widow", 1.5, "Soft rural politeness; grief thins honorific load."),
  n("mourning_Shigeki", "Shigeki", "The Mourning Forest", "mourning-forest", 5, "caregiver", "Elder husband", 1.2, "Few words; plain gratitude to helpers."),
  n("mourning_Nurse", "Visiting nurse", "The Mourning Forest", "mourning-forest", 3, "nurse", "Home nurse", 1.0, "Professional bedside teineigo."),
  n("mourning_NeighborFarmer", "Neighbor farmer", "The Mourning Forest", "mourning-forest", 2, "farmer", "Adjacent landowner", 1.7, "Rough plain offers of labor and tea."),
  n("mourning_FuneralOfficiant", "Funeral officiant", "The Mourning Forest", "mourning-forest", 5, "cleric", "Mountain rite leader", 0.6, "Liturgical polite frame; lowered speech to family."),
  n("mourning_ForestGuide", "Forest guide", "The Mourning Forest", "mourning-forest", 3, "worker", "Logging path guide", 1.9, "Terse practical speech; respectful distance to mourners."),

  // —— Millennium Actress ——
  n("millennium_Chiyoko", "Chiyoko Fujiwara", "Millennium Actress", "millennium-actress", 8, "actor", "Studio-era star", -0.5, "On-camera keigo archetypes; off-set guarded plain."),
  n("millennium_Genya", "Genya Tachibana", "Millennium Actress", "millennium-actress", 4, "documentarian", "TV crew lead", 1.2, "Fan-polite upward to Chiyoko; casual to crew."),
  n("millennium_Eiko", "Eiko Shimao", "Millennium Actress", "millennium-actress", 5, "actor", "Rival starlet", 1.0, "Competitive politeness; barbed honorifics in interviews."),
  n("millennium_Kyoji", "Kyōji Ida", "Millennium Actress", "millennium-actress", 6, "studio-boss", "Scout / producer", 0.3, "Paternalistic studio register toward talent."),
  n("millennium_Mino", "Mino", "Millennium Actress", "millennium-actress", 3, "assistant", "Key grip / driver", 1.6, "Workplace plain; polite spikes toward Genya."),
  n("millennium_Interviewer", "TV interviewer", "Millennium Actress", "millennium-actress", 4, "media", "Talk-show host", 1.1, "Broadcast-polite template questions."),

  // —— Tampopo ——
  n("tampopo_Tampopo", "Tampopo", "Tampopo", "tampopo", 4, "cook", "Ramen shop owner", 1.5, "Earnest learner register; polite to mentors."),
  n("tampopo_Goro", "Gorō", "Tampopo", "tampopo", 5, "trucker", "Truck-gun helper", 1.0, "Rough plain masculinity; respectful to Tampopo."),
  n("tampopo_Pisuken", "Pisuken", "Tampopo", "tampopo", 4, "contractor", "Noodle rival", 1.3, "Blustering sales talk; mock-polite challenges."),
  n("tampopo_Chu", "Chū", "Tampopo", "tampopo", 6, "sensei", "Ramen sensei", -0.2, "Master-to-student imperatives mixed with praise."),
  n("tampopo_Shohei", "Shōhei", "Tampopo", "tampopo", 3, "student", "Trainee cook", 1.8, "Student keigo toward sensei."),
  n("tampopo_OilMerchant", "Oil merchant", "Tampopo", "tampopo", 3, "vendor", "Market supplier", 1.7, "Transactional honorifics at loading dock."),

  // —— Funeral Parade of Roses ——
  n("roses_Eddie", "Eddie", "Funeral Parade of Roses", "funeral-parade-roses", 5, "host", "Bar host", 0.5, "Camp in-group plain; theatrical politeness to marks."),
  n("roses_Leda", "Leda", "Funeral Parade of Roses", "funeral-parade-roses", 4, "host", "Co-host", 0.6, "Peer plain with Eddie; flirty polite to customers."),
  n("roses_Gonda", "Gonda", "Funeral Parade of Roses", "funeral-parade-roses", 6, "yakuza", "Gang boss", -1.0, "Rough imperative chain downward."),
  n("roses_Sabu", "Sabū", "Funeral Parade of Roses", "funeral-parade-roses", 4, "yakuza", "Lieutenant", 0.2, "Blunt orders; occasional mock-deferential irony."),
  n("roses_FilmDirector", "Underground film director", "Funeral Parade of Roses", "funeral-parade-roses", 5, "artist", "Meta-film voice", 1.1, "Brechtian asides; breaks fourth-wall politeness."),
  n("roses_RiotPolice", "Riot squad captain", "Funeral Parade of Roses", "funeral-parade-roses", 7, "police", "Street clearance", -0.8, "Command register; minimal honorifics to students."),

  // —— House (Hausu) ——
  n("house_Gorgeous", "Gorgeous", "House (Hausu)", "house", 3, "schoolgirl", "Leader / narrator", 1.5, "Teasing plain among friends; polite mask to aunt."),
  n("house_Auntie", "Auntie", "House (Hausu)", "house", 9, "supernatural", "Hungry house / aunt", -3.0, "Grotesque affection; predatory baby-talk."),
  n("house_KungFu", "Kung Fu", "House (Hausu)", "house", 2, "schoolgirl", "Athletic friend", 1.8, "Slapstick bravado; honorific collapse under terror."),
  n("house_Fantasy", "Fantasy", "House (Hausu)", "house", 2, "schoolgirl", "Dreamy friend", 2.0, "Soft polite fragments; dissociative speech."),
  n("house_Prof", "Prof", "House (Hausu)", "house", 2, "schoolgirl", "Glasses / brains", 1.6, "Pseudo-rational explanations; polite to Gorgeous."),
  n("house_Mac", "Mac", "House (Hausu)", "house", 2, "schoolgirl", "Musician friend", 1.7, "Casual slang; polite panic spikes."),

  // —— Ringu ——
  n("ringu_Reiko", "Reiko Asakawa", "Ringu", "ringu", 4, "journalist", "Investigative reporter", 1.2, "Professional polite interviews; maternal plain to Yoichi."),
  n("ringu_Ryuji", "Ryūji Takayama", "Ringu", "ringu", 5, "intellectual", "Ex-husband / scholar", 0.9, "Ironic teineigo masking contempt for occult."),
  n("ringu_Yoichi", "Yoichi Asakawa", "Ringu", "ringu", 1, "child", "Son", 2.5, "Minimal child speech; TV-affected polite fragments."),
  n("ringu_Sadako", "Sadako Yamamura", "Ringu", "ringu", 8, "apparition", "Well ghost", -2.0, "Silence as maximal threat; parasocial mimicry of callers."),
  n("ringu_Okazaki", "Okazaki", "Ringu", "ringu", 3, "colleague", "TV station colleague", 1.4, "Office banter; polite cover for fear."),
  n("ringu_Takashi", "Takashi Asakawa", "Ringu", "ringu", 3, "relative", "Yoichi’s grandfather", 1.1, "Rural elder plain; ritual warnings."),

  // —— Kamome Diner ——
  n("kamome_Sachie", "Sachie", "Kamome Diner", "kamome-diner", 5, "cook", "Diner owner in Helsinki", 0.8, "Warm service Japanese; code-switch politeness with Finns."),
  n("kamome_Midori", "Midori", "Kamome Diner", "kamome-diner", 4, "traveler", "Midlife wanderer", 1.2, "Homesick polite small talk."),
  n("kamome_Masako", "Masako", "Kamome Diner", "kamome-diner", 4, "traveler", "Cinnamon-roll pilgrim", 1.3, "Neighborly teineigo; gratitude spikes."),
  n("kamome_Matsushima", "Matsushima", "Kamome Diner", "kamome-diner", 3, "local", "Finnish regular", 1.9, "Minimal shared-language politeness gestures."),
  n("kamome_RealEstate", "Real estate agent", "Kamome Diner", "kamome-diner", 4, "broker", "Shop lease helper", 1.0, "Contractual polite forms."),
  n("kamome_Postman", "Postman", "Kamome Diner", "kamome-diner", 2, "worker", "Rural route carrier", 1.8, "Terse friendly plain."),

  // —— One Cut of the Dead ——
  n("onecut_Takayuki", "Takayuki Higuchi", "One Cut of the Dead", "one-cut-dead", 4, "director", "Zombie-film director", 0.5, "On-set imperatives; apologetic keigo to funders."),
  n("onecut_Chinatsu", "Chinatsu Kawasumi", "One Cut of the Dead", "one-cut-dead", 3, "actor", "Lead actress", 1.2, "Polite endurance under chaos."),
  n("onecut_Ko", "Ko", "One Cut of the Dead", "one-cut-dead", 3, "actor", "Self-important star", 0.8, "Demands couched in mock-polite requests."),
  n("onecut_Harumi", "Harumi", "One Cut of the Dead", "one-cut-dead", 2, "actor", "Former idol", 1.5, "Fan-service register vs. zombie screams."),
  n("onecut_Mitsu", "Mitsu", "One Cut of the Dead", "one-cut-dead", 3, "producer", "AD / line producer", 1.0, "Panicked polite phone calls."),
  n("onecut_ZombieHorde", "Zombie extras (chorus)", "One Cut of the Dead", "one-cut-dead", 1, "collective", "Living dead mob", 2.8, "Grunts as anti-honorific noise floor."),
];

const extraLinks = [
  // Spirited Away extensions
  L("spirited_NightShiftCaptain", "Lin", 2, "Night handoff polite", 1.5),
  L("Lin", "spirited_NightShiftCaptain", 1, "Peer coordination", 1.5),
  L("spirited_NightShiftCaptain", "Foreman", 2, "Upward floor report", 2),
  L("spirited_SeaRailConductor", "Chihiro", 1, "Silent ticket check", 2),
  L("Chihiro", "spirited_SeaRailConductor", 2, "Child polite bow", 2),
  L("spirited_SeaRailConductor", "Zeniba", 1, "Institutional neutrality", 1.5),
  L("spirited_PaperCharmCourier", "Yubaba", 3, "Courier keigo burst", 2.5),
  L("Yubaba", "spirited_PaperCharmCourier", 0, "Dismissive command", 2.5),
  L("spirited_PaperCharmCourier", "Haku", 2, "Inter-staff polite", 1.8),
  L("spirited_TunnelKappa", "Chihiro", 2, "Toll polite challenge", 2.2),
  L("Chihiro", "spirited_TunnelKappa", 2, "Careful child reply", 2.2),
  L("spirited_TunnelKappa", "BathhouseDoorman", 1, "Boundary peer shorthand", 1.5),
  L("spirited_ReturnDockClerk", "Haku", 2, "Departure paperwork polite", 1.6),
  L("Haku", "spirited_ReturnDockClerk", 1, "Agent instruction", 1.6),
  L("spirited_FeastBusser", "KitchenWorker", 1, "Feast cleanup coordination", 1.5),
  L("KitchenWorker", "spirited_FeastBusser", 1, "Peer plain", 1.5),
  L("spirited_FeastBusser", "NoFace", 3, "Fear-polite upward", 2.8),
  L("spirited_RiverbankKitsune", "Lin", 2, "Guest-service pattern", 2),
  L("Lin", "spirited_RiverbankKitsune", 2, "Standard bath reply", 2),
  L("spirited_BathhouseScribe", "Yubaba", 3, "Contract desk keigo", 2.2),
  L("Yubaba", "spirited_BathhouseScribe", 0, "Dictation tone", 2.2),
  L("spirited_BathhouseScribe", "Aogaeru", 1, "Clerk peer plain", 1.5),

  // Rashomon
  L("rashomon_Tajomaru", "rashomon_Takehiro", 0, "Violence / domination speech", 4),
  L("rashomon_Masako", "rashomon_Tajomaru", 2, "Accusatory honorific collapse", 3.5),
  L("rashomon_Takehiro", "rashomon_Masako", 1, "Shamed husband plain", 2.5),
  L("rashomon_Woodcutter", "rashomon_Priest", 2, "Humble deferential narration", 1.5),
  L("rashomon_Priest", "rashomon_Woodcutter", 2, "Listener encouragement", 1.5),
  L("rashomon_Commoner", "rashomon_Woodcutter", 1, "Skeptical challenge", 2),
  L("rashomon_Woodcutter", "rashomon_Commoner", 2, "Defensive polite", 2),

  // Born but
  L("bornbut_Taro", "bornbut_Jiro", 0, "Brother rough talk", 1),
  L("bornbut_Jiro", "bornbut_Taro", 0, "Brother mimicry", 1),
  L("bornbut_Taro", "bornbut_Father", 2, "Child-to-father polite mask", 2),
  L("bornbut_Father", "bornbut_Taro", 1, "Paternal plain reprimand", 2),
  L("bornbut_Mother", "bornbut_Father", 2, "Spousal indirect polite", 1.5),
  L("bornbut_Teacher", "bornbut_Taro", 2, "School authority teineigo", 1.8),
  L("bornbut_BullyBossSon", "bornbut_Taro", 0, "Status-backed teasing", 2.2),

  // Late Spring
  L("latespring_Noriko", "latespring_Shukichi", 2, "Daughter deferential care", 1.2),
  L("latespring_Shukichi", "latespring_Noriko", 1, "Father warm plain", 1.2),
  L("latespring_AuntMasa", "latespring_Noriko", 3, "Matchmaking indirect keigo", 2),
  L("latespring_ProfessorHattori", "latespring_Shukichi", 2, "Colleague polite negotiation", 1.5),
  L("latespring_MrsTaguchi", "latespring_Noriko", 2, "Neighbor gossip-polite", 1.8),
  L("latespring_MissMiwa", "latespring_Noriko", 1, "Peer confessional", 1.5),

  // Mourning forest
  L("mourning_Machiko", "mourning_Shigeki", 1, "Spousal tenderness plain", 1),
  L("mourning_Shigeki", "mourning_Machiko", 1, "Husband gratitude", 1),
  L("mourning_Nurse", "mourning_Machiko", 2, "Care professional polite", 1.2),
  L("mourning_NeighborFarmer", "mourning_Shigeki", 1, "Neighbor labor offer", 1.7),
  L("mourning_FuneralOfficiant", "mourning_Machiko", 2, "Ritual condolence register", 1.5),
  L("mourning_ForestGuide", "mourning_Machiko", 1, "Practical forest speech", 1.8),

  // Millennium
  L("millennium_Genya", "millennium_Chiyoko", 3, "Fan-interviewer keigo", 1.5),
  L("millennium_Chiyoko", "millennium_Genya", 1, "Guarded star reply", 1.5),
  L("millennium_Eiko", "millennium_Chiyoko", 2, "Rival polite barbs", 1.8),
  L("millennium_Kyoji", "millennium_Chiyoko", 2, "Producer paternal politeness", 1.4),
  L("millennium_Mino", "millennium_Genya", 1, "Crew blunt coordination", 1.5),
  L("millennium_Interviewer", "millennium_Chiyoko", 2, "Broadcast template polite", 1.6),

  // Tampopo
  L("tampopo_Goro", "tampopo_Tampopo", 2, "Protective polite encouragement", 1.5),
  L("tampopo_Tampopo", "tampopo_Chu", 3, "Student reverence", 1.2),
  L("tampopo_Chu", "tampopo_Tampopo", 0, "Master imperative teaching", 1.2),
  L("tampopo_Pisuken", "tampopo_Tampopo", 1, "Rival bluster", 2),
  L("tampopo_Shohei", "tampopo_Chu", 2, "Trainee keigo", 1.6),
  L("tampopo_OilMerchant", "tampopo_Tampopo", 2, "Vendor transactional polite", 1.7),

  // Roses
  L("roses_Eddie", "roses_Leda", 0, "In-group camp plain", 1),
  L("roses_Leda", "roses_Eddie", 0, "In-group camp plain", 1),
  L("roses_Gonda", "roses_Eddie", 0, "Yakuza intimidation", 3),
  L("roses_Sabu", "roses_Gonda", 2, "Lieutenant deference", 1.5),
  L("roses_FilmDirector", "roses_Eddie", 1, "Meta commentary", 2),
  L("roses_RiotPolice", "roses_Eddie", 0, "Street clearance command", 2.5),

  // House
  L("house_Gorgeous", "house_Auntie", 2, "Polite niece mask", 2.5),
  L("house_Auntie", "house_Gorgeous", 1, "Uncanny affectionate baby-talk", 2.5),
  L("house_Gorgeous", "house_KungFu", 0, "Friend banter", 1.2),
  L("house_KungFu", "house_Fantasy", 0, "Panic peer plain", 1.2),
  L("house_Fantasy", "house_Prof", 1, "Soft mutual reassurance", 1.3),
  L("house_Prof", "house_Mac", 0, "Rationalizing chatter", 1.2),

  // Ringu
  L("ringu_Reiko", "ringu_Yoichi", 1, "Mother plain / care", 1),
  L("ringu_Ryuji", "ringu_Reiko", 2, "Ex-spouse ironic polite", 1.5),
  L("ringu_Reiko", "ringu_Ryuji", 2, "Professional distance polite", 1.5),
  L("ringu_Sadako", "ringu_Reiko", 0, "Parasocial threat (non-reply)", 4),
  L("ringu_Reiko", "ringu_Okazaki", 2, "Office colleague polite", 1.4),
  L("ringu_Takashi", "ringu_Yoichi", 1, "Grandfather gentle plain", 1.2),

  // Kamome
  L("kamome_Sachie", "kamome_Midori", 2, "Host-customer warmth", 1.2),
  L("kamome_Midori", "kamome_Masako", 1, "Traveler peer polite", 1.3),
  L("kamome_Masako", "kamome_Sachie", 3, "Gratitude keigo", 1.1),
  L("kamome_Matsushima", "kamome_Sachie", 2, "Cross-language gesture-polite", 1.8),
  L("kamome_RealEstate", "kamome_Sachie", 2, "Lease transactional polite", 1.2),
  L("kamome_Postman", "kamome_Sachie", 1, "Neighborly plain", 1.6),

  // One cut
  L("onecut_Takayuki", "onecut_Chinatsu", 0, "On-set bark / praise", 1.5),
  L("onecut_Chinatsu", "onecut_Takayuki", 2, "Actor polite pushback", 1.5),
  L("onecut_Ko", "onecut_Takayuki", 1, "Star demands", 1.4),
  L("onecut_Harumi", "onecut_Chinatsu", 1, "Co-star peer talk", 1.5),
  L("onecut_Mitsu", "onecut_Takayuki", 2, "Producer panic polite", 1.2),
  L("onecut_ZombieHorde", "onecut_Takayuki", 0, "Chorus groan (anti-speech)", 2.5),
];

const data = JSON.parse(fs.readFileSync(target, "utf8"));
const ids = new Set(data.nodes.map((x) => x.id));
for (const node of extraNodes) {
  if (ids.has(node.id)) throw new Error(`duplicate id ${node.id}`);
  ids.add(node.id);
}
data.nodes = data.nodes.concat(extraNodes);
data.links = data.links.concat(extraLinks);
fs.writeFileSync(target, `${JSON.stringify(data, null, 2)}\n`);

console.log(
  `Wrote ${extraNodes.length} nodes and ${extraLinks.length} links → ${path.relative(root, target)}`,
);
