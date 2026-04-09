import { useState } from "react";
import { useNavigate } from "react-router";
import { ChevronDown, Hash, Image, Smile, X } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

interface ComposerFormProps {
  headerTitle: string;
  submitLabel?: string;
  successPath: string;
  categories?: string[];
}

const defaultCategories = [
  "\ud559\uc2b5\ud301",
  "\uc2dc\ud5d8\ub300\ube44",
  "\ub2e8\uc5b4",
  "\ud6c4\uae30",
  "\uc9c8\ubb38",
  "\uc790\uc720",
];

const titlePlaceholder = "\uc81c\ubaa9\uc744 \uc785\ub825\ud558\uc138\uc694";
const contentPlaceholder = "\ub0b4\uc6a9\uc744 \uc785\ub825\ud558\uc138\uc694";
const addPhotoLabel = "\uc0ac\uc9c4 \ucd94\uac00";
const submitValidationMessage = "\uc81c\ubaa9\uacfc \ub0b4\uc6a9\uc744 \ubaa8\ub450 \uc785\ub825\ud574\uc8fc\uc138\uc694.";

export default function ComposerForm({
  headerTitle,
  submitLabel = "\uc644\ub8cc",
  successPath,
  categories = defaultCategories,
}: ComposerFormProps) {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(categories[0] ?? "");
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) {
      alert(submitValidationMessage);
      return;
    }

    navigate(successPath);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const nextImages: string[] = [];
    const allowedCount = Math.min(files.length, 5 - selectedImages.length);

    for (let i = 0; i < allowedCount; i++) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          nextImages.push(event.target.result as string);
          if (nextImages.length === allowedCount) {
            setSelectedImages((current) => [...current, ...nextImages]);
          }
        }
      };
      reader.readAsDataURL(files[i]);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="bg-white border-b border-border flex items-center justify-between px-6 py-4">
        <button onClick={() => navigate(-1)}>
          <X className="w-6 h-6" />
        </button>
        <h1 className="text-lg">{headerTitle}</h1>
        <Button
          onClick={handleSubmit}
          className="bg-primary text-white hover:bg-primary/90 rounded-full px-6"
          disabled={!title.trim() || !content.trim()}
        >
          {submitLabel}
        </Button>
      </div>

      <div className="bg-white border-b border-border px-6 py-4">
        <button
          onClick={() => setShowCategoryPicker(!showCategoryPicker)}
          className="flex items-center gap-2 text-primary"
        >
          <Hash className="w-5 h-5" />
          <span>{selectedCategory}</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${showCategoryPicker ? "rotate-180" : ""}`} />
        </button>

        {showCategoryPicker && (
          <div className="mt-3 flex flex-wrap gap-2">
            {categories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className={`cursor-pointer px-4 py-2 ${
                  selectedCategory === category
                    ? "bg-primary text-white hover:bg-primary/90"
                    : "hover:bg-muted"
                }`}
                onClick={() => {
                  setSelectedCategory(category);
                  setShowCategoryPicker(false);
                }}
              >
                {category}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 p-6 space-y-4">
        <input
          type="text"
          placeholder={titlePlaceholder}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-xl bg-transparent border-0 outline-none placeholder:text-muted-foreground"
          maxLength={100}
        />

        <textarea
          placeholder={contentPlaceholder}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-64 bg-transparent border-0 outline-none resize-none placeholder:text-muted-foreground"
          maxLength={5000}
        />

        <label className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-xl hover:bg-muted/50 transition-colors cursor-pointer">
          <Image className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {addPhotoLabel} {selectedImages.length > 0 && `(${selectedImages.length}/5)`}
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
            {selectedImages.map((img, index) => (
              <div key={index} className="relative aspect-square">
                <img src={img} alt={`Preview ${index + 1}`} className="w-full h-full object-cover rounded-xl" />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-white"
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
              disabled={selectedImages.length >= 5}
            />
          </label>
          <button className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted transition-colors">
            <Smile className="w-5 h-5 text-muted-foreground" />
          </button>
          <button className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted transition-colors">
            <Hash className="w-5 h-5 text-muted-foreground" />
          </button>
          {selectedImages.length > 0 && (
            <span className="ml-auto text-xs text-muted-foreground">{selectedImages.length} / 5</span>
          )}
        </div>
      </div>
    </div>
  );
}
