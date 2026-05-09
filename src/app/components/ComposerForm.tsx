import { useState } from "react";
import { useNavigate } from "react-router";
import { ChevronDown, Hash, Image, Smile, X } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

export interface ComposerCategoryOption {
  id: string;
  name: string;
}

interface ComposerFormProps {
  headerTitle: string;
  submitLabel?: string;
  successPath: string;
  categories?: ComposerCategoryOption[];
  onSubmit?: (input: { title: string; content: string; category: ComposerCategoryOption }) => Promise<void>;
}

const defaultCategories: ComposerCategoryOption[] = [
  { id: "free", name: "자유" },
  { id: "question", name: "질문" },
  { id: "review", name: "후기" },
];

export default function ComposerForm({
  headerTitle,
  submitLabel = "완료",
  successPath,
  categories = defaultCategories,
  onSubmit,
}: ComposerFormProps) {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ComposerCategoryOption>(
    categories[0] ?? defaultCategories[0],
  );
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      alert("제목과 내용을 모두 입력해주세요.");
      return;
    }

    if (!onSubmit) {
      navigate(successPath);
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        title: title.trim(),
        content: content.trim(),
        category: selectedCategory,
      });
      navigate(successPath);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const nextImages: string[] = [];
    const allowedCount = Math.min(files.length, 5 - selectedImages.length);

    for (let index = 0; index < allowedCount; index += 1) {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        if (readerEvent.target?.result) {
          nextImages.push(readerEvent.target.result as string);
          if (nextImages.length === allowedCount) {
            setSelectedImages((current) => [...current, ...nextImages]);
          }
        }
      };
      reader.readAsDataURL(files[index]);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, currentIndex) => currentIndex !== index));
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex items-center justify-between border-b border-border bg-white px-6 py-4">
        <button onClick={() => navigate(-1)}>
          <X className="h-6 w-6" />
        </button>
        <h1 className="text-lg">{headerTitle}</h1>
        <Button
          onClick={() => void handleSubmit()}
          className="rounded-full bg-primary px-6 text-white hover:bg-primary/90"
          disabled={!title.trim() || !content.trim() || isSubmitting}
        >
          {isSubmitting ? "저장 중..." : submitLabel}
        </Button>
      </div>

      <div className="border-b border-border bg-white px-6 py-4">
        <button
          onClick={() => setShowCategoryPicker((current) => !current)}
          className="flex items-center gap-2 text-primary"
        >
          <Hash className="h-5 w-5" />
          <span>{selectedCategory?.name ?? "카테고리 선택"}</span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${showCategoryPicker ? "rotate-180" : ""}`}
          />
        </button>

        {showCategoryPicker && (
          <div className="mt-3 flex flex-wrap gap-2">
            {categories.map((category) => (
              <Badge
                key={category.id}
                variant={selectedCategory?.id === category.id ? "default" : "outline"}
                className={`cursor-pointer px-4 py-2 ${
                  selectedCategory?.id === category.id
                    ? "bg-primary text-white hover:bg-primary/90"
                    : "hover:bg-muted"
                }`}
                onClick={() => {
                  setSelectedCategory(category);
                  setShowCategoryPicker(false);
                }}
              >
                {category.name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 space-y-4 p-6">
        <input
          type="text"
          placeholder="제목을 입력하세요"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="w-full border-0 bg-transparent text-xl outline-none placeholder:text-muted-foreground"
          maxLength={100}
        />

        <textarea
          placeholder="내용을 입력하세요"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          className="h-64 w-full resize-none border-0 bg-transparent outline-none placeholder:text-muted-foreground"
          maxLength={5000}
        />

        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border px-4 py-2 transition-colors hover:bg-muted/50">
          <Image className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            사진 추가 {selectedImages.length > 0 && `(${selectedImages.length}/5)`}
          </span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="hidden"
            disabled={selectedImages.length >= 5}
          />
        </label>

        {selectedImages.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {selectedImages.map((image, index) => (
              <div key={index} className="relative aspect-square">
                <img src={image} alt={`Preview ${index + 1}`} className="h-full w-full rounded-xl object-cover" />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {selectedImages.length > 0 && (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
            이미지 업로드 저장은 다음 단계에서 연결할 예정입니다. 이번 단계에서는 텍스트 게시글 저장이 우선입니다.
          </div>
        )}

        <div className="text-right text-xs text-muted-foreground">{content.length} / 5000</div>
      </div>

      <div className="border-t border-border bg-white px-6 py-4">
        <div className="flex items-center gap-4">
          <label className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-muted">
            <Image className="h-5 w-5 text-muted-foreground" />
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
              disabled={selectedImages.length >= 5}
            />
          </label>
          <button className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-muted">
            <Smile className="h-5 w-5 text-muted-foreground" />
          </button>
          <button className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-muted">
            <Hash className="h-5 w-5 text-muted-foreground" />
          </button>
          {selectedImages.length > 0 && (
            <span className="ml-auto text-xs text-muted-foreground">{selectedImages.length} / 5</span>
          )}
        </div>
      </div>
    </div>
  );
}
