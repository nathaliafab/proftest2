import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  createClassroom,
  deleteClassroom,
  getClassroomById,
  getClassrooms,
  getStudents,
  updateClassroom,
  updateClassroomStudentEvaluations
} from "../api";
import { Classroom, ClassroomInput, EvaluationConcept, Student } from "../types";

interface ClassroomsPageProps {
  showToast: (message: string, type: "success" | "error" | "warning") => void;
}

const initialForm: ClassroomInput = {
  topic: "",
  year: new Date().getFullYear(),
  semester: 1,
  studentIds: []
};

const CLASS_GOALS = ["Requisitos", "Testes", "Documentacao", "BoasPraticas"];

const ClassroomsPage = ({ showToast }: ClassroomsPageProps): JSX.Element => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [form, setForm] = useState<ClassroomInput>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [savingCell, setSavingCell] = useState<string | null>(null);

  const formTitle = useMemo(
    () => (editingId ? "Alterar turma" : "Incluir turma"),
    [editingId]
  );

  const loadData = async (): Promise<void> => {
    setIsLoading(true);

    try {
      const [studentsResponse, classroomsResponse] = await Promise.all([getStudents(), getClassrooms()]);
      setStudents(studentsResponse);
      setClassrooms(classroomsResponse);

      if (classroomsResponse.length > 0) {
        const selectedId = selectedClassroom?.id ?? classroomsResponse[0].id;
        const classroom = await getClassroomById(selectedId);
        setSelectedClassroom(classroom);
      } else {
        setSelectedClassroom(null);
      }
    } catch (error) {
      showToast((error as Error).message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const resetForm = (): void => {
    setForm(initialForm);
    setEditingId(null);
  };

  const toggleStudent = (studentId: string): void => {
    setForm((prev) => {
      const alreadySelected = prev.studentIds.includes(studentId);
      return {
        ...prev,
        studentIds: alreadySelected
          ? prev.studentIds.filter((id) => id !== studentId)
          : [...prev.studentIds, studentId]
      };
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setIsSubmitting(true);

    const payload: ClassroomInput = {
      topic: form.topic.trim(),
      year: Number(form.year),
      semester: Number(form.semester),
      studentIds: form.studentIds
    };

    try {
      if (editingId) {
        const updated = await updateClassroom(editingId, payload);
        showToast("Turma alterada com sucesso.", "success");
        setSelectedClassroom(updated);
      } else {
        const created = await createClassroom(payload);
        showToast("Turma cadastrada com sucesso.", "success");
        setSelectedClassroom(created);
      }

      resetForm();
      const refreshed = await getClassrooms();
      setClassrooms(refreshed);
    } catch (error) {
      showToast((error as Error).message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (classroom: Classroom): void => {
    setEditingId(classroom.id);
    setForm({
      topic: classroom.topic,
      year: classroom.year,
      semester: classroom.semester,
      studentIds: classroom.students.map((student) => student.studentId)
    });
  };

  const handleDelete = async (classroom: Classroom): Promise<void> => {
    const confirmed = window.confirm(`Confirma a remocao da turma ${classroom.topic}?`);
    if (!confirmed) {
      return;
    }

    try {
      await deleteClassroom(classroom.id);
      showToast("Turma removida com sucesso.", "success");
      const refreshed = await getClassrooms();
      setClassrooms(refreshed);

      if (selectedClassroom?.id === classroom.id) {
        if (refreshed.length > 0) {
          setSelectedClassroom(await getClassroomById(refreshed[0].id));
        } else {
          setSelectedClassroom(null);
        }
      }
    } catch (error) {
      showToast((error as Error).message, "error");
    }
  };

  const handleSelectClassroom = async (classroomId: string): Promise<void> => {
    try {
      const classroom = await getClassroomById(classroomId);
      setSelectedClassroom(classroom);
    } catch (error) {
      showToast((error as Error).message, "error");
    }
  };

  const handleEvaluationUpdate = async (
    classroomId: string,
    studentId: string,
    goal: string,
    concept: EvaluationConcept
  ): Promise<void> => {
    if (!selectedClassroom) {
      return;
    }

    const targetStudent = selectedClassroom.students.find((student) => student.studentId === studentId);
    if (!targetStudent) {
      return;
    }

    const key = `${studentId}-${goal}`;
    const nextEvaluations = {
      ...targetStudent.evaluations,
      [goal]: concept
    };

    setSavingCell(key);

    try {
      const updatedClassroom = await updateClassroomStudentEvaluations(
        classroomId,
        studentId,
        nextEvaluations
      );
      setSelectedClassroom(updatedClassroom);
      setClassrooms((prev) => prev.map((item) => (item.id === updatedClassroom.id ? updatedClassroom : item)));
      showToast("Avaliacao da turma atualizada.", "success");
    } catch (error) {
      showToast((error as Error).message, "error");
    } finally {
      setSavingCell(null);
    }
  };

  return (
    <section className="panel">
      <h1>Gerenciamento de turmas</h1>
      <p className="subtitle">
        Inclua, altere e remova turmas com alunos matriculados e avaliacoes por turma.
      </p>

      <form className="student-form" onSubmit={(event) => void handleSubmit(event)}>
        <h2>{formTitle}</h2>

        <label htmlFor="topic">Topico</label>
        <input
          id="topic"
          value={form.topic}
          onChange={(event) => setForm({ ...form, topic: event.target.value })}
          required
          minLength={3}
        />

        <label htmlFor="year">Ano</label>
        <input
          id="year"
          type="number"
          value={form.year}
          min={2000}
          max={2100}
          onChange={(event) => setForm({ ...form, year: Number(event.target.value) })}
          required
        />

        <label htmlFor="semester">Semestre</label>
        <select
          id="semester"
          value={form.semester}
          onChange={(event) => setForm({ ...form, semester: Number(event.target.value) })}
        >
          <option value={1}>1</option>
          <option value={2}>2</option>
        </select>

        <fieldset className="students-fieldset">
          <legend>Alunos matriculados</legend>
          {students.length === 0 ? <p>Nenhum aluno disponivel para matricula.</p> : null}
          {students.map((student) => (
            <label key={student.id} className="checkbox-line">
              <input
                type="checkbox"
                checked={form.studentIds.includes(student.id)}
                onChange={() => toggleStudent(student.id)}
              />
              {student.name}
            </label>
          ))}
        </fieldset>

        <div className="actions">
          <button type="submit" disabled={isSubmitting}>
            {editingId ? "Salvar turma" : "Cadastrar turma"}
          </button>
          {editingId ? (
            <button type="button" className="ghost" onClick={resetForm}>
              Cancelar
            </button>
          ) : null}
        </div>
      </form>

      <section className="student-list-section" aria-label="Lista de turmas">
        <h2>Turmas cadastradas</h2>
        {isLoading ? <p>Carregando turmas...</p> : null}
        {!isLoading && classrooms.length === 0 ? <p>Nenhuma turma cadastrada.</p> : null}

        {!isLoading && classrooms.length > 0 ? (
          <table className="student-table">
            <thead>
              <tr>
                <th>Topico</th>
                <th>Ano</th>
                <th>Semestre</th>
                <th>Alunos</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {classrooms.map((classroom) => (
                <tr key={classroom.id}>
                  <td>{classroom.topic}</td>
                  <td>{classroom.year}</td>
                  <td>{classroom.semester}</td>
                  <td>{classroom.students.length}</td>
                  <td>
                    <button
                      type="button"
                      className="small"
                      onClick={() => void handleSelectClassroom(classroom.id)}
                    >
                      Ver detalhes
                    </button>
                    <button type="button" className="small" onClick={() => handleEdit(classroom)}>
                      Alterar
                    </button>
                    <button
                      type="button"
                      className="small danger"
                      onClick={() => void handleDelete(classroom)}
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

      {selectedClassroom ? (
        <section className="classroom-details" aria-label="Detalhes da turma selecionada">
          <h2>
            Turma selecionada: {selectedClassroom.topic} ({selectedClassroom.year}/{selectedClassroom.semester})
          </h2>

          {selectedClassroom.students.length === 0 ? (
            <p>Esta turma ainda nao possui alunos matriculados.</p>
          ) : (
            <div className="assessment-table-wrapper">
              <table className="student-table assessment-table">
                <thead>
                  <tr>
                    <th>Aluno</th>
                    {CLASS_GOALS.map((goal) => (
                      <th key={goal}>{goal}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedClassroom.students.map((student) => (
                    <tr key={student.studentId}>
                      <td>{student.studentName}</td>
                      {CLASS_GOALS.map((goal) => {
                        const value = (student.evaluations[goal] ?? "MANA") as EvaluationConcept;
                        const key = `${student.studentId}-${goal}`;

                        return (
                          <td key={key}>
                            <div className="assessment-cell">
                              <span className={`concept-badge ${value.toLowerCase()}`}>{value}</span>
                              <select
                                value={value}
                                disabled={savingCell === key}
                                onChange={(event) =>
                                  void handleEvaluationUpdate(
                                    selectedClassroom.id,
                                    student.studentId,
                                    goal,
                                    event.target.value as EvaluationConcept
                                  )
                                }
                              >
                                <option value="MANA">MANA</option>
                                <option value="MPA">MPA</option>
                                <option value="MA">MA</option>
                              </select>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}
    </section>
  );
};

export default ClassroomsPage;