import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const outputPath = resolve("/mnt/c/hsmocap/hsmocap-app/src/app/data/seedWords.json");

const bannedWords = new Set([
  "a",
  "an",
  "the",
  "be",
  "am",
  "is",
  "are",
  "was",
  "were",
  "been",
  "being",
  "you",
  "i",
  "we",
  "he",
  "she",
  "it",
  "they",
  "me",
  "us",
  "him",
  "her",
  "them",
]);

const bannedParticles = new Set([
  "up",
  "down",
  "in",
  "out",
  "on",
  "off",
  "over",
  "back",
  "away",
  "for",
  "to",
  "by",
]);

const entry = (word, meaning, exampleSentence, exampleTranslation, quizKoreanBlank, quizAnswers) => ({
  word,
  meaning,
  exampleSentence,
  exampleTranslation,
  quizKoreanBlank,
  quizAnswers,
});

const beginner = [
  entry("arrive", "도착하다", "Please arrive at the station by nine.", "아홉 시까지 역에 도착해.", "도착해", ["도착해", "도착하세요"]),
  entry("ask", "묻다, 부탁하다", "Ask the teacher after class.", "수업 후에 선생님께 물어봐.", "물어봐", ["물어봐", "질문해"]),
  entry("bake", "굽다", "My father baked bread this morning.", "우리 아버지는 오늘 아침 빵을 구우셨다.", "구우셨다", ["구우셨다", "구웠다"]),
  entry("borrow", "빌리다", "I borrowed a pen from Mina.", "나는 미나에게서 펜을 빌렸다.", "빌렸다", ["빌렸다", "빌려 왔다"]),
  entry("bring", "가져오다", "Please bring your notebook tomorrow.", "내일 공책을 가져와.", "가져와", ["가져와", "가져오세요"]),
  entry("build", "짓다, 만들다", "They plan to build a small bridge here.", "그들은 여기 작은 다리를 지을 계획이다.", "지을", ["지을", "만들"]),
  entry("buy", "사다", "I need to buy a new charger.", "나는 새 충전기를 사야 한다.", "사야 한다", ["사야 한다", "사야 해"]),
  entry("call", "전화하다, 부르다", "Call me when you get home.", "집에 도착하면 나에게 전화해.", "전화해", ["전화해", "연락해"]),
  entry("carry", "나르다", "He carried the box upstairs.", "그는 상자를 위층으로 날랐다.", "날랐다", ["날랐다", "옮겼다"]),
  entry("catch", "잡다", "She caught the last bus.", "그녀는 막차를 탔다.", "탔다", ["탔다", "잡았다"]),
  entry("change", "바꾸다", "I changed my password yesterday.", "나는 어제 비밀번호를 바꿨다.", "바꿨다", ["바꿨다", "변경했다"]),
  entry("check", "확인하다", "Check the time before you leave.", "나가기 전에 시간을 확인해.", "확인해", ["확인해", "체크해"]),
  entry("choose", "고르다", "Choose one color for the poster.", "포스터에 쓸 색 하나를 골라.", "골라", ["골라", "선택해"]),
  entry("clean", "청소하다", "We cleaned the kitchen together.", "우리는 함께 부엌을 청소했다.", "청소했다", ["청소했다", "치웠다"]),
  entry("climb", "오르다", "The children climbed the hill slowly.", "아이들은 천천히 언덕을 올랐다.", "올랐다", ["올랐다", "올라갔다"]),
  entry("close", "닫다", "Please close the window before bed.", "자기 전에 창문을 닫아.", "닫아", ["닫아", "닫으세요"]),
  entry("collect", "모으다", "She collects postcards from many cities.", "그녀는 여러 도시의 엽서를 모은다.", "모은다", ["모은다", "수집한다"]),
  entry("cook", "요리하다", "My brother cooks dinner on Sundays.", "내 동생은 일요일마다 저녁을 요리한다.", "요리한다", ["요리한다", "만든다"]),
  entry("copy", "복사하다, 따라 쓰다", "Copy the sentence into your notebook.", "그 문장을 공책에 따라 써.", "따라 써", ["따라 써", "복사해"]),
  entry("count", "세다", "Count the tickets once more.", "표를 한 번 더 세어 봐.", "세어 봐", ["세어 봐", "세어봐"]),
  entry("cut", "자르다", "I cut the paper into two pieces.", "나는 종이를 두 조각으로 잘랐다.", "잘랐다", ["잘랐다", "오렸다"]),
  entry("dance", "춤추다", "They danced all night at the party.", "그들은 파티에서 밤새 춤췄다.", "춤췄다", ["춤췄다", "춤을 췄다"]),
  entry("decide", "결정하다", "We decided to leave early.", "우리는 일찍 떠나기로 결정했다.", "결정했다", ["결정했다", "정했다"]),
  entry("deliver", "배달하다, 전달하다", "The driver delivered the package on time.", "기사는 제시간에 소포를 배달했다.", "배달했다", ["배달했다", "전달했다"]),
  entry("draw", "그리다", "She drew a cat on the board.", "그녀는 칠판에 고양이를 그렸다.", "그렸다", ["그렸다"]),
  entry("drive", "운전하다", "My uncle drives to work every day.", "우리 삼촌은 매일 차를 몰고 출근한다.", "몰고 출근한다", ["몰고 출근한다", "운전해서 출근한다"]),
  entry("drop", "떨어뜨리다", "I dropped my keys near the gate.", "나는 문 근처에서 열쇠를 떨어뜨렸다.", "떨어뜨렸다", ["떨어뜨렸다"]),
  entry("enter", "들어가다", "Do not enter this room now.", "지금은 이 방에 들어가지 마.", "들어가지 마", ["들어가지 마", "들어가지 마라"]),
  entry("explain", "설명하다", "Can you explain this rule again?", "이 규칙을 다시 설명해 줄 수 있니?", "설명해 줄 수 있니", ["설명해 줄 수 있니", "설명해줄 수 있니"]),
  entry("finish", "끝내다", "I finished my homework before dinner.", "나는 저녁 전에 숙제를 끝냈다.", "끝냈다", ["끝냈다", "마쳤다"]),
  entry("fix", "고치다", "He fixed the broken chair.", "그는 부서진 의자를 고쳤다.", "고쳤다", ["고쳤다", "수리했다"]),
  entry("follow", "따라가다, 따르다", "Follow me to the library.", "도서관까지 나를 따라와.", "따라와", ["따라와", "따라오세요"]),
  entry("happen", "일어나다", "What happened after the meeting?", "회의 후에 무슨 일이 일어났니?", "일어났니", ["일어났니", "생겼니"]),
  entry("help", "돕다", "Thank you for helping me move.", "이사하는 걸 도와줘서 고마워.", "도와줘서", ["도와줘서", "도와 주어서"]),
  entry("invite", "초대하다", "She invited us to her house.", "그녀는 우리를 자기 집에 초대했다.", "초대했다", ["초대했다"]),
  entry("join", "참여하다", "I joined the school band last year.", "나는 작년에 학교 밴드에 들어갔다.", "들어갔다", ["들어갔다", "참여했다"]),
  entry("jump", "뛰어오르다", "The dog jumped over the puddle.", "그 개는 물웅덩이를 뛰어넘었다.", "뛰어넘었다", ["뛰어넘었다", "점프했다"]),
  entry("keep", "유지하다, 보관하다", "Keep this ticket in your bag.", "이 표를 가방 안에 잘 보관해.", "보관해", ["보관해", "간직해"]),
  entry("knock", "두드리다", "Knock on the door before entering.", "들어가기 전에 문을 두드려.", "두드려", ["두드려"]),
  entry("laugh", "웃다", "Everyone laughed at his joke.", "모두가 그의 농담에 웃었다.", "웃었다", ["웃었다"]),
  entry("learn", "배우다", "I want to learn basic French.", "나는 기본 프랑스어를 배우고 싶다.", "배우고 싶다", ["배우고 싶다", "익히고 싶다"]),
  entry("lend", "빌려주다", "Can you lend me your umbrella?", "우산 좀 빌려줄 수 있니?", "빌려줄 수 있니", ["빌려줄 수 있니", "빌려 주겠니"]),
  entry("leave", "떠나다, 남기다", "The train leaves in ten minutes.", "기차는 십 분 뒤에 출발한다.", "출발한다", ["출발한다", "떠난다"]),
  entry("listen", "듣다", "Please listen to the announcement.", "안내 방송을 잘 들어 주세요.", "들어 주세요", ["들어 주세요", "들어줘"]),
  entry("lose", "잃어버리다", "Do not lose your receipt.", "영수증을 잃어버리지 마.", "잃어버리지 마", ["잃어버리지 마", "잃지 마"]),
  entry("make", "만들다", "We made lunch together.", "우리는 함께 점심을 만들었다.", "만들었다", ["만들었다"]),
  entry("meet", "만나다", "Let's meet in front of the cafe.", "카페 앞에서 만나자.", "만나자", ["만나자", "보자"]),
  entry("move", "움직이다, 이사하다", "They moved to a new apartment.", "그들은 새 아파트로 이사했다.", "이사했다", ["이사했다", "옮겼다"]),
  entry("open", "열다", "Open the box carefully.", "상자를 조심히 열어.", "열어", ["열어", "열어라"]),
  entry("pack", "짐을 싸다", "I packed my bag last night.", "나는 어젯밤 가방에 짐을 쌌다.", "짐을 쌌다", ["짐을 쌌다", "챙겼다"]),
  entry("paint", "칠하다, 그리다", "They painted the wall white.", "그들은 벽을 하얗게 칠했다.", "칠했다", ["칠했다", "페인트칠했다"]),
  entry("pass", "지나가다, 건네주다", "Please pass the salt to me.", "소금을 나에게 건네줘.", "건네줘", ["건네줘", "건네 주세요"]),
  entry("pay", "지불하다", "I paid for the ticket online.", "나는 그 표를 온라인으로 결제했다.", "결제했다", ["결제했다", "지불했다"]),
  entry("pick up", "집다, 데리러 가다", "I will pick up the parcel after lunch.", "나는 점심 후에 소포를 찾아올 것이다.", "찾아올 것이다", ["찾아올 것이다", "가지러 갈 것이다"]),
  entry("plan", "계획하다", "We are planning a short trip.", "우리는 짧은 여행을 계획하고 있다.", "계획하고 있다", ["계획하고 있다", "준비하고 있다"]),
  entry("practice", "연습하다", "She practices the piano every evening.", "그녀는 매일 저녁 피아노를 연습한다.", "연습한다", ["연습한다"]),
  entry("prepare", "준비하다", "Please prepare your passport first.", "먼저 여권을 준비해.", "준비해", ["준비해", "챙겨"]),
  entry("press", "누르다", "Press this button to start.", "시작하려면 이 버튼을 눌러.", "눌러", ["눌러"]),
  entry("pull", "당기다", "Pull the handle toward you.", "손잡이를 네 쪽으로 당겨.", "당겨", ["당겨"]),
  entry("push", "밀다", "Push the cart slowly.", "카트를 천천히 밀어.", "밀어", ["밀어"]),
  entry("reach", "도착하다, 닿다", "We reached the top before noon.", "우리는 정오 전에 정상에 도착했다.", "도착했다", ["도착했다", "올라갔다"]),
  entry("remember", "기억하다", "Remember my address this time.", "이번에는 내 주소를 기억해.", "기억해", ["기억해"]),
  entry("repeat", "반복하다", "Could you repeat that word?", "그 단어를 다시 말해 줄래?", "다시 말해 줄래", ["다시 말해 줄래", "반복해 줄래"]),
  entry("rest", "쉬다", "You should rest after lunch.", "점심 후에는 쉬어야 한다.", "쉬어야 한다", ["쉬어야 한다", "쉬어야 해"]),
  entry("return", "돌아오다, 반납하다", "Please return the book by Friday.", "금요일까지 책을 반납해.", "반납해", ["반납해", "돌려줘"]),
  entry("ride", "타다", "We rode the subway together.", "우리는 함께 지하철을 탔다.", "탔다", ["탔다"]),
  entry("save", "저장하다, 아끼다", "Save the file before closing it.", "파일을 닫기 전에 저장해.", "저장해", ["저장해"]),
  entry("send", "보내다", "I sent the photo to my friend.", "나는 친구에게 사진을 보냈다.", "보냈다", ["보냈다"]),
  entry("share", "공유하다", "Please share your notes with me.", "필기를 나와 공유해 줘.", "공유해 줘", ["공유해 줘", "보여 줘"]),
  entry("shout", "외치다", "Do not shout in the hallway.", "복도에서 소리치지 마.", "소리치지 마", ["소리치지 마", "외치지 마"]),
  entry("smile", "미소 짓다", "She smiled at the child.", "그녀는 아이에게 미소 지었다.", "미소 지었다", ["미소 지었다", "웃어 주었다"]),
  entry("start", "시작하다", "The movie starts at seven.", "영화는 일곱 시에 시작한다.", "시작한다", ["시작한다"]),
  entry("stay", "머무르다", "We stayed at a small hotel.", "우리는 작은 호텔에 묵었다.", "묵었다", ["묵었다", "머물렀다"]),
  entry("stop", "멈추다", "The bus stopped in front of the bank.", "버스가 은행 앞에 멈췄다.", "멈췄다", ["멈췄다", "섰다"]),
  entry("study", "공부하다", "I studied English for two hours.", "나는 두 시간 동안 영어를 공부했다.", "공부했다", ["공부했다"]),
  entry("talk", "말하다", "Let's talk after dinner.", "저녁을 먹고 이야기하자.", "이야기하자", ["이야기하자", "말하자"]),
  entry("travel", "여행하다", "My parents travel every spring.", "우리 부모님은 매년 봄에 여행하신다.", "여행하신다", ["여행하신다", "여행 간다"]),
  entry("try", "시도하다", "Try this soup before it gets cold.", "식기 전에 이 수프를 먹어 봐.", "먹어 봐", ["먹어 봐", "시도해 봐"]),
  entry("turn on", "켜다", "Turn on the lamp, please.", "전등을 켜 줘.", "켜 줘", ["켜 줘", "켜줘"]),
  entry("turn off", "끄다", "Turn off the fan before leaving.", "나가기 전에 선풍기를 꺼.", "꺼", ["꺼", "꺼라"]),
  entry("use", "사용하다", "You can use my umbrella.", "내 우산을 사용해도 된다.", "사용해도 된다", ["사용해도 된다", "써도 된다"]),
  entry("visit", "방문하다", "We visited our grandparents last weekend.", "우리는 지난 주말에 조부모님을 찾아뵈었다.", "찾아뵈었다", ["찾아뵈었다", "방문했다"]),
  entry("wait", "기다리다", "Please wait outside for a moment.", "잠깐 밖에서 기다려.", "기다려", ["기다려"]),
  entry("walk", "걷다", "I walked home in the rain.", "나는 비를 맞으며 집까지 걸었다.", "걸었다", ["걸었다"]),
  entry("wash", "씻다, 세탁하다", "Wash your hands before dinner.", "저녁 먹기 전에 손을 씻어.", "씻어", ["씻어"]),
  entry("wear", "입다, 착용하다", "She wore a blue jacket today.", "그녀는 오늘 파란 재킷을 입었다.", "입었다", ["입었다", "걸쳤다"]),
  entry("win", "이기다", "Our team won the final game.", "우리 팀이 결승전에서 이겼다.", "이겼다", ["이겼다", "승리했다"]),
  entry("write", "쓰다", "Write your name on the form.", "서식에 이름을 써.", "써", ["써", "적어"]),
  entry("wake up", "잠에서 깨다", "I wake up at six on weekdays.", "나는 평일마다 여섯 시에 일어난다.", "일어난다", ["일어난다", "잠에서 깬다"]),
  entry("stand up", "일어서다", "Please stand up when your name is called.", "이름이 불리면 일어서세요.", "일어서세요", ["일어서세요", "일어나세요"]),
  entry("sit down", "앉다", "Sit down and relax for a minute.", "앉아서 잠깐 쉬어.", "앉아서", ["앉아서", "앉아"]),
  entry("come in", "들어오다", "Come in and take a seat.", "들어와서 자리에 앉아.", "들어와서", ["들어와서", "들어와"]),
  entry("go out", "외출하다, 나가다", "We went out for dinner yesterday.", "우리는 어제 저녁을 먹으러 나갔다.", "나갔다", ["나갔다", "외출했다"]),
  entry("look for", "찾다", "I am looking for my glasses.", "나는 안경을 찾고 있다.", "찾고 있다", ["찾고 있다", "찾는 중이다"]),
  entry("take out", "꺼내다", "Take out the notebook from your bag.", "가방에서 공책을 꺼내.", "꺼내", ["꺼내"]),
  entry("come back", "돌아오다", "Please come back before dark.", "어두워지기 전에 돌아와.", "돌아와", ["돌아와"]),
  entry("grow up", "자라다", "He grew up in a small town.", "그는 작은 마을에서 자랐다.", "자랐다", ["자랐다"]),
  entry("farmer", "농부", "The farmer works from early morning.", "그 농부는 이른 아침부터 일한다.", "농부는", ["농부는", "농부가"]),
  entry("fence", "울타리", "The dog jumped over the fence.", "그 개는 울타리를 뛰어넘었다.", "울타리를", ["울타리를"]),
  entry("gloves", "장갑", "Wear gloves in this cold weather.", "이 추운 날씨에는 장갑을 껴.", "장갑을", ["장갑을"]),
];

