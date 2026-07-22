import { Container } from "@/components/layout/Container";
import { FooterLinks } from "@/components/footer/FooterLinks";
import { FooterSocial } from "@/components/footer/FooterSocial";
import { Logo } from "@/components/shared/Logo";

export function Footer() {
  return (
    <footer className="border-t border-slate-200/80 bg-slate-950 py-14 text-slate-300">
      <Container className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-md space-y-4">
          <Logo className="text-white" />
          <p className="text-sm leading-7 text-slate-400">
            The premium operating system for modern clinics that want to feel exceptional from first click to final visit.
          </p>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Product</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li>Operating system</li>
              <li>Care workflows</li>
              <li>Analytics</li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Company</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li>About</li>
              <li>Pricing</li>
              <li>Contact</li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Resources</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li>Privacy</li>
              <li>Terms</li>
              <li>Support</li>
            </ul>
          </div>
        </div>
      </Container>
      <Container className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
        <p>© 2026 Jafferi Systems. All rights reserved.</p>
        <FooterSocial />
      </Container>
    </footer>
  );
}
