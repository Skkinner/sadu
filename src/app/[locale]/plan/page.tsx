import { PlanScreen } from "@/components/screens/plan";
import { localizedTitle } from "@/i18n/meta";

export const generateMetadata = localizedTitle((m) => m.plan.pageTitle);

export default function Page() {
  return <PlanScreen />;
}
