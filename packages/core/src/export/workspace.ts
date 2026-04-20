import { z } from "zod";
import { Graph } from "../schema/index.js";

export const WORKSPACE_FILE_VERSION = 1;
export const WORKSPACE_FILE_KIND = "qi-studio.workspace";

export const WorkspaceFile = z.object({
  kind: z.literal(WORKSPACE_FILE_KIND),
  version: z.literal(WORKSPACE_FILE_VERSION),
  exportedAt: z.string(),
  workspaceName: z.string().optional(),
  prompt: z.string().optional(),
  graph: Graph,
});
export type WorkspaceFile = z.infer<typeof WorkspaceFile>;

export type SerializeWorkspaceArgs = {
  graph: Graph;
  workspaceName?: string;
  prompt?: string;
};

export const serializeWorkspace = ({
  graph,
  workspaceName,
  prompt,
}: SerializeWorkspaceArgs): WorkspaceFile => ({
  kind: WORKSPACE_FILE_KIND,
  version: WORKSPACE_FILE_VERSION,
  exportedAt: new Date().toISOString(),
  ...(workspaceName ? { workspaceName } : {}),
  ...(prompt ? { prompt } : {}),
  graph,
});

export class WorkspaceImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkspaceImportError";
  }
}

export const parseWorkspace = (text: string): WorkspaceFile => {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch (err) {
    throw new WorkspaceImportError(
      `File is not valid JSON: ${(err as Error).message}`
    );
  }
  const result = WorkspaceFile.safeParse(json);
  if (!result.success) {
    throw new WorkspaceImportError(
      `File does not match Qi Studio workspace schema: ${result.error.issues
        .slice(0, 3)
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ")}`
    );
  }
  return result.data;
};
