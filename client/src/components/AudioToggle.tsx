import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAudioSettings } from "@/hooks/useMagicalGlow";

export function AudioToggle() {
  const { isEnabled, toggle } = useAudioSettings();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      className="text-gray-400 hover:text-white transition-colors"
      title={isEnabled ? "Disable sound effects" : "Enable sound effects"}
    >
      {isEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
    </Button>
  );
}