import React from "react";
import { Star } from "lucide-react";
import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import Reviews from "@/components/Reviews";
import ProblemSolution from "@/components/ProblemSolution";
import Footer from "@/components/Footer";
import FloatingActions from "@/components/FloatingActions";
import FAQSection from "@/components/FAQSection";

// 🔗 Replace with your actual Google Business review link
const GOOGLE_REVIEW_LINK = "https://g.page/r/your-business-id/review";

export const reviewsFAQ = {
  en: [
    { q: "How are reviews collected?", a: "Reviews are collected directly from clients after their onboarding and review sessions, with their consent to share feedback publicly. For example, after a client's 6-month portfolio review, we might ask if they'd like to share how the process felt so far." },
    { q: "Can I speak to an existing client before deciding?", a: "Yes, on request we can connect you with existing clients (with their permission) who've used similar services to yours." },
    { q: "What if I'm not satisfied with the advice?", a: "We offer a free re-evaluation of your plan at any time — our goal is your financial well-being, not a one-time sale. For instance, if a client's plan no longer feels right after a life change like a new job or a growing family, we sit down and rework it together at no extra cost." },
    { q: "Where can I leave a review?", a: "You can leave a review directly on our Google Business profile using the button on this page — it takes less than a minute." },
    { q: "Are these reviews genuine, or can they be manipulated?", a: "Reviews are sourced directly from our own clients and Google, published exactly as received (including replies) — we don't edit, filter out criticism, or fabricate testimonials. For example, if a client mentions a slow response time in a review, that stays visible exactly as written, along with our reply." },
    { q: "Do you pay clients or offer discounts for positive reviews?", a: "No, we never pay for reviews or offer any incentive tied to a positive rating — feedback is requested purely on the basis of the service experience. For instance, we ask the same open-ended question to every client, regardless of whether we expect a glowing review or a mixed one." },
    { q: "Can I see a negative review if one exists?", a: "Yes, reviews are published as received on our Google Business profile, so both positive and constructive feedback are visible, not just the good ones. For example, if a review mentions a delay during a claim process, you'd see that alongside our reply explaining what was done about it." },
    { q: "How many families has The Financial Doctor served?", a: "We've worked with 1000+ families across Madhya Pradesh and beyond, many of whom have left reviews about their experience." },
    { q: "Do reviews reflect both mutual fund and insurance clients?", a: "Yes, reviews come from clients across all our services — mutual funds, SIPs, term, health, motor, and life insurance." },
    { q: "Is The Financial Doctor rated on Google?", a: "Yes, we maintain a Google Business profile where clients can view and leave ratings and written reviews directly." },
    { q: "How do I know these reviews are from real clients and not fake?", a: "Reviews are tied to real client interactions post-onboarding, and many can be cross-verified on our public Google Business listing, which follows Google's own review authenticity policies." },
    { q: "What should I look for in a review before trusting an advisor?", a: "Look for specific details about the advisory process, responsiveness, and follow-up service, rather than generic one-line praise — our reviews reflect real client journeys. For instance, a review describing how an advisor explained a fund switch during a market dip is far more telling than one that just says 'good service'." },
    { q: "Can I trust a mutual fund distributor with good reviews but no SEBI RIA license?", a: "Yes — a Mutual Fund Distributor like us is a distinct, AMFI-regulated role from a SEBI Registered Investment Adviser; reviews reflect service quality and trust, while our ARN-290298 registration reflects our regulatory standing." },
    { q: "Do you ask for a review right after the first meeting?", a: "No, we typically request reviews after clients have experienced our onboarding and ongoing service, not immediately after a first conversation." },
    { q: "What happens if I leave critical feedback privately instead of publicly?", a: "We welcome private feedback just as seriously — it goes straight to Sagar and the team for review and improvement, whether or not it becomes a public review. For example, if a client privately flags a slow response time, that's exactly the kind of feedback that would shape how we set up follow-up reminders." },
    { q: "Can I read reviews from clients in my city or area?", a: "While reviews aren't filtered by location publicly, many of our reviewers are based in and around Sehore and Madhya Pradesh — you're welcome to ask us directly." },
    { q: "Do you showcase reviews from both new and long-term clients?", a: "Yes, our review wall includes feedback from clients at different stages — from those who just onboarded to those we've worked with for years." },
    { q: "How often are new reviews added?", a: "New reviews are added on an ongoing basis as clients complete onboarding, portfolio reviews, or claim/service experiences." },
    { q: "Can I remain anonymous if I leave a review?", a: "Google reviews are tied to your Google profile name by default; if you'd prefer to share feedback privately and anonymously, you can do that directly with our team instead." },
    { q: "Is there a minimum investment size needed before my feedback counts?", a: "No, every client's experience matters to us regardless of investment size — we welcome feedback from SIP starters and larger portfolio clients alike." },
    { q: "Do you respond to reviews, including negative ones?", a: "Yes, we aim to reply to reviews on our Google Business profile, including addressing any concerns raised in less positive feedback." },
    { q: "What's the difference between a testimonial and a Google review?", a: "A testimonial may be a quote we've collected directly and shared on our site, while a Google review is posted independently on our public Google Business profile — we feature both, and both are unedited." },
    { q: "Can I change or delete my review later?", a: "Yes, Google reviews can be edited or deleted by the reviewer at any time directly through their Google account." },
    { q: "Do reviews affect how you prioritise which clients to work with?", a: "No, every client receives the same goal-first advisory process regardless of whether they've left a review — reviews are optional and never a condition of service." },
    { q: "Is there a way to verify a specific reviewer actually worked with The Financial Doctor?", a: "On request, and with the reviewer's permission, we can help connect prospective clients with existing ones for direct verification." },
    { q: "What kind of things do clients usually mention in their reviews?", a: "Common themes include responsiveness, clear explanations without jargon, transparency about commissions, and long-term portfolio support. For example, several reviews mention an advisor explaining why a particular fund category suited their goal, rather than just naming a fund to buy." },
    { q: "Do you have reviews specifically about insurance claims support?", a: "Yes, several clients have shared feedback about our support during health and motor insurance claim processes. For instance, a common thread is clients appreciating help coordinating documentation with the insurer during a hospitalization claim." },
    { q: "Can businesses or self-employed clients also leave reviews?", a: "Yes, we work with salaried, self-employed, and business-owner clients alike, and reviews come from across all these groups." },
    { q: "How do reviews help other prospective clients decide?", a: "Reviews give prospective clients an honest sense of what working with us feels like day-to-day, beyond what our website copy can convey." },
    { q: "Are the reviews on this page moderated or curated by The Financial Doctor?", a: "We publish reviews as received from Google and our own clients — replies included — without cherry-picking only the most flattering ones." },
    { q: "What if my experience was mixed — some good, some not so good?", a: "We'd genuinely like to hear that — honest, balanced feedback helps us improve, and you're welcome to share it as a review or directly with our team. For example, if a client felt the first meeting was great but follow-up communication was slow, that specific kind of feedback is exactly what helps us fix a real gap." },
    { q: "Do you use reviews to train or improve your advisory team?", a: "Yes, recurring themes in client feedback directly inform how we onboard, communicate, and service clients going forward. For instance, if several clients mention wanting more frequent portfolio updates, that pattern is exactly what shapes how often we schedule reviews." },
    { q: "Can I see reviews before booking my first free consultation?", a: "Yes, this Reviews page and our Google Business profile are both public and can be checked anytime before you decide to reach out." },
    { q: "Do reviews mention specific advisors or just the firm generally?", a: "Reviews vary — some mention Sagar Chaturvedi directly, others reference the wider team, since multiple advisors now serve our growing client base." },
    { q: "Is it normal for a financial advisory firm to have very few negative reviews?", a: "We aim to resolve concerns directly and quickly with clients, which is part of why negative public reviews are rare — but we do publish whatever feedback comes in, unfiltered. For example, if a client raises a concern privately, we'd rather resolve it before it becomes a public complaint, not hide it after the fact." },
    { q: "How long have you been collecting client reviews?", a: "We've been gathering client feedback for several years as part of our 8+ years of advisory practice." },
    { q: "Can I leave a review even if I only bought insurance, not mutual funds?", a: "Yes, feedback is welcome from clients who've used any of our services — insurance, mutual funds, or both." },
    { q: "Do you share client reviews on social media too?", a: "Selected reviews and testimonials (with client consent) may be shared on our social channels alongside this Reviews page." },
    { q: "What should I do if I disagree with something stated in a public review?", a: "Reach out to us directly — we're happy to clarify context or address any factual concern about feedback shared publicly." },
    { q: "Are reviews only in English, or in Hindi too?", a: "Reviews come in whichever language the client is comfortable with — English, Hindi, or Hinglish — and are published as received." },
    { q: "Does a high review rating mean guaranteed investment returns?", a: "No — reviews reflect service quality and client experience, not investment performance; mutual fund returns are market-linked and never guaranteed. For example, a client could leave a 5-star review for how clearly we explained the risks, even in a year their equity fund's returns were flat or negative." },
    { q: "Can I ask a reviewer directly about their experience?", a: "With the reviewer's consent, arranged through us, prospective clients can sometimes speak directly with an existing client." },
    { q: "Do you highlight reviews about specific calculators or tools on the site?", a: "Some client feedback does mention finding our SIP, goal, and tax calculators helpful during the planning process, alongside advisory feedback." },
    { q: "What if I've never left an online review before — is it complicated?", a: "Not at all — clicking the 'Leave a Google Review' button on this page takes you straight to a simple star rating and text box, done in under a minute." },
    { q: "Do you follow up with clients specifically to request reviews?", a: "Yes, we occasionally follow up after a milestone (like completed onboarding or a portfolio review) to ask if clients would like to share their experience." },
    { q: "Is leaving a review mandatory to continue working with The Financial Doctor?", a: "No, it's entirely optional and has no bearing on the advisory service or support you receive." },
    { q: "Can I update my review after a follow-up interaction improves my experience?", a: "Yes, Google allows you to edit your review anytime, so you can update it to reflect a more recent or evolved experience." },
    { q: "How does The Financial Doctor's review count compare to when it started?", a: "Our review base has grown steadily alongside our client base — from a single advisor's early days to serving 1000+ families today." },
    { q: "How do I leave a review right now?", a: "Just tap the 'Leave a Google Review' button on this page — it opens our Google Business profile where you can rate and write your experience directly." },
    { q: "Do reviews mention how quickly you respond to enquiries?", a: "Yes, responsiveness is one of the most frequently mentioned points, consistent with our aim to reply within 24 working hours over call, WhatsApp, or email. For example, a client might mention getting a WhatsApp reply within a couple of hours even on a weekend query." },
  ],
  hi: [
    { q: "रिव्यू कैसे लिए जाते हैं?", a: "रिव्यू सीधे क्लाइंट्स से उनके ऑनबोर्डिंग और रिव्यू सेशन के बाद, उनकी सहमति से लिए जाते हैं। उदाहरण के लिए, किसी क्लाइंट के 6 महीने के पोर्टफोलियो रिव्यू के बाद, हम पूछ सकते हैं कि क्या वे अब तक का अपना अनुभव शेयर करना चाहेंगे।" },
    { q: "क्या मैं डिसीजन लेने से पहले किसी क्लाइंट से बात कर सकता हूँ?", a: "हाँ, अनुरोध पर हम आपको (उनकी अनुमति से) मौजूदा क्लाइंट्स से जोड़ सकते हैं।" },
    { q: "अगर मैं सलाह से संतुष्ट नहीं हूँ तो क्या होगा?", a: "हम कभी भी आपकी प्लान का फ्री रीइवैल्यूएशन देते हैं — हमारा लक्ष्य आपकी फाइनेंशियल भलाई है, सिर्फ एक बार की बिक्री नहीं। उदाहरण के लिए, अगर नई नौकरी या बढ़ते परिवार जैसे किसी लाइफ चेंज के बाद क्लाइंट की प्लान सही नहीं लगती, तो हम बिना किसी अतिरिक्त शुल्क के साथ बैठकर उसे फिर से तैयार करते हैं।" },
    { q: "मैं रिव्यू कहाँ दे सकता हूँ?", a: "आप इस पेज पर दिए बटन से हमारे Google Business प्रोफाइल पर सीधे रिव्यू दे सकते हैं — इसमें एक मिनट से कम समय लगता है।" },
    { q: "क्या ये रिव्यू असली हैं, या इन्हें manipulate किया जा सकता है?", a: "रिव्यू सीधे हमारे अपने क्लाइंट्स और Google से आते हैं, जैसे मिलते हैं वैसे ही पब्लिश होते हैं (रिप्लाई सहित) — हम कभी एडिट, फिल्टर या फर्जी टेस्टिमोनियल नहीं बनाते। उदाहरण के लिए, अगर कोई क्लाइंट रिव्यू में स्लो रिस्पॉन्स टाइम का जिक्र करता है, तो वह हमारे रिप्लाई के साथ बिल्कुल वैसे ही दिखता है जैसे लिखा गया था।" },
    { q: "क्या आप पॉजिटिव रिव्यू के लिए क्लाइंट्स को पैसे या डिस्काउंट देते हैं?", a: "नहीं, हम कभी रिव्यू के लिए पैसे नहीं देते या पॉजिटिव रेटिंग से जुड़ा कोई इंसेंटिव नहीं देते — फीडबैक सिर्फ सर्विस एक्सपीरियंस के आधार पर मांगा जाता है। उदाहरण के लिए, हम हर क्लाइंट से एक जैसा ओपन-एंडेड सवाल पूछते हैं, चाहे हमें शानदार रिव्यू की उम्मीद हो या मिश्रित।" },
    { q: "अगर कोई नेगेटिव रिव्यू है तो क्या मैं उसे देख सकता हूँ?", a: "हाँ, रिव्यू जैसे मिलते हैं वैसे ही हमारी Google Business प्रोफाइल पर पब्लिश होते हैं, इसलिए पॉजिटिव और कंस्ट्रक्टिव दोनों तरह का फीडबैक दिखता है, सिर्फ अच्छे वाले नहीं। उदाहरण के लिए, अगर कोई रिव्यू क्लेम प्रोसेस में देरी का जिक्र करता है, तो वह हमारे उस बारे में दिए गए जवाब के साथ दिखता है कि हमने इसके लिए क्या किया।" },
    { q: "The Financial Doctor ने कितने परिवारों की सेवा की है?", a: "हमने मध्य प्रदेश और उससे आगे 1000+ परिवारों के साथ काम किया है, जिनमें से कई ने अपने अनुभव के बारे में रिव्यू छोड़े हैं।" },
    { q: "क्या रिव्यू म्यूचुअल फंड और इंश्योरेंस दोनों क्लाइंट्स के होते हैं?", a: "हाँ, रिव्यू हमारी सभी सर्विसेज के क्लाइंट्स से आते हैं — म्यूचुअल फंड, SIP, टर्म, हेल्थ, मोटर और लाइफ इंश्योरेंस।" },
    { q: "क्या The Financial Doctor की Google पर रेटिंग है?", a: "हाँ, हमारी एक Google Business प्रोफाइल है जहाँ क्लाइंट्स सीधे रेटिंग और लिखित रिव्यू देख और दे सकते हैं।" },
    { q: "मुझे कैसे पता चले कि ये रिव्यू असली क्लाइंट्स के हैं, फर्जी नहीं?", a: "रिव्यू ऑनबोर्डिंग के बाद असली क्लाइंट इंटरैक्शन से जुड़े होते हैं, और कई को हमारी पब्लिक Google Business लिस्टिंग पर क्रॉस-वेरीफाई किया जा सकता है, जो Google की खुद की रिव्यू ऑथेंटिसिटी पॉलिसी फॉलो करती है।" },
    { q: "किसी एडवाइजर पर भरोसा करने से पहले रिव्यू में क्या देखना चाहिए?", a: "जनरिक एक-लाइन तारीफ के बजाय एडवाइजरी प्रोसेस, रिस्पॉन्सिवनेस और फॉलो-अप सर्विस की खास डिटेल्स देखें — हमारे रिव्यू असली क्लाइंट जर्नी दिखाते हैं। उदाहरण के लिए, यह बताने वाला रिव्यू कि किसी एडवाइजर ने मार्केट गिरावट के दौरान फंड स्विच कैसे समझाया, सिर्फ 'अच्छी सर्विस' कहने वाले रिव्यू से कहीं ज्यादा बताता है।" },
    { q: "क्या मैं अच्छे रिव्यू पर भरोसा कर सकता हूँ अगर एडवाइजर के पास SEBI RIA लाइसेंस नहीं है?", a: "हाँ — हमारे जैसा म्यूचुअल फंड डिस्ट्रीब्यूटर SEBI रजिस्टर्ड इन्वेस्टमेंट एडवाइजर से एक अलग, AMFI-रेगुलेटेड भूमिका है; रिव्यू सर्विस क्वालिटी और भरोसे को दिखाते हैं, जबकि हमारी ARN-290298 रजिस्ट्रेशन हमारी रेगुलेटरी स्थिति दिखाती है।" },
    { q: "क्या आप पहली मीटिंग के तुरंत बाद ही रिव्यू मांगते हैं?", a: "नहीं, हम आमतौर पर तब रिव्यू मांगते हैं जब क्लाइंट्स हमारी ऑनबोर्डिंग और चल रही सर्विस का अनुभव कर चुके हों, पहली बातचीत के तुरंत बाद नहीं।" },
    { q: "अगर मैं पब्लिक की बजाय प्राइवेट में क्रिटिकल फीडबैक दूं तो क्या होगा?", a: "हम प्राइवेट फीडबैक को भी उतनी ही गंभीरता से लेते हैं — यह सीधे सागर और टीम के पास रिव्यू और सुधार के लिए जाता है, चाहे वह पब्लिक रिव्यू बने या नहीं। उदाहरण के लिए, अगर कोई क्लाइंट प्राइवेट में स्लो रिस्पॉन्स टाइम की बात बताता है, तो यही वह फीडबैक है जो हमारे फॉलो-अप रिमाइंडर सेट करने के तरीके को शेप करता है।" },
    { q: "क्या मैं अपने शहर या क्षेत्र के क्लाइंट्स के रिव्यू पढ़ सकता हूँ?", a: "हालांकि रिव्यू पब्लिकली लोकेशन के हिसाब से फिल्टर नहीं होते, हमारे कई रिव्यूअर सीहोर और मध्य प्रदेश के आस-पास के हैं — आप सीधे हमसे पूछ सकते हैं।" },
    { q: "क्या आप नए और लंबे समय के क्लाइंट्स दोनों के रिव्यू दिखाते हैं?", a: "हाँ, हमारी रिव्यू वॉल में अलग-अलग स्टेज के क्लाइंट्स का फीडबैक शामिल है — अभी ऑनबोर्ड हुए से लेकर सालों से हमारे साथ काम कर रहे क्लाइंट्स तक।" },
    { q: "नए रिव्यू कितनी बार जोड़े जाते हैं?", a: "जैसे-जैसे क्लाइंट्स ऑनबोर्डिंग, पोर्टफोलियो रिव्यू या क्लेम/सर्विस एक्सपीरियंस पूरा करते हैं, नए रिव्यू लगातार जुड़ते रहते हैं।" },
    { q: "अगर मैं रिव्यू छोड़ूं तो क्या मैं anonymous रह सकता हूँ?", a: "Google रिव्यू डिफॉल्ट रूप से आपके Google प्रोफाइल नाम से जुड़े होते हैं; अगर आप प्राइवेट और anonymous तरीके से फीडबैक शेयर करना चाहें, तो सीधे हमारी टीम से कर सकते हैं।" },
    { q: "क्या मेरा फीडबैक मायने रखने के लिए कोई मिनिमम निवेश राशि जरूरी है?", a: "नहीं, हर क्लाइंट का अनुभव हमारे लिए मायने रखता है चाहे निवेश राशि कुछ भी हो — हम SIP शुरू करने वालों से लेकर बड़े पोर्टफोलियो क्लाइंट्स तक सभी का फीडबैक चाहते हैं।" },
    { q: "क्या आप रिव्यू का जवाब देते हैं, नेगेटिव रिव्यू का भी?", a: "हाँ, हम अपनी Google Business प्रोफाइल पर रिव्यू का जवाब देने की कोशिश करते हैं, कम पॉजिटिव फीडबैक में उठाई गई चिंताओं को भी एड्रेस करते हुए।" },
    { q: "टेस्टिमोनियल और Google रिव्यू में क्या फर्क है?", a: "टेस्टिमोनियल वह कोट हो सकता है जो हमने सीधे कलेक्ट करके अपनी साइट पर शेयर किया है, जबकि Google रिव्यू हमारी पब्लिक Google Business प्रोफाइल पर स्वतंत्र रूप से पोस्ट होता है — हम दोनों दिखाते हैं, और दोनों अनएडिटेड होते हैं।" },
    { q: "क्या मैं बाद में अपना रिव्यू बदल या डिलीट कर सकता हूँ?", a: "हाँ, Google रिव्यू को रिव्यूअर कभी भी अपने Google अकाउंट से सीधे एडिट या डिलीट कर सकता है।" },
    { q: "क्या रिव्यू इस बात को प्रभावित करते हैं कि आप किन क्लाइंट्स को प्राथमिकता देते हैं?", a: "नहीं, चाहे किसी क्लाइंट ने रिव्यू छोड़ा हो या नहीं, हर क्लाइंट को वही गोल-फर्स्ट एडवाइजरी प्रोसेस मिलती है — रिव्यू ऑप्शनल हैं और कभी सर्विस की शर्त नहीं।" },
    { q: "क्या यह वेरीफाई करने का कोई तरीका है कि कोई खास रिव्यूअर सच में The Financial Doctor के साथ काम कर चुका है?", a: "अनुरोध पर, और रिव्यूअर की अनुमति से, हम प्रॉस्पेक्टिव क्लाइंट्स को मौजूदा क्लाइंट्स से डायरेक्ट वेरिफिकेशन के लिए जोड़ सकते हैं।" },
    { q: "क्लाइंट्स आमतौर पर अपने रिव्यू में किस तरह की बातें बताते हैं?", a: "आम थीम में रिस्पॉन्सिवनेस, बिना जार्गन के साफ एक्सप्लेनेशन, कमीशन के बारे में पारदर्शिता, और लॉन्ग-टर्म पोर्टफोलियो सपोर्ट शामिल हैं। उदाहरण के लिए, कई रिव्यू में एडवाइजर द्वारा यह समझाने का जिक्र होता है कि कोई खास फंड कैटेगरी उनके गोल के लिए क्यों सही है, सिर्फ फंड का नाम बताने के बजाय।" },
    { q: "क्या आपके पास इंश्योरेंस क्लेम सपोर्ट के बारे में खास रिव्यू हैं?", a: "हाँ, कई क्लाइंट्स ने हेल्थ और मोटर इंश्योरेंस क्लेम प्रोसेस के दौरान हमारे सपोर्ट के बारे में फीडबैक शेयर किया है। उदाहरण के लिए, एक आम बात यह है कि क्लाइंट्स हॉस्पिटलाइजेशन क्लेम के दौरान इंश्योरर के साथ डॉक्यूमेंटेशन कोऑर्डिनेट करने में मिली मदद की सराहना करते हैं।" },
    { q: "क्या बिजनेस या सेल्फ-एम्प्लॉयड क्लाइंट्स भी रिव्यू छोड़ सकते हैं?", a: "हाँ, हम सैलरीड, सेल्फ-एम्प्लॉयड और बिजनेस-ओनर क्लाइंट्स सभी के साथ काम करते हैं, और रिव्यू इन सभी ग्रुप्स से आते हैं।" },
    { q: "रिव्यू दूसरे प्रॉस्पेक्टिव क्लाइंट्स को डिसीजन लेने में कैसे मदद करते हैं?", a: "रिव्यू प्रॉस्पेक्टिव क्लाइंट्स को यह ईमानदार अंदाज़ा देते हैं कि हमारे साथ काम करना रोज़मर्रा में कैसा लगता है, हमारी वेबसाइट कॉपी से आगे।" },
    { q: "क्या इस पेज पर दिए रिव्यू The Financial Doctor द्वारा मॉडरेट या क्यूरेट किए जाते हैं?", a: "हम रिव्यू जैसे Google और अपने क्लाइंट्स से मिलते हैं वैसे ही पब्लिश करते हैं — रिप्लाई सहित — सिर्फ सबसे तारीफ वाले चुनकर नहीं।" },
    { q: "अगर मेरा अनुभव मिला-जुला रहा — कुछ अच्छा, कुछ उतना अच्छा नहीं — तो?", a: "हम इसे सुनना चाहेंगे — ईमानदार, संतुलित फीडबैक हमें सुधार में मदद करता है, और आप इसे रिव्यू के रूप में या सीधे हमारी टीम से शेयर कर सकते हैं। उदाहरण के लिए, अगर किसी क्लाइंट को पहली मीटिंग बढ़िया लगी पर फॉलो-अप कम्युनिकेशन धीमा लगा, तो यही खास तरह का फीडबैक असली कमी सुधारने में हमारी मदद करता है।" },
    { q: "क्या आप रिव्यू का इस्तेमाल अपनी एडवाइजरी टीम को ट्रेन या बेहतर बनाने के लिए करते हैं?", a: "हाँ, क्लाइंट फीडबैक में बार-बार आने वाली थीम सीधे इस बात को शेप करती है कि हम आगे क्लाइंट्स को कैसे ऑनबोर्ड, कम्युनिकेट और सर्विस करते हैं। उदाहरण के लिए, अगर कई क्लाइंट ज्यादा बार पोर्टफोलियो अपडेट चाहने का जिक्र करते हैं, तो यही पैटर्न तय करता है कि हम कितनी बार रिव्यू शेड्यूल करते हैं।" },
    { q: "क्या मैं अपनी पहली फ्री कंसल्टेशन बुक करने से पहले रिव्यू देख सकता हूँ?", a: "हाँ, यह Reviews पेज और हमारी Google Business प्रोफाइल दोनों पब्लिक हैं और आप संपर्क करने का फैसला लेने से पहले कभी भी चेक कर सकते हैं।" },
    { q: "क्या रिव्यू किसी खास एडवाइजर का नाम लेते हैं या सिर्फ फर्म का?", a: "रिव्यू अलग-अलग होते हैं — कुछ सीधे सागर चतुर्वेदी का नाम लेते हैं, कुछ बड़ी टीम का जिक्र करते हैं, क्योंकि अब कई एडवाइजर हमारे बढ़ते क्लाइंट बेस को सर्व करते हैं।" },
    { q: "क्या किसी फाइनेंशियल एडवाइजरी फर्म के बहुत कम नेगेटिव रिव्यू होना सामान्य है?", a: "हम क्लाइंट्स के साथ चिंताओं को सीधे और जल्दी सुलझाने की कोशिश करते हैं, यही एक वजह है कि पब्लिक नेगेटिव रिव्यू कम होते हैं — पर जो भी फीडबैक आता है, हम उसे बिना फिल्टर किए पब्लिश करते हैं। उदाहरण के लिए, अगर कोई क्लाइंट प्राइवेट में कोई चिंता उठाता है, तो हम उसे पब्लिक कंप्लेंट बनने से पहले ही सुलझाना पसंद करते हैं, छुपाना नहीं।" },
    { q: "आप कब से क्लाइंट रिव्यू कलेक्ट कर रहे हैं?", a: "हम अपनी 8+ साल की एडवाइजरी प्रैक्टिस के हिस्से के रूप में कई सालों से क्लाइंट फीडबैक इकट्ठा कर रहे हैं।" },
    { q: "क्या मैं रिव्यू छोड़ सकता हूँ अगर मैंने सिर्फ इंश्योरेंस लिया है, म्यूचुअल फंड नहीं?", a: "हाँ, हमारी किसी भी सर्विस का इस्तेमाल करने वाले क्लाइंट्स से फीडबैक का स्वागत है — इंश्योरेंस, म्यूचुअल फंड, या दोनों।" },
    { q: "क्या आप क्लाइंट रिव्यू सोशल मीडिया पर भी शेयर करते हैं?", a: "चुनिंदा रिव्यू और टेस्टिमोनियल (क्लाइंट की सहमति से) हमारे सोशल चैनलों पर इस Reviews पेज के साथ शेयर किए जा सकते हैं।" },
    { q: "अगर मैं किसी पब्लिक रिव्यू में कही गई किसी बात से असहमत हूं तो क्या करूं?", a: "सीधे हमसे संपर्क करें — हम पब्लिकली शेयर किए गए फीडबैक के बारे में कॉन्टेक्स्ट क्लियर करने या किसी फैक्चुअल चिंता को एड्रेस करने में खुश हैं।" },
    { q: "क्या रिव्यू सिर्फ इंग्लिश में हैं, या हिंदी में भी?", a: "रिव्यू उस भाषा में आते हैं जिसमें क्लाइंट सहज हो — इंग्लिश, हिंदी या हिंग्लिश — और जैसे मिलते हैं वैसे ही पब्लिश होते हैं।" },
    { q: "क्या हाई रिव्यू रेटिंग का मतलब गारंटीड निवेश रिटर्न है?", a: "नहीं — रिव्यू सर्विस क्वालिटी और क्लाइंट एक्सपीरियंस दिखाते हैं, निवेश परफॉरमेंस नहीं; म्यूचुअल फंड रिटर्न मार्केट-लिंक्ड होते हैं और कभी गारंटीड नहीं होते। उदाहरण के लिए, कोई क्लाइंट हमारे रिस्क को साफ तरीके से समझाने के लिए 5-स्टार रिव्यू दे सकता है, भले ही उस साल उसके इक्विटी फंड का रिटर्न फ्लैट या निगेटिव रहा हो।" },
    { q: "क्या मैं किसी रिव्यूअर से सीधे उनके अनुभव के बारे में पूछ सकता हूँ?", a: "रिव्यूअर की सहमति से, हमारे जरिए अरेंज किया गया, प्रॉस्पेक्टिव क्लाइंट्स कभी-कभी सीधे किसी मौजूदा क्लाइंट से बात कर सकते हैं।" },
    { q: "क्या आप साइट पर किसी खास कैलकुलेटर या टूल के बारे में रिव्यू हाइलाइट करते हैं?", a: "कुछ क्लाइंट फीडबैक में एडवाइजरी फीडबैक के साथ-साथ प्लानिंग प्रोसेस के दौरान हमारे SIP, गोल और टैक्स कैलकुलेटर उपयोगी लगने का जिक्र भी है।" },
    { q: "अगर मैंने पहले कभी ऑनलाइन रिव्यू नहीं छोड़ा — क्या यह कॉम्प्लिकेटेड है?", a: "बिल्कुल नहीं — इस पेज पर 'Leave a Google Review' बटन पर क्लिक करना आपको सीधे एक सिंपल स्टार रेटिंग और टेक्स्ट बॉक्स पर ले जाता है, एक मिनट से कम में हो जाता है।" },
    { q: "क्या आप खासतौर पर रिव्यू मांगने के लिए क्लाइंट्स को फॉलो-अप करते हैं?", a: "हाँ, हम कभी-कभी किसी माइलस्टोन (जैसे ऑनबोर्डिंग पूरी होना या पोर्टफोलियो रिव्यू) के बाद फॉलो-अप करते हैं यह पूछने के लिए कि क्या क्लाइंट अपना अनुभव शेयर करना चाहेंगे।" },
    { q: "क्या The Financial Doctor के साथ काम जारी रखने के लिए रिव्यू छोड़ना जरूरी है?", a: "नहीं, यह पूरी तरह ऑप्शनल है और आपको मिलने वाली एडवाइजरी सर्विस या सपोर्ट पर इसका कोई असर नहीं पड़ता।" },
    { q: "अगर फॉलो-अप इंटरैक्शन से मेरा अनुभव बेहतर हो जाए तो क्या मैं अपना रिव्यू अपडेट कर सकता हूँ?", a: "हाँ, Google आपको कभी भी अपना रिव्यू एडिट करने देता है, ताकि आप इसे एक हालिया या बेहतर हुए अनुभव को दिखाने के लिए अपडेट कर सकें।" },
    { q: "The Financial Doctor का रिव्यू काउंट शुरुआत के मुकाबले कैसा है?", a: "हमारा रिव्यू बेस हमारे क्लाइंट बेस के साथ लगातार बढ़ा है — एक अकेले एडवाइजर के शुरुआती दिनों से लेकर आज 1000+ परिवारों की सेवा तक।" },
    { q: "मैं अभी रिव्यू कैसे छोड़ूं?", a: "बस इस पेज पर 'Leave a Google Review' बटन पर टैप करें — यह हमारी Google Business प्रोफाइल खोलता है जहाँ आप सीधे अपना अनुभव रेट और लिख सकते हैं।" },
    { q: "क्या रिव्यू में यह जिक्र होता है कि आप पूछताछ का जवाब कितनी जल्दी देते हैं?", a: "हाँ, रिस्पॉन्सिवनेस सबसे ज्यादा बार जिक्र होने वाली बातों में से एक है, जो कॉल, WhatsApp या ईमेल पर 24 कार्य घंटों के अंदर जवाब देने के हमारे लक्ष्य के अनुरूप है। उदाहरण के लिए, कोई क्लाइंट वीकेंड क्वेरी पर भी कुछ घंटों के अंदर WhatsApp रिप्लाई मिलने का जिक्र कर सकता है।" },
  ],
  hinglish: [
    { q: "Reviews kaise collect kiye jaate hain?", a: "Reviews directly clients se unke onboarding aur review session ke baad, unki consent se liye jaate hain. Jaise, kisi client ke 6 mahine ke portfolio review ke baad, hum pooch sakte hain ki kya woh ab tak ka apna experience share karna chahenge." },
    { q: "Kya main decision lene se pehle kisi client se baat kar sakta hoon?", a: "Haan, request pe hum aapko (unki permission se) existing clients se connect kar sakte hain." },
    { q: "Agar main advice se satisfied nahi hoon to kya hoga?", a: "Hum kabhi bhi aapke plan ka free re-evaluation dete hain — hamara goal aapki financial well-being hai, sirf one-time sale nahi. Jaise, agar nayi job ya badhte family jaise kisi life change ke baad client ka plan sahi nahi lagta, to hum bina kisi extra charge ke saath baith kar use dobara tayyar karte hain." },
    { q: "Main review kaha de sakta hoon?", a: "Aap is page pe diye button se hamare Google Business profile pe directly review de sakte ho — ismein ek minute se kam time lagta hai." },
    { q: "Kya yeh reviews genuine hain, ya inhe manipulate kiya ja sakta hai?", a: "Reviews directly hamare apne clients aur Google se aate hain, jaise milte hain waise hi publish hote hain (reply included) — hum kabhi edit, filter ya fake testimonial nahi banate. Jaise, agar koi client review mein slow response time ka zikar karta hai, to woh hamare reply ke saath bilkul waise hi dikhta hai jaise likha gaya tha." },
    { q: "Kya aap positive review ke liye clients ko paise ya discount dete ho?", a: "Nahi, hum kabhi review ke liye paise nahi dete ya positive rating se juda koi incentive nahi dete — feedback sirf service experience ke basis pe maanga jaata hai. Jaise, hum har client se ek jaisa open-ended sawaal poochte hain, chahe humein shandaar review ki umeed ho ya mixed." },
    { q: "Agar koi negative review hai to kya main use dekh sakta hoon?", a: "Haan, reviews jaise milte hain waise hi hamari Google Business profile pe publish hote hain, isliye positive aur constructive dono tarah ka feedback dikhta hai, sirf achhe wale nahi. Jaise, agar koi review claim process mein delay ka zikar karta hai, to woh hamare us baare mein diye gaye reply ke saath dikhta hai ki humne iske liye kya kiya." },
    { q: "The Financial Doctor ne kitni families ki service ki hai?", a: "Humne Madhya Pradesh aur usse aage 1000+ families ke saath kaam kiya hai, jinme se kai ne apne experience ke baare mein review chhode hain." },
    { q: "Kya reviews mutual fund aur insurance dono clients ke hote hain?", a: "Haan, reviews hamari sabhi services ke clients se aate hain — mutual funds, SIP, term, health, motor aur life insurance." },
    { q: "Kya The Financial Doctor ki Google pe rating hai?", a: "Haan, hamari ek Google Business profile hai jaha clients directly rating aur written review dekh aur de sakte hain." },
    { q: "Mujhe kaise pata chale ki yeh reviews real clients ke hain, fake nahi?", a: "Reviews onboarding ke baad real client interaction se jude hote hain, aur kai ko hamari public Google Business listing pe cross-verify kiya ja sakta hai, jo Google ki apni review authenticity policy follow karti hai." },
    { q: "Kisi advisor pe trust karne se pehle review mein kya dekhna chahiye?", a: "Generic ek-line taarif ke bajaye advisory process, responsiveness aur follow-up service ki specific details dekho — hamare reviews real client journey dikhate hain. Jaise, yeh batane wala review ki kisi advisor ne market dip ke dauran fund switch kaise samjhaya, sirf 'good service' kehne wale review se kahin zyada batata hai." },
    { q: "Kya main achhe reviews pe trust kar sakta hoon agar advisor ke paas SEBI RIA license nahi hai?", a: "Haan — hamare jaisa mutual fund distributor SEBI registered Investment Adviser se ek alag, AMFI-regulated role hai; reviews service quality aur trust dikhate hain, jabki hamari ARN-290298 registration hamari regulatory standing dikhati hai." },
    { q: "Kya aap pehli meeting ke turant baad hi review maangte ho?", a: "Nahi, hum usually tab review maangte hain jab clients hamari onboarding aur ongoing service ka experience kar chuke hon, pehli baatcheet ke turant baad nahi." },
    { q: "Agar main public ki bajaye private mein critical feedback doon to kya hoga?", a: "Hum private feedback ko bhi utni hi seriousness se lete hain — yeh directly Sagar aur team ke paas review aur improvement ke liye jaata hai, chahe woh public review bane ya nahi. Jaise, agar koi client private mein slow response time ki baat batata hai, to yehi wo feedback hai jo hamare follow-up reminders set karne ke tareeke ko shape karta hai." },
    { q: "Kya main apne city ya area ke clients ke reviews padh sakta hoon?", a: "Halanki reviews publicly location ke hisaab se filter nahi hote, hamare kai reviewers Sehore aur Madhya Pradesh ke aas-paas ke hain — aap directly hum se pooch sakte ho." },
    { q: "Kya aap naye aur long-term clients dono ke reviews dikhate ho?", a: "Haan, hamari review wall mein different stage ke clients ka feedback shamil hai — abhi onboard hue se lekar saalon se hamare saath kaam kar rahe clients tak." },
    { q: "Naye reviews kitni baar add hote hain?", a: "Jaise-jaise clients onboarding, portfolio review ya claim/service experience complete karte hain, naye reviews continuously add hote rehte hain." },
    { q: "Agar main review chhodun to kya main anonymous reh sakta hoon?", a: "Google reviews default roop se aapke Google profile naam se jude hote hain; agar aap private aur anonymous tareeke se feedback share karna chahen, to directly hamari team se kar sakte ho." },
    { q: "Kya mera feedback matter karne ke liye koi minimum investment amount zaroori hai?", a: "Nahi, har client ka experience hamare liye matter karta hai chahe investment amount kuch bhi ho — hum SIP shuru karne walon se lekar bade portfolio clients tak sabka feedback chahte hain." },
    { q: "Kya aap reviews ka jawab dete ho, negative reviews ka bhi?", a: "Haan, hum apni Google Business profile pe reviews ka jawab dene ki koshish karte hain, kam positive feedback mein uthayi gayi concerns ko bhi address karte hue." },
    { q: "Testimonial aur Google review mein kya farak hai?", a: "Testimonial wo quote ho sakta hai jo humne directly collect karke apni site pe share kiya hai, jabki Google review hamari public Google Business profile pe independently post hota hai — hum dono dikhate hain, aur dono unedited hote hain." },
    { q: "Kya main baad mein apna review badal ya delete kar sakta hoon?", a: "Haan, Google review ko reviewer kabhi bhi apne Google account se directly edit ya delete kar sakta hai." },
    { q: "Kya reviews is baat ko affect karte hain ki aap kaunse clients ko priority dete ho?", a: "Nahi, chahe kisi client ne review chhoda ho ya nahi, har client ko wahi goal-first advisory process milti hai — reviews optional hain aur kabhi service ki shart nahi." },
    { q: "Kya yeh verify karne ka koi tareeka hai ki koi specific reviewer sach mein The Financial Doctor ke saath kaam kar chuka hai?", a: "Request pe, aur reviewer ki permission se, hum prospective clients ko existing clients se direct verification ke liye connect kar sakte hain." },
    { q: "Clients usually apne reviews mein kis tarah ki baatein batate hain?", a: "Common themes mein responsiveness, bina jargon ke clear explanation, commission ke baare mein transparency, aur long-term portfolio support shamil hain. Jaise, kai reviews mein advisor dwara yeh samjhane ka zikar hota hai ki koi khaas fund category unke goal ke liye kyun sahi hai, sirf fund ka naam batane ke bajaye." },
    { q: "Kya aapke paas insurance claim support ke baare mein specific reviews hain?", a: "Haan, kai clients ne health aur motor insurance claim process ke dauran hamare support ke baare mein feedback share kiya hai. Jaise, ek common baat yeh hai ki clients hospitalization claim ke dauran insurer ke saath documentation coordinate karne mein mili help ki appreciation karte hain." },
    { q: "Kya business ya self-employed clients bhi reviews chhod sakte hain?", a: "Haan, hum salaried, self-employed aur business-owner clients sabke saath kaam karte hain, aur reviews in sabhi groups se aate hain." },
    { q: "Reviews doosre prospective clients ko decision lene mein kaise help karte hain?", a: "Reviews prospective clients ko yeh honest andaza dete hain ki hamare saath kaam karna roz-marra mein kaisa lagta hai, hamari website copy se aage." },
    { q: "Kya is page pe diye reviews The Financial Doctor dwara moderate ya curate kiye jaate hain?", a: "Hum reviews jaise Google aur apne clients se milte hain waise hi publish karte hain — reply included — sirf sabse taarif wale chun kar nahi." },
    { q: "Agar mera experience mixed raha — kuch achha, kuch utna achha nahi — to?", a: "Hum ise sunna chahenge — honest, balanced feedback humein improve karne mein help karta hai, aur aap ise review ke roop mein ya directly hamari team se share kar sakte ho. Jaise, agar kisi client ko pehli meeting badhiya lagi par follow-up communication slow laga, to yehi khaas tarah ka feedback asli gap sudharne mein hamari help karta hai." },
    { q: "Kya aap reviews ka use apni advisory team ko train ya better banane ke liye karte ho?", a: "Haan, client feedback mein baar-baar aane wali themes directly is baat ko shape karti hain ki hum aage clients ko kaise onboard, communicate aur service karte hain. Jaise, agar kai clients zyada baar portfolio updates chahne ka zikar karte hain, to yehi pattern tay karta hai ki hum kitni baar reviews schedule karte hain." },
    { q: "Kya main apni pehli free consultation book karne se pehle reviews dekh sakta hoon?", a: "Haan, yeh Reviews page aur hamari Google Business profile dono public hain aur aap contact karne ka decision lene se pehle kabhi bhi check kar sakte ho." },
    { q: "Kya reviews kisi specific advisor ka naam lete hain ya sirf firm ka?", a: "Reviews alag-alag hote hain — kuch directly Sagar Chaturvedi ka naam lete hain, kuch badi team ka zikar karte hain, kyunki ab kai advisors hamare badhte client base ko serve karte hain." },
    { q: "Kya kisi financial advisory firm ke bahut kam negative reviews hona normal hai?", a: "Hum clients ke saath concerns ko directly aur jaldi resolve karne ki koshish karte hain, yeh ek wajah hai ki public negative reviews kam hote hain — par jo bhi feedback aata hai, hum use bina filter kiye publish karte hain. Jaise, agar koi client private mein koi concern uthata hai, to hum use public complaint banne se pehle hi resolve karna pasand karte hain, chupana nahi." },
    { q: "Aap kab se client reviews collect kar rahe hain?", a: "Hum apni 8+ saal ki advisory practice ke hisse ke roop mein kai saalon se client feedback collect kar rahe hain." },
    { q: "Kya main review chhod sakta hoon agar maine sirf insurance liya hai, mutual fund nahi?", a: "Haan, hamari kisi bhi service ka use karne wale clients se feedback ka swagat hai — insurance, mutual funds, ya dono." },
    { q: "Kya aap client reviews social media pe bhi share karte ho?", a: "Chuninda reviews aur testimonials (client ki consent se) hamare social channels pe is Reviews page ke saath share kiye ja sakte hain." },
    { q: "Agar main kisi public review mein kahi gayi kisi baat se disagree karoon to kya karoon?", a: "Directly hum se contact karo — hum publicly share kiye gaye feedback ke baare mein context clear karne ya kisi factual concern ko address karne mein khush hain." },
    { q: "Kya reviews sirf English mein hain, ya Hindi mein bhi?", a: "Reviews us language mein aate hain jisme client comfortable ho — English, Hindi ya Hinglish — aur jaise milte hain waise hi publish hote hain." },
    { q: "Kya high review rating ka matlab guaranteed investment return hai?", a: "Nahi — reviews service quality aur client experience dikhate hain, investment performance nahi; mutual fund returns market-linked hote hain aur kabhi guaranteed nahi hote. Jaise, koi client hamare risk ko clearly samjhane ke liye 5-star review de sakta hai, chahe us saal unke equity fund ka return flat ya negative raha ho." },
    { q: "Kya main kisi reviewer se directly unke experience ke baare mein pooch sakta hoon?", a: "Reviewer ki consent se, hamare through arrange kiya gaya, prospective clients kabhi-kabhi directly kisi existing client se baat kar sakte hain." },
    { q: "Kya aap site pe kisi specific calculator ya tool ke baare mein reviews highlight karte ho?", a: "Kuch client feedback mein advisory feedback ke saath-saath planning process ke dauran hamare SIP, goal aur tax calculators useful lagne ka zikar bhi hai." },
    { q: "Agar maine pehle kabhi online review nahi chhoda — kya yeh complicated hai?", a: "Bilkul nahi — is page pe 'Leave a Google Review' button pe click karna aapko directly ek simple star rating aur text box pe le jaata hai, ek minute se kam mein ho jaata hai." },
    { q: "Kya aap khaas taur pe review maangne ke liye clients ko follow-up karte ho?", a: "Haan, hum kabhi-kabhi kisi milestone (jaise onboarding complete hona ya portfolio review) ke baad follow-up karte hain yeh poochne ke liye ki kya client apna experience share karna chahenge." },
    { q: "Kya The Financial Doctor ke saath kaam jaari rakhne ke liye review chhodna zaroori hai?", a: "Nahi, yeh puri tarah optional hai aur aapko milne wali advisory service ya support pe iska koi asar nahi padta." },
    { q: "Agar follow-up interaction se mera experience better ho jaaye to kya main apna review update kar sakta hoon?", a: "Haan, Google aapko kabhi bhi apna review edit karne deta hai, taaki aap ise ek recent ya behtar hue experience ko dikhane ke liye update kar sako." },
    { q: "The Financial Doctor ka review count shuruaat ke comparison mein kaisa hai?", a: "Hamara review base hamare client base ke saath continuously badha hai — ek akele advisor ke shuruaati dino se lekar aaj 1000+ families ki service tak." },
    { q: "Main abhi review kaise chhodun?", a: "Bas is page pe 'Leave a Google Review' button pe tap karo — yeh hamari Google Business profile kholta hai jaha aap directly apna experience rate aur likh sakte ho." },
    { q: "Kya reviews mein yeh zikar hota hai ki aap enquiries ka jawab kitni jaldi dete ho?", a: "Haan, responsiveness sabse zyada baar zikar hone wali baaton mein se ek hai, jo call, WhatsApp ya email pe 24 working hours ke andar reply karne ke hamare goal ke consistent hai. Jaise, koi client weekend query pe bhi kuch ghanton ke andar WhatsApp reply milne ka zikar kar sakta hai." },
  ],
};

