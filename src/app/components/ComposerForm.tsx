import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { ChevronDown, Hash, Image, Smile, X } from "lucide-react";
import { toast } from "sonner";
import { CommunityCategoryOption } from "../lib/community";
import { db } from "../lib/firebase";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

interface ComposerFormProps {
  headerTitle: string;
  submitLabel?: string;
  submittingLabel?: string;
  successPath: string;
  categories?: CommunityCategoryOption[];
  onSubmit?: (payload: {
    title: string;
    content: string;
    category: CommunityCategoryOption;
    imageUrls: string[];
  }) => Promise<void> | void;
}

const defaultCategories: CommunityCategoryOption[] = [
  { id: "study-tip", name: "\ud559\uc2b5\ud301" },
  { id: "exam-prep", name: "\uc2dc\ud5d8\ub300\ube44" },
  { id: "vocabulary", name: "\ub2e8\uc5b4" },
  { id: "review", name: "\ud6c4\uae30" },
  { id: "question", name: "\uc9c8\ubb38" },
  { id: "free", name: "\uc790\uc720" },
];

const text = {
  titlePlaceholder: "\uc81c\ubaa9\uc744 \uc785\ub825\ud558\uc138\uc694",
  contentPlaceholder: "\ub0b4\uc6a9\uc744 \uc785\ub825\ud558\uc138\uc694",
  addPhotoLabel: "\uc0ac\uc9c4 \ucd94\uac00",
  submitValidationMessage: "\uc81c\ubaa9\uacfc \ub0b4\uc6a9\uc744 \ubaa8\ub450 \uc785\ub825\ud574\uc8fc\uc138\uc694.",
  submitLabel: "\uc644\ub8cc",
  submittingLabel: "\uc5c5\ub85c\ub4dc \uc911...",
  imageTypeError: "\uc774\ubbf8\uc9c0 \ud30c\uc77c\ub9cc \uc120\ud0dd\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4.",
  imageSizeError: "\uc774\ubbf8\uc9c0\ub294 5MB \uc774\ud558\ub85c \uc120\ud0dd\ud574\uc8fc\uc138\uc694.",
  imageLimitError: "\uc774\ubbf8\uc9c0\ub294 \ucd5c\ub300 5\uc7a5\uae4c\uc9c0 \uc62c\ub9b4 \uc218 \uc788\uc2b5\ub2c8\ub2e4.",
  submitError: "\uc800\uc7a5 \uc911 \ubb38\uc81c\uac00 \ubc1c\uc0dd\ud588\uc2b5\ub2c8\ub2e4. \ub2e4\uc2dc \uc2dc\ub3c4\ud574\uc8fc\uc138\uc694.",
  loadingCategories: "\uce74\ud14c\uace0\ub9ac \ubd88\ub7ec\uc624\ub294 \uc911...",
};

