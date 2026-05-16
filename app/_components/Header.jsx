"use client";
import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useUser, UserButton } from "@clerk/nextjs";
import Link from "next/link";

const NAV_LINKS = [
  { label: "Features",  href: "#features" },
  { label: "Pricing",   href: "#pricing"  },
  { label: "Dashboard", href: "/dashboard" },
];

function Header() {
  const { user, isSignedIn } = useUser();
  return (
    <header className="w-full border-b bg-white/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-14 flex items-center justify-between">

        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image src="/copilot.svg" alt="FinanSmart logo" width={26} height={26} />
          <span className="text-green-800 font-bold text-lg tracking-tight">FinanSmart</span>
          <span className="hidden sm:inline-block text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200 rounded-full px-2 py-0.5 ml-1">
            B2B
          </span>
        </Link>

        {/* Nav links — desktop only */}
        <nav className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map(({ label, href }) => (
            <Link key={label} href={href} className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
              {label}
            </Link>
          ))}
        </nav>

        {/* Auth actions */}
        {isSignedIn ? (
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="outline" className="rounded-full h-8 px-4 text-xs font-semibold">Dashboard</Button>
            </Link>
            <UserButton />
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link href="/sign-in">
              <Button variant="ghost" className="rounded-full h-8 px-4 text-xs font-semibold text-slate-600">Sign In</Button>
            </Link>
            <Link href="/sign-in">
              <Button className="rounded-full h-8 px-4 text-xs font-semibold bg-green-800 hover:bg-green-700 text-white">
                Get Started Free
              </Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
