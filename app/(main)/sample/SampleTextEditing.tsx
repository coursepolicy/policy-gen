import { Button } from "@/components/ui/button";
import React from "react";

export default function SampleTextEditing({
  noChanges,
  handleUpdatePolicy,
}: {
  noChanges: boolean;
  handleUpdatePolicy: () => void;
}) {
  return (
    <div className="ml-[8px]">
      {noChanges ? (
        <Button
          asChild
          className="inline-flex h-9 w-[92px] items-center justify-center gap-1.5 rounded-[3px] bg-coursePolicyGreen px-3 py-1.5 hover:bg-coursePolicyHoverGreen"
        >
          <a
            href={process.env.SAMPLE_PDF_URL}
            target="_blank"
            className="text-center text-xs font-bold leading-normal text-white"
          >
            View PDF
          </a>
        </Button>
      ) : (
        <Button
          asChild
          className="inline-flex h-9 w-[92px] items-center justify-center gap-1.5 rounded-[3px] bg-coursePolicyGreen px-3 py-1.5 hover:bg-coursePolicyHoverGreen"
        >
          <a
            onClick={handleUpdatePolicy}
            className="text-center text-xs font-bold leading-normal text-white"
          >
            Save Policy
          </a>
        </Button>
      )}
    </div>
  );
}