import { PassportScreen } from "@/components/screens/after-visit";
import { localizedTitle } from "@/i18n/meta";

export const generateMetadata = localizedTitle((m) => m.passport.appTitle);

export default function Page() {
  return <PassportScreen />;
}
