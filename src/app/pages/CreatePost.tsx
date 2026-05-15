import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import ComposerForm, { type ComposerCategoryOption } from "../components/ComposerForm";
import { useAuth } from "../contexts/AuthContext";
import {
  createCommunityPost,
  getCommunityPostDetail,
  listBoardCategories,
  updateCommunityPost,
  type BoardCategory,
  type CommunityPostSummary,
} from "../lib/community";
import { uploadCommunityPostImages } from "../lib/communityImages";
import { resolveProfileName } from "../lib/profileName";

function mapCategoryToOption(category: BoardCategory): ComposerCategoryOption {
  return {
    id: category.id,
    name: category.name,
  };
}

export default function CreatePost() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const [categories, setCategories] = useState<ComposerCategoryOption[]>([]);
  const [editingPost, setEditingPost] = useState<CommunityPostSummary | null>(null);
  const [isPostLoading, setIsPostLoading] = useState(isEditMode);

  useEffect(() => {
    let isMounted = true;

    const loadCategories = async () => {
      const loadedCategories = await listBoardCategories();
      if (!isMounted) return;
      setCategories(loadedCategories.map(mapCategoryToOption));
    };

    void loadCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (!id) {
      setEditingPost(null);
      setIsPostLoading(false);
      return () => {
        isMounted = false;
      };
    }

    setIsPostLoading(true);

    void getCommunityPostDetail(id)
      .then((post) => {
        if (!isMounted) return;

        if (!post) {
          toast.error("게시글을 찾을 수 없습니다.");
          navigate("/app/community");
          return;
        }

        if (user && post.userId !== user.uid) {
          toast.error("본인 게시글만 수정할 수 있습니다.");
          navigate(`/app/community/${id}`);
          return;
        }

        setEditingPost(post);
        setIsPostLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        toast.error("게시글을 불러오지 못했습니다.");
        navigate("/app/community");
      });

    return () => {
      isMounted = false;
    };
  }, [id, navigate, user]);

  const handleSubmit = async (input: {
    title: string;
    content: string;
    category: ComposerCategoryOption;
    imageFiles: File[];
    existingImageUrls: string[];
  }) => {
    if (!user) {
      toast.error("게시글 작성은 로그인 후 이용할 수 있습니다.");
      throw new Error("Community post creation requires authentication");
    }

    const uploadedImageUrls = await uploadCommunityPostImages(user.uid, input.imageFiles);
    const imageUrls = [...input.existingImageUrls, ...uploadedImageUrls].slice(0, 5);

    if (isEditMode) {
      if (!id || !editingPost || editingPost.userId !== user.uid) {
        toast.error("본인 게시글만 수정할 수 있습니다.");
        throw new Error("Only the post owner can update this post");
      }

      await updateCommunityPost({
        postId: id,
        categoryId: input.category.id,
        categoryName: input.category.name,
        title: input.title,
        body: input.content,
        imageUrls,
      });

      toast.success("게시글을 수정했습니다.");
      return;
    }

    const authorName = resolveProfileName(user.displayName, user.email);

    await createCommunityPost({
      categoryId: input.category.id,
      categoryName: input.category.name,
      userId: user.uid,
      authorName,
      title: input.title,
      body: input.content,
      imageUrls,
    });

    toast.success("게시글이 등록되었습니다.");
  };

  if (isEditMode && isPostLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        게시글을 불러오는 중입니다.
      </div>
    );
  }

  return (
    <ComposerForm
      headerTitle={isEditMode ? "게시글 수정" : "글쓰기"}
      submitLabel={isEditMode ? "수정" : undefined}
      successPath={isEditMode && id ? `/app/community/${id}` : "/app/community"}
      categories={categories}
      initialTitle={editingPost?.title ?? ""}
      initialContent={editingPost?.body ?? ""}
      initialImageUrls={editingPost?.imageUrls ?? []}
      initialCategory={
        editingPost
          ? { id: editingPost.categoryId, name: editingPost.categoryName }
          : undefined
      }
      onSubmit={handleSubmit}
    />
  );
}
