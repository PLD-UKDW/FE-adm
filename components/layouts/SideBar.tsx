"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Home, FileText, Users, ChevronDown, ChevronUp, LogOut } from "lucide-react";
import clsx from "clsx";

export default function Sidebar() {
  const pathname = usePathname();

  // Untuk handle dropdown
  const [openInput, setOpenInput] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    sessionStorage.removeItem("popupShown"); // Reset popup flag saat logout
    window.location.href = "/login";
  };

  return (
    <aside className="w-64 bg-[#108607] text-white flex flex-col shadow-xl min-h-screen">
      {/* LOGO */}
      <Image src="/logo/logould.png" width={100} height={100} alt="Logo" className="invert brightness-0 items-center mx-auto my-4" />
      <div className="p-6 border-b border-white/20 text-center text-xl font-bold">ULD UKDW</div>

      {/* MENU */}
      <nav className="flex-1 p-4 space-y-2">
        {/* Dashboard */}
        <Link href="/admin/dashboard" className={clsx("flex items-center gap-3 px-4 py-3 rounded-lg transition", pathname === "/dashboard" ? "bg-white text-[#108607] font-semibold" : "hover:bg-white/10")}>
          <Home className="w-5 h-5" />
          Dashboard
        </Link>

        {/* INPUT MENU DROPDOWN */}
        <div>
          <button
            onClick={() => setOpenInput(!openInput)}
            className={clsx("flex items-center justify-between w-full px-4 py-3 rounded-lg transition", pathname.startsWith("/dashboard/input") ? "bg-white text-[#108607] font-semibold" : "hover:bg-white/10")}
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5" />
              Input
            </div>
            {openInput ? <ChevronUp /> : <ChevronDown />}
          </button>

          {/* SUBMENU */}
          {openInput && (
            <div className="ml-10 mt-2 space-y-2">
              {/* Berita */}
              <Link href="/admin/dashboard/input/berita" className={clsx("block px-3 py-2 rounded-md text-sm transition", pathname === "/dashboard/input/berita" ? "bg-white text-[#108607] font-semibold" : "hover:bg-white/20")}>
                Berita
              </Link>

              {/* Data Mahasiswa */}
              <Link href="/admin/dashboard/input/mahasiswa" className={clsx("block px-3 py-2 rounded-md text-sm transition", pathname === "/dashboard/input/mahasiswa" ? "bg-white text-[#108607] font-semibold" : "hover:bg-white/20")}>
                Data Mahasiswa
              </Link>

              {/* Tambah kategori disabilitas */}
              <Link
                href="/admin/dashboard/input/kategori-disabilitas"
                className={clsx("block px-3 py-2 rounded-md text-sm transition", pathname === "/dashboard/input/kategori-disabilitas" ? "bg-white text-[#108607] font-semibold" : "hover:bg-white/20")}
              >
                Kategori Disabilitas
              </Link>
              {/* Soal Tes */}
              <Link href="/admin/dashboard/input/pmjd" className={clsx("block px-3 py-2 rounded-md text-sm transition", pathname === "/dashboard/input/mahasiswa" ? "bg-white text-[#108607] font-semibold" : "hover:bg-white/20")}>
                Soal Tes
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* LOGOUT */}
      <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-4 text-white bg-red-600 hover:bg-red-700 transition">
        <LogOut className="w-5 h-5" />
        Logout
      </button>
    </aside>
  );
}
