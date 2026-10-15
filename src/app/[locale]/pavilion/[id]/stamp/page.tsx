import { StampScreen } from "@/components/screens/quiz";
import { getPavilion } from "@/data/pavilions";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StampScreen pavilion={getPavilion(id)!} />;
}
