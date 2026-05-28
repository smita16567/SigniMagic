import { Language } from '../App';
import { CONFIG } from '../config';

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export default function Header({ language, onLanguageChange }: HeaderProps) {
  return (
    <header className="border-b border-border bg-card px-4 py-3">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">SigniMagic</h1>
            <p className="text-xs text-muted-foreground">ASL Recognition</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm text-muted-foreground">Output Language:</label>
          <select
            value={language}
            onChange={e => onLanguageChange(e.target.value as Language)}
            className="bg-secondary text-foreground border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {Object.entries(CONFIG.languages).map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}