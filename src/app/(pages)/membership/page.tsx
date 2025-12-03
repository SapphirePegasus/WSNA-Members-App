"use client";

import MembershipCard from "@/app/components/global/MembershipCard";
import { useState } from "react";

export default function Membership() {
  const [activeTab, setActiveTab] = useState("card");

  return (
    <div>
      <div className="px-4 pt-2 flex gap-6 text-sm font-medium overflow-x-auto scrollbar-hidden whitespace-nowrap">
        {["card", "dues", "contact", "password"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-2 cursor-pointer ${activeTab === tab
              ? "border-b-4 border-black text-black font-medium text-[16px]"
              : "border-b-4 border-white text-gray-500 font-medium text-[16px]"
              }`}
          >
            {tab === "card" && "Membership Card"}
            {tab === "dues" && "Dues"}
            {tab === "contact" && "Contact Details"}
            {tab === "password" && "Password"}
          </button>
        ))}
      </div>
      <div className="w-full mx-auto">
        {activeTab === "card" && <MembershipCard />}

        {activeTab === "dues" && (
          <div className="pt-6 text-gray-600">Dues</div>
        )}

        {activeTab === "contact" && (
          <div className="pt-6 text-gray-600">Contact details</div>
        )}

        {activeTab === "password" && (
          <div className="pt-6 text-gray-600">Password</div>
        )}
      </div>
    </div>
  );
}
