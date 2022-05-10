import React, {ReactNode} from "react";
import {Button, ButtonProps} from "react-bootstrap";
import {ButtonVariant} from "react-bootstrap/types";

interface State {
    loading: boolean;
}

export class LoadingButton<T> extends React.Component<{
    children: ReactNode,
    onClick: (payload?: T) => Promise<void>,
    variant: ButtonVariant,
    size?: ButtonProps["size"]
    payload?: T,
    className?: string,
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
        return (<Button variant={this.props.variant} size={this.props.size}
                        className={this.props.className} disabled={this.state.loading}
                        onClick={this._handleClick}>{this.props.children}</Button>);
    }
}
