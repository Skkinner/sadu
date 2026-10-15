import { MissedScreen } from "@/components/screens/after-visit";
import { localizedTitle } from "@/i18n/meta";

export const generateMetadata = localizedTitle((m) => m.missed.appTitle);

export default function Page() {
  return <MissedScreen />;
}
