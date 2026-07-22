import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";

export default function MarketingNotFound() {
  return (
    <div className="py-24">
      <Container className="max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-600">404</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">This page isn’t available.</h1>
        <p className="mt-4 text-lg text-slate-600">The page you’re looking for may have moved or no longer exists.</p>
        <Link href="/" className="mt-8 inline-flex">
          <Button className="rounded-full bg-slate-900 text-white">Back home</Button>
        </Link>
      </Container>
    </div>
  );
}
