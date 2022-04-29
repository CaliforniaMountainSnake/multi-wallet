import React, {ReactNode} from "react";

export class NonBreakingSpaceText extends React.Component<{ children: ReactNode }> {
    render(): ReactNode {
        return (
            <span style={{whiteSpace: "nowrap"}}>
                {this.props.children}
            </span>
        );
    }
}
