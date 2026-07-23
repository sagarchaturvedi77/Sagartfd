// Data for programmatic city/state landing pages
// (/mutual-fund-distributor-in-:slug). Each entry has genuinely different
// copy — not just a swapped city name — since Google treats near-identical
// templated "doorway pages" as spam and won't rank them. Content is honest
// about TFD's actual footprint: physically based in Sehore, MP, serving
// nearby MP cities in person and everywhere else via video consultation.
//
// `cultureLine` is a short, region-flavoured motivational one-liner shown
// in the hero — deliberately distinct per city (not a reused template) so
// 40 near-identical pages don't read as one doorway page copy-pasted with
// the name swapped.
export const CITY_PAGES = [
  {
    slug: "sehore",
    name: "Sehore",
    kind: "city",
    state: "Madhya Pradesh",
    lat: 23.2, lng: 77.08,
    heroLine: "our home base",
    cultureLine: "Sehore invests the way it lives — decisions made together, over chai, not alone at 11pm scrolling an app.",
    intro:
      "Sehore is where The Financial Doctor started — Sagar Chaturvedi's office sits above SK Finance on Sekdakhedi Road, near the New Bus Stand. If you're in Sehore, an in-person consultation is a short walk away, not a video call.",
    localNote:
      "Most of our earliest clients are Sehore families we've worked with for years — from a first ₹2,000 SIP to full family protection planning across mutual funds, term, and health insurance.",
    meetingMode: "In-person at our Sehore office, or video call — your choice.",
  },
  {
    slug: "bhopal",
    name: "Bhopal",
    kind: "city",
    state: "Madhya Pradesh",
    lat: 23.26, lng: 77.41,
    heroLine: "the state capital, 40 minutes from our office",
    cultureLine: "Bhopal's Lake City pace is unhurried — and that's exactly the temperament a 15-year SIP rewards.",
    intro:
      "Bhopal is close enough that in-person meetings are genuinely easy to arrange — many of our Bhopal clients started with a video call and later met us in person once they were comfortable. We work with salaried professionals, government employees, and small business owners across the city.",
    localNote:
      "A recurring pattern with Bhopal clients: a stable government or PSU salary, EPF as the only retirement plan, and no real investment beyond that. We usually start there — layering a goal-based SIP on top of what's already secure.",
    meetingMode: "In-person visits can be arranged in Bhopal, alongside video consultations.",
  },
  {
    slug: "indore",
    name: "Indore",
    kind: "city",
    state: "Madhya Pradesh",
    lat: 22.72, lng: 75.86,
    heroLine: "MP's business hub",
    cultureLine: "Indore built its wealth on vyapar and hustle — we just help make sure some of it compounds quietly in the background too.",
    intro:
      "Indore's business community — traders, manufacturers, and professionals — often has irregular income patterns that don't fit a rigid monthly SIP. We build flexible plans around that: a base SIP plus lumpsum top-ups when business is strong.",
    localNote:
      "For self-employed Indore clients, insurance planning matters even more than for salaried families — there's no employer group cover as a fallback, so we usually start with an independent term and health cover review.",
    meetingMode: "Video consultation is most common for Indore clients; in-person visits can be arranged on request.",
  },
  {
    slug: "gwalior",
    name: "Gwalior",
    kind: "city",
    state: "Madhya Pradesh",
    lat: 26.22, lng: 78.18,
    heroLine: "MP's defence & education city",
    cultureLine: "Gwalior runs on discipline — parade-ground punctuality translates surprisingly well into a SIP that never misses a date.",
    intro:
      "Gwalior has a heavy concentration of defence establishments, government offices, and long-standing educational institutions — which means a lot of our conversations here start with a client who already has a stable pension-track job and is investing for the first time outside EPF.",
    localNote:
      "For Gwalior's government and defence-service clients, we usually map out pension timelines first, then build a SIP plan that fills the real gap between what the pension will cover and what retirement will actually cost.",
    meetingMode: "Video consultation is most common for Gwalior clients; in-person visits can be arranged on request.",
  },
  {
    slug: "jabalpur",
    name: "Jabalpur",
    kind: "city",
    state: "Madhya Pradesh",
    lat: 23.18, lng: 79.99,
    heroLine: "MP's judicial & education hub",
    cultureLine: "Jabalpur values a case built on evidence, not instinct — which is exactly how we'd like every investment decision made too.",
    intro:
      "Jabalpur's economy leans heavily on judiciary staff, government employees, and a large student and teaching population — we work with all three, from a first-year lecturer starting a ₹1,000 SIP to a senior officer consolidating two decades of scattered investments.",
    localNote:
      "A common Jabalpur pattern: multiple small LIC policies bought over the years instead of one clear plan. Our first conversation is usually just laying all of it out and figuring out what's actually working.",
    meetingMode: "Video consultation is most common for Jabalpur clients; in-person visits can be arranged on request.",
  },
  {
    slug: "ujjain",
    name: "Ujjain",
    kind: "city",
    state: "Madhya Pradesh",
    lat: 23.18, lng: 75.78,
    heroLine: "temple city, small-business economy",
    cultureLine: "Ujjain understands faith and patience better than most cities — both are exactly what a long-term SIP asks of you.",
    intro:
      "Ujjain's local economy runs on small businesses and trade tied to the city's pilgrim and tourism flow — income here is often seasonal, spiking around specific months, so we build SIP plans with room for lumpsum top-ups rather than a rigid fixed monthly amount.",
    localNote:
      "Many Ujjain clients come to us wanting to convert years of gold-buying-as-savings into a more liquid, goal-linked portfolio — we don't tell anyone to stop buying gold, we just add mutual funds alongside it.",
    meetingMode: "Video consultation is most common for Ujjain clients; in-person visits can be arranged on request.",
  },
  {
    slug: "dewas",
    name: "Dewas",
    kind: "city",
    state: "Madhya Pradesh",
    lat: 22.97, lng: 76.05,
    heroLine: "an industrial town close to home",
    cultureLine: "Dewas's factories run on shift-schedules and steady wages — the same steadiness that makes a monthly SIP genuinely painless.",
    intro:
      "Dewas's industrial base — currency press, textile and auto-ancillary units among them — means most of our clients here are salaried employees with a fixed monthly credit, ideal for a disciplined SIP that never has to be rethought month to month.",
    localNote:
      "Dewas clients are close enough to our Sehore office that an in-person first meeting is genuinely easy to arrange, though most ongoing check-ins happen over a quick call once the plan is set.",
    meetingMode: "In-person visits can be arranged from our Sehore office; video consultation for ongoing check-ins.",
  },
  {
    slug: "nagda",
    name: "Nagda",
    kind: "city",
    state: "Madhya Pradesh",
    lat: 23.45, lng: 75.42,
    heroLine: "an industrial town on the Chambal",
    cultureLine: "Nagda's mills taught generations to save for the season ahead — mutual funds just give that same instinct a better home.",
    intro:
      "Nagda's economy has long been anchored by its industrial units, and a lot of our clients here are factory employees and small traders used to planning around a fixed pay cycle — a good starting point for a disciplined SIP.",
    localNote:
      "Nagda clients often come to us after a colleague or relative in the same industrial township already worked with us — referrals travel fast in a close-knit working community like this.",
    meetingMode: "Video consultation is most common for Nagda clients; in-person visits can be arranged on request.",
  },
  {
    slug: "ashta",
    name: "Ashta",
    kind: "city",
    state: "Madhya Pradesh",
    lat: 23.03, lng: 76.72,
    heroLine: "a market town near Sehore",
    cultureLine: "Ashta's mandi runs on patience through the season — the same patience that turns a small SIP into a real corpus over the years.",
    intro:
      "Ashta's economy is built around its agricultural market and small trading businesses — income here often follows the crop and mandi cycle, so we build SIP plans with room to flex around that rather than forcing a rigid fixed date.",
    localNote:
      "Being this close to our Sehore office, Ashta clients get the same in-person option as Sehore itself — many prefer a first meeting face to face before settling into video check-ins.",
    meetingMode: "In-person at our nearby Sehore office, or video call — your choice.",
  },
  {
    slug: "sarangpur",
    name: "Sarangpur",
    kind: "city",
    state: "Madhya Pradesh",
    lat: 23.56, lng: 76.47,
    heroLine: "a temple town in the Malwa belt",
    cultureLine: "Sarangpur's rhythm is built around ritual and routine — the exact quality that makes a SIP date impossible to forget.",
    intro:
      "Sarangpur's local economy is closely tied to its temple town status — small business owners and traders whose income has natural seasonal peaks around festival and pilgrimage periods.",
    localNote:
      "We build Sarangpur clients' SIP plans with lumpsum top-up room around the busier pilgrimage months, rather than pretending income arrives in a perfectly flat line every month.",
    meetingMode: "Video consultation is most common for Sarangpur clients; in-person visits can be arranged on request.",
  },
  {
    slug: "shujalpur",
    name: "Shujalpur",
    kind: "city",
    state: "Madhya Pradesh",
    lat: 23.41, lng: 76.75,
    heroLine: "a Malwa agricultural market town",
    cultureLine: "Shujalpur's farmers and traders already think in seasons and cycles — a SIP is just that same thinking, applied to money.",
    intro:
      "Shujalpur's economy runs on its agricultural mandi and small trading community — many of our conversations here start with someone whose income moves with the harvest, not a fixed monthly slip.",
    localNote:
      "For Shujalpur's mandi-linked clients, we usually build a base SIP that keeps running quietly plus room for a bigger lumpsum right after a strong harvest season.",
    meetingMode: "Video consultation is most common for Shujalpur clients; in-person visits can be arranged on request.",
  },
  {
    slug: "vidisha",
    name: "Vidisha",
    kind: "city",
    state: "Madhya Pradesh",
    lat: 23.53, lng: 77.81,
    heroLine: "a historic town near Bhopal",
    cultureLine: "Vidisha has been standing for two thousand years — a reminder that the things worth building are rarely built overnight.",
    intro:
      "Vidisha's mix of government employees, small traders, and agriculture-linked businesses gives us a client base similar to Ashta or Sarangpur — a blend of steady salaried income and seasonal trading income, each needing a slightly different SIP structure.",
    localNote:
      "Vidisha clients are close enough to Bhopal and Sehore that an in-person meeting is rarely a hassle to arrange, if that's what you'd prefer for the first conversation.",
    meetingMode: "In-person visits can be arranged; video consultation for ongoing check-ins.",
  },
  {
    slug: "mumbai",
    name: "Mumbai",
    kind: "city",
    state: "Maharashtra",
    lat: 19.08, lng: 72.88,
    heroLine: "India's financial capital — and a genuinely remote relationship",
    cultureLine: "Mumbai never really stops moving — a SIP is the one financial decision here that's designed to run quietly while you don't.",
    intro:
      "We're not going to pretend we have a Mumbai office — we don't. What we offer Mumbai clients is the same AMFI-registered advisory (ARN-290298), the same free portfolio reviews, and the same Regular Plan servicing, entirely over video call and WhatsApp. For many clients, that's actually more convenient than fitting in an office visit around Mumbai traffic.",
    localNote:
      "Mumbai clients often already have some investments through a bank RM or an app — our first conversation is usually a portfolio review, checking whether what they hold actually matches their goals, not just what was sold to them.",
    meetingMode: "100% video consultation — no in-person option, and we say so upfront.",
  },
  {
    slug: "pune",
    name: "Pune",
    kind: "city",
    state: "Maharashtra",
    lat: 18.52, lng: 73.86,
    heroLine: "IT & auto-engineering hub — over video",
    cultureLine: "Pune raised a generation on ambition and engineering precision — we just apply that same precision to the plan behind your paycheck.",
    intro:
      "Pune's mix of IT professionals and auto/engineering companies means most of our Pune clients are young, salaried, and just a few years into their first real income — often with ESOPs or RSUs adding complexity we help them actually understand.",
    localNote:
      "The most common first question from Pune clients: 'I have some stocks/ESOPs and a couple of SIPs an app suggested — is this actually a plan?' Usually it isn't, and that review is where we start.",
    meetingMode: "Video consultation across Pune.",
  },
  {
    slug: "nagpur",
    name: "Nagpur",
    kind: "city",
    state: "Maharashtra",
    lat: 21.15, lng: 79.09,
    heroLine: "central India's logistics hub — over video",
    cultureLine: "Nagpur sits at the exact centre of the country — a fitting place to build a plan that's meant to stay balanced for decades.",
    intro:
      "Nagpur's growing logistics and government-sector presence (including MIHAN) brings us a mix of salaried professionals and small business owners. We keep the same process for both: goals first, product second.",
    localNote:
      "Nagpur clients often ask us to compare what a bank RM recommended against what we'd suggest — we're comfortable with that comparison because our recommendations aren't tied to a bank's product targets.",
    meetingMode: "Video consultation across Nagpur.",
  },
  {
    slug: "nashik",
    name: "Nashik",
    kind: "city",
    state: "Maharashtra",
    lat: 20.0, lng: 73.79,
    heroLine: "wine country & manufacturing — over video",
    cultureLine: "Good wine and a good SIP share one secret — neither rewards impatience, both reward the years you leave them alone.",
    intro:
      "Nashik's economy spans manufacturing, agriculture-linked business, and a growing wine industry — we work with clients across all of it, video-first, the same AMFI-registered process (ARN-290298) we use everywhere.",
    localNote:
      "A lot of Nashik clients are mid-career professionals realizing their only investment so far has been a house — we usually start with a simple equity SIP to build a second asset class alongside real estate.",
    meetingMode: "Video consultation across Nashik.",
  },
  {
    slug: "ahmedabad",
    name: "Ahmedabad",
    kind: "city",
    state: "Gujarat",
    lat: 23.02, lng: 72.57,
    heroLine: "Gujarat's business capital — over video",
    cultureLine: "Ahmedabad taught the world 'business first' — we just make sure the businessman's own household finances get the same discipline.",
    intro:
      "Ahmedabad's textile, diamond, and trading businesses mean most of our clients here are self-employed with income that moves in cycles, not a fixed monthly number. We build around that reality instead of pretending everyone gets a payslip on the 1st.",
    localNote:
      "Insurance is usually the first conversation with Ahmedabad's business-owner clients — no employer cover to fall back on — before we even get to fund selection.",
    meetingMode: "Video consultation across Ahmedabad.",
  },
  {
    slug: "surat",
    name: "Surat",
    kind: "city",
    state: "Gujarat",
    lat: 21.17, lng: 72.83,
    heroLine: "diamond & textile city — over video",
    cultureLine: "A Surat diamond is cut and polished patiently over weeks — your portfolio deserves that same patient, deliberate treatment.",
    intro:
      "Surat runs on diamond polishing and textile manufacturing — industries with genuinely lumpy cash flow. Our Surat clients are mostly business owners and traders who need a plan flexible enough to survive a slow quarter without breaking.",
    localNote:
      "We see a lot of first-generation wealth in Surat — successful business owners who haven't yet built a formal investment plan outside the business itself. Diversifying out of the business is usually the core conversation.",
    meetingMode: "Video consultation across Surat.",
  },
  {
    slug: "vadodara",
    name: "Vadodara",
    kind: "city",
    state: "Gujarat",
    lat: 22.31, lng: 73.19,
    heroLine: "PSU & manufacturing hub — over video",
    cultureLine: "Vadodara's cultured, unhurried pace mirrors what a good SIP actually needs — steady, not sensational.",
    intro:
      "Vadodara's large PSU and manufacturing employers (GSFC, IOCL, and others) mean a lot of our clients here are salaried engineers with steady income and employer benefits — a different starting point from Surat or Ahmedabad's business owners.",
    localNote:
      "Vadodara clients often already have EPF and some LIC — our value-add is usually a clear-eyed review of whether that's actually enough for their real goals, and layering equity mutual funds where it isn't.",
    meetingMode: "Video consultation across Vadodara.",
  },
  {
    slug: "rajkot",
    name: "Rajkot",
    kind: "city",
    state: "Gujarat",
    lat: 22.3, lng: 70.8,
    heroLine: "Saurashtra's manufacturing hub — over video",
    cultureLine: "Rajkot's engineers build machines that run for decades on precision — a portfolio built with the same precision compounds just as reliably.",
    intro:
      "Rajkot's economy is built on small and mid-size manufacturing — auto parts, forging, engineering goods. Most clients we work with here are business-owning families managing both the business and household finances together.",
    localNote:
      "A recurring theme with Rajkot clients: reinvesting almost everything back into the business. We usually start by carving out even a small, separate SIP that isn't tied to how the business is doing that month.",
    meetingMode: "Video consultation across Rajkot.",
  },
  {
    slug: "dwarka",
    name: "Dwarka",
    kind: "city",
    state: "Gujarat",
    lat: 22.24, lng: 68.97,
    heroLine: "Gujarat's coastal pilgrimage town — over video",
    cultureLine: "Dwarka has stood at the edge of the sea for millennia — proof that what's built to last doesn't need to move fast.",
    intro:
      "Dwarka's economy runs on pilgrimage and tourism flow, alongside coastal trade and small business — income here often has clear seasonal peaks, so we build SIP plans with room for lumpsum top-ups during the busier months rather than a rigid flat amount.",
    localNote:
      "Many Dwarka clients are small business owners with no employer-provided safety net at all — insurance usually comes up early in the very first conversation, before we even discuss fund selection.",
    meetingMode: "Video consultation across Dwarka.",
  },
  {
    slug: "delhi",
    name: "Delhi",
    kind: "city",
    state: "Delhi NCR",
    lat: 28.7, lng: 77.1,
    heroLine: "NCR — served entirely over video",
    cultureLine: "Delhi rewards ambition loudly — SIPs are the one financial habit here that quietly rewards patience instead.",
    intro:
      "Delhi and NCR clients work with us the same way Mumbai clients do — fully remote, over video and WhatsApp. Distance hasn't stopped us from running the same goal-based process: understand your income, goals, and risk appetite before recommending anything.",
    localNote:
      "A lot of our Delhi/NCR conversations start with tax planning — ELSS timing before March, comparing Old vs New regime — since that's often the trigger that gets someone thinking about their broader investments.",
    meetingMode: "100% video consultation — no in-person option, and we say so upfront.",
  },
  {
    slug: "gurgaon",
    name: "Gurgaon",
    kind: "city",
    state: "Delhi NCR",
    lat: 28.46, lng: 77.03,
    heroLine: "corporate NCR — over video",
    cultureLine: "Gurgaon's skyline went up in a decade flat — proof that fast growth is possible, but a portfolio still needs the slow kind too.",
    intro:
      "Gurgaon's concentration of MNC and corporate offices means a lot of our clients here are young professionals with strong salaries, ESOPs, and RSUs — and often no real plan beyond what an app auto-suggested.",
    localNote:
      "Gurgaon clients frequently need help untangling stock options and vested equity from actual liquid investable wealth — two very different things that get treated the same in most people's heads.",
    meetingMode: "100% video consultation — no in-person option, and we say so upfront.",
  },
  {
    slug: "noida",
    name: "Noida",
    kind: "city",
    state: "Delhi NCR",
    lat: 28.54, lng: 77.39,
    heroLine: "IT & media hub, NCR — over video",
    cultureLine: "Noida grew up planned, sector by sector — your portfolio deserves the same deliberate layout instead of a random pile of apps.",
    intro:
      "Noida's IT, BPO, and media companies bring us salaried clients at every career stage — from a first jobber starting their first ₹500 SIP to a senior manager consolidating a decade of scattered mutual fund folios.",
    localNote:
      "A common Noida ask: 'I have 8 different mutual fund folios from 8 different apps — can you make sense of this?' Yes — and usually the fix is fewer, better-chosen funds, not more.",
    meetingMode: "100% video consultation — no in-person option, and we say so upfront.",
  },
  {
    slug: "ghaziabad",
    name: "Ghaziabad",
    kind: "city",
    state: "Delhi NCR",
    lat: 28.67, lng: 77.42,
    heroLine: "NCR's satellite city — over video",
    cultureLine: "Ghaziabad is the gateway everyone passes through — a good financial plan should be the same: the thing that gets you to everything else.",
    intro:
      "Ghaziabad's mix of salaried professionals and small business families means our client base here is genuinely varied — the common thread is that most are investing without a written-down goal behind it, just a habit of saving.",
    localNote:
      "With Ghaziabad clients we usually spend the first call just naming actual goals — a child's education, a house down payment, retirement — since most SIPs we see started with no specific target at all.",
    meetingMode: "100% video consultation — no in-person option, and we say so upfront.",
  },
  {
    slug: "lucknow",
    name: "Lucknow",
    kind: "city",
    state: "Uttar Pradesh",
    lat: 26.85, lng: 80.95,
    heroLine: "UP's capital, rising corporate base — over video",
    cultureLine: "Lucknow's tehzeeb runs on unhurried grace — that same unhurried grace is exactly what a 15-year SIP is built on.",
    intro:
      "Lucknow's growing corporate and government-sector base means we work with a wide mix of clients — from long-time government employees to a newer wave of professionals at companies now setting up here.",
    localNote:
      "Lucknow clients often still lean heavily on fixed deposits and LIC — we don't dismiss either, we just show, with real numbers, what adding equity mutual funds does to a 15-20 year goal that FDs alone can't keep up with.",
    meetingMode: "Video consultation across Lucknow.",
  },
  {
    slug: "kanpur",
    name: "Kanpur",
    kind: "city",
    state: "Uttar Pradesh",
    lat: 26.45, lng: 80.33,
    heroLine: "UP's industrial city — over video",
    cultureLine: "Kanpur's mills ran on discipline and shift-timing for generations — the same discipline is all a SIP really asks of you.",
    intro:
      "Kanpur's industrial and leather-manufacturing base brings us a lot of traditional business families — multi-generational businesses where investment decisions have historically been informal, made over conversation rather than a written plan.",
    localNote:
      "With Kanpur's business families, we often end up helping structure investments for the next generation too — starting a SIP for a child or a younger sibling alongside the primary client's own plan.",
    meetingMode: "Video consultation across Kanpur.",
  },
  {
    slug: "raipur",
    name: "Raipur",
    kind: "city",
    state: "Chhattisgarh",
    lat: 21.25, lng: 81.63,
    heroLine: "Chhattisgarh's steel & mining hub — over video",
    cultureLine: "Raipur's steel plants turn raw ore into something built to last — a SIP does the same to a raw monthly income, given enough years.",
    intro:
      "Raipur's steel and mining-linked business community means many of our Chhattisgarh clients are concentrated here — business owners and professionals whose income is tied to commodity cycles more than a fixed salary curve.",
    localNote:
      "For Raipur clients, we usually build a two-speed plan: a steady core SIP that keeps running regardless of business conditions, plus room for larger lumpsum investments in stronger years.",
    meetingMode: "Video consultation — reach out and we'll find a time that works.",
  },
  {
    slug: "patna",
    name: "Patna",
    kind: "city",
    state: "Bihar",
    lat: 25.59, lng: 85.14,
    heroLine: "Bihar's capital, a growing professional base — over video",
    cultureLine: "Patna has produced generations who left home to build careers elsewhere — a portfolio should do the same: work quietly while you're busy building.",
    intro:
      "Patna's government and growing private-sector employment base means we increasingly work with early-career professionals here, alongside longer-established government-service clients — both video-first, same AMFI-registered process (ARN-290298).",
    localNote:
      "A lot of Patna clients are the first in their family to work with a dedicated financial advisor rather than a bank counter or an agent who sold one policy and disappeared. We stay reachable well after the first investment.",
    meetingMode: "Video consultation across Patna.",
  },
  {
    slug: "jaipur",
    name: "Jaipur",
    kind: "city",
    state: "Rajasthan",
    lat: 26.91, lng: 75.79,
    heroLine: "Rajasthan's capital — over video",
    cultureLine: "Jaipur's forts were built to outlast centuries — ask your portfolio for the same: built to outlast a few bad quarters.",
    intro:
      "Jaipur's mix of tourism-linked business, handicraft trade, and a growing IT/services sector gives us a genuinely varied client base — from business owners with seasonal income to salaried professionals at newer companies.",
    localNote:
      "Jaipur clients with seasonal, tourism-linked income get the same flexible-SIP-plus-lumpsum-topup approach we use for other business-owner-heavy cities — rigid fixed monthly amounts don't survive an off-season.",
    meetingMode: "Video consultation across Jaipur.",
  },
  {
    slug: "bangalore",
    name: "Bangalore",
    kind: "city",
    state: "Karnataka",
    lat: 12.97, lng: 77.59,
    heroLine: "India's tech capital — over video",
    cultureLine: "Bangalore ships code that scales overnight — a portfolio scales the old-fashioned way, one disciplined month at a time.",
    intro:
      "Bangalore's IT and startup professionals are often high earners early in their career, with RSUs, ESOPs, and stock options alongside their salary — plenty of income, rarely a clear plan tying it all to actual goals.",
    localNote:
      "A recurring Bangalore pattern: strong income, aggressive risk appetite, and zero insurance. We usually put term and health cover on the table in the very first conversation, before touching fund selection at all.",
    meetingMode: "100% video consultation — no in-person option, and we say so upfront.",
  },
  {
    slug: "hyderabad",
    name: "Hyderabad",
    kind: "city",
    state: "Telangana",
    lat: 17.39, lng: 78.49,
    heroLine: "IT & pharma hub — over video",
    cultureLine: "Hyderabad's pearls were formed slowly, layer by layer — a portfolio's real value is built the exact same unglamorous way.",
    intro:
      "Hyderabad's IT and pharmaceutical companies bring us salaried professionals with steady income and, often, employer-linked investment options they've never had explained to them clearly — that's usually where our first call starts.",
    localNote:
      "Hyderabad clients frequently ask us to compare NPS, EPF, and mutual fund SIPs side by side — we walk through all three honestly, including where NPS and EPF already have them covered.",
    meetingMode: "100% video consultation — no in-person option, and we say so upfront.",
  },
  {
    slug: "chennai",
    name: "Chennai",
    kind: "city",
    state: "Tamil Nadu",
    lat: 13.08, lng: 80.27,
    heroLine: "manufacturing & auto hub — over video",
    cultureLine: "Chennai trusts gold because it's held its value for generations — mutual funds simply ask for the same trust, earned the same way, over time.",
    intro:
      "Chennai's strong manufacturing and auto-sector employment base gives us a mostly salaried client mix, alongside a traditionally conservative, gold-and-FD-first savings culture we work with rather than against.",
    localNote:
      "With Chennai clients we usually start small and consistent — a modest SIP that coexists with existing gold and FD holdings — rather than pushing for a dramatic reallocation on day one.",
    meetingMode: "Video consultation across Chennai.",
  },
  {
    slug: "kolkata",
    name: "Kolkata",
    kind: "city",
    state: "West Bengal",
    lat: 22.57, lng: 88.36,
    heroLine: "trading & business hub — over video",
    cultureLine: "Kolkata has been a trading city for three centuries — long enough to know that real wealth is built slowly, not overnight.",
    intro:
      "Kolkata's long trading and business community history means many clients here are comfortable with market concepts but haven't formalized a plan — savings spread across FDs, some direct stocks, and the occasional mutual fund bought on a tip.",
    localNote:
      "Our first conversation with most Kolkata clients is a consolidation exercise — pulling scattered holdings into one reviewed, goal-based portfolio instead of a collection of one-off decisions.",
    meetingMode: "Video consultation across Kolkata.",
  },
  {
    slug: "ludhiana",
    name: "Ludhiana",
    kind: "city",
    state: "Punjab",
    lat: 30.9, lng: 75.86,
    heroLine: "Punjab's manufacturing hub — over video",
    cultureLine: "Ludhiana's karobaris built empires from a single machine and a lot of grit — a SIP just asks for that same grit, applied monthly.",
    intro:
      "Ludhiana's hosiery, textile, and small-manufacturing businesses mean most of our clients here are business owners with income tied to production cycles and export orders — not a fixed monthly salary.",
    localNote:
      "As with other manufacturing-hub cities, insurance is usually the first conversation with Ludhiana clients — no employer cover to fall back on if something happens to the person running the business.",
    meetingMode: "Video consultation across Ludhiana.",
  },

  // --- State-level pages ---
  {
    slug: "madhya-pradesh",
    name: "Madhya Pradesh",
    kind: "state",
    state: "Madhya Pradesh",
    heroLine: "our home state",
    cultureLine: "The heart of India, and the place we still do business the old way — face to face, first name basis, no call centre in between.",
    intro:
      "The Financial Doctor is based in Sehore, MP, and most of our in-person client relationships are across Madhya Pradesh — Bhopal, Indore, Sehore, and smaller towns in between. If an in-person meeting matters to you, MP is where we can most easily make that happen.",
    localNote:
      "1000+ families across Madhya Pradesh have worked with us on mutual funds, SIPs, and insurance — many through word-of-mouth referrals from existing clients in the same town.",
    meetingMode: "In-person meetings available across MP; video consultation for anyone further out.",
  },
  {
    slug: "chhattisgarh",
    name: "Chhattisgarh",
    kind: "state",
    state: "Chhattisgarh",
    heroLine: "served over video from our MP base",
    cultureLine: "Chhattisgarh's rice bowl of India grew patiently, season after season — the same patience is what a real portfolio is built on.",
    intro:
      "We work with Chhattisgarh clients — Raipur, Bilaspur, and beyond — the same way we do anywhere outside our immediate MP reach: full video consultations, the same AMFI-registered process, no compromise on service.",
    localNote:
      "Many Chhattisgarh clients come to us after outgrowing a purely bank-driven investment approach and wanting a dedicated advisor who actually reviews their portfolio periodically, not just at account opening.",
    meetingMode: "Video consultation — reach out and we'll find a time that works.",
  },
  {
    slug: "maharashtra",
    name: "Maharashtra",
    kind: "state",
    state: "Maharashtra",
    heroLine: "Mumbai, Pune, Nagpur and beyond — over video",
    cultureLine: "From Mumbai's speed to Pune's precision to Nagpur's centre-of-the-country calm — three very different tempos, one same discipline underneath.",
    intro:
      "Across Maharashtra — Mumbai, Pune, Nagpur and other cities — our relationship with clients is entirely digital: video consultations, WhatsApp updates, and a portfolio dashboard through our execution partner Asset Plus.",
    localNote:
      "Maharashtra clients are some of our most portfolio-active — frequent goal reviews, SIP step-ups tied to annual appraisals, and a genuine interest in understanding what they're invested in, not just handing it off.",
    meetingMode: "Video consultation across Maharashtra.",
  },
  {
    slug: "gujarat",
    name: "Gujarat",
    kind: "state",
    state: "Gujarat",
    heroLine: "Ahmedabad, Surat, Vadodara and beyond — over video",
    cultureLine: "Gujarat taught India what business instinct looks like — we just add the discipline of a written plan behind that instinct.",
    intro:
      "Gujarat has a strong culture of entrepreneurship and business ownership — which often means income that doesn't arrive as a predictable monthly salary. We build SIP plans that flex around that, rather than forcing a rigid structure that breaks the first slow month.",
    localNote:
      "For Gujarat's business-owner clients, we usually spend real time on insurance first — since there's rarely an employer safety net, term and health cover often matter more than the investment conversation itself.",
    meetingMode: "Video consultation across Gujarat.",
  },
  {
    slug: "uttar-pradesh",
    name: "Uttar Pradesh",
    kind: "state",
    state: "Uttar Pradesh",
    heroLine: "Lucknow, Noida, Kanpur and beyond — over video",
    cultureLine: "UP's biggest strength has always been sheer scale and ambition — a written plan is what turns that ambition into an actual number.",
    intro:
      "From Lucknow to Noida to Kanpur, UP clients reach us over video call and WhatsApp — the same AMFI-registered advisory (ARN-290298), the same free first consultation, the same ongoing portfolio support, wherever you're based.",
    localNote:
      "A lot of first-time UP investors we work with are early-career professionals just starting their first SIP — we spend extra time in the first call making sure the basics (what a SIP actually is, why it's not the same as a fixed deposit) are genuinely clear.",
    meetingMode: "Video consultation across Uttar Pradesh.",
  },
  {
    slug: "bihar",
    name: "Bihar",
    kind: "state",
    state: "Bihar",
    heroLine: "Patna and beyond — over video",
    cultureLine: "Bihar has always sent its brightest out to build careers elsewhere — a portfolio is one thing that can quietly build wealth back home in return.",
    intro:
      "Bihar clients, many in Patna, work with us entirely over video consultation — the same process we use everywhere outside MP: understand your goals first, recommend a product second, never the other way round.",
    localNote:
      "We often hear from Bihar clients that this is their first time working with a dedicated advisor rather than a bank counter — the biggest shift for most is simply having someone to ask a question to, months after the first investment was made.",
    meetingMode: "Video consultation across Bihar.",
  },
  {
    slug: "rajasthan",
    name: "Rajasthan",
    kind: "state",
    state: "Rajasthan",
    heroLine: "Jaipur and beyond — over video",
    cultureLine: "Rajasthan's forts and havelis were built to survive centuries in the desert — a portfolio should be built with the same patience for the long dry spells.",
    intro:
      "Rajasthan's clients, many in Jaipur, work with us the same way as anywhere outside MP — full video consultation, no compromise on the process: understand goals, review what's already held, recommend only what actually fits.",
    localNote:
      "Rajasthan's strong culture of gold and real estate as 'safe' savings means a lot of our first conversations are about diversification — not replacing those assets, just not relying on them alone for every goal.",
    meetingMode: "Video consultation across Rajasthan.",
  },
  {
    slug: "karnataka",
    name: "Karnataka",
    kind: "state",
    state: "Karnataka",
    heroLine: "Bengaluru and beyond — over video",
    cultureLine: "Karnataka builds software that runs unattended for years — a good SIP is designed to do exactly the same thing with your money.",
    intro:
      "Karnataka clients, mostly in Bengaluru, reach us over video — the same free portfolio review and AMFI-registered (ARN-290298) process we offer everywhere, without the wait time of booking an in-person advisor slot.",
    localNote:
      "Karnataka's tech-heavy client base often already has RSUs, ESOPs, and multiple scattered SIPs — we usually spend the first session just building one clear picture out of all of it.",
    meetingMode: "Video consultation across Karnataka.",
  },
  {
    slug: "telangana",
    name: "Telangana",
    kind: "state",
    state: "Telangana",
    heroLine: "Hyderabad and beyond — over video",
    cultureLine: "Telangana's pharma labs work on a decade-long research timeline — your retirement plan deserves a similarly patient one.",
    intro:
      "Telangana clients, mostly in Hyderabad, work with us entirely over video — the same AMFI-registered advisory (ARN-290298), free first consultation, and ongoing portfolio support we offer nationwide.",
    localNote:
      "Telangana's strong IT and pharma-sector employment base means many clients already invest through work-linked apps — our value is usually consolidating that into one coherent, goal-based plan.",
    meetingMode: "Video consultation across Telangana.",
  },
  {
    slug: "tamil-nadu",
    name: "Tamil Nadu",
    kind: "state",
    state: "Tamil Nadu",
    heroLine: "Chennai and beyond — over video",
    cultureLine: "Tamil Nadu has trusted gold for generations for good reason — mutual funds simply ask to sit alongside it, not replace it.",
    intro:
      "Tamil Nadu clients, mostly in Chennai, work with us over video — the same goal-based process, the same Regular Plan servicing, wherever in the state they're based.",
    localNote:
      "Tamil Nadu's traditionally gold-heavy savings culture means a lot of our early conversations are about balance, not replacement — adding mutual funds as a second, more liquid asset class alongside what families already hold.",
    meetingMode: "Video consultation across Tamil Nadu.",
  },
  {
    slug: "west-bengal",
    name: "West Bengal",
    kind: "state",
    state: "West Bengal",
    heroLine: "Kolkata and beyond — over video",
    cultureLine: "Bengal has argued over ideas at the adda table for centuries — bring your money questions to the table too, we're happy to argue it out with you.",
    intro:
      "West Bengal clients, mostly in Kolkata, reach us the same way as everywhere outside MP — full video consultation, the same AMFI-registered process, no in-person office to worry about scheduling around.",
    localNote:
      "Kolkata and West Bengal's strong trading and business community background means many clients already understand markets conceptually — our job is often translating that into a disciplined, goal-linked SIP habit.",
    meetingMode: "Video consultation across West Bengal.",
  },
  {
    slug: "punjab",
    name: "Punjab",
    kind: "state",
    state: "Punjab",
    heroLine: "Ludhiana, Amritsar and beyond — over video",
    cultureLine: "Punjab built its prosperity on hard work and open-handed generosity — a real financial plan makes sure that generosity has something behind it for the long run.",
    intro:
      "Punjab clients — many in Ludhiana and Amritsar — work with us over video, the same AMFI-registered process (ARN-290298), same free portfolio review, no matter which city or town they're calling from.",
    localNote:
      "Punjab's strong small-manufacturing and NRI-family presence means we often deal with cross-border considerations — family abroad sending money home to invest — alongside standard goal-based planning.",
    meetingMode: "Video consultation across Punjab.",
  },
];

export function findCityPage(slug) {
  return CITY_PAGES.find((c) => c.slug === slug);
}
