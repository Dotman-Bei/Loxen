import type { Metadata } from "next";
import { Suspense } from "react";
import { Workbench } from "@/components/app/Workbench";

export const metadata: Metadata = { title: "Workbench" };

export default function WorkbenchPage() {
  return (
    <Suspense>
      <Workbench />
    </Suspense>
  );
}
