// Who may read cross-user data (the analytics GET routes). The list comes
// from the ADMIN_EMAILS env var, comma-separated. Unset means nobody.

export function isAdmin(
  email: string | null | undefined,
  list: string | undefined = process.env.ADMIN_EMAILS
): boolean {
  if (!email || !list) return false;
  const wanted = email.trim().toLowerCase();
  return list
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(wanted);
}