export default function ReviewsPage() {
  return (
    <div className="relative" data-testid="reviews-page-root">
      <SEO
        title="The Financial Doctor | Client Reviews & Testimonials"
        description="See what our clients say about mutual fund and insurance advisory with The Financial Doctor — real reviews from real investors."
        keywords="mutual fund advisor reviews, financial advisor testimonials, best insurance advisor"
        path="/reviews"
      />
      <Navbar />
      <main>
        {/* GOLD / DARK "TESTIMONIAL WALL" HERO — deliberately the darkest,
            warmest-accented page on the site; a giant star rating replaces
            the usual stat row since trust is the entire point here. */}
        <section className="relative overflow-hidden bg-[#1A1508] pt-28 pb-16 md:pt-32 md:pb-20 px-6 text-center">
          <div
            aria-hidden
            className="fund-animate-in absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] opacity-30 blur-3xl"
            style={{ background: "radial-gradient(ellipse at center, rgba(199,154,46,0.5) 0%, transparent 70%)" }}
          />
          <div className="container-x relative max-w-2xl mx-auto">
            <div className="fund-animate-in inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#4A3D1A] text-[11px] tracking-[0.2em] uppercase text-[#D9B15C] font-semibold">
              Word on the street
            </div>
            <div className="fund-animate-in fund-animate-in-delay-1 flex justify-center gap-1.5 mt-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={26} fill="#D9B15C" stroke="#D9B15C" />
              ))}
            </div>
            <h1 className="fund-animate-in fund-animate-in-delay-2 font-display text-3xl sm:text-4xl md:text-5xl text-[#F6F1E8] mt-5 leading-tight">
              Trusted by <span className="font-italic-serif" style={{ color: "#D9B15C" }}>1000+ families</span> across MP.
            </h1>
            <p className="fund-animate-in fund-animate-in-delay-3 mt-4 text-[#F6F1E8]/65 text-[15px] sm:text-base max-w-xl mx-auto leading-relaxed">
              Real reviews from real investors — sourced from our own clients and Google,
              published exactly as received, replies included.
            </p>
          </div>
        </section>
        <ProblemSolution
          accent="#D9B15C"
          problem="Reviews on most financial-advisor sites are hand-picked marketing quotes, or worse, entirely fabricated — there's no way to tell if a real client actually said it."
          solution="Every review here is either sourced live from Google or submitted directly on this site by a real client, published exactly as received — including our replies, unedited."
        />
        <Reviews hideHeading />

        {/* REVIEW CTA — encourages happy clients to leave a review */}
        <section className="bg-[#0E1B2C] py-14 px-6 text-center">
          <div className="container-x max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-serif text-[#F6F1E8] mb-3">
              Loved working with us?
            </h2>
            <p className="text-[#F6F1E8]/80 mb-6">
              Your experience could be exactly what helps another family take the
              first step towards better financial planning. It takes less than a
              minute to share yours.
            </p>
            <a
              href={GOOGLE_REVIEW_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-[#024396] text-white px-8 py-3 rounded-full font-display hover:bg-[#0356c4] transition-colors"
            >
              Leave a Google Review
            </a>
          </div>
        </section>

        <FAQSection title="Reviews — Frequently Asked Questions" data={reviewsFAQ} />
      </main>
      <Footer />
      <FloatingActions />
    </div>
  );
}
