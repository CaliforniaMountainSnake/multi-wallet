export interface ModalState {
    isModalShown: boolean;
}

export interface HasModal {
    showModal: () => void;
    hideModal: () => void;
    setState: (state: ModalState) => void;
}
