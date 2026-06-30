export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-bk-canvas)]">
      <div className="w-full max-w-[400px] flex flex-col gap-8">{children}</div>
    </div>
  );
}
