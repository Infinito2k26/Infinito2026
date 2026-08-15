import React from "react";
import Card from "@/components/ui/card";

export default function TeamsPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
        <p className="text-muted-foreground mt-2">
          Manage your teams, view invitations, and create new squads.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6 flex flex-col items-center text-center justify-center min-h-[200px] border border-dashed">
            <h3 className="text-lg font-semibold text-gray-500">No Teams Yet</h3>
            <p className="text-sm text-gray-400 mt-2">You haven&apos;t joined or created any teams.</p>
        </Card>
      </div>
    </div>
  );
}