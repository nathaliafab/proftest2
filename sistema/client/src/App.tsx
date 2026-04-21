import { useState } from "react";
import { Navigate, NavLink, Route, Routes } from "react-router-dom";
import AssessmentsPage from "./pages/AssessmentsPage";
import StudentsPage from "./pages/StudentsPage";

interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "warning";
}

const App = (): JSX.Element => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: Toast["type"]): void => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, message, type }]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  };

  const removeToast = (id: number): void => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <main className="page">
      <aside className="toast-container" aria-live="polite" aria-label="Notificacoes do sistema">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            <p>{toast.message}</p>
            <button
              type="button"
              className="toast-close"
              onClick={() => removeToast(toast.id)}
              aria-label="Fechar notificacao"
            >
              x
            </button>
          </div>
        ))}
      </aside>

      <div className="content-shell">
        <nav className="top-nav" aria-label="Navegacao principal">
          <NavLink
            to="/alunos"
            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          >
            Alunos
          </NavLink>
          <NavLink
            to="/avaliacoes"
            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          >
            Avaliacoes
          </NavLink>
        </nav>

        <Routes>
          <Route path="/" element={<Navigate to="/alunos" replace />} />
          <Route path="/alunos" element={<StudentsPage showToast={showToast} />} />
          <Route path="/avaliacoes" element={<AssessmentsPage showToast={showToast} />} />
        </Routes>
      </div>
    </main>
  );
};

export default App;