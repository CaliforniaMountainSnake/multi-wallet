import {ApexOptions} from "apexcharts";
import chartIcon from "bootstrap-icons/icons/bar-chart-fill.svg?raw";
import React, {useEffect, useState} from "react";
import Chart from "react-apexcharts";
import {Button, Modal} from "react-bootstrap";
import {ButtonProps} from "react-bootstrap/Button";
import {formatNumberToHumanReadable} from "../../helpers";
import useThrowAsync from "../../hooks/useThrowAsync";
import {OHLCRepository, PriceCandle, PriceCandlesMap} from "../../repositories/OHLCRepository";
import StandardPlaceholder from "../Utils/StandardPlaceholder";

export type TargetCurrencies = {
    symbol: PriceCandle["symbol"],
    amount: number,
}[]

type ApexTimeSeriesData = {
    x: Date;
    y: number;
}[]

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
            const targetCandles: [PriceCandlesMap, number][] = [];
            for (const targetCurrency of props.targetCurrencies) {
                targetCandles.push([await props.ohlcRepository.getCandles(targetCurrency.symbol, chartDays), targetCurrency.amount]);
            }
            const vsCandles = await props.ohlcRepository.getCandles(props.vsCurrency, chartDays);

            setChartData(calculateRelativePrice(targetCandles, vsCandles));
            console.debug("Chart data were loaded.");
        });

    }, [isModalShown, chartDays]);

    return <>
        <Modal show={isModalShown}
               backdrop="static" keyboard={true}
               centered={true}
               size={"xl"}
               contentClassName={"min-vh-70"}
               onHide={onHideModal}>
            <Modal.Header closeButton>
                <Modal.Title className={"text-uppercase"}>{props.title}</Modal.Title>
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
                                {makeSetChartDaysButton(Number.MAX_VALUE)}
                            </div>
                        </>}
            </Modal.Body>
        </Modal>
        <Button onClick={onShowModal} {...props.buttonProps}>
            <span className={"icon"} dangerouslySetInnerHTML={{__html: chartIcon}}/>
        </Button>
    </>;
}

function calculateRelativePrice(targetCandles: [PriceCandlesMap, number][],
                                vsCandles: PriceCandlesMap): PriceCandle[] {
    const result: PriceCandle[] = [];
    for (const [timestamp, vsCandle] of vsCandles.entries()) {
        const zeroCandle: PriceCandle = {...vsCandle, open: 0, high: 0, low: 0, close: 0};
        const targetPrice = targetCandles.reduce((accumulator, currentValue) => {
            const [candles, amount] = currentValue;
            const candle = candles.get(timestamp);
            if (!candle) {
                return accumulator;
            }

            return {
                summedCandle: {
                    ...candle,
                    open: accumulator.summedCandle.open + (vsCandle.open / candle.open) * amount,
                    high: accumulator.summedCandle.high + (vsCandle.high / candle.high) * amount,
                    low: accumulator.summedCandle.low + (vsCandle.low / candle.low) * amount,
                    close: accumulator.summedCandle.close + (vsCandle.close / candle.close) * amount,
                },
                amountOfCandles: ++accumulator.amountOfCandles,
            };
        }, {
            summedCandle: zeroCandle,
            amountOfCandles: 0,
        });

        if (targetPrice.amountOfCandles < targetCandles.length) {
            // just skip non-existed candles.
            // console.debug("Unable to find all candles for a timestamp:", new Date(timestamp));
            continue;
        }

        result.push(targetPrice.summedCandle);
    }
    return result;
}

function flatPriceCandles(data: PriceCandle[], name: string): ApexAxisChartSeries {
    const items: ApexTimeSeriesData = data.map(candle => ({
        x: candle.timestamp,
        y: (candle.open + candle.high + candle.low + candle.close) / 4,
    }));
    return [{data: items, name: name}];
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