const intermediate = [
  entry("afford", "여유가 있다", "I cannot afford a new laptop now.", "나는 지금 새 노트북을 살 여유가 없다.", "살 여유가 없다", ["살 여유가 없다", "감당할 수 없다"]),
  entry("announce", "발표하다", "They will announce the winners tomorrow.", "그들은 내일 우승자를 발표할 것이다.", "발표할 것이다", ["발표할 것이다", "알릴 것이다"]),
  entry("apologize", "사과하다", "You should apologize for being late.", "늦은 것에 대해 사과해야 한다.", "사과해야 한다", ["사과해야 한다"]),
  entry("apply", "지원하다, 적용하다", "She plans to apply for the internship.", "그녀는 그 인턴십에 지원할 계획이다.", "지원할", ["지원할", "신청할"]),
  entry("arrange", "정리하다, 준비하다", "We arranged the chairs in a circle.", "우리는 의자들을 원 모양으로 배치했다.", "배치했다", ["배치했다", "정리했다"]),
  entry("attach", "붙이다, 첨부하다", "Please attach the file to the email.", "이메일에 파일을 첨부해 주세요.", "첨부해 주세요", ["첨부해 주세요", "붙여 주세요"]),
  entry("avoid", "피하다", "Try to avoid heavy traffic this evening.", "오늘 저녁에는 심한 교통 체증을 피하려고 해.", "피하려고 해", ["피하려고 해", "피해 봐"]),
  entry("balance", "균형을 잡다", "It is hard to balance work and study.", "일과 공부의 균형을 잡기는 어렵다.", "균형을 잡기는", ["균형을 잡기는", "조절하기는"]),
  entry("behave", "행동하다", "The children behaved well at the museum.", "아이들은 박물관에서 얌전히 행동했다.", "행동했다", ["행동했다", "굴었다"]),
  entry("belong", "속하다", "This seat belongs to my friend.", "이 자리는 내 친구의 것이다.", "친구의 것이다", ["친구의 것이다", "친구에게 속한다"]),
  entry("compare", "비교하다", "Compare the two photos carefully.", "두 사진을 자세히 비교해 봐.", "비교해 봐", ["비교해 봐", "비교해봐"]),
  entry("complain", "불평하다", "He complained about the noise all night.", "그는 밤새 소음에 대해 불평했다.", "불평했다", ["불평했다"]),
  entry("confirm", "확인하다", "Please confirm your reservation today.", "오늘 예약을 확인해 주세요.", "확인해 주세요", ["확인해 주세요", "확정해 주세요"]),
  entry("connect", "연결하다", "Connect the printer to the computer.", "프린터를 컴퓨터에 연결해.", "연결해", ["연결해"]),
  entry("consider", "고려하다", "We are considering another option.", "우리는 다른 선택지를 고려하고 있다.", "고려하고 있다", ["고려하고 있다"]),
  entry("contact", "연락하다", "Contact me if the plan changes.", "계획이 바뀌면 나에게 연락해.", "연락해", ["연락해"]),
  entry("continue", "계속하다", "Please continue reading page ten.", "십 쪽 읽기를 계속해 주세요.", "계속해 주세요", ["계속해 주세요", "이어가 주세요"]),
  entry("contribute", "기여하다", "Everyone contributed a good idea.", "모두가 좋은 아이디어를 하나씩 보탰다.", "보탰다", ["보탰다", "기여했다"]),
  entry("convince", "설득하다", "I finally convinced him to join us.", "나는 마침내 그를 우리와 함께하자고 설득했다.", "설득했다", ["설득했다"]),
  entry("depend on", "의지하다, 달려 있다", "The schedule depends on the weather.", "일정은 날씨에 달려 있다.", "달려 있다", ["달려 있다", "좌우된다"]),
  entry("describe", "묘사하다", "Describe the painting in one sentence.", "그 그림을 한 문장으로 묘사해 봐.", "묘사해 봐", ["묘사해 봐", "설명해 봐"]),
  entry("develop", "발전시키다, 개발하다", "She wants to develop a new app.", "그녀는 새 앱을 개발하고 싶어 한다.", "개발하고 싶어 한다", ["개발하고 싶어 한다", "만들고 싶어 한다"]),
  entry("discover", "발견하다", "We discovered a quiet cafe nearby.", "우리는 근처에서 조용한 카페를 발견했다.", "발견했다", ["발견했다", "찾아냈다"]),
  entry("encourage", "격려하다", "My coach encouraged me to keep going.", "코치는 내가 계속 가도록 격려했다.", "격려했다", ["격려했다", "응원했다"]),
  entry("exchange", "교환하다", "Can I exchange this shirt for a larger one?", "이 셔츠를 더 큰 것으로 교환할 수 있을까요?", "교환할 수 있을까요", ["교환할 수 있을까요", "바꿀 수 있을까요"]),
  entry("experience", "경험하다", "I experienced a long delay at the airport.", "나는 공항에서 긴 지연을 겪었다.", "겪었다", ["겪었다", "경험했다"]),
  entry("focus on", "집중하다", "Please focus on the main question.", "핵심 질문에 집중해 주세요.", "집중해 주세요", ["집중해 주세요", "집중해"]),
  entry("figure out", "알아내다", "We need to figure out the cause.", "우리는 원인을 알아내야 한다.", "알아내야 한다", ["알아내야 한다", "파악해야 한다"]),
  entry("fill out", "작성하다", "Fill out this form in black ink.", "이 서류를 검은 펜으로 작성해.", "작성해", ["작성해", "기입해"]),
  entry("get along", "잘 지내다", "Do you get along with your coworkers?", "너는 동료들과 잘 지내니?", "잘 지내니", ["잘 지내니", "사이가 좋니"]),
  entry("get back", "돌아오다", "I will get back before noon.", "나는 정오 전에 돌아올 것이다.", "돌아올 것이다", ["돌아올 것이다", "복귀할 것이다"]),
  entry("give away", "나눠 주다", "They gave away free samples outside.", "그들은 밖에서 무료 샘플을 나눠 주었다.", "나눠 주었다", ["나눠 주었다", "배포했다"]),
  entry("go over", "검토하다", "Let's go over the report once more.", "보고서를 한 번 더 검토하자.", "검토하자", ["검토하자", "훑어보자"]),
  entry("hand in", "제출하다", "Please hand in your essay by Monday.", "월요일까지 에세이를 제출해 주세요.", "제출해 주세요", ["제출해 주세요", "내 주세요"]),
  entry("hang out", "어울려 놀다", "We hung out at the river park.", "우리는 강변 공원에서 함께 시간을 보냈다.", "함께 시간을 보냈다", ["함께 시간을 보냈다", "어울려 놀았다"]),
  entry("keep on", "계속하다", "Keep on practicing every day.", "매일 계속 연습해.", "계속 연습해", ["계속 연습해", "계속해"]),
  entry("look after", "돌보다", "She looks after her younger brother.", "그녀는 남동생을 돌본다.", "돌본다", ["돌본다", "보살핀다"]),
  entry("look around", "둘러보다", "We looked around the bookstore for an hour.", "우리는 한 시간 동안 서점을 둘러보았다.", "둘러보았다", ["둘러보았다", "구경했다"]),
  entry("look forward to", "기대하다", "I look forward to the holiday.", "나는 그 휴가를 기대하고 있다.", "기대하고 있다", ["기대하고 있다"]),
  entry("make up", "지어내다, 화해하다", "He made up an excuse again.", "그는 또 변명을 지어냈다.", "지어냈다", ["지어냈다", "만들어 냈다"]),
  entry("notice", "알아차리다", "Did you notice the new sign?", "새 표지판을 알아차렸니?", "알아차렸니", ["알아차렸니", "봤니"]),
  entry("offer", "제안하다, 제공하다", "They offered us warm tea.", "그들은 우리에게 따뜻한 차를 권했다.", "권했다", ["권했다", "제공했다"]),
  entry("organize", "정리하다, 조직하다", "I need to organize my files tonight.", "나는 오늘 밤 파일을 정리해야 한다.", "정리해야 한다", ["정리해야 한다"]),
  entry("participate", "참여하다", "Many students participated in the event.", "많은 학생들이 그 행사에 참여했다.", "참여했다", ["참여했다"]),
  entry("perform", "수행하다, 공연하다", "The band performed three songs.", "그 밴드는 세 곡을 공연했다.", "공연했다", ["공연했다", "연주했다"]),
  entry("point out", "지적하다", "She pointed out a small mistake.", "그녀는 작은 실수를 지적했다.", "지적했다", ["지적했다"]),
  entry("prefer", "선호하다", "I prefer tea to coffee in the evening.", "나는 저녁에는 커피보다 차를 더 선호한다.", "더 선호한다", ["더 선호한다", "좋아한다"]),
  entry("prepare for", "대비하다", "We are preparing for the final exam.", "우리는 기말고사에 대비하고 있다.", "대비하고 있다", ["대비하고 있다", "준비하고 있다"]),
  entry("prevent", "막다, 예방하다", "This medicine helps prevent a cold.", "이 약은 감기를 예방하는 데 도움이 된다.", "예방하는 데", ["예방하는 데", "막는 데"]),
  entry("promise", "약속하다", "I promised to call my mother.", "나는 어머니께 전화하겠다고 약속했다.", "약속했다", ["약속했다"]),
  entry("protect", "보호하다", "These gloves protect your hands.", "이 장갑은 손을 보호해 준다.", "보호해 준다", ["보호해 준다", "보호한다"]),
  entry("put away", "치워 두다", "Put away the dishes after dinner.", "저녁을 먹고 나서 그릇을 치워 둬.", "치워 둬", ["치워 둬", "정리해 둬"]),
  entry("put on", "착용하다", "Put on your coat before going outside.", "밖에 나가기 전에 코트를 입어.", "입어", ["입어", "걸쳐"]),
  entry("put together", "조립하다", "He put together the new shelf.", "그는 새 선반을 조립했다.", "조립했다", ["조립했다"]),
  entry("receive", "받다", "I received your message this morning.", "나는 오늘 아침 네 메시지를 받았다.", "받았다", ["받았다"]),
  entry("recommend", "추천하다", "Can you recommend a good restaurant?", "괜찮은 식당 하나 추천해 줄래?", "추천해 줄래", ["추천해 줄래", "추천해줄래"]),
  entry("reduce", "줄이다", "We need to reduce waste in the office.", "우리는 사무실의 낭비를 줄여야 한다.", "줄여야 한다", ["줄여야 한다"]),
  entry("reflect", "반영하다, 되돌아보다", "The survey reflects customer needs.", "그 설문은 고객의 요구를 반영한다.", "반영한다", ["반영한다"]),
  entry("refuse", "거절하다", "She refused the offer politely.", "그녀는 그 제안을 정중히 거절했다.", "거절했다", ["거절했다"]),
  entry("relax", "긴장을 풀다", "Take a deep breath and relax.", "숨을 깊게 쉬고 긴장을 풀어.", "긴장을 풀어", ["긴장을 풀어", "편하게 있어"]),
  entry("remind", "상기시키다", "Please remind me about the meeting.", "회의 시간 되면 나에게 다시 알려 줘.", "다시 알려 줘", ["다시 알려 줘", "상기시켜 줘"]),
  entry("reply", "답장하다, 응답하다", "I replied to the email right away.", "나는 그 이메일에 바로 답장했다.", "답장했다", ["답장했다", "응답했다"]),
  entry("report", "보고하다", "The guard reported the problem immediately.", "경비원은 그 문제를 즉시 보고했다.", "보고했다", ["보고했다"]),
  entry("request", "요청하다", "She requested a later appointment.", "그녀는 더 늦은 예약 시간을 요청했다.", "요청했다", ["요청했다"]),
  entry("reserve", "예약하다", "We reserved a table by the window.", "우리는 창가 자리를 예약했다.", "예약했다", ["예약했다"]),
  entry("respond", "응답하다", "Please respond by Friday afternoon.", "금요일 오후까지 답해 주세요.", "답해 주세요", ["답해 주세요", "응답해 주세요"]),
  entry("run into", "우연히 만나다", "I ran into my old teacher downtown.", "나는 시내에서 옛 선생님을 우연히 만났다.", "우연히 만났다", ["우연히 만났다", "마주쳤다"]),
  entry("save up", "돈을 모으다", "She is saving up for a bicycle.", "그녀는 자전거를 사려고 돈을 모으고 있다.", "돈을 모으고 있다", ["돈을 모으고 있다", "저축하고 있다"]),
  entry("set up", "설치하다, 준비하다", "We set up the tent near the lake.", "우리는 호수 근처에 텐트를 설치했다.", "설치했다", ["설치했다", "세웠다"]),
  entry("show up", "나타나다", "He showed up ten minutes late.", "그는 십 분 늦게 나타났다.", "나타났다", ["나타났다"]),
  entry("sort out", "정리하다, 해결하다", "Let's sort out the problem calmly.", "그 문제를 차분히 정리해 보자.", "정리해 보자", ["정리해 보자", "해결해 보자"]),
  entry("speak up", "더 크게 말하다", "Please speak up a little.", "조금 더 크게 말해 주세요.", "더 크게 말해 주세요", ["더 크게 말해 주세요", "크게 말해 주세요"]),
  entry("suggest", "제안하다", "I suggest meeting earlier next time.", "다음에는 더 일찍 만나자고 제안한다.", "제안한다", ["제안한다"]),
  entry("support", "지원하다, 지지하다", "My parents support my decision.", "부모님은 내 결정을 지지하신다.", "지지하신다", ["지지하신다", "응원하신다"]),
  entry("survive", "살아남다", "Some plants survive even in winter.", "어떤 식물은 겨울에도 살아남는다.", "살아남는다", ["살아남는다"]),
  entry("take care of", "돌보다", "I took care of the dog for a week.", "나는 일주일 동안 그 개를 돌봤다.", "돌봤다", ["돌봤다", "돌보았다"]),
  entry("take over", "인수하다, 넘겨받다", "She will take over the project next month.", "그녀가 다음 달에 그 프로젝트를 맡게 된다.", "맡게 된다", ["맡게 된다", "넘겨받게 된다"]),
  entry("talk over", "의논하다", "We talked over the plan at lunch.", "우리는 점심시간에 그 계획을 의논했다.", "의논했다", ["의논했다", "상의했다"]),
  entry("throw away", "버리다", "Do not throw away this receipt.", "이 영수증을 버리지 마.", "버리지 마", ["버리지 마"]),
  entry("turn down", "거절하다, 낮추다", "He turned down the music.", "그는 음악 소리를 줄였다.", "줄였다", ["줄였다", "낮췄다"]),
  entry("turn into", "변하다", "The sky turned into dark gray.", "하늘이 짙은 회색으로 변했다.", "변했다", ["변했다"]),
  entry("work on", "공들이다, 작업하다", "I worked on the report all evening.", "나는 저녁 내내 보고서를 작업했다.", "작업했다", ["작업했다", "다듬었다"]),
  entry("worry about", "걱정하다", "Do not worry about the result too much.", "결과를 너무 걱정하지 마.", "걱정하지 마", ["걱정하지 마"]),
  entry("achievement", "성취", "Winning the prize was a big achievement.", "상을 받은 것은 큰 성취였다.", "큰 성취였다", ["큰 성취였다"]),
  entry("advantage", "장점", "This plan has one clear advantage.", "이 계획에는 분명한 장점이 하나 있다.", "장점이", ["장점이"]),
  entry("adventure", "모험", "The trip felt like a real adventure.", "그 여행은 진짜 모험처럼 느껴졌다.", "모험처럼", ["모험처럼"]),
  entry("appointment", "약속, 예약", "I have a doctor's appointment at two.", "나는 두 시에 병원 예약이 있다.", "예약이", ["예약이", "약속이"]),
  entry("attitude", "태도", "Her attitude changed after the talk.", "대화 후에 그녀의 태도가 바뀌었다.", "태도가", ["태도가"]),
  entry("audience", "관객", "The audience clapped loudly.", "관객이 크게 박수쳤다.", "관객이", ["관객이"]),
  entry("benefit", "이점, 혜택", "Exercise has many health benefits.", "운동에는 건강상 이점이 많다.", "이점이", ["이점이", "혜택이"]),
  entry("climate", "기후", "The climate here is dry in winter.", "이곳의 기후는 겨울에 건조하다.", "기후는", ["기후는", "기후가"]),
  entry("culture", "문화", "Food is part of local culture.", "음식은 지역 문화의 일부다.", "문화의", ["문화의"]),
  entry("deadline", "마감일", "The deadline is next Thursday.", "마감일은 다음 주 목요일이다.", "마감일은", ["마감일은"]),
  entry("detail", "세부 사항", "Please check every detail carefully.", "모든 세부 사항을 꼼꼼히 확인해.", "세부 사항을", ["세부 사항을"]),
  entry("device", "기기", "This device measures temperature.", "이 기기는 온도를 측정한다.", "기기는", ["기기는", "기기가"]),
  entry("effort", "노력", "Your effort will pay off soon.", "네 노력은 곧 보상받을 것이다.", "노력은", ["노력은"]),
  entry("emotion", "감정", "Music can change our emotions.", "음악은 우리의 감정을 바꿀 수 있다.", "감정을", ["감정을"]),
  entry("energy", "에너지", "I do not have much energy today.", "나는 오늘 기운이 별로 없다.", "기운이", ["기운이", "에너지가"]),
  entry("environment", "환경", "We must protect the environment.", "우리는 환경을 보호해야 한다.", "환경을", ["환경을"]),
  entry("habit", "습관", "Reading at night is my habit.", "밤에 책 읽는 것은 내 습관이다.", "습관이다", ["습관이다"]),
];

