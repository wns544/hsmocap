import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router";
import { ChevronLeft, ThumbsUp, MessageCircle, Share2, Bookmark, MoreVertical, Send } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

export default function PostDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [comment, setComment] = useState("");

  // Mock data - 실제로는 API에서 가져옴
  // id에 따라 다른 게시글 데이터 표시
  const postsData: Record<string, any> = {
    "1": {
      id: 1,
      author: {
        name: "영어고수",
        avatar: "👨‍🎓",
        level: "레벨 15",
      },
      title: "영어 단어 암기 효과적인 방법 공유합니다",
      content: `저는 이 방법으로 하루에 50개씩 외우고 있어요.

첫 번째로는 매일 아침 30분씩 꾸준히 학습하는 것입니다. 규칙적인 시간에 하는 것이 정말 중요해요.

두 번째는 단어를 문장으로 만들어서 외우는 것입니다. 단순히 단어만 외우는 것보다 훨씬 효과적이에요.

세 번째는 이 앱의 퀴즈 기능을 적극 활용하는 것입니다. 틀린 문제는 오답노트에 자동으로 저장되니까 복습하기 정말 좋아요.

네 번째는 소리 내어 읽으면서 외우는 것입니다. 발음도 같이 익힐 수 있어서 일석이조예요!

마지막으로 복습은 필수입니다. 에빙하우스 망각곡선에 따라 복습 주기를 설정하면 장기기억으로 저장하기 좋습니다.

여러분도 꼭 시도해보세요!`,
      category: "학습팁",
      likes: 247,
      comments: 32,
      views: 1240,
      timestamp: "2시간 전",
    },
    "4": {
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
      timestamp: "1일 전",
      hasImage: true,
      imageUrl: "https://images.unsplash.com/photo-1652173410636-4be431f4a2de?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbmdsaXNoJTIwdm9jYWJ1bGFyeSUyMHN0dWR5JTIwbm90ZWJvb2t8ZW58MXx8fHwxNzc0ODA2OTU3fDA&ixlib=rb-4.1.0&q=80&w=1080",
    },
  };

  const post = postsData[id || "1"] || postsData["1"];

  const comments = [
    {
      id: 1,
      author: {
        name: "열심히공부",
        avatar: "📚",
        level: "레벨 7",
      },
      content: "정말 좋은 팁이네요! 저도 따라해봐야겠어요. 감사합니다!",
      likes: 12,
      timestamp: "1시간 전",
    },
    {
      id: 2,
      author: {
        name: "초보학습자",
        avatar: "🌱",
        level: "레벨 3",
      },
      content: "매일 아침에 하는 게 정말 중요한 것 같아요. 저도 습관화하려고 노력 중입니다.",
      likes: 8,
      timestamp: "1시간 전",
    },
    {
      id: 3,
      author: {
        name: "단어마스터",
        avatar: "👩‍💼",
        level: "레벨 12",
      },
      content: "문장으로 외우는 방법 정말 효과적이죠! 저는 예문을 직접 만들어서 외우고 있어요.",
      likes: 15,
      timestamp: "30분 전",
    },
  ];

  const handleSubmitComment = () => {
    if (!comment.trim()) return;
    // 실제로는 서버에 전송
    setComment("");
    alert("댓글이 등록되었습니다!");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-border flex items-center justify-between px-6 py-4 sticky top-0 z-40">
        <button onClick={() => navigate(-1)}>
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors">
            <Share2 className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        {/* Post */}
        <div className="bg-white border-b-8 border-muted p-6">
          {/* Category */}
          <Badge variant="outline" className="text-primary border-primary/30 mb-4">
            {post.category}
          </Badge>

          {/* Title */}
          <h1 className="text-2xl mb-4">{post.title}</h1>

          {/* Author Info */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center text-2xl">
              {post.author.avatar}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span>{post.author.name}</span>
                <Badge variant="secondary" className="text-xs px-2 py-0">
                  {post.author.level}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">{post.timestamp}</div>
            </div>
          </div>

          {/* Content */}
          <div className="text-base leading-relaxed whitespace-pre-wrap mb-6">
            {post.content}
          </div>

          {/* Image (if exists) */}
          {post.hasImage && post.imageUrl && (
            <div className="mb-6">
              <ImageWithFallback
                src={post.imageUrl}
                alt={post.title}
                className="w-full h-64 object-cover rounded-2xl"
              />
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground border-t border-border pt-4">
            <span>조회 {post.views.toLocaleString()}</span>
            <span>좋아요 {post.likes}</span>
            <span>댓글 {post.comments}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white border-b-8 border-muted px-6 py-4 flex items-center justify-around">
          <button
            onClick={() => setLiked(!liked)}
            className="flex flex-col items-center gap-1 flex-1"
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                liked ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              }`}
            >
              <ThumbsUp className={`w-5 h-5 ${liked ? "fill-current" : ""}`} />
            </div>
            <span className="text-xs">좋아요</span>
          </button>

          <button className="flex flex-col items-center gap-1 flex-1">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-muted text-muted-foreground">
              <MessageCircle className="w-5 h-5" />
            </div>
            <span className="text-xs">댓글</span>
          </button>

          <button
            onClick={() => setBookmarked(!bookmarked)}
            className="flex flex-col items-center gap-1 flex-1"
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                bookmarked ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              }`}
            >
              <Bookmark className={`w-5 h-5 ${bookmarked ? "fill-current" : ""}`} />
            </div>
            <span className="text-xs">저장</span>
          </button>
        </div>

        {/* Comments */}
        <div className="bg-white p-6">
          <h2 className="text-lg mb-4">댓글 {comments.length}</h2>
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-lg flex-shrink-0">
                  {comment.author.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">{comment.author.name}</span>
                    <Badge variant="secondary" className="text-xs px-2 py-0">
                      {comment.author.level}
                    </Badge>
                  </div>
                  <p className="text-sm mb-2">{comment.content}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{comment.timestamp}</span>
                    <button className="flex items-center gap-1 hover:text-primary transition-colors">
                      <ThumbsUp className="w-3 h-3" />
                      {comment.likes}
                    </button>
                    <button className="hover:text-primary transition-colors">답글</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Comment Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border p-4 z-40">
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="댓글을 입력하세요"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="flex-1 px-4 py-3 rounded-full bg-muted border-0 outline-none text-sm"
          />
          <button
            onClick={handleSubmitComment}
            disabled={!comment.trim()}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              comment.trim()
                ? "bg-primary text-white"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}