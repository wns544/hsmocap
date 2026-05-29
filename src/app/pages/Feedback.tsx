import ComposerForm from "../components/ComposerForm";
import { useAuth } from "../contexts/AuthContext";
import { uploadFeedbackImages } from "../lib/communityImages";
import { createFeedback } from "../lib/feedback";
import { fileToDataUrl, isLocalTestMode } from "../lib/localTestMode";
import { resolveProfileName } from "../lib/profileName";

const decode = (value: string) => JSON.parse(`"${value}"`) as string;

const feedbackCategories = [
  { id: "bug", name: decode("\\ubc84\\uadf8 \\uc81c\\ubcf4") },
  { id: "feature", name: decode("\\uae30\\ub2a5 \\uc81c\\uc548") },
  { id: "usability", name: decode("\\uc0ac\\uc6a9\\uc131") },
  { id: "design", name: decode("\\ub514\\uc790\\uc778") },
  { id: "other", name: decode("\\uae30\\ud0c0") },
];

export default function Feedback() {
  const { user } = useAuth();

  return (
    <ComposerForm
      headerTitle={decode("\\ud53c\\ub4dc\\ubc31 \\ubcf4\\ub0b4\\uae30")}
      submitLabel={decode("\\ubcf4\\ub0b4\\uae30")}
      successPath="/app/settings/feedback/history"
      categories={feedbackCategories}
      importantOption={{
        label: decode("\\uc911\\uc694 \\ud53c\\ub4dc\\ubc31"),
        description: decode(
          "\\ub2e4\\ub978 \\uc0ac\\uc6a9\\uc790 \\ub9ce\\uc740 \\ubb38\\uc81c\\ub098 \\ube60\\ub978 \\ud655\\uc778\\uc774 \\ud544\\uc694\\ud55c \\ub0b4\\uc6a9\\uc774\\uba74 \\uc120\\ud0dd\\ud574\\uc8fc\\uc138\\uc694.",
        ),
      }}
      onSubmit={async ({ title, content, category, imageFiles, isImportant }) => {
        if (!user) {
          throw new Error("Missing user");
        }

        const authorName = resolveProfileName(user.displayName || user.email || "사용자", user.email || "");
        const imageUrls = isLocalTestMode()
          ? await Promise.all(imageFiles.map((file) => fileToDataUrl(file)))
          : await uploadFeedbackImages(user.uid, imageFiles);

        await createFeedback({
          userId: user.uid,
          authorName,
          authorEmail: user.email ?? "",
          categoryId: category.id,
          categoryName: category.name,
          title,
          body: content,
          isImportant,
          imageUrls,
        });
      }}
    />
  );
}
