export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative z-[1] min-h-screen flex items-center justify-center p-4">
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
