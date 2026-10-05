# Portfolio case-study content model

The current `Project` record predates the portfolio's authorship and case-study needs. It stores product copy, challenges, implementation notes, feature names, technologies, links, budget, and an unreferenced `results` string. It does not explicitly store project authorship type, Kirill's role, his individual responsibilities, or evidence for outcomes.

Do not infer `own` versus `participation` from the client name or repository owner. Confirm authorship and scope with Kirill for every record before publishing those labels. The current record also has no explicit developer role, so role labels must wait for that confirmation.

When enough cases are ready, add one optional structured `caseStudy` object rather than many unrelated nullable columns:

```ts
type ProjectCaseStudy = {
  projectType: "own" | "participation";
  productSummary: string;
  role?: string;
  responsibilities: string[];
  technicalHighlights: string[];
  outcome?: { summary: string; evidenceUrl?: string };
  disclosure: "public" | "nda";
};
```

Validate the object at the API boundary and add it through a reviewed Prisma migration only after the project classifications and contributions are confirmed. For NDA cases, publish only approved summary details and omit sensitive links or evidence. Until then, the public UI separates current product summary, task, implementation notes, and stack, and omits the legacy unsubstantiated `results` field.
