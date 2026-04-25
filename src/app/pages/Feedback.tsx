import ComposerForm from "../components/ComposerForm";

const decode = (value: string) => JSON.parse(`"${value}"`) as string;

const feedbackCategories = [
  decode("\\ubc84\\uadf8 \\uc81c\\ubcf4"),
  decode("\\uae30\\ub2a5 \\uc81c\\uc548"),
  decode("\\uc0ac\\uc6a9\\uc131"),
  decode("\\ub514\\uc790\\uc778"),
  decode("\\uae30\\ud0c0"),
];

export default function Feedback() {
  return (
    <ComposerForm
      headerTitle={decode("\\ud53c\\ub4dc\\ubc31 \\ubcf4\\ub0b4\\uae30")}
      successPath="/app/settings"
      categories={feedbackCategories}
    />
  );
}
