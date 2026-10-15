import { OnTheWayScreen } from "@/components/screens/on-the-way";
import { getPavilion } from "@/data/pavilions";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <OnTheWayScreen pavilion={getPavilion(id)!} />
    </>
  );
}
