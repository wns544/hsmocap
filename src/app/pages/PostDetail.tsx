import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  Bookmark,
  ChevronLeft,
  MessageCircle,
  MoreVertical,
  Pencil,
  Send,
  Share2,
  ThumbsUp,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useAuth } from "../contexts/AuthContext";
import {
  createPostComment,
  deleteCommunityPost,
  deletePostComment,
  formatCommunityTimestamp,
  getCommunityPostDetail,
  isPostBookmarkedByUser,
  isPostLikedByUser,
  listPostComments,
  togglePostBookmark,
  togglePostLike,
  updatePostComment,
  type CommunityCommentSummary,
  type CommunityPostSummary,
} from "../lib/community";
import { resolveProfileName } from "../lib/profileName";

export default function PostDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const postId = id ?? "";

  const [post, setPost] = useState<CommunityPostSummary | null>(null);
  const [comments, setComments] = useState<CommunityCommentSummary[]>([]);
  const [isPostLoading, setIsPostLoading] = useState(true);
  const [isCommentLoading, setIsCommentLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [comment, setComment] = useState("");
  const [bookmarked, setBookmarked] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState("");
  const isPostOwner = !!user && !!post && user.uid === post.userId;

  useEffect(() => {
    let isMounted = true;
    setIsPostLoading(true);

    void getCommunityPostDetail(postId).then((item) => {
      if (!isMounted) return;
      setPost(item);
      setIsPostLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [postId]);

  useEffect(() => {
    let isMounted = true;
    setIsCommentLoading(true);

    void listPostComments(postId).then((items) => {
      if (!isMounted) return;
      setComments(items);
      setIsCommentLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [postId]);

  useEffect(() => {
    let isMounted = true;

    if (!user) {
      setLiked(false);
      return () => {
        isMounted = false;
      };
    }

    void isPostLikedByUser(postId, user.uid)
      .then((value) => {
        if (!isMounted) return;
        setLiked(value);
      })
      .catch(() => {
        if (!isMounted) return;
        setLiked(false);
      });

    return () => {
      isMounted = false;
    };
  }, [postId, user]);

  useEffect(() => {
    let isMounted = true;

    if (!user || !post) {
      setBookmarked(false);
      return () => {
        isMounted = false;
      };
    }

    void isPostBookmarkedByUser(post.id, user.uid)
      .then((value) => {
        if (!isMounted) return;
        setBookmarked(value);
      })
      .catch(() => {
        if (!isMounted) return;
        setBookmarked(false);
      });

    return () => {
      isMounted = false;
    };
  }, [post, user]);

  const handleSubmitComment = async () => {
    const trimmedComment = comment.trim();
    if (!trimmedComment) return;

    if (!user) {
      toast.error("댓글 작성은 로그인 후 이용할 수 있습니다.");
      return;
    }

    try {
      await createPostComment({
        postId,
        userId: user.uid,
        authorName: resolveProfileName(user.displayName, user.email),
        content: trimmedComment,
      });

      const nextComments = await listPostComments(postId);
      setComments(nextComments);
      setComment("");
      toast.success("댓글이 등록되었습니다.");
    } catch (error) {
      console.error("댓글 작성에 실패했습니다.", error);
      toast.error("댓글 작성에 실패했습니다.");
    }
  };

  const handleLikeToggle = async () => {
    if (!user) {
      toast.error("좋아요는 로그인 후 이용할 수 있습니다.");
      return;
    }

    try {
      const nextLiked = await togglePostLike(postId, user.uid);
      setLiked(nextLiked);
      setPost((current) =>
        current
          ? {
              ...current,
              likeCount: Math.max(0, current.likeCount + (nextLiked ? 1 : -1)),
            }
          : current,
      );
      toast.success(nextLiked ? "좋아요를 눌렀습니다." : "좋아요를 취소했습니다.");
    } catch (error) {
      console.error("좋아요 처리에 실패했습니다.", error);
      toast.error("좋아요 처리에 실패했습니다.");
    }
  };

  const handleBookmarkToggle = async () => {
    if (!user) {
      toast.error("게시글 저장은 로그인 후 이용할 수 있습니다.");
      return;
    }

    if (!post) return;

    try {
      const nextSaved = await togglePostBookmark(post.id, user.uid);
      setBookmarked(nextSaved);
      toast.success(nextSaved ? "게시글을 저장했습니다." : "저장한 게시글에서 제거했습니다.");
    } catch (error) {
      console.error("게시글 저장 처리에 실패했습니다.", error);
      toast.error("게시글 저장 처리에 실패했습니다.");
    }
  };

  const handleDeletePost = async () => {
    if (!user || !post || user.uid !== post.userId) {
      toast.error("본인 게시글만 삭제할 수 있습니다.");
      return;
    }

    if (!window.confirm("이 게시글을 삭제할까요?")) {
      return;
    }

    try {
      await deleteCommunityPost(post.id);
      toast.success("게시글을 삭제했습니다.");
      navigate("/app/community");
    } catch (error) {
      console.error("게시글 삭제에 실패했습니다.", error);
      toast.error("게시글 삭제에 실패했습니다.");
    }
  };

  const handleDeleteComment = async (commentId: string, commentUserId: string) => {
    if (!user || user.uid !== commentUserId) {
      toast.error("본인 댓글만 삭제할 수 있습니다.");
      return;
    }

    if (!window.confirm("이 댓글을 삭제할까요?")) {
      return;
    }

    try {
      await deletePostComment(postId, commentId);
      const nextComments = await listPostComments(postId);
      setComments(nextComments);
      toast.success("댓글을 삭제했습니다.");
    } catch (error) {
      console.error("댓글 삭제에 실패했습니다.", error);
      toast.error("댓글 삭제에 실패했습니다.");
    }
  };

  const startEditComment = (item: CommunityCommentSummary) => {
    setEditingCommentId(item.id);
    setEditingCommentContent(item.content);
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentContent("");
  };

  const handleUpdateComment = async (commentId: string, commentUserId: string) => {
    const trimmedContent = editingCommentContent.trim();
    if (!trimmedContent) {
      toast.error("댓글 내용을 입력해 주세요.");
      return;
    }

    if (!user || user.uid !== commentUserId) {
      toast.error("본인 댓글만 수정할 수 있습니다.");
      return;
    }

    try {
      await updatePostComment({
        postId,
        commentId,
        content: trimmedContent,
      });
      const nextComments = await listPostComments(postId);
      setComments(nextComments);
      cancelEditComment();
      toast.success("댓글을 수정했습니다.");
    } catch (error) {
      console.error("댓글 수정에 실패했습니다.", error);
      toast.error("댓글 수정에 실패했습니다.");
    }
  };

  if (isPostLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-white px-6 py-4">
          <button onClick={() => navigate(-1)}>
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="text-sm text-muted-foreground">게시글을 불러오는 중입니다.</div>
          <div className="w-6" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-white px-6 py-4">
          <button onClick={() => navigate(-1)}>
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="text-sm text-muted-foreground">게시글을 찾을 수 없습니다.</div>
          <div className="w-6" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-white px-6 py-4">
        <button onClick={() => navigate(-1)}>
          <ChevronLeft className="h-6 w-6" />
        </button>
        <div className="flex items-center gap-2">
          <button className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-muted">
            <Share2 className="h-5 w-5" />
          </button>
          <button className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-muted">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-8">
        <div className="border-b-8 border-muted bg-white p-6">
          <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
            {post.categoryName}
          </Badge>

          <h1 className="mb-4 text-2xl">{post.title}</h1>

          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-lg">
              {post.authorSnapshot.name.slice(0, 1)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span>{post.authorSnapshot.name}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {formatCommunityTimestamp(post.createdAt)}
              </div>
            </div>
            {isPostOwner && (
              <div className="flex items-center gap-2">
                <Link
                  to={`/app/community/${post.id}/edit`}
                  className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs transition-colors hover:bg-muted"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  수정
                </Link>
                <button
                  type="button"
                  onClick={() => void handleDeletePost()}
                  className="rounded-full border border-destructive/20 px-3 py-1 text-xs text-destructive transition-colors hover:bg-destructive/5"
                >
                  삭제
                </button>
              </div>
            )}
          </div>

          <div className="mb-6 whitespace-pre-wrap text-base leading-relaxed">{post.body}</div>

          {post.imageUrls.length > 0 && (
            <div className="mb-6">
              <ImageWithFallback
                src={post.imageUrls[0]}
                alt={post.title}
                className="h-64 w-full rounded-2xl object-cover"
              />
            </div>
          )}

          <div className="flex items-center gap-6 border-t border-border pt-4 text-sm text-muted-foreground">
            <span>조회 {post.viewCount.toLocaleString()}</span>
            <span>좋아요 {post.likeCount}</span>
            <span>댓글 {post.commentCount || comments.length}</span>
          </div>
        </div>

        <div className="flex items-center justify-around border-b-8 border-muted bg-white px-6 py-4">
          <button onClick={() => void handleLikeToggle()} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
                liked ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              }`}
            >
              <ThumbsUp className={`h-5 w-5 ${liked ? "fill-current" : ""}`} />
            </div>
            <span className="text-xs">좋아요</span>
          </button>

          <button className="flex flex-1 flex-col items-center gap-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <MessageCircle className="h-5 w-5" />
            </div>
            <span className="text-xs">댓글</span>
          </button>

          <button
            onClick={() => void handleBookmarkToggle()}
            className="flex flex-1 flex-col items-center gap-1"
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
                bookmarked ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              }`}
            >
              <Bookmark className={`h-5 w-5 ${bookmarked ? "fill-current" : ""}`} />
            </div>
            <span className="text-xs">저장</span>
          </button>
        </div>

        <div className="bg-white p-6">
          <h2 className="mb-4 text-lg">댓글 {comments.length}</h2>

          {isCommentLoading ? (
            <div className="rounded-2xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              댓글을 불러오는 중입니다.
            </div>
          ) : comments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
              아직 댓글이 없습니다. 첫 번째 댓글을 남겨보세요.
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-muted text-sm">
                    {item.authorSnapshot.name.slice(0, 1)}
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-sm">{item.authorSnapshot.name}</span>
                      {user?.uid === item.userId && (
                        <>
                          <button
                            type="button"
                            onClick={() => startEditComment(item)}
                            className="text-xs text-primary hover:underline"
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteComment(item.id, item.userId)}
                            className="text-xs text-destructive hover:underline"
                          >
                            삭제
                          </button>
                        </>
                      )}
                    </div>
                    {editingCommentId === item.id ? (
                      <div className="mb-3 space-y-2">
                        <Textarea
                          value={editingCommentContent}
                          onChange={(event) => setEditingCommentContent(event.target.value)}
                          className="min-h-20 bg-white text-sm"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={cancelEditComment}
                            className="rounded-full border border-border px-3 py-1 text-xs transition-colors hover:bg-muted"
                          >
                            취소
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleUpdateComment(item.id, item.userId)}
                            disabled={!editingCommentContent.trim()}
                            className={`rounded-full px-3 py-1 text-xs transition-colors ${
                              editingCommentContent.trim()
                                ? "bg-primary text-white hover:bg-primary/90"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            저장
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="mb-2 text-sm">{item.content}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{formatCommunityTimestamp(item.createdAt)}</span>
                      {item.updatedAt &&
                        item.createdAt?.getTime() !== item.updatedAt.getTime() && (
                          <span>수정됨</span>
                        )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 rounded-2xl border border-border bg-muted/20 p-4">
            <div className="mb-3 text-sm text-muted-foreground">댓글 작성</div>
            <div className="space-y-3">
              <Textarea
                placeholder="댓글을 입력하세요"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                className="min-h-24 bg-white"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => void handleSubmitComment()}
                  disabled={!comment.trim()}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors ${
                    comment.trim()
                      ? "bg-primary text-white hover:bg-primary/90"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Send className="h-4 w-4" />
                  댓글 등록
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <Link to="/app/favorites" className="text-sm text-primary hover:underline">
              저장한 게시글 목록 보러 가기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
