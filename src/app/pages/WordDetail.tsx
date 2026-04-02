import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Star, Volume2, BookOpen, Check } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

export default function WordDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isFavorite, setIsFavorite] = useState(false);

  const word = {
    word: "Serendipity",
    pronunciation: "/ˌserənˈdɪpɪti/",
    meaning: "뜻밖의 행운, 우연한 발견",
    level: "고급",
    mastery: 85,
    examples: [
      { en: "Finding that book was pure serendipity.", ko: "그 책을 찾은 것은 순전히 우연한 행운이었다." },
      { en: "By serendipity, I met my old friend at the airport.", ko: "우연히 공항에서 옛 친구를 만났다." },
      { en: "The discovery was a result of serendipity.", ko: "그 발견은 우연한 행운의 결과였다." },
    ],
    synonyms: ["Fortune", "Luck", "Chance"],
    related: ["Fortune", "Destiny", "Fate"],
  };

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="bg-primary text-white px-6 pt-12 pb-6 rounded-b-3xl">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"
          >
            <Star
              className={`w-5 h-5 ${isFavorite ? "fill-yellow-400 text-yellow-400" : ""}`}
            />
          </button>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-4xl mb-2">{word.word}</h1>
          <p className="text-white/80 mb-1">{word.pronunciation}</p>
          <Badge variant="secondary" className="bg-white/20 text-white border-0">
            {word.level}
          </Badge>
        </div>

        <button className="w-full bg-white/20 backdrop-blur-sm rounded-2xl p-4 flex items-center justify-center gap-2">
          <Volume2 className="w-5 h-5" />
          <span>발음 듣기</span>
        </button>
      </div>

      <div className="px-6 mt-6">
        {/* Mastery Progress */}
        <div className="bg-white rounded-2xl p-5 border border-border mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <span>학습 진행도</span>
            </div>
            <span className="text-primary">{word.mastery}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full"
              style={{ width: `${word.mastery}%` }}
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="meaning" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="meaning">뜻</TabsTrigger>
            <TabsTrigger value="examples">예문</TabsTrigger>
            <TabsTrigger value="related">연관 단어</TabsTrigger>
          </TabsList>

          <TabsContent value="meaning" className="space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-border">
              <h3 className="text-sm text-muted-foreground mb-2">의미</h3>
              <p className="text-lg">{word.meaning}</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-border">
              <h3 className="text-sm text-muted-foreground mb-3">유의어</h3>
              <div className="flex flex-wrap gap-2">
                {word.synonyms.map((synonym, index) => (
                  <Badge key={index} variant="secondary" className="bg-accent">
                    {synonym}
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="examples" className="space-y-4">
            {word.examples.map((example, index) => (
              <div key={index} className="bg-white rounded-2xl p-5 border border-border">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <p className="flex-1">{example.en}</p>
                </div>
                <p className="text-muted-foreground pl-9">{example.ko}</p>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="related" className="space-y-3">
            {word.related.map((relatedWord, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-4 border border-border flex items-center justify-between"
              >
                <span>{relatedWord}</span>
                <Button variant="ghost" size="sm" className="text-primary">
                  보기
                </Button>
              </div>
            ))}
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="mt-6 space-y-3">
          <Button className="w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-xl">
            퀴즈로 복습하기
          </Button>
          <Button variant="outline" className="w-full h-14 rounded-xl">
            복습 리스트에 추가
          </Button>
        </div>
      </div>
    </div>
  );
}
