import ComposerForm from "../components/ComposerForm";
import { useAuth } from "../contexts/AuthContext";
import { createFeedback } from "../lib/feedback";
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
      submitLabel="보내기"
      successPath="/app/settings"
      categories={feedbackCategories}
      importantOption={{
        label: "중요 피드백",
        description: "앱 사용을 막는 문제이거나 빠른 확인이 필요한 내용이면 선택하세요.",
      }}
      onSubmit={async ({ title, content, category, isImportant }) => {
        if (!user) throw new Error("Missing user");
        const authorName = await resolveProfileName(user.uid, user.displayName || user.email || "사용자");
        await createFeedback({
          userId: user.uid,
          authorName,
          authorEmail: user.email ?? "",
          categoryId: category.id,
          categoryName: category.name,
          title,
          body: content,
          isImportant,
        });
      }}
    />
  );
}
