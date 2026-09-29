"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useUser } from "@/app/components/global/UserInfo";
import { ProfileIcon, SignOutCrossIcon } from "@/app/utils/icons";

export default function UserMenuPC() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useUser();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!isOpen) return;

    // Close when a pointer press or keyboard focus lands outside the menu.
    // pointerdown (not mousedown): iOS Safari does not reliably fire mouse
    // events on non-interactive elements, which matters for iPad at >= md.
    const closeIfOutside = (event: Event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setIsOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener("pointerdown", closeIfOutside);
    document.addEventListener("focusin", closeIfOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", closeIfOutside);
      document.removeEventListener("focusin", closeIfOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
  };

  if (!user) return <div className="text-white text-sm">Please Log-In</div>;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        ref={triggerRef}
        onClick={() => setIsOpen((open) => !open)}
        className="p-2 cursor-pointer"
        aria-label="Account menu"
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <ProfileIcon className="w-6 h-6" aria-hidden="true" focusable="false" />
      </button>
      <div
        id={panelId}
        hidden={!isOpen}
        className="absolute right-0 top-11 mt-2 w-[250px] bg-white shadow-lg rounded-xl border border-gray-200"
      >
        <div className="px-4 pt-4 pb-3 border-b border-gray-200">
          <p className="text-xs text-gray-500">Signed in as</p>
          <p className="text-sm font-semibold text-foreground mt-0.5">{user.email}</p>
        </div>
        <div className="px-4 py-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-red-500 cursor-pointer"
          >
            <SignOutCrossIcon height={18} width={16} aria-hidden="true" focusable="false" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}