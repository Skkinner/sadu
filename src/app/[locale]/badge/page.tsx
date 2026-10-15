import { BadgeScreen } from "@/components/screens/quiz";
import { localizedTitle } from "@/i18n/meta";

export const generateMetadata = localizedTitle((m) => m.passport.badge);

export default function Page() {
  return <BadgeScreen />;
}
