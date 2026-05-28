import { Language } from '../App';
import { WORD_TRANSLATIONS } from '../config';

interface ResultsPanelProps {
  gesture: string;
  confidence: number;
  history: string[];
  language: Language;
}

function translateGesture(gesture: string, language: Language): string {
  if (!gesture || gesture === 'Unknown') return gesture;
  if (WORD_TRANSLATIONS[gesture]) {
    return WORD_TRANSLATIONS[gesture][language] || gesture;
  }
  return gesture; // letters stay as-is
}

function speakText(text: string, language: Language) {
  if (!text || text === 'Unknown') return;
  const utterance = new SpeechSynthesisUtterance(text);
  const langCodes: Record<Language, string> = {
    en: 'en-US',
    hi: 'hi-IN',
    mr: 'mr-IN',
  };
  utterance.lang = langCodes[language];
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

export default function ResultsPanel({
  gesture,
  confidence,
  history,
  language,
}: ResultsPanelProps) {
  const translated = translateGesture(gesture, language);
  const confidencePct = Math.round(confidence * 100);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h2 className="text-base font-semibold text-foreground mb-3">
        Detection Result
      </h2>

      {/* Main gesture display */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-4xl font-bold text-primary">
            {translated || '--'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {gesture && gesture !== 'Unknown'
              ? 'Gesture detected'
              : gesture === 'Unknown'
              ? 'Unknown gesture'
              : 'No gesture detected'}
          </p>
        </div>

        {/* Confidence badge */}
        {confidence > 0 && (
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-primary">
              {confidencePct}%
            </span>
            <span className="text-xs text-muted-foreground">confidence</span>
          </div>
        )}
      </div>

      {/* Confidence bar */}
      {confidence > 0 && (
        <div className="mb-4">
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${confidencePct}%` }}
            />
          </div>
        </div>
      )}

      {/* Speak button */}
      {translated && translated !== 'Unknown' && (
        <button
          onClick={() => speakText(translated, language)}
          className="mb-4 px-4 py-1.5 bg-secondary text-foreground border border-border rounded-md text-sm hover:bg-accent transition-colors"
        >
          Speak
        </button>
      )}

      {/* Recent history chips */}
      {history.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">Recent:</p>
          <div className="flex flex-wrap gap-2">
            {history.slice(0, 10).map((g, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-secondary text-foreground text-xs rounded-full border border-border"
              >
                {translateGesture(g, language)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}