import { FormEvent, useEffect, useMemo, useState } from "react";
import { createStudent, deleteStudent, getStudents, updateStudent } from "../api";
import { Student, StudentInput } from "../types";

interface StudentsPageProps {
  showToast: (message: string, type: "success" | "error" | "warning") => void;
}

interface TouchedFields {
  name: boolean;
  cpf: boolean;
  email: boolean;
}

interface FormErrors {
  name?: string;
  cpf?: string;
  email?: string;
}

const initialForm: StudentInput = {
  name: "",
  cpf: "",
  email: ""
};

const initialTouched: TouchedFields = {
  name: false,
  cpf: false,
  email: false
};

const onlyDigits = (value: string): string => value.replace(/\D/g, "");

const validateForm = (payload: StudentInput): FormErrors => {
  const errors: FormErrors = {};

  if (!payload.name) {
    errors.name = "Nome e obrigatorio.";
  } else if (payload.name.length < 3) {
    errors.name = "Nome deve ter ao menos 3 caracteres.";
  }

  if (!payload.cpf) {
    errors.cpf = "CPF e obrigatorio.";
  } else if (!/^\d{11}$/.test(payload.cpf)) {
    errors.cpf = "CPF deve conter 11 digitos numericos.";
  }

  if (!payload.email) {
    errors.email = "Email e obrigatorio.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    errors.email = "Email invalido.";
  }

  return errors;
};

const StudentsPage = ({ showToast }: StudentsPageProps): JSX.Element => {
  const [students, setStudents] = useState<Student[]>([]);
  const [form, setForm] = useState<StudentInput>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [touched, setTouched] = useState<TouchedFields>(initialTouched);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [cpfOnlyNumbersWarning, setCpfOnlyNumbersWarning] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const formTitle = useMemo(
    () => (editingId ? "Alterar aluno" : "Incluir aluno"),
    [editingId]
  );

  const loadStudents = async (): Promise<void> => {
    setIsLoading(true);

    try {
      const data = await getStudents();
      setStudents(data);
    } catch (loadError) {
      showToast((loadError as Error).message, "error");
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
    setTouched(initialTouched);
    setFormErrors({});
    setHasSubmitted(false);
    setCpfOnlyNumbersWarning(false);
  };

  const updateField = (field: keyof StudentInput, value: string): void => {
    const updatedForm = { ...form, [field]: value };
    setForm(updatedForm);

    if (hasSubmitted || touched[field]) {
      setFormErrors(validateForm(updatedForm));
    }
  };

  const markFieldTouched = (field: keyof StudentInput): void => {
    const updatedTouched = { ...touched, [field]: true };
    setTouched(updatedTouched);
    setFormErrors(validateForm(form));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setHasSubmitted(true);
    setIsSubmitting(true);

    const payload: StudentInput = {
      name: form.name.trim(),
      cpf: onlyDigits(form.cpf),
      email: form.email.trim().toLowerCase()
    };

    const validationErrors = validateForm(payload);
    setFormErrors(validationErrors);
    setTouched({ name: true, cpf: true, email: true });

    if (Object.keys(validationErrors).length > 0) {
      showToast("Revise os campos obrigatorios antes de enviar.", "warning");
      setIsSubmitting(false);
      return;
    }

    try {
      if (editingId) {
        await updateStudent(editingId, payload);
        showToast("Aluno alterado com sucesso.", "success");
      } else {
        await createStudent(payload);
        showToast("Aluno cadastrado com sucesso.", "success");
      }

      resetForm();
      await loadStudents();
    } catch (submitError) {
      showToast((submitError as Error).message, "error");
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
    setTouched(initialTouched);
    setFormErrors({});
    setHasSubmitted(false);
    setCpfOnlyNumbersWarning(false);
  };

  const handleRemove = async (student: Student): Promise<void> => {
    const confirmed = window.confirm(`Confirma a remocao do aluno ${student.name}?`);
    if (!confirmed) {
      return;
    }

    try {
      await deleteStudent(student.id);
      showToast("Aluno removido com sucesso.", "success");
      await loadStudents();
    } catch (deleteError) {
      showToast((deleteError as Error).message, "error");
    }
  };

  return (
    <section className="panel">
      <h1>Gerenciamento de alunos</h1>
      <p className="subtitle">Lista de alunos cadastrados com nome, CPF e email.</p>

      <form className="student-form" onSubmit={(event) => void handleSubmit(event)}>
        <h2>{formTitle}</h2>
        <label htmlFor="name">Nome</label>
        <input
          id="name"
          value={form.name}
          onChange={(event) => updateField("name", event.target.value)}
          onBlur={() => markFieldTouched("name")}
          required
          minLength={3}
          aria-invalid={Boolean((hasSubmitted || touched.name) && formErrors.name)}
          className={(hasSubmitted || touched.name) && formErrors.name ? "invalid" : ""}
        />
        {(hasSubmitted || touched.name) && formErrors.name ? (
          <p className="field-error">{formErrors.name}</p>
        ) : null}

        <label htmlFor="cpf">CPF</label>
        <input
          id="cpf"
          value={form.cpf}
          onChange={(event) => {
            const rawValue = event.target.value;
            const digits = onlyDigits(rawValue).slice(0, 11);
            setCpfOnlyNumbersWarning(rawValue !== digits);
            updateField("cpf", digits);
          }}
          onBlur={() => markFieldTouched("cpf")}
          required
          pattern="[0-9]{11}"
          title="Informe 11 digitos numericos"
          aria-invalid={Boolean((hasSubmitted || touched.cpf) && formErrors.cpf)}
          className={(hasSubmitted || touched.cpf) && formErrors.cpf ? "invalid" : ""}
        />
        {cpfOnlyNumbersWarning ? (
          <p className="field-warning">CPF so aceita numeros. Caracteres invalidos foram removidos.</p>
        ) : null}
        {(hasSubmitted || touched.cpf) && formErrors.cpf ? (
          <p className="field-error">{formErrors.cpf}</p>
        ) : null}

        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={form.email}
          onChange={(event) => updateField("email", event.target.value)}
          onBlur={() => markFieldTouched("email")}
          required
          aria-invalid={Boolean((hasSubmitted || touched.email) && formErrors.email)}
          className={(hasSubmitted || touched.email) && formErrors.email ? "invalid" : ""}
        />
        {(hasSubmitted || touched.email) && formErrors.email ? (
          <p className="field-error">{formErrors.email}</p>
        ) : null}

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
                      onClick={() => void handleRemove(student)}
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
  );
};

export default StudentsPage;