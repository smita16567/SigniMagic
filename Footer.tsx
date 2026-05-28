export default function Footer() {
  return (
    <footer className="border-t border-border bg-card px-4 py-3 mt-auto">
      <div className="container mx-auto flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          SigniMagic &copy; {new Date().getFullYear()} — ASL Recognition App
        </p>
        <p className="text-xs text-muted-foreground">
          Powered by MediaPipe Hands
        </p>
      </div>
    </footer>
  );
}