import { EssenceScreen } from "@/components/screens/after-visit";
import { localizedTitle } from "@/i18n/meta";

export const generateMetadata = localizedTitle((m) => m.essence.appTitle);

export default function Page() {
  return <EssenceScreen />;
}
