import { Suspense } from "react";
import CallbackContent from "./callback-content";

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <p className="text-gray-400">Processing authentication...</p>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
