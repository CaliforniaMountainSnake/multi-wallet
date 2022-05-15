import React, {ReactNode} from "react";
import {Button, ButtonProps} from "react-bootstrap";

interface State {
    loading: boolean;
}

export class LoadingButton<T> extends React.Component<{
    children: ReactNode,
    onClick: (payload?: T) => Promise<void>,
    buttonProps: Omit<ButtonProps, "onClick" | "children" | "disabled">
    payload?: T,
}, State> {
    state: State = {
        loading: false
    };

    private _handleClick = (): void => {
        this.setState({loading: true}, () => {
            this.props.onClick(this.props.payload).catch(error => {
                this.setState(() => {
                    throw error;
                });
            }).finally(() => {
                this.setState({loading: false});
            });
        });
    };

    render(): ReactNode {
        const systemProps: ButtonProps = {
            children: this.props.children,
            onClick: this._handleClick,
            disabled: this.state.loading,
        };
        return React.createElement(Button, Object.assign(systemProps, this.props.buttonProps));
    }
}
