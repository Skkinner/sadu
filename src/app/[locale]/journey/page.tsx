import { Suspense } from "react";
import { JourneyScreen } from "@/components/screens/journey";
import { localizedTitle } from "@/i18n/meta";

export const generateMetadata = localizedTitle((m) => m.common.myJourney);

export default function Page() {
  return (
    <Suspense>
      <JourneyScreen />
    </Suspense>
  );
}
