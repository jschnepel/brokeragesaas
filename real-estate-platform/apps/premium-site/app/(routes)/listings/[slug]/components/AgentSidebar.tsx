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
    <div className="col-span-12 lg:col-span-4 hidden lg:flex flex-col gap-3 md:gap-4">
      <div className="sticky top-24 space-y-3 md:space-y-4">
        {/* Agent Card — navy background matching community page stats card */}
        <div className="bg-navy p-6 flex flex-col">
          <span className="text-gold text-[9px] uppercase tracking-[0.3em] font-bold mb-5 block">Your Advisor</span>

          <div className="flex items-center gap-4 mb-6 pb-5 border-b border-white/10">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gold/30 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={agent.photoUrl} alt={agent.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="font-serif text-white text-lg">{agent.name}</h3>
              <p className="text-[10px] uppercase tracking-widest text-white/40">{agent.title}</p>
            </div>
          </div>

          <p className="text-white/40 text-xs mb-6">{agent.brokerage}</p>

          {/* CTA Buttons */}
          <div className="space-y-3 mt-auto">
            <a
              href={`tel:${agent.contact.phone.replace(/[^+\d]/g, '')}`}
              className="w-full bg-gold text-white py-4 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-white hover:text-navy transition-all flex items-center justify-center gap-2 group"
            >
              Call {agent.contact.phone}
            </a>
            <Link
              href={contactHref}
              className="w-full border border-white/20 text-white py-4 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-white hover:text-navy transition-all flex items-center justify-center gap-2"
            >
              Schedule Showing
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
