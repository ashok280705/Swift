'use client'
/**
 * SwiftX i18n — lightweight client-side translator.
 *
 * - Numbers and currency amounts stay in Arabic numerals (we never touch them).
 * - The active language is persisted to localStorage under `sx_lang`.
 * - <Trans tKey="..." /> works inside server components too because client
 *   children are allowed there.
 */
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export type Lang = 'en' | 'hi'

const dict: Record<Lang, Record<string, string>> = {
  en: {
    // ── Nav ────────────────────────────────────────────────────────
    'nav.overview':       'Overview',
    'nav.pay':            'Pay',
    'nav.send':           'Send',
    'nav.deposit':        'Deposit',
    'nav.withdraw':       'Withdraw',
    'nav.vault':          'Vault',
    'nav.activity':       'Activity',
    'nav.markets':        'Markets',
    'nav.rateintel':      'Rate Intel',
    'nav.admin':          'Admin',
    'nav.ledger':         'Ledger',
    'nav.signout':        'Sign out',
    'nav.notifications':  'Notifications',
    'nav.swiftxid':       'SwiftX ID',
    'nav.copyid':         'Copy SwiftX ID',
    'nav.member':         'Member',

    // ── Common ────────────────────────────────────────────────────
    'common.online':      'Online',
    'common.live':        'live',
    'common.copy':        'Copy',
    'common.copied':      'Copied',
    'common.back':        'Back',
    'common.cancel':      'Cancel',
    'common.continue':    'Continue',
    'common.confirm':     'Confirm',
    'common.pay':         'Pay',
    'common.send':        'Send',
    'common.amount':      'Amount',
    'common.available':   'Available',
    'common.note':        'Note (optional)',
    'common.processing':  'Processing…',
    'common.success':     'Success',
    'common.failed':      'Failed',
    'common.tryagain':    'Try again',
    'common.systemshealthy': 'Network healthy',

    // ── Greeting ──────────────────────────────────────────────────
    'greeting.morning':   'Good morning',
    'greeting.afternoon': 'Good afternoon',
    'greeting.evening':   'Good evening',

    // ── Dashboard ─────────────────────────────────────────────────
    'dash.hero.title1':   'Your borderless wallet,',
    'dash.hero.title2':   'ready when you are.',
    'dash.hero.desc':     'Move money worldwide, grow your savings, and track every cent — all in one workspace.',
    'dash.hero.send':     'Send money',
    'dash.hero.deposit':  'Deposit',
    'dash.hero.rateintel':'Rate intel',
    'dash.id.label':      'SwiftX ID',
    'dash.id.desc':       "Your global handle. Share to receive money in any supported currency — instantly.",
    'dash.qa.title':      'Quick actions',
    'dash.qa.scan.title': 'Scan & Pay',
    'dash.qa.scan.desc':  'UPI or bank, locally',
    'dash.qa.send.title': 'Send Money',
    'dash.qa.send.desc':  'Pay any SwiftX user',
    'dash.qa.deposit.title': 'Add Funds',
    'dash.qa.deposit.desc':  'Razorpay checkout',
    'dash.qa.withdraw.title':'Withdraw',
    'dash.qa.withdraw.desc': 'Send to bank account',
    'dash.qa.open':       'Open',
    'dash.activity.title':'Recent activity',
    'dash.activity.viewall': 'View all →',
    'dash.activity.none': 'No transfers yet',
    'dash.activity.cta':  'Make your first move — try sending to a friend.',
    'dash.activity.start':'Start a transfer',
    'dash.insight.smart.eyebrow': 'AI Insight',
    'dash.insight.smart.title':  'Smart timing',
    'dash.insight.smart.body':   'Forex predictor estimates a favorable INR→USD window in the next 7 days. Worth checking before your next transfer.',
    'dash.insight.smart.cta':    'See forecast',
    'dash.insight.vault.eyebrow':'Vault',
    'dash.insight.vault.title':  'Earn 6.5% APY',
    'dash.insight.vault.body':   'Idle balances in SwiftX Vault compound daily — no lock-in, withdraw any time.',
    'dash.insight.vault.cta':    'Open vault',

    // ── Wallets card ─────────────────────────────────────────────
    'wallets.eyebrow':    'Your Wallets',
    'wallets.showin':     'Show in',
    'wallets.inr':        'INR Balance',
    'wallets.usd':        'USD Balance',
    'wallets.savings':    'Savings Vault',

    // ── Auth ──────────────────────────────────────────────────────
    'auth.welcomeback':   'Welcome back',
    'auth.signin.title':  'Sign in to your workspace',
    'auth.signin.desc':   'Pick up exactly where you left off.',
    'auth.email':         'Email address',
    'auth.password':      'Password',
    'auth.signing':       'Signing you in…',
    'auth.continue':      'Continue to SwiftX',
    'auth.newto':         'New to SwiftX?',
    'auth.createaccount': 'Create an account',
    'auth.needhelp':      'Need help signing in?',
    'auth.allsystems':    'All systems normal',
    'auth.borderless':    'Money that crosses borders as fast as a message.',
    'auth.bordersub':     'Move funds across 50+ currencies, lock in real-time forex rates, and grow what you keep — all from one borderless workspace.',
    'auth.feat.global.t': 'Global reach',
    'auth.feat.global.b': 'Pay anyone in 180+ countries instantly.',
    'auth.feat.fast.t':   'Lightning fast',
    'auth.feat.fast.b':   'Settle most transfers in under 60 seconds.',
    'auth.feat.trust.t':  'Bank-grade trust',
    'auth.feat.trust.b':  'Encryption, KYC, and 24/7 fraud watch.',
    'auth.copyright':     'Borderless finance for everyone.',
    'auth.reg.eyebrow':   'Create your account',
    'auth.reg.title':     'Join the borderless economy',
    'auth.reg.desc':      'Set up your SwiftX workspace in under a minute.',
    'auth.fullname':      'Full name',
    'auth.phone':         'Phone (optional)',
    'auth.createpwd':     'Create a password',
    'auth.terms':         "By continuing you agree to SwiftX's Terms of Service and acknowledge our Privacy Policy.",
    'auth.creating':      'Creating your workspace…',
    'auth.createbtn':     'Create my SwiftX account',
    'auth.alreadyhave':   'Already with us?',
    'auth.signinhere':    'Sign in instead',
    'auth.reg.h1':        'One wallet.',
    'auth.reg.h2':        'Every currency.',
    'auth.reg.h3':        'Zero friction.',
    'auth.reg.sub':       'Open a SwiftX workspace and unlock multi-currency wallets, instant remittance — all under one roof.',

    // ── Pay page ─────────────────────────────────────────────────
    'pay.eyebrow':        'Spend',
    'pay.title':          'Pay a merchant',
    'pay.desc':           'Use your SwiftX wallet at any local merchant — scan UPI in India, bank transfer everywhere else.',
    'pay.payingfrom':     'Paying from',
    'pay.upitab':         'UPI / Scan & Pay',
    'pay.banktab':        'Bank transfer',
    'pay.scan.eyebrow':   'UPI India',
    'pay.scan.title':     'Scan & Pay',
    'pay.scan.desc':      "Tap to point your camera at any UPI QR.",
    'pay.or':             'or enter manually',
    'pay.upiid':          'UPI ID (e.g. merchant@okhdfc)',
    'pay.merchantname':   'Merchant / payee name (optional)',
    'pay.testmode':       'Test mode — any VPA format like test@upi works.',
    'pay.dest':           'Destination country',
    'pay.bankhint':       'Test mode — any account / routing format is accepted.',

    // ── Deposit page ─────────────────────────────────────────────
    'deposit.eyebrow':    'Add funds',
    'deposit.title':      'Top up your wallet',
    'deposit.desc':       'Pay securely with UPI, cards, netbanking or wallets — powered by Razorpay.',
    'deposit.method':     'Preferred method',
    'deposit.methodhint': 'You can still switch to any method inside the Razorpay window.',
    'deposit.secure':     'Secure checkout',

    // ── Withdraw page ────────────────────────────────────────────
    'withdraw.eyebrow':   'Withdraw',
    'withdraw.title':     'Cash out to your bank',
    'withdraw.desc':      'Settles within 1–2 business days. End-to-end encrypted.',

    // ── Send / Transfer ─────────────────────────────────────────
    'transfer.eyebrow':   'Global transfer',
    'transfer.title':     'Send money worldwide',
    'transfer.desc':      'Real-time rates · transparent fees · 60-second delivery.',
    'transfer.payeeq':    'Who are you paying?',
    'transfer.payeefield':'SwiftX ID, email, or phone',
    'transfer.howmuch':   'How much?',
    'transfer.yousend':   'You send',
    'transfer.theyget':   'They receive',
    'transfer.rate':      'Exchange rate',
    'transfer.fee':       'Platform fee',
    'transfer.arrives':   'Arrives in',
    'transfer.arrives.v': '~60 seconds',
    'transfer.addnote':   'Add a note',
    'transfer.send':      'Send securely',
    'transfer.complete':  'Transfer complete',

    // ── Savings ──────────────────────────────────────────────────
    'vault.eyebrow':      'SwiftX Vault',
    'vault.title':        'Grow your idle balance',
    'vault.desc':         'Earn 6.5% APY on parked funds — no lock-ins, no penalties.',
    'vault.balance':      'Vault balance',
    'vault.move.in':      'Move to Vault',
    'vault.move.out':     'Move to Wallet',

    // ── Activity / History ──────────────────────────────────────
    'history.eyebrow':    'Activity log',
    'history.title':      "Every move you've made",
    'history.sent':       'Sent',
    'history.received':   'Received',
    'history.completed':  'Completed',

    // ── Misc footer ──────────────────────────────────────────────
    'footer.tagline':     'Borderless money movement.',
  },

  // ── Hindi ───────────────────────────────────────────────────────
  hi: {
    'nav.overview':       'मुख्य पृष्ठ',
    'nav.pay':            'भुगतान',
    'nav.send':           'भेजें',
    'nav.deposit':        'जमा',
    'nav.withdraw':       'निकालें',
    'nav.vault':          'तिजोरी',
    'nav.activity':       'गतिविधि',
    'nav.markets':        'बाज़ार',
    'nav.rateintel':      'दर सूचना',
    'nav.admin':          'व्यवस्थापक',
    'nav.ledger':         'खाता-बही',
    'nav.signout':        'साइन आउट',
    'nav.notifications':  'सूचनाएँ',
    'nav.swiftxid':       'SwiftX आईडी',
    'nav.copyid':         'SwiftX आईडी कॉपी करें',
    'nav.member':         'सदस्य',

    'common.online':      'ऑनलाइन',
    'common.live':        'लाइव',
    'common.copy':        'कॉपी',
    'common.copied':      'कॉपी हो गया',
    'common.back':        'वापस',
    'common.cancel':      'रद्द करें',
    'common.continue':    'आगे बढ़ें',
    'common.confirm':     'पुष्टि करें',
    'common.pay':         'भुगतान करें',
    'common.send':        'भेजें',
    'common.amount':      'राशि',
    'common.available':   'उपलब्ध',
    'common.note':        'नोट (वैकल्पिक)',
    'common.processing':  'प्रोसेस हो रहा है…',
    'common.success':     'सफल',
    'common.failed':      'विफल',
    'common.tryagain':    'पुनः प्रयास करें',
    'common.systemshealthy': 'नेटवर्क सही',

    'greeting.morning':   'सुप्रभात',
    'greeting.afternoon': 'नमस्ते',
    'greeting.evening':   'शुभ संध्या',

    'dash.hero.title1':   'आपका सीमारहित वॉलेट,',
    'dash.hero.title2':   'जब चाहें तैयार।',
    'dash.hero.desc':     'दुनिया भर में पैसा भेजें, बचत बढ़ाएँ और हर पैसा ट्रैक करें — एक ही जगह से।',
    'dash.hero.send':     'पैसे भेजें',
    'dash.hero.deposit':  'जमा करें',
    'dash.hero.rateintel':'दर सूचना',
    'dash.id.label':      'SwiftX आईडी',
    'dash.id.desc':       'आपकी ग्लोबल पहचान। पैसे पाने के लिए इसे शेयर करें — तुरंत, किसी भी समर्थित मुद्रा में।',
    'dash.qa.title':      'त्वरित कार्य',
    'dash.qa.scan.title': 'स्कैन और भुगतान',
    'dash.qa.scan.desc':  'UPI या बैंक, स्थानीय रूप से',
    'dash.qa.send.title': 'पैसे भेजें',
    'dash.qa.send.desc':  'किसी भी SwiftX यूज़र को भेजें',
    'dash.qa.deposit.title': 'पैसे जोड़ें',
    'dash.qa.deposit.desc':  'Razorpay चेकआउट',
    'dash.qa.withdraw.title':'निकालें',
    'dash.qa.withdraw.desc': 'बैंक खाते में भेजें',
    'dash.qa.open':       'खोलें',
    'dash.activity.title':'हाल की गतिविधि',
    'dash.activity.viewall': 'सभी देखें →',
    'dash.activity.none': 'अभी तक कोई ट्रांसफ़र नहीं',
    'dash.activity.cta':  'अपना पहला ट्रांसफ़र शुरू करें — किसी मित्र को भेजकर देखें।',
    'dash.activity.start':'ट्रांसफ़र शुरू करें',
    'dash.insight.smart.eyebrow': 'AI सुझाव',
    'dash.insight.smart.title':  'सही समय',
    'dash.insight.smart.body':   'फ़ॉरेक्स प्रेडिक्टर के अनुसार अगले 7 दिनों में INR→USD दर बेहतर हो सकती है। ट्रांसफ़र से पहले देख लें।',
    'dash.insight.smart.cta':    'पूर्वानुमान देखें',
    'dash.insight.vault.eyebrow':'तिजोरी',
    'dash.insight.vault.title':  '6.5% APY कमाएँ',
    'dash.insight.vault.body':   'SwiftX तिजोरी में रखी राशि पर रोज़ चक्रवृद्धि ब्याज — कोई लॉक-इन नहीं, कभी भी निकालें।',
    'dash.insight.vault.cta':    'तिजोरी खोलें',

    'wallets.eyebrow':    'आपके वॉलेट',
    'wallets.showin':     'इसमें दिखाएँ',
    'wallets.inr':        'INR बैलेंस',
    'wallets.usd':        'USD बैलेंस',
    'wallets.savings':    'बचत तिजोरी',

    'auth.welcomeback':   'वापस स्वागत है',
    'auth.signin.title':  'अपने वर्कस्पेस में साइन इन करें',
    'auth.signin.desc':   'जहाँ छोड़ा था वहीं से शुरू करें।',
    'auth.email':         'ईमेल पता',
    'auth.password':      'पासवर्ड',
    'auth.signing':       'साइन इन हो रहा है…',
    'auth.continue':      'SwiftX पर जाएँ',
    'auth.newto':         'SwiftX पर नए हैं?',
    'auth.createaccount': 'खाता बनाएँ',
    'auth.needhelp':      'साइन इन में मदद चाहिए?',
    'auth.allsystems':    'सभी सिस्टम ठीक',
    'auth.borderless':    'पैसा जो सरहदें संदेश की रफ़्तार से पार करे।',
    'auth.bordersub':     '50+ मुद्राओं में पैसा भेजें, रीयल-टाइम फ़ॉरेक्स दरें लॉक करें, और जो आप कमाते हैं उसे बढ़ाएँ — एक ही वर्कस्पेस से।',
    'auth.feat.global.t': 'ग्लोबल पहुँच',
    'auth.feat.global.b': '180+ देशों में तुरंत किसी को भुगतान करें।',
    'auth.feat.fast.t':   'बिजली जैसी तेज़',
    'auth.feat.fast.b':   'ज़्यादातर ट्रांसफ़र 60 सेकंड से कम में पूरे होते हैं।',
    'auth.feat.trust.t':  'बैंक-स्तरीय भरोसा',
    'auth.feat.trust.b':  'एन्क्रिप्शन, KYC, और 24/7 फ़्रॉड निगरानी।',
    'auth.copyright':     'सबके लिए सीमारहित वित्त।',
    'auth.reg.eyebrow':   'अपना खाता बनाएँ',
    'auth.reg.title':     'सीमारहित अर्थव्यवस्था से जुड़ें',
    'auth.reg.desc':      'एक मिनट में अपना SwiftX वर्कस्पेस सेट करें।',
    'auth.fullname':      'पूरा नाम',
    'auth.phone':         'फ़ोन (वैकल्पिक)',
    'auth.createpwd':     'पासवर्ड बनाएँ',
    'auth.terms':         'जारी रखकर आप SwiftX की सेवा शर्तों और गोपनीयता नीति को स्वीकार करते हैं।',
    'auth.creating':      'आपका वर्कस्पेस बन रहा है…',
    'auth.createbtn':     'मेरा SwiftX खाता बनाएँ',
    'auth.alreadyhave':   'पहले से सदस्य हैं?',
    'auth.signinhere':    'यहाँ साइन इन करें',
    'auth.reg.h1':        'एक वॉलेट।',
    'auth.reg.h2':        'हर मुद्रा।',
    'auth.reg.h3':        'कोई बाधा नहीं।',
    'auth.reg.sub':       'SwiftX वर्कस्पेस खोलें और बहु-मुद्रा वॉलेट और तुरंत रेमिटेंस का लाभ उठाएँ — सब एक छत के नीचे।',

    'pay.eyebrow':        'खर्च',
    'pay.title':          'व्यापारी को भुगतान करें',
    'pay.desc':           'अपने SwiftX वॉलेट से किसी भी स्थानीय व्यापारी को भुगतान करें — भारत में UPI, बाहर बैंक ट्रांसफ़र।',
    'pay.payingfrom':     'इससे भुगतान',
    'pay.upitab':         'UPI / स्कैन और भुगतान',
    'pay.banktab':        'बैंक ट्रांसफ़र',
    'pay.scan.eyebrow':   'UPI भारत',
    'pay.scan.title':     'स्कैन और भुगतान',
    'pay.scan.desc':      'किसी भी UPI QR पर कैमरा फ़ोकस करने के लिए टैप करें।',
    'pay.or':             'या मैन्युअल रूप से दर्ज करें',
    'pay.upiid':          'UPI आईडी (जैसे merchant@okhdfc)',
    'pay.merchantname':   'व्यापारी / प्राप्तकर्ता का नाम (वैकल्पिक)',
    'pay.testmode':       'टेस्ट मोड — कोई भी VPA जैसे test@upi काम करता है।',
    'pay.dest':           'गंतव्य देश',
    'pay.bankhint':       'टेस्ट मोड — कोई भी खाता / रूटिंग नंबर स्वीकार होगा।',

    'deposit.eyebrow':    'पैसे जोड़ें',
    'deposit.title':      'अपना वॉलेट टॉप-अप करें',
    'deposit.desc':       'UPI, कार्ड, नेटबैंकिंग या वॉलेट से सुरक्षित भुगतान — Razorpay द्वारा संचालित।',
    'deposit.method':     'पसंदीदा तरीका',
    'deposit.methodhint': 'Razorpay विंडो में आप कोई भी तरीका चुन सकते हैं।',
    'deposit.secure':     'सुरक्षित चेकआउट',

    'withdraw.eyebrow':   'निकालें',
    'withdraw.title':     'बैंक में निकालें',
    'withdraw.desc':      '1–2 कार्य दिवसों में सेटल होगा। एंड-टू-एंड एन्क्रिप्टेड।',

    'transfer.eyebrow':   'ग्लोबल ट्रांसफ़र',
    'transfer.title':     'दुनिया भर में पैसे भेजें',
    'transfer.desc':      'रीयल-टाइम दरें · पारदर्शी शुल्क · 60 सेकंड में डिलीवरी।',
    'transfer.payeeq':    'किसे भुगतान कर रहे हैं?',
    'transfer.payeefield':'SwiftX आईडी, ईमेल, या फ़ोन',
    'transfer.howmuch':   'कितना?',
    'transfer.yousend':   'आप भेज रहे हैं',
    'transfer.theyget':   'वे प्राप्त करेंगे',
    'transfer.rate':      'विनिमय दर',
    'transfer.fee':       'प्लेटफ़ॉर्म शुल्क',
    'transfer.arrives':   'पहुँचने में',
    'transfer.arrives.v': '~60 सेकंड',
    'transfer.addnote':   'नोट जोड़ें',
    'transfer.send':      'सुरक्षित रूप से भेजें',
    'transfer.complete':  'ट्रांसफ़र पूरा',

    'vault.eyebrow':      'SwiftX तिजोरी',
    'vault.title':        'अपनी निष्क्रिय राशि बढ़ाएँ',
    'vault.desc':         'पार्क की गई राशि पर 6.5% APY कमाएँ — कोई लॉक-इन नहीं, कोई जुर्माना नहीं।',
    'vault.balance':      'तिजोरी बैलेंस',
    'vault.move.in':      'तिजोरी में डालें',
    'vault.move.out':     'वॉलेट में निकालें',

    'history.eyebrow':    'गतिविधि लॉग',
    'history.title':      'आपकी हर हरकत',
    'history.sent':       'भेजा',
    'history.received':   'मिला',
    'history.completed':  'पूर्ण',

    'footer.tagline':     'सीमारहित पैसा।',
  },
}

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (k: string) => string }
const LangCtx = createContext<Ctx>({ lang: 'en', setLang: () => {}, t: (k) => k })

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('en')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sx_lang')
      if (saved === 'en' || saved === 'hi') setLang(saved)
    } catch { /* SSR or storage blocked — ignore */ }
    setReady(true)
  }, [])

  function setLangPersist(l: Lang) {
    setLang(l)
    try { localStorage.setItem('sx_lang', l) } catch { /* ignore */ }
    // Re-render anything subscribed via window event (for non-React code, future use)
    try { window.dispatchEvent(new Event('sx_lang_change')) } catch { /* ignore */ }
  }

  const t = (key: string) => dict[lang][key] ?? dict.en[key] ?? key

  // Hydration-safe: render children only after we've checked localStorage,
  // so server-rendered English doesn't flash when the user prefers Hindi.
  return (
    <LangCtx.Provider value={{ lang, setLang: setLangPersist, t }}>
      <span style={{ display: 'contents', visibility: ready ? 'visible' : 'visible' }}>
        {children}
      </span>
    </LangCtx.Provider>
  )
}

export function useLang() {
  return useContext(LangCtx)
}

/**
 * <Trans tKey="dash.hero.desc" /> — usable inside server components as well,
 * because it is itself a client component.
 */
export function Trans({ tKey, fallback }: { tKey: string; fallback?: string }) {
  const { t } = useLang()
  const v = t(tKey)
  return <>{v === tKey && fallback ? fallback : v}</>
}
