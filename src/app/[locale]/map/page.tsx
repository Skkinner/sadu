import { MapScreen } from "@/components/screens/map";
import { localizedTitle } from "@/i18n/meta";

export const generateMetadata = localizedTitle((m) => m.map.title);

export default function Page() {
  return <MapScreen />;
}
