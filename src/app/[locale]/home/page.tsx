import { HomeScreen } from "@/components/screens/home";
import { localizedTitle } from "@/i18n/meta";

export const generateMetadata = localizedTitle((m) => m.common.nav.home);

export default function Page() {
  return <HomeScreen />;
}
