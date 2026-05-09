import UploadForm from "@/components/UploadForm";

export default function UploadPage() {
  return (
    <main style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "clamp(32px,5vw,56px) clamp(24px,5vw,48px)" }}>
        <div style={{ marginBottom: "var(--space-7)" }}>
          <h1 style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text)", marginBottom: "var(--space-2)" }}>
            Upload Generation
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-3)" }}>
            Upload your Stable Diffusion images — metadata is auto-detected from the file.
          </p>
        </div>
        <UploadForm />
      </div>
    </main>
  );
}
