import { useState } from "react";
import type { NavItem } from "../../types";
import { DASHBOARD_URL } from "../../lib/links";

const navItems: NavItem[] = [
  { name: "How it works", href: "#how" },
  { name: "Features", href: "#features" },
  { name: "Pricing", href: "#pricing" },
  { name: "Team", href: "#team" },
  { name: "Contact", href: "#contact" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="nav">
      <div className="wrap nav-inner">
        <a href="#top" className="brand" aria-label="FloodPredix home">
          <img src="/logo.png" alt="" />
          FloodPredix
        </a>

        <nav className="nav-links" aria-label="Main">
          {navItems.map((item) => (
            <a key={item.name} href={item.href}>
              {item.name}
            </a>
          ))}
          <a className="btn btn-solid" href={DASHBOARD_URL}>
            Open dashboard
          </a>
        </nav>

        <button
          type="button"
          className="nav-toggle"
          aria-expanded={open}
          aria-controls="nav-sheet"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open && (
        <nav id="nav-sheet" className="nav-sheet" aria-label="Mobile">
          {navItems.map((item) => (
            <a key={item.name} href={item.href} onClick={() => setOpen(false)}>
              {item.name}
            </a>
          ))}
          <a className="btn btn-solid" href={DASHBOARD_URL}>
            Open dashboard
          </a>
        </nav>
      )}
    </header>
  );
}
