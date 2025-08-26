import { ref, readonly } from 'vue'

interface Project {
  id: string
  title: string
  description: string
  image: string
  technologies: string[]
  category: string
  featured: boolean
  order: number
  liveUrl?: string
  githubUrl?: string
  createdAt: string
  updatedAt: string
}

export const useProjects = () => {
  const projects = ref<Project[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchProjects = async () => {
    loading.value = true
    error.value = null
    
    try {
      const response = await $fetch('/api/projects')
      projects.value = response
    } catch (err) {
      error.value = 'Ошибка при загрузке проектов'
      console.error('Error fetching projects:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchProject = async (id: string) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await $fetch(`/api/projects/${id}`)
      return response
    } catch (err) {
      error.value = 'Ошибка при загрузке проекта'
      console.error('Error fetching project:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  const createProject = async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await $fetch('/api/projects', {
        method: 'POST',
        body: projectData
      })
      await fetchProjects() // Обновляем список
      return response
    } catch (err) {
      error.value = 'Ошибка при создании проекта'
      console.error('Error creating project:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  const updateProject = async (id: string, projectData: Partial<Project>) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await $fetch(`/api/projects/${id}`, {
        method: 'PUT',
        body: projectData
      })
      await fetchProjects() // Обновляем список
      return response
    } catch (err) {
      error.value = 'Ошибка при обновлении проекта'
      console.error('Error updating project:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  const deleteProject = async (id: string) => {
    loading.value = true
    error.value = null
    
    try {
      await $fetch(`/api/projects/${id}`, {
        method: 'DELETE'
      })
      await fetchProjects() // Обновляем список
      return true
    } catch (err) {
      error.value = 'Ошибка при удалении проекта'
      console.error('Error deleting project:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    projects: readonly(projects),
    loading: readonly(loading),
    error: readonly(error),
    fetchProjects,
    fetchProject,
    createProject,
    updateProject,
    deleteProject
  }
}



