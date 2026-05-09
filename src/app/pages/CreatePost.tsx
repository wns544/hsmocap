import { useEffect, useState } from "react";
import { toast } from "sonner";
import ComposerForm, { type ComposerCategoryOption } from "../components/ComposerForm";
import { useAuth } from "../contexts/AuthContext";
import {
  createCommunityPost,
  listBoardCategories,
  type BoardCategory,
} from "../lib/community";
import { resolveProfileName } from "../lib/profileName";

function mapCategoryToOption(category: BoardCategory): ComposerCategoryOption {
  return {
    id: category.id,
    name: category.name,
  };
}

export default function CreatePost() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<ComposerCategoryOption[]>([]);

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

  const handleSubmit = async (input: {
    title: string;
    content: string;
    category: ComposerCategoryOption;
  }) => {
    if (!user) {
      toast.error("게시글 작성은 로그인 후 이용할 수 있습니다.");
      throw new Error("Community post creation requires authentication");
    }

    const authorName = resolveProfileName(user.displayName, user.email);

    await createCommunityPost({
      categoryId: input.category.id,
      categoryName: input.category.name,
      userId: user.uid,
      authorName,
      title: input.title,
      body: input.content,
    });

    toast.success("게시글이 등록되었습니다.");
  };

  return (
    <ComposerForm
      headerTitle="글쓰기"
      successPath="/app/community"
      categories={categories}
      onSubmit={handleSubmit}
    />
  );
}
