import Link from "next/link";
import { Sparkles } from "lucide-react";

const COLUMNS = [
  {
    title: "Discover",
    links: [
      { href: "/outfits", label: "Outfit Generator" },
      { href: "/colors", label: "Color Recommendations" },
      { href: "/jeans", label: "Jeans Stylist" },
      { href: "/shirts", label: "Shirt Stylist" },
      { href: "/tshirts", label: "T-shirt Stylist" },
    ],
  },
  {
    title: "Platform",
    links: [
      { href: "/look-builder", label: "Look Builder" },
      { href: "/shopping", label: "Shopping Mode" },
      { href: "/chat", label: "AI Style Chat" },
      { href: "/fashion-guide", label: "Fashion Guide" },
      { href: "/blog", label: "Blog" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="container grid grid-cols-2 gap-10 py-16 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <Link href="/" className="flex items-center gap-2 font-serif text-lg font-semibold">
            <Sparkles className="h-5 w-5 text-accent" />
            STYLEAI
          </Link>
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            AI personal stylist and virtual try-on platform. Discover what looks best on you.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h4 className="text-sm font-semibold">{col.title}</h4>
            <ul className="mt-4 space-y-3">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} STYLEAI. All rights reserved.
      </div>
    </footer>
  );
}
