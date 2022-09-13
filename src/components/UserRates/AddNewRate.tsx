import React, {useEffect, useState} from "react";
import {Button, Form, Modal} from "react-bootstrap";
import useThrowAsync from "../../hooks/useThrowAsync";
import {DoublyLinkedListRepository, Node} from "../../repositories/DoublyLinkedListRepository";
import {CurrencyInfo, UserRate} from "../../repositories/WalletRepository";
import {RequireStrings, validate, ValidationErrors, validator} from "../../validation/Validator";
import {CurrencySelect} from "../Utils/CurrencySelect";

type FormData = RequireStrings<Omit<UserRate, keyof Node>>

type FormErrors = ValidationErrors<FormData & { symbols: never }>

interface FormState extends FormData, FormErrors {
}

export function AddNewRate(props: {
    rateRepository: DoublyLinkedListRepository<UserRate>,
    exchangeRates: Map<string, CurrencyInfo>,
    onChange: () => void,
    className?: string,
}): JSX.Element {
    const {throwAsync} = useThrowAsync();
    const [isModalShown, setModalShown] = useState<boolean>(false);
    const hideModal = () => setModalShown(false);
    const showModal = () => setModalShown(true);

    const initialFormState: FormState = {
        symbol1: "",
        symbol2: "",
        symbol1Error: undefined,
        symbol2Error: undefined,
    };
    const [formState, setFormState] = useState<FormState>(initialFormState);

    useEffect(() => {
        if (formState.symbol1 === initialFormState.symbol1 && props.exchangeRates.size !== 0) {
            setFormState({
                symbol1: props.exchangeRates.keys().next().value,
                symbol2: props.exchangeRates.keys().next().value,
            });
        }
    }, [props.exchangeRates]);

    const idPrefix = `${AddNewRate.name}_`;
    const ids = {
        symbol1: `${idPrefix}symbol1`,
        symbol2: `${idPrefix}symbol2`,
    };

    const handleFormSubmit = (event: React.FormEvent): void => {
        event.preventDefault();
        validate({
            symbol1: validator.symbol(formState.symbol1, props.exchangeRates),
            symbol2: validator.symbol(formState.symbol2, props.exchangeRates),
            symbols: validator.symbols(formState.symbol1, formState.symbol2, props.exchangeRates),
        }, validatedData => {
            throwAsync(async () => {
                const userRate: UserRate = Object.assign({},
                    props.rateRepository.nullishNode,
                    validatedData.symbols,
                );
                const addedKey = await props.rateRepository.addToEnd(userRate);
                setFormState(initialFormState);
                setModalShown(false);
                props.onChange();
                console.debug("New user exchange rate added", addedKey);
            });
        }, validationErrors => setFormState(prevState => ({
            ...prevState,
            ...validationErrors,
        })));
    };

    const handleFormChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        const value: string = event.target.value;
        switch (event.target.id) {
            case ids.symbol1:
                setFormState(prevState => {
                    return {
                        ...prevState,
                        symbol1: value,
                        symbol1Error: undefined,
                    };
                });
                break;
            case ids.symbol2:
                setFormState(prevState => {
                    return {
                        ...prevState,
                        symbol2: value,
                        symbol2Error: undefined,
                    };
                });
                break;
        }
    };

    return <>
        <Modal show={isModalShown}
               backdrop="static" keyboard={false}
               centered={true}
               onHide={hideModal}>
            <Modal.Header closeButton>
                <Modal.Title>Add favorite exchange rate</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleFormSubmit}>
                    <Form.Group className={"mb-3"} controlId={ids.symbol1}>
                        <Form.Label>First currency:</Form.Label>
                        <CurrencySelect
                            isInvalid={[formState.symbol1Error, formState.symbolsError].some(e => e !== undefined)}
                            exchangeRates={props.exchangeRates}
                            value={formState.symbol1} onChange={handleFormChange}/>
                        <Form.Control.Feedback type={"invalid"}>
                            {formState.symbol1Error?.message}
                            {formState.symbolsError?.message}
                        </Form.Control.Feedback>
                    </Form.Group>
                    <Form.Group className={"mb-3"} controlId={ids.symbol2}>
                        <Form.Label>Second currency:</Form.Label>
                        <CurrencySelect
                            isInvalid={[formState.symbol2Error, formState.symbolsError].some(e => e !== undefined)}
                            exchangeRates={props.exchangeRates}
                            value={formState.symbol2} onChange={handleFormChange}/>
                        <Form.Control.Feedback type={"invalid"}>
                            {formState.symbol2Error?.message}
                            {formState.symbolsError?.message}
                        </Form.Control.Feedback>
                    </Form.Group>
                    <Button type={"button"} variant={"secondary"}
                            className={"me-2"}
                            onClick={hideModal}>Cancel</Button>
                    <Button type={"submit"} variant={"primary"}>Add</Button>
                </Form>
            </Modal.Body>
        </Modal>
        <Button variant="primary" className={props.className}
                disabled={props.exchangeRates.size === 0}
                onClick={showModal}>Add rate</Button>
    </>;
}
