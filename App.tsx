import { useState } from 'react';
import Header from './components/Header';
import WebcamPanel from './components/WebcamPanel';
import ResultsPanel from './components/ResultsPanel';
import InfoSidebar from './components/InfoSidebar';
import HistoryPanel from './components/HistoryPanel';

export type Language = 'en' | 'hi' | 'mr';

function App() {
  console.log('App component rendering...');
  console.log('App component loaded and rendering...');

  const [language, setLanguage] = useState<Language>('en');
  const [detectedGesture, setDetectedGesture] = useState<string>('');
  const [confidence, setConfidence] = useState<number>(0);
  const [history, setHistory] = useState<string[]>([]);

  const handleGestureDetected = (gesture: string, conf: number) => {
    setDetectedGesture(gesture);
    setConfidence(conf);
    if (gesture && gesture !== 'Unknown') {
      setHistory(prev => [gesture, ...prev].slice(0, 20));
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header language={language} onLanguageChange={setLanguage} />
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2 flex flex-col gap-6">
        <WebcamPanel onGestureDetected={handleGestureDetected} />
        <ResultsPanel
            gesture={detectedGesture}
            confidence={confidence}
            history={history}
            language={language}
            />
          </div>
          <div className="flex flex-col gap-6">
            <InfoSidebar />
            <HistoryPanel history={history} language={language} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;