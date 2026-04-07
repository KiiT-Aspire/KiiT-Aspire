/**
 * Minimal layout for monitor-frame pages.
 * These pages are loaded inside <iframe> elements on the faculty results page
 * so each iframe gets its own JavaScript context — and therefore its own
 * RTKClient singleton — giving true per-student video isolation.
 */
export default function MonitorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, overflow: "hidden", background: "#000" }}>
        {children}
      </body>
    </html>
  );
}
