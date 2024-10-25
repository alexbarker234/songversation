"use client";
import Autocomplete from "@/components/newAuto";

export default function Test() {
  return (
    <div className="mt-20 flex h-svh w-lvw items-center">
      <Autocomplete
        options={[
          { id: "1", label: "abc" },
          { id: "2", label: "bcd" },
          { id: "3", label: "cde" },
          { id: "4", label: "def" },
          { id: "5", label: "efg" },
          { id: "6", label: "fgh" },
          { id: "7", label: "ghi" },
          { id: "8", label: "hij" },
          { id: "9", label: "ijk" },
          { id: "10", label: "jkl" },
          { id: "11", label: "klm" },
          { id: "12", label: "lmn" },
          { id: "13", label: "mno" },
          { id: "14", label: "nop" },
          { id: "15", label: "opq" },
          { id: "16", label: "pqr" },
          { id: "17", label: "qrs" },
          { id: "18", label: "rst" }
        ]}
        selected={null}
        onSelect={() => {}}
        className="w-full"
      />
    </div>
  );
}
