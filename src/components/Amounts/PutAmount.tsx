import React, {ReactNode, useEffect, useState} from "react";
import {Button, Form, Modal} from "react-bootstrap";
import {ButtonProps} from "react-bootstrap/Button";
import useThrowAsync from "../../hooks/useThrowAsync";
import {DoublyLinkedListRepository} from "../../repositories/DoublyLinkedListRepository";
import {Amount, CurrencyInfo} from "../../repositories/WalletRepository";
import {InitialData, RequireStrings, validate, ValidationErrors, validator} from "../../validation/Validator";
import {CurrencySelect} from "../Utils/CurrencySelect";

type FormData = RequireStrings<Amount, "enabled" | "prevNodeKey" | "nextNodeKey">

type FormErrors = ValidationErrors<FormData, "enabled" | "prevNodeKey" | "nextNodeKey">

type InitialFormData = InitialData<{
    amount: Amount,
    amountId: number
}>

interface ModalProps {
    modalTitle: string,
    buttonText: { main: ReactNode, modal: string },
    buttonProps: Omit<ButtonProps, "onClick" | "children">
    flushOnHide: boolean,
}

interface Props extends InitialFormData, ModalProps {
    amountRepository: DoublyLinkedListRepository<Amount>,
    exchangeRates: Map<string, CurrencyInfo>,
    onChange: () => void,
}

interface FormState extends FormData, FormErrors {
}

export function PutAmount(props: Props): JSX.Element {
    const {throwAsync} = useThrowAsync();
    const [isModalShown, setModalShown] = useState<boolean>(false);
    const hideModal = () => setModalShown(false);
    const showModal = () => setModalShown(true);

    const initialFormState: FormState = {
        amount: props.initialAmount?.amount.toString() ?? "",
        symbol: props.initialAmount?.symbol ?? "",
        comment: props.initialAmount?.comment ?? "",
        enabled: props.initialAmount?.enabled ?? true,
        prevNodeKey: props.initialAmount?.prevNodeKey ?? props.amountRepository.store.nullishKey,
        nextNodeKey: props.initialAmount?.nextNodeKey ?? props.amountRepository.store.nullishKey,
        amountError: undefined,
        symbolError: undefined,
        commentError: undefined,
    };
    const [formState, setFormState] = useState<FormState>(initialFormState);

    useEffect(() => {
        // Loading currency symbol when exchange rates are ready.
        if (!props.initialAmount?.symbol
            && formState.symbol === initialFormState.symbol
            && props.exchangeRates.size !== 0) {
            setFormState(prevState => ({
                ...prevState,
                symbol: props.exchangeRates.keys().next().value,
            }));
        }
    }, [props.exchangeRates]);

    const idPrefix = `${PutAmount.name}_`;
    const ids = {
        amount: `${idPrefix}amount`,
        symbol: `${idPrefix}symbol`,
        comment: `${idPrefix}comment`,
    };

    const handleFormSubmit = (event: React.FormEvent): void => {
        event.preventDefault();
        validate({
            amount: validator.amount(formState.amount),
            symbol: validator.symbol(formState.symbol, props.exchangeRates),
            comment: validator.comment(formState.comment),
        }, validatedData => {
            throwAsync(async () => {
                const amount: Amount = Object.assign({
                    enabled: formState.enabled,
                    prevNodeKey: formState.prevNodeKey,
                    nextNodeKey: formState.nextNodeKey,
                }, validatedData);
                const key = await props.amountRepository.put(amount, props.initialAmountId);
                setFormState(initialFormState);
                setModalShown(false);
                props.onChange();
                console.debug("Put amount with key:", key);
            });
        }, validationErrors => setFormState(prevState => ({
            ...prevState,
            ...validationErrors,
        })));
    };

    const handleFormChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        const value: string = event.target.value;
        switch (event.target.id) {
            case ids.amount:
                setFormState(prevState => ({
                    ...prevState,
                    amount: value,
                    amountError: undefined,
                }));
                break;
            case ids.symbol:
                setFormState(prevState => ({
                    ...prevState,
                    symbol: value,
                    symbolError: undefined,
                }));
                break;
            case ids.comment:
                setFormState(prevState => ({
                    ...prevState,
                    comment: value,
                    commentError: undefined,
                }));
                break;
        }
    };

    return <>
        <Modal show={isModalShown}
               backdrop={"static"} keyboard={false}
               centered={true}
               onHide={hideModal}>
            <Modal.Header closeButton>
                <Modal.Title>{props.modalTitle}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleFormSubmit}>
                    <Form.Group className={"mb-3"} controlId={ids.amount}>
                        <Form.Label>Amount:</Form.Label>
                        <Form.Control type="number"
                                      placeholder="Enter amount"
                                      isInvalid={formState.amountError !== undefined}
                                      value={formState.amount} onChange={handleFormChange}/>
                        <Form.Control.Feedback type={"invalid"}>
                            {formState.amountError?.message}
                        </Form.Control.Feedback>
                    </Form.Group>
                    <Form.Group className={"mb-3"} controlId={ids.symbol}>
                        <Form.Label>Currency:</Form.Label>
                        <CurrencySelect isInvalid={formState.symbolError !== undefined}
                                        exchangeRates={props.exchangeRates}
                                        value={formState.symbol} onChange={handleFormChange}/>
                        <Form.Control.Feedback type={"invalid"}>
                            {formState.symbolError?.message}
                        </Form.Control.Feedback>
                    </Form.Group>
                    <Form.Group className={"mb-3"} controlId={ids.comment}>
                        <Form.Label>Comment:</Form.Label>
                        <Form.Control type="text"
                                      as={"textarea"}
                                      isInvalid={formState.commentError !== undefined}
                                      value={formState.comment} onChange={handleFormChange}/>
                        <Form.Control.Feedback type={"invalid"}>
                            {formState.commentError?.message}
                        </Form.Control.Feedback>
                    </Form.Group>
                    <Button type={"button"} variant={"secondary"}
                            className={"me-2"}
                            onClick={hideModal}>Cancel</Button>
                    <Button type="submit" variant={"primary"}
                            disabled={props.exchangeRates.size === 0}>{props.buttonText.modal}</Button>
                </Form>
            </Modal.Body>
        </Modal>
        {React.createElement(Button, Object.assign({
            disabled: props.exchangeRates.size === 0,
            children: props.buttonText.main,
            onClick: showModal,
        }, props.buttonProps))}
    </>;
}
