import { AtSign, Globe, Sparkles } from "lucide-react";

const socials = [
  { label: "Instagram", icon: AtSign },
  { label: "LinkedIn", icon: Globe },
];

export function FooterSocial() {
  return (
    <div className="flex items-center gap-3">
      {socials.map((social) => {
        const Icon = social.icon;
        return (
          <a
            key={social.label}
            href="#"
            aria-label={social.label}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-sky-400 hover:text-sky-600"
          >
            <Icon className="h-4 w-4" />
          </a>
        );
      })}
      <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
        <Sparkles className="h-4 w-4 text-sky-600" />
        Privacy-first care
      </div>
    </div>
  );
}
