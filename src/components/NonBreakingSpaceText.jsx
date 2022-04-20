import React from "react";

export class NonBreakingSpaceText extends React.Component {
    render() {
        return (
            <span style={{whiteSpace: "nowrap"}}>
                {this.props.children}
            </span>
        );
    }
}
