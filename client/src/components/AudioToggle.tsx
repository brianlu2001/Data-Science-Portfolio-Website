import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAudioSettings } from "@/hooks/useMagicalGlow";

export function AudioToggle() {
  const { isEnabled, toggle } = useAudioSettings();

  return (
    <div className="relative group/audio">
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      className="text-gray-400 hover:text-white transition-colors"
      title={isEnabled ? "Disable sound effects" : "Enable sound effects"}
    >
      {isEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
    </Button>
    <a href="/audio/strings/ATTRIBUTION.txt" target="_blank" rel="noopener noreferrer"
      className="absolute right-0 top-full whitespace-nowrap text-[10px] text-gray-400 hover:text-white opacity-0 pointer-events-none group-hover/audio:opacity-100 group-hover/audio:pointer-events-auto group-focus-within/audio:opacity-100 group-focus-within/audio:pointer-events-auto focus-visible:opacity-100"
    >Sound credits</a>
    </div>
  );
}