const advanced = [
  entry("accomplish", "성취하다", "She accomplished every goal on her list.", "그녀는 목록에 있던 목표를 모두 성취했다.", "성취했다", ["성취했다", "이뤘다"]),
  entry("adapt", "적응하다", "It took time to adapt to the new system.", "새 시스템에 적응하는 데 시간이 걸렸다.", "적응하는 데", ["적응하는 데", "익숙해지는 데"]),
  entry("admire", "존경하다", "I admire her calm leadership.", "나는 그녀의 침착한 리더십을 존경한다.", "존경한다", ["존경한다"]),
  entry("anticipate", "예상하다, 기대하다", "We anticipate strong demand this year.", "우리는 올해 수요가 클 것으로 예상한다.", "예상한다", ["예상한다", "기대한다"]),
  entry("appreciate", "진가를 알다, 감사하다", "I appreciate your honest feedback.", "솔직한 피드백에 감사한다.", "감사한다", ["감사한다", "고맙게 생각한다"]),
  entry("approve", "승인하다", "The manager approved the budget.", "관리자는 예산을 승인했다.", "승인했다", ["승인했다"]),
  entry("argue", "주장하다, 논쟁하다", "He argued that the change was necessary.", "그는 그 변화가 필요하다고 주장했다.", "주장했다", ["주장했다"]),
  entry("assess", "평가하다", "We need to assess the risk first.", "우리는 먼저 위험을 평가해야 한다.", "평가해야 한다", ["평가해야 한다"]),
  entry("assume", "추정하다", "Do not assume the answer is obvious.", "답이 뻔하다고 추정하지 마.", "추정하지 마", ["추정하지 마", "단정하지 마"]),
  entry("attempt", "시도하다", "She attempted to solve the puzzle alone.", "그녀는 혼자서 그 퍼즐을 풀려고 시도했다.", "시도했다", ["시도했다"]),
  entry("capture", "포착하다", "The report captures the current mood well.", "그 보고서는 현재 분위기를 잘 포착한다.", "포착한다", ["포착한다"]),
  entry("challenge", "도전하다, 문제를 제기하다", "The study challenges old assumptions.", "그 연구는 오래된 가정에 문제를 제기한다.", "문제를 제기한다", ["문제를 제기한다", "도전한다"]),
  entry("clarify", "명확히 하다", "Please clarify the final requirement.", "최종 요구 사항을 분명히 해 주세요.", "분명히 해 주세요", ["분명히 해 주세요", "명확히 해 주세요"]),
  entry("collaborate", "협력하다", "The two teams collaborated on the design.", "두 팀은 그 설계에 협력했다.", "협력했다", ["협력했다"]),
  entry("commit", "전념하다", "He committed himself to the project.", "그는 그 프로젝트에 전념했다.", "전념했다", ["전념했다"]),
  entry("conclude", "결론짓다", "We concluded that the plan was realistic.", "우리는 그 계획이 현실적이라고 결론지었다.", "결론지었다", ["결론지었다"]),
  entry("conduct", "수행하다", "The lab conducted another experiment.", "그 연구실은 또 다른 실험을 수행했다.", "수행했다", ["수행했다", "진행했다"]),
  entry("confront", "맞서다", "She confronted the issue directly.", "그녀는 그 문제에 정면으로 맞섰다.", "맞섰다", ["맞섰다"]),
  entry("conserve", "보존하다", "We should conserve water during summer.", "여름에는 물을 아껴 써야 한다.", "아껴 써야 한다", ["아껴 써야 한다", "보존해야 한다"]),
  entry("construct", "건설하다, 구성하다", "They constructed a strong argument.", "그들은 탄탄한 논리를 구성했다.", "구성했다", ["구성했다"]),
  entry("consult", "상의하다, 참고하다", "Consult a doctor if the pain continues.", "통증이 계속되면 의사와 상의해.", "상의해", ["상의해", "상담해"]),
  entry("detect", "감지하다", "The sensor can detect smoke quickly.", "그 센서는 연기를 빠르게 감지할 수 있다.", "감지할 수 있다", ["감지할 수 있다"]),
  entry("distinguish", "구별하다", "It is hard to distinguish the twins.", "그 쌍둥이를 구별하기는 어렵다.", "구별하기는", ["구별하기는", "구분하기는"]),
  entry("eliminate", "없애다", "We need to eliminate unnecessary steps.", "우리는 불필요한 단계를 없애야 한다.", "없애야 한다", ["없애야 한다", "제거해야 한다"]),
  entry("emphasize", "강조하다", "The teacher emphasized clear writing.", "선생님은 분명한 글쓰기를 강조했다.", "강조했다", ["강조했다"]),
  entry("ensure", "보장하다", "Please ensure the door is locked.", "문이 잠겼는지 꼭 확인해.", "꼭 확인해", ["꼭 확인해", "보장해"]),
  entry("evaluate", "평가하다", "We will evaluate the results tomorrow.", "우리는 내일 결과를 평가할 것이다.", "평가할 것이다", ["평가할 것이다"]),
  entry("exceed", "넘어서다", "Sales exceeded our expectations.", "매출은 우리의 기대를 넘어섰다.", "넘어섰다", ["넘어섰다"]),
  entry("expand", "확장하다", "The company plans to expand overseas.", "그 회사는 해외로 사업을 확장할 계획이다.", "확장할", ["확장할", "넓힐"]),
  entry("explore", "탐구하다, 탐험하다", "The article explores a difficult question.", "그 글은 어려운 질문을 탐구한다.", "탐구한다", ["탐구한다"]),
  entry("expose", "드러내다", "The interview exposed several problems.", "그 인터뷰는 여러 문제를 드러냈다.", "드러냈다", ["드러냈다"]),
  entry("foster", "촉진하다, 키우다", "Good feedback fosters improvement.", "좋은 피드백은 발전을 촉진한다.", "촉진한다", ["촉진한다"]),
  entry("illustrate", "설명하다, 보여 주다", "The graph illustrates the trend clearly.", "그 그래프는 추세를 분명히 보여 준다.", "보여 준다", ["보여 준다", "설명한다"]),
  entry("implement", "실행하다", "They implemented the new policy quickly.", "그들은 새 정책을 빠르게 실행했다.", "실행했다", ["실행했다"]),
  entry("imply", "암시하다", "His answer implied a different plan.", "그의 대답은 다른 계획을 암시했다.", "암시했다", ["암시했다"]),
  entry("incorporate", "포함하다, 통합하다", "We incorporated your ideas into the draft.", "우리는 초안에 네 아이디어를 반영했다.", "반영했다", ["반영했다", "포함했다"]),
  entry("indicate", "나타내다", "The data indicates a gradual recovery.", "그 자료는 점진적인 회복을 나타낸다.", "나타낸다", ["나타낸다"]),
  entry("influence", "영향을 주다", "Weather can influence our mood.", "날씨는 우리의 기분에 영향을 줄 수 있다.", "영향을 줄 수 있다", ["영향을 줄 수 있다"]),
  entry("interpret", "해석하다", "People interpret the poem differently.", "사람들은 그 시를 다르게 해석한다.", "해석한다", ["해석한다"]),
  entry("maintain", "유지하다", "It is hard to maintain a routine.", "규칙적인 생활을 유지하기는 어렵다.", "유지하기는", ["유지하기는", "지키기는"]),
  entry("negotiate", "협상하다", "The two sides negotiated for hours.", "양측은 몇 시간 동안 협상했다.", "협상했다", ["협상했다"]),
  entry("observe", "관찰하다", "Scientists observed the changes closely.", "과학자들은 변화를 면밀히 관찰했다.", "관찰했다", ["관찰했다"]),
  entry("overcome", "극복하다", "She overcame her fear of speaking.", "그녀는 말하기에 대한 두려움을 극복했다.", "극복했다", ["극복했다"]),
  entry("perceive", "인식하다", "Children perceive time differently.", "아이들은 시간을 다르게 인식한다.", "인식한다", ["인식한다"]),
  entry("pursue", "추구하다", "He decided to pursue graduate study.", "그는 대학원 진학을 추구하기로 했다.", "추구하기로", ["추구하기로", "도전하기로"]),
  entry("react", "반응하다", "How did the audience react?", "관객은 어떻게 반응했니?", "반응했니", ["반응했니"]),
  entry("recover", "회복하다", "The city recovered after the storm.", "그 도시는 폭풍 후에 회복되었다.", "회복되었다", ["회복되었다"]),
  entry("reflect on", "되돌아보다", "I need time to reflect on the decision.", "나는 그 결정을 되돌아볼 시간이 필요하다.", "되돌아볼", ["되돌아볼", "생각해 볼"]),
  entry("release", "발표하다, 공개하다", "The studio released a new trailer.", "그 스튜디오는 새 예고편을 공개했다.", "공개했다", ["공개했다", "발표했다"]),
  entry("represent", "대표하다, 나타내다", "This symbol represents hope.", "이 상징은 희망을 나타낸다.", "나타낸다", ["나타낸다", "대표한다"]),
  entry("resolve", "해결하다, 결심하다", "They resolved the conflict peacefully.", "그들은 갈등을 평화롭게 해결했다.", "해결했다", ["해결했다"]),
  entry("respond to", "응답하다", "The team responded to the crisis fast.", "그 팀은 위기에 빠르게 대응했다.", "대응했다", ["대응했다", "응답했다"]),
  entry("restrict", "제한하다", "The rule restricts late entry.", "그 규정은 늦은 입장을 제한한다.", "제한한다", ["제한한다"]),
  entry("reveal", "드러내다", "The report revealed hidden costs.", "그 보고서는 숨겨진 비용을 드러냈다.", "드러냈다", ["드러냈다"]),
  entry("revise", "수정하다", "Please revise the second paragraph.", "둘째 문단을 수정해 주세요.", "수정해 주세요", ["수정해 주세요", "고쳐 주세요"]),
  entry("satisfy", "충족시키다", "The result did not satisfy the client.", "그 결과는 고객을 만족시키지 못했다.", "만족시키지 못했다", ["만족시키지 못했다"]),
  entry("shift", "바꾸다, 이동하다", "Public opinion began to shift.", "여론이 바뀌기 시작했다.", "바뀌기 시작했다", ["바뀌기 시작했다"]),
  entry("strengthen", "강화하다", "We need to strengthen security.", "우리는 보안을 강화해야 한다.", "강화해야 한다", ["강화해야 한다"]),
  entry("undergo", "겪다", "The building underwent major repairs.", "그 건물은 대규모 수리를 거쳤다.", "거쳤다", ["거쳤다"]),
  entry("urge", "촉구하다", "Doctors urge people to rest more.", "의사들은 사람들이 더 쉬어야 한다고 촉구한다.", "촉구한다", ["촉구한다"]),
  entry("withdraw", "철회하다, 물러나다", "He withdrew his application yesterday.", "그는 어제 지원서를 철회했다.", "철회했다", ["철회했다"]),
  entry("bring about", "야기하다", "The policy brought about real change.", "그 정책은 실제 변화를 가져왔다.", "가져왔다", ["가져왔다", "야기했다"]),
  entry("break down", "분해하다, 고장 나다", "The old machine broke down again.", "그 오래된 기계가 또 고장 났다.", "고장 났다", ["고장 났다"]),
  entry("carry on", "계속하다", "Please carry on with your work.", "하던 일을 계속하세요.", "계속하세요", ["계속하세요", "이어 가세요"]),
  entry("come across", "우연히 발견하다", "I came across an old photo album.", "나는 오래된 사진첩을 우연히 발견했다.", "우연히 발견했다", ["우연히 발견했다", "찾아냈다"]),
  entry("cut back", "줄이다", "We must cut back on expenses.", "우리는 지출을 줄여야 한다.", "줄여야 한다", ["줄여야 한다"]),
  entry("follow through", "끝까지 해내다", "She always follows through on promises.", "그녀는 약속한 일을 늘 끝까지 해낸다.", "끝까지 해낸다", ["끝까지 해낸다"]),
  entry("hold back", "참다, 막다", "He held back his anger in the meeting.", "그는 회의에서 화를 참았다.", "참았다", ["참았다"]),
  entry("lay out", "정리해 제시하다", "The guide lays out each step clearly.", "그 안내서는 각 단계를 분명히 제시한다.", "제시한다", ["제시한다"]),
  entry("live up to", "부응하다", "The film lived up to expectations.", "그 영화는 기대에 부응했다.", "부응했다", ["부응했다"]),
  entry("look into", "조사하다", "We will look into the complaint.", "우리는 그 불만 사항을 조사할 것이다.", "조사할 것이다", ["조사할 것이다"]),
  entry("make out", "알아보다", "I could barely make out the sign.", "나는 그 표지판을 겨우 알아볼 수 있었다.", "알아볼 수 있었다", ["알아볼 수 있었다"]),
  entry("map out", "구체화하다", "Let's map out the next six months.", "앞으로 여섯 달 계획을 구체화하자.", "구체화하자", ["구체화하자", "정리하자"]),
  entry("narrow down", "범위를 좁히다", "We narrowed down the choices to three.", "우리는 선택지를 세 개로 좁혔다.", "좁혔다", ["좁혔다"]),
  entry("phase out", "점차 없애다", "The company phased out old models.", "그 회사는 구형 모델을 단계적으로 없앴다.", "단계적으로 없앴다", ["단계적으로 없앴다", "없앴다"]),
  entry("put forward", "제안하다", "She put forward a practical idea.", "그녀는 실용적인 아이디어를 제안했다.", "제안했다", ["제안했다"]),
  entry("rule out", "배제하다", "We cannot rule out that possibility.", "우리는 그 가능성을 배제할 수 없다.", "배제할 수 없다", ["배제할 수 없다"]),
  entry("step down", "사임하다", "The director stepped down last month.", "그 책임자는 지난달 사임했다.", "사임했다", ["사임했다"]),
  entry("sum up", "요약하다", "Could you sum up the main point?", "핵심 요점을 요약해 줄래?", "요약해 줄래", ["요약해 줄래", "정리해 줄래"]),
  entry("take in", "이해하다, 받아들이다", "It took me time to take in the news.", "그 소식을 받아들이는 데 시간이 걸렸다.", "받아들이는 데", ["받아들이는 데", "이해하는 데"]),
  entry("turn out", "드러나다, 판명되다", "The event turned out better than expected.", "그 행사는 예상보다 더 잘 되었다.", "더 잘 되었다", ["더 잘 되었다", "잘 풀렸다"]),
  entry("wrap up", "마무리하다", "Let's wrap up the discussion now.", "이제 논의를 마무리하자.", "마무리하자", ["마무리하자"]),
  entry("zero in on", "집중 공략하다", "We need to zero in on the cause.", "우리는 원인에 집중해야 한다.", "집중해야 한다", ["집중해야 한다"]),
  entry("analysis", "분석", "The analysis showed a clear pattern.", "그 분석은 뚜렷한 패턴을 보여 주었다.", "분석은", ["분석은"]),
  entry("approach", "접근 방식", "Their approach was simple but effective.", "그들의 접근 방식은 단순하지만 효과적이었다.", "접근 방식은", ["접근 방식은"]),
  entry("consequence", "결과, 여파", "Every choice has a consequence.", "모든 선택에는 결과가 따른다.", "결과가", ["결과가", "여파가"]),
  entry("constraint", "제약", "Budget is our biggest constraint.", "예산이 우리의 가장 큰 제약이다.", "제약이다", ["제약이다"]),
  entry("context", "맥락", "Meaning changes with context.", "의미는 맥락에 따라 달라진다.", "맥락에", ["맥락에"]),
  entry("controversy", "논란", "The decision caused public controversy.", "그 결정은 대중적 논란을 일으켰다.", "논란을", ["논란을"]),
  entry("criterion", "기준", "Accuracy is the main criterion here.", "여기서는 정확성이 핵심 기준이다.", "기준이다", ["기준이다"]),
  entry("dimension", "차원, 측면", "We need to examine every dimension.", "우리는 모든 측면을 살펴봐야 한다.", "측면을", ["측면을"]),
  entry("framework", "틀, 체계", "The report suggests a new framework.", "그 보고서는 새로운 틀을 제안한다.", "틀을", ["틀을", "체계를"]),
  entry("hypothesis", "가설", "The data did not support the hypothesis.", "그 자료는 그 가설을 뒷받침하지 않았다.", "가설을", ["가설을"]),
  entry("implication", "함의", "The result has serious implications.", "그 결과는 심각한 함의를 가진다.", "함의를", ["함의를"]),
  entry("insight", "통찰", "Her talk offered useful insight.", "그녀의 발표는 유용한 통찰을 제공했다.", "통찰을", ["통찰을"]),
  entry("integrity", "진정성, 성실성", "People trusted his integrity.", "사람들은 그의 성실성을 믿었다.", "성실성을", ["성실성을", "진정성을"]),
  entry("perspective", "관점", "Try to see it from another perspective.", "다른 관점에서 그것을 보려고 해 봐.", "관점에서", ["관점에서"]),
  entry("priority", "우선순위", "Safety must remain our top priority.", "안전은 여전히 우리의 최우선 순위여야 한다.", "최우선 순위여야", ["최우선 순위여야", "우선순위여야"]),
  entry("scenario", "시나리오, 상황", "We prepared for the worst scenario.", "우리는 최악의 상황에 대비했다.", "상황에", ["상황에", "시나리오에"]),
  entry("strategy", "전략", "Their strategy worked surprisingly well.", "그들의 전략은 놀랄 만큼 잘 통했다.", "전략은", ["전략은"]),
];

