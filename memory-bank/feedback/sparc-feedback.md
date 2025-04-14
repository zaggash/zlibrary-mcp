# SPARC Orchestrator Feedback
<!-- Entries below should be added reverse chronologically (newest first) -->
### [2025-04-14 13:58:13] Intervention: User Feedback on Task Delegation (Attempt 2)
- **Trigger**: User denied `new_task` for `spec-pseudocode` (PDF Processing Spec) again.
- **Context**: SPARC delegated task with instruction to read architecture doc, but missed requirements for output.
- **Action Taken**: Logged feedback. Will re-delegate task with explicit instructions to (1) write output to `docs/pdf-processing-implementation-spec.md` and (2) include the full content in the `attempt_completion` result.
- **Rationale**: Ensure `spec-pseudocode` mode produces the required artifacts in the specified locations and formats.
- **Outcome**: Task re-delegated with corrected instructions.
- **Follow-up**: Monitor `spec-pseudocode` execution.
### [2025-04-14 13:57:07] Intervention: User Feedback on Task Delegation
- **Trigger**: User denied `new_task` for `spec-pseudocode` (PDF Processing Spec).
- **Context**: SPARC attempted to delegate spec creation without explicitly instructing the mode to read the existing architecture document.
- **Action Taken**: Logged feedback. Will re-delegate task with explicit instruction to read `docs/architecture/pdf-processing-integration.md`.
- **Rationale**: Ensure `spec-pseudocode` mode has full context from the `architect` mode's output before generating its own artifacts.
- **Outcome**: Task re-delegated with corrected instructions.
- **Follow-up**: Monitor `spec-pseudocode` execution.