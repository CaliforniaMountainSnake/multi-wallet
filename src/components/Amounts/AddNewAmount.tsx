import React, {ReactNode} from "react";
import {CurrencySelect} from "../Utils/CurrencySelect";
import {Amount, CurrencyInfo, WalletRepository} from "../../repositories/WalletRepository";
import {validate, ValidationErrors, validator} from "../../validation/Validator";
import {Button, Form, Modal} from "react-bootstrap";
import {HasModal, ModalState} from "../interfaces/HasModal";

interface FormData {
    amount: string,
    symbol: string,
    comment: string,
}

type FormErrors = ValidationErrors<FormData>

interface State extends ModalState, FormData, FormErrors {
}

export class AddNewAmount extends React.Component<{
    dbRepository: WalletRepository,
    exchangeRates: Map<string, CurrencyInfo>,
    onChange: () => void,
    className?: string,
}, State> implements HasModal {
    private idPrefix = `${this.constructor.name}_`;
    private ids = {
        amount: `${this.idPrefix}amount`,
        symbol: `${this.idPrefix}symbol`,
        comment: `${this.idPrefix}comment`,
    };

    private initialState: State = {
        isModalShown: false,
        amount: "",
        symbol: this.props.exchangeRates.keys().next().value,
        comment: "",
        amountError: undefined,
        symbolError: undefined,
        commentError: undefined,
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
            amount: validator.amount(this.state.amount),
            symbol: validator.symbol(this.state.symbol, this.props.exchangeRates),
            comment: validator.comment(this.state.comment),
        }, validatedData => {
            (async () => {
                const amount: Amount = Object.assign({}, validatedData, {enabled: true});
                const addedRowKey = await this.props.dbRepository.putAmount(amount);
                this.setState(this.initialState);
                this.props.onChange();
                console.debug("Added amount with key:", addedRowKey);
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
            case this.ids.amount:
                this.setState({amount: value, amountError: undefined});
                break;
            case this.ids.symbol:
                this.setState({symbol: value, symbolError: undefined});
                break;
            case this.ids.comment:
                this.setState({comment: value, commentError: undefined});
                break;
        }
    };

    render(): ReactNode {
        return (
            <React.Fragment>
                <Modal show={this.state.isModalShown}
                       backdrop={"static"} keyboard={false}
                       centered={true}
                       onHide={this.hideModal}>
                    <Modal.Header closeButton>
                        <Modal.Title>Add new amount</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form onSubmit={this.handleFormSubmit}>
                            <Form.Group className={"mb-3"} controlId={this.ids.amount}>
                                <Form.Label>Amount:</Form.Label>
                                <Form.Control type="number"
                                              placeholder="Enter amount"
                                              isInvalid={this.state.amountError !== undefined}
                                              value={this.state.amount} onChange={this.handleFormChange}/>
                                <Form.Control.Feedback type={"invalid"}>
                                    {this.state.amountError?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                            <Form.Group className={"mb-3"} controlId={this.ids.symbol}>
                                <Form.Label>Currency:</Form.Label>
                                <CurrencySelect isInvalid={this.state.symbolError !== undefined}
                                                exchangeRates={this.props.exchangeRates}
                                                value={this.state.symbol} onChange={this.handleFormChange}/>
                                <Form.Control.Feedback type={"invalid"}>
                                    {this.state.symbolError?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                            <Form.Group className={"mb-3"} controlId={this.ids.comment}>
                                <Form.Label>Comment:</Form.Label>
                                <Form.Control type="text"
                                              as={"textarea"}
                                              isInvalid={this.state.commentError !== undefined}
                                              value={this.state.comment} onChange={this.handleFormChange}/>
                                <Form.Control.Feedback type={"invalid"}>
                                    {this.state.commentError?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                            <Button type={"button"} variant={"secondary"}
                                    className={"me-2"}
                                    onClick={this.hideModal}>Cancel</Button>
                            <Button type="submit" variant={"primary"}
                                    disabled={this.props.exchangeRates.size === 0}>Add</Button>
                        </Form>
                    </Modal.Body>
                </Modal>
                <Button variant="primary" className={this.props.className} onClick={this.showModal}>Add amount</Button>
            </React.Fragment>
        );
    }
}
