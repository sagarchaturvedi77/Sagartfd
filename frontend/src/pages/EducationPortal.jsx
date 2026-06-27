import React, { useState } from 'react';

const EducationPortal = () => {
  // Step 1: User Registration Data State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contactNo: '',
    whatsappNo: ''
  });

  // Step 2: System States (Plan selection, modals, success alert)
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // 3 Premium Plans Configuration
  const plans = [
    {
      id: 1,
      title: "Basic Learner",
      price: "1,999",
      features: [
        "Foundation of Indian Stock Market",
        "Daily Market Observation Sheets",
        "Basic Technical Analysis Setup",
        "100% Focused on Paper Trading Practice"
      ],
      bg: "from-slate-800 to-slate-900"
    },
    {
      id: 2,
      title: "Pro Optionist",
      price: "4,999",
      features: [
        "Advanced Derivatives & Options Strategies",
        "Live Strategy Breakdown Webinars",
        "Weekly Nifty/Bank Nifty Case Studies",
        "Virtual Practice & Backtesting Guides"
      ],
      bg: "from-blue-950 to-slate-900",
      popular: true
    },
    {
      id: 3,
      title: "Elite Masterclass",
      price: "9,999",
      features: [
        "Institutional Grade Research Training",
        "Advanced Portfolio Hedging Concepts",
        "Direct Educational Q&A Support",
        "Comprehensive Risk Management Blueprints"
      ],
      bg: "from-amber-950 to-slate-900"
    }
  ];

  const handlePlanClick = (plan) => {
    setSelectedPlan(plan);
    setShowFormModal(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setShowFormModal(false);
    setShowAgreementModal(true);
  };

  const const handleAgreementApprove = () => {
  if (!agreedToTerms) return;
  
  // In future, this payload will hit our backend MongoDB model...
  console.log("Saving Lead & Agreement Metadata to MongoDB:", { ... });

  setShowAgreementModal(false);
  setIsSubmitted(true);
}; = () => {
    if (!agreedToTerms) return;
    
    // In future, this payload will hit our backend MongoDB model (backend/models/EducationLead.py)
    console.log("Saving Lead & Agreement Metadata to MongoDB:", {
      ...formData,
      plan: selectedPlan.title,
      price: selectedPlan.price,
      agreedTimestamp: new Date(),
      status: "Agreement Approved - Pending Payment"
    });

    setShowAgreementModal(false);
    setIsSubmitted(true);
  };

  return (
    <div className="min-height-screen bg-slate-950 text-slate-100 font-sans selection-bg-amber-500 selection-text-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      {/* Header section */}
      <div className="max-w-7xl mx-auto text-center mb-16">
        <div className="flex justify-center mb-4">
          {/* Static Mapping fallback for TFD Logo */}
          <img 
            src="https://customer-assets.emergentagent.com/job_advisor-phase4-build/artifacts/buhrts3f_IMG_2870.png" 
            alt="The Financial Doctor Logo" 
            className="h-16 w-auto object-contain"
          />
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200 tracking-tight">
          TFD Research Learning Hub
        </h1>
        <p className="mt-4 text-xl text-slate-400 max-w-3xl mx-auto">
          Advance your financial knowledge with institutional-grade market strategy analysis. 
          Strictly for educational and research simulation purposes.
        </p>
      </div>

      {/* Main Grid: Plans Presentation */}
      <div className="max-w-7xl mx-auto grid gap-8 lg:grid-cols-3 items-stretch mb-16">
        {plans.map((plan) => (
          <div 
            key={plan.id} 
            className={`relative flex flex-col justify-between rounded-2xl border ${plan.popular ? 'border-amber-400 scale-105' : 'border-slate-800'} bg-gradient-to-b ${plan.bg} p-8 shadow-2xl transform transition duration-300 hover:scale-[1.02]`}
          >
            {plan.popular && (
              <span className="absolute top-0 right-6 transform -translate-y-1/2 bg-amber-500 text-slate-950 text-xs font-bold tracking-wider uppercase px-3 py-1 rounded-full">
                Most Popular
              </span>
            )}
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">{plan.title}</h3>
              <div className="flex items-baseline my-4 text-slate-100">
                <span className="text-4xl font-extrabold tracking-tight">₹{plan.price}</span>
                <span className="ml-1 text-xl font-semibold text-slate-400">/course fee</span>
              </div>
              <ul className="mt-6 space-y-4">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start text-slate-300 text-base">
                    <svg className="h-6 w-6 text-amber-400 flex-shrink-0 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => handlePlanClick(plan)}
              className={`mt-8 w-full rounded-xl py-3 px-4 text-center text-sm font-bold shadow-lg transition duration-200 ${plan.popular ? 'bg-amber-500 text-slate-950 hover:bg-amber-400' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
            >
              Subscribe & Start Learning
            </button>
          </div>
        ))}
      </div>

      {/* Phase 1: Registration Form Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-4">Registration Details</h3>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300">Full Name</label>
                <input 
                  type="text" required 
                  className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 text-white px-3 py-2 focus:outline-none focus:border-amber-500"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">Email Address</label>
                <input 
                  type="email" required 
                  className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 text-white px-3 py-2 focus:outline-none focus:border-amber-500"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">Contact Number</label>
                <input 
                  type="tel" required 
                  className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 text-white px-3 py-2 focus:outline-none focus:border-amber-500"
                  value={formData.contactNo}
                  onChange={(e) => setFormData({...formData, contactNo: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">WhatsApp Number</label>
                <input 
                  type="tel" required 
                  className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 text-white px-3 py-2 focus:outline-none focus:border-amber-500"
                  value={formData.whatsappNo}
                  onChange={(e) => setFormData({...formData, whatsappNo: e.target.value})}
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button 
                  type="button" onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-lg text-sm hover:bg-amber-400"
                >
                  Proceed to Agreement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Phase 2: SEBI Compliant Dynamic PDF-Style Agreement Modal */}
      {showAgreementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70 backdrop-blur-sm">
          <div className="bg-white text-slate-900 rounded-2xl max-w-2xl w-full p-8 shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Agreement Header Mocking Professional Document Layout */}
            <div className="border-b-2 border-slate-300 pb-4 mb-4 text-center">
              <h2 className="text-2xl font-black tracking-tight uppercase text-slate-900">
                Educational Subscription & Risk Disclosure Agreement
              </h2>
              <p className="text-xs font-bold text-slate-500 mt-1">
                Document Ref: TFD-EDU-{Math.floor(100000 + Math.random() * 900000)}
              </p>
            </div>

            {/* Document Body View */}
            <div className="overflow-y-auto pr-2 space-y-4 text-sm leading-relaxed text-slate-700">
              <p>
                This framework constitutes a formal acknowledgment between <strong>The Financial Doctor (TFD Hub)</strong> and the subscriber:
              </p>
              
              <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 text-xs grid grid-cols-2 gap-2 text-slate-800 font-mono">
                <div><strong>Subscriber Name:</strong> {formData.name}</div>
                <div><strong>Registered Email:</strong> {formData.email}</div>
                <div><strong>Contact Number:</strong> {formData.contactNo}</div>
                <div><strong>WhatsApp Number:</strong> {formData.whatsappNo}</div>
                <div className="col-span-2"><strong>Selected Program:</strong> {selectedPlan?.title} (Fee: ₹{selectedPlan?.price})</div>
              </div>

              <h4 className="font-bold text-slate-900 text-base uppercase tracking-wide border-l-4 border-amber-500 pl-2">
                Mandatory Legal Declarations & SEBI Non-Advisory Compliance
              </h4>
              
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Strictly Educational Content:</strong> The subscriber explicitly understands that all chart metrics, technical analysis studies, options logic, and analytical breakdowns shared are exclusively for virtual practice and <strong>paper trading simulation</strong>.
                </li>
                <li>
                  <strong>No Buy/Sell Recommendations:</strong> TFD does not provide active advisory services, market tips, or definitive transactional calls. Content shared is an observation sheet of mathematical logic to help individuals learn capital structures independently.
                </li>
                <li>
                  <strong>Absolute Zero Financial Liability:</strong> The capital markets carry significant systemic risk. The subscriber accepts 100% financial and operational ownership of their actions. <strong>The Financial Doctor holds zero responsibility, liability, or accountability for any actual trading loss, slippage, or financial damage incurred by the user.</strong>
                </li>
                <li>
                  <strong>No Profit Assurances:</strong> Past simulations or theoretical performance track-records do not guarantee or imply future probability updates.
                </li>
              </ul>
            </div>

            {/* Mandatory Action Footer */}
            <div className="border-t border-slate-200 pt-4 mt-6">
              <label className="flex items-start cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  className="mt-1 mr-3 h-5 w-5 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                />
                <span className="text-xs font-bold text-slate-900 uppercase">
                  I hereby confirm that I have read the complete SEBI non-advisory disclaimer. I execute this digital approval acknowledging that shared analytics are strictly for learning and paper trading, and I assume full individual risk ownership.
                </span>
              </label>

              <div className="flex justify-end space-x-3 mt-6">
                <button 
                  onClick={() => { setShowAgreementModal(false); setShowFormModal(true); }}
                  className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-800"
                >
                  Back
                </button>
                <button 
                  onClick={handleAgreementApprove}
                  disabled={!agreedToTerms}
                  className={`font-bold px-6 py-2.5 rounded-xl text-sm shadow-md transition duration-200 ${agreedToTerms ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                >
                  Approve & Finalize Onboarding
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Confirmation Status Bar */}
      {isSubmitted && (
        <div className="max-w-xl mx-auto mt-8 bg-emerald-950 border border-emerald-500 text-emerald-200 p-6 rounded-2xl text-center shadow-xl">
          <svg className="h-12 w-12 text-emerald-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-xl font-bold text-white">Agreement Electronically Signed & Saved!</h3>
          <p className="mt-2 text-sm text-emerald-300">
            Sagar ji, client data and the legal disclosure mandate trace have been successfully logged. The workflow pipeline is secure.
          </p>
        </div>
      )}
    </div>
  );
};

export default EducationPortal;
