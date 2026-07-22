import Link from "next/link";

const links = [
  { href: "/about", label: "About" },
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact", label: "Contact" },
];

export function NavLinks() {
  return (
    <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
