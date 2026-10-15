import { PrivacyScreen } from "@/components/screens/account";
import { localizedTitle } from "@/i18n/meta";

export const generateMetadata = localizedTitle((m) => m.privacy.title);

export default function Page() {
  return <PrivacyScreen />;
}
