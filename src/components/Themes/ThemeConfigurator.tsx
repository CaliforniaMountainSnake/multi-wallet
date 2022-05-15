import React, {ReactNode} from "react";
import {Button, Form, Modal} from "react-bootstrap";
import {WalletRepository} from "../../repositories/WalletRepository";
import {LazyThemeLoader, ThemeName} from "./InstalledThemes";
import {validate, ValidationErrors, validator} from "../../validation/Validator";
import {DarkModeAware} from "./DarkModeProvider";
import {HasModal, ModalState} from "../interfaces/HasModal";

interface FormData {
    lightTheme: string,
    darkTheme: string,
}

type FormErrors = ValidationErrors<FormData>;

interface Props extends DarkModeAware {
    dbRepository: WalletRepository,
    onChange: () => void,
    installedLightTheme: ThemeName,
    installedDarkTheme: ThemeName,
}

interface State extends ModalState, FormData, FormErrors {
}

export class ThemeConfigurator extends React.Component<Props, State> implements HasModal {
    private idPrefix = `${this.constructor.name}_`;
    private ids = {
        darkTheme: `${this.idPrefix}darkTheme`,
        lightTheme: `${this.idPrefix}lightTheme`
    };

    private initialState: State = {
        isModalShown: false,
        lightTheme: this.props.installedLightTheme,
        darkTheme: this.props.installedDarkTheme,
        lightThemeError: undefined,
        darkThemeError: undefined,
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
            lightTheme: validator.theme(this.state.lightTheme),
            darkTheme: validator.theme(this.state.darkTheme),
        }, validatedData => {
            (async () => {
                await this.props.dbRepository.setConfig({key: "light_theme", value: validatedData.lightTheme});
                await this.props.dbRepository.setConfig({key: "dark_theme", value: validatedData.darkTheme});
                this.setState(this.initialState);
                this.props.onChange();
                console.debug("Themes were set:", validatedData.lightTheme, validatedData.darkTheme);
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
            case this.ids.lightTheme:
                this.setState({lightTheme: value, lightThemeError: undefined});
                break;
            case this.ids.darkTheme:
                this.setState({darkTheme: value, darkThemeError: undefined});
                break;
        }
    };

    private getThemeOptions = (): ReactNode[] => {
        return Object.keys(LazyThemeLoader).map((theme) => {
            return (<option key={theme} value={theme}>{theme}</option>);
        });
    };

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any) {
        if (prevProps.installedLightTheme !== this.props.installedLightTheme
            || prevProps.installedDarkTheme !== this.props.installedDarkTheme) {
            this.setState({
                lightTheme: this.props.installedLightTheme,
                darkTheme: this.props.installedDarkTheme,
            });
        }
    }

    render(): ReactNode {
        return (
            <React.Fragment>
                <Modal show={this.state.isModalShown}
                       backdrop={"static"} keyboard={false}
                       centered={true}
                       onHide={this.hideModal}>
                    <Modal.Header closeButton>
                        <Modal.Title>Set theme</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form onSubmit={this.handleFormSubmit}>
                            <Form.Group className={"mb-3"} controlId={this.ids.lightTheme}>
                                <ThemeLabel isLight={true} isDarkMode={this.props.isDarkMode}/>
                                <Form.Control as={"select"}
                                              isInvalid={this.state.lightThemeError !== undefined}
                                              value={this.state.lightTheme} onChange={this.handleFormChange}>
                                    {this.getThemeOptions()}
                                </Form.Control>
                                <Form.Control.Feedback type={"invalid"}>
                                    {this.state.lightThemeError?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                            <Form.Group className={"mb-3"} controlId={this.ids.darkTheme}>
                                <ThemeLabel isLight={false} isDarkMode={this.props.isDarkMode}/>
                                <Form.Control as={"select"}
                                              isInvalid={this.state.darkThemeError !== undefined}
                                              value={this.state.darkTheme} onChange={this.handleFormChange}>
                                    {this.getThemeOptions()}
                                </Form.Control>
                                <Form.Control.Feedback type={"invalid"}>
                                    {this.state.darkThemeError?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                            <Button type={"button"} variant={"secondary"}
                                    className={"me-2"}
                                    onClick={this.hideModal}>Cancel</Button>
                            <Button type={"submit"} variant={"primary"}>Set theme</Button>
                        </Form>
                    </Modal.Body>
                </Modal>
                <Button variant={"outline-light"} onClick={this.showModal}>Theme</Button>
            </React.Fragment>
        );
    }
}

function ThemeLabel(props: { isLight: boolean } & DarkModeAware): JSX.Element {
    const activeLabel = " (active now)";
    if (props.isLight) {
        return <Form.Label>Light theme{props.isDarkMode ? "" : activeLabel}:</Form.Label>;
    }

    return <Form.Label>Dark theme{props.isDarkMode ? activeLabel : ""}:</Form.Label>;
}
