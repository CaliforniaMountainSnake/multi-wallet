import {ApexOptions} from "apexcharts";
import chartIcon from "bootstrap-icons/icons/bar-chart-fill.svg?raw";
import React, {useEffect, useState} from "react";
import Chart from "react-apexcharts";
import {Button, Modal} from "react-bootstrap";
import useThrowAsync from "../../hooks/useThrowAsync";
import {OHLCRepository, PriceCandle} from "../../repositories/OHLCRepository";
import StandardPlaceholder from "../Utils/StandardPlaceholder";

const chartOptions: ApexOptions = {
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
                return val.toFixed(2);
            }
        }
    }
};

export default function HistoryChart(props: {
    ohlcRepository: OHLCRepository,
    symbol1: PriceCandle["symbol"],
    symbol2: PriceCandle["symbol"],
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
        return <Button variant={"primary"} disabled={chartDays === days} onClick={() => setChartDays(days)}>
            {days === 365 ? "1Y"
                : days === Number.MAX_VALUE ? "Max"
                    : `${days}D`}
        </Button>;
    };

    useEffect(() => {
        if (!isModalShown) {
            return;
        }

        throwAsync(async () => {
            const candles1 = await props.ohlcRepository.getCandles(props.symbol1, chartDays);
            const candles2 = await props.ohlcRepository.getCandles(props.symbol2, chartDays);

            setChartData(calculateRelativePrice(candles1, candles2));
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
                <Modal.Title className={"text-uppercase"}>{props.symbol1}/{props.symbol2}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {chartData
                    ? chartData.length === 0
                        ? <NoDataMessage symbol1={props.symbol1} symbol2={props.symbol2}/>
                        : <Chart type={"area"}
                                 options={chartOptions}
                                 series={flatPriceCandles(chartData)}/>
                    : <StandardPlaceholder/>}

                <div className={"d-flex flex-row justify-content-between"}>
                    {makeSetChartDaysButton(7)}
                    {makeSetChartDaysButton(30)}
                    {makeSetChartDaysButton(90)}
                    {makeSetChartDaysButton(365)}
                    {makeSetChartDaysButton(Number.MAX_VALUE)}
                </div>
            </Modal.Body>
        </Modal>
        <Button variant="secondary" size={"sm"} onClick={onShowModal}>
            <span className={"icon"} dangerouslySetInnerHTML={{__html: chartIcon}}/>
        </Button>
    </>;
}

function calculateRelativePrice(firstCandles: Map<number, PriceCandle>,
                                secondCandles: Map<number, PriceCandle>): PriceCandle[] {
    const result: PriceCandle[] = [];
    for (const [timestamp, firstCandle] of firstCandles.entries()) {
        const secondCandle = secondCandles.get(timestamp);
        if (!secondCandle) {
            // just skip non-existed candles.
            continue;
        }

        result.push({
            type: firstCandle.type,
            timestamp: firstCandle.timestamp,
            symbol: firstCandle.symbol,
            open: secondCandle.open / firstCandle.open,
            high: secondCandle.high / firstCandle.high,
            low: secondCandle.low / firstCandle.low,
            close: secondCandle.close / firstCandle.close,
        });
    }
    return result;
}

function flatPriceCandles(data: PriceCandle[]): ApexAxisChartSeries {
    const items: ApexTimeSeriesData = data.map(candle => ({
        x: candle.timestamp,
        y: (candle.open + candle.high + candle.low + candle.close) / 4,
    }));
    return [{data: items, name: "test_name"}];
}

type ApexTimeSeriesData = {
    x: Date;
    y: number;
}[]

function NoDataMessage(props: {
    symbol1: PriceCandle["symbol"],
    symbol2: PriceCandle["symbol"],
}): JSX.Element {
    return <>
        History data were now found for the <strong>{props.symbol1}/{props.symbol2}</strong> currency pair.
        Please, update the API data.
    </>;
}
