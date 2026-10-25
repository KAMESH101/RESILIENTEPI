/**
 * Bulletin templates. ONLY fixed labels and sentence frames live here; every
 * number, district name, month and action comes from the Bulletin data and is
 * passed in as a parameter, so a translation can change wording, never facts.
 *
 * HI and TA are machine-assisted drafts: the UI marks them "Translation pending
 * review" until a fluent reader has checked them (BULLETIN_REVIEWED below).
 */
import type { ActionStatus, BulletinActionKey, FactorKey, Language, LimitationKey, ReviewDecision, RiskCategory, ShapDirection } from '@/types'

export interface BulletinStrings {
  title: (scope: string) => string
  scopeKind: Record<'district' | 'state' | 'national', string>
  generated: string
  dataUpTo: string
  horizonLine: (month: string, h: number) => string
  sections: { summary: string; risk: string; topRisk: string; blindSpots: string; factors: string; actions: string; limitations: string }
  summary: (p: { high: number; total: number; month: string }) => string
  summaryBlindSpots: (n: number) => string
  categories: Record<RiskCategory | 'no_data', string>
  col: {
    district: string
    state: string
    lgd: string
    month: string
    category: string
    count: string
    probability: string
    expected: string
    score: string
    band: string
    review: string
    priority: string
    action: string
    status: string
    lastReport: string
    monthsStale: string
    missing: string
    source: string
  }
  band: { flagged: string; watch: string; none: string }
  review: Record<ReviewDecision | 'none', string>
  experimental: string
  factor: Record<FactorKey, string>
  direction: Record<ShapDirection, string>
  factorLine: (factor: string, direction: string, districts: number) => string
  actions: Record<Exclude<BulletinActionKey, 'manual'>, string>
  manualNote: string
  status: Record<ActionStatus, string>
  limitations: Record<LimitationKey, (count: number) => string>
  noBlindSpots: string
  noActions: string
  noFactors: string
  humanReview: string
  disclaimer: string
  translationPending: string
  synthetic: string
  noData: string
}

const EN_DISCLAIMER = 'Demonstration bulletin — not an official government communication.'

