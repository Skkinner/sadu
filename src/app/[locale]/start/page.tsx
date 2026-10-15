import { Suspense } from "react";
import { EntryScreen } from "@/components/screens/auth";
import { localizedTitle } from "@/i18n/meta";

export const generateMetadata = localizedTitle((m) => m.auth.entry.appTitle);

export default function Page() {
  return (
    <Suspense>
      <EntryScreen />
    </Suspense>
  );
}
