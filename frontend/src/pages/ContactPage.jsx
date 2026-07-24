import React, { useState } from "react";
import { MessageCircle, Clock, ChevronDown } from "lucide-react";
import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import Contact from "@/components/Contact";
import ProblemSolution from "@/components/ProblemSolution";
import Footer from "@/components/Footer";
import FloatingActions from "@/components/FloatingActions";
import FAQSection from "@/components/FAQSection";

const info = [
  { title: "Response Time", text: "We typically respond to enquiries within 24 working hours over call, WhatsApp, or email." },
  { title: "Free First Consultation", text: "Your first consultation with our advisors is completely free, with no obligation to invest." },
  { title: "Service Availability", text: "We currently assist clients across India remotely via video calls, in addition to in-person meetings where available." },
];

export const contactFAQ = {
  en: [
    { q: "How quickly will I get a response?", a: "We aim to respond within 24 working hours over call, WhatsApp, or email." },
    { q: "Is the first consultation really free?", a: "Yes, completely free with no obligation to invest or buy any policy." },
    { q: "Can I have a video consultation instead of meeting in person?", a: "Yes, most of our clients across India are served through video consultations for convenience." },
    { q: "What should I keep ready before the call?", a: "A rough idea of your monthly income, existing investments/insurance, and your financial goals helps us advise you faster. For example, knowing you save about ₹15,000/month and already have a ₹5 lakh term cover helps us skip repeat questions and get straight to what's missing." },
    { q: "What's the best way to contact The Financial Doctor?", a: "You can reach us via the contact form on this page, WhatsApp, phone call, or email — whichever is most convenient for you." },
    { q: "Can I contact you on WhatsApp directly?", a: "Yes, WhatsApp is one of our most-used channels — just tap the WhatsApp button on this page or in the floating action menu." },
    { q: "Do you respond on weekends?", a: "We primarily respond within 24 working hours, so messages sent over the weekend are typically answered on the next working day." },
    { q: "How long does the first consultation call usually take?", a: "A first consultation typically takes 20-30 minutes, enough time to understand your goals and outline next steps. For instance, a typical call might spend 10 minutes on your current situation and the rest mapping out a rough SIP or insurance plan to review further." },
    { q: "Is the first consultation over call, video, or in person?", a: "It's whichever you prefer — phone call, video call, or in-person if you're near Sehore, MP." },
    { q: "Do I need to pay anything to book a consultation?", a: "No, booking and attending your first consultation is completely free, with zero obligation to proceed further." },
    { q: "What happens after I submit the contact form?", a: "Our team reviews your query and reaches out within 24 working hours to schedule a convenient time to talk." },
    { q: "Can I schedule a specific time for my consultation?", a: "Yes, once you reach out, we coordinate with you to find a time that works for your schedule." },
    { q: "Do you offer consultations in the evening or on holidays?", a: "We try to be flexible around working professionals' schedules — mention your preferred time and we'll do our best to accommodate it." },
    { q: "What information should I share when I first contact you?", a: "Your name, contact number, and a brief note on what you need help with — SIP, insurance, tax planning, or a portfolio review — helps us prepare better. For example, a message like 'want to start a SIP for my daughter's education, 10 years away' lets us prepare relevant numbers before we even call." },
    { q: "Can I just ask a general question without committing to a full consultation?", a: "Yes, you're welcome to ask quick questions over WhatsApp or call without booking a formal consultation." },
    { q: "Do you serve clients only in Sehore, or across India?", a: "We serve clients across India via video consultations, alongside in-person meetings for those in and around Sehore, MP." },
    { q: "Can NRIs contact you for investment advice?", a: "Yes, we assist NRI clients remotely via video call and email, subject to applicable regulatory documentation." },
    { q: "What if I miss your callback?", a: "No problem — just reply on WhatsApp or call back at your convenience, and we'll pick up the conversation from where it left off." },
    { q: "Is my personal information safe when I fill out the contact form?", a: "Yes, information submitted through our contact form is used only to respond to your enquiry and is not shared with third parties for marketing." },
    { q: "Can I ask questions in Hindi when I contact you?", a: "Yes, our team responds comfortably in Hindi, English, or Hinglish, whichever you're most comfortable with." },
    { q: "Do you have a physical office address I can visit?", a: "Yes, we're based in Sehore, Madhya Pradesh — in-person meetings can be arranged there in addition to video consultations." },
    { q: "What documents should I keep ready for an insurance consultation?", a: "Basic ID proof, and if relevant, details of any existing policies you hold, so we can review your current coverage accurately. For example, sharing your existing term or health policy's sum insured and premium helps us quickly spot any gaps in your cover." },
    { q: "What documents should I keep ready for a mutual fund consultation?", a: "PAN details and a sense of your monthly investable surplus are useful, though full KYC only happens after you decide to proceed. For example, knowing you can invest around ₹8,000/month helps us shape fund suggestions before your first call even ends." },
    { q: "Can I bring my spouse or family member to the consultation?", a: "Yes, since most financial goals are shared within a family, we encourage spouses or family members to join the consultation together." },
    { q: "Is there a dedicated number for urgent queries?", a: "Use the WhatsApp or call option on this page for the fastest response — it reaches our team directly." },
    { q: "Can I request a callback instead of calling myself?", a: "Yes, share your number and preferred time through the contact form and we'll call you back." },
    { q: "Do you offer a follow-up consultation after the first one?", a: "Yes, follow-up discussions are part of our process, especially once you've had time to think over the first consultation's suggestions. For instance, we might check in a week later to answer any questions before you decide whether to start a SIP or buy a policy." },
    { q: "What if I'm not ready to invest yet but just want to understand my options?", a: "That's completely fine — the first consultation is about understanding your situation and options, with zero pressure or obligation to invest." },
    { q: "Can I switch from a phone consultation to video later?", a: "Yes, you can start however is convenient and switch formats anytime — we adapt to what works best for you." },
    { q: "How do I know which service I need before contacting you?", a: "You don't need to know in advance — just describe your situation or concern, and we'll help identify whether it's SIP, insurance, tax planning, or a mix. For example, 'I want to save for my child's future' could turn into a mix of an equity SIP and a term cover, depending on your full picture." },
    { q: "Do you charge for travel if you visit me in person?", a: "For clients near Sehore, in-person visits are generally included as part of our regular service; do check with us directly for specific arrangements." },
    { q: "What if I have an emergency insurance claim question?", a: "Reach out immediately via WhatsApp or call — claims-related queries are treated as priority so we can guide you quickly. For example, if you're mid-hospitalization and unsure about cashless approval, a WhatsApp message gets you guidance faster than waiting for a scheduled call." },
    { q: "Can students or first-time earners contact you for guidance?", a: "Yes, we welcome first-time earners and students starting to plan their finances — no minimum income or experience is required." },
    { q: "Is there a way to contact you outside working hours?", a: "You can message anytime via the contact form or WhatsApp; we'll respond within our standard 24 working-hour window." },
    { q: "Do you offer group or corporate consultations?", a: "Yes, on request we can arrange sessions for small groups, workplaces, or community events — reach out to discuss specifics." },
    { q: "What's the difference between contacting you for a quick question vs a full consultation?", a: "A quick question can usually be answered directly over WhatsApp or call, while a full consultation involves a more detailed discussion of your goals and finances. For instance, 'what's the minimum SIP amount?' is a quick question, while 'how should I plan for retirement in 20 years?' needs a full consultation." },
    { q: "Can I reschedule my consultation if something comes up?", a: "Yes, just let us know via WhatsApp or call, and we'll find another convenient time." },
    { q: "Do you follow up if I don't respond after the first contact?", a: "We may send a gentle follow-up, but we never pressure you — you're always in control of when and if you want to continue." },
    { q: "Is contacting you the same as becoming a client?", a: "No, reaching out simply starts a conversation — you become a client only if and when you choose to proceed after your free consultation." },
    { q: "Can I ask about career or partnership opportunities through this contact page?", a: "For partnership or career-related queries, it's best to use our dedicated Partner or Career pages, though you're welcome to mention it here too and we'll redirect you." },
    { q: "How soon after contacting you can I actually start investing?", a: "After your consultation, digital KYC and onboarding can often be completed within a day or two if you decide to proceed. For example, someone who completes e-KYC the same evening as their consultation could have their first SIP running by the next day." },
    { q: "What if I only want a second opinion on my existing investments?", a: "That's a common reason clients reach out — we're happy to review your existing portfolio and share an honest, free assessment. For example, we might point out that two of your funds overlap heavily in the same sector, or that your insurance cover hasn't kept pace with your income growth." },
    { q: "Do you offer support after I've become a client, or just before?", a: "Support continues well after onboarding — through periodic portfolio reviews, claim assistance, and ongoing questions as your life changes." },
    { q: "Can I contact you if I'm currently working with another advisor?", a: "Yes, we're happy to have a no-obligation conversation and, if you choose, help you transition smoothly." },
    { q: "Is there a form I need to fill, or can I just message directly?", a: "Both work — you can fill the contact form on this page or simply message us directly on WhatsApp." },
    { q: "What if my question is about a calculator or tool on the site rather than advice?", a: "You can still reach out — we're happy to help you interpret calculator results or point you to the right tool for your need." },
    { q: "Do you offer contact support in regional languages other than Hindi and English?", a: "Our primary languages are Hindi, English, and Hinglish; for other regional languages, do let us know and we'll do our best to accommodate." },
    { q: "Can I request written material or a proposal after my consultation?", a: "Yes, we can share a personalised proposal or summary after understanding your goals, so you have something concrete to review. For example, this could be a one-page summary showing your suggested SIP amount, fund categories, and the goal it's mapped to." },
    { q: "Is it okay to contact you just to compare options before deciding?", a: "Absolutely — many clients reach out purely to compare and understand their options before making any decision." },
    { q: "What's the very first step if I want to get started today?", a: "Fill out the contact form on this page or message us on WhatsApp right now — we'll take it from there with a free first consultation." },
  ],
  hi: [
    { q: "मुझे जवाब कितनी जल्दी मिलेगा?", a: "हम कॉल, WhatsApp या ईमेल पर 24 कार्य घंटों के अंदर जवाब देने की कोशिश करते हैं।" },
    { q: "क्या पहली कंसल्टेशन सच में फ्री है?", a: "हाँ, पूरी तरह फ्री है और इसमें निवेश या पॉलिसी खरीदने की कोई बाध्यता नहीं है।" },
    { q: "क्या मैं आमने-सामने मिलने के बजाय वीडियो कंसल्टेशन ले सकता हूँ?", a: "हाँ, भारत भर के हमारे ज्यादातर क्लाइंट्स की सुविधा के लिए वीडियो कंसल्टेशन से सेवा दी जाती है।" },
    { q: "कॉल से पहले मुझे क्या तैयार रखना चाहिए?", a: "आपकी मासिक इनकम, मौजूदा निवेश/इंश्योरेंस और फाइनेंशियल गोल्स का एक अंदाज़ा हमें तेजी से सलाह देने में मदद करता है। उदाहरण के लिए, यह जानना कि आप लगभग ₹15,000/माह बचाते हैं और पहले से ₹5 लाख का टर्म कवर है, हमें दोहराए गए सवालों से बचाकर सीधे यह समझने में मदद करता है कि क्या कमी है।" },
    { q: "The Financial Doctor से संपर्क करने का सबसे अच्छा तरीका क्या है?", a: "आप इस पेज पर दिए कॉन्टेक्ट फॉर्म, WhatsApp, फोन कॉल या ईमेल से हमसे संपर्क कर सकते हैं — जो भी आपके लिए सुविधाजनक हो।" },
    { q: "क्या मैं सीधे WhatsApp पर संपर्क कर सकता हूँ?", a: "हाँ, WhatsApp हमारे सबसे ज्यादा इस्तेमाल होने वाले चैनलों में से एक है — बस इस पेज पर या फ्लोटिंग एक्शन मेनू में WhatsApp बटन दबाएं।" },
    { q: "क्या आप वीकेंड पर भी जवाब देते हैं?", a: "हम मुख्य रूप से 24 कार्य घंटों के अंदर जवाब देते हैं, इसलिए वीकेंड पर भेजे गए मैसेज आमतौर पर अगले कार्य दिवस पर जवाब मिलते हैं।" },
    { q: "पहली कंसल्टेशन कॉल में आमतौर पर कितना समय लगता है?", a: "पहली कंसल्टेशन में आमतौर पर 20-30 मिनट लगते हैं, जो आपके गोल्स समझने और अगले कदम बताने के लिए काफी है। उदाहरण के लिए, एक सामान्य कॉल में 10 मिनट आपकी मौजूदा स्थिति समझने में और बाकी समय आगे रिव्यू के लिए एक अनुमानित SIP या इंश्योरेंस प्लान बनाने में लग सकता है।" },
    { q: "क्या पहली कंसल्टेशन कॉल, वीडियो या आमने-सामने होती है?", a: "जो भी आप चाहें — फोन कॉल, वीडियो कॉल, या अगर आप सीहोर, MP के पास हैं तो आमने-सामने।" },
    { q: "क्या कंसल्टेशन बुक करने के लिए मुझे कुछ पे करना होगा?", a: "नहीं, पहली कंसल्टेशन बुक करना और अटेंड करना पूरी तरह फ्री है, आगे बढ़ने की कोई बाध्यता नहीं है।" },
    { q: "कॉन्टेक्ट फॉर्म सबमिट करने के बाद क्या होता है?", a: "हमारी टीम आपकी query रिव्यू करती है और बात करने के लिए सुविधाजनक समय तय करने के लिए 24 कार्य घंटों के अंदर संपर्क करती है।" },
    { q: "क्या मैं अपनी कंसल्टेशन के लिए कोई खास समय तय कर सकता हूँ?", a: "हाँ, आपके संपर्क करने के बाद हम आपके शेड्यूल के हिसाब से सही समय तय करने के लिए कोऑर्डिनेट करते हैं।" },
    { q: "क्या आप शाम को या छुट्टी के दिन कंसल्टेशन देते हैं?", a: "हम वर्किंग प्रोफेशनल्स के शेड्यूल के हिसाब से फ्लेक्सिबल रहने की कोशिश करते हैं — अपना पसंदीदा समय बताएं, हम एडजस्ट करने की पूरी कोशिश करेंगे।" },
    { q: "पहली बार संपर्क करते समय मुझे क्या जानकारी शेयर करनी चाहिए?", a: "आपका नाम, कॉन्टेक्ट नंबर, और आपको किस चीज में मदद चाहिए इसका छोटा नोट — SIP, इंश्योरेंस, टैक्स प्लानिंग या पोर्टफोलियो रिव्यू — हमें बेहतर तैयारी में मदद करता है। उदाहरण के लिए, 'बेटी की एजुकेशन के लिए SIP शुरू करनी है, 10 साल बाद चाहिए' जैसा मैसेज हमें कॉल करने से पहले ही सही नंबर तैयार करने में मदद करता है।" },
    { q: "क्या मैं पूरी कंसल्टेशन के बिना सिर्फ एक सामान्य सवाल पूछ सकता हूँ?", a: "हाँ, आप बिना फॉर्मल कंसल्टेशन बुक किए WhatsApp या कॉल पर जल्दी सवाल पूछ सकते हैं।" },
    { q: "क्या आप सिर्फ सीहोर में या पूरे भारत में क्लाइंट्स को सेवा देते हैं?", a: "हम वीडियो कंसल्टेशन के जरिए पूरे भारत में क्लाइंट्स को सेवा देते हैं, साथ ही सीहोर, MP के आस-पास के क्लाइंट्स के लिए आमने-सामने मीटिंग भी।" },
    { q: "क्या NRI निवेश सलाह के लिए आपसे संपर्क कर सकते हैं?", a: "हाँ, हम NRI क्लाइंट्स की मदद वीडियो कॉल और ईमेल के जरिए रिमोटली करते हैं, लागू रेगुलेटरी डॉक्यूमेंटेशन के अनुसार।" },
    { q: "अगर मैं आपका कॉलबैक मिस कर दूं तो क्या होगा?", a: "कोई बात नहीं — बस अपनी सुविधा अनुसार WhatsApp पर जवाब दें या दोबारा कॉल करें, हम बातचीत वहीं से जारी रखेंगे।" },
    { q: "जब मैं कॉन्टेक्ट फॉर्म भरता हूं तो क्या मेरी पर्सनल जानकारी सुरक्षित रहती है?", a: "हाँ, कॉन्टेक्ट फॉर्म के जरिए दी गई जानकारी सिर्फ आपकी query का जवाब देने के लिए इस्तेमाल होती है और मार्केटिंग के लिए किसी थर्ड पार्टी के साथ शेयर नहीं की जाती।" },
    { q: "क्या मैं संपर्क करते समय हिंदी में सवाल पूछ सकता हूं?", a: "हाँ, हमारी टीम हिंदी, इंग्लिश या हिंग्लिश में सहजता से जवाब देती है, जो भी आपको सबसे सुविधाजनक लगे।" },
    { q: "क्या आपका कोई फिजिकल ऑफिस एड्रेस है जहाँ मैं जा सकता हूं?", a: "हाँ, हम सीहोर, मध्य प्रदेश में स्थित हैं — वहाँ वीडियो कंसल्टेशन के साथ-साथ आमने-सामने मीटिंग भी अरेंज की जा सकती है।" },
    { q: "इंश्योरेंस कंसल्टेशन के लिए मुझे कौन से डॉक्यूमेंट तैयार रखने चाहिए?", a: "बेसिक ID प्रूफ, और अगर लागू हो तो आपकी मौजूदा पॉलिसी की डिटेल्स, ताकि हम आपके मौजूदा कवरेज को सही तरीके से रिव्यू कर सकें। उदाहरण के लिए, अपनी मौजूदा टर्म या हेल्थ पॉलिसी का सम इंश्योर्ड और प्रीमियम शेयर करने से हमें आपके कवर में कमी जल्दी पहचानने में मदद मिलती है।" },
    { q: "म्यूचुअल फंड कंसल्टेशन के लिए मुझे कौन से डॉक्यूमेंट तैयार रखने चाहिए?", a: "PAN डिटेल्स और आपके मासिक इन्वेस्टेबल सरप्लस का एक अंदाज़ा उपयोगी होता है, हालांकि पूरा KYC आगे बढ़ने का फैसला करने के बाद ही होता है। उदाहरण के लिए, यह जानना कि आप लगभग ₹8,000/माह निवेश कर सकते हैं, हमें आपकी पहली कॉल खत्म होने से पहले ही फंड सुझाव तैयार करने में मदद करता है।" },
    { q: "क्या मैं अपने स्पाउस या फैमिली मेंबर को कंसल्टेशन में ला सकता हूं?", a: "हाँ, क्योंकि ज्यादातर फाइनेंशियल गोल्स परिवार में साझा होते हैं, हम स्पाउस या फैमिली मेंबर को कंसल्टेशन में साथ शामिल होने के लिए प्रोत्साहित करते हैं।" },
    { q: "क्या अर्जेंट queries के लिए कोई डेडिकेटेड नंबर है?", a: "सबसे तेज जवाब के लिए इस पेज पर WhatsApp या कॉल ऑप्शन इस्तेमाल करें — यह सीधे हमारी टीम तक पहुंचता है।" },
    { q: "क्या मैं खुद कॉल करने के बजाय कॉलबैक रिक्वेस्ट कर सकता हूं?", a: "हाँ, कॉन्टेक्ट फॉर्म के जरिए अपना नंबर और पसंदीदा समय शेयर करें और हम आपको कॉलबैक करेंगे।" },
    { q: "क्या आप पहली कंसल्टेशन के बाद फॉलो-अप कंसल्टेशन भी देते हैं?", a: "हाँ, फॉलो-अप डिस्कशन हमारी प्रोसेस का हिस्सा है, खासकर जब आपको पहली कंसल्टेशन के सुझावों पर सोचने का समय मिल गया हो। उदाहरण के लिए, हम एक हफ्ते बाद चेक-इन कर सकते हैं ताकि आप SIP शुरू करने या पॉलिसी लेने का फैसला करने से पहले किसी भी सवाल का जवाब पा सकें।" },
    { q: "अगर मैं अभी निवेश के लिए तैयार नहीं हूं पर सिर्फ अपने ऑप्शन समझना चाहता हूं तो?", a: "यह बिल्कुल ठीक है — पहली कंसल्टेशन का मकसद आपकी स्थिति और ऑप्शन समझना है, बिना किसी दबाव या निवेश की बाध्यता के।" },
    { q: "क्या मैं बाद में फोन कंसल्टेशन से वीडियो पर स्विच कर सकता हूं?", a: "हाँ, आप जो भी सुविधाजनक हो उससे शुरू कर सकते हैं और कभी भी फॉर्मेट बदल सकते हैं — हम आपके लिए जो बेहतर हो उसी के हिसाब से एडजस्ट करते हैं।" },
    { q: "संपर्क करने से पहले मुझे कैसे पता चले कि मुझे कौन सी सर्विस चाहिए?", a: "आपको पहले से पता होने की जरूरत नहीं है — बस अपनी स्थिति या चिंता बताएं, हम पहचानने में मदद करेंगे कि यह SIP, इंश्योरेंस, टैक्स प्लानिंग या इनका मिश्रण है। उदाहरण के लिए, 'मुझे अपने बच्चे के भविष्य के लिए बचत करनी है' आपकी पूरी स्थिति के हिसाब से एक इक्विटी SIP और एक टर्म कवर के मिश्रण में बदल सकता है।" },
    { q: "अगर आप मुझसे मिलने आते हैं तो क्या आप travel के लिए चार्ज करते हैं?", a: "सीहोर के पास के क्लाइंट्स के लिए, आमने-सामने विजिट आमतौर पर हमारी नियमित सर्विस का हिस्सा होते हैं; खास व्यवस्था के लिए सीधे हमसे चेक करें।" },
    { q: "अगर मुझे इमरजेंसी इंश्योरेंस क्लेम का सवाल है तो?", a: "तुरंत WhatsApp या कॉल के जरिए संपर्क करें — क्लेम से जुड़े सवालों को प्राथमिकता दी जाती है ताकि हम आपको जल्दी गाइड कर सकें। उदाहरण के लिए, अगर आप हॉस्पिटलाइजेशन के बीच में हैं और कैशलेस अप्रूवल को लेकर अनिश्चित हैं, तो शेड्यूल्ड कॉल का इंतज़ार करने के बजाय एक WhatsApp मैसेज आपको तेजी से गाइडेंस दिलाता है।" },
    { q: "क्या स्टूडेंट्स या पहली बार कमाने वाले भी गाइडेंस के लिए संपर्क कर सकते हैं?", a: "हाँ, हम फाइनेंस प्लान करना शुरू करने वाले पहली बार कमाने वालों और स्टूडेंट्स का स्वागत करते हैं — कोई न्यूनतम इनकम या अनुभव जरूरी नहीं है।" },
    { q: "क्या वर्किंग ऑवर्स के बाहर संपर्क करने का कोई तरीका है?", a: "आप कभी भी कॉन्टेक्ट फॉर्म या WhatsApp से मैसेज कर सकते हैं; हम अपनी स्टैंडर्ड 24 कार्य घंटों की विंडो में जवाब देंगे।" },
    { q: "क्या आप ग्रुप या कॉरपोरेट कंसल्टेशन ऑफर करते हैं?", a: "हाँ, अनुरोध पर हम छोटे ग्रुप्स, वर्कप्लेस या कम्युनिटी इवेंट्स के लिए सेशन अरेंज कर सकते हैं — डिटेल्स डिस्कस करने के लिए संपर्क करें।" },
    { q: "एक छोटे सवाल के लिए संपर्क करने और पूरी कंसल्टेशन में क्या फर्क है?", a: "एक छोटा सवाल आमतौर पर सीधे WhatsApp या कॉल पर जवाब दिया जा सकता है, जबकि पूरी कंसल्टेशन में आपके गोल्स और फाइनेंस की ज्यादा विस्तृत चर्चा होती है। उदाहरण के लिए, 'न्यूनतम SIP राशि क्या है?' एक छोटा सवाल है, जबकि '20 साल में रिटायरमेंट के लिए मुझे कैसे प्लान करना चाहिए?' के लिए पूरी कंसल्टेशन चाहिए।" },
    { q: "अगर कुछ आ जाए तो क्या मैं अपनी कंसल्टेशन रीशेड्यूल कर सकता हूं?", a: "हाँ, बस हमें WhatsApp या कॉल पर बताएं, हम दूसरा सुविधाजनक समय ढूंढ लेंगे।" },
    { q: "अगर मैं पहले संपर्क के बाद जवाब नहीं देता तो क्या आप फॉलो-अप करते हैं?", a: "हम एक हल्का फॉलो-अप भेज सकते हैं, पर हम कभी दबाव नहीं डालते — कब और क्या आगे बढ़ना है यह हमेशा आपके नियंत्रण में रहता है।" },
    { q: "क्या संपर्क करना क्लाइंट बनने के बराबर है?", a: "नहीं, संपर्क करना सिर्फ बातचीत शुरू करता है — आप क्लाइंट तभी बनते हैं जब आप फ्री कंसल्टेशन के बाद आगे बढ़ने का फैसला करते हैं।" },
    { q: "क्या मैं इस कॉन्टेक्ट पेज से करियर या पार्टनरशिप के मौकों के बारे में पूछ सकता हूं?", a: "पार्टनरशिप या करियर से जुड़े सवालों के लिए हमारे डेडिकेटेड Partner या Career पेज इस्तेमाल करना बेहतर है, हालांकि आप यहां भी इसका जिक्र कर सकते हैं और हम आपको सही जगह भेज देंगे।" },
    { q: "संपर्क करने के बाद मैं असल में कितनी जल्दी निवेश शुरू कर सकता हूं?", a: "आपकी कंसल्टेशन के बाद, अगर आप आगे बढ़ने का फैसला करते हैं तो डिजिटल KYC और ऑनबोर्डिंग अक्सर एक-दो दिन में पूरी हो सकती है। उदाहरण के लिए, कंसल्टेशन वाली शाम को ही e-KYC पूरा करने वाला व्यक्ति अगले दिन तक अपनी पहली SIP चला सकता है।" },
    { q: "अगर मुझे सिर्फ अपने मौजूदा निवेश पर दूसरी राय चाहिए तो?", a: "यह क्लाइंट्स के संपर्क करने की एक आम वजह है — हम आपके मौजूदा पोर्टफोलियो को रिव्यू करके एक ईमानदार, फ्री असेसमेंट देने में खुश हैं। उदाहरण के लिए, हम बता सकते हैं कि आपके दो फंड एक ही सेक्टर में काफी ओवरलैप कर रहे हैं, या आपका इंश्योरेंस कवर आपकी बढ़ती इनकम के हिसाब से नहीं बढ़ा है।" },
    { q: "क्या आप क्लाइंट बनने के बाद भी सपोर्ट देते हैं, या सिर्फ पहले?", a: "सपोर्ट ऑनबोर्डिंग के बाद भी जारी रहता है — पीरियोडिक पोर्टफोलियो रिव्यू, क्लेम असिस्टेंस, और आपकी बदलती जिंदगी के साथ चल रहे सवालों के जरिए।" },
    { q: "अगर मैं अभी किसी और एडवाइजर के साथ काम कर रहा हूं तो क्या मैं आपसे संपर्क कर सकता हूं?", a: "हाँ, हम बिना किसी बाध्यता के बातचीत करने में खुश हैं और अगर आप चुनें तो स्मूथली ट्रांजिशन में भी मदद कर सकते हैं।" },
    { q: "क्या मुझे कोई फॉर्म भरना होगा, या मैं सीधे मैसेज कर सकता हूं?", a: "दोनों तरीके काम करते हैं — आप इस पेज पर कॉन्टेक्ट फॉर्म भर सकते हैं या सीधे WhatsApp पर मैसेज कर सकते हैं।" },
    { q: "अगर मेरा सवाल सलाह की बजाय साइट पर किसी कैलकुलेटर या टूल के बारे में है तो?", a: "आप फिर भी संपर्क कर सकते हैं — हम कैलकुलेटर के रिजल्ट समझने में या आपकी जरूरत के लिए सही टूल बताने में मदद करने में खुश हैं।" },
    { q: "क्या आप हिंदी और इंग्लिश के अलावा दूसरी क्षेत्रीय भाषाओं में भी कॉन्टेक्ट सपोर्ट देते हैं?", a: "हमारी मुख्य भाषाएं हिंदी, इंग्लिश और हिंग्लिश हैं; दूसरी क्षेत्रीय भाषाओं के लिए हमें बताएं, हम एडजस्ट करने की पूरी कोशिश करेंगे।" },
    { q: "क्या मैं अपनी कंसल्टेशन के बाद लिखित मटेरियल या प्रपोजल मांग सकता हूं?", a: "हाँ, आपके गोल्स समझने के बाद हम एक पर्सनलाइज्ड प्रपोजल या समरी शेयर कर सकते हैं, ताकि आपके पास रिव्यू करने के लिए कुछ ठोस हो। उदाहरण के लिए, यह एक पेज की समरी हो सकती है जिसमें आपकी सुझाई गई SIP राशि, फंड कैटेगरी और उससे जुड़ा गोल दिखाया गया हो।" },
    { q: "क्या फैसला लेने से पहले सिर्फ ऑप्शन कंपेयर करने के लिए संपर्क करना ठीक है?", a: "बिल्कुल — कई क्लाइंट्स कोई भी फैसला लेने से पहले सिर्फ अपने ऑप्शन कंपेयर और समझने के लिए ही संपर्क करते हैं।" },
    { q: "अगर मैं आज ही शुरुआत करना चाहता हूं तो सबसे पहला कदम क्या है?", a: "इस पेज पर कॉन्टेक्ट फॉर्म भरें या अभी WhatsApp पर हमें मैसेज करें — हम एक फ्री पहली कंसल्टेशन के साथ वहां से आगे बढ़ेंगे।" },
  ],
  hinglish: [
    { q: "Mujhe response kitni jaldi milega?", a: "Hum call, WhatsApp ya email pe 24 working hours ke andar respond karne ki koshish karte hain." },
    { q: "Kya pehli consultation sach mein free hai?", a: "Haan, bilkul free hai aur usme invest karne ya policy lene ki koi obligation nahi hai." },
    { q: "Kya main face-to-face meeting ke bajaye video consultation le sakta hoon?", a: "Haan, India bhar ke hamare zyada tar clients ko convenience ke liye video consultation se serve kiya jaata hai." },
    { q: "Call se pehle mujhe kya ready rakhna chahiye?", a: "Aapki monthly income, existing investment/insurance aur financial goals ka thoda idea hone se hum jaldi advice de paate hain. Jaise, yeh pata hona ki aap lagbhag ₹15,000/month save karte ho aur pehle se ₹5 lakh ka term cover hai, hume repeat questions se bachakar directly yeh samajhne mein help karta hai ki kya missing hai." },
    { q: "The Financial Doctor se contact karne ka best tareeka kya hai?", a: "Aap is page pe diye contact form, WhatsApp, phone call ya email se hum se contact kar sakte ho — jo bhi aapke liye convenient ho." },
    { q: "Kya main directly WhatsApp pe contact kar sakta hoon?", a: "Haan, WhatsApp hamare sabse zyada use hone wale channels mein se ek hai — bas is page pe ya floating action menu mein WhatsApp button dabao." },
    { q: "Kya aap weekend pe bhi respond karte ho?", a: "Hum mainly 24 working hours ke andar respond karte hain, isliye weekend pe bheje gaye messages ka jawab usually agle working day pe milta hai." },
    { q: "Pehli consultation call mein usually kitna time lagta hai?", a: "Pehli consultation mein usually 20-30 minute lagte hain, jo aapke goals samajhne aur next steps batane ke liye kaafi hai. Jaise, ek normal call mein 10 minute aapki current situation samajhne mein aur baaki time aage review ke liye ek rough SIP ya insurance plan banane mein ja sakta hai." },
    { q: "Kya pehli consultation call, video ya face-to-face hoti hai?", a: "Jo bhi aap chahen — phone call, video call, ya agar aap Sehore, MP ke paas hain to face-to-face." },
    { q: "Kya consultation book karne ke liye mujhe kuch pay karna hoga?", a: "Nahi, pehli consultation book karna aur attend karna bilkul free hai, aage badhne ki koi obligation nahi hai." },
    { q: "Contact form submit karne ke baad kya hota hai?", a: "Hamari team aapki query review karti hai aur baat karne ke liye convenient time set karne ke liye 24 working hours ke andar contact karti hai." },
    { q: "Kya main apni consultation ke liye specific time set kar sakta hoon?", a: "Haan, aapke contact karne ke baad hum aapke schedule ke hisaab se sahi time decide karne ke liye coordinate karte hain." },
    { q: "Kya aap shaam ko ya holiday pe consultation dete ho?", a: "Hum working professionals ke schedule ke hisaab se flexible rehne ki koshish karte hain — apna preferred time batao, hum accommodate karne ki poori koshish karenge." },
    { q: "Pehli baar contact karte waqt mujhe kya information share karni chahiye?", a: "Aapka naam, contact number, aur aapko kis cheez mein help chahiye uska chhota note — SIP, insurance, tax planning ya portfolio review — hume behtar taiyari karne mein help karta hai. Jaise, 'beti ki education ke liye SIP shuru karni hai, 10 saal baad chahiye' jaisa message hume call karne se pehle hi sahi numbers taiyar karne mein help karta hai." },
    { q: "Kya main puri consultation ke bina sirf ek general question puch sakta hoon?", a: "Haan, aap bina formal consultation book kiye WhatsApp ya call pe jaldi questions puch sakte ho." },
    { q: "Kya aap sirf Sehore mein ya poore India mein clients serve karte ho?", a: "Hum video consultation ke through poore India mein clients serve karte hain, saath hi Sehore, MP ke aas-paas ke clients ke liye face-to-face meeting bhi." },
    { q: "Kya NRIs investment advice ke liye aap se contact kar sakte hain?", a: "Haan, hum NRI clients ki help video call aur email ke through remotely karte hain, applicable regulatory documentation ke saath." },
    { q: "Agar main aapka callback miss kar doon to kya hoga?", a: "Koi baat nahi — bas apni convenience se WhatsApp pe reply karo ya dobara call karo, hum baatcheet wahin se jaari rakhenge." },
    { q: "Jab main contact form bharta hoon to kya meri personal information safe rehti hai?", a: "Haan, contact form ke through di gayi information sirf aapki query ka jawab dene ke liye use hoti hai aur marketing ke liye kisi third party ke saath share nahi ki jaati." },
    { q: "Kya main contact karte waqt Hindi mein questions puch sakta hoon?", a: "Haan, hamari team Hindi, English ya Hinglish mein comfortably jawab deti hai, jo bhi aapko sabse convenient lage." },
    { q: "Kya aapka koi physical office address hai jaha main ja sakta hoon?", a: "Haan, hum Sehore, Madhya Pradesh mein based hain — wahan video consultation ke saath-saath face-to-face meeting bhi arrange ki ja sakti hai." },
    { q: "Insurance consultation ke liye mujhe kaunse documents ready rakhne chahiye?", a: "Basic ID proof, aur agar applicable ho to aapki existing policy ki details, taaki hum aapka current coverage sahi tareeke se review kar sakein. Jaise, apni existing term ya health policy ka sum insured aur premium share karne se hume aapke cover mein kami jaldi pehchanne mein help milti hai." },
    { q: "Mutual fund consultation ke liye mujhe kaunse documents ready rakhne chahiye?", a: "PAN details aur aapke monthly investable surplus ka ek idea useful hota hai, halanki full KYC aage badhne ka decision lene ke baad hi hota hai. Jaise, yeh pata hona ki aap lagbhag ₹8,000/month invest kar sakte ho, hume aapki pehli call khatam hone se pehle hi fund suggestions taiyar karne mein help karta hai." },
    { q: "Kya main apne spouse ya family member ko consultation mein la sakta hoon?", a: "Haan, kyunki zyada tar financial goals family mein shared hote hain, hum spouse ya family member ko consultation mein saath shamil hone ke liye encourage karte hain." },
    { q: "Kya urgent queries ke liye koi dedicated number hai?", a: "Sabse fast response ke liye is page pe WhatsApp ya call option use karo — yeh directly hamari team tak pahunchta hai." },
    { q: "Kya main khud call karne ke bajaye callback request kar sakta hoon?", a: "Haan, contact form ke through apna number aur preferred time share karo aur hum aapko callback karenge." },
    { q: "Kya aap pehli consultation ke baad follow-up consultation bhi dete ho?", a: "Haan, follow-up discussion hamari process ka hissa hai, khaaskar jab aapko pehli consultation ke suggestions pe sochne ka time mil gaya ho. Jaise, hum ek hafte baad check-in kar sakte hain taaki aap SIP shuru karne ya policy lene ka decision karne se pehle kisi bhi sawaal ka jawab pa sakein." },
    { q: "Agar main abhi invest karne ke liye ready nahi hoon par sirf apne options samajhna chahta hoon to?", a: "Yeh bilkul theek hai — pehli consultation ka maksad aapki situation aur options samajhna hai, bina kisi pressure ya invest karne ki obligation ke." },
    { q: "Kya main baad mein phone consultation se video pe switch kar sakta hoon?", a: "Haan, aap jo bhi convenient ho usse start kar sakte ho aur kabhi bhi format badal sakte ho — hum aapke liye jo behtar ho usi ke hisaab se adjust karte hain." },
    { q: "Contact karne se pehle mujhe kaise pata chale ki mujhe kaunsi service chahiye?", a: "Aapko pehle se pata hone ki zaroorat nahi hai — bas apni situation ya concern batao, hum pehchaanne mein help karenge ki yeh SIP, insurance, tax planning ya inka mix hai. Jaise, 'mujhe apne bachche ke future ke liye save karna hai' aapki puri situation ke hisaab se ek equity SIP aur ek term cover ke mix mein badal sakta hai." },
    { q: "Agar aap mujhse milne aate ho to kya aap travel ke liye charge karte ho?", a: "Sehore ke paas ke clients ke liye, face-to-face visits usually hamari regular service ka hissa hote hain; specific arrangement ke liye directly hum se check karo." },
    { q: "Agar mujhe emergency insurance claim ka sawal hai to?", a: "Turant WhatsApp ya call ke through contact karo — claims se related queries ko priority di jaati hai taaki hum aapko jaldi guide kar sakein. Jaise, agar aap hospitalization ke beech mein ho aur cashless approval ko lekar unsure ho, to scheduled call ka wait karne ke bajaye ek WhatsApp message aapko jaldi guidance deta hai." },
    { q: "Kya students ya first-time earners bhi guidance ke liye contact kar sakte hain?", a: "Haan, hum finance plan karna shuru karne wale first-time earners aur students ka swagat karte hain — koi minimum income ya experience zaroori nahi hai." },
    { q: "Kya working hours ke bahar contact karne ka koi tareeka hai?", a: "Aap kabhi bhi contact form ya WhatsApp se message kar sakte ho; hum apni standard 24 working-hour window mein reply karenge." },
    { q: "Kya aap group ya corporate consultations offer karte ho?", a: "Haan, request pe hum chhote groups, workplaces ya community events ke liye sessions arrange kar sakte hain — details discuss karne ke liye contact karo." },
    { q: "Ek chhote sawal ke liye contact karne aur puri consultation mein kya farak hai?", a: "Ek chhota sawal usually directly WhatsApp ya call pe jawab diya ja sakta hai, jabki puri consultation mein aapke goals aur finances ki zyada detailed discussion hoti hai. Jaise, 'minimum SIP amount kya hai?' ek chhota sawal hai, jabki '20 saal mein retirement ke liye mujhe kaise plan karna chahiye?' ke liye puri consultation chahiye." },
    { q: "Agar kuch aa jaaye to kya main apni consultation reschedule kar sakta hoon?", a: "Haan, bas hume WhatsApp ya call pe batao, hum doosra convenient time dhoond lenge." },
    { q: "Agar main pehle contact ke baad reply nahi karta to kya aap follow-up karte ho?", a: "Hum ek halka follow-up bhej sakte hain, par hum kabhi pressure nahi daalte — kab aur kya aage badhna hai yeh hamesha aapke control mein rehta hai." },
    { q: "Kya contact karna client banne ke barabar hai?", a: "Nahi, contact karna sirf baatcheet shuru karta hai — aap client tabhi bante ho jab aap free consultation ke baad aage badhne ka decision karte ho." },
    { q: "Kya main is contact page se career ya partnership opportunities ke baare mein puch sakta hoon?", a: "Partnership ya career se related questions ke liye hamare dedicated Partner ya Career pages use karna behtar hai, halanki aap yahan bhi iska zikar kar sakte ho aur hum aapko sahi jagah bhej denge." },
    { q: "Contact karne ke baad main asal mein kitni jaldi invest shuru kar sakta hoon?", a: "Aapki consultation ke baad, agar aap aage badhne ka decision karte ho to digital KYC aur onboarding often ek-do din mein complete ho sakti hai. Jaise, consultation wali shaam ko hi e-KYC complete karne wala insaan agle din tak apni pehli SIP chala sakta hai." },
    { q: "Agar mujhe sirf apne existing investments pe doosri raay chahiye to?", a: "Yeh clients ke contact karne ki ek common wajah hai — hum aapke existing portfolio ko review karke ek honest, free assessment dene mein khush hain. Jaise, hum bata sakte hain ki aapke do funds ek hi sector mein kaafi overlap kar rahe hain, ya aapka insurance cover aapki badhti income ke hisaab se nahi badha hai." },
    { q: "Kya aap client banne ke baad bhi support dete ho, ya sirf pehle?", a: "Support onboarding ke baad bhi jaari rehta hai — periodic portfolio reviews, claim assistance, aur aapki badalti zindagi ke saath ongoing questions ke through." },
    { q: "Agar main abhi kisi aur advisor ke saath kaam kar raha hoon to kya main aap se contact kar sakta hoon?", a: "Haan, hum bina kisi obligation ke baatcheet karne mein khush hain aur agar aap choose karo to smoothly transition mein bhi help kar sakte hain." },
    { q: "Kya mujhe koi form bharna hoga, ya main directly message kar sakta hoon?", a: "Dono tareeke kaam karte hain — aap is page pe contact form bhar sakte ho ya directly WhatsApp pe message kar sakte ho." },
    { q: "Agar mera sawal advice ke bajaye site pe kisi calculator ya tool ke baare mein hai to?", a: "Aap phir bhi contact kar sakte ho — hum calculator ke results samajhne mein ya aapki need ke liye sahi tool batane mein help karne mein khush hain." },
    { q: "Kya aap Hindi aur English ke alawa doosri regional languages mein bhi contact support dete ho?", a: "Hamari primary languages Hindi, English aur Hinglish hain; doosri regional languages ke liye hume batao, hum accommodate karne ki poori koshish karenge." },
    { q: "Kya main apni consultation ke baad written material ya proposal maang sakta hoon?", a: "Haan, aapke goals samajhne ke baad hum ek personalised proposal ya summary share kar sakte hain, taaki aapke paas review karne ke liye kuch concrete ho. Jaise, yeh ek page ki summary ho sakti hai jisme aapki suggested SIP amount, fund categories aur usse juda goal dikhaya gaya ho." },
    { q: "Kya decision lene se pehle sirf options compare karne ke liye contact karna theek hai?", a: "Bilkul — kai clients koi bhi decision lene se pehle sirf apne options compare aur samajhne ke liye hi contact karte hain." },
    { q: "Agar main aaj hi shuru karna chahta hoon to sabse pehla step kya hai?", a: "Is page pe contact form bharo ya abhi WhatsApp pe hume message karo — hum ek free pehli consultation ke saath wahan se aage badhenge." },
  ],
};

