-- Internal/company projects: projects.client_id was already nullable at
-- the DB level, but the app layer (project creation form) forced it
-- required, so there was never a way to create a project scoped to the
-- company itself rather than a client. Adds a department on both
-- projects and tasks so an internal project can be assigned to a
-- department, and its tasks inherit that department for workspace-level
-- filtering (a task created under a project copies the project's
-- department at creation time -- not a live foreign key, since a task's
-- department shouldn't silently change if the project is reassigned
-- later).

ALTER TABLE public.projects
    ADD COLUMN IF NOT EXISTS department TEXT;

ALTER TABLE public.tasks
    ADD COLUMN IF NOT EXISTS department TEXT;

CREATE INDEX IF NOT EXISTS idx_projects_department ON public.projects(department) WHERE department IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_department ON public.tasks(department) WHERE department IS NOT NULL;
