export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* Sidebar will be added later */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}