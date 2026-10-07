const authorizationError = (statusCode: number, statusMessage: string) => Object.assign(new Error(statusMessage), { statusCode, statusMessage });

export function requireAdmin(user: { isAdmin?: boolean } | null | undefined) {
  if (!user) throw authorizationError(401, "Unauthorized");
  if (!user.isAdmin) throw authorizationError(403, "Admin access required");
  return user;
}
