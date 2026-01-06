import { ref, readonly } from "vue";

interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
  technologies: string[];
  category: string;
  featured: boolean;
  order: number;
  liveUrl?: string;
  githubUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export const useProjects = () => {
  const projects = ref<Project[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const { getAuthHeaders } = useApi();

  const fetchProjects = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await $fetch("/api/projects");
      projects.value = response;
    } catch (err) {
      error.value = "Ошибка при загрузке проектов";
      console.error("Error fetching projects:", err);
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
    projectData: Omit<Project, "id" | "createdAt" | "updatedAt">
  ) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await $fetch("/api/projects", {
        method: "POST",
        body: projectData,
        headers: getAuthHeaders(),
      });
      await fetchProjects(); // Обновляем список
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

  const updateProject = async (id: string, projectData: Partial<Project>) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await $fetch(`/api/projects/${id}`, {
        method: "PUT",
        body: projectData,
        headers: getAuthHeaders(),
      });
      await fetchProjects(); // Обновляем список
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
      await fetchProjects(); // Обновляем список
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
    fetchProject,
    createProject,
    updateProject,
    deleteProject,
  };
};
