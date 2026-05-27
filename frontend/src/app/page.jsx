"use client";

import React, { useState } from "react";
import { LandingPage } from "@/components/landing/LandingPage";
import { WalletModal } from "@/components/wallet/WalletModal";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  return (
    <>
      <LandingPage
        onEnterDashboard={() => router.push("/chat")}
        onOpenConnectModal={() => setIsConnectModalOpen(true)}
      />
      <WalletModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
      />
    </>
  );
}
