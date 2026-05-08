import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Bookmark, ChevronLeft, MessageCircle, MoreVertical, Send, Share2, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "../components/ui/badge";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { communityPosts, isCommunityPostSaved, toggleSavedCommunityPost } from "../lib/community";

export default function PostDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const numericId = Number(id ?? "1");
  const post = communityPosts.find((item) => item.id === numericId) || communityPosts[0];

  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(isCommunityPostSaved(post.id));
  const [comment, setComment] = useState("");

  const comments = [
    { id: 1, author: { name: "매일영어", avatar: "📚", level: "레벨 7" }, content: "정리 방식이 정말 좋네요. 바로 따라 해볼게요.", likes: 12, timestamp: "1시간 전" },
    { id: 2, author: { name: "초보학습자", avatar: "🌱", level: "레벨 3" }, content: "짧게 자주 보는 방법이 특히 도움이 됐어요.", likes: 8, timestamp: "1시간 전" },
    { id: 3, author: { name: "단어마스터", avatar: "🧠", level: "레벨 12" }, content: "예문과 함께 외우는 방식은 확실히 기억이 오래가더라고요.", likes: 15, timestamp: "30분 전" },
  ];

  const handleSubmitComment = () => {
    if (!comment.trim()) return;
    setComment("");
    alert("댓글이 등록되었습니다.");
  };

  const handleBookmarkToggle = () => {
    const nextIds = toggleSavedCommunityPost(post.id);
    const nextSaved = nextIds.includes(post.id);
    setBookmarked(nextSaved);
    toast.success(nextSaved ? "게시글을 저장했습니다." : "저장한 게시글에서 제거했습니다.");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
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

      <div className="flex-1 overflow-y-auto pb-20">
        <div className="bg-white border-b-8 border-muted p-6">
          <Badge variant="outline" className="text-primary border-primary/30 mb-4">
            {post.category}
          </Badge>

          <h1 className="text-2xl mb-4">{post.title}</h1>

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

          <div className="text-base leading-relaxed whitespace-pre-wrap mb-6">{post.content}</div>

          {post.hasImage && post.imageUrl && (
            <div className="mb-6">
              <ImageWithFallback src={post.imageUrl} alt={post.title} className="w-full h-64 object-cover rounded-2xl" />
            </div>
          )}

          <div className="flex items-center gap-6 text-sm text-muted-foreground border-t border-border pt-4">
            <span>조회 {post.views.toLocaleString()}</span>
            <span>좋아요 {post.likes}</span>
            <span>댓글 {post.comments}</span>
          </div>
        </div>

        <div className="bg-white border-b-8 border-muted px-6 py-4 flex items-center justify-around">
          <button onClick={() => setLiked(!liked)} className="flex flex-col items-center gap-1 flex-1">
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

          <button onClick={handleBookmarkToggle} className="flex flex-col items-center gap-1 flex-1">
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

        <div className="bg-white p-6">
          <h2 className="text-lg mb-4">댓글 {comments.length}</h2>
          <div className="space-y-4">
            {comments.map((item) => (
              <div key={item.id} className="flex gap-3">
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-lg flex-shrink-0">
                  {item.author.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">{item.author.name}</span>
                    <Badge variant="secondary" className="text-xs px-2 py-0">
                      {item.author.level}
                    </Badge>
                  </div>
                  <p className="text-sm mb-2">{item.content}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{item.timestamp}</span>
                    <button className="flex items-center gap-1 hover:text-primary transition-colors">
                      <ThumbsUp className="w-3 h-3" />
                      {item.likes}
                    </button>
                    <button className="hover:text-primary transition-colors">답글</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <Link to="/app/favorites" className="text-sm text-primary hover:underline">
              즐겨찾기 게시글 목록으로 이동
            </Link>
          </div>
        </div>
      </div>

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
              comment.trim() ? "bg-primary text-white" : "bg-muted text-muted-foreground"
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
