import {ApexOptions} from "apexcharts";
import chartIcon from "bootstrap-icons/icons/bar-chart-fill.svg?raw";
import React, {useEffect, useState} from "react";
import Chart from "react-apexcharts";
import {Badge, Button, Modal} from "react-bootstrap";
import {ButtonProps} from "react-bootstrap/Button";
import {formatNumberToHumanReadable} from "../../helpers";
import useThrowAsync from "../../hooks/useThrowAsync";
import {OHLCRepository, PriceCandle, TimestampToCandleMap} from "../../repositories/OHLCRepository";
import StandardPlaceholder from "../Utils/StandardPlaceholder";

export type TargetCurrencies = {
    symbol: PriceCandle["symbol"],
    amount: number,
}[]

interface ReducedCandle {
    candle: PriceCandle,
    amountOfCandles: number,
}

interface AmountAndCandles {
    amount: number,
    candles: TimestampToCandleMap,
}

interface ApexTimeSeriesPoint {
    x: Date,
    y: number,
}

export default function HistoryChart(props: {
    ohlcRepository: OHLCRepository,
    vsCurrency: PriceCandle["symbol"],
    targetCurrencies: TargetCurrencies,
    title: string,
    buttonProps?: Omit<ButtonProps, "onClick" | "children">
}): JSX.Element {
    const initialChartDays: number = 7;
    const {throwAsync} = useThrowAsync();
    const [isModalShown, setModalShown] = useState<boolean>(false);
    const [chartDays, setChartDays] = useState<number>(initialChartDays);
    const [chartData, setChartData] = useState<PriceCandle[] | undefined>(undefined);

    const onShowModal = () => setModalShown(true);
    const onHideModal = () => {
        setModalShown(false);
        setChartDays(initialChartDays);
        setChartData(undefined);
        console.debug("Chart data were flushed.");
    };

    const makeSetChartDaysButton = (days: number): JSX.Element => {
        return <Button variant={"primary"} size={"sm"}
                       disabled={chartDays === days} onClick={() => setChartDays(days)}>
            {days === Number.MAX_VALUE ? "Max"
                : days % 365 === 0 ? `${days / 365}Y`
                    : days % 30 === 0 ? `${days / 30}M`
                        : `${days}D`}
        </Button>;
    };

    useEffect(() => {
        if (!isModalShown) {
            return;
        }

        throwAsync(async () => {
            const targetCandles: AmountAndCandles[] = [];
            for (const targetCurrency of props.targetCurrencies) {
                targetCandles.push({
                    amount: targetCurrency.amount,
                    candles: await props.ohlcRepository.getCandles(targetCurrency.symbol, chartDays),
                });
            }
            const vsCandles = await props.ohlcRepository.getCandles(props.vsCurrency, chartDays);

            setChartData(calculateRelativePrice(targetCandles, vsCandles));
            console.debug("Chart data were loaded.");
        });

    }, [isModalShown, chartDays]);

    return <>
        <Modal show={isModalShown}
               backdrop={true} keyboard={true}
               centered={true}
               size={"xl"}
               contentClassName={"min-vh-70"}
               onHide={onHideModal}>
            <Modal.Header closeButton>
                <Modal.Title className={"text-uppercase"}>
                    {chartData && chartData.length > 0 && <PriceChangeBadge candles={chartData}/>} {props.title}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className={"p-0 h-100"}>
                {!chartData ? <StandardPlaceholder/>
                    : chartData.length === 0 ?
                        <div className={"p-3"}>
                            History data were not found for these currencies.
                            Please, update the API data.
                        </div>
                        : <>
                            <Chart type={"area"}
                                   height={"100%"}
                                   options={getChartOptions(props.vsCurrency)}
                                   series={flatPriceCandles(chartData, getChartSeriesName(props.targetCurrencies))}/>
                            <div className={"d-flex flex-row justify-content-between p-3"}>
                                {makeSetChartDaysButton(initialChartDays)}
                                {makeSetChartDaysButton(30)}
                                {makeSetChartDaysButton(90)}
                                {makeSetChartDaysButton(180)}
                                {makeSetChartDaysButton(365)}
                                {/*{makeSetChartDaysButton(Number.MAX_VALUE)}*/}
                            </div>
                        </>}
            </Modal.Body>
        </Modal>
        <Button onClick={onShowModal} {...props.buttonProps}>
            <span className={"icon"} dangerouslySetInnerHTML={{__html: chartIcon}}/>
        </Button>
    </>;
}

