import React, { useState } from 'react';
import {
  HelpCircle,
  Search,
  Book,
  MessageCircle,
  Mail,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  Play,
  Lightbulb
} from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const Help: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const faqs: FAQItem[] = [
    {
      question: 'How does the journal matching algorithm work?',
      answer: 'Our algorithm analyzes your manuscript\'s title and abstract, extracting key terms and concepts. It then compares these against journal scope definitions, subject areas, and historical publication patterns. The match score considers keyword relevance, subject alignment, journal metrics (SJR, H-Index), and scope compatibility.'
    },
    {
      question: 'What file formats are supported for manuscript upload?',
      answer: 'We currently support PDF (.pdf), Microsoft Word (.doc, .docx) formats. The maximum file size is 20MB. For best results, ensure your document includes a clear title and abstract section.'
    },
    {
      question: 'How accurate are the journal recommendations?',
      answer: 'Our matching accuracy depends on the quality of your abstract and the comprehensiveness of journal scope definitions in our database. Typically, manuscripts with detailed abstracts achieve 70-90% accuracy in top recommendations. We continuously improve our algorithm based on user feedback.'
    },
    {
      question: 'Can I filter journals by specific criteria?',
      answer: 'Yes! After receiving recommendations, you can filter by SJR Quartile (Q1-Q4), H-Index range, Open Access status, indexed databases, and publisher. Use the filter panel on the results page to refine your matches.'
    },
    {
      question: 'How do I track my submission status?',
      answer: 'Visit the Submissions page to see all your tracked submissions. You can manually add submission details or link them from analyzed manuscripts. We\'ll help you track status updates, though actual submission must be done through the journal\'s submission system.'
    },
    {
      question: 'What journal metrics are displayed?',
      answer: 'We display SJR (SCImago Journal Rank) Score, SJR Quartile, H-Index, and Citations per Document. These metrics are sourced from SCImago and updated periodically. Note that Impact Factor requires a separate subscription to Clarivate.'
    },
  ];

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const quickLinks = [
    { label: 'Getting Started Guide', icon: Book, href: '#' },
    { label: 'Video Tutorials', icon: Play, href: '#' },
    { label: 'API Documentation', icon: FileText, href: '#' },
    { label: 'Best Practices', icon: Lightbulb, href: '#' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-violet-500 to-pink-500 rounded-lg">
          <HelpCircle className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Help Center</h1>
          <p className="text-sm text-gray-500">Find answers and get support</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-gradient-to-r from-violet-500 to-pink-500 rounded-xl p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-white mb-4 text-center">How can we help you?</h2>
        <div className="max-w-xl mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-white/50"
          />
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {quickLinks.map((link, index) => (
          <a
            key={index}
            href={link.href}
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-200 hover:border-violet-300 hover:shadow-md transition-all group"
          >
            <div className="p-3 bg-violet-100 rounded-lg group-hover:bg-violet-200 transition-colors">
              <link.icon className="h-6 w-6 text-violet-600" />
            </div>
            <span className="text-sm font-medium text-gray-900 text-center">{link.label}</span>
          </a>
        ))}
      </div>

      {/* FAQs */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {filteredFaqs.map((faq, index) => (
            <div key={index} className="border border-gray-100 rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-900 pr-4">{faq.question}</span>
                {expandedFaq === index ? (
                  <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                )}
              </button>
              {expandedFaq === index && (
                <div className="px-4 pb-4">
                  <p className="text-gray-600 text-sm leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact Support */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-violet-100 rounded-lg">
              <MessageCircle className="h-5 w-5 text-violet-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Live Chat</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Chat with our support team for quick assistance. Available Mon-Fri, 9AM-6PM IST.
          </p>
          <button className="w-full py-2 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-700 transition-colors">
            Start Chat
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-pink-100 rounded-lg">
              <Mail className="h-5 w-5 text-pink-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Email Support</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Send us an email and we'll respond within 24 hours.
          </p>
          <a
            href="mailto:support@kriyadocs.com"
            className="block w-full py-2 text-center border-2 border-violet-600 text-violet-600 font-medium rounded-lg hover:bg-violet-50 transition-colors"
          >
            support@kriyadocs.com
          </a>
        </div>
      </div>

      {/* Documentation Link */}
      <div className="bg-gradient-to-r from-violet-50 to-pink-50 rounded-xl border border-violet-200 p-6">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-violet-100 rounded-lg flex-shrink-0">
            <Book className="h-6 w-6 text-violet-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">Looking for detailed documentation?</h3>
            <p className="text-sm text-gray-600 mb-3">
              Visit our comprehensive documentation for detailed guides, API references, and integration tutorials.
            </p>
            <a
              href="#"
              className="inline-flex items-center gap-2 text-violet-600 hover:text-violet-700 font-medium text-sm"
            >
              View Documentation
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;
