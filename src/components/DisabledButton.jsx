import React from "react";
import PropTypes from "prop-types";

export class DisabledButton extends React.Component {
    constructor(props) {
        super(props);
        this.state = {disabled: false};
    }

    _handleClick = () => {
        this.setState({disabled: true}, () => {
            this.props.onClick(this.props.identifier).catch(error => {
                this.setState(() => throw error);
            }).finally(() => {
                this.setState({disabled: false});
            });
        });
    };

    render() {
        return (<button onClick={this._handleClick} disabled={this.state.disabled}>{this.props.children}</button>);
    }
}

DisabledButton.propTypes = {
    // async function expected!
    onClick: PropTypes.func.isRequired,
    identifier: PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.string,
    ]),
};
