import React, {ReactNode} from "react";

export class AppNavbar extends React.Component<{
    children: ReactNode,
}> {
    render(): ReactNode {
        return (
            <nav className="navbar navbar-dark bg-primary">
                <div className="container-fluid">
                    <span className="navbar-brand mb-0 h1">Multi-currency Wallet</span>
                    {this.props.children}
                </div>
            </nav>
        );
    }
}
