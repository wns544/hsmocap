import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { Bookmark, ChevronLeft, Loader2, MessageCircle, MoreVertical, Send, Share2, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Badge } from "../components/ui/badge";
import { useAuth } from "../contexts/AuthContext";
import {
  CommunityCommentRecord,
  CommunityPostRecord,
  isCommunityPostSaved,
  mapCommentRecord,
  mapPostRecord,
  toggleSavedCommunityPost,
} from "../lib/community";
import { db } from "../lib/firebase";

const text = {
  loading: "게시글을 불러오는 중입니다.",
  notFound: "게시글을 찾을 수 없습니다.",
  unknownCategory: "미분류",
  views: "조회",
  likes: "좋아요",
  comments: "댓글",
  likeAction: "좋아요",
  commentPlaceholder: "댓글을 입력하세요",
  commentSubmitEmpty: "댓글 내용을 입력해 주세요.",
  commentSubmitSuccess: "댓글이 등록되었습니다.",
  commentSubmitError: "댓글 등록 중 문제가 발생했습니다.",
  loadError: "게시글을 불러오지 못했습니다.",
  bookmarkAdded: "게시글을 저장했습니다.",
  bookmarkRemoved: "저장한 게시글에서 제거했습니다.",
  commentsEmpty: "첫 댓글을 남겨보세요.",
  commentsAction: "댓글",
  replyAction: "답글",
  backToList: "목록으로",
};

