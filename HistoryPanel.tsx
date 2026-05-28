import { Language } from '../App';
import { WORD_TRANSLATIONS } from '../config';

interface HistoryPanelProps {
  history: string[];
  language: Language;
}

function translateGesture(gesture: string, language: Language): string {
  if (!gesture || gesture === 'Unknown') return gesture;
  if (WORD_TRANSLATIONS[gesture]) {
    return WORD_TRANSLATIONS[gesture][language] || gesture;
  }
  return gesture;
}

export default function HistoryPanel({ history, language }: HistoryPanelProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h2 className="text-base font-semibold text-foreground mb-3">
        Session History
      </h2>

      {history.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No gestures detected yet. Start the camera to begin.
        </p>
      ) : (
        <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
          {history.map((gesture, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-secondary text-sm"
            >
              <span className="font-medium text-foreground">
                {translateGesture(gesture, language)}
              </span>
              <span className="text-xs text-muted-foreground">
                #{history.length - i}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}