export default function ContactPage() {
  const [openInfo, setOpenInfo] = useState(-1);
  return (
    <div className="relative" data-testid="contact-page-root">
      <SEO
        title="The Financial Doctor | Contact Us"
        description="Get in touch with The Financial Doctor for mutual fund, SIP, and insurance advisory — free first consultation, quick response over call, WhatsApp, or email."
        keywords="contact financial advisor, mutual fund advisor near me, mutual fund agent near me, SIP agent near me, mutual fund consultant near me, free consultation, contact Sagar Chaturvedi, The Financial Doctor Sehore, mutual fund advisor Sehore, mutual fund advisor Madhya Pradesh, AMFI registered mutual fund distributor, ARN-290298, financial advisor India"
        path="/contact"
      />
      <Navbar />
      <main>
        {/* CALM / MINIMAL HERO — sky blue, small and centered instead of a
            big banner, because a contact page's job is to get out of the
            way and get someone talking to a human quickly. */}
        <section className="pt-28 pb-10 md:pt-32 md:pb-12 px-6 text-center" style={{ background: "#EAF3FC" }}>
          <div className="container-x max-w-xl mx-auto">
            <h1 className="fund-animate-in font-display text-2xl sm:text-3xl md:text-4xl text-[#0E1B2C] leading-tight">
              Let's talk about <span className="font-italic-serif" style={{ color: "#2E7FC7" }}>your money.</span>
            </h1>
            <p className="fund-animate-in fund-animate-in-delay-1 mt-3 text-[#2A364B]/75 text-[15px]">
              Tell us a bit about your goal — SIP, insurance, or a portfolio review.
            </p>
            <div className="fund-animate-in fund-animate-in-delay-2 flex items-center justify-center gap-6 mt-6 text-sm text-[#2A364B]/80">
              <span className="inline-flex items-center gap-1.5"><Clock size={15} style={{ color: "#2E7FC7" }} /> Reply in 24 hrs</span>
              <span className="inline-flex items-center gap-1.5"><MessageCircle size={15} style={{ color: "#2E7FC7" }} /> First call is free</span>
            </div>
          </div>
        </section>
        <ProblemSolution
          accent="#2E7FC7"
          problem="Reaching a financial advisor usually means a pushy sales call, a long wait for a callback, or a chatbot that can't actually answer anything specific."
          solution="Message us and we reply within 24 hours, with a free first consultation and zero obligation to invest — you decide if it's a fit, not us."
        />
        <Contact hideHeading />

        {/* EXTRA DETAILED CONTENT — desktop renders this as a connected
            horizontal timeline (rail + numbered dots, same visual language
            as About's journey timeline) since these 3 points are really a
            "what happens when you reach out" sequence, not a plain feature
            grid; mobile collapses to a single-open accordion instead of a
            slider. */}
        <section className="bg-[#FBF7EE] py-16 px-6">
          <div className="container-x max-w-4xl mx-auto">
            <h2 className="text-2xl font-serif text-[#0E1B2C] mb-8 text-center">
              Before You Reach Out
            </h2>

            <div className="md:hidden space-y-2.5">
              {info.map((i, idx) => {
                const isOpen = openInfo === idx;
                return (
                  <div key={i.title} className="bg-white border border-[#E2D8C2] rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setOpenInfo(isOpen ? -1 : idx)}
                      aria-expanded={isOpen}
                      aria-controls={`contact-info-${idx}`}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                    >
                      <span aria-hidden="true" className="w-6 h-6 rounded-full text-white text-[11px] font-mono grid place-items-center shrink-0" style={{ background: "#2E7FC7" }}>{idx + 1}</span>
                      <span className="flex-1 font-display text-[#0E1B2C] text-sm">{i.title}</span>
                      <ChevronDown size={15} aria-hidden="true" className="shrink-0 transition-transform" style={{ color: "#2E7FC7", transform: isOpen ? "rotate(180deg)" : undefined }} />
                    </button>
                    {isOpen && <p id={`contact-info-${idx}`} className="px-4 pb-4 text-sm text-[#2A364B]/80 leading-relaxed">{i.text}</p>}
                  </div>
                );
              })}
            </div>

            <div className="hidden md:block relative pt-2">
              <div className="absolute top-[15px] left-0 right-0 h-0.5" style={{ background: "#C9DCF5" }} aria-hidden />
              <div className="grid grid-cols-3 gap-6">
                {info.map((i, idx) => (
                  <div key={i.title} className="relative pt-8">
                    <div className="absolute top-0 left-0 w-4 h-4 rounded-full border-2 border-white ring-2 grid place-items-center text-white text-[9px] font-mono" style={{ background: "#2E7FC7", boxShadow: "0 0 0 2px #C9DCF5" }}>
                      {idx + 1}
                    </div>
                    <h3 className="font-display text-[#0E1B2C] mb-1.5">{i.title}</h3>
                    <p className="text-sm text-[#2A364B]/80 leading-relaxed">{i.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <FAQSection title="Contact — Frequently Asked Questions" data={contactFAQ} />
      </main>
      <Footer />
      <FloatingActions />
    </div>
  );
}
