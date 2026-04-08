import type { Bathroom } from '~/types'

const loginOpen = ref(false)
const registerOpen = ref(false)
const bathroomDetailOpen = ref(false)
const bathroomFormOpen = ref(false)
const selectedBathroom = ref<Bathroom | null>(null)
const editingBathroom = ref<Bathroom | null>(null)

export const useAppModals = () => {
  const openLogin = () => {
    registerOpen.value = false
    loginOpen.value = true
  }

  const openRegister = () => {
    loginOpen.value = false
    registerOpen.value = true
  }

  const openBathroomDetail = (bathroom: Bathroom) => {
    selectedBathroom.value = bathroom
    bathroomDetailOpen.value = true
  }

  // Si se pasa un baño, el form abre en modo edit (pre-rellenado).
  // Si no, abre en modo create.
  const openBathroomForm = (editing?: Bathroom) => {
    editingBathroom.value = editing ?? null
    bathroomFormOpen.value = true
  }

  const closeAll = () => {
    loginOpen.value = false
    registerOpen.value = false
    bathroomDetailOpen.value = false
    bathroomFormOpen.value = false
    editingBathroom.value = null
  }

  return {
    loginOpen,
    registerOpen,
    bathroomDetailOpen,
    bathroomFormOpen,
    selectedBathroom,
    editingBathroom,
    openLogin,
    openRegister,
    openBathroomDetail,
    openBathroomForm,
    closeAll,
  }
}
