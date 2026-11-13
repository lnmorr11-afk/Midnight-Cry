import React, { useState, useEffect } from 'react';
import { BookOpen, ExternalLink, RefreshCw, Copy, Check, Volume2, Edit3 } from 'lucide-react';
import { useOwnerEdit } from '../context/OwnerEditContext';
import { EditableText } from './EditableText';

interface VerseData {
  reference: string;
  text: string;
  version: string;
  link: string;
}

// 31 foundational King James Version (KJV) daily scriptures (Public Domain)
const KJV_DAILY_ROTATION: { ref: string; text: string }[] = [
  {
    ref: 'John 3:16',
    text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.',
  },
  {
    ref: 'Romans 8:28',
    text: 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.',
  },
  {
    ref: 'Proverbs 3:5-6',
    text: 'Trust in the LORD with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.',
  },
  {
    ref: 'Philippians 4:13',
    text: 'I can do all things through Christ which strengtheneth me.',
  },
  {
    ref: 'Psalm 23:1',
    text: 'The LORD is my shepherd; I shall not want.',
  },
  {
    ref: 'Jeremiah 29:11',
    text: 'For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end.',
  },
  {
    ref: 'Isaiah 40:31',
    text: 'But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.',
  },
  {
    ref: 'Romans 12:2',
    text: 'And be not conformed to this world: but be ye transformed by the renewing of your mind, that ye may prove what is that good, and acceptable, and perfect, will of God.',
  },
  {
    ref: 'Psalm 46:1',
    text: 'God is our refuge and strength, a very present help in trouble.',
  },
  {
    ref: 'Galatians 2:20',
    text: 'I am crucified with Christ: nevertheless I live; yet not I, but Christ liveth in me: and the life which I now live in the flesh I live by the faith of the Son of God, who loved me, and gave himself for me.',
  },
  {
    ref: '2 Timothy 1:7',
    text: 'For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.',
  },
  {
    ref: 'Matthew 6:33',
    text: 'But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.',
  },
  {
    ref: 'Psalm 119:105',
    text: 'Thy word is a lamp unto my feet, and a light unto my path.',
  },
  {
    ref: 'Ephesians 2:8-9',
    text: 'For by grace are ye saved through faith; and that not of yourselves: it is the gift of God: Not of works, lest any man should boast.',
  },
  {
    ref: '1 Corinthians 13:13',
    text: 'And now abideth faith, hope, charity, these three; but the greatest of these is charity.',
  },
  {
    ref: 'Joshua 1:9',
    text: 'Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.',
  },
  {
    ref: 'Hebrews 11:1',
    text: 'Now faith is the substance of things hoped for, the evidence of things not seen.',
  },
  {
    ref: 'Romans 5:8',
    text: 'But God commendeth his love toward us, in that, while we were yet sinners, Christ died for us.',
  },
  {
    ref: 'Psalm 27:1',
    text: 'The LORD is my light and my salvation; whom shall I fear? the LORD is the strength of my life; of whom shall I be afraid?',
  },
  {
    ref: 'Revelation 1:5',
    text: 'And from Jesus Christ, who is the faithful witness, and the first begotten of the dead, and the prince of the kings of the earth. Unto him that loved us, and washed us from our sins in his own blood,',
  },
  {
    ref: 'Isaiah 41:10',
    text: 'Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee; yea, I will uphold thee with the right hand of my righteousness.',
  },
  {
    ref: 'Psalm 34:8',
    text: 'O taste and see that the LORD is good: blessed is the man that trusteth in him.',
  },
  {
    ref: '1 Peter 5:7',
    text: 'Casting all your care upon him; for he careth for you.',
  },
  {
    ref: 'John 14:6',
    text: 'Jesus saith unto him, I am the way, the truth, and the life: no man cometh unto the Father, but by me.',
  },
  {
    ref: 'Romans 10:9',
    text: 'That if thou shalt confess with thy mouth the Lord Jesus, and shalt believe in thine heart that God hath raised him from the dead, thou shalt be saved.',
  },
  {
    ref: 'Psalm 91:1-2',
    text: 'He that dwelleth in the secret place of the most High shall abide under the shadow of the Almighty. I will say of the LORD, He is my refuge and my fortress: my God; in him will I trust.',
  },
  {
    ref: 'Colossians 3:2',
    text: 'Set your affection on things above, not on things on the earth.',
  },
  {
    ref: 'Matthew 11:28',
    text: 'Come unto me, all ye that labour and are heavy laden, and I will give you rest.',
  },
  {
    ref: '2 Corinthians 5:17',
    text: 'Therefore if any man be in Christ, he is a new creature: old things are passed away; behold, all things are become new.',
  },
  {
    ref: 'Proverbs 18:10',
    text: 'The name of the LORD is a strong tower: the righteous runneth into it, and is safe.',
  },
  {
    ref: 'Lamentations 3:22-23',
    text: "It is of the LORD's mercies that we are not consumed, because his compassions fail not. They are new every morning: great is thy faithfulness.",
  },
];

