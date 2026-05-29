import { useDeferredValue, useEffect, useState } from "react";
import { Link } from "react-router";
import { ChevronRight, Edit, MessageCircle, Search, ThumbsUp } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  formatCommunityTimestamp,
  getCommunityCategoryStyle,
  listBoardCategories,
  listCommunityPosts,
  type BoardCategory,
  type CommunityPostSummary,
} from "../lib/community";

const ALL_CATEGORY_ID = "all";

export default function Community() {
  const [categories, setCategories] = useState<BoardCategory[]>([]);
  const [posts, setPosts] = useState<CommunityPostSummary[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(ALL_CATEGORY_ID);
  const [searchText, setSearchText] = useState("");
  const [isCategoryLoading, setIsCategoryLoading] = useState(true);
  const [isPostLoading, setIsPostLoading] = useState(true);

  const deferredSearchText = useDeferredValue(searchText);

  useEffect(() => {
    let isMounted = true;

    void listBoardCategories().then((items) => {
      if (!isMounted) return;
      setCategories(items);
      setIsCategoryLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    setIsPostLoading(true);

    void listCommunityPosts(selectedCategoryId).then((items) => {
      if (!isMounted) return;
      setPosts(items);
      setIsPostLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [selectedCategoryId]);

  const normalizedSearch = deferredSearchText.trim().toLowerCase();
  const filteredPosts = posts.filter((post) => {
    if (!normalizedSearch) return true;

    return [post.title, post.body, post.authorSnapshot.name, post.categoryName].some((value) =>
      value.toLowerCase().includes(normalizedSearch),
    );
  });

  return (
    <div className="min-h-screen bg-background pb-6">
      <div className="sticky top-0 z-40 border-b border-border bg-white">
        <div className="px-6 py-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl">커뮤니티</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                학습 팁과 질문을 공유하는 공간입니다.
              </p>
            </div>
            <Link to="/app/community/create">
              <Button className="rounded-full bg-primary text-white hover:bg-primary/90">
                <Edit className="mr-2 h-4 w-4" />
                글쓰기
              </Button>
            </Link>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-muted-foreground" />
            <input
              type="text"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="제목, 내용, 작성자를 검색해보세요"
              className="w-full rounded-2xl border-0 bg-muted py-3 pl-10 pr-4 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="space-y-6 px-6 py-6">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base">카테고리</h2>
            {isCategoryLoading && <span className="text-xs text-muted-foreground">불러오는 중...</span>}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setSelectedCategoryId(ALL_CATEGORY_ID)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm transition-colors ${
                selectedCategoryId === ALL_CATEGORY_ID
                  ? "bg-primary text-white"
                  : "border border-border bg-white text-foreground"
              }`}
            >
              전체
            </button>

            {categories.map((category) => {
              const categoryStyle = getCommunityCategoryStyle(category.id, category.name);

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(category.id)}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm transition-colors ${
                    selectedCategoryId === category.id
                      ? categoryStyle.filterActiveClassName
                      : categoryStyle.filterInactiveClassName
                  }`}
                >
                  {category.name}
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base">게시글</h2>
            <span className="text-sm text-muted-foreground">{filteredPosts.length}개</span>
          </div>

          {isPostLoading ? (
            <div className="rounded-2xl border border-border bg-white p-6 text-sm text-muted-foreground">
              게시글을 불러오는 중입니다.
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-white p-8 text-center">
              <p className="text-sm text-muted-foreground">아직 게시글이 없습니다.</p>
              <p className="mt-1 text-xs text-muted-foreground">
                첫 번째 게시글을 작성해서 커뮤니티를 시작해보세요.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post) => {
                const thumbnailUrl = post.imageUrls[0];
                const categoryStyle = getCommunityCategoryStyle(post.categoryId, post.categoryName);

                return (
                  <Link key={post.id} to={`/app/community/${post.id}`}>
                    <article className="rounded-2xl border border-border bg-white p-5 transition-transform active:scale-[0.99]">
                      <div className="mb-3 flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{post.authorSnapshot.name}</span>
                            <Badge variant="outline" className={categoryStyle.badgeClassName}>
                              {post.categoryName}
                            </Badge>
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {formatCommunityTimestamp(post.createdAt)}
                          </div>
                        </div>
                        {thumbnailUrl && (
                          <ImageWithFallback
                            src={thumbnailUrl}
                            alt={post.title}
                            className="h-20 w-20 shrink-0 rounded-xl object-cover"
                          />
                        )}
                      </div>

                      <h3 className="line-clamp-1 text-lg">{post.title}</h3>
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{post.body}</p>

                      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="h-4 w-4" />
                            {post.likeCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-4 w-4" />
                            {post.commentCount}
                          </span>
                        </div>
                        <span className="flex items-center gap-1">
                          상세보기
                          <ChevronRight className="h-4 w-4" />
                        </span>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
