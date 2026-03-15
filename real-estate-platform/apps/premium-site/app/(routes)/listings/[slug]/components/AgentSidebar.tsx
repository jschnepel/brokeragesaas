import Link from 'next/link';

interface AgentSidebarProps {
  agent: {
    name: string;
    title: string;
    photoUrl: string;
    brokerage: string;
    contact: { phone: string };
  };
  contactHref: string;
}

export function AgentSidebar({ agent, contactHref }: AgentSidebarProps) {
  return (
    <aside className="hidden lg:block lg:col-span-4">
      <div className="sticky top-24 space-y-4">
        <div
          className="bg-white border border-navy/8 p-6 md:p-8 shadow-lg shadow-black/5"
          style={{ borderRadius: 4 }}
        >
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-gold/30 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={agent.photoUrl} alt={agent.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="font-serif text-navy">{agent.name}</h3>
              <p className="text-[9px] uppercase tracking-widest text-navy/35">{agent.title}</p>
            </div>
          </div>
          <div className="space-y-2.5">
            <a
              href={`tel:${agent.contact.phone.replace(/[^+\d]/g, '')}`}
              className="block w-full text-center bg-gold text-white px-6 py-4 text-label uppercase tracking-md font-bold hover:bg-white hover:text-navy transition-all duration-500"
              style={{ borderRadius: 4 }}
            >
              Call {agent.contact.phone}
            </a>
            <Link
              href={contactHref}
              className="block w-full text-center border border-navy/20 text-navy px-6 py-4 text-label uppercase tracking-md font-bold hover:bg-navy hover:text-white transition-all duration-500"
              style={{ borderRadius: 4 }}
            >
              Schedule Showing
            </Link>
          </div>
          <p className="text-[10px] text-navy/25 text-center mt-4">{agent.brokerage}</p>
        </div>
      </div>
    </aside>
  );
}
