import React, {ReactNode} from "react";

interface State {
    disabled: boolean;
}

export class DisabledButton extends React.Component<{
    children: ReactNode,
    onClick: () => Promise<void>,
}, State> {
    state: State = {
        disabled: false
    };

    private _handleClick = (): void => {
        this.setState({disabled: true}, () => {
            this.props.onClick().catch(error => {
                this.setState(() => {
                    throw error;
                });
            }).finally(() => {
                this.setState({disabled: false});
            });
        });
    };

    render(): ReactNode {
        return (<button onClick={this._handleClick} disabled={this.state.disabled}>{this.props.children}</button>);
    }
}
