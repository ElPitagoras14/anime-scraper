import Navbar from "@/components/navbar";

export default function WebLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Navbar />
      <main className="px-24 py-8">{children}</main>
    </>
  );
}
