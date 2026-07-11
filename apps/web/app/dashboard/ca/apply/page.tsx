"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
// import { CAHeroSection } from "@/components/ca/CAHeroSection";
// import { CAApplicationForm } from "@/components/ca/CAApplicationForm";

export default function CAApplyPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

  // The Smart Logic: Handling the submission
    const handleApply = async (data: { targetCollege: string }) => {
    setIsSubmitting(true);

    try {
      // TODO: Replace this timeout with actual TanStack Query mutation
      // Simulating a network request and an "auto-approval"
        await new Promise((resolve) => setTimeout(resolve, 1500));
        
        console.log("Submitted College:", data.targetCollege);
        
      // Since we are assuming auto-approval, redirect straight to the dashboard
        router.push("/dashboard/ca");
    } catch (error) {
        console.error("Failed to apply:", error);
      // TODO: Drop in a toast notification here
    } finally {
        setIsSubmitting(false);
    }
    };

    return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* <CAHeroSection /> */}
        
        <div className="bg-white/5 border border-white/10 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Submit Your Application</h2>
        {/* Dropping in the dumb component and passing down the smart logic */}
        {/* <CAApplicationForm 
            onSubmit={handleApply} 
            isLoading={isSubmitting} 
        /> */}
        </div>
    </div>
    );
}