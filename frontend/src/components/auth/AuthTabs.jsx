export default function AuthTabs({ activeTab, setActiveTab }) {
  return (
    <div className="flex bg-[color:var(--surface-muted)] p-2 gap-2">
      <button
        type="button"
        onClick={() => setActiveTab('login')}
        className={`flex-1 rounded-[1rem] py-3 text-sm font-semibold transition ${
          activeTab === 'login'
            ? 'bg-[color:var(--surface)] text-[color:var(--text)] shadow-sm'
            : 'text-[color:var(--muted)] hover:text-[color:var(--text)]'
        }`}
      >
        Iniciar Sesión
      </button>
      <button
        type="button"
        onClick={() => setActiveTab('register')}
        className={`flex-1 rounded-[1rem] py-3 text-sm font-semibold transition ${
          activeTab === 'register'
            ? 'bg-[color:var(--session)] text-[color:var(--text)] shadow-sm'
            : 'text-[color:var(--muted)] hover:text-[color:var(--text)]'
        }`}
      >
        Registrarse
      </button>
    </div>
  );
}
