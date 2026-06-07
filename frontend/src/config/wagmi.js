import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "viem";
import { base, baseSepolia } from "wagmi/chains";

export const wagmiConfig = getDefaultConfig({
  appName: "IntentAI Financial Operating System",
  projectId: "796f69f7c96adf708d9710392d168e0e",
  chains: [base, baseSepolia],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
  ssr: true,
});
