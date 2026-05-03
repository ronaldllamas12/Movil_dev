export default function GoogleSignInSection({ isGoogleEnabled, googleScriptError, googleButtonRef }) {
  return (
    <>
      <div className="flex items-center gap-3 text-xs text-[color:var(--muted)]">
        <span className="h-px flex-1 bg-[color:var(--border)]" />
        o
        <span className="h-px flex-1 bg-[color:var(--border)]" />
      </div>

      <div className="flex justify-center">
        {isGoogleEnabled ? <div ref={googleButtonRef} className="min-h-10" /> : null}
      </div>

      {isGoogleEnabled ? null:
        <p className="text-center text-xs text-amber-700">
          Google Sign-In no está disponible: falta la variable VITE_GOOGLE_CLIENT_ID en el entorno de producción.
        </p>}
      {googleScriptError ? (
        <p className="text-center text-xs text-red-700">{googleScriptError}</p>
      ) : null}
    </>
  );
}
