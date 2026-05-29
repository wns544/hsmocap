import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Copy,
  MessageCircle,
  MoreVertical,
  Pencil,
  Send,
  Share2,
  ShieldAlert,
  ThumbsUp,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Badge } from "../components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Textarea } from "../components/ui/textarea";
import { useAuth } from "../contexts/AuthContext";
import { adminDeleteCommunityComment, adminDeleteCommunityPost } from "../lib/admin";
import {
  createPostComment,
  deleteCommunityPost,
  deletePostComment,
  formatCommunityTimestamp,
  getCommunityCategoryStyle,
  getCommunityPostDetail,
  incrementPostView,
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
  const { user, isAdmin } = useAuth();
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
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const isPostOwner = !!user && !!post && user.uid === post.userId;
  const imageCount = post?.imageUrls.length ?? 0;
  const selectedImageUrl =
    selectedImageIndex !== null && post ? post.imageUrls[selectedImageIndex] : undefined;

  const openImageViewer = (index: number) => {
    setSelectedImageIndex(index);
  };

  const closeImageViewer = () => {
    setSelectedImageIndex(null);
  };

  const showPreviousImage = () => {
    setSelectedImageIndex((current) => {
      if (current === null || imageCount === 0) return current;
      return (current - 1 + imageCount) % imageCount;
    });
  };

  const showNextImage = () => {
    setSelectedImageIndex((current) => {
      if (current === null || imageCount === 0) return current;
      return (current + 1) % imageCount;
    });
  };

  const getPostUrl = () => {
    if (typeof window === "undefined") {
      return `/app/community/${postId}`;
    }

    return `${window.location.origin}/app/community/${postId}`;
  };

  const copyText = async (value: string, message: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(message);
    } catch {
      toast.error("클립보드 복사에 실패했습니다.");
    }
  };

  const handleSharePost = async () => {
    if (!post) return;

    const shareUrl = getPostUrl();
    const shareData = {
      title: post.title,
      text: post.body.slice(0, 80),
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }

    await copyText(shareUrl, "게시글 링크를 복사했습니다.");
  };

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
    if (!postId || !user) return;

    const viewedKey = `wordy.viewedPost.${postId}`;
    if (sessionStorage.getItem(viewedKey)) return;

    sessionStorage.setItem(viewedKey, "1");
    setPost((current) =>
      current
        ? {
            ...current,
            viewCount: current.viewCount + 1,
          }
        : current,
    );

    void incrementPostView(postId).catch((error) => {
      console.error("조회수 증가에 실패했습니다.", error);
    });
  }, [postId, user]);

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
      setPost((current) =>
        current
          ? {
              ...current,
              commentCount: nextComments.length,
            }
          : current,
      );
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

  const handleAdminDeletePost = async () => {
    if (!post || !isAdmin) {
      toast.error("관리자 권한이 필요합니다.");
      return;
    }

    if (!window.confirm(`"${post.title}" 게시글을 관리자 권한으로 삭제할까요? 댓글과 좋아요도 함께 정리됩니다.`)) {
      return;
    }

    try {
      await adminDeleteCommunityPost(post.id);
      toast.success("관리자 권한으로 게시글을 삭제했습니다.");
      navigate("/app/community");
    } catch (error) {
      console.error("관리자 게시글 삭제에 실패했습니다.", error);
      toast.error("관리자 게시글 삭제에 실패했습니다.");
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
      setPost((current) =>
        current
          ? {
              ...current,
              commentCount: nextComments.length,
            }
          : current,
      );
      toast.success("댓글을 삭제했습니다.");
    } catch (error) {
      console.error("댓글 삭제에 실패했습니다.", error);
      toast.error("댓글 삭제에 실패했습니다.");
    }
  };

  const handleAdminDeleteComment = async (commentId: string, authorName: string) => {
    if (!isAdmin) {
      toast.error("관리자 권한이 필요합니다.");
      return;
    }

    if (!window.confirm(`${authorName}님의 댓글을 관리자 권한으로 삭제할까요?`)) {
      return;
    }

    try {
      await adminDeleteCommunityComment(postId, commentId);
      const nextComments = await listPostComments(postId);
      setComments(nextComments);
      setPost((current) =>
        current
          ? {
              ...current,
              commentCount: nextComments.length,
            }
          : current,
      );
      toast.success("관리자 권한으로 댓글을 삭제했습니다.");
    } catch (error) {
      console.error("관리자 댓글 삭제에 실패했습니다.", error);
      toast.error("관리자 댓글 삭제에 실패했습니다.");
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
      toast.error("댓글 내용을 입력해주세요.");
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
      setPost((current) =>
        current
          ? {
              ...current,
              commentCount: nextComments.length,
            }
          : current,
      );
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

  const categoryStyle = getCommunityCategoryStyle(post.categoryId, post.categoryName);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-white px-6 py-4">
        <button onClick={() => navigate(-1)}>
          <ChevronLeft className="h-6 w-6" />
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void handleSharePost()}
            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-muted"
            aria-label="게시글 공유"
          >
            <Share2 className="h-5 w-5" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-muted"
                aria-label="게시글 메뉴"
              >
                <MoreVertical className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onSelect={() => void copyText(getPostUrl(), "게시글 링크를 복사했습니다.")}>
                <Copy className="h-4 w-4" />
                링크 복사
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => void handleSharePost()}>
                <Share2 className="h-4 w-4" />
                공유하기
              </DropdownMenuItem>

              {isPostOwner && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => navigate(`/app/community/${post.id}/edit`)}>
                    <Pencil className="h-4 w-4" />
                    게시글 수정
                  </DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onSelect={() => void handleDeletePost()}>
                    <Trash2 className="h-4 w-4" />
                    게시글 삭제
                  </DropdownMenuItem>
                </>
              )}

              {isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => void copyText(post.id, "게시글 ID를 복사했습니다.")}>
                    <Copy className="h-4 w-4" />
                    게시글 ID 복사
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => void copyText(post.userId, "작성자 UID를 복사했습니다.")}>
                    <Copy className="h-4 w-4" />
                    작성자 UID 복사
                  </DropdownMenuItem>
                  {!isPostOwner && (
                    <DropdownMenuItem variant="destructive" onSelect={() => void handleAdminDeletePost()}>
                      <ShieldAlert className="h-4 w-4" />
                      관리자 삭제
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-8">
        <div className="border-b-8 border-muted bg-white p-6">
          <Badge variant="outline" className={`mb-4 ${categoryStyle.badgeClassName}`}>
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
            <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
              {post.imageUrls.slice(0, 5).map((imageUrl, index) => (
                <button
                  key={imageUrl}
                  type="button"
                  onClick={() => openImageViewer(index)}
                  className="h-28 w-28 flex-shrink-0 overflow-hidden rounded-xl bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  aria-label={`첨부 이미지 ${index + 1} 크게 보기`}
                >
                <ImageWithFallback
                  src={imageUrl}
                  alt={`${post.title} 첨부 이미지 ${index + 1}`}
                  className="h-full w-full object-cover transition-transform hover:scale-[1.03]"
                />
                </button>
              ))}
              {false && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {post.imageUrls.slice(1, 5).map((imageUrl, index) => {
                    const imageIndex = index + 1;

                    return (
                      <button
                        key={imageUrl}
                        type="button"
                        onClick={() => openImageViewer(imageIndex)}
                        className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        aria-label={`첨부 이미지 ${imageIndex + 1} 크게 보기`}
                      >
                        <ImageWithFallback
                          src={imageUrl}
                          alt={`${post.title} 첨부 이미지 ${imageIndex + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              )}
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
                      {isAdmin && user?.uid !== item.userId && (
                        <button
                          type="button"
                          onClick={() => void handleAdminDeleteComment(item.id, item.authorSnapshot.name)}
                          className="text-xs text-destructive hover:underline"
                        >
                          관리 삭제
                        </button>
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

      {selectedImageUrl && selectedImageIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="첨부 이미지 크게 보기"
          onClick={closeImageViewer}
        >
          <button
            type="button"
            onClick={closeImageViewer}
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition-colors hover:bg-white/25"
            aria-label="이미지 닫기"
          >
            <X className="h-6 w-6" />
          </button>

          {imageCount > 1 && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                showPreviousImage();
              }}
              className="absolute left-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition-colors hover:bg-white/25"
              aria-label="이전 이미지 보기"
            >
              <ChevronLeft className="h-7 w-7" />
            </button>
          )}

          <ImageWithFallback
            src={selectedImageUrl}
            alt={`${post.title} 첨부 이미지 ${selectedImageIndex + 1}`}
            className="max-h-[86vh] max-w-[92vw] rounded-2xl object-contain"
            onClick={(event) => event.stopPropagation()}
            style={{ touchAction: "pinch-zoom" }}
          />

          {imageCount > 1 && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                showNextImage();
              }}
              className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition-colors hover:bg-white/25"
              aria-label="다음 이미지 보기"
            >
              <ChevronRight className="h-7 w-7" />
            </button>
          )}

          {imageCount > 1 && (
            <div className="absolute bottom-5 rounded-full bg-white/15 px-3 py-1 text-sm text-white backdrop-blur">
              {selectedImageIndex + 1} / {imageCount}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
