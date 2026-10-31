import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/** Opens the phone camera and returns the first barcode it reads. Library is loaded only in the browser. */
export function BarcodeScanner({ open, onClose, onCode }: { open: boolean; onClose: () => void; onCode: (code: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    if (!open) return;
    let stop: (() => void) | undefined;
    let dead = false;
    setErr("");
    (async () => {
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        if (dead || !video.current) return;
        const ctl = await new BrowserMultiFormatReader().decodeFromConstraints(
          { video: { facingMode: "environment" } },
          video.current,
          (res) => { if (res && !dead) { dead = true; ctl.stop(); onCode(res.getText()); } },
        );
        stop = () => ctl.stop();
        if (dead) ctl.stop();
      } catch {
        setErr("ক্যামেরা চালু করা যায়নি। ব্রাউজারে ক্যামেরার অনুমতি দিন।");
      }
    })();
    return () => { dead = true; stop?.(); };
  }, [open, onCode]);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>বারকোড স্ক্যান</DialogTitle></DialogHeader>
        <div className="relative overflow-hidden rounded-lg bg-muted">
          <video ref={video} className="aspect-[4/3] w-full object-cover" muted playsInline />
          <div className="pointer-events-none absolute inset-x-8 top-1/2 h-0.5 -translate-y-1/2 bg-destructive/80" />
        </div>
        <p className="text-center text-sm text-muted-foreground">{err || "ওষুধের বারকোড লাল দাগের সামনে ধরুন"}</p>
      </DialogContent>
    </Dialog>
  );
}
