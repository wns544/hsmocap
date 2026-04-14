import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronRight, Edit, Flame, MessageCircle, Search, ThumbsUp } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { db } from "../lib/firebase";

interface CategoryItem {
  id: string;
  name: string;
}

interface CommunityListPost {
  id: string;
  author: {
    name: string;
    avatar: string;
    level: string;
  };
  title: string;
  content: string;
  categoryId: string;
  categoryName: string;
  likes: number;
  comments: number;
  views: number;
  isHot: boolean;
  timestamp: string;
  hasImage?: boolean;
  imageUrl?: string;
}

const text = {
  title: "\ucee4\ubba4\ub2c8\ud2f0",
  write: "\uae00\uc4f0\uae30",
  searchPlaceholder: "\uac8c\uc2dc\uae00\uc744 \uac80\uc0c9\ud574\ubcf4\uc138\uc694",
  all: "\uc804\uccb4",
  unknown: "Unknown",
  unknownLevel: "\ub808\ubca8 \uc815\ubcf4 \uc5c6\uc74c",
  levelPrefix: "\ub808\ubca8",
  untitled: "\uc81c\ubaa9 \uc5c6\uc74c",
  uncategorized: "\ubbf8\ubd84\ub958",
  justNow: "\ubc29\uae08 \uc804",
  empty: "\uc870\uac74\uc5d0 \ub9de\ub294 \uac8c\uc2dc\uae00\uc774 \uc5c6\uc2b5\ub2c8\ub2e4.",
  loadMore: "\ub354\ubcf4\uae30",
};

export default function Community() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [posts, setPosts] = useState<CommunityListPost[]>([]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesQuery = query(collection(db, "communityCategories"), orderBy("sortOrder", "asc"));
        const snapshot = await getDocs(categoriesQuery);
        setCategories(
          snapshot.docs.map((item) => {
            const data = item.data();
            return {
              id: item.id,
              name: typeof data.name === "string" ? data.name : item.id,
            };
          }),
        );
      } catch (error) {
        console.error("Failed to load community categories:", error);
      }
    };

    const loadPosts = async () => {
      try {
        const postsQuery = query(collection(db, "posts"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(postsQuery);
        setPosts(
          snapshot.docs.map((item) => {
            const data = item.data();
            const authorSnapshot =
              typeof data.authorSnapshot === "object" && data.authorSnapshot ? data.authorSnapshot : {};
            const imageUrls = Array.isArray(data.imageUrls) ? data.imageUrls : [];

            return {
              id: item.id,
              author: {
                name: typeof authorSnapshot.nickname === "string" ? authorSnapshot.nickname : text.unknown,
                avatar: "",
                level:
                  typeof authorSnapshot.level === "number"
                    ? `${text.levelPrefix} ${authorSnapshot.level}`
                    : text.unknownLevel,
              },
              title: typeof data.title === "string" ? data.title : text.untitled,
              content: typeof data.content === "string" ? data.content : "",
              categoryId: typeof data.categoryId === "string" ? data.categoryId : "unknown",
              categoryName: typeof data.categoryName === "string" ? data.categoryName : text.uncategorized,
              likes: typeof data.likeCount === "number" ? data.likeCount : 0,
              comments: typeof data.commentCount === "number" ? data.commentCount : 0,
              views: typeof data.viewCount === "number" ? data.viewCount : 0,
              isHot: Boolean(data.isHot),
              timestamp:
                data.createdAt && typeof data.createdAt.toDate === "function"
                  ? formatDistanceToNow(data.createdAt.toDate(), { addSuffix: true, locale: ko })
                  : text.justNow,
              hasImage: imageUrls.length > 0,
              imageUrl: typeof imageUrls[0] === "string" ? imageUrls[0] : undefined,
            };
          }),
        );
      } catch (error) {
        console.error("Failed to load community posts:", error);
      }
    };

    void loadCategories();
    void loadPosts();
  }, []);

  const filteredPosts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return posts.filter((post) => {
      const matchesCategory = activeCategory === "all" || post.categoryId === activeCategory;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        post.title.toLowerCase().includes(normalizedQuery) ||
        post.content.toLowerCase().includes(normalizedQuery) ||
        post.categoryName.toLowerCase().includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, posts, searchQuery]);

  return (
    <div className="min-h-screen bg-background pb-6">
      <div className="bg-white border-b border-border sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl">{text.title}</h1>
            <Link to="/app/community/create">
              <Button className="bg-primary text-white hover:bg-primary/90 rounded-full">
                <Edit className="w-4 h-4 mr-2" />
                {text.write}
              </Button>
            </Link>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder={text.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-muted border-0 text-sm"
            />
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto">
            <Button
              type="button"
              size="sm"
              variant={activeCategory === "all" ? "default" : "outline"}
              className="rounded-full"
              onClick={() => setActiveCategory("all")}
            >
              {text.all}
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                type="button"
                size="sm"
                variant={activeCategory === category.id ? "default" : "outline"}
                className="rounded-full"
                onClick={() => setActiveCategory(category.id)}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <Link key={post.id} to={`/app/community/${post.id}`}>
              <div className="bg-white rounded-2xl p-4 border border-border active:scale-[0.98] transition-transform">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-sm">
                      {post.author.avatar || post.author.name.slice(0, 1).toUpperCase()}
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

                <div className="mb-3">
                  <h3 className="mb-2 line-clamp-1">{post.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{post.content}</p>
                </div>

                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-primary border-primary/30">
                    {post.categoryName}
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

                {post.hasImage && post.imageUrl && (
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

        {filteredPosts.length === 0 && (
          <div className="bg-white rounded-2xl p-6 border border-border text-center text-sm text-muted-foreground">
            {text.empty}
          </div>
        )}

        <Button variant="outline" className="w-full rounded-full">
          {text.loadMore}
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
