import { PreparingScreen } from "@/components/screens/preparing";
import { localizedTitle } from "@/i18n/meta";

export const generateMetadata = localizedTitle((m) => m.preparing.title);

export default function Page() {
  return <PreparingScreen />;
}
