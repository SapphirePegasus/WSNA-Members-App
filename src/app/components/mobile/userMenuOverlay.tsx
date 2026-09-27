"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useUser } from "@/app/components/global/UserInfo";
import {
  CrossIcon,
  ProfileIcon,
  MembershipCardIcon,
  SignOutCrossIcon,
} from "@/app/utils/icons";

interface UserMenuTriggerProps {
  onOpen: () => void;
}

export function UserMenuTrigger({ onOpen }: UserMenuTriggerProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="p-2"
      aria-haspopup="dialog"
      aria-label="Open account menu"
    >
      <ProfileIcon className="w-6 h-6" />
    </button>
  );
}

interface UserMenuPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserMenuPanel({ isOpen, onClose }: UserMenuPanelProps) {
  const { user, logout } = useUser();
  const router = useRouter();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen || typeof document === "undefined") return null;

  const handleMembership = () => {
    onClose();
    router.push("/membership");
  };

  const handleLogout = async () => {
    onClose();
    await logout();
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Account menu"
      className="fixed inset-0 z-50 flex flex-col bg-[#FAFAFA]"
    >
      {/* Status-bar guard: a black-translucent status bar always draws white
          glyphs, so the area beneath it must be dark, not white. */}
      <div
        aria-hidden="true"
        className="shrink-0 bg-primary"
        style={{ height: "env(safe-area-inset-top, 0px)" }}
      />

      {/* Title bar: 48px */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-gray-200 bg-white pl-4">
        <h2 className="text-2xl font-bold text-foreground">My WSNA</h2>
        <button
          type="button"
          ref={closeButtonRef}
          onClick={onClose}
          className="flex h-12 w-12 items-center justify-center"
          aria-label="Close account menu"
        >
          <CrossIcon className="h-5 w-5" />
        </button>
      </div>

      {/* My membership: 32px above and below */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-4 py-8">
        <button
          type="button"
          onClick={handleMembership}
          className="flex w-full items-center gap-4 text-left"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#F4F4F5]">
            <MembershipCardIcon className="h-[18.52px] w-6" />
          </span>
          <span className="text-xl font-semibold text-foreground">My membership</span>
        </button>
      </div>

      {/* Signed in as */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-4 py-6">
        <p className="text-xs font-medium text-gray-500">Signed in as</p>
        <p className="mt-1 text-base font-medium text-foreground">
          {user ? user.email : "Please login"}
        </p>
      </div>

      {/* Gray lower area: Sign out sits fully on gray, down to the screen edge */}
      <div
        className="flex-1 px-4 pt-6"
        style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom, 0px))" }}
      >
        <button
          type="button"
          onClick={handleLogout}
          className="flex min-h-12 items-center gap-2 text-base text-danger-red"
        >
          <SignOutCrossIcon className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>,
    document.body
  );
}