function PriceChangeBadge(props: { candles: PriceCandle[] }): JSX.Element {
    const priceChange = getPriceChange(props.candles);
    return (
        <Badge bg={priceChange >= 0 ? "success" : "danger"}>
            {priceChange >= 0 && "+"}{priceChange.toFixed(2)}%
        </Badge>
    );
}

function calculateRelativePrice(targetCandles: AmountAndCandles[], vsCandles: TimestampToCandleMap): PriceCandle[] {
    const result: PriceCandle[] = [];
    for (const [timestamp, vsCandle] of vsCandles.entries()) {
        const reducedCandle: ReducedCandle = reduceCandles(timestamp, vsCandle, targetCandles);
        if (reducedCandle.amountOfCandles < targetCandles.length) {
            // just skip non-existed candles.
            // console.debug("Unable to find all candles for a timestamp:", new Date(timestamp));
            continue;
        }

        result.push(reducedCandle.candle);
    }
    return result;
}

/**
 * Calculate a new candle price relative to the vsCandle. And sum these candles then.
 *
 * @param timestamp Unix timestamp.
 * @param vsCandle A candle in which currency the total candle will be calculated.
 * @param targetCandles
 */
function reduceCandles(timestamp: number, vsCandle: PriceCandle, targetCandles: AmountAndCandles[]): ReducedCandle {
    const zeroCandle: ReducedCandle = {
        amountOfCandles: 0,
        candle: {...vsCandle, open: 0, high: 0, low: 0, close: 0},
    };
    return targetCandles.reduce((accumulator: ReducedCandle, currentValue) => {
        const candle = currentValue.candles.get(timestamp);
        if (!candle) {
            return accumulator;
        }

        return {
            candle: {
                ...candle,
                open: accumulator.candle.open + (vsCandle.open / candle.open) * currentValue.amount,
                high: accumulator.candle.high + (vsCandle.high / candle.high) * currentValue.amount,
                low: accumulator.candle.low + (vsCandle.low / candle.low) * currentValue.amount,
                close: accumulator.candle.close + (vsCandle.close / candle.close) * currentValue.amount,
            },
            amountOfCandles: ++accumulator.amountOfCandles,
        };
    }, zeroCandle);
}

function getPriceChange(candles: PriceCandle[]): number {
    if (candles.length < 2) {
        return 0;
    }

    // Candles are reverse-ordered!
    const lastPrice = flatCandle(candles[0]);
    const firstPrice = flatCandle(candles[candles.length - 1]);
    return ((lastPrice / firstPrice) - 1) * 100;
}

function flatPriceCandles(data: PriceCandle[], name: string): ApexAxisChartSeries {
    const items: ApexTimeSeriesPoint[] = data.map(candle => ({
        x: candle.timestamp,
        y: flatCandle(candle),
    }));
    return [{data: items, name: name}];
}

function flatCandle(candle: PriceCandle): number {
    return (candle.open + candle.high + candle.low + candle.close) / 4;
}

function getChartSeriesName(targetCurrencies: TargetCurrencies): string {
    return targetCurrencies.length === 1 ? targetCurrencies[0].symbol : "amount";
}

const getChartOptions = (vsCurrency: PriceCandle["symbol"]): ApexOptions => ({
    chart: {
        type: "area",
        stacked: false,
        // height: "100%",
        zoom: {
            // type: "x",
            enabled: true,
            autoScaleYaxis: true
        },
        toolbar: {
            autoSelected: "zoom"
        }
    },
    grid: {
        padding: {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
        }
    },
    dataLabels: {
        enabled: false
    },
    markers: {
        size: 0,
    },
    yaxis: {
        labels: {
            formatter(val: number): string | string[] {
                return formatNumberToHumanReadable(val);
            }
        },
    },
    xaxis: {
        type: "datetime",
    },
    tooltip: {
        enabled: true,
        shared: false,
        x: {
            formatter(val: number): string {
                return (new Date(val)).toLocaleString();
            }
        },
        y: {
            formatter(val: number): string {
                return val.toFixed(2) + ` ${vsCurrency}`;
            }
        }
    }
});
