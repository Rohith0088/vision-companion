import { Navbar } from "@/components/dashboard/Navbar";
import { CameraPanel } from "@/components/dashboard/CameraPanel";
import { DetectionPanel } from "@/components/dashboard/DetectionPanel";
import { GesturePanel } from "@/components/dashboard/GesturePanel";
import { AnalyticsPanel } from "@/components/dashboard/AnalyticsPanel";
import { useCamera } from "@/hooks/useCamera";
import { clearDetectionLog } from "@/hooks/models/detectionLogger";

const Index = () => {
  const {
    videoRef,
    canvasRef,
    isActive,
    isRecording,
    capturedPhotos,
    detections,
    detectionMode,
    gestureMessage,
    currentGesture,
    stats,
    gestureHistory,
    modelLoading,
    modelsReady,
    detectionLog,
    startCamera,
    stopCamera,
    capturePhoto,
    toggleDetectionMode,
    toggleRecording,
    resetSystem,
    exportDetectionLog,
  } = useCamera();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar
        isCameraActive={isActive}
        isDetecting={detections.length > 0}
        detectionMode={detectionMode}
        capturedPhotos={capturedPhotos}
        gestureHistory={gestureHistory}
        detectionLog={detectionLog}
        onExportLog={exportDetectionLog}
        onClearLog={resetSystem}
      />

      <main className="flex-1 p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 max-w-[1600px] mx-auto w-full">
        {/* Left Column - Camera + Gestures + Log */}
        <div className="lg:col-span-2 space-y-4">
          <CameraPanel
            videoRef={videoRef}
            canvasRef={canvasRef}
            isActive={isActive}
            isRecording={isRecording}
            detections={detections}
            gestureMessage={gestureMessage}
            modelLoading={modelLoading}
            modelsReady={modelsReady}
            onStart={startCamera}
            onStop={stopCamera}
            onCapture={capturePhoto}
            onToggleRecord={toggleRecording}
          />
          <GesturePanel
            gestureHistory={gestureHistory}
            currentGesture={currentGesture}
            detectionLog={detectionLog}
            onExportLog={exportDetectionLog}
            onClearLog={resetSystem}
          />
        </div>

        {/* Right Column - Detection + Analytics */}
        <div className="space-y-4">
          <DetectionPanel detections={detections} detectionMode={detectionMode} />
          <AnalyticsPanel stats={stats} />
        </div>
      </main>
    </div>
  );
};

export default Index;
