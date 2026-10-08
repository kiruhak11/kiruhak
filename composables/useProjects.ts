import { ref, readonly } from "vue";
import type { AdminProjectCaseStudy, ProjectFormInput, ProjectOwnershipType, PublicProjectCaseStudy } from "~/types/project-case-study";

export interface PublicProject {
  id: string;
  title: string;
  description: string;
  shortDescription?: string;
  image: string;
  technologies: string[];
  category: string;
  client?: string | null;
  duration?: string | null;
  budget?: string | null;
  features?: string[];
  challenges?: string | null;
  solutions?: string | null;
  results?: string | null;
  featured: boolean;
  order: number;
  liveUrl?: string;
  githubUrl?: string;
  caseStudy?: PublicProjectCaseStudy;
  createdAt: string;
  updatedAt: string;
}

export interface AdminProject extends PublicProject {
  ownershipType: ProjectOwnershipType;
  projectSummary: string | null;
  role: string | null;
  company: string | null;
  responsibilities: string[];
  technicalHighlights: string[];
  caseStudy?: AdminProjectCaseStudy;
}

/** @deprecated Use PublicProject or AdminProject explicitly. */
export type Project = PublicProject;

export const useProjects = () => {
  const projects = ref<Project[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const { getAuthHeaders } = useApi();

  const fetchProjects = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await $fetch<Project[]>("/api/projects");
      projects.value = response;
    } catch (err) {
      error.value = "Ошибка при загрузке проектов";
      console.error("Error fetching projects:", err);
    } finally {
      loading.value = false;
    }
  };

  const fetchAdminProjects = async () => {
    loading.value = true;
    error.value = null;
    try {
      projects.value = await $fetch<AdminProject[]>("/api/admin/projects", { headers: getAuthHeaders() }) as unknown as Project[];
    } catch (err) {
      error.value = "Ошибка при загрузке проектов";
      console.error("Error fetching admin projects:", err);
    } finally {
      loading.value = false;
    }
  };

  const fetchProject = async (id: string) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await $fetch(`/api/projects/${id}`);
      return response;
    } catch (err) {
      error.value = "Ошибка при загрузке проекта";
      console.error("Error fetching project:", err);
      return null;
    } finally {
      loading.value = false;
    }
  };

  const createProject = async (
    projectData: ProjectFormInput
  ) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await $fetch("/api/projects", {
        method: "POST",
        body: projectData,
        headers: getAuthHeaders(),
      });
      await fetchAdminProjects();
      return response;
    } catch (err) {
      console.error("Error creating project:", err);

      // Проверяем тип ошибки
      if (err.status === 401) {
        error.value = "Ошибка аутентификации. Пожалуйста, войдите в систему.";
      } else if (err.status === 403) {
        error.value = "Недостаточно прав для создания проекта.";
      } else {
        error.value = "Ошибка при создании проекта";
      }

      return null;
    } finally {
      loading.value = false;
    }
  };

  const updateProject = async (id: string, projectData: Partial<ProjectFormInput>) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await $fetch(`/api/projects/${id}`, {
        method: "PUT",
        body: projectData,
        headers: getAuthHeaders(),
      });
      await fetchAdminProjects();
      return response;
    } catch (err) {
      console.error("Error updating project:", err);

      // Проверяем тип ошибки
      if (err.status === 401) {
        error.value = "Ошибка аутентификации. Пожалуйста, войдите в систему.";
      } else if (err.status === 403) {
        error.value = "Недостаточно прав для обновления проекта.";
      } else {
        error.value = "Ошибка при обновлении проекта";
      }

      return null;
    } finally {
      loading.value = false;
    }
  };

  const deleteProject = async (id: string) => {
    loading.value = true;
    error.value = null;

    try {
      await $fetch(`/api/projects/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      await fetchAdminProjects();
      return true;
    } catch (err) {
      console.error("Error deleting project:", err);

      // Проверяем тип ошибки
      if (err.status === 401) {
        error.value = "Ошибка аутентификации. Пожалуйста, войдите в систему.";
      } else if (err.status === 403) {
        error.value = "Недостаточно прав для удаления проекта.";
      } else {
        error.value = "Ошибка при удалении проекта";
      }

      return false;
    } finally {
      loading.value = false;
    }
  };

  return {
    projects: readonly(projects),
    loading: readonly(loading),
    error: readonly(error),
    fetchProjects,
    fetchAdminProjects,
    fetchProject,
    createProject,
    updateProject,
    deleteProject,
  };
};
