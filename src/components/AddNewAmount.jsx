import React from "react";

export class AddNewAmount extends React.Component {
    render() {
        return (
            <div>
                <h2>Add a new row</h2>
                <form>
                    <table>
                        <tr>
                            <td><label htmlFor="add_amount">Amount:</label></td>
                            <td><input type="number" id="add_amount" placeholder="Enter amount"/></td>
                        </tr>
                        <tr>
                            <td><label htmlFor="add_currency">Currency:</label></td>
                            <td><select id="add_currency"/></td>
                        </tr>
                        <tr>
                            <td><label htmlFor="add_comment">Comment:</label></td>
                            <td><input type="text" id="add_comment"/></td>
                        </tr>
                        <tr>
                            <td colSpan="2">
                                <button id="add_button">Add</button>
                            </td>
                        </tr>
                    </table>
                </form>
            </div>
        );
    }
}
