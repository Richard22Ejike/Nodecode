import { PricingTable } from "@clerk/nextjs";

export default function UpgradePage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">Upgrade to Pro</h1>
        <p className="text-sm text-muted-foreground">
          Unlock premium nodes such as the Agent, which drives the browser on
          its own to complete a goal.
        </p>
      </div>
      <PricingTable />
    </div>
  );
}
