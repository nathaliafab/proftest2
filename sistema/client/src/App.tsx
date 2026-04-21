import { FormEvent, useEffect, useMemo, useState } from "react";
import { createStudent, deleteStudent, getStudents, updateStudent } from "./api";
import { Student, StudentInput } from "./types";

const initialForm: StudentInput = {
  name: "",
  cpf: "",
  email: ""
};

const onlyDigits = (value: string): string => value.replace(/\D/g, "");

const App = (): JSX.Element => {
  const [students, setStudents] = useState<Student[]>([]);
  const [form, setForm] = useState<StudentInput>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const formTitle = useMemo(
    () => (editingId ? "Alterar aluno" : "Incluir aluno"),
    [editingId]
  );

  const loadStudents = async (): Promise<void> => {
    setIsLoading(true);
    setError("");

    try {
      const data = await getStudents();
      setStudents(data);
    } catch (loadError) {
      setError((loadError as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadStudents();
  }, []);

  const resetForm = (): void => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const payload: StudentInput = {
        name: form.name.trim(),
        cpf: onlyDigits(form.cpf),
        email: form.email.trim().toLowerCase()
      };

      if (editingId) {
        await updateStudent(editingId, payload);
      } else {
        await createStudent(payload);
      }

      resetForm();
      await loadStudents();
    } catch (submitError) {
      setError((submitError as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (student: Student): void => {
    setForm({
      name: student.name,
      cpf: student.cpf,
      email: student.email
    });
    setEditingId(student.id);
    setError("");
  };

  const handleRemove = async (id: string): Promise<void> => {
    setError("");

    try {
      await deleteStudent(id);
      await loadStudents();
    } catch (deleteError) {
      setError((deleteError as Error).message);
    }
  };

  return (
    <main className="page">
      <section className="panel">
        <h1>Gerenciamento de alunos</h1>
        <p className="subtitle">Lista de alunos cadastrados com nome, CPF e email.</p>

        <form className="student-form" onSubmit={(event) => void handleSubmit(event)}>
          <h2>{formTitle}</h2>
          <label htmlFor="name">Nome</label>
          <input
            id="name"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
            minLength={3}
          />

          <label htmlFor="cpf">CPF</label>
          <input
            id="cpf"
            value={form.cpf}
            onChange={(event) => setForm({ ...form, cpf: onlyDigits(event.target.value) })}
            required
            pattern="[0-9]{11}"
            title="Informe 11 digitos numericos"
          />

          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            required
          />

          <div className="actions">
            <button type="submit" disabled={isSubmitting}>
              {editingId ? "Salvar alteracao" : "Cadastrar aluno"}
            </button>
            {editingId ? (
              <button type="button" className="ghost" onClick={resetForm}>
                Cancelar
              </button>
            ) : null}
          </div>
        </form>

        {error ? <p className="error">{error}</p> : null}

        <section className="student-list-section" aria-label="Lista de alunos">
          <h2>Alunos cadastrados</h2>
          {isLoading ? <p>Carregando alunos...</p> : null}
          {!isLoading && students.length === 0 ? <p>Nenhum aluno cadastrado.</p> : null}

          {!isLoading && students.length > 0 ? (
            <table className="student-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>CPF</th>
                  <th>Email</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td>{student.name}</td>
                    <td>{student.cpf}</td>
                    <td>{student.email}</td>
                    <td>
                      <button type="button" className="small" onClick={() => handleEdit(student)}>
                        Alterar
                      </button>
                      <button
                        type="button"
                        className="small danger"
                        onClick={() => void handleRemove(student.id)}
                      >
                        Remover
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </section>
      </section>
    </main>
  );
};

export default App;