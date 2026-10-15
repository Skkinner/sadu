import { ListenScreen } from "@/components/screens/listen";
import { getPavilion } from "@/data/pavilions";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <ListenScreen pavilion={getPavilion(id)!} />
    </>
  );
}
