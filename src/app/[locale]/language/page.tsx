import { LanguageScreen } from "@/components/screens/language";
import { localizedTitle } from "@/i18n/meta";

export const generateMetadata = localizedTitle((m) => m.language.welcome);

export default function Page() {
  return <LanguageScreen />;
}
