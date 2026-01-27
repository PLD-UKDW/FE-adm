import Sidebar from "./SideBar";

export default function AppShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* SIDEBAR */}
            <Sidebar />

            {/* MAIN CONTENT */}
            <main className="flex-1 p-6">
                {children}
            </main>
        </div>
    );
}