export default function PostDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();

  const [post, setPost] = useState<CommunityPostRecord | null>(null);
  const [comments, setComments] = useState<CommunityCommentRecord[]>([]);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    setBookmarked(isCommunityPostSaved(id));

    const loadPostDetail = async () => {
      setIsLoading(true);

      try {
        const postRef = doc(db, "posts", id);
        const postSnapshot = await getDoc(postRef);

        if (!postSnapshot.exists()) {
          setPost(null);
          setComments([]);
          return;
        }

        const postRecord = mapPostRecord(postSnapshot.id, postSnapshot.data());
        setPost({
          ...postRecord,
          views: postRecord.views + 1,
        });

        await updateDoc(postRef, {
          viewCount: increment(1),
        });

        const commentsQuery = query(collection(db, "posts", id, "comments"), orderBy("createdAt", "asc"));
        const commentsSnapshot = await getDocs(commentsQuery);
        setComments(commentsSnapshot.docs.map((item) => mapCommentRecord(item.id, item.data())));
      } catch (error) {
        console.error("Failed to load post detail:", error);
        toast.error(text.loadError);
      } finally {
        setIsLoading(false);
      }
    };

    void loadPostDetail();
  }, [id]);

  const handleSubmitComment = async () => {
    if (!user || !id || !post) {
      return;
    }

    if (!comment.trim()) {
      toast.error(text.commentSubmitEmpty);
      return;
    }

    setIsSubmittingComment(true);

    try {
      const payload = {
        authorId: user.uid,
        authorSnapshot: {
          nickname: user.displayName || user.email?.split("@")[0] || "User",
          avatarUrl: user.photoURL || "",
          level: 1,
        },
        content: comment.trim(),
        parentCommentId: null,
        likeCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const createdComment = await addDoc(collection(db, "posts", id, "comments"), payload);
      await updateDoc(doc(db, "posts", id), {
        commentCount: increment(1),
        updatedAt: serverTimestamp(),
      });

      const nextComment = mapCommentRecord(createdComment.id, {
        ...payload,
        createdAt: {
          toDate: () => new Date(),
        },
      });

      setComments((current) => [...current, nextComment]);
      setPost((current) => (current ? { ...current, comments: current.comments + 1 } : current));
      setComment("");
      toast.success(text.commentSubmitSuccess);
    } catch (error) {
      console.error("Failed to submit comment:", error);
      toast.error(text.commentSubmitError);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleBookmarkToggle = () => {
    if (!post) {
      return;
    }

    const nextIds = toggleSavedCommunityPost(post.id);
    const nextSaved = nextIds.includes(post.id);
    setBookmarked(nextSaved);
    toast.success(nextSaved ? text.bookmarkAdded : text.bookmarkRemoved);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>{text.loading}</span>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-muted-foreground">{text.notFound}</p>
        <button
          type="button"
          onClick={() => navigate("/app/community")}
          className="rounded-full bg-primary px-5 py-2 text-white"
        >
          {text.backToList}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="bg-white border-b border-border flex items-center justify-between px-6 py-4 sticky top-0 z-40">
        <button type="button" onClick={() => navigate(-1)}>
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <button type="button" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors">
            <Share2 className="w-5 h-5" />
          </button>
          <button type="button" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        <div className="bg-white border-b-8 border-muted p-6">
          <Badge variant="outline" className="text-primary border-primary/30 mb-4">
            {post.categoryName || text.unknownCategory}
          </Badge>

          <h1 className="text-2xl mb-4">{post.title}</h1>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-muted rounded-full overflow-hidden flex items-center justify-center text-sm">
              {post.author.avatar ? (
                <img src={post.author.avatar} alt={post.author.name} className="w-full h-full object-cover" />
              ) : (
                post.author.name.slice(0, 1).toUpperCase()
              )}
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
            <span>
              {text.views} {post.views.toLocaleString()}
            </span>
            <span>
              {text.likes} {post.likes}
            </span>
            <span>
              {text.comments} {post.comments}
            </span>
          </div>
        </div>

        <div className="bg-white border-b-8 border-muted px-6 py-4 flex items-center justify-around">
          <button type="button" onClick={() => setLiked(!liked)} className="flex flex-col items-center gap-1 flex-1">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                liked ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              }`}
            >
              <ThumbsUp className={`w-5 h-5 ${liked ? "fill-current" : ""}`} />
            </div>
            <span className="text-xs">{text.likeAction}</span>
          </button>

          <button type="button" className="flex flex-col items-center gap-1 flex-1">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-muted text-muted-foreground">
              <MessageCircle className="w-5 h-5" />
            </div>
            <span className="text-xs">{text.commentsAction}</span>
          </button>

          <button type="button" onClick={handleBookmarkToggle} className="flex flex-col items-center gap-1 flex-1">
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
          <h2 className="text-lg mb-4">
            {text.comments} {comments.length}
          </h2>
          {comments.length === 0 ? (
            <div className="rounded-2xl border border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
              {text.commentsEmpty}
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="w-10 h-10 bg-muted rounded-full overflow-hidden flex items-center justify-center text-sm flex-shrink-0">
                    {item.author.avatar ? (
                      <img src={item.author.avatar} alt={item.author.name} className="w-full h-full object-cover" />
                    ) : (
                      item.author.name.slice(0, 1).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">{item.author.name}</span>
                      <Badge variant="secondary" className="text-xs px-2 py-0">
                        {item.author.level}
                      </Badge>
                    </div>
                    <p className="text-sm mb-2 whitespace-pre-wrap">{item.content}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{item.timestamp}</span>
                      <button type="button" className="flex items-center gap-1 hover:text-primary transition-colors">
                        <ThumbsUp className="w-3 h-3" />
                        {item.likes}
                      </button>
                      <button type="button" className="hover:text-primary transition-colors">
                        {text.replyAction}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border p-4 z-40">
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder={text.commentPlaceholder}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            className="flex-1 px-4 py-3 rounded-full bg-muted border-0 outline-none text-sm"
            disabled={isSubmittingComment}
          />
          <button
            type="button"
            onClick={handleSubmitComment}
            disabled={!comment.trim() || isSubmittingComment}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              comment.trim() && !isSubmittingComment ? "bg-primary text-white" : "bg-muted text-muted-foreground"
            }`}
          >
            {isSubmittingComment ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
