import { LabScreen } from "@/components/screens/lab";
import { localizedTitle } from "@/i18n/meta";

export const generateMetadata = localizedTitle((m) => m.smart.lab.title);

export default function Page() {
  return <LabScreen />;
}
