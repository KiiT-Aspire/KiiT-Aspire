"use client";
import { FiSettings, FiFileText, FiBarChart } from "react-icons/fi";
import { BsRobot } from "react-icons/bs";
import Link from "next/link";
import Image from "next/image";
import kiitLogo from "../../public/kiit-logo.jpg";

const Sidebar = () => {
  const menuItems = [
    { icon: <FiFileText size={24} />, label: "Interview", href: "/interview" },
    { icon: <FiBarChart size={24} />, label: "Results", href: "/results" },
    { icon: <FiSettings size={24} />, label: "Settings", href: "/settings" },
  ];

  return (
    <div
      className="fixed top-0 flex-col h-full bg-green-50 mt-2 ml-2 rounded-xl transition-all duration-300
                    w-16 md:w-64 p-2 md:p-8 border border-green-100"
    >
      <Image
        src={kiitLogo}
        alt="KiiT Aspire Logo"
        className="w-full h-auto mb-4 rounded-2xl"
      />
      <div className="hidden md:block font-extrabold text-3xl mb-15 text-green-800 text-center">
        KiiT Aspire
      </div>
      <div className="flex md:hidden justify-center items-center mt-4 mb-8 text-green-700">
        <BsRobot size={40} />
      </div>

      {/* Menu items */}
      <div className="flex flex-col items-center md:items-start justify-center gap-5 md:gap-10 font-semibold">
        {menuItems.map((item, index) => (
          <Link
            href={item.href}
            key={index}
            className="flex items-center justify-center md:justify-start gap-3 p-4 w-full rounded-lg transition-all duration-200 
            text-green-700 hover:bg-green-100 hover:shadow-md hover:text-green-800
            active:bg-green-200 active:scale-95"
          >
            {item.icon}
            <span className="hidden md:inline">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
