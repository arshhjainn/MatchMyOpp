import { useMemo, useState } from 'react'
import { LanguageContext } from './language'
const STORAGE_KEY = 'matchmyopp-language'

const hindi = {
  'Discover': 'खोजें', 'Categories': 'श्रेणियाँ', 'How It Works': 'यह कैसे काम करता है', 'About': 'हमारे बारे में', 'Support': 'सहायता',
  'Language': 'भाषा', 'Get Started': 'शुरू करें', 'Your Next Opportunity': 'आपका अगला अवसर', 'Starts With a Match.': 'एक सही मेल से शुरू होता है।',
  'Explore Opportunities': 'अवसर देखें', 'Create Your Profile': 'अपनी प्रोफ़ाइल बनाएँ',
  'Discover scholarships, hackathons, internships, and competitions tailored to your ambitions.': 'अपनी रुचियों के अनुसार छात्रवृत्तियाँ, हैकाथॉन, इंटर्नशिप और प्रतियोगिताएँ खोजें।',
  'Your next big opportunity is one match away.': 'आपका अगला बड़ा अवसर बस एक सही मेल दूर है।', 'Find your next step': 'अपना अगला कदम खोजें', 'Explore by category': 'श्रेणी के अनुसार देखें', 'Browse all': 'सभी देखें',
  'Scholarships': 'छात्रवृत्तियाँ', 'Funding for your next step': 'अगले कदम के लिए आर्थिक सहायता', 'Hackathons': 'हैकाथॉन', 'Build ideas with a team': 'टीम के साथ नए विचार बनाएँ',
  'Internships': 'इंटर्नशिप', 'Get hands-on experience': 'व्यावहारिक अनुभव पाएँ', 'Research': 'अनुसंधान', 'Explore questions that matter': 'महत्वपूर्ण सवालों पर काम करें',
  'Fellowships': 'फेलोशिप', 'Grow with expert support': 'विशेषज्ञों के साथ आगे बढ़ें', 'Grants': 'अनुदान', 'Bring a project to life': 'अपने प्रोजेक्ट को साकार करें',
  'Three steps to your next opportunity': 'आपके अगले अवसर तक तीन कदम', 'Build your profile': 'अपनी प्रोफ़ाइल बनाएँ', 'Tell us your field, year, and goals. Takes 2 minutes.': 'अपना क्षेत्र, कक्षा और लक्ष्य बताएँ। इसमें 2 मिनट लगेंगे।',
  'Get matched': 'आपके लिए सही अवसर पाएँ', 'Our AI ranks opportunities by how well they fit your profile and deadlines.': 'हमारी AI आपकी प्रोफ़ाइल और समय-सीमा के अनुसार अवसरों को क्रम देती है।',
  'Swipe & apply': 'स्वाइप करें और आवेदन करें', 'Like, save, or pass. Track every application from one clean dashboard.': 'पसंद करें, सेव करें या आगे बढ़ें। सभी आवेदनों की स्थिति एक जगह देखें।',
  'About MatchMyOpp': 'MatchMyOpp के बारे में', 'More chances to do what you love.': 'अपने पसंदीदा काम के और अवसर पाएँ।',
  'Students shouldn’t have to search all over the internet to find opportunities that fit. MatchMyOpp brings scholarships, research, internships, and competitions together, then helps you keep track of the ones you care about.': 'सही अवसर खोजने के लिए छात्रों को पूरा इंटरनेट खंगालना न पड़े। MatchMyOpp छात्रवृत्तियों, अनुसंधान, इंटर्नशिप और प्रतियोगिताओं को एक जगह लाता है और पसंदीदा अवसरों पर नज़र रखने में मदद करता है।',
  'See how it works': 'जानें यह कैसे काम करता है', 'Need a hand getting started?': 'शुरू करने में मदद चाहिए?', 'Here are the quickest ways to get help using MatchMyOpp.': 'MatchMyOpp का उपयोग करने में मदद पाने के आसान तरीके:',
  'Set up your profile': 'अपनी प्रोफ़ाइल सेट करें', 'Add your grade, location, skills, and interests to get relevant matches.': 'उपयुक्त अवसर पाने के लिए कक्षा, स्थान, कौशल और रुचियाँ जोड़ें।', 'Create a profile': 'प्रोफ़ाइल बनाएँ',
  'Find opportunities': 'अवसर खोजें', 'Browse the feed, filter by category, and swipe to save opportunities you like.': 'फीड देखें, श्रेणी से फ़िल्टर करें और पसंदीदा अवसर सेव करने के लिए स्वाइप करें।', 'Open Discover': 'अवसर खोजें',
  'Track your progress': 'अपनी प्रगति देखें', 'Keep application statuses and notes together in your tracker.': 'आवेदन की स्थिति और नोट्स ट्रैकर में रखें।', 'View tracker': 'ट्रैकर देखें',
  'Ready for your match?': 'अपने सही अवसर के लिए तैयार हैं?', 'Free forever. No credit card required.': 'हमेशा मुफ़्त। क्रेडिट कार्ड की ज़रूरत नहीं।', 'Create your profile': 'अपनी प्रोफ़ाइल बनाएँ',
  'Saved': 'सेव किए गए', 'Applications': 'आवेदन', 'Your profile': 'आपकी प्रोफ़ाइल',
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => localStorage.getItem(STORAGE_KEY) || 'en')
  const setLanguage = value => {
    localStorage.setItem(STORAGE_KEY, value)
    setLanguageState(value)
  }
  const value = useMemo(() => ({
    language,
    setLanguage,
    t: text => language === 'hi' ? (hindi[text] ?? text) : text,
  }), [language])
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

