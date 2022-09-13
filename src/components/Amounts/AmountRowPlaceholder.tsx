import React from "react";
import StandardPlaceholder from "../Utils/StandardPlaceholder";

export default function AmountRowPlaceholder(): JSX.Element {
    return <tr>
        <td colSpan={8}><StandardPlaceholder/></td>
    </tr>;
}
