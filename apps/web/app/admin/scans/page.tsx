"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Copy } from "lucide-react";
import { api } from "@/lib/api";
import Card from "@/components/ui/card";

interface ScanLogRow {
  id: string;
  gate: string;
  direction: "ENTRY" | "EXIT";
  result: "VALID" | "INVALID" | "DUPLICATE" | "EXPIRED";
  createdAt: string;
  holderName: string | null;
  scannedBy: { id: string; name: string };
}

function ResultBadge({ result }: { result: ScanLogRow["result"] }) {
  if (result === "VALID") {
    return (
      <span className="inline-flex items-center gap-1 text-green-600 text-sm font-medium">
        <CheckCircle size={14} /> Valid
      </span>
    );
  }
  if (result === "DUPLICATE") {
    return (
      <span className="inline-flex items-center gap-1 text-amber-600 text-sm font-medium">
        <Copy size={14} /> Duplicate
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-red-600 text-sm font-medium">
      <XCircle size={14} /> {result === "EXPIRED" ? "Expired" : "Invalid"}
    </span>
  );
}

export default function AdminScansPage() {
  const [scans, setScans] = useState<ScanLogRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchScans = async () => {
      try {
        const data = await api.get("/admin/scans?limit=50");
        setScans(data?.scans ?? []);
      } catch (err) {
        console.error("Failed to load scan logs", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchScans();
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gate Scan Log</h1>
        <p className="text-muted-foreground mt-2">
          Most recent QR credential scans across all gates.
        </p>
      </div>

      <Card className="p-0 overflow-x-auto">
        {isLoading ? (
          <p className="text-muted-foreground p-4">Loading scans...</p>
        ) : scans.length === 0 ? (
          <p className="text-muted-foreground p-4">No scans recorded yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="p-3 font-medium">Time</th>
                <th className="p-3 font-medium">Holder</th>
                <th className="p-3 font-medium">Gate</th>
                <th className="p-3 font-medium">Direction</th>
                <th className="p-3 font-medium">Result</th>
                <th className="p-3 font-medium">Scanned By</th>
              </tr>
            </thead>
            <tbody>
              {scans.map((scan) => (
                <tr key={scan.id} className="border-b last:border-0">
                  <td className="p-3 whitespace-nowrap">
                    {new Date(scan.createdAt).toLocaleString()}
                  </td>
                  <td className="p-3">{scan.holderName ?? "—"}</td>
                  <td className="p-3">{scan.gate}</td>
                  <td className="p-3">{scan.direction}</td>
                  <td className="p-3">
                    <ResultBadge result={scan.result} />
                  </td>
                  <td className="p-3">{scan.scannedBy.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
