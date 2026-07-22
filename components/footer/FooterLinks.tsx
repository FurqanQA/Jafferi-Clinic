import Link from "next/link";

const links = [
  { href: "/about", label: "About" },
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export function FooterLinks() {
  return (
    <div className="flex flex-wrap gap-4 text-sm text-slate-600">
      {links.map((link) => (
        <Link key={link.href} href={link.href} className="transition hover:text-slate-900">
          {link.label}
        </Link>
      ))}
    </div>
  );
}
