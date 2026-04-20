import type { Bathroom } from '~/types'

export const useAppModals = () => {
  const loginOpen = useState('modal-login', () => false)
  const registerOpen = useState('modal-register', () => false)
  const bathroomDetailOpen = useState('modal-bathroom-detail', () => false)
  const bathroomFormOpen = useState('modal-bathroom-form', () => false)
  const selectedBathroom = useState<Bathroom | null>('modal-selected-bathroom', () => null)
  const editingBathroom = useState<Bathroom | null>('modal-editing-bathroom', () => null)

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