const MAX_IMAGE_COUNT = 5;
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export default function ComposerForm({
  headerTitle,
  submitLabel = text.submitLabel,
  submittingLabel = text.submittingLabel,
  successPath,
  categories,
  onSubmit,
}: ComposerFormProps) {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [availableCategories, setAvailableCategories] = useState<CommunityCategoryOption[]>(categories ?? defaultCategories);
  const [selectedCategoryId, setSelectedCategoryId] = useState((categories ?? defaultCategories)[0]?.id ?? "");
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  useEffect(() => {
    if (categories && categories.length > 0) {
      setAvailableCategories(categories);
      setSelectedCategoryId((current) => current || categories[0]?.id || "");
      return;
    }

    const loadCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const categoriesQuery = query(collection(db, "communityCategories"), orderBy("sortOrder", "asc"));
        const snapshot = await getDocs(categoriesQuery);
        const fetchedCategories = snapshot.docs
          .map((item) => {
            const data = item.data();
            return {
              id: item.id,
              name: typeof data.name === "string" && data.name.length > 0 ? data.name : item.id,
            };
          })
          .filter((category) => category.name.length > 0);

        if (fetchedCategories.length > 0) {
          setAvailableCategories(fetchedCategories);
          setSelectedCategoryId((current) => current || fetchedCategories[0]?.id || "");
          return;
        }
      } catch (error) {
        console.error("Failed to load categories for composer:", error);
      } finally {
        setIsLoadingCategories(false);
      }

      setAvailableCategories(defaultCategories);
      setSelectedCategoryId((current) => current || defaultCategories[0]?.id || "");
    };

    void loadCategories();
  }, [categories]);

  const selectedCategory =
    availableCategories.find((category) => category.id === selectedCategoryId) ?? availableCategories[0] ?? null;

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim() || !selectedCategory) {
      toast.error(text.submitValidationMessage);
      return;
    }

    try {
      setIsSubmitting(true);
      if (onSubmit) {
        await onSubmit({
          title: title.trim(),
          content: content.trim(),
          category: selectedCategory,
          imageUrls: selectedImages,
        });
      }
      navigate(successPath);
    } catch (error) {
      console.error("Failed to submit composer form:", error);
      toast.error(text.submitError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (selectedImages.length >= MAX_IMAGE_COUNT) {
      toast.error(text.imageLimitError);
      e.target.value = "";
      return;
    }

    const validFiles = Array.from(files)
      .slice(0, MAX_IMAGE_COUNT - selectedImages.length)
      .filter((file) => {
        if (!file.type.startsWith("image/")) {
          toast.error(text.imageTypeError);
          return false;
        }

        if (file.size > MAX_IMAGE_SIZE_BYTES) {
          toast.error(text.imageSizeError);
          return false;
        }

        return true;
      });

    if (files.length > MAX_IMAGE_COUNT - selectedImages.length) {
      toast.error(text.imageLimitError);
    }

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSelectedImages((current) => [...current, event.target?.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="bg-white border-b border-border flex items-center justify-between px-6 py-4">
        <button onClick={() => !isSubmitting && navigate(-1)} disabled={isSubmitting}>
          <X className="w-6 h-6" />
        </button>
        <h1 className="text-lg">{headerTitle}</h1>
        <Button
          onClick={handleSubmit}
          className="bg-primary text-white hover:bg-primary/90 rounded-full px-6"
          disabled={!title.trim() || !content.trim() || isSubmitting || isLoadingCategories || !selectedCategory}
        >
          {isSubmitting ? submittingLabel : submitLabel}
        </Button>
      </div>

      <div className="bg-white border-b border-border px-6 py-4">
        <button
          onClick={() => setShowCategoryPicker(!showCategoryPicker)}
          className="flex items-center gap-2 text-primary"
          disabled={isSubmitting || isLoadingCategories}
        >
          <Hash className="w-5 h-5" />
          <span>{isLoadingCategories ? text.loadingCategories : selectedCategory?.name}</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${showCategoryPicker ? "rotate-180" : ""}`} />
        </button>

        {showCategoryPicker && (
          <div className="mt-3 flex flex-wrap gap-2">
            {availableCategories.map((category) => (
              <Badge
                key={category.id}
                variant={selectedCategoryId === category.id ? "default" : "outline"}
                className={`cursor-pointer px-4 py-2 ${
                  selectedCategoryId === category.id
                    ? "bg-primary text-white hover:bg-primary/90"
                    : "hover:bg-muted"
                }`}
                onClick={() => {
                  setSelectedCategoryId(category.id);
                  setShowCategoryPicker(false);
                }}
              >
                {category.name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 p-6 space-y-4">
        <input
          type="text"
          placeholder={text.titlePlaceholder}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-xl bg-transparent border-0 outline-none placeholder:text-muted-foreground"
          maxLength={100}
          disabled={isSubmitting}
        />

        <textarea
          placeholder={text.contentPlaceholder}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-64 bg-transparent border-0 outline-none resize-none placeholder:text-muted-foreground"
          maxLength={5000}
          disabled={isSubmitting}
        />

        <label className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-xl hover:bg-muted/50 transition-colors cursor-pointer">
          <Image className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {text.addPhotoLabel} {selectedImages.length > 0 && `(${selectedImages.length}/${MAX_IMAGE_COUNT})`}
          </span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="hidden"
            disabled={selectedImages.length >= MAX_IMAGE_COUNT || isSubmitting}
          />
        </label>

        {selectedImages.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {selectedImages.map((img, index) => (
              <div key={index} className="relative aspect-square">
                <img src={img} alt={`Preview ${index + 1}`} className="w-full h-full object-cover rounded-xl" />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-white"
                  disabled={isSubmitting}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="text-xs text-muted-foreground text-right">{content.length} / 5000</div>
      </div>

      <div className="bg-white border-t border-border px-6 py-4">
        <div className="flex items-center gap-4">
          <label className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted transition-colors cursor-pointer">
            <Image className="w-5 h-5 text-muted-foreground" />
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
              disabled={selectedImages.length >= MAX_IMAGE_COUNT || isSubmitting}
            />
          </label>
          <button className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted transition-colors">
            <Smile className="w-5 h-5 text-muted-foreground" />
          </button>
          <button className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted transition-colors">
            <Hash className="w-5 h-5 text-muted-foreground" />
          </button>
          {selectedImages.length > 0 && (
            <span className="ml-auto text-xs text-muted-foreground">{selectedImages.length} / {MAX_IMAGE_COUNT}</span>
          )}
        </div>
      </div>
    </div>
  );
}
