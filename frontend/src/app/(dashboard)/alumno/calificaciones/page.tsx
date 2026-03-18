import { redirect } from "next/navigation";

// This page is deprecated. Exam results are now shown at /alumno/examenes.
export default function CalificacionesPage() {
  redirect("/alumno/examenes");
}
