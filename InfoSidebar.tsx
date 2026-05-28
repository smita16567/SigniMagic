export default function InfoSidebar() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const numbers = Array.from({ length: 20 }, (_, i) => String(i + 1));
  const words = [
    'Hello','Yes','No','Good','Bad','Sorry','Please','Help',
    'Water','Food','Home','Love','Friend','Family','Thank You',
    'Morning','Night','School','Work','Sleep','Sick','Happy',
    'Sad','Hungry','Bathroom','Doctor','Mother','Father',
  ];
  const sentences = [
    'I love you','Thank you','How are you?',
    'Good morning','Good night','Please help me',
    'I am hungry','I am happy',
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      <h2 className="text-base font-semibold text-foreground">Gesture Reference</h2>

      {/* Letters */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Letters A–Z</p>
        <div className="flex flex-wrap gap-1">
          {letters.map(l => (
            <span key={l} className="px-2 py-0.5 bg-secondary text-primary text-xs rounded font-bold border border-border">
              {l}
            </span>
          ))}
        </div>
      </div>

      {/* Numbers */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Numbers 1–20</p>
        <div className="flex flex-wrap gap-1">
          {numbers.map(n => (
            <span key={n} className="px-2 py-0.5 bg-secondary text-primary text-xs rounded font-bold border border-border">
              {n}
            </span>
          ))}
        </div>
      </div>

      {/* Words */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Daily Life Words</p>
        <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
          {words.map(w => (
            <span key={w} className="px-2 py-0.5 bg-secondary text-foreground text-xs rounded border border-border">
              {w}
            </span>
          ))}
        </div>
      </div>

      {/* Sentences */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Simple Sentences</p>
        <div className="space-y-1 max-h-28 overflow-y-auto">
          {sentences.map(s => (
            <p key={s} className="text-xs text-foreground bg-secondary px-2 py-1 rounded border border-border">
              {s}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}