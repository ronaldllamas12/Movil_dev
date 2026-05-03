

export default function AuthTabs({ activeTab, setActiveTab }) {
  return (
    <div className="flex bg-[color:var(--surface-muted)] p-2 gap-2">
    

        <button
        type="button"
        onClick={() => setActiveTab('login')}
        className={`flex-1 py-3 text-sm font-semibold rounded-2xl transition-all duration-200 ${
        activeTab === 'login'
            ? 'bg-[color:var(--surface)] text-[color:var(--text)] shadow-md'
            : 'text-[color:var(--muted)] hover:text-[color:var(--text)]'
        }`}>
        Iniciar Sesión
        </button>
        <button
        type="button"
        onClick={() => setActiveTab('register')}
        className={`flex-1 py-3 text-sm font-semibold rounded-2xl transition-all duration-200 ${
        activeTab === 'register'
            ? 'bg-[color:var(--surface)] text-[color:var(--text)] shadow-md'
            : 'text-[color:var(--muted)] hover:text-[color:var(--text)]'
        }`}
      >
        Registrarse
      </button>
    </div>
  );
}
