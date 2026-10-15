import { AccountScreen } from "@/components/screens/account";
import { localizedTitle } from "@/i18n/meta";

export const generateMetadata = localizedTitle((m) => m.account.title);

export default function Page() {
  return <AccountScreen />;
}
