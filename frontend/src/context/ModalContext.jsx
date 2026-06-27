import React, { createContext, useState, useContext } from "react";
import { LogIn, UserPlus, X, ShieldCheck } from "lucide-react";
import { LINKS } from "@/lib/links";

const ModalContext = createContext();

export function ModalProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  const openGateway = () => setIsOpen(true);
  const closeGateway = () => setIsOpen(false);

  return (
    <ModalContext.Provider value={{ openGateway }}>
      {children}
      
      {/* 🎯 Central Custom Popup Gateway Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-[100005] bg-[#0E1B2C]/85 backdrop-blur-sm grid place-items-center p-4 select-none">
          <div className="bg-[#FBF7EE] border-2 border-[#E2D8C2] rounded-2xl p-6 max-w-md w-full shadow-2xl relative animate-fadeIn">
            
            {/* Close Button */}
            <button 
              onClick={closeGateway}
              className="absolute top-4 right-4 text-[#5C677D] hover:text-[#C7102E] font-bold p-1 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            {/* Header Branding */}
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-[#024396]/10 flex items-center justify-center mx-auto mb-3 text-[#024396]">
                <ShieldCheck size={26} />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#0E1B2C]">The Financial Doctor Desk</h3>
              <p className="text-xs text-[#5C677D] mt-1">Secure Portfolio Gateway · ARN-290298</p>
            </div>

            {/* Split Action Tracks */}
            <div className="space-y-4">
              
              {/* OPTION 1: LOGIN (EXISTING USER) */}
              <a 
                href="https://client.assetplus.in/login" 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={closeGateway}
                className="flex items-center gap-4 bg-white border border-[#E2D8C2] hover:border-[#024396] hover:bg-[#024396]/5 p-4 rounded-xl transition-all group block cursor-pointer"
              >
                <div className="p-3 rounded-lg bg-[#024396]/10 text-[#024396] group-hover:bg-[#024396] group-hover:text-white transition-all">
                  <LogIn size={20} />
                </div>
                <div className="text-left">
                  <span className="block text-sm font-bold text-[#0E1B2C]">Existing Client Login</span>
                  <span className="block text-[11px] text-[#5C677D] mt-0.5">Check your running mutual funds portfolio & reports</span>
                </div>
              </a>

              {/* OPTION 2: SIGNUP / NEW ACCOUNT */}
              <a 
                href={LINKS.assetPlus} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={closeGateway}
                className="flex items-center gap-4 bg-white border border-[#E2D8C2] hover:border-[#C7102E] hover:bg-[#C7102E]/5 p-4 rounded-xl transition-all group block cursor-pointer"
              >
                <div className="p-3 rounded-lg bg-[#C7102E]/10 text-[#C7102E] group-hover:bg-[#C7102E] group-hover:text-white transition-all">
                  <UserPlus size={20} />
                </div>
                <div className="text-left">
                  <span className="block text-sm font-bold text-[#0E1B2C]">New Investor (Sign Up)</span>
                  <span className="block text-[11px] text-[#5C677D] mt-0.5">Create account under Sagar Chaturvedi to start new SIPs</span>
                </div>
              </a>

            </div>

            {/* Legal Disclaimer Footer */}
            <p className="text-[9px] text-[#8A93A6] text-center mt-5 leading-normal">
              🔒 Encrypted transaction portal processed securely via AssetPlus integration channels.
            </p>

          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
}

export function useModal() {
  return useContext(ModalContext);
}
