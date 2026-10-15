import { ContactScreen } from "@/components/screens/account";
import { localizedTitle } from "@/i18n/meta";

export const generateMetadata = localizedTitle((m) => m.contact.appTitle);

export default function Page() {
  return <ContactScreen />;
}
