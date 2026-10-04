import React, { useState } from 'react';
import { api } from '../../services/api';
import {
  X,
  Mail,
  HelpCircle,
  Shield,
  FileText,
  Send,
  CheckCircle2,
  AlertCircle,
  Building2,
  Heart,
  Clock,
  Check,
} from 'lucide-react';

interface CompanyInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'about' | 'contact' | 'faq' | 'terms' | 'privacy';
}

export const CompanyInfoModal: React.FC<CompanyInfoModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'about',
}) => {
  const [activeTab, setActiveTab] = useState<'about' | 'contact' | 'faq' | 'terms' | 'privacy'>(initialTab);

  // Contact Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);

  // FAQ Expanded State
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  if (!isOpen) return null;

  const handleSubmitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setContactError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    setContactError(null);

    try {
      const res = await api.submitContactMessage({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        subject: subject.trim(),
        message: message.trim(),
      });

      if (res.success) {
        setContactSuccess(true);
        setFullName('');
        setEmail('');
        setPhone('');
        setSubject('');
        setMessage('');
      } else {
        setContactError(res.message || 'Failed to send message. Please try again.');
      }
    } catch (err: any) {
      setContactError(err.message || 'Failed to send message.');
    } finally {
      setSubmitting(false);
    }
  };

  const faqs = [
    {
      q: 'How does MediArca eliminate clinic waiting room queues?',
      a: 'MediArca synchronizes patient queues in real-time. Patients receive an estimated consultation slot based on historical practitioner pace. When you arrive, scan the clinic QR code to confirm your presence without standing in line.',
    },
    {
      q: 'Can I book walk-in appointments if I do not have a smartphone?',
      a: 'Yes. Every participating clinic is equipped with a MediArca Front Desk Receptionist terminal where patients are assigned physical numbered tokens that update on display screens.',
    },
    {
      q: 'How are doctors and clinical facilities verified on the platform?',
      a: 'All practitioners undergo strict credential verification by the MediArca Governance Board against State Medical Council and National Medical Commission databases before public listing.',
    },
    {
      q: 'What is the refund and cancellation policy?',
      a: 'Consultations can be rescheduled or cancelled anytime before your turn is called. Any prepaid clinical fees are refunded to the original payment source within 24-48 business hours.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#e5e5ea] animate-slide-up max-h-[88vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#f0f0f0]">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#0066cc]" />
            <h3 className="font-bold text-base text-[#1d1d1f]">MediArca Healthcare System</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f5f5f7] flex items-center justify-center text-[#86868b] hover:text-[#1d1d1f] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Strip */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-[#f0f0f0] overflow-x-auto text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('about')}
            className={`py-2 px-3 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'about'
                ? 'border-[#0066cc] text-[#0066cc] font-semibold'
                : 'border-transparent text-[#86868b] hover:text-[#1d1d1f]'
            }`}
          >
            About Us
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('contact')}
            className={`py-2 px-3 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'contact'
                ? 'border-[#0066cc] text-[#0066cc] font-semibold'
                : 'border-transparent text-[#86868b] hover:text-[#1d1d1f]'
            }`}
          >
            Contact & Support
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('faq')}
            className={`py-2 px-3 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'faq'
                ? 'border-[#0066cc] text-[#0066cc] font-semibold'
                : 'border-transparent text-[#86868b] hover:text-[#1d1d1f]'
            }`}
          >
            FAQ
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`py-2 px-3 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'terms'
                ? 'border-[#0066cc] text-[#0066cc] font-semibold'
                : 'border-transparent text-[#86868b] hover:text-[#1d1d1f]'
            }`}
          >
            Terms of Service
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`py-2 px-3 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'privacy'
                ? 'border-[#0066cc] text-[#0066cc] font-semibold'
                : 'border-transparent text-[#86868b] hover:text-[#1d1d1f]'
            }`}
          >
            Privacy Policy
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* TAB 1: ABOUT US */}
          {activeTab === 'about' && (
            <div className="space-y-4 text-xs leading-relaxed text-[#1d1d1f]">
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/50 space-y-2">
                <h4 className="font-bold text-sm text-[#0066cc]">Zero Waiting Time. Full Clinical Dignity.</h4>
                <p className="text-[#86868b]">
                  MediArca was conceived to eradicate crowded, unpredictable OPD waiting rooms in India. By bridging mobile queue telemetry with clinic front-desk systems, patients receive high-accuracy arrival estimates and can wait wherever they are comfortable.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-[#f5f5f7] border border-[#e5e5ea] text-center space-y-1">
                  <Clock className="w-5 h-5 text-[#0066cc] mx-auto" />
                  <h5 className="font-bold text-xs">Paced Telemetry</h5>
                  <p className="text-[11px] text-[#86868b]">Dynamic consultation pace calculation per doctor</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#f5f5f7] border border-[#e5e5ea] text-center space-y-1">
                  <Shield className="w-5 h-5 text-emerald-600 mx-auto" />
                  <h5 className="font-bold text-xs">Verified Physicians</h5>
                  <p className="text-[11px] text-[#86868b]">Only verified practitioners and registered facilities</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#f5f5f7] border border-[#e5e5ea] text-center space-y-1">
                  <Heart className="w-5 h-5 text-rose-600 mx-auto" />
                  <h5 className="font-bold text-xs">Patient Centric</h5>
                  <p className="text-[11px] text-[#86868b]">Instant walk-in and online approvals synchronization</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONTACT US */}
          {activeTab === 'contact' && (
            <div className="space-y-4">
              {contactSuccess ? (
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <h4 className="font-bold text-sm text-emerald-800">Message Delivered</h4>
                  <p className="text-xs text-emerald-700">
                    Thank you for contacting MediArca. Our Clinical Operations desk will reach out within 1 business day.
                  </p>
                  <button
                    type="button"
                    onClick={() => setContactSuccess(false)}
                    className="mt-2 px-4 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-medium"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitContact} className="space-y-3">
                  {contactError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                      {contactError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#1d1d1f] mb-1">Your Full Name *</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="John Doe"
                        required
                        className="w-full px-3 py-2 rounded-xl border border-[#e5e5ea] text-xs focus:outline-none focus:border-[#0066cc]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#1d1d1f] mb-1">Email Address *</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@example.com"
                        required
                        className="w-full px-3 py-2 rounded-xl border border-[#e5e5ea] text-xs focus:outline-none focus:border-[#0066cc]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#1d1d1f] mb-1">Phone Number (Optional)</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 9876543210"
                        className="w-full px-3 py-2 rounded-xl border border-[#e5e5ea] text-xs focus:outline-none focus:border-[#0066cc]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#1d1d1f] mb-1">Inquiry Subject *</label>
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="e.g. Clinic partnership, Feedback"
                        required
                        className="w-full px-3 py-2 rounded-xl border border-[#e5e5ea] text-xs focus:outline-none focus:border-[#0066cc]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#1d1d1f] mb-1">Message Details *</label>
                    <textarea
                      rows={3}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Write your query or feedback here..."
                      required
                      className="w-full px-3 py-2 rounded-xl border border-[#e5e5ea] text-xs focus:outline-none focus:border-[#0066cc]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? 'Sending Message...' : 'Submit Support Inquiry'}</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: FAQ */}
          {activeTab === 'faq' && (
            <div className="space-y-2.5">
              {faqs.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-[#e5e5ea] p-4 bg-white space-y-2"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                    className="w-full flex items-center justify-between text-left font-semibold text-xs text-[#1d1d1f]"
                  >
                    <span>{item.q}</span>
                    <span className="text-[#0066cc] text-base">{expandedFaq === idx ? '−' : '+'}</span>
                  </button>
                  {expandedFaq === idx && (
                    <p className="text-xs text-[#86868b] leading-relaxed pt-1 border-t border-[#f0f0f0]">
                      {item.a}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: TERMS OF SERVICE */}
          {activeTab === 'terms' && (
            <div className="space-y-3 text-xs text-[#1d1d1f] leading-relaxed">
              <h4 className="font-bold text-sm">Terms of Clinical Engagement</h4>
              <p className="text-[#86868b]">
                By utilizing MediArca, you acknowledge that queue tokens represent scheduled estimates and not emergency medical appointments. In case of acute medical emergencies, patients should visit their nearest hospital trauma center immediately.
              </p>
              <h5 className="font-bold text-xs pt-1">Patient Responsibilities</h5>
              <p className="text-[#86868b]">
                Patients agree to provide accurate identification and contact details when reserving tokens. Multiple unexcused no-shows may limit instant queue reservation privileges.
              </p>
            </div>
          )}

          {/* TAB 5: PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <div className="space-y-3 text-xs text-[#1d1d1f] leading-relaxed">
              <h4 className="font-bold text-sm">Health Data Privacy & Security</h4>
              <p className="text-[#86868b]">
                MediArca conforms to national digital health guidelines and DISHA standards. Your clinical observations and prescriptions are end-to-end encrypted and shared exclusively between you and your consulting physician.
              </p>
              <h5 className="font-bold text-xs pt-1">No Third-Party Monetization</h5>
              <p className="text-[#86868b]">
                We do not sell patient data, clinical diagnoses, or prescription records to pharmaceutical advertisers or insurance brokers.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
