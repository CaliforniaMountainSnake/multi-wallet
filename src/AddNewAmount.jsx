import React from "react";

/**
 * Use a "controlled component" pattern. Set onChange() and onSubmit().
 */
export class AddNewAmount extends React.Component {
    handleClick = e => {

    }

    render() {
        return (
            <div>
                Date of the last exchange rates update:
                <span id="last_update_time">Please, wait...</span>
                <div>
                    <button id="update_exchange_rates" onClick={this.handleClick}>
                        🗘 Update exchange rates
                    </button>
                </div>
            </div>
        )
    }
}
