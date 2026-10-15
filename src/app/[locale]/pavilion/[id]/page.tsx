import { PavilionScreen } from "@/components/screens/pavilion";
import { getPavilion } from "@/data/pavilions";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <PavilionScreen pavilion={getPavilion(id)!} />
    </>
  );
}