const en: BulletinStrings = {
  title: (s) => `Dengue risk bulletin — ${s}`,
  scopeKind: { district: 'District bulletin', state: 'State bulletin', national: 'National bulletin' },
  generated: 'Generated',
  dataUpTo: 'Data up to',
  horizonLine: (m, h) => `Forecast for ${m} (${h} month${h === 1 ? '' : 's'} ahead)`,
  sections: {
    summary: 'Forecast summary',
    risk: 'Risk categories',
    topRisk: 'Highest-risk districts',
    blindSpots: 'Blind-spot alerts (experimental)',
    factors: 'Key factors',
    actions: 'Recommended actions',
    limitations: 'Data limitations',
  },
  summary: ({ high, total, month }) =>
    `${high} of ${total} district${total === 1 ? '' : 's'} ${high === 1 ? 'is' : 'are'} forecast at High or Very High dengue risk for ${month}.`,
  summaryBlindSpots: (n) => (n ? `${n} district${n === 1 ? ' is a' : 's are'} potential blind spot${n === 1 ? '' : 's'} (experimental).` : ''),
  categories: { very_high: 'Very High', high: 'High', moderate: 'Moderate', low: 'Low', no_data: 'No data' },
  col: {
    district: 'District',
    state: 'State',
    lgd: 'LGD code',
    month: 'Forecast month',
    category: 'Risk category',
    count: 'Districts',
    probability: 'Probability (%)',
    expected: 'Expected cases',
    score: 'Blind-spot score (experimental)',
    band: 'Blind-spot band',
    review: 'Review',
    priority: 'Priority',
    action: 'Action',
    status: 'Status',
    lastReport: 'Last report',
    monthsStale: 'Months since last report',
    missing: 'Missing months (last 12)',
    source: 'Source',
  },
  band: { flagged: 'Potential blind spot', watch: 'Watch', none: '—' },
  review: { acknowledge: 'Acknowledged', flag_for_audit: 'Flagged for audit', dismiss: 'Dismissed', none: 'Not yet reviewed' },
  experimental: 'Experimental surveillance blind-spot indicator — not proof of under-reporting.',
  factor: {
    rainfall: 'Rainfall',
    recent_cases: 'Recent cases',
    neighbour_cases: 'Cases in neighbouring districts',
    season: 'Season (month)',
    temperature: 'Temperature',
    humidity: 'Humidity',
    testing_level: 'Testing level',
    other: 'Other factors',
  },
  direction: { increases_risk: 'raises risk', decreases_risk: 'lowers risk' },
  factorLine: (f, d, n) => `${f} — ${d} in ${n} district${n === 1 ? '' : 's'}`,
  actions: {
    high_risk_blind_spot: 'Prioritise field surveillance, testing teams, test-kit allocation and vector-control assessment',
    high_risk_no_blind_spot: 'Strengthen preparedness, clinical readiness and vector control',
    low_risk_blind_spot: 'Audit testing and reporting, check completeness, investigate possible under-reporting',
    low_risk_no_blind_spot: 'Routine surveillance; monitor for changes',
    watch_check: 'Verify data completeness: check missing or late facility reports and testing records for the last 3 months',
    audit_flag: 'Audit testing and reporting: compare lab registers, facility reports and IHIP entries for the last 3 months',
  },
  manualNote: '(as written by the officer)',
  status: { pending: 'Pending', in_progress: 'In Progress', completed: 'Completed' },
  limitations: {
    synthetic_demo: () => 'This demonstration uses synthetic data. Do not use it for real decisions.',
    hmis_ends_2022: () => 'HMIS district-month data ends in 2022, so the district model is retrospective.',
    monthly_batch: () => 'Forecasts update in a monthly batch, not in real time.',
    blind_spot_experimental: () => 'The blind-spot indicator is experimental and is not proof of under-reporting.',
    boundaries_indicative: () => 'Map boundaries are indicative, not official (DataMeet, CC BY 2.5 IN).',
    missing_reports: (n) => `${n} district${n === 1 ? ' has' : 's have'} missing monthly reports; these are treated as "No data", never as zero.`,
    stale_reports: (n) => `${n} district${n === 1 ? "'s" : "s'"} data ${n === 1 ? 'is' : 'are'} 3 or more months old (low confidence).`,
  },
  noBlindSpots: 'No potential blind spots in this area.',
  noActions: 'No open actions.',
  noFactors: 'Factor details are not yet available.',
  humanReview: 'Recommendations need human review and approval. ResilientEpi does not start interventions.',
  disclaimer: EN_DISCLAIMER,
  translationPending: 'Translation pending review',
  synthetic: 'Synthetic demo data',
  noData: 'No data',
}

