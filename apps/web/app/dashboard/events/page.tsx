import React from "react";
import Card from "@/components/ui/card";

export default function EventsPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Events</h1>
        <p className="text-muted-foreground mt-2">
          Discover and register for upcoming events and competitions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6 flex flex-col items-center text-center justify-center min-h-[200px] border border-dashed">
            <h3 className="text-lg font-semibold text-gray-500">Coming Soon</h3>
            <p className="text-sm text-gray-400 mt-2">Events schedule will be published shortly.</p>
        </Card>
      </div>
    </div>
  );
}
