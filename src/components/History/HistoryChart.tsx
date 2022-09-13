import {ApexOptions} from "apexcharts";
import chartIcon from "bootstrap-icons/icons/bar-chart-fill.svg?raw";
import React, {useEffect, useState} from "react";
import Chart from "react-apexcharts";
import {Button, Modal} from "react-bootstrap";
import {ButtonProps} from "react-bootstrap/Button";
import useThrowAsync from "../../hooks/useThrowAsync";
import {OHLCRepository, PriceCandle} from "../../repositories/OHLCRepository";
import StandardPlaceholder from "../Utils/StandardPlaceholder";

export type TargetCurrencies = Map<PriceCandle["symbol"], number>

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
            const targetCandles: [Map<number, PriceCandle>, number][] = [];
            for (const [currency, amount] of props.targetCurrencies.entries()) {
                targetCandles.push([await props.ohlcRepository.getCandles(currency, chartDays), amount]);
            }
            const vsCandles = await props.ohlcRepository.getCandles(props.vsCurrency, chartDays);

            setChartData(calculateRelativePrice(targetCandles, vsCandles));
            console.debug("Chart data were loaded.");
        });

    }, [isModalShown, chartDays]);

    return <>
        <Modal show={isModalShown}
               backdrop="static" keyboard={false}
               centered={true}
               size={"lg"}
               onHide={onHideModal}>
            <Modal.Header closeButton>
                <Modal.Title className={"text-uppercase"}>{props.title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {!chartData || props.targetCurrencies.size === 0 ? <StandardPlaceholder/>
                    : chartData.length === 0 ?
                        <>
                            History data were not found for these currencies.
                            Please, update the API data.
                        </>
                        : <>
                            <Chart type={"area"}
                                   options={getChartOptions(props.vsCurrency)}
                                   series={flatPriceCandles(chartData, getChartSeriesName(props.targetCurrencies))}/>
                            <div className={"d-flex flex-row justify-content-between"}>
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

function calculateRelativePrice(targetCandles: [Map<number, PriceCandle>, number][],
                                vsCandles: Map<number, PriceCandle>): PriceCandle[] {
    const result: PriceCandle[] = [];
    for (const [timestamp, vsCandle] of vsCandles.entries()) {
        const targetPrice: [PriceCandle, number] = targetCandles.reduce((accumulator, currentValue) => {
            const [candles, amount] = currentValue;
            const candle = candles.get(timestamp);
            if (!candle) {
                return accumulator;
            }

            return [{
                ...candle,
                open: accumulator[0].open + (vsCandle.open / candle.open) * amount,
                high: accumulator[0].high + (vsCandle.high / candle.high) * amount,
                low: accumulator[0].low + (vsCandle.low / candle.low) * amount,
                close: accumulator[0].close + (vsCandle.close / candle.close) * amount,
            } as PriceCandle, ++accumulator[1]];
        }, [{...vsCandle, open: 0, high: 0, low: 0, close: 0} as PriceCandle, 0]);

        if (targetPrice[1] < targetCandles.length) {
            // just skip non-existed candles.
            // console.debug("Unable to find all candles for a timestamp:", new Date(timestamp));
            continue;
        }

        result.push(targetPrice[0]);
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
    return targetCurrencies.size === 1 ? [...targetCurrencies.keys()][0] : "amount";
}

const getChartOptions = (vsCurrency: PriceCandle["symbol"]): ApexOptions => ({
    chart: {
        type: "area",
        stacked: false,
        // height: 350,
        zoom: {
            // type: "x",
            enabled: true,
            autoScaleYaxis: true
        },
        toolbar: {
            autoSelected: "zoom"
        }
    },
    dataLabels: {
        enabled: false
    },
    markers: {
        size: 0,
    },
    title: {
        text: "Stock Price Movement",
        align: "left"
    },
    yaxis: {
        labels: {
            formatter(val: number): string | string[] {
                return val.toFixed(2);
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