const hi: BulletinStrings = {
  title: (s) => `डेंगू जोखिम बुलेटिन — ${s}`,
  scopeKind: { district: 'ज़िला बुलेटिन', state: 'राज्य बुलेटिन', national: 'राष्ट्रीय बुलेटिन' },
  generated: 'तैयार किया गया',
  dataUpTo: 'डेटा इस माह तक',
  horizonLine: (m, h) => `${m} का पूर्वानुमान (${h} माह आगे)`,
  sections: {
    summary: 'पूर्वानुमान सारांश',
    risk: 'जोखिम श्रेणियाँ',
    topRisk: 'सबसे अधिक जोखिम वाले ज़िले',
    blindSpots: 'ब्लाइंड-स्पॉट अलर्ट (प्रायोगिक)',
    factors: 'मुख्य कारक',
    actions: 'सुझाई गई कार्रवाइयाँ',
    limitations: 'डेटा की सीमाएँ',
  },
  summary: ({ high, total, month }) => `${month} के लिए ${total} में से ${high} ज़िलों में डेंगू का जोखिम उच्च या अति उच्च रहने का पूर्वानुमान है।`,
  summaryBlindSpots: (n) => (n ? `${n} ${n === 1 ? 'ज़िला' : 'ज़िले'} संभावित ब्लाइंड स्पॉट (प्रायोगिक) ${n === 1 ? 'है' : 'हैं'}।` : ''),
  categories: { very_high: 'अति उच्च', high: 'उच्च', moderate: 'मध्यम', low: 'निम्न', no_data: 'डेटा उपलब्ध नहीं' },
  col: {
    district: 'ज़िला',
    state: 'राज्य',
    lgd: 'LGD कोड',
    month: 'पूर्वानुमान माह',
    category: 'जोखिम श्रेणी',
    count: 'ज़िले',
    probability: 'संभावना (%)',
    expected: 'अपेक्षित मामले',
    score: 'ब्लाइंड-स्पॉट स्कोर (प्रायोगिक)',
    band: 'ब्लाइंड-स्पॉट स्तर',
    review: 'समीक्षा',
    priority: 'प्राथमिकता',
    action: 'कार्रवाई',
    status: 'स्थिति',
    lastReport: 'अंतिम रिपोर्ट',
    monthsStale: 'अंतिम रिपोर्ट के बाद के महीने',
    missing: 'अनुपलब्ध महीने (पिछले 12)',
    source: 'स्रोत',
  },
  band: { flagged: 'संभावित ब्लाइंड स्पॉट', watch: 'निगरानी सूची', none: '—' },
  review: { acknowledge: 'स्वीकार किया गया', flag_for_audit: 'ऑडिट हेतु चिह्नित', dismiss: 'खारिज किया गया', none: 'समीक्षा लंबित' },
  experimental: 'प्रायोगिक निगरानी ब्लाइंड-स्पॉट संकेतक — कम रिपोर्टिंग का प्रमाण नहीं।',
  factor: {
    rainfall: 'वर्षा',
    recent_cases: 'हाल के मामले',
    neighbour_cases: 'पड़ोसी ज़िलों में मामले',
    season: 'मौसम (माह)',
    temperature: 'तापमान',
    humidity: 'आर्द्रता',
    testing_level: 'जाँच का स्तर',
    other: 'अन्य कारक',
  },
  direction: { increases_risk: 'जोखिम बढ़ाता है', decreases_risk: 'जोखिम घटाता है' },
  factorLine: (f, d, n) => `${f} — ${n === 1 ? '1 ज़िले' : `${n} ज़िलों`} में ${d}`,
  actions: {
    high_risk_blind_spot: 'क्षेत्रीय निगरानी, जाँच दल, टेस्ट-किट आवंटन और वेक्टर-नियंत्रण आकलन को प्राथमिकता दें',
    high_risk_no_blind_spot: 'तैयारी, नैदानिक तत्परता और वेक्टर नियंत्रण को मज़बूत करें',
    low_risk_blind_spot: 'जाँच और रिपोर्टिंग का ऑडिट करें, पूर्णता जाँचें, संभावित कम रिपोर्टिंग की पड़ताल करें',
    low_risk_no_blind_spot: 'नियमित निगरानी; बदलावों पर नज़र रखें',
    watch_check: 'डेटा की पूर्णता सत्यापित करें: पिछले 3 महीनों की अनुपलब्ध या देर से आई सुविधा रिपोर्ट और जाँच रिकॉर्ड देखें',
    audit_flag: 'जाँच और रिपोर्टिंग का ऑडिट: पिछले 3 महीनों के लैब रजिस्टर, सुविधा रिपोर्ट और IHIP प्रविष्टियों का मिलान करें',
  },
  manualNote: '(अधिकारी द्वारा लिखा गया, मूल रूप में)',
  status: { pending: 'लंबित', in_progress: 'प्रगति पर', completed: 'पूर्ण' },
  limitations: {
    synthetic_demo: () => 'यह प्रदर्शन सिंथेटिक (कृत्रिम) डेटा का उपयोग करता है। इसे वास्तविक निर्णयों के लिए उपयोग न करें।',
    hmis_ends_2022: () => 'HMIS का ज़िला-माह डेटा 2022 तक ही है, इसलिए ज़िला मॉडल पूर्वव्यापी है।',
    monthly_batch: () => 'पूर्वानुमान हर माह एक बैच में अद्यतन होते हैं, वास्तविक समय में नहीं।',
    blind_spot_experimental: () => 'ब्लाइंड-स्पॉट संकेतक प्रायोगिक है और कम रिपोर्टिंग का प्रमाण नहीं है।',
    boundaries_indicative: () => 'मानचित्र की सीमाएँ सांकेतिक हैं, आधिकारिक नहीं (DataMeet, CC BY 2.5 IN)।',
    missing_reports: (n) => `${n === 1 ? '1 ज़िले' : `${n} ज़िलों`} की कुछ मासिक रिपोर्ट उपलब्ध नहीं हैं; इन्हें शून्य नहीं, "डेटा उपलब्ध नहीं" माना गया है।`,
    stale_reports: (n) => `${n === 1 ? '1 ज़िले' : `${n} ज़िलों`} का डेटा 3 या अधिक महीने पुराना है (कम विश्वसनीयता)।`,
  },
  noBlindSpots: 'इस क्षेत्र में कोई संभावित ब्लाइंड स्पॉट नहीं है।',
  noActions: 'कोई खुली कार्रवाई नहीं।',
  noFactors: 'कारकों की जानकारी अभी उपलब्ध नहीं है।',
  humanReview: 'सुझावों के लिए मानवीय समीक्षा और अनुमोदन आवश्यक है। ResilientEpi कोई हस्तक्षेप स्वयं शुरू नहीं करता।',
  disclaimer: 'प्रदर्शन बुलेटिन — आधिकारिक सरकारी संचार नहीं।',
  translationPending: 'अनुवाद समीक्षा लंबित',
  synthetic: 'सिंथेटिक डेमो डेटा',
  noData: 'डेटा उपलब्ध नहीं',
}

