import { useRef, useEffect, useState } from "react";
import { Upload, BarChart3 } from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";
import { useAudioStore } from "@/stores/audioStore";

const AUDIO_FILTERS = [
  {
    name: "Audio Files",
    extensions: ["mp3", "wav", "flac", "ogg", "aac", "m4a"],
  },
];

// Frequency band labels and their approximate ranges
const FREQUENCY_BANDS = [
  { label: "Sub", freq: 60, color: "rgba(34, 211, 238, 0.9)" },
  { label: "Bass", freq: 250, color: "rgba(34, 211, 238, 0.8)" },
  { label: "Low Mid", freq: 1000, color: "rgba(167, 139, 250, 0.8)" },
  { label: "High Mid", freq: 4000, color: "rgba(167, 139, 250, 0.9)" },
  { label: "Presence", freq: 8000, color: "rgba(244, 114, 182, 0.8)" },
  { label: "Brilliance", freq: 16000, color: "rgba(244, 114, 182, 0.9)" },
];

export function AudioAnalyzer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const { spectrumData, isLoadingSpectrum, loadSpectrum, clearSpectrum } = useAudioStore();

  const handleSelectFile = async () => {
    const file = await open({
      multiple: false,
      filters: AUDIO_FILTERS,
    });

    if (file) {
      setSelectedFile(file);
      clearSpectrum();
      await loadSpectrum(file);
    }
  };

  // Draw spectrum on canvas
  useEffect(() => {
    if (!spectrumData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 20, right: 20, bottom: 50, left: 50 };
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;

    // Clear
    ctx.clearRect(0, 0, width, height);

    const { magnitudes, frequencyResolution, sampleRate } = spectrumData;
    const nyquist = sampleRate / 2;

    // Use log scale for frequency axis
    const minFreq = 20;
    const maxFreq = Math.min(nyquist, 20000);
    const logMin = Math.log10(minFreq);
    const logMax = Math.log10(maxFreq);

    // Find magnitude range for normalization
    const minDb = -80;
    const maxDb = magnitudes.reduce((max, v) => Math.max(max, v), -100);
    const dbRange = Math.max(maxDb - minDb, 1);

    // Draw frequency grid lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
    ctx.lineWidth = 1;
    ctx.font = "10px monospace";
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";

    const freqLabels = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
    for (const freq of freqLabels) {
      if (freq > maxFreq) continue;
      const logFreq = Math.log10(freq);
      const x = padding.left + ((logFreq - logMin) / (logMax - logMin)) * plotWidth;

      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, padding.top + plotHeight);
      ctx.stroke();

      const label = freq >= 1000 ? `${freq / 1000}k` : `${freq}`;
      ctx.textAlign = "center";
      ctx.fillText(label, x, padding.top + plotHeight + 15);
    }

    // Draw dB grid lines
    for (let db = minDb; db <= maxDb; db += 10) {
      const y = padding.top + plotHeight - ((db - minDb) / dbRange) * plotHeight;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + plotWidth, y);
      ctx.stroke();

      ctx.textAlign = "right";
      ctx.fillText(`${db}`, padding.left - 5, y + 3);
    }

    // Draw spectrum as filled path
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top + plotHeight);

    let prevX = padding.left;
    for (let i = 1; i < magnitudes.length; i++) {
      const freq = i * frequencyResolution;
      if (freq < minFreq || freq > maxFreq) continue;

      const logFreq = Math.log10(freq);
      const x = padding.left + ((logFreq - logMin) / (logMax - logMin)) * plotWidth;
      const dbVal = Math.max(magnitudes[i], minDb);
      const y = padding.top + plotHeight - ((dbVal - minDb) / dbRange) * plotHeight;

      ctx.lineTo(x, y);
      prevX = x;
    }

    ctx.lineTo(prevX, padding.top + plotHeight);
    ctx.closePath();

    // Gradient fill
    const gradient = ctx.createLinearGradient(padding.left, 0, padding.left + plotWidth, 0);
    gradient.addColorStop(0, "rgba(34, 211, 238, 0.4)");
    gradient.addColorStop(0.4, "rgba(167, 139, 250, 0.4)");
    gradient.addColorStop(1, "rgba(244, 114, 182, 0.4)");
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw spectrum line on top
    ctx.beginPath();
    for (let i = 1; i < magnitudes.length; i++) {
      const freq = i * frequencyResolution;
      if (freq < minFreq || freq > maxFreq) continue;

      const logFreq = Math.log10(freq);
      const x = padding.left + ((logFreq - logMin) / (logMax - logMin)) * plotWidth;
      const dbVal = Math.max(magnitudes[i], minDb);
      const y = padding.top + plotHeight - ((dbVal - minDb) / dbRange) * plotHeight;

      if (i === 1 || freq <= minFreq + frequencyResolution) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    const lineGradient = ctx.createLinearGradient(padding.left, 0, padding.left + plotWidth, 0);
    lineGradient.addColorStop(0, "rgba(34, 211, 238, 0.9)");
    lineGradient.addColorStop(0.4, "rgba(167, 139, 250, 0.9)");
    lineGradient.addColorStop(1, "rgba(244, 114, 182, 0.9)");
    ctx.strokeStyle = lineGradient;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Draw frequency band labels
    ctx.font = "9px sans-serif";
    for (const band of FREQUENCY_BANDS) {
      if (band.freq > maxFreq) continue;
      const logFreq = Math.log10(band.freq);
      const x = padding.left + ((logFreq - logMin) / (logMax - logMin)) * plotWidth;
      ctx.fillStyle = band.color;
      ctx.textAlign = "center";
      ctx.fillText(band.label, x, padding.top + plotHeight + 32);
    }

    // Axis labels
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Frequency (Hz)", padding.left + plotWidth / 2, height - 2);

    ctx.save();
    ctx.translate(12, padding.top + plotHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Magnitude (dB)", 0, 0);
    ctx.restore();
  }, [spectrumData]);

  const fileName = selectedFile?.split("/").pop() ?? selectedFile?.split("\\").pop();

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="text-heading font-medium text-white/90">Spectrum Analyzer</div>

      {/* File selector */}
      <div
        onClick={handleSelectFile}
        className="glass-interactive flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200"
      >
        <Upload size={18} className="text-white/40" />
        {fileName ? (
          <div>
            <p className="text-body text-white/80">{fileName}</p>
            <p className="text-label text-white/40">Click to change</p>
          </div>
        ) : (
          <p className="text-body text-white/50">Select an audio file to analyze</p>
        )}
      </div>

      {/* Loading */}
      {isLoadingSpectrum && (
        <div className="flex items-center justify-center gap-2 py-8">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span className="text-body text-white/50">Computing spectrum...</span>
        </div>
      )}

      {/* Canvas */}
      {spectrumData && (
        <div className="glass-card p-4 rounded-xl flex-1 min-h-[300px]">
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ minHeight: 280 }}
          />
        </div>
      )}

      {/* Empty state */}
      {!spectrumData && !isLoadingSpectrum && !selectedFile && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="glass-interactive p-6 rounded-xl">
            <BarChart3 size={32} className="text-white/20" />
          </div>
          <p className="text-body text-white/40">
            Select an audio file to view its frequency spectrum
          </p>
        </div>
      )}
    </div>
  );
}
