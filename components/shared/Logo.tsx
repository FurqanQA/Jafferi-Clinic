import Image from "next/image";
import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-3 ${className}`.trim()}>
      <Image src="/images/logo.png" alt="Jafferi Clinic logo" width={40} height={40} className="h-10 w-10 rounded-2xl object-contain" />
      <div className="leading-tight">
        <p className="text-[0.95rem] font-semibold uppercase tracking-[0.18em] text-slate-900">Jafferi</p>
        <p className="text-xs font-medium text-slate-500">Clinic OS</p>
      </div>
    </Link>
  );
}