const ta: BulletinStrings = {
  title: (s) => `டெங்கு அபாய அறிக்கை — ${s}`,
  scopeKind: { district: 'மாவட்ட அறிக்கை', state: 'மாநில அறிக்கை', national: 'தேசிய அறிக்கை' },
  generated: 'உருவாக்கிய தேதி',
  dataUpTo: 'தரவு இந்த மாதம் வரை',
  horizonLine: (m, h) => `${m} மாதத்திற்கான முன்கணிப்பு (${h} ${h === 1 ? 'மாதம்' : 'மாதங்கள்'} முன்னதாக)`,
  sections: {
    summary: 'முன்கணிப்புச் சுருக்கம்',
    risk: 'அபாய வகைகள்',
    topRisk: 'அதிக அபாயமுள்ள மாவட்டங்கள்',
    blindSpots: 'கண்காணிப்பு இடைவெளி எச்சரிக்கைகள் (சோதனை நிலை)',
    factors: 'முக்கியக் காரணிகள்',
    actions: 'பரிந்துரைக்கப்பட்ட நடவடிக்கைகள்',
    limitations: 'தரவு வரம்புகள்',
  },
  summary: ({ high, total, month }) =>
    `${month} மாதத்திற்கு ${total} மாவட்டங்களில் ${high} மாவட்டங்களில் டெங்கு அபாயம் அதிகம் அல்லது மிக அதிகம் என முன்கணிக்கப்பட்டுள்ளது.`,
  summaryBlindSpots: (n) => (n ? `${n} ${n === 1 ? 'மாவட்டம்' : 'மாவட்டங்கள்'} சாத்தியமான கண்காணிப்பு இடைவெளி${n === 1 ? '' : 'கள்'} (சோதனை நிலை).` : ''),
  categories: { very_high: 'மிக அதிகம்', high: 'அதிகம்', moderate: 'மிதமானது', low: 'குறைவு', no_data: 'தரவு இல்லை' },
  col: {
    district: 'மாவட்டம்',
    state: 'மாநிலம்',
    lgd: 'LGD குறியீடு',
    month: 'முன்கணிப்பு மாதம்',
    category: 'அபாய வகை',
    count: 'மாவட்டங்கள்',
    probability: 'நிகழ்தகவு (%)',
    expected: 'எதிர்பார்க்கப்படும் பாதிப்புகள்',
    score: 'கண்காணிப்பு இடைவெளி மதிப்பெண் (சோதனை நிலை)',
    band: 'கண்காணிப்பு இடைவெளி நிலை',
    review: 'மதிப்பாய்வு',
    priority: 'முன்னுரிமை',
    action: 'நடவடிக்கை',
    status: 'நிலை',
    lastReport: 'கடைசி அறிக்கை',
    monthsStale: 'கடைசி அறிக்கைக்குப் பிந்தைய மாதங்கள்',
    missing: 'விடுபட்ட மாதங்கள் (கடந்த 12)',
    source: 'மூலம்',
  },
  band: { flagged: 'சாத்தியமான கண்காணிப்பு இடைவெளி', watch: 'கவனிப்புப் பட்டியல்', none: '—' },
  review: { acknowledge: 'ஏற்கப்பட்டது', flag_for_audit: 'தணிக்கைக்குக் குறிக்கப்பட்டது', dismiss: 'நிராகரிக்கப்பட்டது', none: 'மதிப்பாய்வு நிலுவையில்' },
  experimental: 'சோதனை நிலை கண்காணிப்பு இடைவெளி குறிகாட்டி — குறைவான அறிக்கையிடலுக்கான சான்று அல்ல.',
  factor: {
    rainfall: 'மழைப்பொழிவு',
    recent_cases: 'சமீபத்திய பாதிப்புகள்',
    neighbour_cases: 'அண்டை மாவட்டங்களில் பாதிப்புகள்',
    season: 'பருவம் (மாதம்)',
    temperature: 'வெப்பநிலை',
    humidity: 'ஈரப்பதம்',
    testing_level: 'பரிசோதனை அளவு',
    other: 'பிற காரணிகள்',
  },
  direction: { increases_risk: 'அபாயத்தை அதிகரிக்கிறது', decreases_risk: 'அபாயத்தைக் குறைக்கிறது' },
  factorLine: (f, d, n) => `${f} — ${n === 1 ? '1 மாவட்டத்தில்' : `${n} மாவட்டங்களில்`} ${d}`,
  actions: {
    high_risk_blind_spot: 'கள கண்காணிப்பு, பரிசோதனைக் குழுக்கள், பரிசோதனைக் கருவி ஒதுக்கீடு மற்றும் நோய்க்காவி (கொசு) கட்டுப்பாட்டு மதிப்பீட்டிற்கு முன்னுரிமை அளிக்கவும்',
    high_risk_no_blind_spot: 'தயார்நிலை, மருத்துவ ஆயத்தம் மற்றும் நோய்க்காவி (கொசு) கட்டுப்பாட்டை வலுப்படுத்தவும்',
    low_risk_blind_spot: 'பரிசோதனை மற்றும் அறிக்கையிடலைத் தணிக்கை செய்யவும், முழுமையைச் சரிபார்க்கவும், குறைவான அறிக்கையிடல் உள்ளதா என ஆராயவும்',
    low_risk_no_blind_spot: 'வழக்கமான கண்காணிப்பு; மாற்றங்களைக் கவனிக்கவும்',
    watch_check: 'தரவு முழுமையைச் சரிபார்க்கவும்: கடந்த 3 மாதங்களின் விடுபட்ட அல்லது தாமதமான மைய அறிக்கைகள் மற்றும் பரிசோதனைப் பதிவுகளைப் பார்க்கவும்',
    audit_flag: 'பரிசோதனை மற்றும் அறிக்கையிடல் தணிக்கை: கடந்த 3 மாதங்களின் ஆய்வகப் பதிவேடுகள், மைய அறிக்கைகள் மற்றும் IHIP பதிவுகளை ஒப்பிடவும்',
  },
  manualNote: '(அலுவலர் எழுதியபடி, மூல வடிவில்)',
  status: { pending: 'நிலுவையில்', in_progress: 'நடைபெறுகிறது', completed: 'முடிந்தது' },
  limitations: {
    synthetic_demo: () => 'இந்தச் செயல்விளக்கம் செயற்கை (synthetic) தரவைப் பயன்படுத்துகிறது. உண்மையான முடிவுகளுக்கு இதைப் பயன்படுத்த வேண்டாம்.',
    hmis_ends_2022: () => 'HMIS மாவட்ட-மாதத் தரவு 2022 வரை மட்டுமே உள்ளது; எனவே மாவட்ட மாதிரி பின்னோக்கியது.',
    monthly_batch: () => 'முன்கணிப்புகள் மாதந்தோறும் ஒரு தொகுப்பாகப் புதுப்பிக்கப்படுகின்றன, நேரடியாக அல்ல.',
    blind_spot_experimental: () => 'கண்காணிப்பு இடைவெளி குறிகாட்டி சோதனை நிலையில் உள்ளது; குறைவான அறிக்கையிடலுக்கான சான்று அல்ல.',
    boundaries_indicative: () => 'வரைபட எல்லைகள் தோராயமானவை, அதிகாரப்பூர்வமானவை அல்ல (DataMeet, CC BY 2.5 IN).',
    missing_reports: (n) => `${n === 1 ? '1 மாவட்டத்தின்' : `${n} மாவட்டங்களின்`} சில மாத அறிக்கைகள் இல்லை; அவை பூஜ்யமாக அல்ல, "தரவு இல்லை" எனக் கருதப்படுகின்றன.`,
    stale_reports: (n) => `${n === 1 ? '1 மாவட்டத்தின்' : `${n} மாவட்டங்களின்`} தரவு 3 அல்லது அதற்கு மேற்பட்ட மாதங்கள் பழையது (குறைந்த நம்பகத்தன்மை).`,
  },
  noBlindSpots: 'இந்தப் பகுதியில் சாத்தியமான கண்காணிப்பு இடைவெளிகள் இல்லை.',
  noActions: 'திறந்த நடவடிக்கைகள் இல்லை.',
  noFactors: 'காரணி விவரங்கள் இன்னும் கிடைக்கவில்லை.',
  humanReview: 'பரிந்துரைகளுக்கு மனித மதிப்பாய்வும் ஒப்புதலும் தேவை. ResilientEpi எந்தத் தலையீட்டையும் தானாகத் தொடங்காது.',
  disclaimer: 'செயல்விளக்க அறிக்கை — அதிகாரப்பூர்வ அரசுத் தகவல் தொடர்பு அல்ல.',
  translationPending: 'மொழிபெயர்ப்பு மதிப்பாய்வு நிலுவையில்',
  synthetic: 'செயற்கை டெமோ தரவு',
  noData: 'தரவு இல்லை',
}

export const BULLETIN_STRINGS: Record<Language, BulletinStrings> = { en, hi, ta }

/** The English disclaimer is printed on every bulletin, in every language. */
export const BULLETIN_DISCLAIMER_EN = EN_DISCLAIMER

/** Flip a language to true only after a fluent reader has reviewed its template. */
export const BULLETIN_REVIEWED: Record<Language, boolean> = { en: true, hi: false, ta: false }

export const BULLETIN_LANGUAGES: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी (Hindi)' },
  { code: 'ta', label: 'தமிழ் (Tamil)' },
]

/** Month name in the bulletin language, e.g. "नवंबर 2026" / "நவம்பர் 2026". */
export function bulletinMonth(ym: string, lang: Language): string {
  const [y, m] = ym.split('-').map(Number)
  return new Intl.DateTimeFormat(`${lang}-IN`, { month: 'long', year: 'numeric' }).format(new Date(y!, m! - 1, 1))
}

export function bulletinDateTime(iso: string, lang: Language): string {
  return new Intl.DateTimeFormat(`${lang}-IN`, { dateStyle: 'long', timeStyle: 'short' }).format(new Date(iso))
}
