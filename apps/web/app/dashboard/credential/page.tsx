"use client";

import { useEffect, useState } from "react";
import { Download, QrCode, ScanLine } from "lucide-react";
import { api } from "@/lib/api";
import Card from "@/components/ui/card";
import Spinner from "@/components/ui/spinner";

interface Credential {
  id: string;
  scanCount: number;
  lastScannedAt: string | null;
  qrImageUrl: string;
  createdAt: string;
}

export default function CredentialPage() {
  const [credential, setCredential] = useState<Credential | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notIssuedYet, setNotIssuedYet] = useState(false);

  useEffect(() => {
    const fetchCredential = async () => {
      try {
        const data = await api.get("/identity/mine");
        setCredential(data);
      } catch (err: unknown) {
        const status = (err as { status?: number })?.status;
        if (status === 404) {
          setNotIssuedYet(true);
        } else {
          console.error("Failed to load credential", err);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchCredential();
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto flex justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Credential</h1>
        <p className="text-muted-foreground mt-2">
          Your QR entry pass for Infinito 2K26. Show it at the gate for scanning.
        </p>
      </div>

      {notIssuedYet && (
        <Card className="p-8 flex flex-col items-center text-center gap-3 border border-dashed">
          <QrCode className="h-10 w-10 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-500">
            No credential yet
          </h3>
          <p className="text-sm text-gray-400 max-w-sm">
            Your QR credential is generated automatically once your registration
            payment is confirmed by an admin. Check back after your payment is
            verified.
          </p>
        </Card>
      )}

      {credential && (
        <Card className="p-8 flex flex-col items-center text-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={credential.qrImageUrl}
            alt="Your entry QR credential"
            className="w-56 h-56 rounded-lg border"
          />

          <div className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">
              Issued {new Date(credential.createdAt).toLocaleDateString()}
            </p>
            <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
              <ScanLine className="h-4 w-4" />
              <span>
                Scanned {credential.scanCount}{" "}
                {credential.scanCount === 1 ? "time" : "times"}
              </span>
            </div>
          </div>

          <a
            href={credential.qrImageUrl}
            download={`infinito-credential-${credential.id}.png`}
            className="inline-flex items-center gap-2 rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            <Download className="h-4 w-4" />
            Download QR
          </a>
        </Card>
      )}
    </div>
  );
}
