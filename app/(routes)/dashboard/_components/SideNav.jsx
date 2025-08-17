// ✅ New imports
import React, { useEffect, useState } from "react"; // <-- useState add kiya
import Image from "next/image";
import {
  LayoutGrid,
  PiggyBank,
  ReceiptText,
  ShieldCheck,
  CircleDollarSign,
  Menu, // <-- Hamburger icon import
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import Link from "next/link";

function SideNav() {
  const [isOpen, setIsOpen] = useState(false); // <-- sidebar toggle state

  const menuList = [
    {
      id: 1,
      name: "Dashboard",
      icon: LayoutGrid,
      path: "/dashboard",
    },
    {
      id: 2,
      name: "Incomes",
      icon: CircleDollarSign,
      path: "/dashboard/incomes",
    },
    {
      id: 3,
      name: "Budgets",
      icon: PiggyBank,
      path: "/dashboard/budgets",
    },
    {
      id: 4,
      name: "Expenses",
      icon: ReceiptText,
      path: "/dashboard/expenses",
    },
    {
      id: 5,
      name: "Upgrade",
      icon: ShieldCheck,
      path: "/dashboard/upgrade",
    },
  ];

  const path = usePathname();

  useEffect(() => {
    console.log(path);
  }, [path]);

  return (
    <>
      {/* ✅ Hamburger Button (only visible on mobile) */}
      <button
        className="md:hidden p-4"
        onClick={() => setIsOpen(true)}
      >
        <Menu className="w-6 h-6 text-green-800" />
      </button>

      {/* ✅ Sidebar (hidden on small screen, normal on md+) */}
      <div
        className={`
          fixed top-0 left-0 h-full w-64 bg-white border shadow-sm z-50
          transform transition-transform duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:static
        `}
      >
        <div className="h-screen p-5">
          <div className="flex flex-row items-center justify-between">
            <div className="flex flex-row items-center gap-2">
              <Image src={"./copilot.svg"} alt="logo" width={40} height={25} />
              <span className="text-green-800 font-bold text-xl">
                FinanSmart
              </span>
            </div>

            {/* ✅ Close button (only mobile) */}
            <button
              className="md:hidden"
              onClick={() => setIsOpen(false)}
            >
              ✖
            </button>
          </div>

          {/* ✅ Menu List */}
          <div className="mt-5">
            {menuList.map((menu, index) => (
              <Link href={menu.path} key={index} onClick={() => setIsOpen(false)}>
                <h2
                  className={`flex gap-2 items-center
                        text-gray-500 font-medium
                        mb-2
                        p-4 cursor-pointer rounded-full
                        hover:text-green-800 hover:bg-green-100
                        ${path == menu.path && "text-green-800 bg-green-100"}
                        `}
                >
                  <menu.icon />
                  {menu.name}
                </h2>
              </Link>
            ))}
          </div>

          {/* ✅ Profile section */}
          {/* <div className="absolute bottom-10 left-5 flex gap-2 items-center">
            <UserButton />
            <span>Profile</span>
          </div> */}
        </div>
      </div>

      {/* ✅ Overlay (only on mobile when sidebar open) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

export default SideNav;
