"use client";

// Minimal EIP-1193 wallet state. No seed phrases, no approvals: Loxen only ever asks for
// accounts, the chain, a network switch, and one contract call that records a digest.

import { useCallback, useEffect, useState } from "react";
import type { EIP1193Provider } from "viem";
import { TARGET_CHAIN } from "./chains";

declare global {
  interface Window {
    ethereum?: EIP1193Provider;
  }
}

export type WalletState = {
  available: boolean | null; // null until checked in the browser
  account: `0x${string}` | null;
  chainId: number | null;
  connecting: boolean;
  error: string | null;
};

export function useWallet() {
  const [state, setState] = useState<WalletState>({ available: null, account: null, chainId: null, connecting: false, error: null });

  useEffect(() => {
    const eth = window.ethereum;
    if (!eth) {
      setState((s) => ({ ...s, available: false }));
      return;
    }
    setState((s) => ({ ...s, available: true }));
    const onAccounts = (a: unknown) => {
      const list = a as `0x${string}`[];
      setState((s) => ({ ...s, account: list?.[0] ?? null }));
    };
    const onChain = (id: unknown) => setState((s) => ({ ...s, chainId: parseInt(String(id), 16) }));
    eth.request({ method: "eth_accounts" }).then(onAccounts).catch(() => {});
    eth.request({ method: "eth_chainId" }).then(onChain).catch(() => {});
    eth.on("accountsChanged", onAccounts);
    eth.on("chainChanged", onChain);
    return () => {
      eth.removeListener("accountsChanged", onAccounts);
      eth.removeListener("chainChanged", onChain);
    };
  }, []);

  const connect = useCallback(async () => {
    const eth = window.ethereum;
    if (!eth) return;
    setState((s) => ({ ...s, connecting: true, error: null }));
    try {
      const accounts = (await eth.request({ method: "eth_requestAccounts" })) as `0x${string}`[];
      const id = (await eth.request({ method: "eth_chainId" })) as string;
      setState((s) => ({ ...s, account: accounts[0] ?? null, chainId: parseInt(id, 16), connecting: false }));
    } catch (e) {
      const code = (e as { code?: number }).code;
      setState((s) => ({ ...s, connecting: false, error: code === 4001 ? "You declined the connection in your wallet." : "The wallet did not connect." }));
    }
  }, []);

  const switchNetwork = useCallback(async () => {
    const eth = window.ethereum;
    if (!eth) return;
    const hex = `0x${TARGET_CHAIN.id.toString(16)}` as `0x${string}`;
    try {
      await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: hex }] });
    } catch (e) {
      if ((e as { code?: number }).code === 4902) {
        await eth
          .request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: hex,
                chainName: TARGET_CHAIN.name,
                nativeCurrency: { name: "BOT", symbol: "BOT", decimals: 18 },
                rpcUrls: [TARGET_CHAIN.rpcUrl],
                blockExplorerUrls: [TARGET_CHAIN.explorer],
              },
            ],
          })
          .catch(() => setState((s) => ({ ...s, error: "The network was not added." })));
      } else {
        setState((s) => ({ ...s, error: "The network switch was declined." }));
      }
    }
  }, []);

  return { ...state, connect, switchNetwork };
}
