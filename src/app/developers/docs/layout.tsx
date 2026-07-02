import { Navbar } from '@/components/layout/Navbar';
import { DocsSidebar } from '@/components/docs/DocsSidebar';

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-16 bg-bg-primary">
        <div className="max-w-7xl mx-auto flex">
          <DocsSidebar />
          <main className="flex-1 min-w-0 px-5 lg:px-12 py-8 max-w-3xl">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
