interface Props {
  children: React.ReactNode;
  email?: string | null;
}

export default function Layout({ children, email }: Props) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <span className="font-semibold text-indigo-600 tracking-tight">RSVP Manager</span>
        {email && <span className="text-sm text-slate-400">{email}</span>}
      </header>
      <main className="px-4 py-10">{children}</main>
    </div>
  );
}
