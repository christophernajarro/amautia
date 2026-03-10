export const ROLES = {
  SUPERADMIN: "superadmin",
  PROFESOR: "profesor",
  ALUMNO: "alumno",
} as const;

export const ROLE_ROUTES: Record<string, string> = {
  superadmin: "/admin",
  profesor: "/profesor",
  alumno: "/alumno",
};

export const ROLE_LABELS: Record<string, string> = {
  superadmin: "Administrador",
  profesor: "Profesor",
  alumno: "Alumno",
};

export const TEST_USERS = [
  { label: "Admin", email: "admin@amautia.com", password: "admin123", role: "superadmin" },
  { label: "Profesor", email: "profesor@amautia.com", password: "profesor123", role: "profesor" },
  { label: "Alumno", email: "alumno@amautia.com", password: "alumno123", role: "alumno" },
];

export const PLAN_FEATURES = {
  gratis: { corrections: 5, generations: 2, students: 20, subjects: 2 },
  basico: { corrections: 50, generations: 20, students: 100, subjects: 5 },
  pro: { corrections: 300, generations: "Ilimitado", students: 500, subjects: "Ilimitado" },
  enterprise: { corrections: "Ilimitado", generations: "Ilimitado", students: "Ilimitado", subjects: "Ilimitado" },
};
