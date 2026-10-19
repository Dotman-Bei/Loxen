import type { Metadata } from "next";
import { Suspense } from "react";
import { Registry } from "@/components/app/Registry";

export const metadata: Metadata = { title: "Registry" };

export default function RegistryPage() {
  return (
    <Suspense>
      <Registry />
    </Suspense>
  );
}
