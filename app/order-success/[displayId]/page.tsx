import OrderSuccessClient from "./OrderSuccessClient";

export default async function Page({
  params,
}: {
  params: Promise<{ displayId: string }>;
}) {
  const { displayId } = await params; // ✅ REQUIRED in Next 15+

  return <OrderSuccessClient displayId={displayId} />;
}
