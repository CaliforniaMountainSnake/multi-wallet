import _ from "lodash";
import React from "react";
import {IndexedDBRepository} from "./IndexedDBRepository";
import {CoingeckoRepository} from "./CoingeckoRepository";

export class AppComponent extends React.Component {
    #dbRepository;
    #coingeckoRepository;

    constructor(props) {
        super(props);
        this.#dbRepository = new IndexedDBRepository();
        this.#coingeckoRepository = new CoingeckoRepository();
    }

    componentDidMount() {
        document.title = "Multi-currency Wallet";
    }

    render() {
        return (
            <React.Fragment>
                <h1>Multi-currency Wallet</h1>
                <div>
                    {_.join(["Hello", "webpack", "and", "React"], " ")}
                </div>
            </React.Fragment>
        );
    }
}
