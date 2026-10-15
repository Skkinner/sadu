import { AccessibilityScreen } from "@/components/screens/account";
import { localizedTitle } from "@/i18n/meta";

export const generateMetadata = localizedTitle((m) => m.a11y.appTitle);

export default function Page() {
  return <AccessibilityScreen />;
}
