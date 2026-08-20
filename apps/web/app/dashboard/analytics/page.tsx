import React from "react";
import Card from "@/components/ui/card";

export default function AnalyticsPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-2">
          View your performance metrics, referrals, and engagement statistics.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="p-6 flex flex-col items-center text-center justify-center min-h-[300px] border border-dashed">
            <h3 className="text-lg font-semibold text-gray-500">Not Enough Data</h3>
            <p className="text-sm text-gray-400 mt-2">Your analytics dashboard will populate once you start referring participants.</p>
        </Card>
      </div>
    </div>
  );
}
