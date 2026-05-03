export default function AuthErrorMessage({ errorMsg }) {
  if (!errorMsg) return null;

  if (Array.isArray(errorMsg)) {
    return (
      <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
        {errorMsg.map((msg, idx) => (
          <div key={idx}>{typeof msg === 'string' ? msg : msg?.msg || JSON.stringify(msg)}</div>
        ))}
      </div>
    );
  }

  return (
    <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
      {typeof errorMsg === 'string' ? errorMsg : errorMsg?.msg || JSON.stringify(errorMsg)}
    </p>
  );
}