const levels = [
  { label: "초급", items: beginner, baseFrequency: 900000 },
  { label: "중급", items: intermediate, baseFrequency: 600000 },
  { label: "고급", items: advanced, baseFrequency: 300000 },
];

const seedWords = levels.flatMap(({ label, items, baseFrequency }) =>
  items.map((item, index) => ({
    ...item,
    level: label,
    frequency: baseFrequency - index * 137,
    frequencyRank: index + 1,
  })),
);

const validate = (items) => {
  const perLevel = new Map();
  const seenWords = new Set();

  for (const item of items) {
    const normalizedWord = item.word.trim().toLowerCase();
    const wordParts = normalizedWord.split(/\s+/);
    const lastPart = wordParts[wordParts.length - 1];

    if (bannedWords.has(normalizedWord)) {
      throw new Error(`Banned word included: ${item.word}`);
    }

    if (seenWords.has(normalizedWord)) {
      throw new Error(`Duplicate word: ${item.word}`);
    }
    seenWords.add(normalizedWord);

    if (!Array.isArray(item.quizAnswers) || item.quizAnswers.length === 0) {
      throw new Error(`Missing quiz answers for: ${item.word}`);
    }

    if (!item.quizKoreanBlank.trim()) {
      throw new Error(`Blank phrase is empty for: ${item.word}`);
    }

    for (const answer of item.quizAnswers) {
      const normalizedAnswer = answer.trim().toLowerCase();
      if (bannedParticles.has(normalizedAnswer)) {
        throw new Error(`Bare particle answer is not allowed: ${item.word} -> ${answer}`);
      }
    }

    if (wordParts.length > 1 && bannedParticles.has(lastPart)) {
      const normalizedBlank = item.quizKoreanBlank.trim().toLowerCase();
      if (normalizedBlank === lastPart) {
        throw new Error(`Phrasal verb blank cannot be the bare particle: ${item.word}`);
      }
    }

    perLevel.set(item.level, (perLevel.get(item.level) || 0) + 1);
  }

  for (const requiredLevel of ["초급", "중급", "고급"]) {
    const count = perLevel.get(requiredLevel) || 0;
    if (count !== 100) {
      throw new Error(`${requiredLevel} count must be 100, received ${count}`);
    }
  }
};

validate(seedWords);
writeFileSync(outputPath, `${JSON.stringify(seedWords, null, 2)}\n`, "utf8");

console.log(
  JSON.stringify(
    {
      outputPath,
      total: seedWords.length,
      counts: {
        초급: beginner.length,
        중급: intermediate.length,
        고급: advanced.length,
      },
      sample: seedWords.slice(0, 5).map(({ word, level }) => ({ word, level })),
    },
    null,
    2,
  ),
);
