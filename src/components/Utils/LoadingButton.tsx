import React, {ReactNode, useEffect, useState} from "react";
import {Button, ButtonProps} from "react-bootstrap";
import useThrowAsync from "../../hooks/useThrowAsync";

export type LoadingButtonClickHandler<T> = (payload: T, feedback?: (progress: string) => void) => Promise<void>

export function LoadingButton<T>(props: {
    children: ReactNode,
    payload: T,
    onClick: LoadingButtonClickHandler<T>,
    buttonProps: Omit<ButtonProps, "onClick" | "children">
}): JSX.Element {
    const {throwAsync} = useThrowAsync();
    const [isLoading, setLoading] = useState<boolean>(false);
    const [progress, setProgress] = useState<string | undefined>(undefined);

    const handleClick = (): void => setLoading(true);

    useEffect(() => {
        if (isLoading) {
            throwAsync(async () => props.onClick(props.payload, (progress: string) => {
                setProgress(progress);
            })).finally(() => {
                setLoading(false);
                setProgress(undefined);
            });
        }
    }, [isLoading]);

    const systemProps: ButtonProps = {
        children: progress ? progress : props.children,
        onClick: handleClick,
        disabled: props.buttonProps.disabled || isLoading,
    };
    return React.createElement(Button, {...props.buttonProps, ...systemProps});
}
