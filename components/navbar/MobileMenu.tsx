import Link from "next/link";

const links = [
  { href: "/about", label: "About" },
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact", label: "Contact" },
];

export function MobileMenu() {
  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-xl md:hidden">
      {links.map((link) => (
        <Link key={link.href} href={link.href} className="text-sm font-medium text-slate-700">
          {link.label}
        </Link>
      ))}
      <Link href="/book-appointment" className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
        Book appointment
      </Link>
    </div>
  );
}
