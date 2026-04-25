import { redirect } from "next/navigation";

import { DeliveryIntakeForm } from "@/components/public/DeliveryIntakeForm";
import { getCurrentClientSession } from "@/lib/auth";
import { isDemoMode } from "@/lib/env";
import { getClientAccount } from "@/lib/repository";

export default async function PortalNewDeliveryPage() {
  const session = await getCurrentClientSession();

  if (!session) {
    redirect("/sign-in");
  }

  const client = await getClientAccount(session.clientId);

  if (!client) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-6">
      <section className="panel">
        <p className="section-label">New delivery</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">
          Submit a delivery request
        </h1>
        <p className="copy mt-3 max-w-3xl">
          Your account details are already attached. Add the delivery
          information the dispatch team needs and we will place it into the
          operations queue.
        </p>
      </section>

      <DeliveryIntakeForm
        demoMode={isDemoMode()}
        clientAccount={{
          contactName: client.contactName,
          businessName: client.businessName,
          phone: client.phone,
          email: client.email,
          businessAddress: client.businessAddress,
        }}
      />
    </div>
  );
}
