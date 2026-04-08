export interface WordSummary {
  id: number;
  word: string;
  meaning: string;
  level: string;
  mastery: number;
  isFavorite: boolean;
}

export interface WordDetailData extends WordSummary {
  pronunciation: string;
  examples: Array<{
    en: string;
    ko: string;
  }>;
  synonyms: string[];
  related: string[];
}

export const words: WordDetailData[] = [
  {
    id: 1,
    word: "Serendipity",
    pronunciation: "/ˌserənˈdɪpəti/",
    meaning: "뜻밖의 행운, 우연한 발견",
    level: "고급",
    mastery: 78,
    isFavorite: true,
    examples: [
      { en: "Finding that book was pure serendipity.", ko: "그 책을 찾은 건 정말 뜻밖의 행운이었다." },
      { en: "By serendipity, I met my old friend at the airport.", ko: "우연히 공항에서 옛 친구를 만났다." },
      { en: "The discovery was a result of serendipity.", ko: "그 발견은 뜻밖의 행운의 결과였다." },
    ],
    synonyms: ["fortune", "luck", "chance"],
    related: ["Fortune", "Destiny", "Coincidence"],
  },
  {
    id: 2,
    word: "Abundant",
    pronunciation: "/əˈbʌndənt/",
    meaning: "풍부한, 많은",
    level: "중급",
    mastery: 85,
    isFavorite: true,
    examples: [
      { en: "The region has abundant natural resources.", ko: "그 지역은 천연자원이 풍부하다." },
      { en: "Fresh fruit is abundant in summer.", ko: "여름에는 신선한 과일이 많다." },
    ],
    synonyms: ["plentiful", "ample", "copious"],
    related: ["Plentiful", "Rich", "Ample"],
  },
  {
    id: 3,
    word: "Benevolent",
    pronunciation: "/bəˈnevələnt/",
    meaning: "자비로운, 선의의",
    level: "고급",
    mastery: 72,
    isFavorite: false,
    examples: [
      { en: "She was known as a benevolent leader.", ko: "그녀는 자비로운 리더로 알려져 있었다." },
      { en: "The donor remained benevolent throughout the campaign.", ko: "기부자는 캠페인 내내 선의를 보여 주었다." },
    ],
    synonyms: ["kind", "charitable", "compassionate"],
    related: ["Kind", "Generous", "Compassionate"],
  },
  {
    id: 4,
    word: "Compassion",
    pronunciation: "/kəmˈpæʃən/",
    meaning: "연민, 동정심",
    level: "중급",
    mastery: 90,
    isFavorite: true,
    examples: [
      { en: "Nurses should show compassion to patients.", ko: "간호사는 환자에게 연민을 보여야 한다." },
      { en: "His compassion moved everyone in the room.", ko: "그의 동정심은 방 안의 모두를 감동시켰다." },
    ],
    synonyms: ["sympathy", "empathy", "mercy"],
    related: ["Empathy", "Sympathy", "Mercy"],
  },
  {
    id: 5,
    word: "Diligent",
    pronunciation: "/ˈdɪlədʒənt/",
    meaning: "부지런한, 성실한",
    level: "초급",
    mastery: 95,
    isFavorite: false,
    examples: [
      { en: "She is a diligent student.", ko: "그녀는 성실한 학생이다." },
      { en: "Diligent practice improved his skills.", ko: "꾸준한 연습이 그의 실력을 향상시켰다." },
    ],
    synonyms: ["hardworking", "careful", "industrious"],
    related: ["Hardworking", "Steady", "Persistent"],
  },
  {
    id: 6,
    word: "Eloquent",
    pronunciation: "/ˈeləkwənt/",
    meaning: "표현력이 뛰어난, 웅변의",
    level: "고급",
    mastery: 68,
    isFavorite: true,
    examples: [
      { en: "Her speech was clear and eloquent.", ko: "그녀의 연설은 분명하고 설득력 있었다." },
      { en: "He gave an eloquent explanation.", ko: "그는 표현력 있게 설명했다." },
    ],
    synonyms: ["articulate", "expressive", "persuasive"],
    related: ["Articulate", "Fluent", "Persuasive"],
  },
  {
    id: 7,
    word: "Frugal",
    pronunciation: "/ˈfruːɡəl/",
    meaning: "검소한, 절약하는",
    level: "중급",
    mastery: 80,
    isFavorite: false,
    examples: [
      { en: "They live a frugal lifestyle.", ko: "그들은 검소한 생활을 한다." },
      { en: "Being frugal helped him save money.", ko: "절약하는 습관이 그가 돈을 모으는 데 도움이 됐다." },
    ],
    synonyms: ["thrifty", "economical", "sparing"],
    related: ["Thrifty", "Economical", "Careful"],
  },
  {
    id: 8,
    word: "Gregarious",
    pronunciation: "/ɡrɪˈɡeriəs/",
    meaning: "사교적인",
    level: "고급",
    mastery: 55,
    isFavorite: false,
    examples: [
      { en: "He is naturally gregarious.", ko: "그는 원래 사교적이다." },
      { en: "Gregarious people enjoy group activities.", ko: "사교적인 사람들은 단체 활동을 즐긴다." },
    ],
    synonyms: ["sociable", "outgoing", "friendly"],
    related: ["Sociable", "Outgoing", "Friendly"],
  },
  {
    id: 9,
    word: "Harmonious",
    pronunciation: "/hɑːrˈmoʊniəs/",
    meaning: "조화로운",
    level: "초급",
    mastery: 92,
    isFavorite: true,
    examples: [
      { en: "They built a harmonious relationship.", ko: "그들은 조화로운 관계를 만들었다." },
      { en: "The colors create a harmonious mood.", ko: "그 색감은 조화로운 분위기를 만든다." },
    ],
    synonyms: ["balanced", "peaceful", "coordinated"],
    related: ["Balanced", "Peaceful", "Coherent"],
  },
  {
    id: 10,
    word: "Simple",
    pronunciation: "/ˈsɪmpəl/",
    meaning: "간단한, 쉬운",
    level: "초급",
    mastery: 100,
    isFavorite: false,
    examples: [
      { en: "The instructions are simple.", ko: "설명은 간단하다." },
      { en: "We need a simple solution.", ko: "우리는 간단한 해결책이 필요하다." },
    ],
    synonyms: ["easy", "plain", "basic"],
    related: ["Easy", "Basic", "Clear"],
  },
  {
    id: 11,
    word: "Happy",
    pronunciation: "/ˈhæpi/",
    meaning: "행복한, 기쁜",
    level: "초급",
    mastery: 98,
    isFavorite: true,
    examples: [
      { en: "She felt happy after the test.", ko: "그녀는 시험 후 행복했다." },
      { en: "Happy memories stayed with him.", ko: "행복한 기억이 그와 함께 남았다." },
    ],
    synonyms: ["glad", "joyful", "pleased"],
    related: ["Joyful", "Glad", "Content"],
  },
  {
    id: 12,
    word: "Leverage",
    pronunciation: "/ˈlevərɪdʒ/",
    meaning: "활용하다",
    level: "비즈니스",
    mastery: 65,
    isFavorite: false,
    examples: [
      { en: "We should leverage our data.", ko: "우리는 데이터를 적극 활용해야 한다." },
      { en: "The company leveraged its brand power.", ko: "그 회사는 브랜드 파워를 활용했다." },
    ],
    synonyms: ["utilize", "use", "capitalize on"],
    related: ["Utilize", "Apply", "Exploit"],
  },
  {
    id: 13,
    word: "Synergy",
    pronunciation: "/ˈsɪnərdʒi/",
    meaning: "시너지, 상승 효과",
    level: "비즈니스",
    mastery: 70,
    isFavorite: true,
    examples: [
      { en: "The merger created strong synergy.", ko: "합병은 강한 시너지를 만들었다." },
      { en: "Team synergy improved the results.", ko: "팀 시너지가 결과를 개선했다." },
    ],
    synonyms: ["cooperation", "combined effect", "teamwork"],
    related: ["Cooperation", "Collaboration", "Teamwork"],
  },
  {
    id: 14,
    word: "Stakeholder",
    pronunciation: "/ˈsteɪkˌhoʊldər/",
    meaning: "이해관계자",
    level: "비즈니스",
    mastery: 82,
    isFavorite: false,
    examples: [
      { en: "All stakeholders joined the meeting.", ko: "모든 이해관계자가 회의에 참석했다." },
      { en: "The plan must satisfy key stakeholders.", ko: "그 계획은 핵심 이해관계자를 만족시켜야 한다." },
    ],
    synonyms: ["interested party", "participant", "shareholder"],
    related: ["Shareholder", "Client", "Partner"],
  },
  {
    id: 15,
    word: "Quarterly",
    pronunciation: "/ˈkwɔːrtərli/",
    meaning: "분기별",
    level: "비즈니스",
    mastery: 88,
    isFavorite: true,
    examples: [
      { en: "We publish quarterly reports.", ko: "우리는 분기별 보고서를 발행한다." },
      { en: "Quarterly goals were achieved.", ko: "분기 목표를 달성했다." },
    ],
    synonyms: ["periodic", "seasonal", "recurring"],
    related: ["Monthly", "Annual", "Periodic"],
  },
  {
    id: 16,
    word: "Revenue",
    pronunciation: "/ˈrevənuː/",
    meaning: "수익, 매출",
    level: "비즈니스",
    mastery: 75,
    isFavorite: false,
    examples: [
      { en: "The company increased its revenue.", ko: "회사는 매출을 늘렸다." },
      { en: "Revenue grew by 10 percent.", ko: "수익이 10퍼센트 증가했다." },
    ],
    synonyms: ["income", "sales", "earnings"],
    related: ["Income", "Profit", "Sales"],
  },
];

export const recentWordIds = [1, 2, 6];

export function getWordById(id: number) {
  return words.find((word) => word.id === id);
}
