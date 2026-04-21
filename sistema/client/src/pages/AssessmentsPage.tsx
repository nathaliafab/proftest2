import { useEffect, useMemo, useState } from "react";
import { getClassrooms, getStudents, updateClassroomStudentEvaluations } from "../api";
import { Classroom, EvaluationConcept, Student } from "../types";

interface AssessmentsPageProps {
  showToast: (message: string, type: "success" | "error" | "warning") => void;
}

const AssessmentsPage = ({ showToast }: AssessmentsPageProps): JSX.Element => {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [savingCell, setSavingCell] = useState<string | null>(null);
  const [studentFilter, setStudentFilter] = useState<string>("");
  const [classroomFilter, setClassroomFilter] = useState<string>("");
  const [goalFilter, setGoalFilter] = useState<string>("");
  const [conceptFilter, setConceptFilter] = useState<"ALL" | EvaluationConcept>("ALL");
  const [sortBy, setSortBy] = useState<string>("studentName");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const goals = ["Requisitos", "Testes", "Documentacao", "BoasPraticas"] as const;
  const concepts: EvaluationConcept[] = ["MANA", "MPA", "MA"];
  const noClassroomFilterValue = "__NO_CLASSROOM__";

  const conceptRank: Record<EvaluationConcept, number> = {
    MANA: 0,
    MPA: 1,
    MA: 2
  };

  const visibleRows = useMemo(() => {
    const assignedStudentIds = new Set(
      classrooms.flatMap((classroom) => classroom.students.map((student) => student.studentId))
    );

    const enrolledRows = classrooms.flatMap((classroom) =>
      classroom.students.map((student) => ({
        classroomId: classroom.id,
        classroomName: `${classroom.topic} (${classroom.year}/${classroom.semester})`,
        studentId: student.studentId,
        studentName: student.studentName,
        evaluations: student.evaluations,
        canEdit: true
      }))
    );

    const unassignedRows = students
      .filter((student) => !assignedStudentIds.has(student.id))
      .map((student) => ({
        classroomId: null,
        classroomName: "-",
        studentId: student.id,
        studentName: student.name,
        evaluations: student.evaluations,
        canEdit: false
      }));

    let rows = [...enrolledRows, ...unassignedRows];

    if (classroomFilter === noClassroomFilterValue) {
      rows = rows.filter((row) => !row.classroomId);
    } else if (classroomFilter) {
      rows = rows.filter((row) => row.classroomId === classroomFilter);
    }

    if (studentFilter.trim()) {
      const normalizedFilter = studentFilter.trim().toLowerCase();
      rows = rows.filter((row) => row.studentName.toLowerCase().includes(normalizedFilter));
    }

    if (goalFilter && conceptFilter !== "ALL") {
      rows = rows.filter((row) => row.evaluations[goalFilter] === conceptFilter);
    }

    rows.sort((a, b) => {
      let comparison = 0;

      if (sortBy === "studentName") {
        comparison = a.studentName.localeCompare(b.studentName);
      } else if (sortBy === "classroomName") {
        comparison = a.classroomName.localeCompare(b.classroomName);
      } else {
        const aValue = a.evaluations[sortBy] ?? "MANA";
        const bValue = b.evaluations[sortBy] ?? "MANA";
        comparison = conceptRank[aValue] - conceptRank[bValue];

        if (comparison === 0) {
          comparison = a.studentName.localeCompare(b.studentName);
        }
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return rows;
  }, [
    classroomFilter,
    classrooms,
    conceptFilter,
    goalFilter,
    noClassroomFilterValue,
    sortBy,
    sortDirection,
    studentFilter,
    students
  ]);

  const totalRows = useMemo(() => {
    const assignedStudentIds = new Set(
      classrooms.flatMap((classroom) => classroom.students.map((student) => student.studentId))
    );
    const enrolledCount = classrooms.reduce((acc, classroom) => acc + classroom.students.length, 0);
    const unassignedCount = students.filter((student) => !assignedStudentIds.has(student.id)).length;
    return enrolledCount + unassignedCount;
  }, [classrooms, students]);

  const loadData = async (): Promise<void> => {
    setIsLoading(true);

    try {
      const [classroomsResponse, studentsResponse] = await Promise.all([getClassrooms(), getStudents()]);
      setClassrooms(classroomsResponse);
      setStudents(studentsResponse);
    } catch (error) {
      showToast((error as Error).message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const updateConcept = async (
    classroomId: string | null,
    studentId: string,
    goal: string,
    concept: EvaluationConcept
  ): Promise<void> => {
    if (!classroomId) {
      return;
    }

    const row = visibleRows.find(
      (item) => item.classroomId === classroomId && item.studentId === studentId
    );
    if (!row) {
      return;
    }

    const key = `${classroomId}-${studentId}-${goal}`;
    const nextEvaluations = {
      ...row.evaluations,
      [goal]: concept
    };

    setSavingCell(key);

    try {
      const updatedClassroom = await updateClassroomStudentEvaluations(
        classroomId,
        studentId,
        nextEvaluations
      );
      setClassrooms((prev) =>
        prev.map((item) => (item.id === updatedClassroom.id ? updatedClassroom : item))
      );
      showToast("Avaliacao atualizada.", "success");
    } catch (error) {
      showToast((error as Error).message, "error");
    } finally {
      setSavingCell(null);
    }
  };

  return (
    <section className="panel">
      <h1>Gerenciamento de avaliacoes</h1>
      <p className="subtitle">
        Tabela de metas por aluno e turma com conceitos MANA, MPA e MA.
      </p>

      <section className="assessment-legend" aria-label="Legenda de conceitos">
        <strong>Legenda:</strong>
        <span className="concept-badge mana">MANA</span>
        <span className="legend-text">Meta Ainda Nao Atingida</span>
        <span className="concept-badge mpa">MPA</span>
        <span className="legend-text">Meta Parcialmente Atingida</span>
        <span className="concept-badge ma">MA</span>
        <span className="legend-text">Meta Atingida</span>
      </section>

      {!isLoading ? (
        <section className="assessment-controls" aria-label="Controles da tabela de avaliacoes">
          <div className="assessment-control">
            <label htmlFor="classroomFilter">Filtrar por turma</label>
            <select
              id="classroomFilter"
              value={classroomFilter}
              onChange={(event) => setClassroomFilter(event.target.value)}
            >
              <option value="">Todas as turmas</option>
              <option value={noClassroomFilterValue}>Sem turma</option>
              {classrooms.map((classroom) => (
                <option key={classroom.id} value={classroom.id}>
                  {classroom.topic} ({classroom.year}/{classroom.semester})
                </option>
              ))}
            </select>
          </div>

          <div className="assessment-control">
            <label htmlFor="studentFilter">Filtrar por aluno</label>
            <input
              id="studentFilter"
              value={studentFilter}
              onChange={(event) => setStudentFilter(event.target.value)}
              placeholder="Digite o nome do aluno"
            />
          </div>

          <div className="assessment-control">
            <label htmlFor="goalFilter">Filtrar por meta</label>
            <select
              id="goalFilter"
              value={goalFilter}
              onChange={(event) => {
                const goal = event.target.value;
                setGoalFilter(goal);
                if (!goal) {
                  setConceptFilter("ALL");
                }
              }}
            >
              <option value="">Todas as metas</option>
              {goals.map((goal) => (
                <option key={goal} value={goal}>
                  {goal}
                </option>
              ))}
            </select>
          </div>

          <div className="assessment-control">
            <label htmlFor="conceptFilter">Conceito</label>
            <select
              id="conceptFilter"
              value={conceptFilter}
              onChange={(event) => setConceptFilter(event.target.value as "ALL" | EvaluationConcept)}
              disabled={!goalFilter}
            >
              <option value="ALL">Todos</option>
              {concepts.map((concept) => (
                <option key={concept} value={concept}>
                  {concept}
                </option>
              ))}
            </select>
          </div>

          <div className="assessment-control">
            <label htmlFor="sortBy">Ordenar por</label>
            <select id="sortBy" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="studentName">Aluno</option>
              <option value="classroomName">Turma</option>
              {goals.map((goal) => (
                <option key={goal} value={goal}>
                  {goal}
                </option>
              ))}
            </select>
          </div>

          <div className="assessment-control">
            <label htmlFor="sortDirection">Ordem</label>
            <select
              id="sortDirection"
              value={sortDirection}
              onChange={(event) => setSortDirection(event.target.value as "asc" | "desc")}
            >
              <option value="asc">Crescente</option>
              <option value="desc">Decrescente</option>
            </select>
          </div>
        </section>
      ) : null}

      {isLoading ? <p>Carregando avaliacoes...</p> : null}

      {!isLoading && totalRows === 0 ? (
        <p>Matricule alunos em turmas para iniciar as avaliacoes.</p>
      ) : null}

      {!isLoading && totalRows > 0 && visibleRows.length === 0 ? (
        <p>Nenhum aluno corresponde aos filtros selecionados.</p>
      ) : null}

      {!isLoading && visibleRows.length > 0 ? (
        <div className="assessment-table-wrapper">
          <table className="student-table assessment-table">
            <thead>
              <tr>
                <th>Turma</th>
                <th>Aluno</th>
                {goals.map((goal) => (
                  <th key={goal}>{goal}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={`${row.classroomId}-${row.studentId}`}>
                  <td>{row.classroomName}</td>
                  <td>{row.studentName}</td>
                  {goals.map((goal) => {
                    const value = (row.evaluations[goal] ?? "MANA") as EvaluationConcept;
                    const key = `${row.classroomId}-${row.studentId}-${goal}`;

                    return (
                      <td key={key}>
                        <div className="assessment-cell">
                          <span className={`concept-badge ${value.toLowerCase()}`}>{value}</span>
                          <select
                            value={value}
                                disabled={savingCell === key || !row.canEdit}
                            onChange={(event) =>
                              void updateConcept(
                                row.classroomId,
                                row.studentId,
                                goal,
                                event.target.value as EvaluationConcept
                              )
                            }
                          >
                            {concepts.map((concept) => (
                              <option key={concept} value={concept}>
                                {concept}
                              </option>
                            ))}
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
      ) : null}
    </section>
  );
};

export default AssessmentsPage;