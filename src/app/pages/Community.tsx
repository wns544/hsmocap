import { Link } from "react-router";
import { Search, Edit, ThumbsUp, MessageCircle, Flame, ChevronRight, Image as ImageIcon } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

export default function Community() {
  const posts = [
    {
      id: 1,
      author: {
        name: "영어고수",
        avatar: "👨‍🎓",
        level: "레벨 15",
      },
      title: "영어 단어 암기 효과적인 방법 공유합니다",
      content: "저는 이 방법으로 하루에 50개씩 외우고 있어요. 첫 번째로는...",
      category: "학습팁",
      likes: 247,
      comments: 32,
      views: 1240,
      isHot: true,
      timestamp: "2시간 전",
    },
    {
      id: 2,
      author: {
        name: "단어마스터",
        avatar: "👩‍💼",
        level: "레벨 12",
      },
      title: "토익 고득점을 위한 필수 단어 리스트",
      content: "토익 시험에서 자주 나오는 단어들을 정리해봤습니다. 많은 도움 되시길...",
      category: "시험대비",
      likes: 189,
      comments: 24,
      views: 892,
      isHot: true,
      timestamp: "5시간 전",
    },
    {
      id: 3,
      author: {
        name: "영어러버",
        avatar: "🎯",
        level: "레벨 8",
      },
      title: "어원으로 단어 외우기 - 접두사 편",
      content: "접두사만 알아도 단어의 의미를 쉽게 유추할 수 있습니다...",
      category: "학습팁",
      likes: 156,
      comments: 18,
      views: 654,
      isHot: false,
      timestamp: "1일 전",
    },
    {
      id: 4,
      author: {
        name: "초보학습자",
        avatar: "🌱",
        level: "레벨 3",
      },
      title: "영어 공부 시작한지 한 달! 후기 남겨요",
      content: "이 앱으로 공부하면서 정말 많이 늘었어요. 감사합니다!",
      category: "후기",
      likes: 92,
      comments: 15,
      views: 421,
      isHot: false,
      timestamp: "1일 전",
      hasImage: true,
      imageUrl: "https://images.unsplash.com/photo-1652173410636-4be431f4a2de?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbmdsaXNoJTIwdm9jYWJ1bGFyeSUyMHN0dWR5JTIwbm90ZWJvb2t8ZW58MXx8fHwxNzc0ODA2OTU3fDA&ixlib=rb-4.1.0&q=80&w=1080",
    },
    {
      id: 5,
      author: {
        name: "유학생",
        avatar: "✈️",
        level: "레벨 18",
      },
      title: "실생활에서 자주 쓰는 영어 표현 모음",
      content: "미국에서 생활하면서 가장 많이 듣는 표현들을 정리했어요...",
      category: "표현",
      likes: 312,
      comments: 41,
      views: 1567,
      isHot: true,
      timestamp: "12시간 전",
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="bg-white border-b border-border sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl">커뮤니티</h1>
            <Link to="/app/community/create">
              <Button className="bg-primary text-white hover:bg-primary/90 rounded-full">
                <Edit className="w-4 h-4 mr-2" />
                글쓰기
              </Button>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="궁금한 내용을 검색해보세요"
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-muted border-0 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Posts List */}
        <div className="space-y-4">
          {posts.map((post) => (
            <Link key={post.id} to={`/app/community/${post.id}`}>
              <div className="bg-white rounded-2xl p-4 border border-border active:scale-[0.98] transition-transform">
                {/* Author Info */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-xl">
                      {post.author.avatar}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{post.author.name}</span>
                        <Badge variant="secondary" className="text-xs px-2 py-0">
                          {post.author.level}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">{post.timestamp}</div>
                    </div>
                  </div>
                  {post.isHot && (
                    <div className="bg-orange-50 text-orange-600 px-2 py-1 rounded-full flex items-center gap-1">
                      <Flame className="w-3 h-3" />
                      <span className="text-xs">HOT</span>
                    </div>
                  )}
                </div>

                {/* Post Content */}
                <div className="mb-3">
                  <h3 className="mb-2 line-clamp-1">{post.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{post.content}</p>
                </div>

                {/* Category & Stats */}
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-primary border-primary/30">
                    {post.category}
                  </Badge>
                  <div className="flex items-center gap-4 text-muted-foreground text-sm">
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="w-4 h-4" />
                      <span>{post.likes}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      <span>{post.comments}</span>
                    </div>
                  </div>
                </div>

                {/* Image */}
                {post.hasImage && (
                  <div className="mt-4">
                    <ImageWithFallback
                      src={post.imageUrl}
                      alt="Post Image"
                      className="w-full h-48 object-cover rounded-2xl"
                    />
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* Load More */}
        <Button variant="outline" className="w-full rounded-full">
          더 보기
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}