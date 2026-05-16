import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ChevronDown, Hash, Image, Smile, X } from "lucide-react";
import { validateCommunityPostImages } from "../lib/communityImages";
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
  initialTitle?: string;
  initialContent?: string;
  initialCategory?: ComposerCategoryOption;
  initialImageUrls?: string[];
  onSubmit?: (input: {
    title: string;
    content: string;
    category: ComposerCategoryOption;
    imageFiles: File[];
    existingImageUrls: string[];
  }) => Promise<void>;
}

type ComposerImageItem = {
  id: string;
  previewUrl: string;
  file?: File;
  existingUrl?: string;
};

const MAX_IMAGE_COUNT = 5;

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
  initialTitle = "",
  initialContent = "",
  initialCategory,
  initialImageUrls = [],
  onSubmit,
}: ComposerFormProps) {
  const navigate = useNavigate();
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [selectedCategory, setSelectedCategory] = useState<ComposerCategoryOption>(
    initialCategory ?? categories[0] ?? defaultCategories[0],
  );
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [selectedImages, setSelectedImages] = useState<ComposerImageItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setTitle(initialTitle);
  }, [initialTitle]);

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
      return;
    }

    setSelectedCategory((current) =>
      categories.some((category) => category.id === current.id)
        ? current
        : categories[0] ?? defaultCategories[0],
    );
  }, [categories, initialCategory?.id, initialCategory?.name]);

  useEffect(() => {
    setSelectedImages(
      initialImageUrls.map((url) => ({
        id: url,
        previewUrl: url,
        existingUrl: url,
      })),
    );
  }, [initialImageUrls.join("|")]);

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
        imageFiles: selectedImages.flatMap((image) => (image.file ? [image.file] : [])),
        existingImageUrls: selectedImages.flatMap((image) => (image.existingUrl ? [image.existingUrl] : [])),
      });
      navigate(successPath);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const selectedFiles = Array.from(files);
    const allowedCount = MAX_IMAGE_COUNT - selectedImages.length;
    const candidateFiles = selectedFiles.slice(0, allowedCount);
    const validationError = validateCommunityPostImages(candidateFiles);

    if (allowedCount <= 0) {
      alert(`이미지는 최대 ${MAX_IMAGE_COUNT}장까지 첨부할 수 있습니다.`);
      event.target.value = "";
      return;
    }

    if (validationError) {
      alert(validationError);
      event.target.value = "";
      return;
    }

    const nextImages = candidateFiles.map((file, index) => ({
      id: `${file.name}-${file.lastModified}-${index}`,
      previewUrl: URL.createObjectURL(file),
      file,
    }));

    if (nextImages.length > 0) {
      setSelectedImages((current) => [...current, ...nextImages]);
    }

    event.target.value = "";
  };

  const removeImage = (index: number) => {
    setSelectedImages((current) => current.filter((_, currentIndex) => currentIndex !== index));
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
            사진 추가 {selectedImages.length > 0 && `(${selectedImages.length}/${MAX_IMAGE_COUNT})`}
          </span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="hidden"
            disabled={selectedImages.length >= MAX_IMAGE_COUNT}
          />
        </label>

        {selectedImages.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {selectedImages.map((image, index) => (
              <div key={image.id} className="relative aspect-square">
                <img
                  src={image.previewUrl}
                  alt={`첨부 이미지 ${index + 1}`}
                  className="h-full w-full rounded-xl object-cover"
                />
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
            첨부한 이미지는 게시글 저장 시 Firebase Storage에 업로드됩니다.
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
              disabled={selectedImages.length >= MAX_IMAGE_COUNT}
            />
          </label>
          <button className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-muted">
            <Smile className="h-5 w-5 text-muted-foreground" />
          </button>
          <button className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-muted">
            <Hash className="h-5 w-5 text-muted-foreground" />
          </button>
          {selectedImages.length > 0 && (
            <span className="ml-auto text-xs text-muted-foreground">
              {selectedImages.length} / {MAX_IMAGE_COUNT}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
