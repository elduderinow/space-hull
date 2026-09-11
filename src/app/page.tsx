"use client";

import dynamic from "next/dynamic";

const SpaceHullScene = dynamic(() => import("@/components/SpaceHullScene"), {
  ssr: false,
  loading: () => <div className="status">Boarding…</div>,
});

export default function Home() {
  return (
    <main>
      <SpaceHullScene />
    </main>
  );
}
