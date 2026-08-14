"use client";

import React from "react";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function SettingsPage() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await api.delete('/auth/logout');
    } catch (e) {
      console.error(e);
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('infinito_token');
        router.push('/login');
      }
    }
  };
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

        <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-red-600">Danger Zone</h3>
            <p className="text-sm text-gray-500 mb-4">
              Logging out will clear your session and you will need to log in again.
            </p>
            <Button variant="outline" onClick={handleLogout} className="border-red-200 text-red-600 hover:bg-red-50">
              Sign Out
            </Button>
        </Card>
      </div>
    </div>
  );
}
