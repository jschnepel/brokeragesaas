import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import SEOHead from '../components/shared/SEOHead';
import { agentSchema } from '../utils/structuredData';

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'buying',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#111] font-sans page-zoom-85">
      <SEOHead
        title="Contact Yong Choi | Schedule a Consultation"
        description="Get in touch with Yong Choi for luxury real estate inquiries in Scottsdale, Paradise Valley, and the greater Phoenix metro area."
        structuredData={agentSchema()}
      />
      <Navigation variant="solid" />

      {/* Header */}
      <section className="pt-32 pb-16 bg-white border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-24 text-center">
          <span className="text-[#Bfa67a] text-[11px] uppercase tracking-[0.4em] font-bold block mb-4">Get in Touch</span>
          <h1 className="text-4xl md:text-6xl font-serif text-[#0C1C2E] leading-tight">
            Let's <span className="italic font-light">Connect</span>
          </h1>
          <p className="text-gray-500 text-lg mt-4 max-w-xl mx-auto">
            Whether you're ready to buy, sell, or just want to explore the market, I'm here to help.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20">
        <div className="max-w-[1200px] mx-auto px-8 lg:px-24">
          <div className="grid grid-cols-12 gap-12 lg:gap-16">

            {/* Contact Info */}
            <div className="col-span-12 lg:col-span-5">
              <div className="bg-[#0C1C2E] p-8 lg:p-10 text-white">
                <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.3em] font-bold block mb-6">Contact Information</span>

                <div className="space-y-6">
                  <a href="tel:+19093765494" className="flex items-start gap-4 group">
                    <div className="w-10 h-10 bg-[#Bfa67a]/20 flex items-center justify-center flex-shrink-0">
                      <Phone size={18} className="text-[#Bfa67a]" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Phone</p>
                      <p className="text-white group-hover:text-[#Bfa67a] transition-colors">(909) 376-5494</p>
                    </div>
                  </a>

                  <a href="mailto:yong.choi@russlyon.com" className="flex items-start gap-4 group">
                    <div className="w-10 h-10 bg-[#Bfa67a]/20 flex items-center justify-center flex-shrink-0">
                      <Mail size={18} className="text-[#Bfa67a]" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Email</p>
                      <p className="text-white group-hover:text-[#Bfa67a] transition-colors">yong.choi@russlyon.com</p>
                    </div>
                  </a>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-[#Bfa67a]/20 flex items-center justify-center flex-shrink-0">
                      <MapPin size={18} className="text-[#Bfa67a]" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Office</p>
                      <p className="text-white">Russ Lyon Sotheby's International Realty</p>
                      <p className="text-white/60 text-sm mt-1">North Scottsdale, AZ</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-[#Bfa67a]/20 flex items-center justify-center flex-shrink-0">
                      <Clock size={18} className="text-[#Bfa67a]" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Availability</p>
                      <p className="text-white">Mon - Sat: 8am - 7pm</p>
                      <p className="text-white/60 text-sm mt-1">Sun: By appointment</p>
                    </div>
                  </div>
                </div>

                <div className="mt-10 pt-8 border-t border-white/10">
                  <p className="text-white/40 text-[10px] uppercase tracking-widest mb-3">Quick Actions</p>
                  <div className="space-y-3">
                    <Link
                      to="/insights"
                      className="flex items-center justify-between py-3 border-b border-white/10 text-white/80 hover:text-[#Bfa67a] transition-colors text-sm"
                    >
                      View Market Reports
                      <ArrowRight size={14} />
                    </Link>
                    <Link
                      to="/communities"
                      className="flex items-center justify-between py-3 border-b border-white/10 text-white/80 hover:text-[#Bfa67a] transition-colors text-sm"
                    >
                      Explore Communities
                      <ArrowRight size={14} />
                    </Link>
                    <Link
                      to="/listings"
                      className="flex items-center justify-between py-3 text-white/80 hover:text-[#Bfa67a] transition-colors text-sm"
                    >
                      Browse Listings
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="col-span-12 lg:col-span-7">
              {submitted ? (
                <div className="bg-white p-12 shadow-lg shadow-black/5 text-center">
                  <CheckCircle size={48} className="text-emerald-500 mx-auto mb-6" />
                  <h3 className="text-2xl font-serif text-[#0C1C2E] mb-3">Message Sent</h3>
                  <p className="text-gray-500 mb-8 max-w-md mx-auto">
                    Thank you for reaching out. I'll review your message and get back to you within 24 hours.
                  </p>
                  <button
                    onClick={() => { setSubmitted(false); setFormData({ name: '', email: '', phone: '', subject: 'buying', message: '' }); }}
                    className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.25em] font-bold hover:text-[#0C1C2E] transition-colors"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="bg-white p-8 lg:p-10 shadow-lg shadow-black/5">
                  <h2 className="text-2xl font-serif text-[#0C1C2E] mb-2">Send a Message</h2>
                  <p className="text-gray-400 text-sm mb-8">All fields marked with * are required.</p>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="w-full border-b border-gray-200 py-3 text-[#0C1C2E] outline-none focus:border-[#Bfa67a] transition-colors bg-transparent"
                          placeholder="Your name"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">
                          Phone
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="w-full border-b border-gray-200 py-3 text-[#0C1C2E] outline-none focus:border-[#Bfa67a] transition-colors bg-transparent"
                          placeholder="(xxx) xxx-xxxx"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full border-b border-gray-200 py-3 text-[#0C1C2E] outline-none focus:border-[#Bfa67a] transition-colors bg-transparent"
                        placeholder="your@email.com"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">
                        I'm Interested In
                      </label>
                      <select
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        className="w-full border-b border-gray-200 py-3 text-[#0C1C2E] outline-none focus:border-[#Bfa67a] transition-colors bg-transparent"
                      >
                        <option value="buying">Buying a Property</option>
                        <option value="selling">Selling a Property</option>
                        <option value="valuation">Home Valuation</option>
                        <option value="relocation">Relocating to Arizona</option>
                        <option value="market">Market Information</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">
                        Message *
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={5}
                        className="w-full border-b border-gray-200 py-3 text-[#0C1C2E] outline-none focus:border-[#Bfa67a] transition-colors bg-transparent resize-none"
                        placeholder="Tell me about what you're looking for..."
                      />
                    </div>

                    <button
                      type="submit"
                      className="group w-full bg-[#0C1C2E] text-white py-4 text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-[#Bfa67a] transition-all flex items-center justify-center gap-2"
                    >
                      Send Message
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>

                  <p className="text-gray-300 text-xs mt-4 text-center">
                    Your information is kept confidential and never shared with third parties.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ContactPage;
