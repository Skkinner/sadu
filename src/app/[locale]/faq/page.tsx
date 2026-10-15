import { FaqScreen } from "@/components/screens/account";
import { localizedTitle } from "@/i18n/meta";

export const generateMetadata = localizedTitle((m) => m.faq.appTitle);

export default function Page() {
  return <FaqScreen />;
}
