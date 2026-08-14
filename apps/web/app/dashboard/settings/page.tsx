import React from "react";
import Card from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account preferences and portal settings.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 max-w-2xl">
        <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Profile Information</h3>
            <div className="space-y-4">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Name</span>
                <span className="font-medium">Campus Ambassador</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Email</span>
                <span className="font-medium">ca@college.edu</span>
              </div>
              <div className="flex justify-between pb-2">
                <span className="text-gray-500">College</span>
                <span className="font-medium">AMU Aligarh</span>
              </div>
            </div>
        </Card>
      </div>
    </div>
  );
}