export const DailyVerse: React.FC = () => {
  const { isOwnerMode, siteContent, updateSiteContent } = useOwnerEdit();
  const { dailyVerse } = siteContent;

  const [verse, setVerse] = useState<VerseData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);

  const getTodayKjv = (): VerseData => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    const selected = KJV_DAILY_ROTATION[dayOfYear % KJV_DAILY_ROTATION.length];
    const encoded = encodeURIComponent(selected.ref);

    return {
      reference: selected.ref,
      text: selected.text,
      version: 'King James Version (KJV)',
      link: `https://www.biblegateway.com/passage/?search=${encoded}&version=KJV`,
    };
  };

  const fetchBibleGatewayKJV = () => {
    if (dailyVerse.useCustomVerse && dailyVerse.customText.trim() && dailyVerse.customReference.trim()) {
      setVerse({
        reference: dailyVerse.customReference.trim(),
        text: dailyVerse.customText.trim(),
        version: 'King James Version (KJV)',
        link: `https://www.biblegateway.com/passage/?search=${encodeURIComponent(
          dailyVerse.customReference.trim()
        )}&version=KJV`,
      });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const fallback = getTodayKjv();
    const callbackName = `bg_votd_cb_${Date.now()}`;
    const script = document.createElement('script');
    let handled = false;

    const cleanup = () => {
      try {
        if (script.parentNode) script.parentNode.removeChild(script);
        delete (window as unknown as Record<string, unknown>)[callbackName];
      } catch {
        // ignore
      }
    };

    (window as unknown as Record<string, unknown>)[callbackName] = (data: {
      votd?: { content?: string; reference?: string; permalink?: string };
    }) => {
      handled = true;
      cleanup();
      if (data && data.votd) {
        const cleanContent = (data.votd.content || '')
          .replace(/<[^>]+>/g, '')
          .replace(/&ldquo;|&rdquo;/g, '"')
          .replace(/&lsquo;|&rsquo;/g, "'")
          .replace(/&mdash;/g, '—')
          .trim();

        const ref = data.votd.reference || fallback.reference;
        const text = cleanContent || fallback.text;
        const link =
          data.votd.permalink ||
          `https://www.biblegateway.com/passage/?search=${encodeURIComponent(ref)}&version=KJV`;

        setVerse({
          reference: ref,
          text,
          version: 'King James Version (KJV)',
          link,
        });
      } else {
        setVerse(fallback);
      }
      setIsLoading(false);
    };

    script.src = `https://www.biblegateway.com/votd/get/?format=json&version=KJV&callback=${callbackName}`;
    script.async = true;
    script.onerror = () => {
      if (!handled) {
        handled = true;
        cleanup();
        setVerse(fallback);
        setIsLoading(false);
      }
    };

    document.body.appendChild(script);

    setTimeout(() => {
      if (!handled) {
        handled = true;
        cleanup();
        setVerse(fallback);
        setIsLoading(false);
      }
    }, 3000);
  };

  useEffect(() => {
    fetchBibleGatewayKJV();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyVerse.useCustomVerse, dailyVerse.customReference, dailyVerse.customText]);

  const handleCopy = () => {
    if (!verse) return;
    const textToCopy = `"${verse.text}" — ${verse.reference} (KJV)\nVia Bible Gateway: ${verse.link}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSpeak = () => {
    if (!verse || !('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(`${verse.reference}. ${verse.text}`);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleNextRandom = () => {
    const randomIndex = Math.floor(Math.random() * KJV_DAILY_ROTATION.length);
    const selected = KJV_DAILY_ROTATION[randomIndex];
    const encoded = encodeURIComponent(selected.ref);
    setVerse({
      reference: selected.ref,
      text: selected.text,
      version: 'King James Version (KJV)',
      link: `https://www.biblegateway.com/passage/?search=${encoded}&version=KJV`,
    });
  };

  const updateDailyField = <K extends keyof typeof dailyVerse>(
    key: K,
    value: (typeof dailyVerse)[K]
  ) => {
    updateSiteContent((prev) => ({
      ...prev,
      dailyVerse: { ...prev.dailyVerse, [key]: value },
    }));
  };

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50/90 via-white to-amber-100/40 border border-amber-200/80 shadow-md p-6 sm:p-8 transition-all">
        <div className="absolute right-4 top-4 text-amber-900/5 select-none pointer-events-none">
          <BookOpen className="w-32 h-32" />
        </div>

        {/* Header line */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-amber-200/60 relative z-10">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 bg-amber-800 text-white rounded-md shadow-2xs">
              <BookOpen className="w-4 h-4" />
            </span>
            <div>
              <EditableText
                value={dailyVerse.heading}
                onChange={(val) => updateDailyField('heading', val)}
                as="h3"
                className="font-google-sans text-xs sm:text-sm font-semibold text-amber-950 uppercase tracking-widest"
                label="Daily Verse Heading"
              />
              <EditableText
                value={dailyVerse.subheading}
                onChange={(val) => updateDailyField('subheading', val)}
                as="p"
                className="text-2xs text-amber-900/70 font-google-sans"
                label="Daily Verse Subheading"
              />
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            {isOwnerMode && (
              <button
                onClick={() => setShowCustomForm((prev) => !prev)}
                className="inline-flex items-center px-2.5 py-1 rounded-md bg-amber-800 text-white text-2xs font-google-sans hover:bg-amber-900 transition-colors cursor-pointer mr-1"
                title="Pin or edit a custom KJV verse"
              >
                <Edit3 className="w-3 h-3 mr-1" />
                <span>{dailyVerse.useCustomVerse ? 'Custom Verse Active' : 'Set Verse'}</span>
              </button>
            )}

            <button
              onClick={handleSpeak}
              className={`p-1.5 rounded-md text-amber-900 hover:bg-amber-200/60 transition-colors cursor-pointer ${
                isSpeaking ? 'bg-amber-200 text-amber-950 ring-1 ring-amber-500' : ''
              }`}
              title={isSpeaking ? 'Stop Audio' : 'Listen to Scripture'}
              aria-label="Listen to scripture"
            >
              <Volume2 className="w-4 h-4" />
            </button>

            <button
              onClick={handleCopy}
              className="p-1.5 rounded-md text-amber-900 hover:bg-amber-200/60 transition-colors cursor-pointer"
              title="Copy verse to clipboard"
              aria-label="Copy verse"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>

            <button
              onClick={handleNextRandom}
              className="p-1.5 rounded-md text-amber-900 hover:bg-amber-200/60 transition-colors cursor-pointer"
              title="Another KJV Passage"
              aria-label="New passage"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Owner Custom Verse Controls */}
        {isOwnerMode && showCustomForm && (
          <div className="my-4 p-4 rounded-xl bg-amber-100/60 border border-amber-300 space-y-3 relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-google-sans font-semibold text-amber-950">
                Owner Scripture Override
              </span>
              <label className="inline-flex items-center space-x-2 text-xs font-google-sans cursor-pointer">
                <input
                  type="checkbox"
                  checked={dailyVerse.useCustomVerse}
                  onChange={(e) => updateDailyField('useCustomVerse', e.target.checked)}
                  className="rounded border-amber-400 text-amber-800"
                />
                <span>Display my custom verse instead of automatic daily rotation</span>
              </label>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <input
                type="text"
                value={dailyVerse.customReference}
                onChange={(e) => updateDailyField('customReference', e.target.value)}
                placeholder="Reference (e.g. John 14:6)"
                className="w-full px-3 py-1.5 text-xs rounded border border-amber-300 bg-white"
              />
              <textarea
                rows={2}
                value={dailyVerse.customText}
                onChange={(e) => updateDailyField('customText', e.target.value)}
                placeholder="Enter KJV verse text..."
                className="w-full px-3 py-1.5 text-xs rounded border border-amber-300 bg-white"
              />
            </div>
          </div>
        )}

        {/* Verse Content */}
        <div className="py-6 relative z-10">
          {isLoading ? (
            <div className="py-8 flex flex-col items-center justify-center space-y-3 text-amber-900/70">
              <div className="w-6 h-6 border-2 border-amber-800 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-google-sans">Fetching Bible Gateway KJV verse...</p>
            </div>
          ) : (
            verse && (
              <div className="space-y-4">
                <blockquote className="font-garamond text-xl sm:text-2xl md:text-3xl text-gray-900 font-normal leading-relaxed italic text-balance">
                  &ldquo;{verse.text}&rdquo;
                </blockquote>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-google-sans font-bold text-base md:text-lg text-amber-950">
                      {verse.reference}
                    </span>
                    <span className="inline-block text-2xs px-2 py-0.5 rounded font-mono font-medium bg-amber-800/10 text-amber-900 border border-amber-300">
                      KJV
                    </span>
                  </div>

                  <a
                    href={verse.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs font-google-sans font-medium text-amber-900 hover:text-black hover:underline group"
                  >
                    <span>Read on Bible Gateway</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                </div>
              </div>
            )
          )}
        </div>

        <div className="pt-2 text-2xs text-amber-900/60 flex items-center justify-between font-google-sans border-t border-amber-200/40">
          <EditableText
            inline
            value={dailyVerse.footerNote}
            onChange={(val) => updateDailyField('footerNote', val)}
            as="span"
            label="Daily Verse Footer"
          />
          <span className="hidden sm:inline">
            {dailyVerse.useCustomVerse ? 'Pinned by Owner' : 'Updated Daily'}
          </span>
        </div>
      </div>
    </section>
  );
};
