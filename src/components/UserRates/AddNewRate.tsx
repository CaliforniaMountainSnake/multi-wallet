import React, {ReactNode} from "react";
import {CurrencyInfo, UserRate, WalletRepository} from "../../repositories/WalletRepository";
import {CurrencySelect} from "../Utils/CurrencySelect";
import {Button, Form, Modal} from "react-bootstrap";
import {RequireStrings, validate, ValidationErrors, validator} from "../../validation/Validator";
import {HasModal, ModalState} from "../interfaces/HasModal";

type FormData = RequireStrings<UserRate>

type FormErrors = ValidationErrors<FormData & { symbols: never }>

interface State extends ModalState, FormData, FormErrors {
}

export class AddNewRate extends React.Component<{
    dbRepository: WalletRepository,
    exchangeRates: Map<string, CurrencyInfo>,
    onChange: () => void,
    className?: string,
}, State> implements HasModal {
    private idPrefix = `${this.constructor.name}_`;
    private ids = {
        symbol1: `${this.idPrefix}symbol1`,
        symbol2: `${this.idPrefix}symbol2`
    };

    private initialState: State = {
        isModalShown: false,
        symbol1: this.props.exchangeRates.keys().next().value,
        symbol2: this.props.exchangeRates.keys().next().value,
        symbol1Error: undefined,
        symbol2Error: undefined,
    };
    state: State = this.initialState;

    hideModal = () => {
        this.setState({isModalShown: false});
    };

    showModal = () => {
        this.setState({isModalShown: true});
    };

    private handleFormSubmit = (event: React.FormEvent): void => {
        event.preventDefault();
        validate({
            symbol1: validator.symbol(this.state.symbol1, this.props.exchangeRates),
            symbol2: validator.symbol(this.state.symbol2, this.props.exchangeRates),
            symbols: validator.symbols(this.state.symbol1, this.state.symbol2, this.props.exchangeRates),
        }, validatedData => {
            (async () => {
                const addedKey = await this.props.dbRepository.addUserRate(validatedData);
                this.setState(this.initialState);
                this.props.onChange();
                console.debug("New user exchange rate added", addedKey);
            })().catch(error => {
                this.setState(() => {
                    throw  error;
                });
            });
        }, validationErrors => this.setState(validationErrors));
    };

    private handleFormChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        const value: string = event.target.value;
        switch (event.target.id) {
            case this.ids.symbol1:
                this.setState({symbol1: value, symbol1Error: undefined});
                break;
            case this.ids.symbol2:
                this.setState({symbol2: value, symbol2Error: undefined});
                break;
        }
    };

    render(): ReactNode {
        return (
            <React.Fragment>
                <Modal show={this.state.isModalShown}
                       backdrop="static" keyboard={false}
                       centered={true}
                       onHide={this.hideModal}>
                    <Modal.Header closeButton>
                        <Modal.Title>Add favorite exchange rate</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form onSubmit={this.handleFormSubmit}>
                            <Form.Group className={"mb-3"} controlId={this.ids.symbol1}>
                                <Form.Label>First currency:</Form.Label>
                                <CurrencySelect
                                    isInvalid={[this.state.symbol1Error, this.state.symbolsError].some(e => e !== undefined)}
                                    exchangeRates={this.props.exchangeRates}
                                    value={this.state.symbol1} onChange={this.handleFormChange}/>
                                <Form.Control.Feedback type={"invalid"}>
                                    {this.state.symbol1Error?.message}
                                    {this.state.symbolsError?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                            <Form.Group className={"mb-3"} controlId={this.ids.symbol2}>
                                <Form.Label>Second currency:</Form.Label>
                                <CurrencySelect
                                    isInvalid={[this.state.symbol2Error, this.state.symbolsError].some(e => e !== undefined)}
                                    exchangeRates={this.props.exchangeRates}
                                    value={this.state.symbol2} onChange={this.handleFormChange}/>
                                <Form.Control.Feedback type={"invalid"}>
                                    {this.state.symbol2Error?.message}
                                    {this.state.symbolsError?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                            <Button type={"button"} variant={"secondary"}
                                    className={"me-2"}
                                    onClick={this.hideModal}>Cancel</Button>
                            <Button type={"submit"} variant={"primary"}>Add</Button>
                        </Form>
                    </Modal.Body>
                </Modal>
                <Button variant="primary" className={this.props.className} onClick={this.showModal}>Add rate</Button>
            </React.Fragment>
        );
    }
}
