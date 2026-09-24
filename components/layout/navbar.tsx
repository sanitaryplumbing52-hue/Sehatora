"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Menu, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/outfits", label: "Outfit Generator" },
  { href: "/colors", label: "Colors" },
  { href: "/jeans", label: "Jeans" },
  { href: "/look-builder", label: "Look Builder" },
  { href: "/shopping", label: "Shopping" },
  { href: "/chat", label: "Ask AI" },
];

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-serif text-lg font-semibold tracking-tight">
          <Sparkles className="h-5 w-5 text-accent" />
          STYLEAI
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm text-muted-foreground transition-colors hover:text-foreground",
                pathname === link.href && "text-foreground font-medium"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full border border-border px-2 py-1.5 pr-3">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback>{session.user.name?.[0] ?? "U"}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{session.user.name?.split(" ")[0]}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </DropdownMenuItem>
                {session.user.role === "ADMIN" && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">Admin Panel</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => signOut({ callbackUrl: "/" })}>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/auth/signin">Sign in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/try">Try My Style</Link>
              </Button>
            </>
          )}
        </div>

        <button className="lg:hidden" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background px-6 pb-6 lg:hidden">
          <nav className="flex flex-col gap-4 pt-4">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="text-sm text-muted-foreground">
                {link.label}
              </Link>
            ))}
            <DropdownMenuSeparator />
            {session?.user ? (
              <>
                <Link href="/dashboard" onClick={() => setOpen(false)} className="text-sm font-medium">
                  Dashboard
                </Link>
                <button onClick={() => signOut({ callbackUrl: "/" })} className="text-left text-sm font-medium">
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/signin" onClick={() => setOpen(false)} className="text-sm font-medium">
                  Sign in
                </Link>
                <Button asChild>
                  <Link href="/try">Try My Style</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
