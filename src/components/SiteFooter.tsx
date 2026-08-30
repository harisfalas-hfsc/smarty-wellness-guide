import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Youtube } from "lucide-react";

const socialClass =
  "rounded-full border-2 border-primary p-2 text-primary transition-colors hover:bg-primary hover:text-primary-foreground";

export function SiteFooter() {
  return (
    <footer className="w-full bg-background px-4 pb-4 pt-4">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3">
        <div className="flex items-center gap-4">
          <a
            href="https://www.facebook.com/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            className={socialClass}
          >
            <Facebook className="h-5 w-5" />
          </a>
          <a
            href="https://www.instagram.com/smartyworkout"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className={socialClass}
          >
            <Instagram className="h-5 w-5" />
          </a>
          <a
            href="https://www.tiktok.com/@smarty.diet"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="TikTok"
            className={socialClass}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
            </svg>
          </a>
          <a
            href="https://www.youtube.com/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="YouTube"
            className={socialClass}
          >
            <Youtube className="h-5 w-5" />
          </a>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground sm:text-sm">
          <Link to="/" className="transition-colors hover:text-primary">Wellness</Link>
          <span className="text-muted-foreground/40">·</span>
          <a href="https://smartyworkout.com/privacy" className="transition-colors hover:text-primary">Privacy</a>
          <span className="text-muted-foreground/40">·</span>
          <a href="https://smartyworkout.com/terms" className="transition-colors hover:text-primary">
            <span className="md:hidden">T&amp;Cs</span>
            <span className="hidden md:inline">Terms</span>
          </a>
          <span className="text-muted-foreground/40">·</span>
          <a href="https://smartyworkout.com/disclaimer" className="transition-colors hover:text-primary">Disclaimer</a>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} <span className="font-semibold text-primary">SmartyWellness</span>
        </p>
      </div>
    </footer>
  );
}