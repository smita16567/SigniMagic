export default function HeroSection() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 text-center">
      <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
        <span className="text-2xl">🤟</span>
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2">
        Welcome to SigniMagic
      </h2>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        Real-time American Sign Language recognition powered by MediaPipe Hands.
        Point your camera at your hand and start signing!
      </p>
      <div className="flex justify-center gap-4 mt-4">
        <div className="text-center">
          <p className="text-lg font-bold text-primary">20+</p>
          <p className="text-xs text-muted-foreground">ASL Letters</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-primary">16+</p>
          <p className="text-xs text-muted-foreground">Common Words</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-primary">3</p>
          <p className="text-xs text-muted-foreground">Languages</p>
        </div>
      </div>
    </div>
  );
}