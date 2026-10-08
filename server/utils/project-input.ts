import { isUsableProjectPreview } from "../../utils/project-links";

const projectInputError = (statusCode: number, statusMessage: string) => Object.assign(new Error(statusMessage), { statusCode, statusMessage });

const ownershipTypes = ["OWN", "CLIENT", "PARTICIPATION", "UNVERIFIED"] as const;
const validExternalUrl = (value: unknown): value is string => {
  if (value === "" || value == null) return true;
  if (typeof value !== "string") return false;
  try { return ["http:", "https:"].includes(new URL(value).protocol); } catch { return false; }
};
const cleanText = (value: unknown) => typeof value === "string" ? value.trim() : "";
const cleanList = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean) : [];

export function parseProjectInput(body: unknown, partial = false) {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw projectInputError(400, "Invalid project payload");
  const input = body as Record<string, unknown>;
  const type = input.ownershipType;
  if (type !== undefined && !ownershipTypes.includes(type as typeof ownershipTypes[number])) throw projectInputError(400, "ownershipType must be OWN, CLIENT, PARTICIPATION, or UNVERIFIED");
  const ownershipType = (type ?? "UNVERIFIED") as typeof ownershipTypes[number];
  const fields = ["title", "shortDescription", "description", "image", "category"] as const;
  const projectSummary = cleanText(input.projectSummary);
  if (!partial && ["title", "image", "category"].some((key) => !cleanText(input[key]))) throw projectInputError(400, "Required project fields are missing");
  if (!validExternalUrl(input.liveUrl) || !validExternalUrl(input.githubUrl)) throw projectInputError(400, "Links must use http or https");

  const responsibilities = cleanList(input.responsibilities);
  const technologies = cleanList(input.technologies);
  const role = cleanText(input.role);
  if (ownershipType === "OWN" && (!projectSummary || !role || !responsibilities.length || !technologies.length)) throw projectInputError(400, "Own projects require summary, role, responsibilities, and technologies");
  if ((ownershipType === "CLIENT" || ownershipType === "PARTICIPATION") && (!projectSummary || !role || !responsibilities.length)) {
    throw projectInputError(400, `${ownershipType} projects require summary, role, and responsibilities`);
  }

  const data: Record<string, unknown> = {};
  for (const key of fields) if (input[key] !== undefined) data[key] = cleanText(input[key]);
  if (!partial) {
    const fallbackDescription = projectSummary || "Описание проекта уточняется.";
    if (data.description === undefined) data.description = fallbackDescription;
    if (data.shortDescription === undefined) data.shortDescription = fallbackDescription;
  }
  if (input.image !== undefined && (typeof input.image !== "string" || !isUsableProjectPreview(input.image))) throw projectInputError(400, "Preview must be a safe first-party path or external http(s) URL");
  if (input.ownershipType !== undefined || !partial) data.ownershipType = ownershipType;
  if (input.projectSummary !== undefined || !partial) data.projectSummary = projectSummary;
  for (const key of ["role", "company"] as const) if (input[key] !== undefined || !partial) data[key] = cleanText(input[key]) || null;
  for (const key of ["responsibilities", "technicalHighlights", "technologies"] as const) if (input[key] !== undefined || !partial) data[key] = cleanList(input[key]);
  for (const key of ["liveUrl", "githubUrl"] as const) if (input[key] !== undefined || !partial) data[key] = cleanText(input[key]) || null;
  if (input.featured !== undefined) data.featured = input.featured === true;
  if ((input.ownershipType !== undefined || !partial) && ownershipType === "UNVERIFIED") data.featured = false;
  if (input.order !== undefined) {
    const order = Number(input.order);
    if (!Number.isInteger(order) || order < 0) throw projectInputError(400, "Order must be a non-negative integer");
    data.order = order;
  }
  return data;
}
