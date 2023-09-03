"use client";

import Link from "next/link";
import React from "react";

export default function Home() {
  return (
    <main className="overscroll-y-contain">
      Home
      <div>
        <Link href="/sample">
          <strong>Sample Policy</strong>
        </Link>
      </div>
    </main>
  );
}